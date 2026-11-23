import { useMemo, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '../../components/app_header';
import ProductCard from '../../components/product_card';
import SearchBar from '../../components/search_bar';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import { type LanguageCode } from '../../i18n';
import styles from './styles';

export default function BestPricesLayout({ language, onBack, onProductSelected }: { language: LanguageCode; onBack: () => void; onProductSelected?: (productId: string) => void }) {
  const database = iocContainer.getDatabase();
  const { cart, addToCart, updateQuantity } = useAppState();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<'priceAsc' | 'discount'>('priceAsc');

  const cards = useMemo(() => {
    return database.getAvailableProducts()
      .filter((product) => {
        if (product.sellerType === 'store') return Boolean(database.getStoreById(product.sellerId));
        return Boolean(database.getFactoryById(product.sellerId));
      })
      .map((product) => ({
        key: product.id,
        product,
        sellerName: product.sellerType === 'store'
          ? database.getStoreById(product.sellerId)?.name ?? 'Store'
          : database.getFactoryById(product.sellerId)?.name ?? 'Manufacturer',
        store: product.sellerType === 'store' ? database.getStoreById(product.sellerId) : undefined,
      }));
  }, [database]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cards
      .filter((card) => !normalized || card.product.name.toLowerCase().includes(normalized) || card.sellerName.toLowerCase().includes(normalized))
      .sort((left, right) => sortMode === 'priceAsc'
        ? left.product.pharmacyPriceAfterDiscount - right.product.pharmacyPriceAfterDiscount
        : right.product.discountPercentage - left.product.discountPercentage);
  }, [cards, query, sortMode]);

  return (
    <View style={styles.container}>
      <AppHeader onBack={onBack} title="Best Prices" />
      <View style={styles.header}><SearchBar value={query} onChangeText={setQuery} placeholder="Search products..." /></View>
      <View style={styles.filterRow}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setSortMode('priceAsc')} style={[styles.filterButton, sortMode === 'priceAsc' && styles.filterButtonActive]}>
          <Text style={[styles.filterButtonText, sortMode === 'priceAsc' && styles.filterButtonTextActive]}>Lowest price</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setSortMode('discount')} style={[styles.filterButton, sortMode === 'discount' && styles.filterButtonActive]}>
          <Text style={[styles.filterButtonText, sortMode === 'discount' && styles.filterButtonTextActive]}>Discount</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyState}>No matching products found.</Text>}
        renderItem={({ item }) => {
          const cartItem = cart.find((entry) => entry.productId === item.product.id);
          return (
            <ProductCard
              product={item.product}
              store={item.store}
              manufacturerName={item.product.sellerType === 'manufacturer' ? item.sellerName : undefined}
              cartQuantity={cartItem?.quantity ?? 0}
              maxQuantity={item.product.stockQuantity}
              onPress={() => onProductSelected?.(item.product.id)}
              onAddToCart={() => addToCart(item.product.id, 1)}
              onIncreaseQuantity={() => updateQuantity(item.product.id, (cartItem?.quantity ?? 0) + 1)}
              onDecreaseQuantity={() => updateQuantity(item.product.id, (cartItem?.quantity ?? 1) - 1)}
            />
          );
        }}
      />
    </View>
  );
}
