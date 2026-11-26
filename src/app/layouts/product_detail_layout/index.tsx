import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';

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
  const { cart, addToCart, updateQuantity, favoriteProducts, toggleFavoriteProduct } = useAppState();

  const [product, setProduct] = useState<import('../../models/data_types').Product | undefined>(undefined);
  const [store, setStore] = useState<import('../../models/data_types').Store | undefined>(undefined);
  const [manufacturerName, setManufacturerName] = useState<string | undefined>(undefined);
  const [specialtyName, setSpecialtyName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const item = await database.getProductByIdAsync(productId);
        if (!active) return;
        setProduct(item);
        if (!item) { setLoading(false); return; }

        const [provider, specialty] = await Promise.all([
          item.sellerType === 'store' ? database.getStoreByIdAsync(item.sellerId) : database.getFactoryByIdAsync(item.sellerId),
          database.getSpecialtyByIdAsync(item.specialtyId),
        ]);
        if (!active) return;
        if (item.sellerType === 'store') setStore(provider as import('../../models/data_types').Store | undefined);
        else setManufacturerName((provider as import('../../models/data_types').Factory | undefined)?.name);
        setSpecialtyName(specialty?.name ?? item.specialtyId);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load product.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [database, productId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading product...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Unable to load product</Text>
        </View>
        <Text style={styles.value}>{error}</Text>
      </View>
    );
  }

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
          <Text style={styles.value}>{specialtyName ?? product.specialtyId}</Text>
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
          isFavorite={favoriteProducts.includes(product.id)}
          onAddToCart={() => addToCart(product.id, 1)}
          onIncreaseQuantity={() => updateQuantity(product.id, (cartItem?.quantity ?? 0) + 1)}
          onDecreaseQuantity={() => updateQuantity(product.id, (cartItem?.quantity ?? 1) - 1)}
          onToggleFavorite={() => toggleFavoriteProduct(product.id)}
        />
      </ScrollView>
    </View>
  );
}
