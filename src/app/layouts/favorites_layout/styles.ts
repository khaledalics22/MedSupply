import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FF' },
  header: { height: 72, backgroundColor: '#208AEF', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }, backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }, title: { flex: 1, color: '#FFFFFF', fontSize: 20, fontWeight: '900', textAlign: 'center' }, headerSpace: { width: 40 },
  searchRow: { margin: 16, marginBottom: 8, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#D9E3EF', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }, searchInput: { flex: 1, height: '100%', paddingHorizontal: 8, color: '#102A43' },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16, marginBottom: 10 }, sortButton: { borderRadius: 10, borderWidth: 1, borderColor: '#D9E3EF', backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 7 }, sortButtonActive: { borderColor: '#208AEF', backgroundColor: '#EEF6FF' }, sortText: { color: '#64748B', fontSize: 11, fontWeight: '800' }, sortTextActive: { color: '#208AEF' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 }, unavailableNotice: { backgroundColor: '#FFF1F2', borderRadius: 10, borderWidth: 1, borderColor: '#FECDD3', padding: 9, marginBottom: 6 }, unavailableText: { color: '#BE123C', fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 70 }, emptyTitle: { color: '#102A43', fontSize: 18, fontWeight: '900', marginTop: 8 }, emptyText: { color: '#718096', textAlign: 'center', marginTop: 4, paddingHorizontal: 24 },
});
