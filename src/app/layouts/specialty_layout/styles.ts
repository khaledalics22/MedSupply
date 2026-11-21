import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  gridContent: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16 },
  gridRow: { justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  cardWrapper: { width: '49%' },
  card: { backgroundColor: '#F5F9FF', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#E7EEF9' },
  image: { width: '100%', height: 110, borderRadius: 10, marginBottom: 10, backgroundColor: '#EAF2FF' },
  name: { fontSize: 14, color: '#1E2A39', marginBottom: 4 },
  description: { fontSize: 12, color: '#667085' },
});
