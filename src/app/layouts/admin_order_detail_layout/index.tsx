import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import type { Order, OrderLineSnapshot } from '../../models/data_types';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import { t } from '../../i18n';
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
          <Info label={t('admin.orderDetail.pharmacist')} value={order.customerName ?? 'Pharmacist'} />
          <Info label={t('admin.orderDetail.pharmacy')} value={order.pharmacyName ?? 'N/A'} />
          <Info label={t('admin.orderDetail.email')} value={order.pharmacistEmail ?? 'N/A'} />
          <Info label={t('admin.orderDetail.phone')} value={order.pharmacistPhone ?? 'N/A'} />
          <Info label={t('admin.orderDetail.orderDate')} value={formatDate(order.createdAt)} />
          {order.completedAt ? <Info label={t('admin.orderDetail.completedDate')} value={formatDate(order.completedAt)} /> : null}
          <Info label={t('admin.orderDetail.subtotalBeforeDiscount')} value={`${(order.subtotalAmount ?? order.totalPrice + order.totalDiscount).toFixed(2)} EGP`} />
          <Info label={t('admin.orderDetail.discount')} value={`${order.totalDiscount.toFixed(2)} EGP`} />
          <Info label={t('admin.orderDetail.finalTotal')} value={`${order.totalPrice.toFixed(2)} EGP`} />
          <Info label={t('admin.orderDetail.totalQuantity')} value={String(order.totalItems)} />
          <Info label={t('admin.orderDetail.lineCount')} value={String(order.lineCount ?? order.items.length)} />
          {order.rejectionReason ? <View style={styles.rejection}><Text style={styles.rejectionLabel}>{t('admin.orderDetail.rejectionReason')}</Text><Text style={styles.rejectionText}>{order.rejectionReason}</Text></View> : null}
        </View>

        <Text style={styles.sectionTitle}>{t('admin.orderDetail.providerItems')}</Text>
        {groups.map((group) => {
          const subtotalBefore = group.lines.reduce((sum, line) => sum + (line.consumerPrice ?? line.unitPrice) * line.quantity, 0);
          const subtotalAfter = group.lines.reduce((sum, line) => sum + line.lineTotal, 0);
          const quantity = group.lines.reduce((sum, line) => sum + line.quantity, 0);
          return <View key={`${group.type}-${group.lines[0].sellerId}`} style={styles.providerCard}>
            <View style={styles.providerHeader}><View><Text style={styles.providerName}>{group.name}</Text><Text style={styles.providerType}>{group.type === 'store' ? t('admin.orderDetail.store') : t('admin.orderDetail.manufacturer')}</Text></View><Text style={styles.providerSubtotal}>{subtotalAfter.toFixed(2)} EGP</Text></View>
            <Text style={styles.lineMeta}>{t('admin.orderDetail.minimum')}: {group.minimum.toFixed(2)} EGP</Text>
            <Text style={styles.lineMeta}>{t('admin.orderDetail.subtotalBeforeDiscount')}: {subtotalBefore.toFixed(2)} EGP</Text>
            <Text style={styles.lineMeta}>{t('admin.orderDetail.subtotalAfterDiscount')}: {subtotalAfter.toFixed(2)} EGP</Text>
            <Text style={styles.lineMeta}>{t('admin.orderDetail.quantity')}: {quantity} • {t('admin.orderDetail.items')}: {group.lines.length}</Text>
            {group.lines.map((line) => <View key={`${line.productId}-${line.sellerId}`} style={styles.line}>
              <Text style={styles.productName}>{line.productName}</Text>
              {line.dosage ? <Text style={styles.lineMeta}>{t('admin.orderDetail.dosage')}: {line.dosage}</Text> : null}
              {line.packageSize ? <Text style={styles.lineMeta}>{t('admin.orderDetail.package')}: {line.packageSize}</Text> : null}
              {line.variant ? <Text style={styles.lineMeta}>{t('admin.orderDetail.variant')}: {line.variant}</Text> : null}
              {line.specialtyName ? <Text style={styles.lineMeta}>{t('admin.orderDetail.specialty')}: {line.specialtyName}</Text> : null}
              <View style={styles.lineGrid}><Text style={styles.lineMeta}>{t('admin.orderDetail.consumer')}: {(line.consumerPrice ?? line.unitPrice).toFixed(2)} EGP</Text><Text style={styles.lineMeta}>{t('admin.orderDetail.discount')}: {line.discountPercentage}%</Text><Text style={styles.lineMeta}>{t('admin.orderDetail.final')}: {(line.pharmacyPriceAfterDiscount ?? line.unitPrice).toFixed(2)} EGP</Text><Text style={styles.lineMeta}>{t('admin.orderDetail.quantity')}: {line.quantity}</Text></View>
              <Text style={styles.lineMeta}>{t('admin.orderDetail.lineBeforeDiscount')}: {((line.consumerPrice ?? line.unitPrice) * line.quantity).toFixed(2)} EGP</Text>
              <Text style={styles.lineTotal}>{t('admin.orderDetail.lineAfterDiscount')}: {line.lineTotal.toFixed(2)} EGP</Text>
            </View>)}
          </View>;
        })}

        {order.status === 'pending' ? <View style={styles.actions}>
          <TouchableOpacity style={styles.rejectButton} disabled={submitting} onPress={() => { setActionError(''); setActionFeedback(''); setActionType('reject'); }}><Text style={styles.rejectText}>{t('admin.orderDetail.rejectOrder')}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.approveButton} disabled={submitting} onPress={() => { setActionError(''); setActionFeedback(''); setActionType('approve'); }}><Text style={styles.approveText}>{t('admin.orderDetail.approveOrder')}</Text></TouchableOpacity>
        </View> : null}
        {order.status === 'approved' ? <View style={styles.actions}>
          <TouchableOpacity style={styles.approveButton} disabled={submitting} onPress={() => { setActionError(''); setActionFeedback(''); setActionType('complete'); }}><Text style={styles.approveText}>{t('admin.orderDetail.completeOrder')}</Text></TouchableOpacity>
        </View> : null}
      </ScrollView>

      <Modal visible={actionType !== null} transparent animationType="fade" onRequestClose={() => { if (!submitting) setActionType(null); }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{actionType === 'approve' ? t('admin.orderDetail.approveEntireOrder') : actionType === 'reject' ? t('admin.orderDetail.rejectEntireOrder') : t('admin.orderDetail.completeEntireOrder')}</Text>
            <Text style={styles.modalText}>{actionType === 'approve' ? t('admin.orderDetail.approveOrderStatus') : actionType === 'reject' ? t('admin.orderDetail.rejectOrderStatus') : t('admin.orderDetail.completeOrderStatus')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} disabled={submitting} onPress={() => setActionType(null)}><Text style={styles.cancelText}>{t('admin.orderDetail.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={actionType === 'reject' ? styles.confirmReject : actionType === 'complete' ? styles.confirmComplete : styles.confirmApprove} disabled={submitting} onPress={() => void submitAction()}><Text style={styles.confirmText}>{submitting ? t('admin.orderDetail.submitting') : actionType === 'approve' ? t('admin.orderDetail.approve') : actionType === 'reject' ? t('admin.orderDetail.reject') : t('admin.orderDetail.complete')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
function formatDate(date: string) { const parsed = new Date(date); return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString(); }
