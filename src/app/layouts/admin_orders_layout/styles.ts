import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FF' },
  header: { height: 72, backgroundColor: '#208AEF', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: '#FFFFFF', fontSize: 20, fontWeight: '900', textAlign: 'center' }, headerSpace: { width: 40 },
  searchRow: { margin: 16, marginBottom: 8, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#D9E3EF', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }, searchInput: { flex: 1, height: '100%', paddingHorizontal: 8, color: '#102A43' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16, marginBottom: 8 }, filter: { borderRadius: 10, borderWidth: 1, borderColor: '#D9E3EF', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 7 }, filterActive: { borderColor: '#208AEF', backgroundColor: '#EEF6FF' }, filterText: { color: '#64748B', fontSize: 12, textTransform: 'capitalize', fontWeight: '800' }, filterTextActive: { color: '#208AEF' },
  list: { paddingHorizontal: 16, paddingBottom: 24 }, card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5EDF7', padding: 14, marginBottom: 10 }, cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, orderId: { flex: 1, color: '#102A43', fontWeight: '900', marginRight: 8 }, customer: { color: '#334E68', fontWeight: '800', marginTop: 8 }, meta: { color: '#718096', fontSize: 12, marginTop: 3 }, cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 7 }, total: { color: '#102A43', fontSize: 16, fontWeight: '900' },
  status: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 }, status_pending: { backgroundColor: '#FEF3C7' }, status_approved: { backgroundColor: '#DCFCE7' }, status_rejected: { backgroundColor: '#FFE4E6' }, status_completed: { backgroundColor: '#E0E7FF' }, statusText: { fontSize: 11, fontWeight: '900', textTransform: 'capitalize' }, statusText_pending: { color: '#B45309' }, statusText_approved: { color: '#16794A' }, statusText_rejected: { color: '#BE123C' }, statusText_completed: { color: '#4338CA' },
  empty: { alignItems: 'center', paddingTop: 70 }, emptyTitle: { color: '#102A43', fontSize: 18, fontWeight: '900', marginTop: 8 }, emptyText: { color: '#718096', marginTop: 4 },
  filterButton: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EEF6FF', alignItems: 'center', justifyContent: 'center' },
});
