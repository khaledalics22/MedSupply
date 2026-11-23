import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';

import { type LanguageCode } from '../../i18n';
import type { Order, OrderLineSnapshot } from '../../models/data_types';
import { useAppState } from '../../state/app_state';
import { useAuthState } from '../../state/auth_state';
import styles from './styles';

export default function OrdersLayout({ language, onBack }: { language: LanguageCode; onBack: () => void }) {
  const { orders } = useAppState();
  const { user } = useAuthState();
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'completed'>('pending');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const ownOrders = useMemo(() => orders.filter((order) => order.pharmacistId === user?.id), [orders, user?.id]);
  const filtered = ownOrders.filter((order) => tab === 'completed' ? order.status === 'completed' : order.status === tab);
  const selectedOrder = selectedOrderId ? ownOrders.find((order) => order.id === selectedOrderId) : undefined;

  if (selectedOrder) {
    const groups = new Map<string, { name: string; type: 'store' | 'manufacturer'; lines: OrderLineSnapshot[] }>();
    for (const line of selectedOrder.items) {
      const key = `${line.sellerType}-${line.sellerId}`;
      const existing = groups.get(key);
      if (existing) existing.lines.push(line);
      else groups.set(key, { name: line.sellerName, type: line.sellerType, lines: [line] });
    }

    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedOrderId(null)} style={styles.detailBack}><Text style={styles.detailBackText}>Back</Text></TouchableOpacity>
          <Text style={styles.detailTitle}>Order Details</Text>
        </View>
        <ScrollView contentContainerStyle={styles.detailList}>
          <View style={styles.detailCard}>
            <Text style={styles.orderId}>{selectedOrder.id}</Text>
            <Text style={styles.status}>{selectedOrder.status}</Text>
            <Text style={styles.meta}>{selectedOrder.createdAt}</Text>
            <Text style={styles.total}>{selectedOrder.totalPrice.toFixed(2)} EGP</Text>
            {selectedOrder.rejectionReason ? <View style={styles.reasonBox}><Text style={styles.reasonLabel}>Rejection reason</Text><Text style={styles.reasonText}>{selectedOrder.rejectionReason}</Text></View> : null}
          </View>
          {Array.from(groups.values()).map((group) => {
            const subtotal = group.lines.reduce((sum, line) => sum + line.lineTotal, 0);
            return <View key={`${group.type}-${group.lines[0].sellerId}`} style={styles.providerCard}>
              <View style={styles.providerHeader}><View><Text style={styles.store}>{group.name}</Text><Text style={styles.meta}>{group.type === 'store' ? 'Store' : 'Manufacturer'}</Text></View><Text style={styles.total}>{subtotal.toFixed(2)} EGP</Text></View>
              {group.lines.map((line) => <View key={`${line.productId}-${line.sellerId}`} style={styles.line}>
                <Text style={styles.store}>{line.productName}</Text>
                <Text style={styles.meta}>Dosage: {line.dosage ?? 'N/A'} • Qty: {line.quantity}</Text>
                <Text style={styles.meta}>Consumer: {(line.consumerPrice ?? line.unitPrice).toFixed(2)} EGP • Discount: {line.discountPercentage}%</Text>
                <Text style={styles.meta}>Pharmacist price: {(line.pharmacyPriceAfterDiscount ?? line.unitPrice).toFixed(2)} EGP</Text>
                <Text style={styles.total}>{line.lineTotal.toFixed(2)} EGP</Text>
              </View>)}
            </View>;
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(['pending', 'approved', 'rejected', 'completed'] as const).map((status) => (
          <TouchableOpacity key={status} activeOpacity={0.8} onPress={() => setTab(status)} style={[styles.tab, tab === status && styles.tabActive]}>
            <Text style={[styles.tabText, tab === status && styles.tabTextActive]}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: Order) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyState}>No orders in this section.</Text>}
        renderItem={({ item }: { item: Order }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelectedOrderId(item.id)}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>{item.id}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Text style={styles.meta}>{item.createdAt}</Text>
            <Text style={styles.meta}>{item.totalItems} item(s)</Text>
            <Text style={styles.total}>{item.totalPrice.toFixed(2)} EGP</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
