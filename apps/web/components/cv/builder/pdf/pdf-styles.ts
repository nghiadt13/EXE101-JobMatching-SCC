import { StyleSheet } from '@react-pdf/renderer';

const COLORS = {
  simple: { primary: '#374151', accent: '#6b7280', bg: '#ffffff' },
  professional: { primary: '#1e40af', accent: '#3b82f6', bg: '#f0f4ff' },
  modern: { primary: '#7c3aed', accent: '#8b5cf6', bg: '#f5f3ff' },
};

export const simpleStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1f2937' },
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
  page: { padding: 0, fontFamily: 'Helvetica', fontSize: 10, color: '#1f2937', flexDirection: 'row' as const },
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
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1f2937' },
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
