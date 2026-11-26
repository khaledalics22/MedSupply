import { FlatList, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import AppHeader from '../../components/app_header';
import ProductCard from '../../components/product_card';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import { type LanguageCode } from '../../i18n';
import styles from './styles';

export default function BeautyProductsLayout({ language, onBack, onProductSelected }: { language: LanguageCode; onBack: () => void; onProductSelected: (productId: string) => void }) {
  const database = iocContainer.getDatabase();
  const { cart, addToCart, updateQuantity, favoriteProducts, toggleFavoriteProduct } = useAppState();
  const [products, setProducts] = useState<import('../../models/data_types').Product[]>([]);
  const [stores, setStores] = useState<import('../../models/data_types').Store[]>([]);
  const [manufacturerNames, setManufacturerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [items, stores, manufacturers] = await Promise.all([
          database.getProductsBySpecialtyAsync('beauty'),
          database.getActiveStoresAsync(),
          database.getActiveFactoriesAsync(),
        ]);
        if (!active) return;
        setProducts(items);
        setStores(stores);
        setManufacturerNames(Object.fromEntries(manufacturers.map((manufacturer) => [manufacturer.id, manufacturer.name])));

      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load beauty products.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [database]);

  return (
    <View style={styles.container}>
      <AppHeader onBack={onBack} title="Beauty Products" />
      {loading ? (
        <Text>Loading...</Text>
      ) : error ? (
        <Text style={styles.emptyState}>{error}</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyState}>No beauty products available.</Text>}
          renderItem={({ item }) => {
            const cartItem = cart.find((entry) => entry.productId === item.id);
            const store = item.sellerType === 'store' ? stores.find((candidate) => candidate.id === item.sellerId) : undefined;
            const manufacturerName = item.sellerType === 'manufacturer' ? manufacturerNames[item.sellerId] : undefined;
            return (
              <View style={styles.cardWrapper}>
                <ProductCard
                  product={item}
                  store={store}
                  manufacturerName={manufacturerName}
                  cartQuantity={cartItem?.quantity ?? 0}
                  maxQuantity={item.stockQuantity}
                  isFavorite={favoriteProducts.includes(item.id)}
                  onPress={() => onProductSelected(item.id)}
                  onAddToCart={() => addToCart(item.id, 1)}
                  onIncreaseQuantity={() => updateQuantity(item.id, (cartItem?.quantity ?? 0) + 1)}
                  onDecreaseQuantity={() => updateQuantity(item.id, (cartItem?.quantity ?? 1) - 1)}
                  onToggleFavorite={() => toggleFavoriteProduct(item.id)}
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
