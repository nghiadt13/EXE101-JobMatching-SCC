/**
 * Barrel export for the three CV Builder 2.0 HTML templates.
 *
 * Centralising the exports here keeps `CvHtmlCanvas` (and any future call
 * sites) decoupled from each template's internal file path and lets the
 * canvas switch on `data.templateId` with a clean import block:
 *
 * ```ts
 * import {
 *   SimpleTemplate,
 *   ProfessionalTemplate,
 *   ModernTemplate,
 * } from './html-templates';
 * ```
 *
 * The three templates share a single contract — `{ data, onChange }` — so the
 * canvas can pick one based on `data.templateId` at runtime
 * (Requirements 8.1, 8.2, 8.3).
 */
export { SimpleTemplate, type SimpleTemplateProps } from './simple-template';
export {
  ProfessionalTemplate,
  type ProfessionalTemplateProps,
} from './professional-template';
export { ModernTemplate, type ModernTemplateProps } from './modern-template';
