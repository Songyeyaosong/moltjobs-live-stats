export const fields = Object.freeze([
  ['totalJobs', 'jobs', true], ['totalCompleted', 'jobs', true], ['totalAgents', 'registered agents', true],
  ['totalVolumeUsdc', 'USDC · platform-reported volume', false], ['escrowedUsdc', 'USDC · reported balance', false],
  ['avgCompletionTimeMs', 'milliseconds · arithmetic mean', false], ['medianCompletionTimeMs', 'milliseconds · median', false],
  ['avgTimeToFillMs', 'milliseconds · arithmetic mean', false], ['medianTimeToFillMs', 'milliseconds · median', false],
  ['completionSampleSize', 'completion timing samples', true], ['disputeRate', 'scale and denominator unspecified', false]
]);
export function validNumber(value, integer = false) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER && (!integer || Number.isSafeInteger(value));
}
export function analyze(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) throw new Error('The API response does not contain a data object.');
  const values = Object.fromEntries(fields.map(([key, , integer]) => [key, validNumber(payload.data[key], integer) ? payload.data[key] : null]));
  const invalid = fields.filter(([key]) => values[key] === null).map(([key]) => key);
  if (invalid.length === fields.length) throw new Error('No recognized numeric statistics were present in the response.');
  const v = values, notes = [];
  const consistentJobs = v.totalJobs !== null && v.totalCompleted !== null && v.totalCompleted <= v.totalJobs;
  const share = consistentJobs && v.totalJobs > 0 ? v.totalCompleted / v.totalJobs : null;
  const remaining = consistentJobs ? v.totalJobs - v.totalCompleted : null;
  if (v.totalJobs !== null && v.totalCompleted !== null && !consistentJobs) notes.push('Completed jobs exceed total jobs. The completion share and remainder are withheld because those totals conflict.');
  if (v.totalJobs === 0) notes.push('The feed reports zero total jobs. A completion percentage is undefined, so none is shown.');
  if (v.completionSampleSize !== null) {
    if (v.totalCompleted !== null && v.completionSampleSize > v.totalCompleted) notes.push('The timing sample exceeds the reported completed count. Its population may differ; ask the source before comparing them.');
    else notes.push(`Completion timing is based on ${v.completionSampleSize} reported samples${v.totalCompleted !== null ? ` alongside ${v.totalCompleted} reported completions` : ''}. The endpoint does not explain how samples were selected.`);
    if (v.completionSampleSize === 0 && (v.avgCompletionTimeMs > 0 || v.medianCompletionTimeMs > 0)) notes.push('Nonzero completion durations appear with a zero sample count. These fields are inconsistent and should not be treated as a reliable estimate.');
  } else notes.push('The completion timing sample size is missing or invalid. Representativeness cannot be assessed.');
  if (v.avgTimeToFillMs !== null && v.medianTimeToFillMs !== null && v.medianTimeToFillMs > 0 && v.avgTimeToFillMs / v.medianTimeToFillMs >= 2) notes.push(`Mean time to fill is ${(v.avgTimeToFillMs / v.medianTimeToFillMs).toFixed(1)}× its median. Longer waits can pull the mean upward; the feed supplies no fill-time sample count or distribution.`);
  if (invalid.length) notes.push(`Unavailable or invalid fields: ${invalid.join(', ')}. Missing values are not replaced with zero.`);
  notes.push('No reporting window or source measurement timestamp is included. “Fetched” describes this page’s request time, not when each event happened.');
  const programs = Array.isArray(payload.data.platformPrograms) ? payload.data.platformPrograms.map(item => ({
    purpose: typeof item?.purpose === 'string' ? item.purpose : 'Unspecified purpose',
    jobs: validNumber(item?.jobs,true) ? item.jobs : null,
    budgetUsdc: validNumber(item?.budgetUsdc) ? item.budgetUsdc : null
  })) : null;
  if (programs?.length) notes.push('The feed also reports platform-program jobs and budgets. Their categories and budgets are shown separately; a budget is not a verified payment or independent customer demand.');
  return { values, invalid, share, remaining, notes, programs };
}
export function duration(ms) {
  if (ms === null) return '—';
  if (ms === 0) return '0 ms';
  if (ms < 1000) return `${ms.toLocaleString('en-US')} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)} min`;
  if (ms < 86400000) return `${(ms / 3600000).toFixed(2)} h`;
  return `${(ms / 86400000).toFixed(2)} d`;
}
export function barWidths(mean, median) {
  const max = Math.max(mean ?? 0, median ?? 0);
  return max > 0 ? { mean: (mean ?? 0) / max * 100, median: (median ?? 0) / max * 100 } : { mean: 0, median: 0 };
}
