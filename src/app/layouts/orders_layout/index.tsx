import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import { type LanguageCode } from '../../i18n';
import type { Order, OrderLineSnapshot } from '../../models/data_types';
import { useAppState } from '../../state/app_state';
import { useAuthState } from '../../state/auth_state';
import styles from './styles';

export default function OrdersLayout({ language, onBack }: { language: LanguageCode; onBack: () => void }) {
  const { orders, ordersLoading, ordersError, refreshOrders, reorderOrder } = useAppState();
  const { user } = useAuthState();
  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [reorderFeedback, setReorderFeedback] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (orders.length === 0 && !ordersLoading && !ordersError) {
      void refreshOrders();
    }
  }, []);

  const ownOrders = useMemo(() => orders.filter((order) => order.pharmacistId === user?.id), [orders, user?.id]);
  const filtered = tab === 'all' ? ownOrders : ownOrders.filter((order) => order.status === tab);
  const selectedOrder = selectedOrderId ? ownOrders.find((order) => order.id === selectedOrderId) : undefined;

  useEffect(() => {
    // Any side effects or data fetching can be done here
  }, [selectedOrderId, tab, orders]);

  if (selectedOrder) {
    const groups = new Map<string, { name: string; type: 'store' | 'manufacturer'; lines: OrderLineSnapshot[] }>();
    for (const line of selectedOrder.items) {
      const key = `${line.sellerType}-${line.sellerId}`;
      const existing = groups.get(key);
      if (existing) existing.lines.push(line);
      else groups.set(key, { name: line.sellerName, type: line.sellerType, lines: [line] });
    }

    const timelineSteps = [
      { label: 'Order Placed', active: true },
      { label: 'Pending Admin Review', active: selectedOrder.status === 'pending' || selectedOrder.status === 'approved' || selectedOrder.status === 'completed' },
      { label: selectedOrder.status === 'rejected' ? 'Rejected' : 'Approved', active: selectedOrder.status === 'approved' || selectedOrder.status === 'rejected' || selectedOrder.status === 'completed' },
      { label: 'Completed', active: selectedOrder.status === 'completed' },
    ];

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
            {selectedOrder.completedAt ? <Text style={styles.meta}>Completed: {formatDate(selectedOrder.completedAt)}</Text> : null}
            <Text style={styles.total}>{selectedOrder.totalPrice.toFixed(2)} EGP</Text>
            {selectedOrder.rejectionReason ? <View style={styles.reasonBox}><Text style={styles.reasonLabel}>Rejection reason</Text><Text style={styles.reasonText}>{selectedOrder.rejectionReason}</Text></View> : null}
          </View>
          <View style={styles.timeline}>
            {timelineSteps.map((step, index) => (
              <View key={index} style={[styles.timelineStep, step.active && styles.timelineStepActive]}>
                <View style={[styles.timelineBullet, step.active && styles.timelineBulletActive]} />
                <Text style={[styles.timelineLabel, step.active && styles.timelineLabelActive]}>{step.label}</Text>
              </View>
            ))}
          </View>
          {reorderFeedback ? <View style={styles.reorderFeedbackBox}><Text style={styles.reorderFeedbackText}>{reorderFeedback}</Text></View> : null}
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
          <TouchableOpacity style={styles.reorderButton} onPress={async () => {
            const report = await reorderOrder(selectedOrder.id);
            const parts: string[] = [];
            if (report.added.length) parts.push(`${report.added.reduce((sum, item) => sum + item.quantity, 0)} item(s) added`);
            if (report.limited.length) parts.push(`${report.limited.length} item(s) quantity-limited`);
            if (report.skipped.length) parts.push(`${report.skipped.length} unavailable/skipped`);
            const details: string[] = [];
            if (report.added.length) details.push(`Added: ${report.added.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}`);
            if (report.limited.length) details.push(`Quantity limited: ${report.limited.map((item) => `${item.productName} (requested ${item.requested}, added ${item.added}, stock ${item.available})`).join(', ')}`);
            if (report.skipped.length) details.push(`Skipped: ${report.skipped.map((item) => `${item.productName} — ${item.reason}`).join(', ')}`);
            setReorderFeedback(details.join('\n') || 'No items could be added');
          }}><Text style={styles.reorderText}>Reorder</Text></TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (ordersLoading) {
    return <View style={styles.container}><Text style={styles.emptyState}>Loading orders...</Text></View>;
  }

  if (ordersError) {
    return <View style={styles.container}><Text style={styles.emptyState}>{ordersError}</Text><TouchableOpacity style={styles.reorderButton} onPress={() => void refreshOrders()}><Text style={styles.reorderText}>Retry</Text></TouchableOpacity></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(['all', 'pending', 'approved', 'rejected', 'completed'] as const).map((status) => (
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
            <Text style={styles.meta}>{item.items.length} product(s) • {item.totalItems} unit(s)</Text>
            <Text style={styles.total}>{item.totalPrice.toFixed(2)} EGP</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function formatDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString();
}
