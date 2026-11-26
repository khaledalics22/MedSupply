import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';

import AppHeader from '../../components/app_header';
import { iocContainer } from '../../models/ioc_container';
import { type LanguageCode } from '../../i18n';
import styles from './styles';

export default function SpecialtyLayout({ language, onBack, onSpecialtySelected }: { language: LanguageCode; onBack: () => void; onSpecialtySelected: (specialtyId: string) => void }) {
  const database = iocContainer.getDatabase();
  const [specialties, setSpecialties] = useState<import('../../models/data_types').Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    database.getSpecialtiesAsync()
      .then((items) => { if (active) setSpecialties(items); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to load specialties.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [database]);

  return (
    <View style={styles.container}>
      <AppHeader onBack={onBack} title="Specialties" />
      {loading ? <Text style={styles.name}>Loading specialties...</Text> : error ? <Text style={styles.name}>{error}</Text> : specialties.length === 0 ? <Text style={styles.name}>No specialties available.</Text> : null}
      <FlatList
        data={specialties}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.8} onPress={() => onSpecialtySelected(item.id)} style={styles.cardWrapper}>
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
