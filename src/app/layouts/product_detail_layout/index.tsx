import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import ProductCard from '../../components/product_card';
import { type LanguageCode } from '../../i18n';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import styles from './styles';

export default function ProductDetailLayout({
  productId,
  language,
  onBack,
}: {
  productId: string;
  language: LanguageCode;
  onBack: () => void;
}) {
  const database = iocContainer.getDatabase();
  const { cart, addToCart, updateQuantity } = useAppState();
  const product = database.getProductById(productId);

  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Product not found</Text>
        </View>
      </View>
    );
  }

  const storeOffers = database.getStoreOffersByProduct(productId).map((offer) => ({
    offer,
    sellerName: database.getStoreById(offer.storeId)?.name ?? 'Store',
  }));

  const manufacturerOffers = database.getManufacturerOffersByProduct(productId).map((offer) => ({
    offer,
    sellerName: database.getFactoryById(offer.manufacturerId)?.name ?? 'Manufacturer',
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{product.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: product.image ?? 'https://picsum.photos/seed/product/200' }} style={styles.image} />

        <Text style={styles.sectionTitle}>Product details</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{product.description ?? 'No description available'}</Text>
          <Text style={styles.label}>Manufacturer</Text>
          <Text style={styles.value}>{product.manufacturer ?? 'N/A'}</Text>
          <Text style={styles.label}>Dosage</Text>
          <Text style={styles.value}>{product.dosage ?? 'N/A'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Available offers</Text>
        {[...storeOffers.map((item) => ({ ...item, offerType: 'store' as const })), ...manufacturerOffers.map((item) => ({ ...item, offerType: 'manufacturer' as const }))].map((item) => {
          const cartItem = cart.find((entry) => entry.offerType === item.offerType && entry.offerId === item.offer.id);
          return (
            <View key={`${item.offerType}-${item.offer.id}`} style={styles.offerCard}>
              <Text style={styles.storeName}>{item.sellerName}</Text>
              <Text style={styles.offerPrice}>{item.offer.pharmacyPriceAfterDiscount} EGP</Text>
              {item.offer.consumerPrice > item.offer.pharmacyPriceAfterDiscount && (
                <Text style={styles.offerOldPrice}>{item.offer.consumerPrice} EGP</Text>
              )}
              {item.offer.discountPercentage > 0 && (
                <Text style={styles.offerDiscount}>-{item.offer.discountPercentage}%</Text>
              )}
              <ProductCard
                product={product}
                offer={item.offer}
                store={item.offerType === 'store' ? database.getStoreById(item.offer.storeId) : undefined}
                manufacturerName={item.offerType === 'manufacturer' ? item.sellerName : undefined}
                showStore={false}
                showDescription={false}
                cartQuantity={cartItem?.quantity ?? 0}
                maxQuantity={item.offer.stockQuantity}
                onAddToCart={() => addToCart(item.offerType, item.offer.id, 1)}
                onIncreaseQuantity={() => updateQuantity(item.offerType, item.offer.id, (cartItem?.quantity ?? 0) + 1)}
                onDecreaseQuantity={() => updateQuantity(item.offerType, item.offer.id, (cartItem?.quantity ?? 1) - 1)}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
