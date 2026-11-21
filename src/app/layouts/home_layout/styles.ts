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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 22,
    
    color: '#fff',
  },
  languageButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  languageButtonText: {
    color: '#fff',
    fontSize: 11,
    
  },
  notification: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    padding: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    gap: 16,
  },
  row: {
    gap: 16,
    marginBottom: 0,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#208AEF',
    borderRadius: 12,
    padding: 16,
    gap: 16,
    marginBottom: 16,
  },
  bannerLeft: {
    alignItems: 'center',
    gap: 8,
  },
  bannerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  bannerButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bannerButtonText: {
    color: '#208AEF',
    fontWeight: '600',
    fontSize: 12,
  },
  bannerDescription: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
});
