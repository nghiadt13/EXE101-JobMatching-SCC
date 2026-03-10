# Homepage + Jobs Filters Session: Shipped Scope, Failed Build Gate

**Date**: 2026-03-10 20:41
**Severity**: High
**Component**: API jobs filters v1, web homepage/jobs listing, SEO/tracking baseline
**Status**: Ongoing

## What Happened

This session pushed the v1 scope across API and web: additive `/jobs` filters/sort contract, upgraded `/jobs` UI (URL-state filters/chips/pagination), TopCV-style homepage sections, and SEO/tracking baseline (`metadata`, `sitemap.ts`, `robots.ts`, JSON-LD, consent-gated events). Feature flags and rollback sequence were documented, and release-readiness notes were updated.

## The Brutal Truth

Most of the implementation landed, but release confidence still took a hit. The frustrating part is we can point to finished code and still fail the final build gate due to a file-system permission issue. It feels like getting to the finish line and tripping on the curb.

## Technical Details

- API filter and UX scope reflected in plan/report artifacts and checklist updates.
- Tracking baseline implemented behind consent + flag with events:
  - `home_search_submitted`
  - `apply_attempted`
- Tests executed in this session:
  - `npm run test -w api -- jobs.service.spec.ts` -> PASS (23/23)
  - `npm run test:e2e -w api` -> PASS (35/35)
  - `$env:AUTH_SECRET='local-test-secret-for-build-only'; npm run build -w web` -> FAIL
- Blocking error:
  - `Error: EPERM: operation not permitted, unlink 'D:\Work\vscode\job-matching\apps\web\.next\app-path-routes-manifest.json'`
  - Next build aborted with npm lifecycle exit code `1`.

## What We Tried

- Ran targeted API unit and e2e suites to validate backend behavior first.
- Re-ran web build with `AUTH_SECRET` explicitly set to avoid env-related false negatives.
- Build still failed at filesystem unlink step inside `.next`.

## Root Cause Analysis

Primary root cause is environmental/file-lock behavior on Windows during Next.js build cleanup, not business-logic regressions in API/jobs/homepage features. Secondary issue: release gate process assumes build determinism, but local FS contention is currently unmitigated.

## Lessons Learned

- Shipping feature-complete code is not enough; build stability on target OS must be treated as a first-class gate.
- Run web build earlier in the phase to surface FS/toolchain issues before late-stage readiness checks.
- Keep test evidence and blocker evidence in one place; it speeds triage and avoids vague “works on my machine” arguments.

## Next Steps

- Clear `.next` lock contention and rerun `npm run build -w web` until clean.
- Add a short Windows build-troubleshooting note to release checklist (EPERM/unlink remediation path).
- Complete remaining open gates: full automated verification pass, canary metrics, rollback drill evidence.
