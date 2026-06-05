import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString =
  process.env['DATABASE_URL'] ??
  'postgresql://postgres:postgres@localhost:5432/postgres';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const GEMINI_API_KEY = process.env['GEMINI_API_KEY'] || '';

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-2',
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      }),
    },
  );
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const err = (payload['error'] as any)?.message || 'Embedding request failed';
    throw new Error(`Gemini embedding failed: ${err}`);
  }
  const embedding = payload['embedding'] as Record<string, unknown> | undefined;
  const values = embedding?.['values'];
  if (!Array.isArray(values)) throw new Error('Failed to extract embedding values');
  return values as number[];
}

async function syncJobs() {
  // Find jobs without embeddings
  const jobsWithoutEmbedding = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Job" WHERE embedding IS NULL AND status = 'PUBLISHED'`
  );

  console.log(`📦 Found ${jobsWithoutEmbedding.length} jobs without embeddings`);

  for (const row of jobsWithoutEmbedding) {
    const job = await prisma.job.findUnique({ where: { id: row.id } });
    if (!job) continue;

    const skillsArray = Array.isArray(job.skills) ? job.skills : [];
    const textToEmbed = [
      `Title: ${job.title}`,
      `Description: ${(job.shortDescription || job.description).slice(0, 1000)}`,
      `Skills: ${(skillsArray as string[]).join(', ')}`,
    ].filter(Boolean).join('. ');

    try {
      const embedding = await generateEmbedding(textToEmbed);
      const vectorString = `[${embedding.join(',')}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE "Job" SET embedding = $1::vector WHERE id = $2`,
        vectorString,
        job.id,
      );
      console.log(`  ✅ Job: ${job.title}`);
    } catch (error) {
      console.error(`  ❌ Job ${job.title}:`, (error as Error).message);
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function syncCvs() {
  const cvsWithoutEmbedding = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "CV" WHERE embedding IS NULL AND "deletedAt" IS NULL`
  );

  console.log(`📄 Found ${cvsWithoutEmbedding.length} CVs without embeddings`);

  for (const row of cvsWithoutEmbedding) {
    const cv = await prisma.cV.findUnique({ where: { id: row.id } });
    if (!cv) continue;

    const parsed = typeof cv.parsedData === 'object' && cv.parsedData !== null ? cv.parsedData : {};
    const title = (parsed as any).title || (parsed as any).headline || '';
    const summary = (parsed as any).summary || '';
    const skillsArray = Array.isArray(cv.skills) ? cv.skills : [];

    const textToEmbed = [
      title ? `Role: ${title}` : '',
      summary ? `Summary: ${summary.slice(0, 1000)}` : '',
      `Skills: ${(skillsArray as string[]).join(', ')}`,
    ].filter(Boolean).join('. ');

    try {
      const embedding = await generateEmbedding(textToEmbed);
      const vectorString = `[${embedding.join(',')}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE "CV" SET embedding = $1::vector WHERE id = $2`,
        vectorString,
        cv.id,
      );
      console.log(`  ✅ CV: ${cv.fileName}`);
    } catch (error) {
      console.error(`  ❌ CV ${cv.fileName}:`, (error as Error).message);
    }

    await new Promise((r) => setTimeout(r, 500));
  }
}

async function main() {
  console.log('🔄 Syncing vector embeddings for all Jobs and CVs...\n');

  if (!GEMINI_API_KEY) {
    console.error('❌ No GEMINI_API_KEY or GOOGLE_AI_API_KEY found in .env');
    process.exit(1);
  }

  await syncJobs();
  console.log('');
  await syncCvs();

  console.log('\n✅ Vector sync complete!');
  await prisma.$disconnect();
}

main().catch(console.error);
