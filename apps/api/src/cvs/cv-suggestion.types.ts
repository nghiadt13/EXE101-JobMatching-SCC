export interface SectionSuggestion {
  section: string;
  suggestions: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface RewriteSuggestion {
  section: string;
  original: string;
  suggested: string;
  reason: string;
}

export interface CvSuggestion {
  overallScore: number;
  missingKeywords: string[];
  strengthHighlights: string[];
  sections: SectionSuggestion[];
  rewriteSuggestions: RewriteSuggestion[];
}
