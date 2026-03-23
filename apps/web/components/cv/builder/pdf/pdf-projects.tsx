import { Text, View } from '@react-pdf/renderer';
import type { CvProject } from '@/types/cv-builder';

type Props = {
  data: CvProject[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: Record<string, any>;
};

export function PdfProjects({ data, styles }: Props) {
  if (!data.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Dự án</Text>
      {data.map((entry, i) => (
        <View key={i} style={styles.sectionContent} wrap={false}>
          <Text style={styles.entryTitle}>{entry.name}</Text>
          {entry.description && <Text style={styles.entryDescription}>{entry.description}</Text>}
          {entry.tech && entry.tech.length > 0 && (
            <Text style={styles.entryDescription}>Tech: {entry.tech.join(', ')}</Text>
          )}
        </View>
      ))}
    </View>
  );
}
