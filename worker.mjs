const UPSTREAM = 'https://api.moltjobs.io/v1/stats';
const headers = { 'cache-control':'no-store', 'x-content-type-options':'nosniff' };
const problem = (status, message) => new Response(JSON.stringify({error:message}), {status, headers:{...headers,'content-type':'application/json; charset=utf-8'}});
export function createWorker(assets, upstreamFetch = globalThis.fetch) {
  return {
    async fetch(request) {
      const url = new URL(request.url);
      if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed', {status:405, headers:{...headers,allow:'GET, HEAD'}});
      if (url.pathname === '/api/stats') {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 9000);
        try {
          // Fixed public upstream; no caller-controlled host, path, headers or credentials.
          const response = await upstreamFetch(UPSTREAM, {method:'GET', headers:{Accept:'application/json'}, redirect:'error', signal:controller.signal, cache:'no-store'});
          if (!response.ok) return problem(502, `Public stats upstream returned HTTP ${response.status}`);
          if (!response.body) return problem(502,'Public stats upstream returned an empty body');
          const reader = response.body.getReader();
          const chunks = []; let size = 0;
          while (true) {
            const {done,value} = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 65536) { await reader.cancel(); return problem(502,'Public stats upstream response exceeded 64 KiB'); }
            chunks.push(value);
          }
          const bytes = new Uint8Array(size); let offset = 0;
          for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
          let payload;
          try { payload = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)); }
          catch { return problem(502,'Public stats upstream returned invalid JSON'); }
          if (!payload || typeof payload.data !== 'object' || payload.data === null || Array.isArray(payload.data)) return problem(502,'Public stats upstream returned an unexpected envelope');
          return new Response(request.method === 'HEAD' ? null : bytes, {headers:{...headers,'content-type':'application/json; charset=utf-8','x-stats-upstream':UPSTREAM}});
        } catch (error) { return problem(error.name === 'AbortError' ? 504 : 502,'Public stats upstream unavailable'); }
        finally { clearTimeout(timer); }
      }
      const path = url.pathname === '/' ? '/index.html' : url.pathname;
      const asset = assets.get(path);
      if (!asset) return new Response('Not found',{status:404,headers});
      return new Response(request.method === 'HEAD' ? null : asset.body, {headers:{...headers,'content-type':asset.type}});
    }
  };
}
const assets = new Map(); // @build:static-assets
export default createWorker(assets);
