import test from 'node:test';
import assert from 'node:assert/strict';
import {createAddon} from '../src/addon.mjs';
import {cpsLabels} from '../src/i18n.mjs';
test('menu switches English and Chinese without changing project settings',()=>{
  let locale='en-US',config={};
  const scope={get:()=>null},group={projectId:'p',projectKind:'local',threadKeys:[]};
  const addon=createAddon({locale:()=>locale,account:()=> 'a',read:()=>config,write:(_s,key,p)=>config={...config,[key]:p},report:e=>{throw e;},thread:()=>null});
  let menu=addon.menu(scope,group,[])[0];
  assert.equal(menu.message.defaultMessage,'Sort chats by');
  menu.submenu.find(x=>x.id==='cps-name').onSelect();
  const saved=JSON.stringify(config);
  locale='zh-CN';menu=addon.menu(scope,group,[])[0];
  assert.equal(menu.message.defaultMessage,'排序方式');
  assert.equal(menu.submenu.find(x=>x.id==='cps-name').checked,true);
  assert.equal(JSON.stringify(config),saved);
  locale='fr-FR';assert.equal(addon.menu(scope,group,[])[0].message.defaultMessage,'Sort chats by');
});
test('manual editor translation has accessible action labels in both languages',()=>{
  assert.equal(cpsLabels('en').heading,'Arrange chats manually');
  assert.equal(cpsLabels('en').up,'Move up');
  assert.equal(cpsLabels('zh-TW').save,'保存');
  assert.deepEqual(Object.keys(cpsLabels('en')),Object.keys(cpsLabels('zh')));
});
