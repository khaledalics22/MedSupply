import { FlatList, StyleSheet, Text, View } from 'react-native';

const names = [
  'Alice Johnson',
  'Bob Smith',
  'Carol Williams',
  'David Brown',
  'Emma Davis',
  'Frank Miller',
  'Grace Wilson',
  'Henry Moore',
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={names}
        keyExtractor={(item) => item}
        renderItem={({ item }) => <Text style={styles.name}>{item}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  name: {
    fontSize: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
});
