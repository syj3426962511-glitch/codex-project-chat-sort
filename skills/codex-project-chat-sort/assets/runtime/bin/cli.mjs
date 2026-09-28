#!/usr/bin/env node
import fs from 'node:fs';
import { readAsarFile } from '../src/asar.mjs';
import { sha256, patchRenderer } from '../src/patch.mjs';
import { CDP } from '../src/cdp.mjs';
import { interceptResponse } from '../src/intercept.mjs';
const args=process.argv.slice(2), command=args.shift();
const value=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const profile=JSON.parse(fs.readFileSync(new URL('../profiles/26.924.22138.json',import.meta.url)));
try {
  if(command==='doctor'){
    const archive=value('--asar');if(!archive)throw Error('Usage: doctor --asar PATH');
    const source=readAsarFile(archive,profile.entry).toString('utf8');
    patchRenderer(source,profile);
    console.log(JSON.stringify({compatibleSource:true,appVersion:profile.appVersion,sha256:sha256(source),liveCompatibility:'not-established-by-this-check'},null,2));
  } else if(command==='list'||command==='attach'){
    const port=Number(value('--port')??9333);
    if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid local port');
    const response=await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(5000),redirect:'error'});
    if(!response.ok)throw Error('Debug endpoint unavailable');
    const targets=await response.json();
    if(command==='list') console.log(JSON.stringify(targets.filter(t=>t.type==='page').map(t=>({id:t.id,title:t.title,url:t.url})),null,2));
    else {
      const target=targets.find(t=>t.id===value('--target')&&t.type==='page');
      if(!target)throw Error('Choose an exact page ID from list --port PORT.');
      const cdp=await CDP.connect(target.webSocketDebuggerUrl);
      const once=args.includes('--once');
      let resolveResult,rejectResult,settled=false;
      const firstResult=once?new Promise((resolve,reject)=>{resolveResult=resolve;rejectResult=reject;}):null;
      const settle=(error)=>{
        if(!once||settled)return;
        settled=true;
        error?rejectResult(error):resolveResult();
      };
      cdp.on('Fetch.requestPaused',e=>{
        let result;
        interceptResponse(cdp,e,profile,item=>{result=item;console.log(JSON.stringify(item));})
          .then(()=>{
            if(result?.status==='renderer-patched')settle();
            else if(result?.status==='not-applied')settle(Error(result.reason));
          })
          .catch(error=>{console.error(error.message);settle(error);});
      });
      cdp.on('disconnected',()=>{
        console.log('Debugger disconnected.');
        if(once)settle(Error('Debugger disconnected before the renderer was patched.'));
      });
      await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
      await cdp.send('Fetch.enable',{patterns:[{urlPattern:`*${profile.asset}*`,resourceType:'Script',requestStage:'Response'}]});
      console.log('Waiting for the supported renderer script. No app files are modified.');
      if(args.includes('--reload'))await cdp.send('Page.reload',{ignoreCache:true});
      const stop=async()=>{
        if(cdp.socket.readyState!==WebSocket.OPEN)return;
        try{await cdp.send('Fetch.disable');}catch{}
        try{await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});}catch{}
        cdp.close();
      };
      process.once('SIGINT',stop);process.once('SIGTERM',stop);
      if(once){
        const timeout=setTimeout(()=>settle(Error('Timed out waiting for the supported renderer script.')),45000);
        try{await firstResult;}finally{clearTimeout(timeout);await stop();}
      }
    }
  } else {
    console.log('Experimental Codex project chat sort\n  doctor --asar PATH\n  list --port 9333\n  attach --port 9333 --target ID [--reload] [--once]\nAttach requires an explicitly debug-enabled Codex instance. --reload reloads that page; --once exits after patching.');
  }
} catch(error) {console.error(error.message);process.exitCode=1;}
