import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { OrderLineSnapshot } from '../../models/data_types';
import { useAppState } from '../../state/app_state';
import styles from './styles';

export default function AdminOrderDetailLayout({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const { orders, approveOrder, rejectOrder } = useAppState();
  const order = orders.find((item) => item.id === orderId);
  const [approveConfirm, setApproveConfirm] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const groups = useMemo(() => {
    const result = new Map<string, { name: string; type: 'store' | 'manufacturer'; lines: OrderLineSnapshot[] }>();
    for (const line of order?.items ?? []) {
      const key = `${line.sellerType}-${line.sellerId}`;
      const existing = result.get(key);
      if (existing) existing.lines.push(line);
      else result.set(key, { name: line.sellerName, type: line.sellerType, lines: [line] });
    }
    return Array.from(result.values());
  }, [order]);

  if (!order) return <View style={styles.container}><View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Order not found</Text></View></View>;

  const approve = () => {
    const result = approveOrder(order.id);
    setApproveConfirm(false);
    if (result.success) { setErrors([]); setFeedback('Order approved successfully. Stock has been deducted once.'); }
    else setErrors(result.errors);
  };

  const reject = () => {
    if (!reason.trim()) { setErrors(['A rejection reason is required.']); return; }
    if (rejectOrder(order.id, reason)) { setRejectConfirm(false); setErrors([]); setFeedback('Order rejected. The pharmacist can view the reason.'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Order Details</Text><View style={styles.headerSpace} /></View>
      <ScrollView contentContainerStyle={styles.content}>
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        {errors.length > 0 ? <View style={styles.errorBox}>{errors.map((error) => <Text key={error} style={styles.errorText}>• {error}</Text>)}</View> : null}
        <View style={styles.infoCard}>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.status}>{order.status}</Text>
          <Info label="Pharmacist" value={order.customerName ?? 'Pharmacist'} />
          <Info label="Order date" value={formatDate(order.createdAt)} />
          <Info label="Total items" value={String(order.totalItems)} />
          <Info label="Overall total" value={`${order.totalPrice.toFixed(2)} EGP`} />
          {order.rejectionReason ? <View style={styles.rejection}><Text style={styles.rejectionLabel}>Rejection reason</Text><Text style={styles.rejectionText}>{order.rejectionReason}</Text></View> : null}
        </View>

        <Text style={styles.sectionTitle}>Provider Items</Text>
        {groups.map((group) => {
          const subtotal = group.lines.reduce((sum, line) => sum + line.lineTotal, 0);
          return <View key={`${group.type}-${group.lines[0].sellerId}`} style={styles.providerCard}>
            <View style={styles.providerHeader}><View><Text style={styles.providerName}>{group.name}</Text><Text style={styles.providerType}>{group.type === 'store' ? 'Store' : 'Manufacturer'}</Text></View><Text style={styles.providerSubtotal}>{subtotal.toFixed(2)} EGP</Text></View>
            {group.lines.map((line) => <View key={`${line.productId}-${line.sellerId}`} style={styles.line}>
              <Text style={styles.productName}>{line.productName}</Text>
              <Text style={styles.lineMeta}>Dosage: {line.dosage ?? 'N/A'}</Text>
              <View style={styles.lineGrid}><Text style={styles.lineMeta}>Consumer: {(line.consumerPrice ?? line.unitPrice).toFixed(2)} EGP</Text><Text style={styles.lineMeta}>Discount: {line.discountPercentage}%</Text><Text style={styles.lineMeta}>Pharmacist: {(line.pharmacyPriceAfterDiscount ?? line.unitPrice).toFixed(2)} EGP</Text><Text style={styles.lineMeta}>Quantity: {line.quantity}</Text></View>
              <Text style={styles.lineTotal}>Line total: {line.lineTotal.toFixed(2)} EGP</Text>
            </View>)}
          </View>;
        })}

        {order.status === 'pending' ? <View style={styles.actions}><TouchableOpacity style={styles.rejectButton} onPress={() => { setErrors([]); setRejectConfirm(true); }}><Text style={styles.rejectText}>Reject Order</Text></TouchableOpacity><TouchableOpacity style={styles.approveButton} onPress={() => { setErrors([]); setApproveConfirm(true); }}><Text style={styles.approveText}>Approve Order</Text></TouchableOpacity></View> : null}
      </ScrollView>

      <Modal visible={approveConfirm} transparent animationType="fade" onRequestClose={() => setApproveConfirm(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>Approve entire order?</Text><Text style={styles.modalText}>Stock for every provider-owned item will be validated and deducted once.</Text><View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setApproveConfirm(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmApprove} onPress={approve}><Text style={styles.confirmText}>Approve</Text></TouchableOpacity></View></View></View></Modal>

      <Modal visible={rejectConfirm} transparent animationType="fade" onRequestClose={() => setRejectConfirm(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>Reject entire order?</Text><Text style={styles.modalText}>Provide a clear reason for the pharmacist.</Text><TextInput value={reason} onChangeText={setReason} placeholder="Rejection reason" style={styles.reasonInput} multiline /><View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setRejectConfirm(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmReject} onPress={reject}><Text style={styles.confirmText}>Reject</Text></TouchableOpacity></View></View></View></Modal>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
function formatDate(date: string) { const parsed = new Date(date); return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString(); }
