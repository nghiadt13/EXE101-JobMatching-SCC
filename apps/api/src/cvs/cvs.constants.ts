export const CV_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const CV_MAX_ACTIVE_PER_CANDIDATE = 10;
export const CV_MAX_TEXT_CHARS = 20000;

export const CV_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const CV_ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx']);
