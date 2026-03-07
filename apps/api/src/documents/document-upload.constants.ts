export const DOCUMENT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_MAX_TEXT_CHARS = 20000;

export const DOCUMENT_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const DOCUMENT_ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx']);

export type DocumentScope = 'cvs' | 'jobs';
