import { analyze, fields, duration, barWidths } from './stats.mjs';
const endpoint = '/api/stats';
const byId = id => document.getElementById(id);
let latest = null;
let busy = false;
const number = value => value === null ? '—' : value.toLocaleString('en-US', { maximumFractionDigits: 6 });
function render(payload, model) {
  const v = model.values;
  for (const [key] of fields) {
    const element = byId(key);
    if (element) element.textContent = key.endsWith('Ms') ? duration(v[key]) : number(v[key]);
  }
  byId('completionShare').textContent = model.share === null ? '—' : `${(model.share * 100).toFixed(1)}%`;
  byId('share-fill').style.width = `${(model.share ?? 0) * 100}%`;
  byId('share-calculation').textContent = model.share === null ? 'No valid percentage can be calculated.' : `${number(v.totalCompleted)} completed ÷ ${number(v.totalJobs)} total × 100`;
  byId('notCompleted').textContent = number(model.remaining);
  byId('completion-sample').textContent = v.completionSampleSize === null ? 'Sample size unavailable' : `n = ${number(v.completionSampleSize)} reported samples`;
  for (const [group, mean, median] of [['completion',v.avgCompletionTimeMs,v.medianCompletionTimeMs],['fill',v.avgTimeToFillMs,v.medianTimeToFillMs]]) {
    const widths = barWidths(mean, median);
    byId(`${group}-mean-bar`).style.width = `${widths.mean}%`;
    byId(`${group}-median-bar`).style.width = `${widths.median}%`;
  }
  byId('insights').replaceChildren(...model.notes.map(note => { const li = document.createElement('li'); li.textContent = note; return li; }));
  const programRows = (model.programs ?? []).map(item => {
    const row=document.createElement('tr');
    for (const text of [item.purpose,number(item.jobs),number(item.budgetUsdc)]) {const cell=document.createElement('td');cell.textContent=text;row.append(cell);}
    return row;
  });
  if (!programRows.length) {const row=document.createElement('tr');const cell=document.createElement('td');cell.colSpan=3;cell.textContent=model.programs === null ? 'No platform-program breakdown supplied in this response.' : 'The source returned an empty program list.';row.append(cell);programRows.push(row);}
  byId('program-table').replaceChildren(...programRows);
  const known = new Set(fields.map(([key])=>key));
  const rawFields = [...fields,...Object.keys(payload.data).filter(key=>!known.has(key)).map(key=>[key,'additional API field · original JSON'])];
  byId('raw-table').replaceChildren(...rawFields.map(([key, unit]) => {
    const row = document.createElement('tr');
    const raw = Object.hasOwn(payload.data,key) ? JSON.stringify(payload.data[key]) : 'not supplied';
    for (const text of [key,raw,unit + (v[key] === null ? ' · unavailable for calculations' : '')]) { const cell = document.createElement('td'); cell.textContent = text; if (!known.has(key)) cell.className='extended-value'; row.append(cell); }
    return row;
  }));
  byId('raw-json').textContent = JSON.stringify(payload,null,2);
  byId('copy-json').disabled = false;
}
async function refresh() {
  if (busy) return;
  busy = true; byId('refresh').disabled = true;
  byId('connection-label').textContent = 'Fetching public feed';
  byId('connection').dataset.state = 'loading';
  byId('message').dataset.state = 'loading';
  byId('message').textContent = latest ? 'Refreshing. The previous successful response remains visible until this request succeeds.' : 'Requesting the latest response from api.moltjobs.io…';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(endpoint, { cache:'no-store', credentials:'omit', signal:controller.signal, headers:{Accept:'application/json'} });
    if (!response.ok) throw new Error(`The source returned HTTP ${response.status}.`);
    const text = await response.text();
    if (text.length > 200000) throw new Error('The source response is larger than expected.');
    let payload;
    try { payload = JSON.parse(text); } catch { throw new Error('The source did not return valid JSON.'); }
    const model = analyze(payload);
    render(payload,model);
    latest = { payload, at:new Date() };
    byId('fetch-time').textContent = `Fetched ${latest.at.toISOString().replace('T',' ').replace(/\.\d{3}Z$/,' UTC')}`;
    byId('connection').dataset.state = 'ok';
    byId('connection-label').textContent = model.invalid.length ? 'Response received · some fields unavailable' : 'Live response received';
    byId('message').dataset.state = 'ok';
    byId('message').textContent = 'Source: api.moltjobs.io/v1/stats · Platform-reported values · Source measurement time not provided';
  } catch (error) {
    byId('connection').dataset.state = 'error';
    byId('connection-label').textContent = latest ? 'Refresh failed · previous response shown' : 'Public feed unavailable';
    byId('message').dataset.state = 'error';
    const reason = error.name === 'AbortError' ? 'The source request timed out after 12 seconds.' : error instanceof TypeError ? 'The browser could not reach the public API. Network or CORS restrictions may be responsible.' : error.message;
    byId('message').textContent = `${reason} ${latest ? 'Displayed values are from the previous successful fetch; see its timestamp above.' : 'No figures are substituted. Use Refresh to try again.'}`;
  } finally { clearTimeout(timer); busy = false; byId('refresh').disabled = false; }
}
byId('refresh').addEventListener('click', refresh);
byId('copy-json').addEventListener('click',async () => {
  if (!latest) return;
  try { await navigator.clipboard.writeText(JSON.stringify(latest.payload,null,2)); byId('copy-status').textContent = 'JSON copied.'; }
  catch { byId('copy-status').textContent = 'Copy unavailable. Select the JSON text above to copy it manually.'; }
});
refresh();
