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
    color: '#fff',
    fontSize: 20,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#667085',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#d3d3ffa1',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#7baeff',
  },
  itemMeta: {
    marginBottom: 10,
  },
  itemName: {
    color: '#1E2A39',
    
    fontSize: 16,
  },
  itemStore: {
    color: '#667085',
    fontSize: 12,
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitPrice: {
    color: '#208AEF',
    fontSize: 15,
    
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: '#208AEF',
    
    fontSize: 16,
  },
  qtyValue: {
    minWidth: 20,
    textAlign: 'center',
    color: '#1E2A39',
    
  },
  removeButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  removeText: {
    color: '#D14343',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E7EEF9',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryLabel: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryTotal: {
    color: '#208AEF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  checkoutButton: {
    backgroundColor: '#208AEF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 15,
  },
});
