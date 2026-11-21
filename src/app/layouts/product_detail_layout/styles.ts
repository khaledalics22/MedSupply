import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#208AEF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    
  },
  content: {
    padding: 16,
    gap: 16,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: '#EAF3FF',
  },
  sectionTitle: {
    color: '#1E2A39',
    fontSize: 18,
    
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EEF9',
  },
  label: {
    color: '#667085',
    fontSize: 12,
    
    marginTop: 8,
  },
  value: {
    color: '#1E2A39',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7EEF9',
    gap: 8,
  },
  storeName: {
    color: '#208AEF',
    
    fontSize: 16,
  },
  offerPrice: {
    color: '#1E2A39',
    fontWeight: '800',
    fontSize: 18,
  },
  offerOldPrice: {
    color: '#8A94A6',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  offerDiscount: {
    color: '#16A34A',
    
    fontSize: 12,
  },
  emptyText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '600',
  },
});
