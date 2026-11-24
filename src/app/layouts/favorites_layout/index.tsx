import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

import ProductCard from '../../components/product_card';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import styles from './styles';

export default function FavoritesLayout({ onBack, onProductSelected }: { onBack: () => void; onProductSelected: (productId: string) => void }) {
  const database = iocContainer.getDatabase();
  const { cart, addToCart, updateQuantity, favoriteProducts, toggleFavoriteProduct } = useAppState();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<'none' | 'priceAsc' | 'priceDesc' | 'discount'>('none');

  const favoriteItems = useMemo(() => {
    const normalized = query.trim().replace(/\s+/g, ' ').toLowerCase();
    let products = favoriteProducts
      .map((productId) => database.getProductById(productId))
      .filter((product) => Boolean(product)) as NonNullable<ReturnType<typeof database.getProductById>>[];

    if (normalized) {
      products = products.filter((product) => {
        const name = product.name.toLowerCase().replace(/\s+/g, ' ').trim();
        const dosage = (product.dosage ?? '').toLowerCase().replace(/\s+/g, '').trim();
        const compactQuery = normalized.replace(/\s+/g, '');
        return name.includes(normalized) || dosage.includes(compactQuery);
      });
    }

    if (sortMode === 'priceAsc') products = [...products].sort((left, right) => left.pharmacyPriceAfterDiscount - right.pharmacyPriceAfterDiscount);
    if (sortMode === 'priceDesc') products = [...products].sort((left, right) => right.pharmacyPriceAfterDiscount - left.pharmacyPriceAfterDiscount);
    if (sortMode === 'discount') products = [...products].sort((left, right) => right.discountPercentage - left.discountPercentage);
    return products;
  }, [favoriteProducts, query, sortMode]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.title}>Favorites</Text>
        <View style={styles.headerSpace} />
      </View>

      <View style={styles.searchRow}><Ionicons name="search" size={20} color="#718096" /><TextInput value={query} onChangeText={setQuery} placeholder="Search favorites by name or dosage" style={styles.searchInput} /></View>
      <View style={styles.sortRow}>
        {(['none', 'priceAsc', 'priceDesc', 'discount'] as const).map((sort) => (
          <TouchableOpacity key={sort} style={[styles.sortButton, sortMode === sort && styles.sortButtonActive]} onPress={() => setSortMode(sort)}>
            <Text style={[styles.sortText, sortMode === sort && styles.sortTextActive]}>{sort === 'none' ? 'Default' : sort === 'priceAsc' ? 'Lowest price' : sort === 'priceDesc' ? 'Highest price' : 'Highest discount'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={favoriteItems}
        keyExtractor={(product) => product.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="heart-outline" size={42} color="#94A3B8" /><Text style={styles.emptyTitle}>No favorites found</Text><Text style={styles.emptyText}>Save provider-owned products to find them quickly here.</Text></View>}
        renderItem={({ item }) => {
          const cartItem = cart.find((entry) => entry.productId === item.id);
          const store = item.sellerType === 'store' ? database.getStoreById(item.sellerId) : undefined;
          const manufacturerName = item.sellerType === 'manufacturer' ? database.getFactoryById(item.sellerId)?.name : undefined;
          const providerActive = item.sellerType === 'store'
            ? database.getStoreById(item.sellerId)?.status === 'active'
            : database.getFactoryById(item.sellerId)?.status === 'active';
          const unavailable = !item.isAvailable || item.stockQuantity <= 0 || !providerActive;

          return (
            <View>
              {unavailable ? <View style={styles.unavailableNotice}><Text style={styles.unavailableText}>Unavailable: provider inactive, product inactive, or out of stock</Text></View> : null}
              <ProductCard
                product={item}
                store={store}
                manufacturerName={manufacturerName}
                cartQuantity={cartItem?.quantity ?? 0}
                maxQuantity={item.stockQuantity}
                onPress={() => onProductSelected(item.id)}
                onAddToCart={unavailable ? undefined : () => addToCart(item.id, 1)}
                onIncreaseQuantity={() => updateQuantity(item.id, (cartItem?.quantity ?? 0) + 1)}
                onDecreaseQuantity={() => updateQuantity(item.id, (cartItem?.quantity ?? 1) - 1)}
                isFavorite
                onToggleFavorite={() => toggleFavoriteProduct(item.id)}
              />
            </View>
          );
        }}
      />
    </View>
  );
}
