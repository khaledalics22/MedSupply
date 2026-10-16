import { Image, StyleSheet, Text, View } from 'react-native';

type ListItemProps = {
  image: string;
  title: string;
  description: string;
  price: number;
  discount: number;
};

export default function ListItem({ image, title, description, price, discount }: ListItemProps) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.pricing}>
        <Text style={styles.price}>{price} EGP</Text>
        <Text style={styles.discount}>-{discount}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
