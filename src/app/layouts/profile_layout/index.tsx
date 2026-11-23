import { FlatList, Text, TouchableOpacity, View } from "react-native";

import AppHeader from "../../components/app_header";
import { type LanguageCode } from "../../i18n";
import { iocContainer } from "../../models/ioc_container";
import { useAppState } from "../../state/app_state";
import { useAuthState } from "../../state/auth_state";
import styles from "./styles";

export default function ProfileLayout({
  language,
  onBack,
}: {
  language: LanguageCode;
  onBack: () => void;
}) {
  const { favoriteStores, unreadNotifications } = useAppState();
  const { user, logout } = useAuthState();
  const database = iocContainer.getDatabase();
  const favoriteStoreItems = database
    .getStores()
    .filter((store) => favoriteStores.includes(store.id));

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
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
                <Text style={styles.favoriteMeta}>
                  {item.address ?? "Local store"}
                </Text>
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
