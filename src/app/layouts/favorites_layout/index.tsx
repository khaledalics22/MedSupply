import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
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
  const [favoriteItems, setFavoriteItems] = useState<import('../../models/data_types').Product[]>([]);
  const [storeLookup, setStoreLookup] = useState<Record<string, import('../../models/data_types').Store>>({});
  const [manufacturerLookup, setManufacturerLookup] = useState<Record<string, import('../../models/data_types').Factory>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const results = await Promise.all(favoriteProducts.map((productId) => database.getProductByIdAsync(productId)));
        const products = results.filter((product): product is NonNullable<typeof product> => Boolean(product));
        if (!active) return;

        const storeIds = Array.from(new Set(products.filter((product) => product.sellerType === 'store').map((product) => product.sellerId)));
        const manufacturerIds = Array.from(new Set(products.filter((product) => product.sellerType === 'manufacturer').map((product) => product.sellerId)));
        const [stores, manufacturers] = await Promise.all([
          Promise.all(storeIds.map((storeId) => database.getStoreByIdAsync(storeId))),
          Promise.all(manufacturerIds.map((manufacturerId) => database.getFactoryByIdAsync(manufacturerId))),
        ]);
        if (!active) return;

        setFavoriteItems(products);
        setStoreLookup(Object.fromEntries(stores.filter((store): store is import('../../models/data_types').Store => Boolean(store)).map((store) => [store.id, store])));
        setManufacturerLookup(Object.fromEntries(manufacturers.filter((manufacturer): manufacturer is import('../../models/data_types').Factory => Boolean(manufacturer)).map((manufacturer) => [manufacturer.id, manufacturer])));
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load favorites.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [database, favoriteProducts]);

  const favoriteItemsSorted = useMemo(() => {
    let products = [...favoriteItems];

    if (sortMode === 'priceAsc') products.sort((left, right) => left.pharmacyPriceAfterDiscount - right.pharmacyPriceAfterDiscount);
    if (sortMode === 'priceDesc') products.sort((left, right) => right.pharmacyPriceAfterDiscount - left.pharmacyPriceAfterDiscount);
    if (sortMode === 'discount') products.sort((left, right) => right.discountPercentage - left.discountPercentage);

    return products;
  }, [favoriteItems, sortMode]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return favoriteItemsSorted.filter((product) => {
      const name = product.name.toLowerCase();
      const dosage = (product.dosage ?? '').toLowerCase();
      return name.includes(normalized) || dosage.includes(normalized);
    });
  }, [query, favoriteItemsSorted]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

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
        data={filteredItems}
        keyExtractor={(product) => product.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="heart-outline" size={42} color="#94A3B8" /><Text style={styles.emptyTitle}>No favorites found</Text><Text style={styles.emptyText}>Save provider-owned products to find them quickly here.</Text></View>}
        renderItem={({ item }) => {
          const cartItem = cart.find((entry) => entry.productId === item.id);
          const store = item.sellerType === 'store' ? storeLookup[item.sellerId] : undefined;
          const manufacturerName = item.sellerType === 'manufacturer' ? manufacturerLookup[item.sellerId]?.name : undefined;
          const providerActive = item.sellerType === 'store'
            ? storeLookup[item.sellerId]?.status === 'active'
            : manufacturerLookup[item.sellerId]?.status === 'active';
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
