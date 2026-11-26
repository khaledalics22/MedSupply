import { useEffect, useMemo, useState } from 'react';
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
  const { cart, addToCart, updateQuantity, favoriteProducts, toggleFavoriteProduct } = useAppState();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortMode, setSortMode] = useState<'priceAsc' | 'priceDesc' | 'discount'>('priceAsc');
  const [availableProducts, setAvailableProducts] = useState<import('../../models/data_types').Product[]>([]);
  const [stores, setStores] = useState<import('../../models/data_types').Store[]>([]);
  const [manufacturers, setManufacturers] = useState<import('../../models/data_types').Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [items, storeItems, manufacturerItems] = await Promise.all([
          database.getAvailableProductsAsync(),
          database.getActiveStoresAsync(),
          database.getActiveFactoriesAsync(),
        ]);
        if (!active) return;
        setAvailableProducts(items);
        setStores(storeItems);
        setManufacturers(manufacturerItems);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load best prices.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [database]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const cards = useMemo(() => {
    return availableProducts
      .filter((product) => {
        if (product.sellerType === 'store') return stores.some((store) => store.id === product.sellerId && store.status === 'active');
        return manufacturers.some((manufacturer) => manufacturer.id === product.sellerId && manufacturer.status === 'active');
      })
      .map((product) => {
        const store = product.sellerType === 'store' ? stores.find((candidate) => candidate.id === product.sellerId) : undefined;
        const manufacturerName = product.sellerType === 'manufacturer' ? manufacturers.find((candidate) => candidate.id === product.sellerId)?.name : undefined;
        return {
          key: product.id,
          product,
          sellerName: product.sellerType === 'store' ? store?.name ?? 'Store' : manufacturerName ?? 'Manufacturer',
          store,
        };
      });
  }, [availableProducts, database, manufacturers, stores]);

  const filtered = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    return cards
      .filter((card) => !normalized || card.product.name.toLowerCase().includes(normalized) || card.sellerName.toLowerCase().includes(normalized))
      .sort((left, right) => {
        if (sortMode === 'priceDesc') return right.product.pharmacyPriceAfterDiscount - left.product.pharmacyPriceAfterDiscount;
        if (sortMode === 'discount') return right.product.discountPercentage - left.product.discountPercentage;
        return left.product.pharmacyPriceAfterDiscount - right.product.pharmacyPriceAfterDiscount;
      });
  }, [cards, debouncedQuery, sortMode]);

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader onBack={onBack} title="Best Prices" />
        <View style={styles.header}><SearchBar value={query} onChangeText={setQuery} placeholder="Search products..." /></View>
        <Text style={styles.emptyState}>Loading best prices...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader onBack={onBack} title="Best Prices" />
        <View style={styles.header}><SearchBar value={query} onChangeText={setQuery} placeholder="Search products..." /></View>
        <Text style={styles.emptyState}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader onBack={onBack} title="Best Prices" />
      <View style={styles.header}><SearchBar value={query} onChangeText={setQuery} placeholder="Search products..." /></View>
      <View style={styles.filterRow}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setSortMode('priceAsc')} style={[styles.filterButton, sortMode === 'priceAsc' && styles.filterButtonActive]}>
          <Text style={[styles.filterButtonText, sortMode === 'priceAsc' && styles.filterButtonTextActive]}>Lowest price</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setSortMode('priceDesc')} style={[styles.filterButton, sortMode === 'priceDesc' && styles.filterButtonActive]}>
          <Text style={[styles.filterButtonText, sortMode === 'priceDesc' && styles.filterButtonTextActive]}>Highest price</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setSortMode('discount')} style={[styles.filterButton, sortMode === 'discount' && styles.filterButtonActive]}>
          <Text style={[styles.filterButtonText, sortMode === 'discount' && styles.filterButtonTextActive]}>Discount</Text>
        </TouchableOpacity>
      </View>
      {loading ? <Text style={styles.emptyState}>Loading products...</Text> : error ? <Text style={styles.emptyState}>{error}</Text> : null}
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
              isFavorite={favoriteProducts.includes(item.product.id)}
              onPress={() => onProductSelected?.(item.product.id)}
              onAddToCart={() => addToCart(item.product.id, 1)}
              onIncreaseQuantity={() => updateQuantity(item.product.id, (cartItem?.quantity ?? 0) + 1)}
              onDecreaseQuantity={() => updateQuantity(item.product.id, (cartItem?.quantity ?? 1) - 1)}
              onToggleFavorite={() => toggleFavoriteProduct(item.product.id)}
            />
          );
        }}
      />
    </View>
  );
}
