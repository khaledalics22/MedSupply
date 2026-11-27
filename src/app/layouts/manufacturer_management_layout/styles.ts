import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FF' },
  header: { height: 72, backgroundColor: '#208AEF', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: '#FFFFFF', fontSize: 19, fontWeight: '900', textAlign: 'center' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' },
  feedback: { color: '#16794A', backgroundColor: '#DCFCE7', borderRadius: 10, padding: 12, marginHorizontal: 16, marginTop: 12, fontWeight: '700' },
  searchRow: { margin: 16, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#D9E3EF', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  searchInput: { flex: 1, height: '100%', color: '#102A43', paddingHorizontal: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5EDF7', padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#EEF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 }, name: { color: '#102A43', fontSize: 16, fontWeight: '900', marginBottom: 3 }, meta: { color: '#718096', fontSize: 12, marginTop: 1 },
  status: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5, marginLeft: 8 }, active: { backgroundColor: '#DCFCE7' }, inactive: { backgroundColor: '#F1F5F9' }, statusText: { fontSize: 11, fontWeight: '900', textTransform: 'capitalize' }, activeText: { color: '#16794A' }, inactiveText: { color: '#64748B' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }, emptyTitle: { color: '#102A43', fontSize: 18, fontWeight: '900', marginTop: 10 }, emptyText: { color: '#718096', textAlign: 'center', marginTop: 6 },
  filterButton: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EEF6FF', alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16, marginBottom: 8 },
  filter: { borderRadius: 10, borderWidth: 1, borderColor: '#D9E3EF', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 7 },
  filterActive: { borderColor: '#208AEF', backgroundColor: '#EEF6FF' },
  filterText: { color: '#64748B', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  filterTextActive: { color: '#208AEF' },
});
