import { Text, View } from '@react-pdf/renderer';
import type { CvEducation } from '@/types/cv-builder';

type Props = {
  data: CvEducation[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: Record<string, any>;
};

export function PdfEducation({ data, styles }: Props) {
  if (!data.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Học vấn</Text>
      {data.map((entry, i) => (
        <View key={i} style={styles.sectionContent} wrap={false}>
          <Text style={styles.entryTitle}>{entry.degree}{entry.field ? ` — ${entry.field}` : ''}</Text>
          <Text style={styles.entrySubtitle}>{entry.school}</Text>
          {(entry.startDate || entry.endDate) && (
            <Text style={styles.entryDate}>
              {entry.startDate ?? '?'} — {entry.endDate ?? 'Hiện tại'}
            </Text>
          )}
          {entry.gpa && <Text style={styles.entryDescription}>GPA: {entry.gpa}</Text>}
        </View>
      ))}
    </View>
  );
}
