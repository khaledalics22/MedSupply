import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { useAuthState } from '../../state/auth_state';
import styles from './styles';

export default function AdminLayout() {
  const { user, logout } = useAuthState();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandMark}><Ionicons name="shield-checkmark" size={24} color="#FFFFFF" /></View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>{user?.fullName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={() => void logout()}>
          <Ionicons name="log-out-outline" size={21} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.iconCircle}><Ionicons name="construct-outline" size={34} color="#208AEF" /></View>
        <Text style={styles.cardTitle}>Admin dashboard coming soon</Text>
        <Text style={styles.cardText}>Store, manufacturer, product, and order management will be implemented in a later phase.</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>Logged in as Administrator</Text></View>
      </View>
    </View>
  );
}
