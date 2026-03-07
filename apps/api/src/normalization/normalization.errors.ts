import { LlmFailureDetails } from './llm-error-classifier';

export type AiNormalizationErrorKind = 'parse_failed' | 'service_unavailable';

export class AiNormalizationError extends Error {
  readonly code: 'AI_NORMALIZATION_FAILED' | 'AI_SERVICE_UNAVAILABLE';
  readonly kind: AiNormalizationErrorKind;
  readonly details: LlmFailureDetails | null;

  constructor(
    kind: AiNormalizationErrorKind = 'parse_failed',
    message = 'AI normalization failed',
    details: LlmFailureDetails | null = null,
  ) {
    super(message);
    this.kind = kind;
    this.details = details;
    this.code =
      kind === 'service_unavailable'
        ? 'AI_SERVICE_UNAVAILABLE'
        : 'AI_NORMALIZATION_FAILED';
  }
}
