'use client';

import { Document, Page, View, Text } from '@react-pdf/renderer';
import type { CvBuilderData } from '@/types/cv-builder';
import { getTemplateStyles, professionalStyles } from './pdf-styles';
import { PdfProfile } from './pdf-profile';
import { PdfExperience } from './pdf-experience';
import { PdfEducation } from './pdf-education';
import { PdfSkills } from './pdf-skills';
import { PdfProjects } from './pdf-projects';

type Props = {
  data: CvBuilderData;
};

export function ResumePDF({ data }: Props) {
  if (data.templateId === 'professional') {
    const s = professionalStyles;
    return (
      <Document>
        <Page size="A4" style={s.page}>
          <View style={s.sidebar}>
            <PdfProfile data={data.profile} styles={s} />
            <PdfSkills data={data.skills} styles={s} />
            {data.certifications.length > 0 && (
              <View>
                <Text style={s.sectionTitle}>Chứng chỉ</Text>
                {data.certifications.map((cert) => (
                  <Text key={cert} style={s.entryDescription}>• {cert}</Text>
                ))}
              </View>
            )}
            {data.languages.length > 0 && (
              <View>
                <Text style={s.sectionTitle}>Ngôn ngữ</Text>
                {data.languages.map((lang) => (
                  <Text key={lang} style={s.entryDescription}>• {lang}</Text>
                ))}
              </View>
            )}
          </View>
          <View style={s.mainContent}>
            <PdfExperience data={data.experience} styles={s} />
            <PdfEducation data={data.education} styles={s} />
            <PdfProjects data={data.projects} styles={s} />
          </View>
        </Page>
      </Document>
    );
  }

  // Simple and Modern layout (single column)
  const styles = getTemplateStyles(data.templateId);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfProfile data={data.profile} styles={styles} />
        <PdfExperience data={data.experience} styles={styles} />
        <PdfEducation data={data.education} styles={styles} />
        <PdfSkills data={data.skills} styles={styles} />
        <PdfProjects data={data.projects} styles={styles} />
        {(data.certifications.length > 0 || data.languages.length > 0) && (
          <View>
            {data.certifications.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Chứng chỉ</Text>
                {data.certifications.map((cert) => (
                  <Text key={cert} style={styles.entryDescription}>• {cert}</Text>
                ))}
              </View>
            )}
            {data.languages.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Ngôn ngữ</Text>
                {data.languages.map((lang) => (
                  <Text key={lang} style={styles.entryDescription}>• {lang}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
