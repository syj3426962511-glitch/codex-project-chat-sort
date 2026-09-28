import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const quoteShell=s=>"'"+String(s).replaceAll("'","'\\''")+"'";
export function bundlePaths(app,executable){
  if(!executable||/[\\/\r\n]/.test(executable)||['.','..'].includes(executable))throw Error('Invalid CFBundleExecutable.');
  return {app:path.resolve(app),exe:path.join(app,'Contents','MacOS',executable),asar:path.join(app,'Contents','Resources','app.asar')};
}
export function launcherText(node,script,root){
  return `#!/bin/bash\n${quoteShell(node)} ${quoteShell(script)} launch --root ${quoteShell(root)}\nresult=$?\nif [ "$result" -ne 0 ]; then read -r -p "Press Enter to close."; fi\nexit "$result"\n`;
}
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const run=(file,args)=>execFileSync(file,args,{encoding:'utf8',timeout:60000});
const here=path.dirname(fileURLToPath(import.meta.url));
const skill=path.dirname(here);
function findApp(explicit){
  const candidates=explicit?[explicit]:['/Applications/Codex.app',path.join(os.homedir(),'Applications/Codex.app')];
  const found=candidates.filter(p=>fs.existsSync(path.join(p,'Contents/Info.plist')));
  if(found.length!==1)throw Error('Select one Codex .app using --app /path/to/Codex.app.');
  const name=run('/usr/libexec/PlistBuddy',['-c','Print :CFBundleExecutable',path.join(found[0],'Contents/Info.plist')]).trim();
  const bundle=bundlePaths(found[0],name);
  if(!fs.existsSync(bundle.exe)||!fs.existsSync(bundle.asar))throw Error('Expected Electron executable and Contents/Resources/app.asar were not found.');
  return bundle;
}
function doctor(runtime,bundle){
  try{
    const result=JSON.parse(run(process.execPath,[path.join(runtime,'bin/cli.mjs'),'doctor','--asar',bundle.asar]));
    if(result.compatibleSource!==true)throw Error('Unsupported renderer');
    return result;
  }catch{throw Error('This Mac renderer does not match the bundled adapter. No launcher or app changes were made. A Mac-specific renderer adapter must be validated before injection.');}
}
export function restoreLauncher(root){
  const state=JSON.parse(fs.readFileSync(path.join(root,'config.json'),'utf8'));
  if(!fs.existsSync(state.launcher))return;
  if(hash(state.launcher)!==state.launcherSha256)throw Error('Desktop launcher changed; inspect it before removal.');
  fs.unlinkSync(state.launcher);
}
async function main(){
  if(process.platform!=='darwin')throw Error('This entry point is for macOS only.');
  if(Number(process.versions.node.split('.')[0])<22)throw Error('Node.js 22+ is required.');
  const [command,...args]=process.argv.slice(2);
  const value=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
  const root=path.resolve(value('--root')??path.join(os.homedir(),'Library/Application Support/CodexProjectChatSort'));
  if(command==='uninstall'){
    restoreLauncher(root);
    console.log('Sorting desktop launcher removed. Original Codex app and retained runtime files are unchanged.');return;
  }
  if(command==='install'||command==='check'){
    const bundle=findApp(value('--app'));
    const runtime=path.join(skill,'assets/runtime');
    const compatibility=doctor(runtime,bundle);
    if(command==='check'){console.log(JSON.stringify({bundle,compatibility,changed:false},null,2));return;}
    const launcher=path.join(os.homedir(),'Desktop/Codex Sorting.command');
    if(fs.existsSync(root)||fs.existsSync(launcher))throw Error('Installation or desktop launcher already exists. Inspect it or choose another --root; nothing was overwritten.');
    fs.mkdirSync(root,{recursive:true});
    fs.cpSync(runtime,path.join(root,'runtime'),{recursive:true});
    fs.copyFileSync(fileURLToPath(import.meta.url),path.join(root,'mac.mjs'));
    const content=launcherText(process.execPath,path.join(root,'mac.mjs'),root);
    const state={app:bundle.app,launcher,port:9438,launcherSha256:createHash('sha256').update(content).digest('hex')};
    fs.writeFileSync(path.join(root,'config.json'),JSON.stringify(state,null,2));
    fs.writeFileSync(launcher,content,{flag:'wx',mode:0o755});
    console.log('Installed Codex Sorting.command on the desktop. Save work and quit Codex, then double-click that launcher.');return;
  }
  if(command!=='launch')throw Error('Usage: mac.mjs install|check|launch|uninstall [--app PATH] [--root PATH]');
  const state=JSON.parse(fs.readFileSync(path.join(root,'config.json'),'utf8'));
  const bundle=findApp(state.app),runtime=path.join(root,'runtime');
  doctor(runtime,bundle);
  const port=state.port;
  if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid configured port.');
  await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',()=>reject(Error('Debug port is occupied. Quit Codex or choose another free port.')));server.listen(port,'127.0.0.1',()=>server.close(resolve));});
  const child=spawn(bundle.exe,['--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${port}`,'--no-first-run'],{detached:true,stdio:'ignore'});
  await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});
  child.unref();
  const save=(status,detail)=>fs.writeFileSync(path.join(root,'state.json'),JSON.stringify({time:new Date().toISOString(),status,processId:child.pid,detail},null,2));
  try{
    let target;
    for(let i=0;i<40;i++){
      try{
        const socket=run('/usr/sbin/lsof',['-nP',`-iTCP:${port}`,'-sTCP:LISTEN','-Fpn']);
        const pids=socket.split('\n').filter(l=>l.startsWith('p')).map(l=>Number(l.slice(1)));
        const addresses=socket.split('\n').filter(l=>l.startsWith('n')).map(l=>l.slice(1));
        if(pids.length!==1||pids[0]!==child.pid||addresses.length!==1||addresses[0]!==`127.0.0.1:${port}`)throw Error('Endpoint ownership or loopback binding mismatch.');
        const targets=JSON.parse(run(process.execPath,[path.join(runtime,'bin/cli.mjs'),'list','--port',String(port)]));
        target=targets.find(t=>t.url==='app://-/index.html');
        if(target)break;
      }catch(error){if(error.message.includes('mismatch'))throw error;}
      await new Promise(r=>setTimeout(r,500));
    }
    if(!target)throw Error('Main renderer was not found. Quit the existing Codex app completely and retry.');
    const result=run(process.execPath,[path.join(runtime,'bin/cli.mjs'),'attach','--port',String(port),'--target',target.id,'--reload','--once']);
    if(!result.includes('renderer-patched'))throw Error('No successful patch result.');
    save('complete',result);console.log('Renderer patched. Verify Sort chats by in the project menu.');
  }catch(error){save('failed',error.message);throw error;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
