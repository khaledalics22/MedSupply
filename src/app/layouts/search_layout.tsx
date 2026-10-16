import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ListItem from '../components/list_item';

const items = [
  { title: 'Alice Johnson', description: 'Cardiology', image: 'https://i.pravatar.cc/100?img=1', price: 150, discount: 10 },
  { title: 'Bob Smith', description: 'Neurology', image: 'https://i.pravatar.cc/100?img=2', price: 200, discount: 15 },
  { title: 'Carol Williams', description: 'Pediatrics', image: 'https://i.pravatar.cc/100?img=3', price: 120, discount: 5 },
  { title: 'David Brown', description: 'Oncology', image: 'https://i.pravatar.cc/100?img=4', price: 300, discount: 20 },
  { title: 'Emma Davis', description: 'Radiology', image: 'https://i.pravatar.cc/100?img=5', price: 180, discount: 8 },
  { title: 'Frank Miller', description: 'Surgery', image: 'https://i.pravatar.cc/100?img=6', price: 500, discount: 25 },
  { title: 'Grace Wilson', description: 'Dermatology', image: 'https://i.pravatar.cc/100?img=7', price: 160, discount: 12 },
  { title: 'Henry Moore', description: 'Orthopedics', image: 'https://i.pravatar.cc/100?img=8', price: 220, discount: 18 },
];

export default function Search() {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#888"
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <ListItem
            image={item.image}
            title={item.title}
            description={item.description}
            price={item.price}
            discount={item.discount}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F6FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    color: '#333',
    padding: 0,
  },
});
