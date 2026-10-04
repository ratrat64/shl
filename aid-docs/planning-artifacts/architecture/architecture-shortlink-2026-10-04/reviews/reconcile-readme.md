# Independent reconciliation — README → architecture spine

Verdict: **PASS WITH ONE NONBLOCKING OMISSION**. No contradiction in the five principal compatibility contracts.
Scope: current documented usage and load-bearing boundaries; manual instructions and code-owned mechanics need not be copied.
Locations below refer to `ARCHITECTURE-SPINE.md` unless another file is named.

## Actionable finding

- **Preserve the no-built-in-click-tracking boundary** in AD-1 (`:35–39`) or Deferred (`:127–134`).
  `README.md:186–191` explicitly excludes built-in click tracking; `build.mjs:337–338` repeats it in the public guide.
  A static/no-backend architecture still permits client-side tracking, so AD-1 does not preserve this exclusion.
  Add one short statement that tracking is outside the current system and needs a separately scoped feature decision.

## Reconciled contracts

- **Nested namespace:** AD-2/AD-3 and Namespace (`:45,51,94`) preserve nonempty directories, leaf/directory exclusivity, segment syntax, sibling case uniqueness, reserved names, and launcher collisions (`README.md:46–72,119–121`; `build.mjs:53–108`).
- **Root/project routing:** AD-3 (`:51`) preserves relative navigation, case-preserving output, full-path case-insensitive recovery, canonical directory navigation, public-map dependence, and browser rather than HTTP redirects (`README.md:169–184`). Source/tests confirm recovery with and without a trailing slash at both hosting prefixes (`build.mjs:375–405`; `build.test.mjs:353–395`). No additional routing omission found.
- **Launchers:** AD-2–AD-4 and runtime seed (`:45,51,57,108`) retain opt-in boolean semantics, nested `.sh` paths, exact casing/no trailing slash, complete download before execution, arguments, exit status, cleanup, and required tools (`README.md:88–121`; `build.mjs:123–129,428–431`).
- **Publication:** AD-4/AD-6 and Mutation (`:57,69,96`) retain validation-before-replacement, stale-resource removal, retarget/delete behavior, PR checks, `main`/manual publication, `dist/`-only hosting, optional CNAME, and deployed routing smoke tests (`README.md:19–28,71–72,123–165`). External ruleset/DNS setup is correctly externalized.
- **Public metadata:** AD-2 and Shared data (`:45,95`) preserve one JSON/YAML source, its nested published shape, titles/launcher flags, and all entries being publicly listed (`README.md:64–65,74–86,173,186–191`; `build.mjs:444`). Hidden links remain a future decision (`:132`).
- **Progressive enhancement:** AD-5 (`:63`) preserves no-JavaScript browsing, directory search, local theme preference, guide sections, and legacy informational URLs (`README.md:7–12`).

## Source ambiguity resolved

`README.md:20` says deployment “checks, builds, and deploys”; `.github/workflows/deploy.yml:25–32` builds/validates but does not run regression tests. AD-6 (`:69`) accurately distinguishes PR tests from deployment validation; this is README imprecision, not a spine contradiction.

Final disposition: AD-1 now explicitly excludes built-in click tracking from current scope; no outstanding README reconciliation finding.
