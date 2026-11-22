import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FF',
  },
   header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#208AEF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E7EEF9',
  },
  name: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  email: {
    color: '#5D7285',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#1F2A37',
    fontSize: 16,
    
    marginBottom: 12,
  },
  favoriteRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 10,
  },
  favoriteName: {
    color: '#1F2A37',
    
  },
  favoriteMeta: {
    color: '#64748B',
    marginTop: 2,
  },
  empty: {
    color: '#69798A',
  },
});
