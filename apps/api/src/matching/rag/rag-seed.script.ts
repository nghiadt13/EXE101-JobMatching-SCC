require("dotenv").config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { RAG_KNOWLEDGE_BASE } from './rag-knowledge.seed';
import { GeminiClientService } from '../../normalization/gemini-client.service';
import { ConfigService } from '@nestjs/config';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const config = new ConfigService();
  const gemini = new GeminiClientService();

  console.log('Clearing existing RAG Knowledge...');
  await prisma.ragKnowledge.deleteMany({});
  console.log('Starting RAG Knowledge Seed...');

  for (const item of RAG_KNOWLEDGE_BASE) {
    console.log(`Processing item: ${item.title}...`);
    try {
      // 1. Generate embedding for the content + title
      const textToEmbed = `Title: ${item.title}. Content: ${item.content}. Tags: ${item.tags.join(', ')}`;
      const embedding = await gemini.generateEmbedding(textToEmbed);

      // 2. Insert into DB and set vector using raw SQL
      // Using a transaction to insert the row then update its vector
      await prisma.$transaction(async (tx) => {
        const row = await tx.ragKnowledge.create({
          data: {
            kind: item.kind,
            title: item.title,
            content: item.content,
            source: item.source,
            tags: item.tags,
          },
        });

        // Convert array to pgvector format '[v1,v2,...]'
        const vectorString = `[${embedding.join(',')}]`;
        
        await tx.$executeRawUnsafe(
          `UPDATE "RagKnowledge" SET embedding = $1::vector WHERE id = $2`,
          vectorString,
          row.id
        );
      });

      console.log(`Successfully seeded ${item.title}`);
    } catch (error) {
      console.error(`Failed to seed ${item.title}:`, error);
    }
    // Delay to avoid Gemini API rate limit (15 RPM on free tier = 1 req / 4s)
    await new Promise(resolve => setTimeout(resolve, 4500));
  }

  console.log('RAG Knowledge Seed Complete.');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
