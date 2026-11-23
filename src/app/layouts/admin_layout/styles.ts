import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FF' },
  header: { backgroundColor: '#208AEF', paddingHorizontal: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, marginLeft: 12 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  subtitle: { color: '#EAF4FF', marginTop: 2 },
  logoutButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  card: { margin: 20, marginTop: 32, backgroundColor: '#FFFFFF', borderRadius: 20, alignItems: 'center', padding: 24, borderWidth: 1, borderColor: '#E5EDF7' },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EEF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  cardTitle: { color: '#102A43', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  cardText: { color: '#718096', textAlign: 'center', lineHeight: 21, marginTop: 8, maxWidth: 380 },
  badge: { marginTop: 18, backgroundColor: '#EAF4FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  badgeText: { color: '#208AEF', fontWeight: '800' },
});
