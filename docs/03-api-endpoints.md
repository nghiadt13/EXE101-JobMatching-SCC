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
  "token": "jwt_token"
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
  "token": "jwt_token"
}
```

## Users (Admin only)

### GET /users
List users với pagination

### GET /users/:id
Get user by ID

### PATCH /users/:id
Update user

### DELETE /users/:id
Soft delete user

## Profile

### GET /profile
Get current user profile

### PATCH /profile
Update current user profile

## CVs (Candidate only)

### POST /cvs/upload
Upload CV file
```
Content-Type: multipart/form-data
File: cv.pdf hoặc cv.docx

Response:
{
  "id": "uuid",
  "fileName": "cv.pdf",
  "parsedData": {
    "skills": ["Python", "Django"],
    "experience": [...],
    "education": [...]
  }
}
```

### GET /cvs
List CVs của candidate hiện tại

### GET /cvs/:id
Get CV detail

### PATCH /cvs/:id
Update parsed data (sau khi review)

### DELETE /cvs/:id
Soft delete CV

### POST /cvs/:id/set-primary
Đặt CV làm primary

## Jobs

### POST /jobs (Recruiter only)
Tạo job mới
```json
{
  "title": "Senior Backend Developer",
  "description": "...",
  "skills": ["Python", "Django", "PostgreSQL"],
  "location": { "city": "Ho Chi Minh", "remote": false },
  "salaryMin": 2000,
  "salaryMax": 3000,
  "employmentType": "FULL_TIME"
}
```

### GET /jobs
List jobs (public: chỉ PUBLISHED, recruiter: all own jobs)

### GET /jobs/:id
Get job detail

### PATCH /jobs/:id (Recruiter only)
Update job

### DELETE /jobs/:id (Recruiter only)
Soft delete job

### POST /jobs/:id/publish (Recruiter only)
Publish job (DRAFT → PUBLISHED)

### POST /jobs/:id/close (Recruiter only)
Close job (PUBLISHED → CLOSED)

## Applications

### POST /applications (Candidate only)
Apply vào job
```json
{
  "jobId": "uuid",
  "cvId": "uuid"
}

Response:
{
  "id": "uuid",
  "matchScore": 78.5,
  "breakdown": {
    "tfidfScore": 0.72,
    "skillsScore": 0.85
  }
}
```

### GET /applications (Candidate: own, Recruiter: own jobs)
List applications với filters

### GET /applications/:id
Get application detail

### PATCH /applications/:id/status (Recruiter only)
Update application status
```json
{
  "status": "INTERVIEW",
  "notes": "Schedule interview next week"
}
```

## Matching

### POST /matching/calculate
Calculate match score (internal use)
```json
{
  "cvId": "uuid",
  "jobId": "uuid"
}

Response:
{
  "score": 78.5,
  "tfidfScore": 0.72,
  "skillsScore": 0.85,
  "breakdown": {
    "matchedSkills": ["Python", "Django"],
    "missingSkills": ["Kubernetes"]
  }
}
```

## Dashboard

### GET /dashboard/stats (Role-based)
Get dashboard statistics

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
  "totalJobs": 50,
  "totalApplications": 200
}
```
