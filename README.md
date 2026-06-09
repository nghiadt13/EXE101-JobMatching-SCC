# Smart Job Matching Platform - SCC

Hệ thống tuyển dụng thông minh tích hợp AI hỗ trợ chuẩn hóa dữ liệu hồ sơ và tự động đề xuất, đánh giá độ phù hợp (matching) chuyên sâu giữa CV và Job Description.

## Tech Stack & AI Infrastructure

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS + NextAuth.js v5 (Credentials + Google & Facebook OAuth)
- **Backend**: NestJS + TypeScript + Prisma ORM
- **Database**: PostgreSQL (tích hợp tiện ích mở rộng **pgvector** hỗ trợ tìm kiếm ngữ nghĩa)
- **AI Engine & LLM Providers**:
  - **DeepSeek API**:
    - **DeepSeek Pro** (`deepseek-v4-pro`): Sử dụng cho đánh giá chi tiết độ phù hợp CV và JD với lập luận sắc bén và phân tích chiều sâu.
    - **DeepSeek Flash** (`deepseek-v4-flash`): Trích xuất, chuẩn hóa thông tin CV/JD đa định dạng (PDF/Docx) hiệu năng cao giúp giảm tối đa thời gian chờ của người dùng khi tải CV lên.
  - **Google Gemini API**:
    - **Gemini Embedding** (`gemini-embedding-2`): Tạo vector embedding 768 chiều cho CV và Job Description để thực hiện tìm kiếm ngữ nghĩa.
    - **Gemini Pro/Flash**: Dự phòng hoặc cấu hình linh hoạt cho việc chuẩn hóa và đánh giá qua biến môi trường.
- **Matching Pipeline**: Đề xuất việc làm thông minh dựa trên tìm kiếm ngữ nghĩa (Cosine Similarity) kết hợp Hậu lọc ngành nghề tự động (AI Category Post-Filter) và Đánh giá chi tiết 2 tầng (Two-Stage Matching Pipeline).
- **Storage**: Local filesystem (MVP)

## Core Features

- **Authentication + RBAC**: Hỗ trợ Admin, Nhà tuyển dụng (Recruiter), Ứng viên (Candidate) và Đăng nhập mạng xã hội (Google, Facebook OAuth).
- **Smart CV Builder**: Tải lên CV (PDF/Docx), tự động phân tích bằng AI, chỉnh sửa và tạo bản CV chuẩn hóa trực quan.
- **Smart Job Search**: Tìm kiếm việc làm thông minh bằng từ khóa kết hợp bộ lọc (mức lương, vị trí, cấp bậc, ngành nghề).
- **Smart Job Match (Tìm kiếm việc thông minh)**: Đề xuất việc làm tự động bằng Vector Search (Cosine Similarity) dựa trên kỹ năng và hồ sơ ứng viên.
- **Two-Stage AI Evaluation (Đánh giá CV chi tiết)**:
  - **Tầng 1 (Lọc & Phân loại)**: Vector Search kết hợp AI Hard-Filter theo ngành nghề ngăn chặn tình trạng đề xuất sai lệch chéo ngành (ví dụ: IT match sang Sales).
  - **Tầng 2 (Đánh giá chuyên sâu)**: Sử dụng DeepSeek Pro chấm điểm và đưa ra bằng chứng chi tiết bằng tiếng Việt (2-3 câu phân tích sâu sắc cho từng yêu cầu và 3-4 câu đánh giá tổng quan).
- **Recruitment Lifecycle**: Quản lý quy trình ứng tuyển từ nộp đơn, duyệt hồ sơ đến cập nhật trạng thái ứng viên.

## AI Matching Docs

- [AI matching review notes](apps/api/src/matching/docs/ai-matching-review-notes.md)
- [AI matching mini eval plan](apps/api/src/matching/docs/mini-eval-plan.md)
- [RAG implementation phases](apps/api/src/matching/docs/rag-implementation-phases.md)
- [Matching performance notes](apps/api/src/matching/docs/matching-performance-notes.md)

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop
- PowerShell (commands below assume PowerShell)

## Quick Start (Clone -> Run Full Stack)

### 1. Install dependencies

```powershell
npm install
```

### 2. Start PostgreSQL with Docker (standard local DB)

This project expects PostgreSQL at `localhost:5433` and database name `job_matching`.

```powershell
docker run -d `
  --name jobmatching-postgres-5433 `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=job_matching `
  -p 5433:5432 `
  -v jobmatching_pgdata:/var/lib/postgresql/data `
  postgres:16
```

If container already exists (as in your Docker Desktop screenshot), just start it:

```powershell
docker start jobmatching-postgres-5433
```

### 3. Configure environment variables

Create file `apps/api/.env` with:

```dotenv
NODE_ENV=development
PORT=3001
WEB_URL=http://localhost:3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/job_matching"

JWT_SECRET=change-me
JWT_EXPIRES_IN=1h

LLM_PROVIDER=gemini
CV_PARSE_LLM_PROVIDER=deepseek
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.1-flash-lite-preview
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_FAST_MODEL=deepseek-v4-flash
```

Create file `apps/web/.env` with:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WEB_URL=http://localhost:3000
AUTH_SECRET=change-me
```

### 4. Run Prisma migration + seed (required)

```powershell
Set-Location apps/api
npx prisma migrate dev
npm run seed
Set-Location ../..
```

### 5. Run backend + frontend

Terminal 1 (API):

```powershell
npm run dev:api
```

Terminal 2 (Web):

```powershell
npm run dev:web
```

Open:

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api`

### 6. Verify quickly

- Web loads at `http://localhost:3000`
- API responds at `http://localhost:3001/api`
- Login with demo account in section `Demo Accounts`

## Environment Setup (Details)

### 1. API (`apps/api`)

Required variables:

- `DATABASE_URL` (use `postgresql://postgres:postgres@localhost:5433/job_matching`)
- `JWT_SECRET`
- `WEB_URL` (default `http://localhost:3000`)
- `PORT` (default `3001` recommended for local)
- `LLM_PROVIDER` (`gemini`, `kimi`, or `deepseek`; default `gemini`) for general AI normalization and JD/CV evaluation
- `CV_PARSE_LLM_PROVIDER` (`deepseek`, `gemini`, or `kimi`; default `deepseek`) for uploaded CV parsing
- `GEMINI_API_KEY` (required when `LLM_PROVIDER=gemini`)
- `GEMINI_MODEL` (default `gemini-3.1-flash-lite-preview`)
- `DEEPSEEK_API_KEY` (required when `CV_PARSE_LLM_PROVIDER=deepseek` or `LLM_PROVIDER=deepseek`)
- `DEEPSEEK_FAST_MODEL` (default `deepseek-v4-flash`)
- `KIMI_API_KEY` (required when using `kimi`)

AI parse workflow (current):

1. Extract text from source (`PDF/DOCX` for CV, form text for JD)
2. For uploaded CVs, send extracted text to `CV_PARSE_LLM_PROVIDER` (default `deepseek-v4-flash`) in a background parse task
3. For job normalization and JD/CV evaluation, use `LLM_PROVIDER`
4. Normalize LLM JSON output to internal schema
5. Persist normalized payload for matching

If the LLM returns invalid JSON, or the extracted file content cannot be parsed, the API now fails explicitly with a parse error. If the configured provider is unavailable or misconfigured, the API returns a service-unavailable error instead of pretending the file was unreadable. The system no longer saves synthetic fallback parses.

API failures now use one shared error envelope with `statusCode`, `code`, `message`, `requestId`, `timestamp`, and `path`. The web upload flows surface the backend `message` plus `requestId`, so you can correlate a user-visible failure directly with backend logs.

### 2. Web (`apps/web`)

Required variables:

- `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`)
- `AUTH_SECRET` (or `NEXTAUTH_SECRET`)

Example (PowerShell):

```powershell
$env:NEXT_PUBLIC_API_URL='http://localhost:3001/api'
$env:AUTH_SECRET='local-auth-secret'
```

## Database Init + Seed

Run in `apps/api`:

```powershell
npx prisma migrate dev
npm run seed
```

Seed tạo sẵn dữ liệu demo deterministic cho 3 vai trò.

## Run Locally

Dùng 2 terminal.

Terminal 1 (API):

```powershell
npm run start:dev -w api
```

Terminal 2 (Web):

```powershell
npm run dev -w web
```

Open:

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api`

## Demo Accounts

- Admin: `admin@example.com` / `password123`
- Recruiter A: `recruiter.alpha@example.com` / `password123`
- Recruiter B: `recruiter.beta@example.com` / `password123`
- Candidate Anna: `candidate.anna@example.com` / `password123`
- Candidate Bao: `candidate.bao@example.com` / `password123`

## Quality Gates

```powershell
npm run lint -w api
npm run test -w api -- --runInBand
npm run test:e2e -w api -- --runInBand
npm run build -w api
npm run lint -w web
$env:AUTH_SECRET='local-test-secret-for-build-only'; npm run build -w web
```

## Troubleshooting

- Error `JWT_SECRET is required`: thiếu env ở API terminal.
- Error `Missing AUTH_SECRET`: thiếu env ở Web terminal hoặc khi build web.
- Error kết nối DB: kiểm tra `DATABASE_URL`, DB service, và migration state.
- Nếu dùng Docker DB mà API không kết nối được:
  - kiểm tra container đang chạy: `docker ps`
  - kiểm tra đúng mapping `5433:5432`
  - kiểm tra `DATABASE_URL` đúng `localhost:5433/job_matching`
- CORS lỗi khi login: kiểm tra `WEB_URL` ở API đúng với URL web.
- Dashboard/API data bất thường: rerun seed rồi restart API/Web.
- Upload/save failure needs root cause: capture the `Request ID` shown in the web banner, then grep API logs for that id.

## Documentation

1. [Tổng quan](docs/01-tong-quan.md)
2. [Database Schema](docs/02-database-schema.md)
3. [API Endpoints](docs/03-api-endpoints.md)
4. [Matching Algorithm](docs/04-matching-algorithm.md)
5. [Implementation Checklist](docs/05-implementation-checklist.md)
6. [Release Readiness Acceptance Matrix](docs/06-release-readiness-acceptance-matrix.md)
7. [MVP Demo Script](docs/07-mvp-demo-script.md)
