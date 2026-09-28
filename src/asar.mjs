import fs from 'node:fs';
export function readAsarFile(archive, entryPath) {
  const fd = fs.openSync(archive,'r');
  try {
    const size=fs.fstatSync(fd).size;
    const read=(n,at)=>{if(!Number.isSafeInteger(n)||!Number.isSafeInteger(at)||n<0||at<0||at+n>size)throw Error('Invalid ASAR bounds');const b=Buffer.alloc(n);if(fs.readSync(fd,b,0,n,at)!==n)throw Error('Truncated ASAR');return b;};
    const pre=read(16,0), headerLength=pre.readUInt32LE(12), headerSize=pre.readUInt32LE(4);
    if(headerLength>32*1024*1024||headerLength>headerSize-8)throw Error('Unsupported ASAR header');
    let entry=JSON.parse(read(headerLength,16).toString('utf8'));
    for(const part of entryPath.split('/')){
      if(!part||part==='.'||part==='..')throw Error('Invalid ASAR entry path');
      entry=entry.files?.[part];if(!entry)throw Error('ASAR entry not found');
    }
    if(entry.unpacked||entry.link||entry.files)throw Error('Expected a packed file');
    return read(entry.size,8+headerSize+Number(entry.offset));
  } finally {fs.closeSync(fd);}
}
