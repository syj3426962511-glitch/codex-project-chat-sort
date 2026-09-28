import http from 'node:http';
import fs from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const allowed=new Set(['preview/index.html','src/addon.mjs','src/core.mjs','src/arrange.mjs']);
const port=Number(process.env.CPS_PREVIEW_PORT??9438);
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost'), path=url.pathname==='/'?'preview/index.html':url.pathname.slice(1);
  if(!allowed.has(path)){res.writeHead(404);res.end();return;}
  try{const body=await fs.readFile(new URL(path,root));res.writeHead(200,{'Content-Type':path.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);}catch{res.writeHead(500);res.end();}
}).listen(port,'127.0.0.1',()=>console.log(`Synthetic fixture only: http://127.0.0.1:${port}`));
