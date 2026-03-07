# Phase 4: Web UX, Surface AI/API Failures In CV And JD Flows

## Context Links

- `job-matching/apps/web/components/cv/cv-upload-form.tsx`
- `job-matching/apps/web/components/cv/cv-list.tsx`
- `job-matching/apps/web/components/cv/cv-edit-form.tsx`
- `job-matching/apps/web/components/jobs/jd-upload-form.tsx`
- `job-matching/apps/web/components/jobs/recruiter-job-form.tsx`
- `job-matching/apps/web/components/jobs/recruiter-jobs-table.tsx`
- `job-matching/apps/web/lib/cv-client.ts`
- `job-matching/apps/web/lib/jobs-client.ts`

## Overview

**Priority:** P1  
**Status:** Completed  
**Estimate:** 3h  
**Completed:** 2026-03-07

Make upload and review flows show clear AI/API failure reasons so users know whether to retry, switch file, or return later.

## Key Insights

- Current API client types still expose fallback-oriented statuses and telemetry.
- Current upload forms are minimal and can only surface a generic failure unless request errors are normalized.
- Existing pages already use query-string/banner patterns that can be reused instead of adding a full new notification system.

## File Ownership

- `apps/web/app/dashboard/candidate/cvs/page.tsx`
- `apps/web/app/dashboard/recruiter/jobs/page.tsx`
- `apps/web/app/dashboard/recruiter/jobs/[id]/page.tsx`
- `apps/web/components/cv/cv-upload-form.tsx`
- `apps/web/components/cv/cv-list.tsx`
- `apps/web/components/jobs/jd-upload-form.tsx`
- `apps/web/components/jobs/recruiter-jobs-table.tsx`
- `apps/web/components/jobs/recruiter-job-form.tsx`
- `apps/web/lib/cv-client.ts`
- `apps/web/lib/jobs-client.ts`

## Requirements

- Reuse the existing query-string banner pattern where practical.
- Differentiate file validation issues from the single parse/API failure contract.
- Remove UI language that implies fallback parse is a supported success state.

## Architecture

- API clients normalize backend errors into stable message keys or message payloads, but only one parse-failure branch is required.
- Upload forms redirect or render inline messages using existing page/banner conventions.
- Review/list screens stop rendering fallback telemetry as a valid parse badge and instead focus on parse status or explicit failure feedback.

## Related Code Files

- Modify: candidate CV pages/forms and recruiter JD pages/forms to show actionable AI/API errors.
- Modify: `apps/web/lib/cv-client.ts` and `apps/web/lib/jobs-client.ts` types to remove fallback-specific UI assumptions.
- Possibly modify: route pages to preserve error query params across redirects after failed upload attempts.

## Implementation Steps

1. Map backend error codes/messages to stable query params or form-state messages.
2. Extend CV upload page messaging beyond generic `upload-failed`.
3. Add equivalent recruiter JD upload messaging.
4. Update list/detail badges and helper copy so `fallback` is no longer shown as a normal parse result.
5. Ensure manual edit surfaces still work after hard parse failures.

## Todo List

- [x] Define stable frontend message mapping for file validation vs parse/API failure.
- [x] Update candidate CV upload flow to show actionable error states.
- [x] Update recruiter JD upload flow to show actionable error states.
- [x] Remove fallback badges/copy from list and detail surfaces.
- [x] Verify edit flows remain usable after a failed parse attempt.

## Success Criteria

- Candidate and recruiter flows both expose actionable parse/API errors.
- No screen presents fallback parse as a successful degraded mode.

## Risk Assessment

- If backend errors are not normalized, frontend messaging will become brittle.

## Security Considerations

- UI messages must stay safe and user-facing. No raw provider stack traces, prompts, or secret-bearing text.
- Retry guidance should not encourage users to leak sensitive CV/JD content into ad-hoc debug channels.

## Unresolved Questions

- Whether recruiter job detail page should preserve failed upload context after redirect.

## Next Steps

- Use the contract from Phase 1 and backend codes from Phase 2 to keep UI mapping deterministic and testable.