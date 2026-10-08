# Check policy

## Coverage and request contract — CAP-1/2

- Read exactly one authoritative root JSON/YAML map at an explicit `main` commit. Validate the entire source before network work; reuse shared leaf traversal and state interpretation. Include hidden, disabled, and script-enabled leaves; directories are not destinations.
- Evaluate configured destination URLs directly with GET. shl redirects use HTML/JavaScript and are not an HTTP redirect target for this checker. Follow HTTP redirects only; preserve the configured URL and record the final URL without retargeting.
- Deduplicate identical full configured URLs within a run and apply one evaluation to all matching paths. Preserve query parameters and URL spelling; do not introduce semantic URL normalization.
- Use an honest fixed checker User-Agent, without destination credentials/cookies or browser impersonation. Close/cancel response bodies once status evidence is obtained; never execute downloads or follow HTML meta refresh/JavaScript.
- A 2xx means observed HTTP reachability. It does not establish useful content, a successful complete download, or script correctness; soft-404s are outside this policy.

## Evaluation matrix — CAP-2/3

“Latest check” is the latest completed evaluation within one run, not each request. An attempt includes its HTTP redirect chain; there are at most two attempts. The first 2xx ends evaluation successfully. Retry a first 404/410 for confirmation; temporary transport, 5xx or rate-limit failures may receive one retry when budgets permit. Other outcomes may finish unknown without retry.

| Completed evidence | Outcome | Source action |
| --- | --- | --- |
| First or retried terminal 2xx, including 404 then 200 | Reachable | Remove every exact trimmed case-insensitive `broken` tag, including manual assignments |
| 404 then 404, or 410 then 410 | Broken | Append canonical lowercase `broken` only if no exact equivalent exists |
| Mixed 404/410; 404/410 followed by timeout, 5xx or other non-success | Unknown | Preserve all tags |
| 401/403, 429, 5xx, DNS/TCP/TLS failure, timeout, redirect loop/hop exhaustion, invalid/unhandled response or other non-2xx without matching confirmation | Unknown | Preserve all tags |
| Started evaluation runs out of budget before decisive evidence | Unknown | Preserve all tags |
| Never started because budget/cooldown prevented checking | Skipped | Preserve all tags |

Unknown/skipped retain both presence and absence of `broken`. Neither creates an `unknown` tag. Matching HTTP statuses confirm explicit disappearance, not certainty about permanent deletion; even repeated 404s can be temporary. Persistent DNS/TLS/5xx outages can remain untagged indefinitely, and unknown evidence can retain stale broken warnings. Make that limitation visible in the run summary and operator documentation. No ownership distinction or cross-run history modifies these rules.

## Starting bounds and remote courtesy

| Limit | Initial value | Scope |
| --- | --- | --- |
| Attempt deadline | 15 seconds | Entire HTTP redirect chain, not a fresh deadline per hop |
| Attempts | At most 2 | Initial request plus one permitted retry |
| Evaluation budget | 45 seconds | One distinct configured URL, including retry delays and cooldown waits once evaluation starts |
| Redirect limit | 10 hops | Per attempt |
| Checker job ceiling | 15 minutes | Stop normal scan work early enough to finalize partial evidence before the hard deadline |
| Concurrent requests | 4 global; 1 per origin | Includes requests issued during redirect traversal |

Use short per-origin pacing and jittered retry delays bounded by remaining evaluation/job time. An origin is the URL's scheme/host/port; every redirect hop participates in its origin's courtesy and concurrency controls. Release request/body resources before retrying or continuing.

Honor valid `Retry-After` seconds or HTTP dates and apply cooldown to the affected origin. Malformed/past values use a bounded fallback delay. A wait beyond remaining budget defers affected requests rather than sleeping indefinitely; repeated 429s reduce work. Started evaluations without decisive evidence become unknown, unvisited destinations skipped. Do not amplify rate limits through immediate retries.

These are starting defaults, not measured capacity or scheduling guarantees. Record trial evidence and intentional tuning; no domain-specific exception engine is required.

## Source mutation — CAP-3

- Treat validated raw entries/shared projections as readonly. Mutate a separate writable source document; reuse interpretation instead of introducing another schema or normalization rule.
- Match `broken` exactly after trimming and case folding. Preserve descriptive near matches such as `broken-example` or literal `#broken`, and preserve every unrelated field/tag value and ordering, including hidden/disabled state.
- Expand a URL-string leaf to `{ url, tags }` only when adding `broken`. Do not collapse recovered objects back into strings. Remove a tags property made empty by recovery; otherwise retain source shape.
- Use installed `yaml` document nodes to preserve comments/key order rather than plain-object whole-map serialization. Edit JSON structurally and apply existing pinned formatting; formatting may widen textual diffs without changing unrelated values.
- Validate the changed source before publication. A second calculation on the same evidence/source must be a no-op. No formatted diff means no new commit or PR; withdrawing a superseded pending proposal is addressed in `publication.md`.

## Evidence and failure boundaries

Report scan start/end, exact source SHA, source file, link paths, configured/final URLs, attempt status/error category and durations, outcomes, proposed additions/removals, and checked/unknown/skipped counts. Duplicate URLs share evidence but retain all affected paths; coverage distinguishes destination evaluations from link counts. Keep evidence in Actions summaries/PRs/artifacts, not response-body dumps, per-link source metadata or a committed health-history file.

Unavailable destinations are findings, not an internal checker failure. An ordinary budget-limited partial scan may propose completed decisive results with incomplete coverage explicit. Hard timeout/cancellation, source parsing/validation failure, or checker/internal failure publishes nothing; do not publish a half-written candidate. Invalid-source/internal/publication failures fail the workflow and retain available evidence. A broad transport-failure pattern is reported as inconclusive runner/network evidence, not many proven broken links.

## Acceptance cases

Use deterministic local HTTP responses and controlled timing/error inputs, not live websites, for these implementation gates:

1. **Classification:** 200; redirects to 200; 404/404; 410/410; 404/200; 404/timeout; mixed 404/410. Confirm expected outcome/tag actions, including manually tagged recovery.
2. **Uncertainty:** 401/403/429/503, DNS/TCP/TLS failures, unusual 3xx/4xx, redirect loops/exhaustion and deadlines preserve both tagged and untagged state; a permitted retry reaching 2xx clears broken.
3. **Courtesy/bounds:** Attempts, redirect hops, total chain/evaluation/job deadlines, global/origin concurrency, redirect-origin pacing, and numeric/date/malformed/excessive `Retry-After` respect limits. Distinguish started unknown from never-started skipped; close bodies and never execute content.
4. **Source fidelity:** JSON/YAML, nested leaves, URL-string conversion, preserved YAML comments/order, mixed-case/trimmed/duplicate broken tags, near-match tags, untouched fields/hidden/disabled and readonly shared snapshots; repeated application produces no diff. Identical destinations fan out without repeated network work.
5. **Coverage/failures:** Reports disclose time/SHA/attempts and partial coverage; ordinary partial runs contain only justified proposals, while invalid source, hard cancellation or checker failure creates no published candidate. Reports do not claim useful content or complete script downloads from 2xx.

These define checker implementation proof; a passing existing build suite during spec authoring does not establish these behaviors.
