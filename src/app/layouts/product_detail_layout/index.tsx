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

  const cartItem = cart.find((entry) => entry.productId === product.id);
  const store = product.sellerType === 'store' ? database.getStoreById(product.sellerId) : undefined;
  const manufacturerName = product.sellerType === 'manufacturer' ? database.getFactoryById(product.sellerId)?.name : undefined;

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
          <Text style={styles.label}>Package</Text>
          <Text style={styles.value}>{product.packageSize ?? 'Standard package'}</Text>
          {product.variant ? (
            <>
              <Text style={styles.label}>Variant</Text>
              <Text style={styles.value}>{product.variant}</Text>
            </>
          ) : null}
          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{database.getSpecialtyById(product.specialtyId)?.name ?? product.specialtyId}</Text>
          <Text style={styles.label}>Provider</Text>
          <Text style={styles.value}>{store?.name ?? manufacturerName ?? 'N/A'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Seller and purchase</Text>
        <ProductCard
          product={product}
          store={store}
          manufacturerName={manufacturerName}
          cartQuantity={cartItem?.quantity ?? 0}
          maxQuantity={product.stockQuantity}
          onAddToCart={() => addToCart(product.id, 1)}
          onIncreaseQuantity={() => updateQuantity(product.id, (cartItem?.quantity ?? 0) + 1)}
          onDecreaseQuantity={() => updateQuantity(product.id, (cartItem?.quantity ?? 1) - 1)}
        />
      </ScrollView>
    </View>
  );
}
