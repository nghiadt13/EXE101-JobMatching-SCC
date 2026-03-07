# Phase 4: Web Contract Adoption - API Client And Dashboard Error Surfacing

## Context Links

- Base client: `apps/web/lib/api-client.ts`
- Jobs client: `apps/web/lib/jobs-client.ts`
- CV client: `apps/web/lib/cv-client.ts`
- Recruiter pages: `apps/web/app/dashboard/recruiter/jobs/page.tsx`, `apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx`
- Candidate page: `apps/web/app/dashboard/candidate/cvs/page.tsx`

## Overview

- Priority: P1
- Status: Planned
- Brief: teach the web app to preserve backend error metadata, reduce fallback-to-generic banners, and display debug-friendly messages without degrading UX.

## Key Insights

- Current `ApiError` only stores `message` and `status`, so backend `code`, `details`, and future `requestId` disappear immediately.
- Current dashboard pages map many outcomes by status code only, then redirect to generic `error=` values such as `upload-failed` or `save-failed`.
- The current approach is adequate for MVP, but poor for debugging because the useful backend reason never survives the roundtrip.

## Requirements

### Functional Requirements

- Extend web API client to parse the shared backend envelope.
- Preserve `code`, `requestId`, and optional `details` in thrown `ApiError`.
- Update key pages to prefer backend message/code over generic status-only fallbacks.
- Keep user-safe copy and avoid dumping raw server internals in the UI.

### Non-Functional Requirements

- Minimize churn in existing server actions and pages.
- Continue to support redirects where they are already the page pattern.
- Keep FE behavior deterministic when backend sends unknown codes.

## Architecture

- `ApiError` target shape:
  - `status`
  - `code`
  - `message`
  - `requestId`
  - `details`
- UI surfacing strategy:
  - keep semantic buckets like parse/service/validation for copy where useful
  - preserve raw backend `message` in the redirect state or URL-safe encoding only when acceptable
  - prefer a small reusable banner component or formatter helper over duplicating switch statements on every page

## Related Code Files

- Modify: `apps/web/lib/api-client.ts`
- Modify: `apps/web/lib/jobs-client.ts`
- Modify: `apps/web/lib/cv-client.ts`
- Modify: `apps/web/app/dashboard/recruiter/jobs/page.tsx`
- Modify: `apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx`
- Modify: `apps/web/app/dashboard/candidate/cvs/page.tsx`
- Create: optional shared formatter/helper under `apps/web/lib/errors/*`

## Implementation Steps

1. Upgrade `ApiError` and response parsing to keep the full backend envelope.
2. Decide how server actions preserve error metadata across redirects without bloating URLs.
3. Replace status-only handling in recruiter and candidate upload/save pages with code-aware handling.
4. Standardize banner formatting so users see actionable text and engineers can see request id.
5. Leave a safe generic fallback for truly unknown errors.

## Todo List

- [ ] Upgrade shared `ApiError` model.
- [ ] Add reusable FE formatter for backend errors.
- [ ] Refactor recruiter job pages to stop collapsing common failures to `upload-failed` and `save-failed`.
- [ ] Refactor candidate CV page with the same contract.

## Success Criteria

- FE preserves backend context instead of losing it at the fetch boundary.
- Generic failure banners become the exception, not the default path.
- A user-reported screenshot with request id is enough to find the matching backend log line.

## Risk Assessment

- Biggest risk: stuffing too much raw server detail into URLs or banners.
- Mitigation: show safe backend message plus request id; keep detailed objects out of URL query strings.

## Security Considerations

- Do not surface stack traces, raw exception names, SQL fragments, or provider payloads to the browser.
- Treat `details` as allowlisted display data, not arbitrary dump output.

## Next Steps

- After FE adoption, lock the behavior with tests/docs and add an operator-facing debug checklist in Phase 5.
