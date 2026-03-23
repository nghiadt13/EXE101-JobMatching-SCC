import { Text, View } from '@react-pdf/renderer';
import type { CvExperience } from '@/types/cv-builder';

type Props = {
  data: CvExperience[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: Record<string, any>;
};

export function PdfExperience({ data, styles }: Props) {
  if (!data.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Kinh nghiệm làm việc</Text>
      {data.map((entry, i) => (
        <View key={i} style={styles.sectionContent} wrap={false}>
          <Text style={styles.entryTitle}>{entry.role}</Text>
          <Text style={styles.entrySubtitle}>{entry.company}</Text>
          <Text style={styles.entryDate}>
            {entry.startDate} — {entry.endDate || 'Hiện tại'}
          </Text>
          {entry.description && <Text style={styles.entryDescription}>{entry.description}</Text>}
          {entry.tech && entry.tech.length > 0 && (
            <Text style={styles.entryDescription}>Tech: {entry.tech.join(', ')}</Text>
          )}
        </View>
      ))}
    </View>
  );
}
