import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiClientService } from '../../normalization/gemini-client.service';
import {
  RagRetrievalInput,
  RetrievedRagContext,
  RetrievedRagItem,
} from './rag.types';

const DEFAULT_MAX_ITEMS = 8;
const MAX_TEXT_CHARS = 4000;

@Injectable()
export class RagRetrieverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiClientService,
  ) {}

  async retrieve(input: RagRetrievalInput): Promise<RetrievedRagContext> {
    const warnings: string[] = [];
    const maxItems = Math.max(1, Math.min(input.maxItems ?? DEFAULT_MAX_ITEMS, 20));

    // Combine all inputs into a single text block to generate an embedding
    const queryText = [
      ...(input.jdSkills ?? []),
      ...(input.cvSkills ?? []),
      (input.jdText ?? '').slice(0, MAX_TEXT_CHARS),
      (input.cvText ?? '').slice(0, MAX_TEXT_CHARS),
    ].filter(Boolean).join(' ');

    if (!queryText.trim()) {
      return {
        items: [],
        queryTerms: [],
        warnings: ['No query terms available for RAG retrieval.'],
      };
    }

    try {
      // 1. Get embedding for the query
      const queryEmbedding = await this.gemini.generateEmbedding(queryText);
      const vectorString = `[${queryEmbedding.join(',')}]`;

      // 2. Perform Hybrid Search using RRF (Reciprocal Rank Fusion)
      // Combines vector similarity (<=>) with Full-Text Search (websearch_to_tsquery)
      const ftsQuery = (input.jdSkills || []).concat(input.cvSkills || []).join(' ');

      const results = await this.prisma.$queryRawUnsafe<any[]>(
        `
        WITH vector_search AS (
          SELECT id,
                 1 - (embedding <=> $1::vector) AS vector_score,
                 ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) as vector_rank
          FROM "RagKnowledge"
          WHERE embedding IS NOT NULL
          LIMIT 50
        ),
        keyword_search AS (
          SELECT id,
                 ts_rank_cd(to_tsvector('english', title || ' ' || content || ' ' || array_to_string(tags, ' ')), websearch_to_tsquery('english', $2)) AS text_score,
                 ROW_NUMBER() OVER (ORDER BY ts_rank_cd(to_tsvector('english', title || ' ' || content || ' ' || array_to_string(tags, ' ')), websearch_to_tsquery('english', $2)) DESC) as text_rank
          FROM "RagKnowledge"
          WHERE to_tsvector('english', title || ' ' || content || ' ' || array_to_string(tags, ' ')) @@ websearch_to_tsquery('english', $2)
          LIMIT 50
        ),
        rrf AS (
          SELECT
            COALESCE(v.id, k.id) AS id,
            COALESCE(1.0 / (60 + v.vector_rank), 0.0) + COALESCE(1.0 / (60 + k.text_rank), 0.0) AS rrf_score
          FROM vector_search v
          FULL OUTER JOIN keyword_search k ON v.id = k.id
        )
        SELECT r.id, r.kind, r.title, r.content, r.source, r.tags, rrf.rrf_score
        FROM rrf
        JOIN "RagKnowledge" r ON r.id = rrf.id
        ORDER BY rrf.rrf_score DESC
        LIMIT $3;
        `,
        vectorString,
        ftsQuery || queryText.slice(0, 500),
        maxItems
      );

      const items: RetrievedRagItem[] = results.map(row => ({
        item: {
          id: row.id,
          kind: row.kind,
          title: row.title,
          content: row.content,
          source: row.source,
          tags: row.tags,
        },
        score: row.rrf_score,
        matchedTerms: [], // With vector search, matched terms are abstract
        reason: `Hybrid search match (Score: ${row.rrf_score.toFixed(4)})`,
      }));

      return {
        items,
        queryTerms: [],
        warnings,
      };

    } catch (error) {
      warnings.push(`RAG Search Failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        items: [],
        queryTerms: [],
        warnings,
      };
    }
  }
}
