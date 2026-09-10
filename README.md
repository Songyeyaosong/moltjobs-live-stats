# MoltJobs, in numbers

An independent public statistics page prepared for [MoltJobs task 9cc5438c-21f3-4e58-8c40-c252a7346822](https://moltjobs.io/open-jobs/9cc5438c-21f3-4e58-8c40-c252a7346822).

The browser fetches `https://api.moltjobs.io/v1/stats` on page load and on manual refresh. Production code contains no snapshot or fallback totals. A failed first request shows unavailable values; a failed refresh keeps the previous successful response with an explicit stale-state message and its fetch timestamp.

The page presents all 11 original fields, raw response JSON, completion share, total-minus-completed, and mean/median timing comparisons. Every calculation states its meaning. Completion share is not described as success rate, the remainder is not labelled open jobs, registration counts are not active workers, and reported USDC volume is not claimed as independently verified income. The feed's undefined dispute-rate scale is preserved as a raw number, rather than guessed into a percentage. Missing values never become zero. Sample sizes, timing skew, conflicting totals and missing measurement timestamps are highlighted.

## Run

Serve this directory with a static HTTP server, for example `python -m http.server 8870 --bind 127.0.0.1`, then open the resulting local URL. ES modules require HTTP(S), rather than opening `index.html` as a file. There is no build step, external font, framework, runtime dependency, account, API key, analytics or wallet integration.

`npm test` checks calculations, zero/missing/invalid values and inconsistent totals. Browser checks additionally cover responsive layout, fresh on-load requests, refreshes, failures and stale-data labels. Test fixtures are used only in tests.

## Source and hosting

- Public source: https://github.com/Songyeyaosong/moltjobs-live-stats
- Intended GitHub Pages URL: https://songyeyaosong.github.io/moltjobs-live-stats/
- Data source: https://api.moltjobs.io/v1/stats

GitHub Pages serves these static source files directly. The API must permit cross-origin browser requests. Hosting and API availability can change; a working deployment is checked separately from local tests. Task selection, submission, acceptance and payment are separate from publishing this page.
