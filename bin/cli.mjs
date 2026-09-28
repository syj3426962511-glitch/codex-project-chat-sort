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
      cdp.on('Fetch.requestPaused',e=>interceptResponse(cdp,e,profile,item=>console.log(JSON.stringify(item))).catch(e=>console.error(e.message)));
      cdp.on('disconnected',()=>{console.log('Debugger disconnected.');process.exitCode=0;});
      await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
      await cdp.send('Fetch.enable',{patterns:[{urlPattern:`*${profile.asset}*`,resourceType:'Script',requestStage:'Response'}]});
      console.log('Waiting for the supported renderer script. No app files are modified.');
      if(args.includes('--reload'))await cdp.send('Page.reload',{ignoreCache:true});
      const stop=async()=>{try{await cdp.send('Fetch.disable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});}finally{cdp.close();}};
      process.once('SIGINT',stop);process.once('SIGTERM',stop);
    }
  } else {
    console.log('Experimental Codex project chat sort\n  doctor --asar PATH\n  list --port 9333\n  attach --port 9333 --target ID [--reload]\nAttach requires an explicitly debug-enabled Codex instance. --reload reloads that page.');
  }
} catch(error) {console.error(error.message);process.exitCode=1;}
