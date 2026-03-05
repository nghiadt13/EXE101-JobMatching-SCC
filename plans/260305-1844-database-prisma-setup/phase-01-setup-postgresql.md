# Phase 1: Setup PostgreSQL Database

## Context Links
- [Plan Overview](./plan.md)
- [Docs: Database Schema](../../docs/02-database-schema.md)

## Overview

**Priority:** 🔴 Critical
**Status:** ⬜ Pending
**Thời gian ước tính:** 10 phút

Setup PostgreSQL database cho development. Có 2 options: local hoặc Railway (cloud).

## Requirements

### Functional Requirements
- PostgreSQL database running và accessible
- Database connection string available
- Database user với full permissions

### Non-functional Requirements
- Fast connection (<100ms latency)
- Persistent storage
- Easy to reset/recreate cho development

## Architecture

```
Option 1: Local PostgreSQL
- Install PostgreSQL 16+
- Create database: hr_recruitment_dev
- User: postgres / custom user

Option 2: Railway (Cloud)
- Free tier: 500MB storage
- Automatic backups
- Public connection string
```

## Related Code Files

### Files to Create
- `apps/api/.env` (database connection string)

## Implementation Steps

### Option 1: Local PostgreSQL (Recommended for Dev)

#### 1. Install PostgreSQL
**Windows:**
```bash
# Download từ https://www.postgresql.org/download/windows/
# Hoặc dùng Chocolatey
choco install postgresql

# Hoặc dùng Scoop
scoop install postgresql
```

**Verify installation:**
```bash
psql --version
# Output: psql (PostgreSQL) 16.x
```

#### 2. Create Database
```bash
# Login as postgres user
psql -U postgres

# Trong psql console:
CREATE DATABASE hr_recruitment_dev;
CREATE USER hr_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hr_recruitment_dev TO hr_user;

# Exit
\q
```

#### 3. Test Connection
```bash
psql -U hr_user -d hr_recruitment_dev -h localhost
```

#### 4. Create .env File
```bash
cd apps/api
```

Tạo file `.env`:
```env
# Database
DATABASE_URL="postgresql://hr_user:your_password@localhost:5432/hr_recruitment_dev?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Gemini API
GEMINI_API_KEY="your-gemini-api-key-here"

# App
PORT=3001
NODE_ENV="development"
```

### Option 2: Railway (Cloud)

#### 1. Create Railway Account
- Đăng ký tại https://railway.app
- Login với GitHub

#### 2. Create PostgreSQL Database
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init

# Add PostgreSQL
railway add postgresql
```

#### 3. Get Connection String
```bash
railway variables

# Copy DATABASE_URL
```

#### 4. Create .env File
```env
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
JWT_SECRET="your-jwt-secret"
GEMINI_API_KEY="your-gemini-key"
PORT=3001
NODE_ENV="development"
```

## Todo List

- [ ] Chọn option (Local hoặc Railway)
- [ ] Install PostgreSQL (nếu local)
- [ ] Create database
- [ ] Create user với permissions
- [ ] Test connection
- [ ] Tạo file `apps/api/.env`
- [ ] Add DATABASE_URL vào .env
- [ ] Add JWT_SECRET vào .env
- [ ] Verify connection string format

## Success Criteria

- [ ] PostgreSQL database running
- [ ] Có thể connect với psql hoặc pgAdmin
- [ ] `.env` file created với DATABASE_URL
- [ ] Connection string format đúng
- [ ] Database accessible từ NestJS app

## Environment Variables

```env
# Required
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="random-secret-key-min-32-chars"
GEMINI_API_KEY="your-api-key"

# Optional
PORT=3001
NODE_ENV="development"
```

## Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public

Examples:
- Local: postgresql://hr_user:password@localhost:5432/hr_recruitment_dev?schema=public
- Railway: postgresql://postgres:pass@containers-us-west-123.railway.app:5432/railway?schema=public
```

## Troubleshooting

### Cannot connect to PostgreSQL
```bash
# Check if PostgreSQL is running
# Windows:
services.msc  # Look for "postgresql-x64-16"

# Check port
netstat -an | grep 5432
```

### Authentication failed
- Verify username/password
- Check pg_hba.conf for authentication method
- Restart PostgreSQL service

### Database does not exist
```bash
# List databases
psql -U postgres -l

# Create if missing
psql -U postgres -c "CREATE DATABASE hr_recruitment_dev;"
```

## Risk Assessment

**Risks:**
- PostgreSQL installation issues trên Windows
- Port 5432 đã được sử dụng
- Permission issues với database user

**Mitigation:**
- Dùng Railway nếu local setup phức tạp
- Change port nếu conflict
- Grant proper permissions khi create user

## Security Notes

- **NEVER** commit `.env` file vào git
- Add `.env` vào `.gitignore`
- Use strong passwords cho production
- Rotate JWT_SECRET regularly

## Next Steps

Sau khi hoàn thành phase này:
- Phase 2: Create Prisma Schema
- Test connection với Prisma
