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
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  imageWrap: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.36)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EEF9',
    marginBottom: 16,
  },
  storeName: {
    color: '#1E2A39',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  storeDescription: {
    color: '#526070',
    lineHeight: 20,
    marginBottom: 10,
  },
  detailText: {
    color: '#2B4760',
    fontWeight: '600',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    backgroundColor: '#EAF3FF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#208AEF',
  },
  tabText: {
    color: '#208AEF',
    fontSize: 12,
    
  },
  tabTextActive: {
    color: '#fff',
  },
  listWrap: {
    gap: 12,
    paddingBottom: 12,
  },
  emptyState: {
    color: '#667085',
    textAlign: 'center',
    marginTop: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7EEF9',
  },
  orderId: {
    color: '#1E2A39',
    
    marginBottom: 4,
  },
  orderMeta: {
    color: '#5F7285',
    marginTop: 2,
  },
  orderStatus: {
    color: '#208AEF',
    
    marginTop: 8,
    textTransform: 'capitalize',
  },
});
