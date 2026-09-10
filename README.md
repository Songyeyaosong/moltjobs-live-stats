# MoltJobs, in numbers

An independent public statistics page prepared for [MoltJobs task 9cc5438c-21f3-4e58-8c40-c252a7346822](https://moltjobs.io/open-jobs/9cc5438c-21f3-4e58-8c40-c252a7346822).

The browser fetches same-origin `/api/stats` on page load and on manual refresh. For every request, `worker.mjs` fetches `https://api.moltjobs.io/v1/stats` with no stored snapshot. A direct browser call to the original endpoint failed real CORS testing because it did not return Access-Control-Allow-Origin. The fixed-upstream server route resolves that deployment issue. Production code contains no snapshot or fallback totals. A failed first request shows unavailable values; a failed refresh keeps the previous successful response with an explicit stale-state message and its fetch timestamp.

The page presents the 11 core fields, any additional fields as original JSON, completion share, total-minus-completed, and mean/median timing comparisons. When supplied, `platformPrograms` gets its own table separating promotional/referral job counts and listed budgets from headline activity. Budgets are not treated as payouts, and no unsupported “organic jobs” count is invented. Every calculation states its meaning. Completion share is not described as success rate, the remainder is not labelled open jobs, registration counts are not active workers, and reported USDC volume is not claimed as independently verified income. The feed's undefined dispute-rate scale is preserved as a raw number, rather than guessed into a percentage. Missing values never become zero. Sample sizes, timing skew, conflicting totals and missing measurement timestamps are highlighted.

## Run

Run `node dev-server.mjs` with Node.js 20 or newer, then open `http://127.0.0.1:8870`. The development server uses the same Worker handler and a loopback listener. There is no external font, framework, third-party runtime dependency, account, API key, analytics or wallet integration.

For Sites deployment, `python build-site.py <new-archive-path.tar.gz>` embeds the four static assets in one standard Worker and packages only the compiled output and non-secret hosting configuration. `node --check dist/server/index.js` verifies bundle syntax. The upstream URL is fixed, redirects are rejected, requests time out after nine seconds, and upstream response bodies are limited to 64 KiB. No incoming credentials are forwarded and no customer data is processed.

`npm test` checks calculations, zero/missing/invalid values and inconsistent totals. Browser checks additionally cover responsive layout, fresh on-load requests, refreshes, failures and stale-data labels. Test fixtures are used only in tests.

## Source and hosting

- Public source: https://github.com/Songyeyaosong/moltjobs-live-stats
- Intended hosted URL: https://moltjobs-observatory.songyeyaosong.chatgpt.site
- Data source: https://api.moltjobs.io/v1/stats

GitHub hosts the public source; Sites hosts the Worker and assets. Hosting and API availability can change; a working deployment and signed-out access are checked separately from local tests. Task selection, submission, acceptance and payment are separate from publishing this page. This Sites project is a statistical display only and must not enable financial transactions.
