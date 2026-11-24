import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FF' },
  profileHeader: { backgroundColor: '#208AEF', paddingHorizontal: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  profileHeaderText: { flex: 1, marginHorizontal: 12 },
  name: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' }, email: { color: '#EAF4FF', marginTop: 3 },
  editButton: { height: 38, borderRadius: 10, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 5 }, editText: { color: '#208AEF', fontWeight: '900' },
  content: { paddingBottom: 32 }, error: { color: '#C2410C', backgroundColor: '#FFF7ED', borderRadius: 10, padding: 12, marginHorizontal: 16, marginTop: 12 }, success: { color: '#16794A', backgroundColor: '#DCFCE7', borderRadius: 10, padding: 12, marginHorizontal: 16, marginTop: 12, fontWeight: '700' },
  panel: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderColor: '#E7EEF9' }, sectionTitle: { color: '#102A43', fontSize: 17, fontWeight: '900', marginBottom: 12 },
  field: { marginBottom: 12 }, label: { color: '#334E68', fontWeight: '800', marginBottom: 7 }, input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E5EDF7', backgroundColor: '#F8FAFC', color: '#102A43', paddingHorizontal: 12, paddingVertical: 10 }, inputEditable: { backgroundColor: '#FFFFFF', borderColor: '#BFDFFF' }, textArea: { minHeight: 74, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 14 }, cancelButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#D9E3EF', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, cancelText: { color: '#334E68', fontWeight: '900' }, saveButton: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center' }, saveText: { color: '#FFFFFF', fontWeight: '900' },
  settingRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEF4F9', paddingTop: 10 }, settingIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEF6FF', alignItems: 'center', justifyContent: 'center' }, settingText: { flex: 1, marginHorizontal: 10 }, settingTitle: { color: '#102A43', fontWeight: '900' }, settingMeta: { color: '#718096', fontSize: 12, marginTop: 2 },
  favoriteRow: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10, marginTop: 8 }, favoriteName: { color: '#1F2A37', fontWeight: '800' }, favoriteMeta: { color: '#64748B', marginTop: 2 }, empty: { color: '#69798A' },
  logoutButton: { marginHorizontal: 16, marginTop: 14, height: 50, borderRadius: 12, backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, logoutText: { color: '#BE123C', fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,.55)', justifyContent: 'center', padding: 20 }, modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 }, modalTitle: { color: '#102A43', fontSize: 20, fontWeight: '900', marginBottom: 12 }, modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
