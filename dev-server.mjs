import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createWorker } from './worker.mjs';
const types={'index.html':'text/html; charset=utf-8','styles.css':'text/css; charset=utf-8','app.mjs':'text/javascript; charset=utf-8','stats.mjs':'text/javascript; charset=utf-8'};
const assets=new Map(await Promise.all(Object.entries(types).map(async([name,type])=>['/'+name,{body:await readFile(new URL(name,import.meta.url),'utf-8'),type}])));
const worker=createWorker(assets);
const port=Number(process.env.PORT??8870);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid port');
http.createServer(async(req,res)=>{
  try {
    const response=await worker.fetch(new Request(new URL(req.url,'http://127.0.0.1:'+port),{method:req.method}));
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  } catch {res.writeHead(500,{'content-type':'text/plain'});res.end('Development server error');}
}).listen(port,'127.0.0.1',()=>console.log(`Local dashboard: http://127.0.0.1:${port}`));
