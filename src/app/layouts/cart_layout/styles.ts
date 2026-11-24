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
  stockMessage: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 10,
  },
  stockMessageText: {
    color: '#C2410C',
    fontWeight: '700',
  },
  providerGroup: {
    marginBottom: 14,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF6FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  providerName: {
    color: '#102A43',
    fontWeight: '900',
  },
  providerType: {
    color: '#208AEF',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
  },
  providerSubtotal: {
    color: '#102A43',
    fontWeight: '900',
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#EAF2FF',
  },
  itemImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#EEF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  itemDosage: {
    color: '#718096',
    fontSize: 12,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  originalPrice: {
    color: '#94A3B8',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    color: '#16794A',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '800',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  lineTotal: {
    color: '#102A43',
    fontWeight: '900',
  },
  qtyButtonDisabled: {
    opacity: 0.45,
  },
});
