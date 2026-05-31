import { Injectable } from '@nestjs/common';
import { RAG_KNOWLEDGE_BASE } from './rag-knowledge.seed';
import {
  RagKnowledgeItem,
  RagRetrievalInput,
  RetrievedRagContext,
  RetrievedRagItem,
} from './rag.types';

const DEFAULT_MAX_ITEMS = 8;
const MAX_TEXT_CHARS = 4000;

@Injectable()
export class RagRetrieverService {
  retrieve(input: RagRetrievalInput): RetrievedRagContext {
    const queryTerms = this.extractQueryTerms(input);
    const warnings: string[] = [];

    if (queryTerms.length === 0) {
      return {
        items: [],
        queryTerms,
        warnings: ['No query terms available for RAG retrieval.'],
      };
    }

    const maxItems = this.normalizeMaxItems(input.maxItems);
    const scored = RAG_KNOWLEDGE_BASE.map((item) =>
      this.scoreItem(item, queryTerms),
    )
      .filter((item): item is RetrievedRagItem => item !== null)
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.matchedTerms.length - a.matchedTerms.length ||
          this.firstMatchIndex(a.matchedTerms, queryTerms) -
            this.firstMatchIndex(b.matchedTerms, queryTerms) ||
          a.item.id.localeCompare(b.item.id),
      )
      .slice(0, maxItems);

    return {
      items: scored,
      queryTerms,
      warnings,
    };
  }

  private extractQueryTerms(input: RagRetrievalInput): string[] {
    const terms = [
      ...this.normalizeSkillTerms(input.jdSkills ?? []),
      ...this.normalizeSkillTerms(input.cvSkills ?? []),
      ...this.extractTextTerms(input.jdText ?? ''),
      ...this.extractTextTerms(input.cvText ?? ''),
    ];
    return Array.from(new Set(terms));
  }

  private normalizeSkillTerms(skills: string[]): string[] {
    return skills.flatMap((skill) => this.expandTerm(skill));
  }

  private extractTextTerms(text: string): string[] {
    const limited = text.slice(0, MAX_TEXT_CHARS);
    const phraseTerms = this.knownPhrases
      .filter((phrase) => this.normalizeText(limited).includes(phrase))
      .flatMap((phrase) => this.expandTerm(phrase));
    const tokenTerms = this.normalizeText(limited)
      .split(' ')
      .filter((token) => token.length >= 2)
      .filter((token) => !this.stopWords.has(token))
      .flatMap((token) => this.expandTerm(token));
    return [...phraseTerms, ...tokenTerms];
  }

  private scoreItem(
    item: RagKnowledgeItem,
    queryTerms: string[],
  ): RetrievedRagItem | null {
    const searchableTerms = new Set(
      [
        ...item.tags,
        item.title,
        item.content,
        item.kind.replace('_', ' '),
      ].flatMap((value) => this.expandTerm(value)),
    );
    const matchedTerms = queryTerms.filter((term) => searchableTerms.has(term));
    if (matchedTerms.length === 0) {
      return null;
    }

    const exactTitleMatch = this.expandTerm(item.title).some((term) =>
      matchedTerms.includes(term),
    );
    const kindBoost = item.kind === 'skill_alias' && exactTitleMatch ? 5 : 0;
    const score =
      new Set(matchedTerms.map((term) => this.canonicalScoreTerm(term))).size +
      kindBoost;

    return {
      item,
      score,
      matchedTerms,
      reason: `Matched ${matchedTerms.length} term(s): ${matchedTerms.join(', ')}`,
    };
  }

  private expandTerm(value: string): string[] {
    const normalized = this.normalizeText(value);
    if (!normalized) {
      return [];
    }
    const aliases = this.aliases.get(normalized) ?? [];
    return [normalized, ...aliases];
  }

  private firstMatchIndex(matchedTerms: string[], queryTerms: string[]): number {
    const indexes = matchedTerms.map((term) => queryTerms.indexOf(term));
    const validIndexes = indexes.filter((index) => index >= 0);
    return validIndexes.length > 0 ? Math.min(...validIndexes) : Number.MAX_SAFE_INTEGER;
  }

  private canonicalScoreTerm(term: string): string {
    for (const [alias, canonicalValues] of this.aliases.entries()) {
      if (term === alias || canonicalValues.includes(term)) {
        return canonicalValues[0];
      }
    }
    return term;
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .replace(/c\+\+/g, 'cpp')
      .replace(/c#/g, 'csharp')
      .replace(/\.net/g, 'dotnet')
      .replace(/[^a-z0-9+#/.]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeMaxItems(value: number | undefined): number {
    if (!Number.isFinite(value)) {
      return DEFAULT_MAX_ITEMS;
    }
    return Math.min(20, Math.max(1, Math.round(value as number)));
  }

  private readonly aliases = new Map<string, string[]>([
    ['reactjs', ['react']],
    ['react.js', ['react']],
    ['react js', ['react']],
    ['node', ['nodejs']],
    ['node.js', ['nodejs']],
    ['node js', ['nodejs']],
    ['postgres', ['postgresql']],
    ['postgres sql', ['postgresql']],
    ['amazon web services', ['aws']],
    ['amazon cloud', ['aws']],
    ['google cloud', ['gcp']],
    ['google cloud platform', ['gcp']],
    ['microsoft azure', ['azure']],
    ['next.js', ['nextjs']],
    ['next js', ['nextjs']],
    ['nest.js', ['nestjs']],
    ['nest js', ['nestjs']],
    ['ts', ['typescript']],
    ['js', ['javascript']],
    ['k8s', ['kubernetes']],
    ['mongo', ['mongodb']],
    ['my sql', ['mysql']],
    ['prisma orm', ['prisma', 'orm']],
    ['restful', ['rest', 'rest api']],
    ['machine learning', ['ml']],
  ]);

  private readonly knownPhrases = [
    'amazon web services',
    'google cloud platform',
    'google cloud',
    'microsoft azure',
    'spring boot',
    'machine learning',
    'rest api',
    'aws certification',
    'aws certified',
    'supply chain',
    'tech lead',
    'lead engineer',
    'people management',
  ];

  private readonly stopWords = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'for',
    'in',
    'of',
    'on',
    'or',
    'the',
    'to',
    'with',
    'we',
    'is',
    'be',
    'by',
    'this',
    'that',
    'role',
    'hiring',
    'requiring',
    'requires',
    'required',
    'experience',
  ]);
}
