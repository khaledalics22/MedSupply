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
  cartQuantity?: number;
  maxQuantity?: number;
  onPress?: () => void;
  onAddToCart?: () => void;
  onIncreaseQuantity?: () => void;
  onDecreaseQuantity?: () => void;
};

export default function ProductCard({
  product,
  offer,
  store,
  manufacturerName,
  showDescription = true,
  showStore = true,
  showDiscount = true,
  cartQuantity = 0,
  maxQuantity,
  onPress,
  onAddToCart,
  onIncreaseQuantity,
  onDecreaseQuantity,
}: ProductCardProps) {
  const price = offer?.pharmacyPriceAfterDiscount ?? product.price ?? 0;
  const consumerPrice = offer?.consumerPrice ?? product.originalPrice ?? price;
  const discount = offer?.discountPercentage ?? product.discountPercentage ?? 0;
  const sellerName = store?.name ?? manufacturerName;
  const variantText = [product.dosage, product.packageSize, product.variant].filter(Boolean).join(' • ');

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <Image source={{ uri: product.image ?? 'https://picsum.photos/seed/product/120' }} style={styles.image} />
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        {variantText ? <Text style={styles.variantText} numberOfLines={1}>{variantText}</Text> : null}
        {showDescription && (
          <Text style={styles.description} numberOfLines={2}>{product.description ?? 'No description available'}</Text>
        )}
        {showStore && sellerName && (
          <Text style={styles.storeName} numberOfLines={1}>{sellerName}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.priceRow}>
        <View>
          <Text style={styles.originalPrice}>{consumerPrice} EGP</Text>
          <Text style={styles.price}>{price} EGP</Text>
        </View>
        {showDiscount && discount > 0 && (
          <Text style={styles.discountBadge}>-{discount}%</Text>
        )}
      </View>

      {cartQuantity > 0 && onDecreaseQuantity && onIncreaseQuantity ? (
        <View style={styles.quantityRow}>
          <TouchableOpacity onPress={onDecreaseQuantity} style={styles.quantityButton} activeOpacity={0.8}>
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{cartQuantity}</Text>
          <TouchableOpacity
            onPress={onIncreaseQuantity}
            disabled={maxQuantity !== undefined && cartQuantity >= maxQuantity}
            style={[styles.quantityButton, maxQuantity !== undefined && cartQuantity >= maxQuantity && styles.quantityButtonDisabled]}
            activeOpacity={0.8}>
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      ) : onAddToCart ? (
        <TouchableOpacity onPress={onAddToCart} style={styles.addButton} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>Add to cart</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
