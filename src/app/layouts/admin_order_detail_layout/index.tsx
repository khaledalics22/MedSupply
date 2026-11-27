import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import type { Order, OrderLineSnapshot } from '../../models/data_types';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import styles from './styles';

export default function AdminOrderDetailLayout({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');
  const { approveOrder, rejectOrder, completeOrder } = useAppState();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    iocContainer.getDatabase().getOrderByIdAsync(orderId)
      .then((item) => { if (active) setOrder(item); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to load order.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId, refreshVersion]);

  const groups = useMemo(() => {
    const result = new Map<string, { name: string; type: 'store' | 'manufacturer'; minimum: number; lines: OrderLineSnapshot[] }>();
    for (const line of order?.items ?? []) {
      const key = `${line.sellerType}-${line.sellerId}`;
      const existing = result.get(key);
      if (existing) existing.lines.push(line);
      else result.set(key, { name: line.sellerName, type: line.sellerType, minimum: line.minimumOrderValueSnapshot ?? 0, lines: [line] });
    }
    return Array.from(result.values());
  }, [order]);

  if (loading) return <View style={styles.container}><View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Loading order...</Text></View></View>;
  if (error) return <View style={styles.container}><View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Unable to load order</Text></View><View style={{ padding: 16 }}><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={styles.cancelButton} onPress={() => setRefreshVersion((value) => value + 1)}><Text style={styles.cancelText}>Retry</Text></TouchableOpacity></View></View>;
  if (!order) return <View style={styles.container}><View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Order not found</Text></View></View>;

  const submitAction = async () => {
    if (!actionType || submitting) return;
    setSubmitting(true);
    setActionError('');
    setActionFeedback('');
    const selectedAction = actionType;
    try {
      const result = selectedAction === 'approve'
        ? await approveOrder(order.id)
        : selectedAction === 'reject'
          ? await rejectOrder(order.id)
          : await completeOrder(order.id);
      if (!result.success) {
        setActionError(result.errors.join('\n'));
        return;
      }
      setActionType(null);
      setActionFeedback(selectedAction === 'approve' ? 'Order approved successfully.' : selectedAction === 'reject' ? 'Order rejected successfully.' : 'Order completed successfully.');
      setRefreshVersion((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Order Details</Text><View style={styles.headerSpace} /></View>
      <ScrollView contentContainerStyle={styles.content}>
        {actionFeedback ? <Text style={styles.feedback}>{actionFeedback}</Text> : null}
        {actionError ? <View style={styles.errorBox}><Text style={styles.errorText}>{actionError}</Text></View> : null}
        <View style={styles.infoCard}>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.status}>{order.status}</Text>
          <Info label="Pharmacist" value={order.customerName ?? 'Pharmacist'} />
          <Info label="Pharmacy" value={order.pharmacyName ?? 'N/A'} />
          <Info label="Email" value={order.pharmacistEmail ?? 'N/A'} />
          <Info label="Phone" value={order.pharmacistPhone ?? 'N/A'} />
          <Info label="Order date" value={formatDate(order.createdAt)} />
          {order.completedAt ? <Info label="Completed date" value={formatDate(order.completedAt)} /> : null}
          <Info label="Subtotal before discount" value={`${(order.subtotalAmount ?? order.totalPrice + order.totalDiscount).toFixed(2)} EGP`} />
          <Info label="Discount" value={`${order.totalDiscount.toFixed(2)} EGP`} />
          <Info label="Final total" value={`${order.totalPrice.toFixed(2)} EGP`} />
          <Info label="Total quantity" value={String(order.totalItems)} />
          <Info label="Line count" value={String(order.lineCount ?? order.items.length)} />
          {order.rejectionReason ? <View style={styles.rejection}><Text style={styles.rejectionLabel}>Rejection reason</Text><Text style={styles.rejectionText}>{order.rejectionReason}</Text></View> : null}
        </View>

        <Text style={styles.sectionTitle}>Provider Items</Text>
        {groups.map((group) => {
          const subtotalBefore = group.lines.reduce((sum, line) => sum + (line.consumerPrice ?? line.unitPrice) * line.quantity, 0);
          const subtotalAfter = group.lines.reduce((sum, line) => sum + line.lineTotal, 0);
          const quantity = group.lines.reduce((sum, line) => sum + line.quantity, 0);
          return <View key={`${group.type}-${group.lines[0].sellerId}`} style={styles.providerCard}>
            <View style={styles.providerHeader}><View><Text style={styles.providerName}>{group.name}</Text><Text style={styles.providerType}>{group.type === 'store' ? 'Store' : 'Manufacturer'}</Text></View><Text style={styles.providerSubtotal}>{subtotalAfter.toFixed(2)} EGP</Text></View>
            <Text style={styles.lineMeta}>Minimum: {group.minimum.toFixed(2)} EGP</Text>
            <Text style={styles.lineMeta}>Subtotal before discount: {subtotalBefore.toFixed(2)} EGP</Text>
            <Text style={styles.lineMeta}>Subtotal after discount: {subtotalAfter.toFixed(2)} EGP</Text>
            <Text style={styles.lineMeta}>Quantity: {quantity} • Items: {group.lines.length}</Text>
            {group.lines.map((line) => <View key={`${line.productId}-${line.sellerId}`} style={styles.line}>
              <Text style={styles.productName}>{line.productName}</Text>
              {line.dosage ? <Text style={styles.lineMeta}>Dosage: {line.dosage}</Text> : null}
              {line.packageSize ? <Text style={styles.lineMeta}>Package: {line.packageSize}</Text> : null}
              {line.variant ? <Text style={styles.lineMeta}>Variant: {line.variant}</Text> : null}
              {line.specialtyName ? <Text style={styles.lineMeta}>Specialty: {line.specialtyName}</Text> : null}
              <View style={styles.lineGrid}><Text style={styles.lineMeta}>Consumer: {(line.consumerPrice ?? line.unitPrice).toFixed(2)} EGP</Text><Text style={styles.lineMeta}>Discount: {line.discountPercentage}%</Text><Text style={styles.lineMeta}>Final: {(line.pharmacyPriceAfterDiscount ?? line.unitPrice).toFixed(2)} EGP</Text><Text style={styles.lineMeta}>Quantity: {line.quantity}</Text></View>
              <Text style={styles.lineMeta}>Line before discount: {((line.consumerPrice ?? line.unitPrice) * line.quantity).toFixed(2)} EGP</Text>
              <Text style={styles.lineTotal}>Line after discount: {line.lineTotal.toFixed(2)} EGP</Text>
            </View>)}
          </View>;
        })}

        {order.status === 'pending' ? <View style={styles.actions}>
          <TouchableOpacity style={styles.rejectButton} disabled={submitting} onPress={() => { setActionError(''); setActionFeedback(''); setActionType('reject'); }}><Text style={styles.rejectText}>Reject Order</Text></TouchableOpacity>
          <TouchableOpacity style={styles.approveButton} disabled={submitting} onPress={() => { setActionError(''); setActionFeedback(''); setActionType('approve'); }}><Text style={styles.approveText}>Approve Order</Text></TouchableOpacity>
        </View> : null}
        {order.status === 'approved' ? <View style={styles.actions}>
          <TouchableOpacity style={styles.approveButton} disabled={submitting} onPress={() => { setActionError(''); setActionFeedback(''); setActionType('complete'); }}><Text style={styles.approveText}>Complete Order</Text></TouchableOpacity>
        </View> : null}
      </ScrollView>

      <Modal visible={actionType !== null} transparent animationType="fade" onRequestClose={() => { if (!submitting) setActionType(null); }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{actionType === 'approve' ? 'Approve entire order?' : actionType === 'reject' ? 'Reject entire order?' : 'Complete entire order?'}</Text>
            <Text style={styles.modalText}>{actionType === 'approve' ? 'The persisted order status will become approved. Stock will not change.' : actionType === 'reject' ? 'The persisted order status will become rejected and its deducted stock will be restored.' : 'The persisted order status will become completed. Stock will not change.'}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} disabled={submitting} onPress={() => setActionType(null)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={actionType === 'reject' ? styles.confirmReject : actionType === 'complete' ? styles.confirmComplete : styles.confirmApprove} disabled={submitting} onPress={() => void submitAction()}><Text style={styles.confirmText}>{submitting ? 'Submitting...' : actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Complete'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
function formatDate(date: string) { const parsed = new Date(date); return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString(); }
