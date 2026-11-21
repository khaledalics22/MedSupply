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
    const result: Array<{ key: string; offerType: 'store' | 'manufacturer'; offer: any; product: any; sellerName: string; store?: any }> = [];

    for (const offer of database.getStoreOffers()) {
      if (!offer.isAvailable || offer.stockQuantity <= 0) continue;
      const product = database.getProductById(offer.productId);
      const store = database.getStoreById(offer.storeId);
      if (!product || product.sellerType !== 'store' || product.sellerId !== offer.storeId || !store) continue;
      result.push({ key: `store-${offer.id}`, offerType: 'store', offer, product, sellerName: store.name, store });
    }

    for (const offer of database.getManufacturerOffers()) {
      if (!offer.isAvailable || offer.stockQuantity <= 0) continue;
      const product = database.getProductById(offer.productId);
      const manufacturer = database.getFactoryById(offer.manufacturerId);
      if (!product || product.sellerType !== 'manufacturer' || product.sellerId !== offer.manufacturerId || !manufacturer) continue;
      result.push({ key: `manufacturer-${offer.id}`, offerType: 'manufacturer', offer, product, sellerName: manufacturer.name });
    }

    return result;
  }, [database]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cards
      .filter((card) => !normalized || card.product.name.toLowerCase().includes(normalized) || card.sellerName.toLowerCase().includes(normalized))
      .sort((left, right) => sortMode === 'priceAsc'
        ? left.offer.pharmacyPriceAfterDiscount - right.offer.pharmacyPriceAfterDiscount
        : right.offer.discountPercentage - left.offer.discountPercentage);
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
        ListEmptyComponent={<Text style={styles.emptyState}>No matching offers found.</Text>}
        renderItem={({ item }) => {
          const cartItem = cart.find((entry) => entry.offerType === item.offerType && entry.offerId === item.offer.id);
          return (
            <ProductCard
              product={item.product}
              offer={item.offer}
              store={item.store}
              manufacturerName={item.offerType === 'manufacturer' ? item.sellerName : undefined}
              cartQuantity={cartItem?.quantity ?? 0}
              maxQuantity={item.offer.stockQuantity}
              onPress={() => onProductSelected?.(item.product.id)}
              onAddToCart={() => addToCart(item.offerType, item.offer.id, 1)}
              onIncreaseQuantity={() => updateQuantity(item.offerType, item.offer.id, (cartItem?.quantity ?? 0) + 1)}
              onDecreaseQuantity={() => updateQuantity(item.offerType, item.offer.id, (cartItem?.quantity ?? 1) - 1)}
            />
          );
        }}
      />
    </View>
  );
}
