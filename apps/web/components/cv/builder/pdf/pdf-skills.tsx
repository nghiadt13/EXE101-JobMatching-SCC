import { Text, View } from '@react-pdf/renderer';

type Props = {
  data: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: Record<string, any>;
};

export function PdfSkills({ data, styles }: Props) {
  if (!data.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Kỹ năng</Text>
      <View style={styles.skillsRow}>
        {data.map((skill) => (
          <Text key={skill} style={styles.skillChip}>
            {skill}
          </Text>
        ))}
      </View>
    </View>
  );
}
