import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=path.join(root,'skills/codex-project-chat-sort/assets/runtime');
fs.mkdirSync(dest,{recursive:true});
for(const dir of ['bin','src','profiles']) fs.cpSync(path.join(root,dir),path.join(dest,dir),{recursive:true});
for(const name of ['package.json','LICENSE']) fs.copyFileSync(path.join(root,name),path.join(dest,name));
console.log('Skill runtime refreshed from repository source.');
