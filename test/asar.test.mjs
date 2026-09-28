import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readAsarFile } from '../src/asar.mjs';
test('reads a synthetic ASAR and rejects unsafe paths or invalid bounds',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cps-asar-'));
  try{
    const data=Buffer.from('fixture'),tree={files:{'entry.js':{size:data.length,offset:'0'},'bad.js':{size:999999,offset:'0'}}};
    const json=Buffer.from(JSON.stringify(tree)),headerSize=8+Math.ceil(json.length/4)*4;
    const header=Buffer.alloc(8+headerSize);header.writeUInt32LE(4,0);header.writeUInt32LE(headerSize,4);header.writeUInt32LE(headerSize-4,8);header.writeUInt32LE(json.length,12);json.copy(header,16);
    const archive=path.join(dir,'fixture.asar');fs.writeFileSync(archive,Buffer.concat([header,data]));
    assert.equal(readAsarFile(archive,'entry.js').toString(),'fixture');
    assert.throws(()=>readAsarFile(archive,'../entry.js'),/Invalid/);
    assert.throws(()=>readAsarFile(archive,'bad.js'),/bounds/);
  }finally{for(const file of fs.readdirSync(dir))fs.unlinkSync(path.join(dir,file));fs.rmdirSync(dir);}
});
