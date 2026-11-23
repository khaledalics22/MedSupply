import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '../../components/app_header';
import { iocContainer } from '../../models/ioc_container';
import { type LanguageCode } from '../../i18n';
import styles from './styles';

export default function SpecialtyLayout({ language, onBack, onSpecialtySelected }: { language: LanguageCode; onBack: () => void; onSpecialtySelected: (specialtyId: string) => void }) {
  const specialties = iocContainer.getDatabase().getSpecialties();

  return (
    <View style={styles.container}>
      <AppHeader onBack={onBack} title="Specialties" />
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
