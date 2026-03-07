# Phase 2: Backend Foundation - Request Context, Global Exception Filter, And Logger Helpers

## Context Links

- Entrypoint: `apps/api/src/main.ts`
- Current controller example: `apps/api/src/jobs/jobs.controller.ts`
- Current service logging examples: `apps/api/src/jobs/jobs.service.ts`, `apps/api/src/cvs/cvs.service.ts`, `apps/api/src/normalization/ai-normalization.service.ts`

## Overview

- Priority: P1
- Status: Planned
- Brief: establish shared backend plumbing so all downstream services can emit correlated logs and consistent error responses with minimal repeated code.

## Key Insights

- `main.ts` only sets prefix, CORS, and validation pipe today; no global filter or request logging layer exists.
- Services already use Nest `Logger`, but logs are plain strings and do not carry common context such as request id or actor id.
- Without a filter, thrown `HttpException` payloads and unexpected errors serialize inconsistently.

## Requirements

### Functional Requirements

- Add request correlation middleware or interceptor.
- Add global exception filter that normalizes handled and unhandled errors into the shared envelope.
- Add reusable logging helpers or a thin application logger wrapper that accepts structured context.
- Preserve current HTTP status behavior while improving payload shape.

### Non-Functional Requirements

- Keep implementation light; no heavy logger library migration unless existing Nest logger becomes a blocker.
- Safe defaults for redaction and truncation.
- Low friction for domain services to adopt.

## Architecture

- Request path:
  - inbound request
  - correlation middleware/interceptor assigns `requestId`
  - route/service emits logs with shared context helper
  - exception filter converts thrown error to stable envelope
  - response returns `requestId`
- Suggested shared backend modules:
  - `common/http/request-context.*`
  - `common/http/global-exception.filter.*`
  - `common/errors/app-error.*`
  - `common/logging/app-logger.*`

## Related Code Files

- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/src/app.module.ts` if provider wiring needs global registration
- Create: `apps/api/src/common/http/*`
- Create: `apps/api/src/common/errors/*`
- Create: `apps/api/src/common/logging/*`
- Delete: none

## Implementation Steps

1. Add request correlation id generation and response propagation header.
2. Add a global exception filter that handles `HttpException`, domain `AppError`, Prisma-known errors, and unknown exceptions.
3. Add a compact logger helper that emits message plus structured context in a consistent shape.
4. Add one request lifecycle log for write endpoints: start, success, failure.
5. Make validation errors conform to the same envelope with safe `details`.

## Todo List

- [ ] Create request context primitive.
- [ ] Create global exception filter.
- [ ] Create shared app-error shape or mapper.
- [ ] Register backend foundation in bootstrap/module wiring.

## Success Criteria

- A thrown exception from any controller returns the shared envelope.
- Logs from a failed request can be grouped by request id.
- Unknown 500s stop returning opaque, shape-shifting payloads.

## Risk Assessment

- Biggest risk: request context implementation becomes brittle across async boundaries.
- Mitigation: keep the design simple and test representative async service paths.

## Security Considerations

- Filter must hide stack traces from API responses in non-debug environments.
- If request headers are logged, explicitly redact authorization and cookie values.

## Next Steps

- Apply the new helpers to jobs, cvs, normalization, documents, and Prisma error hotspots in Phase 3.
