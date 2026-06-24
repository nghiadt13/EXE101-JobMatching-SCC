import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { AppLogger } from '../common/logging/app-logger.service';

const SUPABASE_DIRECT_HOST_PATTERN = /^db\.[a-z0-9]+\.supabase\.co$/;

function resolveDatabaseConnectionString(): string {
  const connectionString =
    process.env['DATABASE_URL'] ??
    'postgresql://postgres:postgres@localhost:5432/postgres';

  assertProductionDatabaseUrl(connectionString);

  return connectionString;
}

function assertProductionDatabaseUrl(connectionString: string): void {
  const isRender = Boolean(
    process.env['RENDER'] || process.env['RENDER_SERVICE_ID'],
  );
  if (!isRender) {
    return;
  }

  let databaseUrl: URL;
  try {
    databaseUrl = new URL(connectionString);
  } catch {
    throw new Error(
      'DATABASE_URL is not a valid PostgreSQL connection string.',
    );
  }

  if (SUPABASE_DIRECT_HOST_PATTERN.test(databaseUrl.hostname)) {
    throw new Error(
      'Render cannot reliably connect to Supabase direct database host ' +
        databaseUrl.hostname +
        ' because it resolves to IPv6 and fails with ENETUNREACH. ' +
        'Use the Supabase Connection Pooler URL in Render DATABASE_URL instead, ' +
        'for example postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require.',
    );
  }
}

const REQUIRED_SCHEMA_COLUMNS = [
  { tableName: 'CV', columnName: 'skillAtoms' },
  { tableName: 'Job', columnName: 'skillAtoms' },
  { tableName: 'Application', columnName: 'matchingSnapshot' },
] as const;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly logger: AppLogger) {
    const connectionString = resolveDatabaseConnectionString();
    const pool = new Pool({ connectionString });

    super({
      adapter: new PrismaPg(pool),
    });
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    await this.$connect();
    await this.validateSchemaCompatibility();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async validateSchemaCompatibility() {
    const existingColumns = await this.$queryRaw<
      Array<{ table_name: string; column_name: string }>
    >`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'CV' AND column_name = 'skillAtoms')
          OR (table_name = 'Job' AND column_name = 'skillAtoms')
          OR (table_name = 'Application' AND column_name = 'matchingSnapshot')
        )
    `;

    const existing = new Set(
      existingColumns.map(
        (entry) => `${entry.table_name}.${entry.column_name}`,
      ),
    );
    const missing = REQUIRED_SCHEMA_COLUMNS.filter(
      (entry) => !existing.has(`${entry.tableName}.${entry.columnName}`),
    );

    if (missing.length === 0) {
      return;
    }

    const missingColumns = missing
      .map((entry) => `${entry.tableName}.${entry.columnName}`)
      .join(', ');

    this.logger.error('database_schema_out_of_date', {
      missingColumns,
    });

    throw new Error(
      `Database schema is out of date. Missing columns: ${missingColumns}. Run \`npx prisma migrate deploy\` in apps/api before starting the API.`,
    );
  }
}
