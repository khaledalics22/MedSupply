import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '../../components/app_header';
import { iocContainer } from '../../models/ioc_container';
import { type LanguageCode } from '../../i18n';
import styles from './styles';

export default function ManufacturersLayout({ language, onBack, onManufacturerSelected }: { language: LanguageCode; onBack: () => void; onManufacturerSelected: (manufacturerId: string) => void }) {
  const manufacturers = iocContainer.getDatabase().getActiveFactories();

  return (
    <View style={styles.container}>
      <AppHeader onBack={onBack} title="Manufacturers" />
      <FlatList data={manufacturers} numColumns={2} keyExtractor={(item) => item.id} contentContainerStyle={styles.gridContent} columnWrapperStyle={styles.gridRow} renderItem={({ item }) => (
        <TouchableOpacity activeOpacity={0.8} onPress={() => onManufacturerSelected(item.id)} style={styles.cardWrapper}>
          <View style={styles.card}><Image source={{ uri: item.image }} style={styles.image} /><Text style={styles.name}>{item.name}</Text><Text style={styles.description}>{item.description}</Text></View>
        </TouchableOpacity>
      )} />
    </View>
  );
}
