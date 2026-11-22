import { Image, Text, View, TouchableOpacity } from 'react-native';
import styles from './styles';
import { Product } from '../../utils/types';

type ProductListItemProps = {
  product: Product;
  onPress: () => void;
};

export default function ProductListItem({ product, onPress }: ProductListItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: product.image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.description}>{product.description}</Text>
      </View>
      <View style={styles.pricing}>
        <Text style={styles.price}>{product.pharmacyPriceAfterDiscount} EGP</Text>
        <Text style={styles.discount}>-{product.discountPercentage}%</Text>
      </View>
    </TouchableOpacity>
  );
}
