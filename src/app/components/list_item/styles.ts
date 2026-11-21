import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#208AEF',
  },
  pricing: {
    alignItems: 'flex-end',
  },
  discount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E9E4F',
    marginTop: 2,
  },
});
