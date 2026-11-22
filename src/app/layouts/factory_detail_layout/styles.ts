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
  image: {
    width: '100%',
    height: 200,
    borderRadius: 18,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EEF9',
    marginBottom: 20,
  },
  name: {
    color: '#1E2A39',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  description: {
    color: '#56677A',
    lineHeight: 20,
    marginBottom: 10,
  },
  detail: {
    color: '#2B4760',
    fontWeight: '600',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#1E2A39',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  listWrap: {
    gap: 12,
  },
  emptyState: {
    textAlign: 'center',
    color: '#667085',
    paddingVertical: 20,
  },
});
