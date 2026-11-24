import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Product, Store } from '../../utils/types';
import styles from './styles';

export type ProductCardProps = {
  product: Product;
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
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

export default function ProductCard({
  product,
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
  isFavorite = false,
  onToggleFavorite,
}: ProductCardProps) {
  const consumerPrice = product.consumerPrice;
  const pharmacyPrice = product.pharmacyPriceAfterDiscount;
  const discount = product.discountPercentage;
  const sellerName = store?.name ?? manufacturerName;
  const variantText = [product.dosage, product.packageSize, product.variant].filter(Boolean).join(' • ');

  return (
    <View style={styles.container}>
      {onToggleFavorite ? (
        <TouchableOpacity style={styles.favoriteButton} onPress={onToggleFavorite} activeOpacity={0.8} accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#FF4D67' : '#94A3B8'} />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <Image source={{ uri: product.image ?? 'https://picsum.photos/seed/product/120' }} style={styles.image} />
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        {variantText ? <Text style={styles.variantText} numberOfLines={1}>{variantText}</Text> : null}
        {showDescription && <Text style={styles.description} numberOfLines={2}>{product.description ?? 'No description available'}</Text>}
        {showStore && sellerName && <Text style={styles.storeName} numberOfLines={1}>{sellerName}</Text>}
      </TouchableOpacity>

      <View style={styles.priceRow}>
        <View>
          {consumerPrice > pharmacyPrice && <Text style={styles.originalPrice}>{consumerPrice} EGP</Text>}
          <Text style={styles.price}>{pharmacyPrice} EGP</Text>
        </View>
        {showDiscount && discount > 0 && <Text style={styles.discountBadge}>-{discount}%</Text>}
      </View>

      {!product.isAvailable || product.stockQuantity <= 0 ? (
        <View style={styles.unavailableButton}><Text style={styles.unavailableText}>Out of stock</Text></View>
      ) : cartQuantity > 0 && onDecreaseQuantity && onIncreaseQuantity ? (
        <View style={styles.quantityRow}>
          <TouchableOpacity onPress={onDecreaseQuantity} style={styles.quantityButton} activeOpacity={0.8}><Text style={styles.quantityButtonText}>-</Text></TouchableOpacity>
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
        <TouchableOpacity onPress={onAddToCart} style={styles.addButton} activeOpacity={0.8}><Text style={styles.addButtonText}>Add to cart</Text></TouchableOpacity>
      ) : null}
    </View>
  );
}
