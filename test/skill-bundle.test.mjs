import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('standalone skill ships the current runtime and license',()=>{
  const files=['package.json','LICENSE',...['src','bin','profiles'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).map(name=>`${dir}/${name}`))];
  for(const file of files) assert.deepEqual(fs.readFileSync(path.join(root,'skills/codex-project-chat-sort/assets/runtime',file)),fs.readFileSync(path.join(root,file)),file);
});
