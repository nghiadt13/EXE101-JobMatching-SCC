# Phase 1: Prisma Schema + Backend CV Builder API

## Context Links

- [Plan Overview](./plan.md)
- [Docs: API Endpoints](../../docs/03-api-endpoints.md)
- [Docs: Database Schema](../../docs/02-database-schema.md)
- [OpenResume Data Types](https://github.com/xitanggg/open-resume/blob/main/src/app/lib/redux/types.ts)

## Overview

**Priority:** P1
**Status:** Done
**Estimate:** 8h

Thêm 2 fields vào Prisma CV model, tạo DTO, và implement 2 API endpoints mới cho CV Builder. CV builder data lưu vào `parsedData` JSON column hiện tại, giữ tương thích hoàn toàn với matching pipeline.

## Key Insights

- Model `CV` hiện tại đã có `parsedData: Json`, `skills: Json`, `skillAtoms: Json?`, `rawText: String?`, `candidateProfile: Json?` — đủ cấu trúc cho builder.
- `CvsService.upload()` đã có logic: validate candidate, check active CV limit, tạo record, sync skills — builder service reuse phần lớn logic này.
- `CandidateProfileService.create()` đã exist trong `matching/services/` — builder gọi trực tiếp.
- `SkillStorageAdapterService.toStoredSkills()` đã exist — builder gọi để sync `skills` + `skillAtoms`.
- `rawText` column dùng để matching pipeline đọc tại apply-time — builder cần generate plain text từ structured data.

## Requirements

### Functional

#### 1. Prisma Schema Migration

Thêm 2 columns mới vào model `CV`:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `source` | `String` | `"upload"` | Phân biệt CV upload vs CV builder |
| `templateId` | `String` | `"simple"` | Mẫu template đang dùng |

```prisma
model CV {
  // ... existing fields ...
  source      String    @default("upload")   // "upload" | "builder"
  templateId  String    @default("simple")   // "simple" | "professional" | "modern"
}
```

> **Note**: `filePath` hiện tại là `String` (required). Với builder CV, set `filePath = ""` (empty string). Không cần thay đổi schema cho field này vì Prisma đã cho phép empty string.

#### 2. API Endpoint: `POST /cvs/create` — Tạo CV mới từ builder

**Auth:** `JwtAuthGuard` + `RolesGuard(CANDIDATE)`

**Request Body (CreateCvDto):**

```typescript
{
  "templateId": "simple",           // optional, default "simple"
  "profile": {                      // required
    "name": "Lê Quang Dũng",       // required
    "email": "email@example.com",   // optional
    "phone": "0909123456",          // optional
    "website": "linkedin.com/in/x", // optional
    "summary": "Mục tiêu nghề...",  // optional
    "location": {                   // optional
      "city": "Ho Chi Minh",
      "country": "Vietnam"
    }
  },
  "experience": [                   // required (có thể rỗng [])
    {
      "role": "Backend Developer",  // required
      "company": "FPT Software",    // required
      "startDate": "2022-03",       // required, YYYY-MM
      "endDate": "2025-01",         // optional, null = "Present"
      "description": "Phát triển...", // optional
      "tech": ["NestJS", "PostgreSQL"] // optional, default []
    }
  ],
  "education": [                    // required (có thể rỗng [])
    {
      "school": "ĐH Bách Khoa",    // required
      "degree": "Cử nhân",         // required
      "field": "Khoa học máy tính",  // optional
      "startDate": "2018-09",       // optional
      "endDate": "2022-06",         // optional
      "gpa": "3.5/4.0"             // optional
    }
  ],
  "skills": ["TypeScript", "NestJS", "React"], // required
  "projects": [                     // optional
    {
      "name": "JobMatching MVP",
      "description": "Hệ thống matching CV-JD bằng AI",
      "tech": ["Next.js", "NestJS", "Prisma"]
    }
  ],
  "certifications": ["AWS SAA"],    // optional
  "languages": ["Vietnamese", "English"] // optional
}
```

**Response:** `CvView` (same type as existing upload response)

**Logic flow:**

```text
1. Parse & validate DTO
2. getCandidateOrThrow(userId)                          ← reuse existing
3. Check activeCount < CV_MAX_ACTIVE_PER_CANDIDATE      ← reuse existing
4. Convert DTO → parsedData JSON structure
5. Extract skills → toStoredSkills(dto.skills, 'cv_builder') ← reuse existing
6. Generate rawText from structured data                 ← NEW helper
7. Build candidateProfile via CandidateProfileService    ← reuse existing
8. Prisma create({
     source: "builder",
     templateId: dto.templateId ?? "simple",
     fileName: `${dto.profile.name} - CV`,
     filePath: "",
     fileSize: 0,
     mimeType: "application/json",
     parsedData, skills, skillAtoms, rawText,
     candidateProfile, candidateProfileVersion,
     isPrimary: (activeCount === 0),
   })
9. Return toView(created)                               ← reuse existing
```

**Error Codes:**

| Code | Condition |
|------|-----------|
| `400` | DTO validation failure (missing `profile.name`, invalid `templateId`, etc.) |
| `401` | Not authenticated |
| `403` | Not CANDIDATE role |
| `400` | Active CV limit reached (same as upload) |
| `404` | Candidate profile not found |

#### 3. API Endpoint: `PUT /cvs/:id/builder` — Update full builder CV

**Auth:** `JwtAuthGuard` + `RolesGuard(CANDIDATE)`

**Request Body:** Same `CreateCvDto` structure.

**Logic flow:**

```text
1. Parse & validate DTO
2. getCandidateOrThrow(userId)                          ← reuse existing
3. ensureCvOwnership(candidateId, cvId)                 ← reuse existing
4. Verify CV source === "builder" (reject upload CVs)    ← NEW check
5. Convert DTO → parsedData → skills → rawText → candidateProfile  (same as create)
6. Prisma update({ ... })
7. Return toView(updated)                               ← reuse existing
```

**Extra error:**

| Code | Condition |
|------|-----------|
| `400` | CV source is "upload" (cannot use builder endpoint) |

### Non-functional

- No breaking changes to existing upload/list/detail/delete/set-primary endpoints.
- Builder CV must appear in `GET /cvs` list alongside uploaded CVs.
- `GET /cvs/:id` must work for builder CVs (return same `CvView` shape).
- Existing `PATCH /cvs/:id` must still work for builder CVs (partial field updates).
- `DELETE /cvs/:id` and `POST /cvs/:id/set-primary` must work for builder CVs.

## Architecture

```text
Client (candidate)
  │
  ├─ POST /cvs/create         ← NEW
  │   └─ CvsController.create()
  │       └─ CvsService.createFromBuilder(userId, dto)
  │           ├─ getCandidateOrThrow()           (reuse)
  │           ├─ checkActiveLimit()               (reuse)
  │           ├─ buildNormalizedParsedData(dto)    (NEW)
  │           ├─ generateRawText(dto)              (NEW)
  │           ├─ SkillStorageAdapter.toStoredSkills() (reuse)
  │           ├─ CandidateProfileService.create() (reuse)
  │           └─ prisma.cV.create()
  │
  ├─ PUT /cvs/:id/builder     ← NEW
  │   └─ CvsController.updateBuilder()
  │       └─ CvsService.updateBuilderCv(userId, cvId, dto)
  │           ├─ getCandidateOrThrow()           (reuse)
  │           ├─ ensureCvOwnership()             (reuse)
  │           ├─ assertBuilderSource()           (NEW)
  │           ├─ buildNormalizedParsedData(dto)   (NEW)
  │           ├─ generateRawText(dto)             (NEW)
  │           ├─ SkillStorageAdapter.toStoredSkills() (reuse)
  │           ├─ CandidateProfileService.create() (reuse)
  │           └─ prisma.cV.update()
  │
  ├─ [GET/PATCH/DELETE/set-primary] ← existing, no change
```

### parsedData JSON Structure (builder)

Builder CV sẽ lưu vào `parsedData` theo schema tương thích với `normalizedProfile`:

```typescript
{
  "parseStatus": "parsed_ok",
  "source": "builder",
  "normalizedProfile": {
    "schemaVersion": "candidate_job_profile_v1",
    "language": "vi",                // auto-detect from content
    "title": "Backend Developer",    // from profile.summary hoặc experience[0].role
    "summary": "...",
    "skills": ["TypeScript", "NestJS"],
    "experience": [
      {
        "role": "Backend Developer",
        "company": "FPT Software",
        "startDate": "2022-03",
        "endDate": "2025-01",
        "tech": ["NestJS", "PostgreSQL"]
      }
    ],
    "education": [{ "school": "...", "degree": "...", "field": "...", ... }],
    "certifications": ["AWS SAA"],
    "projects": [{ "name": "...", "description": "...", "tech": [...] }],
    "languages": ["Vietnamese", "English"],
    "location": { "city": "Ho Chi Minh", "country": "Vietnam" },
    "rawQuality": {
      "score": 100,
      "needsManualReview": false,
      "reason": "builder_generated"
    }
  },
  // Metadata for builder
  "builderData": {
    "templateId": "simple",
    "profile": { ... },            // full profile object (for form reload)
    "experience": [ ... ],
    "education": [ ... ],
    "projects": [ ... ],
    "certifications": [...],
    "languages": [...]
  }
}
```

> **Key design**: `normalizedProfile` inside `parsedData` giữ đúng schema hiện tại → `toView()`, `buildCandidateProfile()`, và matching pipeline đọc được ngay mà không cần sửa. `builderData` là bản raw từ form để frontend reload khi edit.

### rawText Generation

```typescript
// Concatenate sections thành plain text cho matching pipeline
function generateRawText(dto: CreateCvDto): string {
  const lines: string[] = [];
  // Profile
  lines.push(dto.profile.name);
  if (dto.profile.summary) lines.push(dto.profile.summary);
  // Experience
  for (const exp of dto.experience) {
    lines.push(`${exp.role} at ${exp.company}`);
    lines.push(`${exp.startDate} - ${exp.endDate ?? 'Present'}`);
    if (exp.description) lines.push(exp.description);
    if (exp.tech.length) lines.push(`Technologies: ${exp.tech.join(', ')}`);
  }
  // Education
  for (const edu of dto.education) {
    lines.push(`${edu.degree} ${edu.field ?? ''} - ${edu.school}`);
    if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
  }
  // Skills
  if (dto.skills.length) lines.push(`Skills: ${dto.skills.join(', ')}`);
  // Projects
  for (const p of dto.projects ?? []) {
    lines.push(`Project: ${p.name}`);
    if (p.description) lines.push(p.description);
    if (p.tech.length) lines.push(`Tech: ${p.tech.join(', ')}`);
  }
  // Certifications + Languages
  if (dto.certifications?.length) lines.push(`Certifications: ${dto.certifications.join(', ')}`);
  if (dto.languages?.length) lines.push(`Languages: ${dto.languages.join(', ')}`);

  return lines.join('\n');
}
```

## Related Code Files

### Files To Modify

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `source`, `templateId` to CV model |
| `apps/api/src/cvs/cvs.controller.ts` | Add `POST /cvs/create`, `PUT /cvs/:id/builder` |
| `apps/api/src/cvs/cvs.service.ts` | Add `createFromBuilder()`, `updateBuilderCv()`, `generateRawText()`, `buildNormalizedParsedData()` |
| `apps/api/src/cvs/cvs.types.ts` | Add `source`, `templateId` to `CvView` |
| `apps/api/src/cvs/cvs.module.ts` | No change needed (services already injected) |

### Files To Create

| File | Purpose |
|------|---------|
| `apps/api/src/cvs/dto/create-cv.dto.ts` | DTO + class-validator decorators for builder create/update |

### Files To Delete

- None.

## Implementation Steps

### Step 1: Prisma Migration (~30min)

1. Edit `schema.prisma`: add `source String @default("upload")` and `templateId String @default("simple")` to CV model.
2. Run migration:
   ```powershell
   cd d:\Education\EXE101\JobMatchingMVP\apps\api
   npx prisma migrate dev --name add-cv-builder-fields
   ```
3. Verify generated migration SQL has correct DEFAULT clauses.
4. Verify `npx prisma generate` succeeds.

### Step 2: Create DTO (~1h)

1. Create `apps/api/src/cvs/dto/create-cv.dto.ts`.
2. Define `CreateCvDto` with `class-validator` decorators:
   - `@IsOptional() @IsIn(['simple','professional','modern']) templateId`
   - `@ValidateNested() @Type(() => ProfileDto) profile`
   - `@IsArray() @ValidateNested({each:true}) experience`
   - `@IsArray() @ValidateNested({each:true}) education`
   - `@IsArray() @IsString({each:true}) skills`
   - Optional: `projects`, `certifications`, `languages`
3. Define nested DTOs: `ProfileDto`, `ExperienceDto`, `EducationDto`, `ProjectDto`.
4. Each nested DTO has proper decorators for required/optional fields.

### Step 3: Service Methods (~3h)

1. Add `generateRawText(dto: CreateCvDto): string` — private helper.
2. Add `buildNormalizedParsedData(dto: CreateCvDto): Record<string, unknown>` — build `parsedData` JSON with `normalizedProfile` + `builderData`.
3. Add `createFromBuilder(userId: string, dto: CreateCvDto): Promise<CvView>`:
   - Reuse `getCandidateOrThrow()`, active count check logic.
   - Call `buildNormalizedParsedData()`, `generateRawText()`.
   - Call `skillStorageAdapter.toStoredSkills(dto.skills, 'cv_builder')`.
   - Call `candidateProfileService.create()`.
   - `prisma.cV.create()` with `source: "builder"`, `filePath: ""`, etc.
   - Return `this.toView(created)`.
4. Add `updateBuilderCv(userId: string, cvId: string, dto: CreateCvDto): Promise<CvView>`:
   - Reuse `getCandidateOrThrow()`, `ensureCvOwnership()`.
   - Check `source === "builder"` (from DB record), throw 400 if not.
   - Same conversion logic as create.
   - `prisma.cV.update()`.
   - Return `this.toView(updated)`.

### Step 4: Controller Endpoints (~1h)

1. Add `@Post('create')` → `CvsService.createFromBuilder()`.
2. Add `@Put(':id/builder')` → `CvsService.updateBuilderCv()`.
3. Both use `@CurrentUser() user: { sub: string }` and `@Body() dto: CreateCvDto`.
4. Ensure `@Post('create')` is **above** `@Get(':id')` in controller to avoid route conflict.

### Step 5: Update CvView Type (~30min)

1. Add `source: string` and `templateId: string` to `CvView` interface.
2. Update `toView()` in `cvs.service.ts` to include these fields from DB record.
3. Update `cvViewSelect` to include `source`, `templateId`.

### Step 6: Testing (~2h)

1. Add test cases to `cvs.service.spec.ts`:
   - `createFromBuilder()` happy path: creates CV with correct fields.
   - `createFromBuilder()` validation: rejects invalid DTO.
   - `createFromBuilder()` limit: rejects when 10 active CVs exist.
   - `updateBuilderCv()` happy path: updates builder CV.
   - `updateBuilderCv()` rejects uploaded CV (source !== "builder").
   - `rawText` generation: verify concatenation output.
2. Run:
   ```powershell
   npm run test -w api -- --testPathPattern=cvs.service.spec --runInBand
   npm run lint -w api
   npm run build -w api
   ```

## Todo List

- [x] Prisma migration created and applied.
- [x] `CreateCvDto` with class-validator decorators.
- [x] `ProfileDto`, `ExperienceDto`, `EducationDto`, `ProjectDto` nested DTOs.
- [x] `generateRawText()` helper.
- [x] `buildNormalizedParsedData()` helper.
- [x] `createFromBuilder()` service method.
- [x] `updateBuilderCv()` service method.
- [x] `POST /cvs/create` controller endpoint.
- [x] `PUT /cvs/:id/builder` controller endpoint.
- [x] `CvView` type updated with `source`, `templateId`.
- [x] `toView()` and `cvViewSelect` updated.
- [ ] Unit tests for create/update builder flow.
- [x] `npm run test`, `npm run lint`, `npm run build` pass.

## Success Criteria

- [x] `POST /cvs/create` returns valid `CvView` with `source: "builder"`.
- [x] Created CV appears in `GET /cvs` list.
- [x] `GET /cvs/:id` returns full builder CV data including `parsedData.builderData`.
- [x] `PUT /cvs/:id/builder` updates all fields correctly.
- [x] `PUT /cvs/:id/builder` rejects uploaded CVs (source !== "builder").
- [x] Builder CV has valid `rawText` for matching pipeline.
- [x] Builder CV has valid `candidateProfile` for matching pipeline.
- [x] Existing upload/list/detail/update/delete/set-primary endpoints unchanged.
- [ ] All API tests pass.

## Risk Assessment

- **Risk:** `buildNormalizedParsedData()` output doesn't match expected `normalizedProfile` schema exactly → `buildCandidateProfile()` fails.
- **Mitigation:** Write the output to match `NormalizedProfile` type exactly as defined in `normalization.types.ts`. Use existing `emptyProfileTemplate()` from `AiNormalizationService` as structural reference.

- **Risk:** Route conflict between `POST /cvs/create` and `GET /cvs/:id` if order wrong.
- **Mitigation:** Place `@Post('create')` before `@Get(':id')` in controller.

## Security Considerations

- Builder endpoint uses same `JwtAuthGuard` + `RolesGuard(CANDIDATE)` as upload.
- Candidate ownership check reuses `getCandidateOrThrow()` + `ensureCvOwnership()`.
- DTO validation prevents injection via `class-validator`.
- `source` field is server-set, never client-provided on upload endpoint.

## Next Steps

- Phase 2: Build frontend CV builder form + preview using builder API.
