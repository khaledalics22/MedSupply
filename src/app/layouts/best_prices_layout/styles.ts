import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#208AEF', paddingHorizontal: 16, paddingBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  filterButton: { borderWidth: 1, borderColor: '#D9EAFB', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F5F9FF' },
  filterButtonActive: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  filterButtonText: { fontSize: 12, fontWeight: '600', color: '#208AEF' },
  filterButtonTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 12, paddingBottom: 16, gap: 12 },
  emptyState: { fontSize: 14, color: '#667085', textAlign: 'center', paddingVertical: 24 },
});
