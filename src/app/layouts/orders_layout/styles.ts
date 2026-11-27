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
    minWidth: 112,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
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
  detailHeader: {
    height: 72,
    backgroundColor: '#208AEF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailBack: {
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,.16)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  detailBackText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  detailTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginRight: 52,
  },
  detailList: {
    padding: 16,
    paddingBottom: 32,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EEF9',
    padding: 14,
    marginBottom: 10,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EEF9',
    padding: 14,
    marginBottom: 10,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F9',
    paddingBottom: 8,
  },
  line: {
    borderTopWidth: 1,
    borderTopColor: '#EEF4F9',
    paddingTop: 10,
    marginTop: 8,
  },
  reasonBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  reasonLabel: {
    color: '#BE123C',
    fontWeight: '900',
  },
  reasonText: {
    color: '#9F1239',
    marginTop: 3,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EEF9',
    padding: 14,
    marginBottom: 10
  },
  timelineStep: {
    flex: 1,
    alignItems: 'center',
    opacity: 0.45
  },
  timelineStepActive: {
    opacity: 1
  },
  timelineBullet: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    marginBottom: 6
  },
  timelineBulletActive: {
    borderColor: '#208AEF',
    backgroundColor: '#208AEF'
  },
  timelineLabel: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14
  },
  timelineLabelActive: {
    color: '#208AEF',
    fontWeight: '800'
  },
  reorderButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  reorderText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16
  },
  reorderFeedbackBox: {
    backgroundColor: '#EEF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDFFF',
    padding: 12,
    marginBottom: 10
  },
  reorderFeedbackText: {
    color: '#334E68',
    lineHeight: 18
  },
});
