import { Text, View } from '@react-pdf/renderer';
import type { CvProfile } from '@/types/cv-builder';

type Props = {
  data: CvProfile;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: Record<string, any>;
};

export function PdfProfile({ data, styles }: Props) {
  const contactParts: string[] = [];
  if (data.email) contactParts.push(data.email);
  if (data.phone) contactParts.push(data.phone);
  if (data.website) contactParts.push(data.website);
  if (data.location?.city) contactParts.push(data.location.city);

  return (
    <View style={styles.header}>
      <Text style={styles.headerName}>{data.name || 'Họ và tên'}</Text>
      {contactParts.length > 0 && (
        <Text style={styles.headerContact}>{contactParts.join('  •  ')}</Text>
      )}
      {data.summary && (
        <Text style={{ ...styles.entryDescription, marginTop: 8 }}>{data.summary}</Text>
      )}
    </View>
  );
}
