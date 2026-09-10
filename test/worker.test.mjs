import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorker } from '../worker.mjs';
test('default fetch wrapper preserves the runtime receiver',async()=>{
  const original=globalThis.fetch;
  try {
    globalThis.fetch=function(){assert.equal(this,globalThis);return Promise.resolve(new Response('{"data":{"totalJobs":1}}'));};
    const response=await createWorker(new Map()).fetch(new Request('https://example.com/api/stats'));
    assert.equal(response.status,200);
  } finally {globalThis.fetch=original;}
});
test('same-origin endpoint fetches fresh fixed public source and passes the original JSON',async()=>{
  let count=0;
  const upstream=async(url,options)=>{
    assert.equal(url,'https://api.moltjobs.io/v1/stats'); assert.equal(options.method,'GET'); assert.equal(options.cache,'no-store'); assert.equal(options.headers.Authorization,undefined);
    return new Response(JSON.stringify({data:{totalJobs:++count}}));
  };
  const worker=createWorker(new Map(),upstream);
  for(const n of [1,2]) {
    const response=await worker.fetch(new Request('https://example.com/api/stats?url=https://not-used.invalid')); assert.equal(response.status,200); assert.equal(response.headers.get('cache-control'),'no-store'); assert.deepEqual(await response.json(),{data:{totalJobs:n}});
  }
});
test('upstream errors and oversized bodies fail without fake successful statistics',async()=>{
  for(const result of [new Response('{}',{status:503}),new Response('not json'),new Response('{"other":1}'),new Response('x'.repeat(65537))]) {
    const worker=createWorker(new Map(),async()=>result); const response=await worker.fetch(new Request('https://example.com/api/stats')); assert.equal(response.status,502); assert.equal((await response.json()).data,undefined);
  }
});
test('static routes support head, unknown routes and writes are rejected',async()=>{
  const worker=createWorker(new Map([['/index.html',{body:'<h1>test</h1>',type:'text/html'}]]),()=>{throw Error('Unexpected upstream call')});
  const request=(path,method='GET')=>new Request('https://example.com'+path,{method});
  assert.equal(await (await worker.fetch(request('/'))).text(),'<h1>test</h1>'); assert.equal(await (await worker.fetch(request('/','HEAD'))).text(),''); assert.equal((await worker.fetch(request('/missing'))).status,404); assert.equal((await worker.fetch(request('/api/stats','POST'))).status,405);
});
