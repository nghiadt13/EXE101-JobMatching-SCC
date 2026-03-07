# API Endpoints

Base URL: `http://localhost:3001/api`

## Authentication

### POST /auth/register

Đăng ký user mới

```json
Request:
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "CANDIDATE" // hoặc "RECRUITER"
}

Response:
{
  "user": { "id", "email", "name", "role" },
  "token": "jwt_token",
  "accessToken": "jwt_token",
  "expiresIn": 604800
}
```

### POST /auth/login

Đăng nhập

```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": { "id", "email", "name", "role" },
  "token": "jwt_token",
  "accessToken": "jwt_token",
  "expiresIn": 604800
}
```

### GET /auth/me

Get authenticated user profile from bearer token.

```json
Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "CANDIDATE"
}
```

## Users (Admin only)

### GET /users

List users với pagination

```json
Response:
{
  "items": [{ "id", "email", "name", "role", "avatar", "createdAt", "updatedAt" }],
  "pagination": { "page": 1, "limit": 20, "totalItems": 10, "totalPages": 1 }
}
```

### GET /users/:id

Get user by ID

### PATCH /users/:id

Update user

```json
Request:
{
  "name": "Updated Name",
  "role": "RECRUITER",
  "avatar": "https://..."
}
```

### DELETE /users/:id

Soft delete user

## Profile

## Shared Error Envelope

All handled API errors now return one stable envelope:

```json
{
  "statusCode": 422,
  "code": "CV_PARSE_FAILED",
  "message": "AI parsing failed for this CV. Upload a readable PDF or DOCX and try again.",
  "requestId": "0f5b9d9e-5e03-4e21-bc7d-4f3272f12345",
  "timestamp": "2026-03-07T10:00:00.000Z",
  "path": "/api/cvs/upload",
  "details": {
    "stage": "normalization"
  }
}
```

Notes:

- `requestId` is returned on every failed request and is also emitted in backend logs.
- `message` is safe to show in the web UI.
- `details` is optional and limited to safe hints such as validation arrays or failure stage metadata.
- Unknown 500s are normalized into the same envelope instead of returning ad hoc Nest payloads.

### GET /profile

Get current user profile

```json
Response:
{
  "id": "uuid",
  "email": "candidate@example.com",
  "name": "Candidate",
  "role": "CANDIDATE",
  "avatar": null,
  "candidate": {
    "phone": "0909...",
    "location": { "city": "Ho Chi Minh" },
    "bio": "..."
  }
}
```

### PATCH /profile

Update current user profile

```json
Request:
{
  "name": "Updated Name",
  "avatar": "https://...",
  "phone": "0909...",
  "location": { "city": "Ho Chi Minh" },
  "bio": "Updated bio"
}
```

## CVs (Candidate only)

### POST /cvs/upload

Upload CV file

```
Content-Type: multipart/form-data
File: cv.pdf hoặc cv.docx
Max size: 5MB
Allowed mime: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
Limit: tối đa 10 CV active / candidate

Response (Success):
{
  "id": "uuid",
  "fileName": "cv.pdf",
  "fileSize": 120000,
  "mimeType": "application/pdf",
  "isPrimary": true,
  "parseStatus": "parsed_ok",
  "skills": ["Python", "Django"],
  "skillAtoms": [
    {"raw": "python", "label": "Python", "canonical": "python", "group": "PROGRAMMING", "source": "cv_parsed"},
    {"raw": "django", "label": "Django", "canonical": "django", "group": "FRAMEWORK", "source": "cv_parsed"}
  ],
  "parsedData": {
    "skills": ["Python", "Django"],
    "experience": [...],
    "education": [...],
    "contact": {},
    "summary": "..."
  },
  "createdAt": "2026-03-07T...",
  "updatedAt": "2026-03-07T..."
}

Response (Parse Error - 422):
{
  "statusCode": 422,
  "code": "CV_PARSE_FAILED",
  "message": "AI parsing failed for this CV. Upload a readable PDF or DOCX and try again.",
  "requestId": "uuid",
  "timestamp": "2026-03-07T...",
  "path": "/api/cvs/upload",
  "details": {
    "stage": "document_processing"
  }
}

Response (Service Unavailable - 503):
{
  "statusCode": 503,
  "code": "AI_SERVICE_UNAVAILABLE",
  "message": "AI service is unavailable right now. Please try again later.",
  "requestId": "uuid",
  "timestamp": "2026-03-07T...",
  "path": "/api/cvs/upload",
  "details": {
    "stage": "normalization"
  }
}
```

### GET /cvs

List CVs của candidate hiện tại với pagination:

```json
{
  "items": [{ "id", "fileName", "fileSize", "mimeType", "skills", "isPrimary", "createdAt", "updatedAt" }],
  "pagination": { "page": 1, "limit": 50, "totalItems": 2, "totalPages": 1 }
}
```

### GET /cvs/:id

Get CV detail

```json
Response:
{
  "id": "uuid",
  "candidateId": "uuid",
  "fileName": "resume.pdf",
  "filePath": "uploads/...",
  "fileSize": 245600,
  "mimeType": "application/pdf",
  "skills": ["TypeScript", "NestJS"],
  "skillAtoms": [...],
  "parsedData": { "summary": "...", "experience": [...], "education": [...] },
  "candidateProfile": {
    "version": "candidate_profile_v1",
    "headline": "Full-Stack Engineer",
    "experience": [...],
    "education": [...],
    "skills": ["TypeScript", "NestJS"],
    "languages": ["English"],
    "location": { "city": "Ho Chi Minh" },
    "warnings": []
  },
  "candidateProfileVersion": "candidate_profile_v1",
  "isPrimary": true,
  "createdAt": "2026-03-07T10:00:00Z",
  "updatedAt": "2026-03-07T10:00:00Z"
}
```

**Note:** `candidateProfile` contains structured candidate data for schema-based matching. This field is populated when CV is uploaded or edited.

### PATCH /cvs/:id

Update parsed data (sau khi review)

```json
Request:
{
  "skills": ["TypeScript", "NestJS"],
  "parsedData": {
    "summary": "Updated summary"
  }
}
```

### DELETE /cvs/:id

Soft delete CV

### POST /cvs/:id/set-primary

Đặt CV làm primary

### CV Error Codes

- `400`: thiếu file, vượt limit active CV, payload invalid
- `401`: chưa đăng nhập
- `403`: role không phải candidate
- `404`: CV không tồn tại hoặc không thuộc candidate hiện tại
- `413`: file vượt quá 5MB
- `415`: sai định dạng file
- `422`: AI parsing failed or file could not be extracted into readable text. No fallback parse is created. User should upload a readable PDF/DOCX and retry.
- `503`: AI provider (Gemini or OpenAI) is unavailable or provider configuration in production is invalid. User should try again later.

## Jobs

### POST /jobs (Recruiter only)

Tạo job mới (manual entry)

```json
Request:
{
  "title": "Senior Backend Developer",
  "description": "...",
  "skills": ["Python", "Django", "PostgreSQL"],
  "location": { "city": "Ho Chi Minh", "remote": false },
  "salaryMin": 2000,
  "salaryMax": 3000,
  "employmentType": "FULL_TIME"
}

Response:
{
  "id": "uuid",
  "title": "Senior Backend Developer",
  "description": "...",
  "skills": ["Python", "Django", "PostgreSQL"],
  "skillAtoms": [
    {"raw": "python", "label": "Python", "canonical": "python", "group": "PROGRAMMING", "source": "job_manual"},
    {"raw": "django", "label": "Django", "canonical": "django", "group": "FRAMEWORK", "source": "job_manual"},
    {"raw": "postgresql", "label": "PostgreSQL", "canonical": "postgresql", "group": "DATABASE", "source": "job_manual"}
  ],
  "requirementsSchema": {
    "version": "requirements_schema_v1",
    "roleTitle": "Senior Backend Developer",
    "summary": "Looking for experienced Python/Django developer with PostgreSQL expertise",
    "mustHaves": [
      {"id": "req-1", "label": "3+ years Python", "category": "experience", "keywords": ["python"], "minimumMonths": 36}
    ],
    "niceToHaves": [...],
    "locationPreference": {"city": "Ho Chi Minh", "country": "Vietnam", "remote": false},
    "warnings": []
  },
  "requirementsSchemaVersion": "requirements_schema_v1",
  "inputMode": "manual",
  "employmentType": "FULL_TIME",
  "status": "DRAFT",
  "parseStatus": "parsed_ok",
  "location": { "city": "Ho Chi Minh", "remote": false },
  "salaryMin": 2000,
  "salaryMax": 3000,
  "normalizedProfile": { ... }
}
```

### POST /jobs/upload (Recruiter only)

Upload JD file để tạo draft job từ PDF hoặc DOCX.

```
Content-Type: multipart/form-data
File: jd.pdf hoặc jd.docx
Max size: 5MB
Allowed mime: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document

Response (Success):
{
  "id": "uuid",
  "title": "Senior Backend Engineer",
  "description": "Parsed summary + requirements draft",
  "skills": ["TypeScript", "NestJS"],
  "skillAtoms": [
    {"raw": "typescript", "label": "TypeScript", "canonical": "typescript", "group": "PROGRAMMING", "source": "job_parsed"},
    {"raw": "nestjs", "label": "NestJS", "canonical": "nestjs", "group": "FRAMEWORK", "source": "job_parsed"}
  ],
  "inputMode": "file_upload",
  "employmentType": "FULL_TIME",
  "status": "DRAFT",
  "parseStatus": "parsed_ok",
  "parseTelemetry": {
    "provider": "gemini",
    "model": "gemini-3.1-flash-lite-preview",
    "latencyMs": 1000
  },
  "normalizedProfile": {
    "schemaVersion": "candidate_job_profile_v1",
    "title": "Senior Backend Engineer",
    "summary": "...",
    "skills": ["TypeScript", "NestJS"],
    "jobMeta": {
      "requirements": ["..."],
      "benefits": ["..."],
      "employmentType": "FULL_TIME"
    }
  }
}

Response (Parse Error - 422):
{
  "statusCode": 422,
  "code": "JD_PARSE_FAILED",
  "message": "AI parsing failed for this JD. Upload a readable PDF or DOCX and try again.",
  "requestId": "uuid",
  "timestamp": "2026-03-07T...",
  "path": "/api/jobs/upload",
  "details": {
    "stage": "document_processing"
  }
}

Response (Service Unavailable - 503):
{
  "statusCode": 503,
  "code": "AI_SERVICE_UNAVAILABLE",
  "message": "AI service is unavailable right now. Please try again later.",
  "requestId": "uuid",
  "timestamp": "2026-03-07T...",
  "path": "/api/jobs/upload",
  "details": {
    "stage": "normalization"
  }
}
```

Flow: upload luôn tạo một `DRAFT` job mới. Recruiter cần review/chỉnh sửa rồi mới publish.

**Note:** `inputMode` indicates whether job was created manually (`manual`) or from file upload (`file_upload`). Used by recruiter UI to display appropriate parse guidance.

### GET /jobs

List jobs

- Public/Candidate: chỉ jobs `PUBLISHED`
- Recruiter: chỉ jobs của chính recruiter, gồm `DRAFT`, `PUBLISHED`, `CLOSED`
- Supports query: `page`, `limit`, `search`, `status` (status filter chỉ có ý nghĩa cho recruiter own list)

### GET /jobs/:id

Get job detail theo `id` hoặc `slug`

```json
Response:
{
  "id": "uuid",
  "title": "Senior Backend Developer",
  "description": "...",
  "skills": ["Python", "Django", "PostgreSQL"],
  "requirementsSchema": {
    "version": "requirements_schema_v1",
    "roleTitle": "Senior Backend Developer",
    "summary": "...",
    "mustHaves": [...],
    "niceToHaves": [...],
    "locationPreference": { ... },
    "warnings": []
  },
  "requirementsSchemaVersion": "requirements_schema_v1",
  "location": { "city": "Ho Chi Minh", "remote": false },
  "status": "DRAFT",
  "publishedAt": null,
  "createdAt": "2026-03-07T10:00:00Z",
  "updatedAt": "2026-03-07T10:00:00Z"
}
```

- Public/Candidate: chỉ truy cập được job `PUBLISHED`
- Recruiter: truy cập được own jobs mọi status

### PATCH /jobs/:id (Recruiter only)

Update job

### DELETE /jobs/:id (Recruiter only)

Soft delete job

### POST /jobs/:id/publish (Recruiter only)

Publish job (chỉ `DRAFT -> PUBLISHED`)

### POST /jobs/:id/close (Recruiter only)

Close job (chỉ `PUBLISHED -> CLOSED`)

### Job Upload Error Codes

- `400`: thiếu file hoặc payload invalid
- `401`: chưa đăng nhập
- `403`: role không phải recruiter
- `413`: file vượt quá 5MB
- `415`: sai định dạng file
- `422`: AI parsing failed or file could not be extracted into readable text. Upload does not create a degraded fallback draft. User should upload a readable PDF/DOCX and retry.
- `503`: AI provider (Gemini or OpenAI) is unavailable or provider configuration in production is invalid. User should try again later.

### Parse Failure Contract

CV upload, JD upload, and job normalization all use one parse-failure contract:

```json
{
  "statusCode": 422,
  "code": "CV_PARSE_FAILED",
  "message": "AI parsing failed for this CV. Upload a readable PDF or DOCX and try again.",
  "requestId": "uuid",
  "timestamp": "2026-03-07T...",
  "path": "/api/cvs/upload",
  "details": {
    "stage": "document_processing"
  }
}
```

The exact message and code vary by CV vs JD flow (`CV_PARSE_FAILED` vs `JD_PARSE_FAILED`), but the API no longer persists fallback parse payloads as successful uploads.

Operational provider failures use a separate contract:

```json
{
  "statusCode": 503,
  "code": "AI_SERVICE_UNAVAILABLE",
  "message": "AI service is unavailable right now. Please try again later.",
  "requestId": "uuid",
  "timestamp": "2026-03-07T...",
  "path": "/api/jobs/upload",
  "details": {
    "stage": "normalization"
  }
}
```

### Debug Flow

1. Capture `requestId` from the web error banner or API response.
2. Search API logs by `requestId`.
3. Inspect the structured log events around that request, especially upload start/failure, normalization failure, rollback, and storage cleanup events.
4. Use `code` plus `details.stage` to distinguish document extraction, normalization, and persistence failures quickly.

### Jobs Error Codes

- `400`: transition invalid hoặc payload invalid
- `401`: chưa đăng nhập cho recruiter endpoints
- `403`: không phải recruiter owner
- `404`: job không tồn tại hoặc không visible với role hiện tại
- `409`: slug conflict

## Applications

### POST /applications (Candidate only)

Apply vào job

```json
Request:
{
  "jobId": "uuid",
  "cvId": "uuid"
}

Response:
{
  "id": "uuid",
  "jobId": "uuid",
  "candidateId": "uuid",
  "cvId": "uuid",
  "matchScore": 92,
  "matchingSnapshot": {
    "version": "schema_v1",
    "scoreBreakdown": {
      "mustHave": 95,
      "niceToHave": 80,
      "experience": 90,
      "education": 100,
      "language": 100,
      "location": 100,
      "final": 92
    },
    "requirements": [
      {
        "id": "req-1",
        "label": "3+ years Python",
        "category": "experience",
        "importance": "must_have",
        "status": "met",
        "evidence": ["Senior Backend Engineer at Corp, 2021-2025 (4 years)"]
      }
    ],
    "strengths": ["Strong Python and Django background"],
    "gaps": ["No PostgreSQL optimization experience"],
    "warnings": []
  },
  "status": "APPLIED",
  "appliedAt": "2026-03-07T10:00:00Z"
}
```

**Schema-based matching (v1):**
- `matchingSnapshot.version: 'schema_v1'` indicates requirement-level evaluation
- `matchingSnapshot.scoreBreakdown` shows component scores for transparency
- `matchingSnapshot.requirements` lists evaluation results for each requirement
- Applications now persist only `matchScore` plus a `schema_v1` `matchingSnapshot`

### GET /applications (Candidate: own, Recruiter: own jobs)

List applications với filters `page`, `limit`, `status`, `jobId`

- Candidate: chỉ thấy own applications
- Recruiter: chỉ thấy applications thuộc own jobs

### GET /applications/:id

Get application detail với same visibility rules như list

### PATCH /applications/:id/status (Recruiter only)

Update application status

```json
{
  "status": "INTERVIEW",
  "notes": "Schedule interview next week"
}
```

Allowed transitions (MVP):

- `APPLIED -> REVIEWING|REJECTED`
- `REVIEWING -> INTERVIEW|REJECTED`
- `INTERVIEW -> OFFER|REJECTED`
- `OFFER -> REJECTED`

### Applications Error Codes

- `400`: payload invalid hoặc status transition invalid
- `401`: chưa đăng nhập
- `403`: sai role cho endpoint
- `404`: application/cv/job không tồn tại hoặc không visible
- `409`: candidate apply trùng job đã apply

## Matching

### POST /matching/calculate

Calculate match score (authenticated internal use)

- `CANDIDATE`: chỉ tính được với CV của chính mình + job `PUBLISHED`
- `RECRUITER`: tính được với mọi CV active + job `PUBLISHED` hoặc job own
- `ADMIN`: tính được với mọi CV/Job active

```json
Request:
{
  "cvId": "uuid",
  "jobId": "uuid"
}

Response:
{
  "score": 78.5,
  "matchingVersion": "schema_v1",
  "warnings": [],
  "matchingSnapshot": {
    "version": "schema_v1",
    "scoreBreakdown": {
      "mustHave": 80,
      "niceToHave": 70,
      "experience": 75,
      "education": 100,
      "language": 100,
      "location": 100,
      "final": 78.5
    },
    "requirements": [
      {
        "id": "req-1",
        "label": "Python + Django",
        "category": "skill",
        "importance": "must_have",
        "status": "met",
        "evidence": ["Python", "Django"]
      }
    ],
    "strengths": ["Strong Python and Django background"],
    "gaps": ["No Kubernetes production evidence"],
    "warnings": []
  }
}
```

**Note:** Response includes `matchingSnapshot` for audit trail and UI display. The `matchingVersion` field is currently always `schema_v1`.

### Matching Error Codes

- `400`: payload invalid (`cvId`/`jobId` thiếu hoặc rỗng)
- `401`: chưa đăng nhập
- `404`: CV/Job không tồn tại hoặc không visible với actor hiện tại

## Dashboard

### GET /dashboard/stats (Role-based)

Get dashboard statistics for authenticated role (`CANDIDATE`, `RECRUITER`, `ADMIN`).

**Candidate:**

```json
{
  "totalApplications": 5,
  "pendingApplications": 2,
  "interviewCount": 1
}
```

**Recruiter:**

```json
{
  "totalJobs": 10,
  "activeJobs": 7,
  "totalApplications": 45,
  "pendingReview": 12
}
```

**Admin:**

```json
{
  "totalUsers": 100,
  "totalRecruiters": 20,
  "totalCandidates": 75,
  "totalJobs": 50,
  "totalApplications": 200
}
```

### Dashboard Error Codes

- `401`: chưa đăng nhập hoặc thiếu token
- `403`: role không hợp lệ cho endpoint
- `404`: candidate chưa có candidate profile
