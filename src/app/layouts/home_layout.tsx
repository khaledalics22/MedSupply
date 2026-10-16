import { Ionicons } from '@expo/vector-icons';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GridItem from '../components/grid_item';

const categories = [
  { title: 'Medicines', image: 'https://picsum.photos/seed/medicines/100' },
  { title: 'Equipment', image: 'https://picsum.photos/seed/equipment/100' },
  { title: 'Supplies', image: 'https://picsum.photos/seed/supplies/100' },
  { title: 'Devices', image: 'https://picsum.photos/seed/devices/100' },
  { title: 'Vitamins', image: 'https://picsum.photos/seed/vitamins/100' },
  { title: 'First Aid', image: 'https://picsum.photos/seed/firstaid/100' },
  { title: 'Hygiene', image: 'https://picsum.photos/seed/hygiene/100' },
  { title: 'Lab', image: 'https://picsum.photos/seed/lab/100' },
];

export default function Home() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.appName}>MedSupply</Text>
          <TouchableOpacity style={styles.notification} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.9)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="rgba(255,255,255,0.8)"
          />
        </View>
      </SafeAreaView>

      <FlatList
        data={categories}
        numColumns={2}
        keyExtractor={(item) => item.title}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          <View style={styles.banner}>
            <View style={styles.bannerLeft}>
              <Image
                source={{ uri: 'https://picsum.photos/seed/credit/100' }}
                style={styles.bannerImage}
              />
              <TouchableOpacity style={styles.bannerButton} activeOpacity={0.7}>
                <Text style={styles.bannerButtonText}>Add credit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.bannerDescription}>
              Top up your account and get instant access to exclusive offers.
            </Text>
          </View>
        }
        renderItem={({ item }) => <GridItem title={item.title} image={item.image} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
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
  grid: {
    padding: 16,
    gap: 16,
  },
  row: {
    gap: 16,
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
