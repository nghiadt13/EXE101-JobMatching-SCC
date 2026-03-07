# Phase 1: Contract Lock - Error Envelope, Correlation, Redaction, And UX Rules

## Context Links

- Related plan: `plans/260307-1428-llm-only-normalization-error-surfacing-openai-provider/plan.md`
- API docs: `docs/03-api-endpoints.md`
- Current backend entrypoint: `apps/api/src/main.ts`
- Current frontend consumers: `apps/web/lib/api-client.ts`, `apps/web/app/dashboard/recruiter/jobs/page.tsx`, `apps/web/app/dashboard/candidate/cvs/page.tsx`

## Overview

- Priority: P1
- Status: Planned
- Brief: define one non-negotiable contract for error payloads and logging context before touching implementation files.

## Key Insights

- Backend currently has no global exception filter in `main.ts`, so payload shape is largely whatever each exception happens to serialize to.
- Frontend `ApiError` currently preserves only `status` and one message string, so `code`, `details`, and any correlation id are lost immediately.
- Recruiter and candidate pages still map many failures to coarse query params like `upload-failed`, `parse-failed`, and `service-unavailable`.

## Requirements

### Functional Requirements

- Define a shared API error envelope for all handled exceptions.
- Define which fields are always present and which are optional.
- Define a request correlation mechanism for every API request.
- Define FE behavior for showing user-safe message, debug request id, and optional field-level details.

### Non-Functional Requirements

- No secrets, bearer tokens, raw CV text, or raw JD text in logs.
- Error envelope must be stable across controllers and simple to assert in tests.
- Contract must work for both validation errors and domain/service failures.

## Architecture

- Standard envelope:
  - `statusCode`: number
  - `code`: stable machine-readable string
  - `message`: user-safe string
  - `requestId`: correlation id generated or forwarded per request
  - `details`: optional safe object or array for field/debug hints
  - `timestamp`: ISO string
  - `path`: request path
- Logging context minimum:
  - `requestId`, route, actor id if authenticated, domain entity id if known, provider/model if AI flow, file metadata only when safe
- FE display policy:
  - show backend `message`
  - show short `requestId`
  - optionally map `code` to friendlier copy only when backend message is too generic

## Related Code Files

- Modify: `apps/api/src/main.ts`
- Modify: `apps/web/lib/api-client.ts`
- Modify: `apps/web/lib/jobs-client.ts`
- Modify: `apps/web/lib/cv-client.ts`
- Create: shared backend error/logging contract files under `apps/api/src/common/`
- Delete: none

## Implementation Steps

1. Lock the canonical error envelope and publish it in docs before implementation starts.
2. Enumerate initial shared error codes for upload, parse, validation, storage, auth, and persistence failures.
3. Define redaction policy for logs: safe metadata only, never raw document body or secret env values.
4. Define correlation strategy: accept incoming header when trusted or generate request id server-side.
5. Define FE rendering rules for banner copy, inline validation details, and request-id display.

## Todo List

- [ ] Decide exact error envelope fields and required/optional semantics.
- [ ] Freeze first batch of reusable error codes.
- [ ] Freeze log redaction rules.
- [ ] Freeze FE display rules for message, code, and request id.

## Success Criteria

- Every later phase can target one documented contract instead of inventing per-flow payloads.
- Team can answer “what do we log?” and “what does FE show?” without ambiguity.

## Risk Assessment

- Biggest risk: overdesigning the envelope. Keep it small and enforceable.
- Mitigation: start with fields already needed by current pain points and no more.

## Security Considerations

- Do not log raw request bodies for multipart/document endpoints.
- Treat filenames as low-risk metadata, but still avoid logging full storage paths when unnecessary.

## Next Steps

- Feed the locked contract directly into the global exception filter and request-context middleware in Phase 2.
