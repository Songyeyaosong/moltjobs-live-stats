import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, duration, barWidths } from '../stats.mjs';
const fixture = {data:{totalJobs:110,totalCompleted:48,totalAgents:421,totalVolumeUsdc:35,escrowedUsdc:14,avgCompletionTimeMs:161209083,medianCompletionTimeMs:138650088,avgTimeToFillMs:1867486522,medianTimeToFillMs:242740501,completionSampleSize:8,disputeRate:0}};
test('realistic feed retains raw counts, explains the denominator and surfaces timing limitations',()=>{
  const m=analyze(fixture); assert.equal(m.share,48/110); assert.equal(m.remaining,62); assert.equal(m.values.disputeRate,0); assert.deepEqual(m.invalid,[]);
  assert.ok(m.notes.some(x=>x.includes('8 reported samples'))); assert.ok(m.notes.some(x=>x.includes('7.7×'))); assert.equal(duration(m.values.avgTimeToFillMs),'21.61 d');
});
test('zero totals have no invented percentage; zero duration remains valid',()=>{
  const m=analyze({data:{totalJobs:0,totalCompleted:0,completionSampleSize:0}}); assert.equal(m.share,null); assert.equal(m.remaining,0); assert.equal(duration(0),'0 ms'); assert.deepEqual(barWidths(0,0),{mean:0,median:0});
});
test('conflicting counts suppress derived values and flag zero timing sample conflict',()=>{
  const m=analyze({data:{totalJobs:1,totalCompleted:2,completionSampleSize:0,avgCompletionTimeMs:500}}); assert.equal(m.share,null); assert.equal(m.remaining,null); assert.ok(m.notes.some(x=>x.includes('exceed total'))); assert.ok(m.notes.some(x=>x.includes('zero sample')));
});
test('missing, null, string, negative and fractional counts never silently become real statistics',()=>{
  const m=analyze({data:{totalJobs:5,totalCompleted:null,totalAgents:'421',escrowedUsdc:-4,completionSampleSize:1.5,disputeRate:0.5}}); assert.equal(m.values.totalAgents,null); assert.equal(m.values.escrowedUsdc,null); assert.equal(m.values.completionSampleSize,null); assert.equal(m.share,null); assert.equal(m.values.disputeRate,0.5); assert.ok(m.invalid.includes('totalCompleted'));
});
test('malformed envelopes and all-invalid data fail visibly; timing scales remain bounded',()=>{
  for(const p of [null,[],{}, {data:[]},{data:{}}]) assert.throws(()=>analyze(p)); assert.deepEqual(barWidths(200,100),{mean:100,median:50}); assert.deepEqual(barWidths(null,100),{mean:0,median:100}); assert.equal(duration(null),'—');
});
