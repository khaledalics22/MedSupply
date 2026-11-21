import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexShrink: 0, 
    justifyContent: 'space-between',
    backgroundColor: '#208AEF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterMenuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropDownMenu: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E7EEF9',
    overflow: 'hidden',
  },
  menuHeader: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    color: '#208AEF',
    fontSize: 15,
    
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF4FF',
  },
  menuOptionSelected: {
    backgroundColor: '#F4F9FF',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#208AEF',
  },
  menuOptionText: {
    color: '#1F2A37',
    fontSize: 14,
    fontWeight: '600',
  },
  menuOptionTextSelected: {
    color: '#208AEF',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 4,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyState: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 20,
  },
});
