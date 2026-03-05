# Phase 5: Setup Prisma Service

## Context Links
- [Plan Overview](./plan.md)
- [Phase 3: Run Migrations](./phase-03-run-migrations.md)

## Overview

**Priority:** 🔴 Critical
**Status:** ⬜ Pending
**Thời gian ước tính:** 10 phút

Tạo PrismaService trong NestJS để manage database connections và integrate Prisma Client.

## Requirements

### Functional Requirements
- PrismaService extends PrismaClient
- Proper connection lifecycle management
- Global module export
- Injectable service

### Non-functional Requirements
- Connection pooling
- Graceful shutdown
- Error handling

## Implementation Steps

### 1. Create PrismaService

Tạo file `apps/api/src/prisma/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✓ Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('✓ Disconnected from database');
  }
}
```

### 2. Create PrismaModule

Tạo file `apps/api/src/prisma/prisma.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 3. Import vào AppModule

Update `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 4. Test trong Controller

Update `apps/api/src/app.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('health')
  async healthCheck() {
    const userCount = await this.prisma.user.count();
    return {
      status: 'ok',
      database: 'connected',
      users: userCount,
    };
  }
}
```

### 5. Test Connection

```bash
cd apps/api

# Start dev server
npm run start:dev

# Test health endpoint
curl http://localhost:3001/health
```

## Todo List

- [ ] Create `src/prisma/prisma.service.ts`
- [ ] Create `src/prisma/prisma.module.ts`
- [ ] Import PrismaModule vào AppModule
- [ ] Add health check endpoint
- [ ] Start dev server
- [ ] Test database connection
- [ ] Verify queries hoạt động

## Success Criteria

- [ ] PrismaService injectable
- [ ] Database connection established on startup
- [ ] Health check endpoint returns data
- [ ] Can query database từ controllers
- [ ] Graceful shutdown hoạt động

## Testing

```bash
# Start server
npm run start:dev

# Should see:
# ✓ Connected to database
# Application is running on: http://localhost:3001

# Test health
curl http://localhost:3001/health

# Expected response:
# {
#   "status": "ok",
#   "database": "connected",
#   "users": 3
# }
```

## Troubleshooting

### Cannot connect to database
- Check DATABASE_URL trong .env
- Verify PostgreSQL is running
- Test connection với psql

### PrismaClient not found
```bash
npx prisma generate
```

### Module import errors
- Verify PrismaModule is @Global()
- Check imports trong AppModule

## Next Steps

Sau khi hoàn thành:
- Implement authentication module
- Create user CRUD endpoints
- Build API features
