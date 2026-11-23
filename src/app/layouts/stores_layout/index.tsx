import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '../../components/app_header';
import { iocContainer } from '../../models/ioc_container';
import { type LanguageCode } from '../../i18n';
import styles from './styles';

export default function StoresLayout({ language, onBack, onStoreSelected }: { language: LanguageCode; onBack: () => void; onStoreSelected: (storeId: string) => void }) {
  const stores = iocContainer.getDatabase().getStores();

  return (
    <View style={styles.container}>
      <AppHeader onBack={onBack} title="Stores" />
      <FlatList data={stores} numColumns={2} keyExtractor={(item) => item.id} contentContainerStyle={styles.gridContent} columnWrapperStyle={styles.gridRow} renderItem={({ item }) => (
        <TouchableOpacity activeOpacity={0.8} onPress={() => onStoreSelected(item.id)} style={styles.cardWrapper}>
          <View style={styles.card}><Image source={{ uri: item.image }} style={styles.image} /><Text style={styles.name}>{item.name}</Text><Text style={styles.description}>{item.address ?? item.description}</Text></View>
        </TouchableOpacity>
      )} />
    </View>
  );
}
