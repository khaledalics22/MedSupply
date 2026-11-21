import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FF',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#EAF2FF',
  },
  tabActive: {
    backgroundColor: '#208AEF',
  },
  tabText: {
    color: '#208AEF',
    
  },
  tabTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7EEF9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    color: '#1F2A37',
    
  },
  status: {
    color: '#208AEF',
    textTransform: 'capitalize',
  },
  store: {
    color: '#374151',
    fontWeight: '600',
    marginBottom: 4,
  },
  meta: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 2,
  },
  total: {
    marginTop: 8,
    color: '#0F172A',
    
    fontSize: 16,
  },
  emptyState: {
    color: '#69798A',
    textAlign: 'center',
    marginTop: 30,
  },
});
