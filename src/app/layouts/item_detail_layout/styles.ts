import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#208AEF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 22,
    
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF4FF',
    color: '#208AEF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#445',
    lineHeight: 22,
    marginBottom: 20,
  },
  detailsCard: {
    backgroundColor: '#F5F9FF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#1E293B',
    
    flexShrink: 1,
    textAlign: 'right',
  },
});
