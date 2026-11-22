import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    height: 150,
    margin: 8,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  card: {
    height: 150,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 4,
  },
});

export default styles;