import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {bundlePaths,launcherText,quoteShell,restoreLauncher} from '../skills/codex-project-chat-sort/scripts/mac.mjs';
test('mac bundle rejects executable path traversal',()=>{
  for(const name of ['../evil','a/b','a\\b','..','x\ny'])assert.throws(()=>bundlePaths('/Applications/Codex.app',name));
  assert.ok(bundlePaths('/Applications/Codex.app','Codex').asar.endsWith(path.join('Contents','Resources','app.asar')));
});
test('mac launcher safely quotes spaces and shell metacharacters',()=>{
  const value="/tmp/a b/'$(touch NEVER_EXECUTE)`x`";
  assert.ok(launcherText(value,value,value).includes(quoteShell(value)));
  if(process.platform!=='win32')assert.equal(execFileSync('/bin/bash',['-c',`printf %s ${quoteShell(value)}`],{encoding:'utf8'}),value);
});
test('mac uninstall preserves edited launcher and retains runtime',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cps-mac-'));
  try{
    const launcher=path.join(root,'Sorting.command');
    const content='original';
    fs.writeFileSync(launcher,content);
    fs.writeFileSync(path.join(root,'config.json'),JSON.stringify({launcher,launcherSha256:createHash('sha256').update(content).digest('hex')}));
    fs.writeFileSync(launcher,'user edit');assert.throws(()=>restoreLauncher(root));assert.equal(fs.readFileSync(launcher,'utf8'),'user edit');
    fs.writeFileSync(launcher,content);restoreLauncher(root);assert.equal(fs.existsSync(launcher),false);assert.equal(fs.existsSync(path.join(root,'config.json')),true);
  }finally{for(const name of ['Sorting.command','config.json']){const file=path.join(root,name);if(fs.existsSync(file))fs.unlinkSync(file);}fs.rmdirSync(root);}
});
