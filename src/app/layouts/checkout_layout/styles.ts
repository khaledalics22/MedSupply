import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FF',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    color: '#208AEF',
    
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginRight: 48,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EEF9',
  },
  section: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    color: '#49586A',
  },
  value: {
    color: '#0F172A',
    
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    paddingTop: 12,
    marginTop: 12,
  },
  totalLabel: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  totalValue: {
    color: '#208AEF',
    fontSize: 18,
    fontWeight: '800',
  },
  empty: {
    color: '#69798A',
  },
  confirmButton: {
    backgroundColor: '#208AEF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  issuesBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
    padding: 12,
    marginBottom: 12,
  },
  issuesTitle: {
    color: '#BE123C',
    fontWeight: '900',
    marginBottom: 5,
  },
  issueText: {
    color: '#9F1239',
    lineHeight: 18,
  },
  confirmationMessage: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  confirmationText: {
    color: '#16794A',
    textAlign: 'center',
    fontWeight: '800',
  },
  providerGroup: {
    marginBottom: 12,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF6FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  providerName: {
    color: '#102A43',
    fontWeight: '900',
  },
  providerType: {
    color: '#208AEF',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
  },
  providerSubtotal: {
    color: '#102A43',
    fontWeight: '900',
  },
  checkoutItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  checkoutDosage: {
    color: '#718096',
    fontSize: 12,
    marginTop: 2,
  },
  checkoutMeta: {
    color: '#718096',
    fontSize: 11,
    marginTop: 3,
  },
  confirmButtonDisabled: {
    opacity: 0.55,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,.55)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  modalTitle: { color: '#102A43', fontSize: 20, fontWeight: '900' },
  modalText: { color: '#718096', lineHeight: 20, marginTop: 8, marginBottom: 14 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#D9E3EF', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#334E68', fontWeight: '800' },
  confirmButtonModal: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
});
