import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 16,
    paddingBottom: 0,
    flexShrink: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },

  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  gridCardWrapper: {
    width: '49%',
    marginBottom: 12,
  },
  gridCard: {
    width: '100%',
    backgroundColor: '#F5F9FF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E7EEF9',
    shadowColor: '#4A76A8',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  gridImage: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#EAF2FF',
  },
  gridName: {
    fontSize: 14,
    
    color: '#1E2A39',
    marginBottom: 4,
  },
  gridPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#208AEF',
  },
  listContent: {
    gap: 12,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 16,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  listImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  listTextWrap: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#208AEF',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#D9EAFB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F9FF',
  },
  filterButtonActive: {
    backgroundColor: '#208AEF',
    borderColor: '#208AEF',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#208AEF',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  emptyState: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
