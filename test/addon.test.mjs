import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createAddon } from '../src/addon.mjs';
import { buildPayload, replaceExactlyOnce, patchRenderer, sha256 } from '../src/patch.mjs';
import { interceptResponse } from '../src/intercept.mjs';
function setup(){
  let config={};const errors=[];
  const data={a:{title:'10-任务',createdAt:1000,updatedAt:3000},b:{title:'02-任务',createdAt:2000,updatedAt:1000}};
  const scope={get:()=>null};let editor;
  const host={account:()=> 'account',read:()=>config,write:(_s,k,p)=>{config={...config,[k]:p};},thread:(_g,k)=>data[k],report:e=>errors.push(e),arrange:(rows,save)=>{editor={rows,save};}};
  return {addon:createAddon(host),scope,host,errors,data,get editor(){return editor;}};
}
test('native submenu selection affects only selected project and reset restores original',()=>{
  const {addon,scope}=setup(), a={projectId:'one',projectKind:'local',threadKeys:['a','b']},b={...a,projectId:'two'};
  const original=[{id:'pin'},{id:'edit'}];
  const menu=addon.menu(scope,a,original);menu[1].submenu.find(x=>x.id==='cps-name').onSelect();
  assert.deepEqual(addon.sortGroups(scope.get,[a,b]).map(g=>g.threadKeys),[['b','a'],['a','b']]);
  assert.deepEqual(original,[{id:'pin'},{id:'edit'}]);
  addon.menu(scope,a,original)[1].submenu.find(x=>x.id==='cps-reset').onSelect();
  assert.equal(addon.sortGroups(scope.get,[a])[0],a);
});
test('manual captures actual native order and editor saves rearrangement',()=>{
  const t=setup(),g={projectId:'one',projectKind:'local',threadKeys:['b','a']};
  t.addon.menu(t.scope,g,[])[0].submenu.find(x=>x.id==='cps-manual').onSelect();
  t.data.a.updatedAt=99999;
  assert.deepEqual(t.addon.sortGroups(t.scope.get,[{...g,threadKeys:['a','b']}])[0].threadKeys,['b','a']);
  t.addon.menu(t.scope,g,[])[0].submenu.find(x=>x.id==='cps-arrange').onSelect();t.editor.save(['a','b']);
  assert.deepEqual(t.addon.sortGroups(t.scope.get,[g])[0].threadKeys,['a','b']);
});
test('unknown metadata returns original group and reports error',()=>{
  const t=setup(),g={projectId:'one',projectKind:'local',threadKeys:['a','b']};
  t.addon.menu(t.scope,g,[])[0].submenu.find(x=>x.id==='cps-name').onSelect();
  t.host.thread=()=>{throw Error('unknown');};
  assert.equal(t.addon.sortGroups(t.scope.get,[g])[0],g);assert.equal(t.errors.length,1);
});
test('no account prevents overrides',()=>{const t=setup();t.host.account=()=>null;assert.deepEqual(t.addon.menu(t.scope,{projectId:'p',threadKeys:[]},[]),[]);});
test('manual editor refuses deleted project and changed membership',()=>{
  const t=setup(),g={projectId:'one',projectKind:'local',threadKeys:['a','b']};
  t.addon.menu(t.scope,g,[])[0].submenu.find(x=>x.id==='cps-arrange').onSelect();
  t.host.currentGroup=()=>null;
  assert.throws(()=>t.editor.save(['b','a']),/no longer exists/);
  t.host.currentGroup=()=>({...g,threadKeys:['a']});
  assert.throws(()=>t.editor.save(['b','a']),/every visible thread/);
});
test('pinned or unsupported project does not get an actionable addon menu',()=>{
  const t=setup();t.host.supportsGroup=()=>false;const original=[{id:'native'}];
  assert.equal(t.addon.menu(t.scope,{projectId:'p',threadKeys:[]},original),original);
});
test('payload parses and exposes lazy adapter without needing host on startup',()=>{
  const context={};vm.runInNewContext(buildPayload(),context);assert.equal(typeof context.__cpsGet,'function');
});
test('fingerprint, absent anchor and ambiguous anchor fail closed',()=>{
  assert.throws(()=>patchRenderer('other',{sha256:sha256('expected')}),/fingerprint/);
  assert.throws(()=>replaceExactlyOnce('a a','a','b'),/ambiguous/);
  assert.throws(()=>replaceExactlyOnce('x','a','b'),/absent/);
  assert.equal(replaceExactlyOnce('abc','b','X'),'aXc');
});
test('CDP intercept patches only exact fingerprint, strips encoding, passes unknown response through',async()=>{
  const source='let demo=1;',profile={asset:'app.js',sha256:sha256(source),replacements:[],appVersion:'fixture'};
  const calls=[],log=[];const cdp={send:async(method,params)=>{calls.push({method,params});if(method==='Fetch.getResponseBody')return{body:source,base64Encoded:false};}};
  await interceptResponse(cdp,{requestId:'1',request:{url:'http://127.0.0.1/app.js'},responseStatusCode:200,responseHeaders:[{name:'Content-Encoding',value:'gzip'},{name:'Content-Type',value:'text/javascript'}]},profile,x=>log.push(x));
  const applied=calls.find(c=>c.method==='Fetch.fulfillRequest');assert.ok(applied);assert.equal(applied.params.responseHeaders.length,1);assert.equal(log[0].status,'renderer-patched');
  calls.length=0;
  await interceptResponse(cdp,{requestId:'2',request:{url:'http://127.0.0.1/app.js'},responseStatusCode:200},{...profile,sha256:'no'},x=>log.push(x));
  assert.ok(calls.some(c=>c.method==='Fetch.continueRequest'));assert.ok(!calls.some(c=>c.method==='Fetch.fulfillRequest'));
});
