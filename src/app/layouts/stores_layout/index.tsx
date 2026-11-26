import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';

import AppHeader from '../../components/app_header';
import { iocContainer } from '../../models/ioc_container';
import { type LanguageCode } from '../../i18n';
import styles from './styles';

export default function StoresLayout({ language, onBack, onStoreSelected }: { language: LanguageCode; onBack: () => void; onStoreSelected: (storeId: string) => void }) {
  const database = iocContainer.getDatabase();
  const [stores, setStores] = useState<import('../../models/data_types').Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    database.getActiveStoresAsync()
      .then((items) => { if (active) setStores(items); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to load stores.'); })
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
      <AppHeader onBack={onBack} title="Stores" />
      {loading ? <Text style={styles.name}>Loading stores...</Text> : error ? <Text style={styles.name}>{error}</Text> : stores.length === 0 ? <Text style={styles.name}>No stores available.</Text> : null}
      <FlatList data={stores} numColumns={2} keyExtractor={(item) => item.id} contentContainerStyle={styles.gridContent} columnWrapperStyle={styles.gridRow} renderItem={({ item }) => (
        <TouchableOpacity activeOpacity={0.8} onPress={() => onStoreSelected(item.id)} style={styles.cardWrapper}>
          <View style={styles.card}><Image source={{ uri: item.image }} style={styles.image} /><Text style={styles.name}>{item.name}</Text><Text style={styles.description}>{item.address ?? item.description}</Text></View>
        </TouchableOpacity>
      )} />
    </View>
  );
}
