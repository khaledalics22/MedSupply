import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '../../components/app_header';
import { type LanguageCode } from '../../i18n';
import { useAppState } from '../../state/app_state';
import styles from './styles';

export default function NotificationsLayout({ language, onBack }: { language: LanguageCode; onBack: () => void }) {
  const { notifications, unreadNotifications, markNotificationRead } = useAppState();

  return (
    <View style={styles.container}>
      <AppHeader
        title="Notifications"
        onBack={onBack}
        language={language}
        cartCount={0}
        notificationsCount={unreadNotifications}
        onLanguageToggle={() => {}}
        onCartPress={undefined}
        onNotificationsPress={onBack}
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => markNotificationRead(item.id)}
            style={[styles.card, item.read && styles.cardRead]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.meta}>{item.createdAt}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
