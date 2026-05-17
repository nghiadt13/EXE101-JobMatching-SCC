import { Text, View, Image } from '@react-pdf/renderer';
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
    <View style={{ ...styles.header, flexDirection: 'row', alignItems: 'center' }}>
      {data.photo && (
        <View style={{ width: 70, height: 70, marginRight: 20, borderRadius: 35, overflow: 'hidden' }}>
          <Image src={data.photo} alt="Profile Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.headerName}>{data.name || 'Họ và tên'}</Text>
        {contactParts.length > 0 && (
          <Text style={styles.headerContact}>{contactParts.join('  •  ')}</Text>
        )}
        {data.summary && (
          <Text style={{ ...styles.entryDescription, marginTop: 8 }}>{data.summary}</Text>
        )}
      </View>
    </View>
  );
}
