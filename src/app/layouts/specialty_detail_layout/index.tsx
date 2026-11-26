import { FlatList, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import AppHeader from '../../components/app_header';
import ProductCard from '../../components/product_card';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import { type LanguageCode } from '../../i18n';
import styles from './styles';

export default function SpecialtyDetailLayout({ specialtyId, language, onBack, onProductSelected }: { specialtyId: string; language: LanguageCode; onBack: () => void; onProductSelected: (productId: string) => void }) {
  const database = iocContainer.getDatabase();
  const { cart, addToCart, updateQuantity, favoriteProducts, toggleFavoriteProduct } = useAppState();
  const [specialty, setSpecialty] = useState<import('../../models/data_types').Specialty | undefined>(undefined);
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
        const [specialtyItem, items, storeItems, manufacturerItems] = await Promise.all([
          database.getSpecialtyByIdAsync(specialtyId),
          database.getProductsBySpecialtyAsync(specialtyId),
          database.getActiveStoresAsync(),
          database.getActiveFactoriesAsync(),
        ]);
        if (!active) return;
        setSpecialty(specialtyItem);
        setProducts(items);
        setStores(storeItems);
        setManufacturerNames(Object.fromEntries(manufacturerItems.map((manufacturer) => [manufacturer.id, manufacturer.name])));

      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load specialty.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [database, specialtyId]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View style={styles.container}>
      <AppHeader onBack={onBack} title={specialty?.name ?? 'Specialty'} />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyState}>No matching products found.</Text>}
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
    </View>
  );
}
