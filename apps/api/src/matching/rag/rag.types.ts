export type RagKnowledgeKind =
  | 'skill_alias'
  | 'skill_group'
  | 'related_skill'
  | 'role_expectation'
  | 'domain_hint';

export interface RagKnowledgeItem {
  id: string;
  kind: RagKnowledgeKind;
  title: string;
  content: string;
  tags: string[];
  source: string;
}

export interface RagRetrievalInput {
  jdSkills?: string[];
  cvSkills?: string[];
  jdText?: string | null;
  cvText?: string | null;
  maxItems?: number;
}

export interface RetrievedRagItem {
  item: RagKnowledgeItem;
  score: number;
  reason: string;
  matchedTerms: string[];
}

export interface RetrievedRagContext {
  items: RetrievedRagItem[];
  queryTerms: string[];
  warnings: string[];
}
