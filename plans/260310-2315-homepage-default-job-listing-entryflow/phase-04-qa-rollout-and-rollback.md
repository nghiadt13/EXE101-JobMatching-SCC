# Phase 4: QA Matrix, Rollout, and Rollback

Status: In Progress (2026-03-10)

## Goal

Ship safely with clear validation gates and rollback controls.

## Test Matrix

1. Guest:
   - `/` loads listing + filters/search behavior.
   - `/jobs` compatibility behavior works (redirect or alias).
2. Candidate logged in:
   - Access `/` without forced dashboard redirect.
   - Apply flow from `/jobs/[slug]` unaffected.
3. Recruiter/Admin logged in:
   - Root browse works.
   - Dashboard links remain reachable and correct.
4. Auth:
   - login/register callback paths remain valid.
5. SEO:
   - canonical and sitemap consistency.

## Rollout Steps

1. Enable in staging with both flags on.
2. Run smoke matrix above.
3. Production rollout in low-traffic window.
4. Monitor:
   - 4xx/5xx at `/`, `/jobs`, `/jobs/[slug]`
   - login callback failures
   - drop-off from listing -> detail

## Rollback Plan

1. Re-point nav CTAs back to `/jobs` via route constant toggle.
2. Re-enable old `/jobs` canonical if SEO anomaly observed.
3. If severe auth regression, restore prior root redirect rule.

## Exit Criteria

- No critical regressions in 24h.
- Conversion from listing -> detail stable or improved.
- No spike in auth or routing-related errors.

## Validation Notes

- Completed local lint validation: `pnpm -C apps/web lint`.
- Pending: staging smoke for redirect behavior and auth callback matrix.
