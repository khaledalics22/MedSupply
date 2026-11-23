import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FF',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    color: '#208AEF',
    
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginRight: 48,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EEF9',
  },
  section: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    color: '#49586A',
  },
  value: {
    color: '#0F172A',
    
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    paddingTop: 12,
    marginTop: 12,
  },
  totalLabel: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  totalValue: {
    color: '#208AEF',
    fontSize: 18,
    fontWeight: '800',
  },
  empty: {
    color: '#69798A',
  },
  confirmButton: {
    backgroundColor: '#208AEF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
