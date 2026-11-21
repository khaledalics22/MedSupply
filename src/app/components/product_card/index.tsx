import { Image, Text, TouchableOpacity, View } from 'react-native';
import type { Product, Store, StoreProductOffer, ManufacturerProductOffer } from '../../utils/types';
import styles from './styles';

export type ProductCardProps = {
  product: Product;
  offer?: StoreProductOffer | ManufacturerProductOffer;
  store?: Store;
  manufacturerName?: string;
  showDescription?: boolean;
  showStore?: boolean;
  showDiscount?: boolean;
  showQuantitySelector?: boolean;
  onPress?: () => void;
  onAddToCart?: () => void;
};

export default function ProductCard({
  product,
  offer,
  store,
  manufacturerName,
  showDescription = true,
  showStore = true,
  showDiscount = true,
  showQuantitySelector = false,
  onPress,
  onAddToCart,
}: ProductCardProps) {
  const price = offer?.pharmacyPriceAfterDiscount ?? product.price ?? 0;
  const originalPrice = offer?.consumerPrice ?? product.originalPrice ?? price;
  const discount = offer?.discountPercentage ?? product.discountPercentage ?? 0;
  const sellerName = store?.name ?? manufacturerName;

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <Image source={{ uri: product.image ?? 'https://picsum.photos/seed/product/120' }} style={styles.image} />
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        {showDescription && (
          <Text style={styles.description} numberOfLines={2}>{product.description ?? 'No description available'}</Text>
        )}
        {showStore && sellerName && (
          <Text style={styles.storeName} numberOfLines={1}>{sellerName}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.priceRow}>
        <View>
          <Text style={styles.price}>{price} EGP</Text>
          {originalPrice > price && (
            <Text style={styles.originalPrice}>{originalPrice} EGP</Text>
          )}
        </View>
        {showDiscount && discount > 0 && (
          <Text style={styles.discountBadge}>-{discount}%</Text>
        )}
      </View>

      {(showQuantitySelector || onAddToCart) && (
        <View style={styles.actionRow}>
          <Text style={styles.actionLabel}>{showQuantitySelector ? 'Qty' : 'Add'}</Text>
          <TouchableOpacity onPress={onAddToCart} style={styles.addButton} activeOpacity={0.8}>
            <Text style={styles.addButtonText}>{showQuantitySelector ? 'Add' : '+'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
