'use client';

import { Document, Page, Text, View } from '@react-pdf/renderer';

import {
  DEFAULT_DESIGN_TOKENS,
  type CvBuilderData,
  type CvEducation,
  type CvExperience,
  type CvProfile,
  type CvProject,
} from '@/types/cv-builder';

import { getDynamicStyles } from './pdf-styles';
// Importing the fonts module triggers `registerCvFonts()` at module load
// (see the auto-invoke at the bottom of `pdf-fonts.ts`), so by the time
// `<ResumePDF>` renders the Vietnamese-capable Inter / Roboto / Outfit
// families and the no-hyphenation callback are already in place.
// We also re-export the function for explicit re-registration in tests
// or after a hot module reload (Requirement 10.2, 10.3).
import { registerCvFonts } from './pdf-fonts';

// Defensive: in environments where module-level side effects are skipped
// (e.g. some test runners that mock module loading), call the idempotent
// registrar once more so styles always resolve to a registered family.
registerCvFonts();

/**
 * Props for the {@link ResumePDF} document.
 *
 * The document is intentionally driven by the same {@link CvBuilderData}
 * shape that powers the on-canvas HTML templates so design tokens, profile
 * fields, and section ordering stay in lockstep between the WYSIWYG editor
 * and the exported PDF (Requirement 13).
 */
export interface ResumePDFProps {
  /** Full CV data — typically `cvData` from `CvBuilderPage`. */
  data: CvBuilderData;
}

// ---------------------------------------------------------------------------
//                              Helper sections
// ---------------------------------------------------------------------------

// `getDynamicStyles` returns a fully built StyleSheet whose entries are
// loosely typed as `Style` objects. We accept that as `Record<string, any>`
// in helper props so we can pass it through without re-typing every key.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfStyles = Record<string, any>;

/**
 * Build the dot-separated contact line shown beneath the candidate name.
 * Mirrors the HTML template's bullet separator while staying ASCII-safe for
 * PDF rendering when a font lacks the bullet glyph.
 */
function buildContactLine(profile: CvProfile): string {
  const parts: string[] = [];
  if (profile.email) parts.push(profile.email);
  if (profile.phone) parts.push(profile.phone);
  if (profile.website) parts.push(profile.website);
  if (profile.location?.city) parts.push(profile.location.city);
  if (profile.location?.country) parts.push(profile.location.country);
  return parts.join('  •  ');
}

function ProfileSection({
  profile,
  styles,
}: {
  profile: CvProfile;
  styles: PdfStyles;
}) {
  const contact = buildContactLine(profile);
  // The profile header is treated as one indivisible block so the name and
  // contact line never split across pages (Requirement 10.7).
  return (
    <View style={styles.header} wrap={false}>
      <Text style={styles.headerName}>{profile.name || 'Họ và tên'}</Text>
      {contact.length > 0 && <Text style={styles.headerContact}>{contact}</Text>}
      {profile.summary && (
        <Text style={[styles.entryDescription, { marginTop: 6 }]}>
          {profile.summary}
        </Text>
      )}
    </View>
  );
}

function ExperienceSection({
  entries,
  styles,
}: {
  entries: CvExperience[];
  styles: PdfStyles;
}) {
  if (entries.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Kinh nghiệm làm việc</Text>
      {entries.map((entry, i) => (
        // Each entry is kept on a single page so the role/company/date
        // header never separates from its description (Requirement 10.7).
        <View key={i} style={styles.sectionContent} wrap={false}>
          <Text style={styles.entryTitle}>
            {entry.role || '[Vị trí]'}
            {entry.company ? ` @ ${entry.company}` : ''}
          </Text>
          <Text style={styles.entryDate}>
            {entry.startDate || '?'} — {entry.endDate || 'Hiện tại'}
          </Text>
          {entry.description && (
            <Text style={styles.entryDescription}>{entry.description}</Text>
          )}
          {entry.tech && entry.tech.length > 0 && (
            <Text style={styles.entryDescription}>
              Công nghệ: {entry.tech.join(', ')}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function EducationSection({
  entries,
  styles,
}: {
  entries: CvEducation[];
  styles: PdfStyles;
}) {
  if (entries.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Học vấn</Text>
      {entries.map((entry, i) => (
        <View key={i} style={styles.sectionContent} wrap={false}>
          <Text style={styles.entryTitle}>
            {entry.school || '[Trường]'}
          </Text>
          <Text style={styles.entrySubtitle}>
            {entry.degree || '[Bằng cấp]'}
            {entry.field ? ` — ${entry.field}` : ''}
          </Text>
          {(entry.startDate || entry.endDate) && (
            <Text style={styles.entryDate}>
              {entry.startDate ?? '?'} — {entry.endDate ?? 'Hiện tại'}
            </Text>
          )}
          {entry.gpa && (
            <Text style={styles.entryDescription}>GPA: {entry.gpa}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function SkillsSection({
  skills,
  styles,
}: {
  skills: string[];
  styles: PdfStyles;
}) {
  if (skills.length === 0) return null;
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>Kỹ năng</Text>
      <View style={styles.skillsRow}>
        {skills.map((skill, i) => (
          <Text key={`${skill}-${i}`} style={styles.skillChip}>
            {skill}
          </Text>
        ))}
      </View>
    </View>
  );
}

function ProjectsSection({
  projects,
  styles,
}: {
  projects: CvProject[];
  styles: PdfStyles;
}) {
  if (projects.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Dự án</Text>
      {projects.map((project, i) => (
        <View key={i} style={styles.sectionContent} wrap={false}>
          <Text style={styles.entryTitle}>{project.name || '[Tên dự án]'}</Text>
          {project.description && (
            <Text style={styles.entryDescription}>{project.description}</Text>
          )}
          {project.tech && project.tech.length > 0 && (
            <Text style={styles.entryDescription}>
              Công nghệ: {project.tech.join(', ')}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function BulletListSection({
  title,
  items,
  styles,
}: {
  title: string;
  items: string[];
  styles: PdfStyles;
}) {
  if (items.length === 0) return null;
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, i) => (
        <Text key={`${item}-${i}`} style={styles.entryDescription}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
//                              Main document
// ---------------------------------------------------------------------------

/**
 * `ResumePDF` is the `@react-pdf/renderer` document tree exported as the
 * downloaded CV PDF. It is structurally identical to the HTML canvas
 * templates (Profile → Experience → Education → Skills → Projects →
 * Certifications → Languages) so users see the same content order on screen
 * and on paper.
 *
 * Style parity (Requirement 13): all visual properties are sourced from
 * `getDynamicStyles(data.designTokens ?? DEFAULT_DESIGN_TOKENS)`, which maps
 * `tokens.fontFamily` to the registered font name, `tokens.fontSize` to the
 * page base font size, `tokens.lineHeight` to the page line height,
 * `tokens.pageMargin` to the page padding, and `tokens.primaryColor` to the
 * section title colour.
 *
 * Page-break behaviour (Requirement 10.7): indivisible blocks (the profile
 * header, every experience / education / project entry, the skills list,
 * and the certifications / languages bullet lists) carry `wrap={false}` so
 * they never split mid-block. Section bodies themselves are allowed to wrap
 * normally so long lists still flow onto the next page when needed.
 *
 * Backwards compatibility (Requirement 7.10): when a legacy CV is loaded
 * without a `designTokens` field, the helper falls back to
 * {@link DEFAULT_DESIGN_TOKENS} so the PDF still renders with a coherent
 * visual style.
 */
export function ResumePDF({ data }: ResumePDFProps) {
  const styles = getDynamicStyles(data.designTokens ?? DEFAULT_DESIGN_TOKENS);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ProfileSection profile={data.profile} styles={styles} />
        <ExperienceSection entries={data.experience} styles={styles} />
        <EducationSection entries={data.education} styles={styles} />
        <SkillsSection skills={data.skills} styles={styles} />
        <ProjectsSection projects={data.projects} styles={styles} />
        <BulletListSection
          title="Chứng chỉ"
          items={data.certifications}
          styles={styles}
        />
        <BulletListSection
          title="Ngôn ngữ"
          items={data.languages}
          styles={styles}
        />
      </Page>
    </Document>
  );
}
