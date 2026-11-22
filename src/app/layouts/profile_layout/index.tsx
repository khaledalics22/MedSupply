import { FlatList, Text, View } from 'react-native';

import AppHeader from '../../components/app_header';
import { type LanguageCode } from '../../i18n';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import styles from './styles';

export default function ProfileLayout({ language, onBack }: { language: LanguageCode; onBack: () => void }) {
  const { favoriteStores, unreadNotifications } = useAppState();
  const database = iocContainer.getDatabase();
  const favoriteStoreItems = database.getStores().filter((store) => favoriteStores.includes(store.id));

  return (
    <View style={styles.container}>
      <AppHeader
        title="Profile"
        language={language}
        notificationsCount={unreadNotifications}
        onLanguageToggle={() => {}}
      />

      <View style={styles.panel}>
        <Text style={styles.name}>Ahmed Ali</Text>
        <Text style={styles.email}>ahmed@medsupply.app</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Favorite Stores</Text>
        {favoriteStoreItems.length === 0 ? (
          <Text style={styles.empty}>No favorites yet.</Text>
        ) : (
          <FlatList
            data={favoriteStoreItems}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.favoriteRow}>
                <Text style={styles.favoriteName}>{item.name}</Text>
                <Text style={styles.favoriteMeta}>{item.address ?? 'Local store'}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
