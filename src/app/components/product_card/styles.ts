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
  variantText: {
    fontSize: 11,
    color: '#667085',
    marginTop: 3,
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
    fontWeight: '700',
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
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.45,
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  quantityValue: {
    minWidth: 24,
    textAlign: 'center',
    color: '#1E2A39',
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#208AEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  unavailableButton: {
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  unavailableText: {
    color: '#667085',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default styles;