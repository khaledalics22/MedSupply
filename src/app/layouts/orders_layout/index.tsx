import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';

import AppHeader from '../../components/app_header';
import { type LanguageCode } from '../../i18n';
import { useAppState } from '../../state/app_state';
import styles from './styles';

export default function OrdersLayout({
  language,
  onBack,
}: {
  language: LanguageCode;
  onBack: () => void;
}) {
  const { orders } = useAppState();
  const [tab, setTab] = useState<'pending' | 'delivered'>('pending');

  const filtered = orders.filter((order) => (tab === 'pending' ? order.status === 'pending' : order.status === 'delivered'));

  return (
    <View style={styles.container}>
      <AppHeader title="My Orders" />

      <View style={styles.tabs}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setTab('pending')} style={[styles.tab, tab === 'pending' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setTab('delivered')} style={[styles.tab, tab === 'delivered' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'delivered' && styles.tabTextActive]}>My Orders</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyState}>No orders in this section.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>{item.id}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Text style={styles.store}>{item.sellerName}</Text>
            <Text style={styles.meta}>{item.createdAt}</Text>
            <Text style={styles.meta}>{item.totalItems} item(s)</Text>
            <Text style={styles.total}>{item.totalPrice} EGP</Text>
          </View>
        )}
      />
    </View>
  );
}
