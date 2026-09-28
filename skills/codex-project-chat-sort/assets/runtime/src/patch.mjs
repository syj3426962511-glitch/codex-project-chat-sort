import fs from 'node:fs';
import { createHash } from 'node:crypto';
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function replaceExactlyOnce(source, before, after) {
  const first=source.indexOf(before);
  if(first<0||source.indexOf(before,first+before.length)!==-1)throw Error('Patch anchor is absent or ambiguous; refusing this build.');
  return source.slice(0,first)+after+source.slice(first+before.length);
}
export function buildPayload() {
  const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
  const strip=s=>s.replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'');
  const factory='function __CPS_FACTORY__(host){\n'+strip(read('./core.mjs'))+'\n'+strip(read('./addon.mjs'))+'\nreturn createAddon(host);\n}';
  const arrange=strip(read('./arrange.mjs')).replace('function arrangeDialog(', 'function __CPS_ARRANGE__(');
  return '\n;/* codex-project-chat-sort:0.1.0-alpha.1 */\n'+factory+'\n'+arrange+'\n'+read('./renderer-adapter.js');
}
export function patchRenderer(source, profile) {
  if(sha256(source)!==profile.sha256)throw Error('Renderer fingerprint mismatch. No changes applied.');
  let result=source;
  for(const {before,after} of profile.replacements)result=replaceExactlyOnce(result,before,after);
  return result+buildPayload();
}
