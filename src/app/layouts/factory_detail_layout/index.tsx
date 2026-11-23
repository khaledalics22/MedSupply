import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import ProductCard from '../../components/product_card';
import SearchBar from '../../components/search_bar';
import { type LanguageCode } from '../../i18n';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import { matchesAnySearch } from '../../utils/search';
import styles from './styles';

export default function FactoryDetailLayout({
  factoryId,
  language,
  onBack,
  onProductSelected,
}: {
  factoryId: string;
  language: LanguageCode;
  onBack: () => void;
  onProductSelected?: (productId: string) => void;
}) {
  const database = iocContainer.getDatabase();
  const { cart, addToCart, updateQuantity } = useAppState();
  const [productQuery, setProductQuery] = useState('');
  const factory = database.getFactoryById(factoryId);

  const products = useMemo(() => {
    return database
      .getProductsByManufacturer(factoryId)
      .filter((product) => matchesAnySearch([product.name, product.description, product.dosage, product.packageSize], productQuery));
  }, [database, factoryId, productQuery]);

  if (!factory) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}><Ionicons name="arrow-back" size={20} color="#fff" /></TouchableOpacity>
          <Text style={styles.title}>Factory not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}><Ionicons name="arrow-back" size={20} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>{factory.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: factory.image ?? 'https://picsum.photos/seed/factory/240' }} style={styles.image} />

        <View style={styles.infoCard}>
          <Text style={styles.name}>{factory.name}</Text>
          <Text style={styles.description}>{factory.description ?? 'No description available.'}</Text>
          <Text style={styles.detail}>Location: {typeof factory.location === 'string' ? factory.location : 'Location unavailable'}</Text>
          <Text style={styles.detail}>Certification: {factory.certification}</Text>
          <Text style={styles.detail}>Capacity: {factory.productionCapacity}</Text>
        </View>

        <Text style={styles.sectionTitle}>Factory products</Text>
        <SearchBar value={productQuery} onChangeText={setProductQuery} placeholder="Search manufacturer products..." />
        <View style={styles.listWrap}>
          {products.map((product) => {
            const cartItem = cart.find((entry) => entry.productId === product.id);
            return (
              <ProductCard
                key={product.id}
                product={product}
                manufacturerName={factory.name}
                cartQuantity={cartItem?.quantity ?? 0}
                maxQuantity={product.stockQuantity}
                onPress={() => onProductSelected?.(product.id)}
                onAddToCart={() => addToCart(product.id, 1)}
                onIncreaseQuantity={() => updateQuantity(product.id, (cartItem?.quantity ?? 0) + 1)}
                onDecreaseQuantity={() => updateQuantity(product.id, (cartItem?.quantity ?? 1) - 1)}
              />
            );
          })}
          {products.length === 0 && <Text style={styles.emptyState}>No matching manufacturer products found.</Text>}
        </View>
      </ScrollView>
    </View>
  );
}
