import { StyleSheet, Font } from '@react-pdf/renderer';
import type { CvDesignTokens } from '@/types/cv-builder';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
});

const COLORS = {
  simple: { primary: '#374151', accent: '#6b7280', bg: '#ffffff' },
  professional: { primary: '#1e40af', accent: '#3b82f6', bg: '#f0f4ff' },
  modern: { primary: '#7c3aed', accent: '#8b5cf6', bg: '#f5f3ff' },
};

export const simpleStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, color: '#1f2937' },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 12 },
  headerName: { fontSize: 22, fontWeight: 'bold', color: COLORS.simple.primary, marginBottom: 4 },
  headerContact: { fontSize: 9, color: '#6b7280', lineHeight: 1.5 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.simple.primary, marginBottom: 6, marginTop: 14, textTransform: 'uppercase' as const, borderBottomWidth: 1, borderBottomColor: '#d1d5db', paddingBottom: 3 },
  sectionContent: { marginBottom: 4 },
  entryTitle: { fontSize: 11, fontWeight: 'bold', color: '#111827' },
  entrySubtitle: { fontSize: 10, color: '#374151', marginBottom: 2 },
  entryDate: { fontSize: 9, color: '#6b7280', marginBottom: 4 },
  entryDescription: { fontSize: 9, color: '#4b5563', lineHeight: 1.4, marginBottom: 6 },
  skillChip: { fontSize: 9, color: '#374151', backgroundColor: '#f3f4f6', padding: '3 8', borderRadius: 4, marginRight: 4, marginBottom: 4 },
  skillsRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const },
});

export const professionalStyles = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Roboto', fontSize: 10, color: '#1f2937', flexDirection: 'row' as const },
  sidebar: { width: '35%', backgroundColor: COLORS.professional.bg, padding: 24, minHeight: '100%' },
  mainContent: { width: '65%', padding: 24 },
  header: { backgroundColor: COLORS.professional.primary, marginTop: -24, marginLeft: -24, marginRight: -24, marginBottom: 16, padding: 24 },
  headerName: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  headerContact: { fontSize: 9, color: '#dbeafe', lineHeight: 1.5 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: COLORS.professional.primary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase' as const, borderBottomWidth: 1, borderBottomColor: '#bfdbfe', paddingBottom: 3 },
  sectionContent: { marginBottom: 4 },
  entryTitle: { fontSize: 11, fontWeight: 'bold', color: '#111827' },
  entrySubtitle: { fontSize: 10, color: '#374151', marginBottom: 2 },
  entryDate: { fontSize: 9, color: '#6b7280', marginBottom: 4 },
  entryDescription: { fontSize: 9, color: '#4b5563', lineHeight: 1.4, marginBottom: 6 },
  skillChip: { fontSize: 9, color: COLORS.professional.primary, backgroundColor: '#dbeafe', padding: '3 8', borderRadius: 4, marginRight: 4, marginBottom: 4 },
  skillsRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const },
});

export const modernStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, color: '#1f2937' },
  header: { backgroundColor: COLORS.modern.bg, marginTop: -40, marginLeft: -40, marginRight: -40, marginBottom: 20, padding: 30, borderBottomWidth: 3, borderBottomColor: COLORS.modern.primary },
  headerName: { fontSize: 24, fontWeight: 'bold', color: COLORS.modern.primary, marginBottom: 4 },
  headerContact: { fontSize: 9, color: '#6b7280', lineHeight: 1.5 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#ffffff', marginBottom: 6, marginTop: 14, backgroundColor: COLORS.modern.primary, padding: '4 10', borderRadius: 4 },
  sectionContent: { marginBottom: 4 },
  entryTitle: { fontSize: 11, fontWeight: 'bold', color: '#111827' },
  entrySubtitle: { fontSize: 10, color: '#374151', marginBottom: 2 },
  entryDate: { fontSize: 9, color: COLORS.modern.accent, marginBottom: 4 },
  entryDescription: { fontSize: 9, color: '#4b5563', lineHeight: 1.4, marginBottom: 6 },
  skillChip: { fontSize: 9, color: COLORS.modern.primary, backgroundColor: COLORS.modern.bg, padding: '3 8', borderRadius: 4, marginRight: 4, marginBottom: 4 },
  skillsRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const },
});

export function getTemplateStyles(templateId: string) {
  switch (templateId) {
    case 'professional':
      return professionalStyles;
    case 'modern':
      return modernStyles;
    default:
      return simpleStyles;
  }
}

/**
 * Extract the first family name from a CSS `font-family` string so it can be
 * matched against a font registered via `Font.register({ family: ... })`.
 *
 * Algorithm:
 *   1. Split the input on the first comma to drop any fallback families.
 *   2. Trim leading/trailing whitespace from that first token.
 *   3. Strip a single leading/trailing single or double quote (CSS allows
 *      quoted family names like `"Times New Roman"`).
 *
 * Examples:
 *   "Inter, sans-serif"          -> "Inter"
 *   '"Times New Roman", serif'   -> "Times New Roman"
 *   "  'Helvetica' , sans-serif" -> "Helvetica"
 *   "Roboto"                     -> "Roboto"
 *
 * The helper is exported so it can be unit-tested independently of the
 * `@react-pdf/renderer` StyleSheet build (Requirement 13.5).
 */
export function resolveFontFamily(fontFamilyCss: string): string {
  return fontFamilyCss.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
}

/**
 * Build a `@react-pdf/renderer` StyleSheet from CV design tokens so the PDF
 * mirrors the on-canvas styling (fontFamily, fontSize, lineHeight, primaryColor,
 * pageMargin) for the user.
 *
 * Style parity contract (per Requirement 13):
 *   - `page.padding === tokens.pageMargin`
 *   - `page.fontSize === tokens.fontSize`
 *   - `page.lineHeight === tokens.lineHeight`
 *   - `page.fontFamily` is the registered font name derived from `tokens.fontFamily`
 *   - `sectionTitle.color === tokens.primaryColor`
 *
 * Size multipliers for derived styles (per task 9.1: headerName ~2x base,
 * sectionTitle ~1.4x base, textMuted ~0.9x base):
 *   - `headerName.fontSize   = tokens.fontSize * 2.0`
 *   - `sectionTitle.fontSize = tokens.fontSize * 1.4`
 *   - `textMuted.fontSize    = tokens.fontSize * 0.9`
 *
 * Additional styles (`header`, `headerContact`, `entryTitle`, `entrySubtitle`,
 * `entryDate`, `entryDescription`, `sectionContent`, `skillsRow`, `skillChip`)
 * are included so this StyleSheet is a drop-in replacement for the static
 * template StyleSheets when `ResumePDF` is migrated in task 9.3.
 */
export function getDynamicStyles(
  tokens: CvDesignTokens,
): ReturnType<typeof StyleSheet.create> {
  const baseSize = tokens.fontSize;
  const fontName = resolveFontFamily(tokens.fontFamily);

  return StyleSheet.create({
    page: {
      flexDirection: 'column' as const,
      backgroundColor: '#FFFFFF',
      color: '#1f2937',
      padding: tokens.pageMargin,
      fontFamily: fontName,
      fontSize: baseSize,
      lineHeight: tokens.lineHeight,
    },
    header: {
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      paddingBottom: 10,
    },
    headerName: {
      fontSize: baseSize * 2,
      fontWeight: 'bold',
      color: '#1e293b',
      textTransform: 'uppercase' as const,
      marginBottom: 4,
    },
    headerContact: {
      fontSize: baseSize * 0.9,
      color: '#6b7280',
      lineHeight: 1.5,
    },
    sectionTitle: {
      fontSize: baseSize * 1.4,
      fontWeight: 'bold',
      color: tokens.primaryColor,
      borderBottomWidth: 1,
      borderBottomColor: '#cbd5e1',
      paddingBottom: 4,
      marginTop: 12,
      marginBottom: 8,
      textTransform: 'uppercase' as const,
    },
    sectionContent: {
      marginBottom: 4,
    },
    entryTitle: {
      fontSize: baseSize,
      fontWeight: 'bold',
      color: '#111827',
    },
    entrySubtitle: {
      fontSize: baseSize * 0.95,
      color: '#374151',
      marginBottom: 2,
    },
    entryDate: {
      fontSize: baseSize * 0.85,
      color: '#6b7280',
      marginBottom: 4,
    },
    entryDescription: {
      fontSize: baseSize * 0.9,
      color: '#4b5563',
      lineHeight: 1.4,
      marginBottom: 6,
    },
    textMuted: {
      fontSize: baseSize * 0.9,
      color: '#666666',
    },
    skillsRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
    },
    skillChip: {
      fontSize: baseSize * 0.85,
      color: tokens.primaryColor,
      backgroundColor: '#f3f4f6',
      padding: '3 8',
      borderRadius: 4,
      marginRight: 4,
      marginBottom: 4,
    },
  });
}
