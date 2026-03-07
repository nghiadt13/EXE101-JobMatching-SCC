export type AiNormalizationErrorKind =
  | 'parse_failed'
  | 'service_unavailable';

export class AiNormalizationError extends Error {
  readonly code: 'AI_NORMALIZATION_FAILED' | 'AI_SERVICE_UNAVAILABLE';
  readonly kind: AiNormalizationErrorKind;

  constructor(
    kind: AiNormalizationErrorKind = 'parse_failed',
    message = 'AI normalization failed',
  ) {
    super(message);
    this.kind = kind;
    this.code =
      kind === 'service_unavailable'
        ? 'AI_SERVICE_UNAVAILABLE'
        : 'AI_NORMALIZATION_FAILED';
  }
}
