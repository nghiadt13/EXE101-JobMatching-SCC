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
  "code": "AI_NORMALIZATION_FAILED",
  "message": "AI parsing failed for this CV. Upload a readable PDF or DOCX and try again."
}

Response (Service Unavailable - 503):
{
  "code": "AI_SERVICE_UNAVAILABLE",
  "message": "AI service is unavailable right now. Please try again later."
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
  "code": "AI_NORMALIZATION_FAILED",
  "message": "AI parsing failed for this JD. Upload a readable PDF or DOCX and try again."
}

Response (Service Unavailable - 503):
{
  "code": "AI_SERVICE_UNAVAILABLE",
  "message": "AI service is unavailable right now. Please try again later."
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
  "code": "AI_NORMALIZATION_FAILED",
  "message": "AI parsing failed for this CV. Upload a readable PDF or DOCX and try again."
}
```

The exact message varies slightly by CV vs JD flow, but the API no longer persists fallback parse payloads as successful uploads.

Operational provider failures use a separate contract:

```json
{
  "code": "AI_SERVICE_UNAVAILABLE",
  "message": "AI service is unavailable right now. Please try again later."
}
```

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
  "matchScore": 78,
  "tfidfScore": 0.72,
  "skillsScore": 0.85,
  "matchingSnapshot": {
    "version": "v2",
    "componentScores": {
      "tfidf": 0.72,
      "skills": 0.85,
      "final": 78
    },
    "topMatchedSkills": ["python", "django", "postgresql"],
    "missingSkills": ["kubernetes"],
    "warnings": []
  },
  "status": "APPLIED"
}
```

**Warnings in matchingSnapshot:**
- Empty array `[]` if both CV and Job have canonical skillAtoms
- Contains `"CV skills missing canonical atoms"` if CV lacks skillAtoms (matching used fallback derivation)
- Contains `"Job skills missing canonical atoms"` if Job lacks skillAtoms (matching used fallback derivation)
- Recruiters should reprocess CVs/Jobs with warnings before relying on the matching score for hiring decisions

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
  "finalScorePercent": 78.5,
  "tfidfScore": 0.72,
  "skillsScore": 0.85,
  "matchingVersion": "v2",
  "warnings": [],
  "breakdown": {
    "matchedSkills": ["python", "django"],
    "missingSkills": ["kubernetes"]
  },
  "matchingSnapshot": {
    "version": "v2",
    "componentScores": {
      "tfidf": 0.72,
      "skills": 0.85,
      "final": 78.5
    },
    "topMatchedSkills": ["python", "django", "postgresql"],
    "missingSkills": ["kubernetes"],
    "warnings": []
  }
}
```

**Note:** Response includes `matchingSnapshot` for audit trail and UI display. The `matchingVersion` field indicates algorithm version used (legacy or v2).

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
