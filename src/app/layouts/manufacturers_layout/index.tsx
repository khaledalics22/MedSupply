import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';

import AppHeader from '../../components/app_header';
import { iocContainer } from '../../models/ioc_container';
import { type LanguageCode } from '../../i18n';
import styles from './styles';

export default function ManufacturersLayout({ language, onBack, onManufacturerSelected }: { language: LanguageCode; onBack: () => void; onManufacturerSelected: (manufacturerId: string) => void }) {
  const database = iocContainer.getDatabase();
  const [manufacturers, setManufacturers] = useState<import('../../models/data_types').Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    database.getActiveFactoriesAsync()
      .then((items) => { if (active) setManufacturers(items); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to load manufacturers.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [database]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <AppHeader onBack={onBack} title="Manufacturers" />
      {loading ? <Text style={styles.name}>Loading manufacturers...</Text> : error ? <Text style={styles.name}>{error}</Text> : manufacturers.length === 0 ? <Text style={styles.name}>No manufacturers available.</Text> : null}
      <FlatList data={manufacturers} numColumns={2} keyExtractor={(item) => item.id} contentContainerStyle={styles.gridContent} columnWrapperStyle={styles.gridRow} renderItem={({ item }) => (
        <TouchableOpacity activeOpacity={0.8} onPress={() => onManufacturerSelected(item.id)} style={styles.cardWrapper}>
          <View style={styles.card}><Image source={{ uri: item.image }} style={styles.image} /><Text style={styles.name}>{item.name}</Text><Text style={styles.description}>{item.description}</Text></View>
        </TouchableOpacity>
      )} />
    </View>
  );
}
