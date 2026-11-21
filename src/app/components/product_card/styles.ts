import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F9FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E7EEF9',
    gap: 8,
  },
  image: {
    width: '100%',
    height: 118,
    borderRadius: 10,
    backgroundColor: '#EAF2FF',
  },
  name: {
    fontSize: 15,
    
    color: '#1E2A39',
    marginTop: 8,
  },
  description: {
    fontSize: 12,
    color: '#667085',
    marginTop: 4,
  },
  storeName: {
    fontSize: 12,
    color: '#208AEF',
    fontWeight: '600',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    
    color: '#208AEF',
  },
  originalPrice: {
    fontSize: 11,
    color: '#8A94A6',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    fontSize: 11,
    
    color: '#16A34A',
    backgroundColor: '#EAFBF1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  actionLabel: {
    fontSize: 12,
    color: '#667085',
  },
  addButton: {
    backgroundColor: '#208AEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default styles;