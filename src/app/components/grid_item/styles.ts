import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F2F6FA',
    borderRadius: 12,
    shadowRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    gap: 8,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 12,
    color: '#666',
  },
});
