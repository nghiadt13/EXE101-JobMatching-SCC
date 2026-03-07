# Phase 5: Tests, Docs, Rollout, And Operational Debugging Checklist

## Context Links

- README: `README.md`
- API docs: `docs/03-api-endpoints.md`
- Checklist: `docs/05-implementation-checklist.md`
- Relevant specs: `apps/api/src/jobs/jobs.service.spec.ts`, `apps/api/src/cvs/cvs.service.spec.ts`, web/client tests if present

## Overview

- Priority: P1
- Status: Planned
- Brief: lock the new contract into tests and docs so the logging/error improvements remain stable and usable by future debugging sessions.

## Key Insights

- Current docs describe some AI error codes, but do not define a general error envelope or explain correlation/request ids.
- The repo already has command gates in README; this phase should extend them with contract assertions rather than invent a new process.

## Requirements

### Functional Requirements

- Add tests for the shared backend error envelope.
- Add tests for representative domain mappings in JD upload, CV upload, and job save flows.
- Update docs to show the new error shape and debugging workflow.
- Add a short operational checklist for reproducing and tracing user-reported failures.

### Non-Functional Requirements

- Tests should assert contract shape, not brittle full-log strings.
- Docs should stay concise and operationally useful.

## Architecture

- Validation targets:
  - backend returns stable envelope for 422, 503, and unexpected 500
  - FE `ApiError` preserves `code` and `requestId`
  - key pages display safe backend message and request id
- Operational checklist:
  - capture request id from UI
  - grep API logs by request id
  - inspect operation, actor, file metadata, and error code

## Related Code Files

- Modify: `README.md`
- Modify: `docs/03-api-endpoints.md`
- Modify: `docs/05-implementation-checklist.md`
- Modify: relevant API specs and web tests
- Create: none unless a small debugging note is warranted inside existing docs

## Implementation Steps

1. Add backend tests for shared envelope and representative domain mappings.
2. Add FE tests or narrow utility tests for new `ApiError` parsing and formatting helpers.
3. Update README and API docs with the new envelope, request id semantics, and debugging steps.
4. Update implementation checklist/release notes so manual QA explicitly verifies error banners and request-id visibility.
5. Define rollout sequence: foundation first, domains second, FE third, then docs/test lock.

## Todo List

- [ ] Add contract tests for 422, 503, and 500 envelopes.
- [ ] Add FE tests for envelope parsing and formatting.
- [ ] Update docs with error envelope and request-id based debug flow.
- [ ] Add manual QA checklist for upload/save failures.

## Success Criteria

- Future regressions in error shape are caught by tests.
- Docs tell engineers exactly how to trace a user-visible failure back to backend logs.

## Risk Assessment

- Biggest risk: docs drift if implementation changes the envelope late.
- Mitigation: update docs in the same implementation pass that finalizes the shared contract.

## Security Considerations

- Documentation examples must not include real secrets, real file paths, or sensitive production payloads.

## Next Steps

- After this phase, the system should be ready for real bug-fix work with materially better diagnostic quality and smoother UX.