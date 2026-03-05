# Phase 2: API CV Module And File Storage Flow

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1](./phase-01-cv-contract-and-upload-security-baseline.md)
- [Docs: Database Schema](../../docs/02-database-schema.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)

## Overview

**Priority:** P1  
**Status:** ✅ Completed  
**Estimate:** 4h

Build CV backend endpoints with safe upload storage and ownership enforcement.

## Key Insights

- Existing API architecture already separates controller/service/dto/types cleanly.
- `CV` table already supports soft delete and primary flag.
- Role guards exist and can be reused (`@Roles(UserRole.CANDIDATE)`).
- Current app has no file-storage abstraction yet.

## Requirements

### Functional

- Create `cvs` module with candidate-only endpoints:
  - upload, list, detail, update parsed data, soft delete, set-primary.
- Implement disk storage strategy for CV files under configurable upload directory.
- Persist CV metadata: `fileName`, `filePath`, `fileSize`, `mimeType`.
- Enforce candidate ownership on all CV operations.
- Ensure set-primary is atomic and only affects candidate's own active CVs.
- Ensure delete keeps system valid:
  - If deleted CV is primary and another active CV exists, promote newest remaining CV.

### Non-functional

- Upload endpoint must reject unsupported mime and oversize files early.
- DB and file operations should avoid inconsistent state.
- API response must not leak internal storage path.

## Architecture

```text
CVController
  -> JwtAuthGuard + RolesGuard(CANDIDATE)
  -> FileInterceptor (upload)
  -> CVService
     -> CVStorageService (write/delete file)
     -> PrismaService (CV CRUD + transactions)
```

## Related Code Files

### Files To Modify

- `apps/api/src/app.module.ts`
- `apps/api/src/auth/decorators/current-user.decorator.ts` (only if typing tweaks required)

### Files To Create

- `apps/api/src/cvs/cvs.module.ts`
- `apps/api/src/cvs/cvs.controller.ts`
- `apps/api/src/cvs/cvs.service.ts`
- `apps/api/src/cvs/cvs.types.ts`
- `apps/api/src/cvs/cvs.constants.ts`
- `apps/api/src/cvs/dto/query-cvs.dto.ts`
- `apps/api/src/cvs/dto/update-cv.dto.ts`
- `apps/api/src/cvs/services/cv-storage.service.ts`

### Files To Delete

- None.

## Implementation Steps

1. Scaffold `cvs` module/controller/service/types/dto files.
2. Add `CVStorageService` to:
   - Resolve safe upload directory.
   - Generate deterministic stored file names.
   - Save and delete files with sanitized behavior.
3. Implement `POST /cvs/upload` with `FileInterceptor` and validation:
   - mime + extension whitelist
   - size limit
   - candidate CV count limit
4. Implement list/detail endpoints scoped by candidate and `deletedAt: null`.
5. Implement parsed data update endpoint with payload sanitization.
6. Implement soft delete with primary fallback handling.
7. Implement set-primary using Prisma transaction:
   - unset all candidate active CVs
   - set selected CV as primary
8. Wire `CvsModule` into `AppModule` and export API response shapes.

## Todo List

- [ ] `cvs` module scaffolded and wired.
- [ ] Upload endpoint with strict validation implemented.
- [ ] Candidate ownership enforced across all endpoints.
- [ ] Atomic primary switching implemented.
- [ ] Soft-delete behavior validated.

## Success Criteria

- [ ] Candidate can fully manage own CVs via API.
- [ ] Cross-user CV access is blocked with `404`/`403` behavior as designed.
- [ ] Primary CV invariants hold under concurrent requests.

## Risk Assessment

- **Risk:** File written but DB create fails, leaving orphan file.
- **Mitigation:** Best-effort cleanup on persistence failure and clear error handling.

- **Risk:** Concurrent set-primary requests can conflict.
- **Mitigation:** Use single Prisma transaction for unset/set operations.

## Security Considerations

- Never trust `originalname` for storage path.
- Keep uploaded file names random/unique to avoid collisions.
- Do not return `filePath` in API payloads.
- Validate candidate identity from JWT only, not client payload.

## Next Steps

- Add parsing and Gemini normalization pipeline on top of upload flow.

## Unresolved Questions

- None.
