import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { User } from '../../models/auth';
import { authService } from '../../models/auth_service';
import { useAppState } from '../../state/app_state';
import styles from './styles';

export default function PharmacistDetailLayout({ pharmacistId, onBack }: { pharmacistId: string; onBack: () => void }) {
  const { orders } = useAppState();
  const [pharmacist, setPharmacist] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [approveVisible, setApproveVisible] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [inactiveVisible, setInactiveVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    authService.getPharmacists().then((items) => setPharmacist(items.find((item) => item.id === pharmacistId) ?? null)).catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load pharmacist')).finally(() => setLoading(false));
  }, [pharmacistId]);

  const refresh = async () => {
    const items = await authService.getPharmacists();
    setPharmacist(items.find((item) => item.id === pharmacistId) ?? null);
  };

  const orderHistory = useMemo(() => orders.filter((order) => order.pharmacistId === pharmacistId), [orders, pharmacistId]);

  const approve = async () => {
    if (!pharmacist || pharmacist.accountStatus !== 'pending' || submitting) return;
    setSubmitting(true);
    setError('');
    try { await authService.setPharmacistStatus(pharmacist.id, 'active'); await refresh(); setApproveVisible(false); setFeedback('Pharmacist approved successfully.'); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to approve pharmacist.'); } finally { setSubmitting(false); }
  };

  const reject = async () => {
    if (!pharmacist || pharmacist.accountStatus !== 'pending' || submitting) return;
    if (!reason.trim()) { setError('A rejection reason is required.'); return; }
    setSubmitting(true);
    setError('');
    try { await authService.setPharmacistStatus(pharmacist.id, 'rejected', reason); await refresh(); setRejectVisible(false); setReason(''); setFeedback('Pharmacist rejected successfully.'); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to reject pharmacist.'); } finally { setSubmitting(false); }
  };

  const deactivate = async () => {
    if (!pharmacist || pharmacist.accountStatus !== 'active') return;
    setError('');
    try { await authService.setPharmacistStatus(pharmacist.id, 'inactive'); await refresh(); setInactiveVisible(false); setFeedback('Pharmacist account deactivated.'); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to deactivate pharmacist.'); }
  };

  const reactivate = async () => {
    if (!pharmacist || pharmacist.accountStatus !== 'inactive') return;
    setError('');
    try { await authService.setPharmacistStatus(pharmacist.id, 'active'); await refresh(); setFeedback('Pharmacist account reactivated.'); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to reactivate pharmacist.'); }
  };

  if (loading) return <View style={styles.container}><Text style={styles.loading}>Loading pharmacist...</Text></View>;
  if (!pharmacist) return <View style={styles.container}><View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Pharmacist not found</Text></View></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Pharmacist Details</Text><View style={styles.headerSpace} /></View>
      <ScrollView contentContainerStyle={styles.content}>
        {feedback ? <Text style={styles.success}>{feedback}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.card}>
          <View style={styles.identity}><View style={styles.avatar}><Ionicons name="person-outline" size={30} color="#208AEF" /></View><View style={styles.identityText}><Text style={styles.name}>{pharmacist.fullName}</Text><Text style={styles.statusText}>{pharmacist.accountStatus ?? 'pending'}</Text></View></View>
          <Info label="Email" value={pharmacist.email} /><Info label="Phone" value={pharmacist.phone ?? 'Unavailable'} /><Info label="Registered" value={new Date(pharmacist.createdAt).toLocaleString()} />
        </View>

        <View style={styles.card}><Text style={styles.sectionTitle}>Pharmacy Information</Text><Info label="Pharmacy name" value={pharmacist.pharmacyName ?? 'Not provided'} /><Info label="Address" value={pharmacist.pharmacyAddress ?? 'Not provided'} /></View>

        {pharmacist.rejectionReason ? <View style={styles.rejection}><Text style={styles.rejectionLabel}>Rejection reason</Text><Text style={styles.rejectionText}>{pharmacist.rejectionReason}</Text></View> : null}

        {pharmacist.accountStatus === 'pending' ? <View style={styles.actions}><TouchableOpacity style={styles.rejectButton} onPress={() => setRejectVisible(true)}><Text style={styles.rejectText}>Reject</Text></TouchableOpacity><TouchableOpacity style={styles.approveButton} onPress={() => setApproveVisible(true)}><Text style={styles.approveText}>Approve</Text></TouchableOpacity></View> : null}
        {pharmacist.accountStatus === 'active' ? <TouchableOpacity style={styles.inactiveButton} onPress={() => setInactiveVisible(true)}><Text style={styles.inactiveText}>Deactivate account</Text></TouchableOpacity> : null}
        {pharmacist.accountStatus === 'inactive' ? <TouchableOpacity style={styles.approveButton} onPress={() => void reactivate()}><Text style={styles.approveText}>Reactivate account</Text></TouchableOpacity> : null}

        <View style={styles.card}><Text style={styles.sectionTitle}>Order History</Text>{orderHistory.length === 0 ? <Text style={styles.empty}>No orders found.</Text> : orderHistory.map((order) => <View key={order.id} style={styles.orderRow}><Text style={styles.orderId}>{order.id}</Text><Text style={styles.orderMeta}>{order.status} • {order.totalItems} items • {order.totalPrice.toFixed(2)} EGP</Text></View>)}</View>
        {pharmacist.accountDecisions?.length ? <View style={styles.card}><Text style={styles.sectionTitle}>Decision History</Text>{pharmacist.accountDecisions.map((decision, index) => <View key={`${decision.decidedAt}-${index}`} style={styles.orderRow}><Text style={styles.orderId}>{decision.status}</Text><Text style={styles.orderMeta}>{new Date(decision.decidedAt).toLocaleString()}</Text>{decision.reason ? <Text style={styles.orderMeta}>Reason: {decision.reason}</Text> : null}</View>)}</View> : null}
      </ScrollView>

      <Modal visible={approveVisible} transparent animationType="fade" onRequestClose={() => setApproveVisible(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>Approve pharmacist?</Text><Text style={styles.modalText}>This will allow the account to log in.</Text><View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setApproveVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmApprove} onPress={() => void approve()}><Text style={styles.confirmText}>Approve</Text></TouchableOpacity></View></View></View></Modal>
      <Modal visible={rejectVisible} transparent animationType="fade" onRequestClose={() => setRejectVisible(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>Reject pharmacist?</Text><TextInput value={reason} onChangeText={setReason} placeholder="Rejection reason" style={styles.reasonInput} multiline /><View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setRejectVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmReject} onPress={() => void reject()}><Text style={styles.confirmText}>Reject</Text></TouchableOpacity></View></View></View></Modal>
      <Modal visible={inactiveVisible} transparent animationType="fade" onRequestClose={() => setInactiveVisible(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>Deactivate account?</Text><Text style={styles.modalText}>The pharmacist will not be able to log in or place new orders.</Text><View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setInactiveVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmReject} onPress={() => void deactivate()}><Text style={styles.confirmText}>Deactivate</Text></TouchableOpacity></View></View></View></Modal>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
