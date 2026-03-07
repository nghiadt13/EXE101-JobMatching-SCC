export const ERROR_CODES = {
  authRequired: 'AUTH_REQUIRED',
  conflict: 'CONFLICT',
  cvFileRequired: 'CV_FILE_REQUIRED',
  cvFileTooLarge: 'CV_FILE_TOO_LARGE',
  cvLimitReached: 'CV_LIMIT_REACHED',
  cvParseFailed: 'CV_PARSE_FAILED',
  databaseQueryFailed: 'DATABASE_QUERY_FAILED',
  databaseRecordNotFound: 'DATABASE_RECORD_NOT_FOUND',
  documentParseFailed: 'DOCUMENT_PARSE_FAILED',
  documentTextMissing: 'DOCUMENT_TEXT_EXTRACTION_FAILED',
  documentUnsupportedType: 'DOCUMENT_UNSUPPORTED_TYPE',
  forbidden: 'FORBIDDEN',
  internalServerError: 'INTERNAL_SERVER_ERROR',
  jdFileRequired: 'JD_FILE_REQUIRED',
  jdFileTooLarge: 'JD_FILE_TOO_LARGE',
  jdParseFailed: 'JD_PARSE_FAILED',
  notFound: 'RESOURCE_NOT_FOUND',
  payloadTooLarge: 'PAYLOAD_TOO_LARGE',
  unsupportedMediaType: 'UNSUPPORTED_MEDIA_TYPE',
  validationFailed: 'VALIDATION_FAILED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
