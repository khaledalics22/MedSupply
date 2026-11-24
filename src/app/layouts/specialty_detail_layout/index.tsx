import { FlatList, Text, View } from 'react-native';

import AppHeader from '../../components/app_header';
import ProductCard from '../../components/product_card';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import { type LanguageCode } from '../../i18n';
import styles from './styles';

export default function SpecialtyDetailLayout({ specialtyId, language, onBack, onProductSelected }: { specialtyId: string; language: LanguageCode; onBack: () => void; onProductSelected: (productId: string) => void }) {
  const database = iocContainer.getDatabase();
  const { cart, addToCart, updateQuantity, favoriteProducts, toggleFavoriteProduct } = useAppState();
  const specialty = database.getSpecialtyById(specialtyId);
  const products = database.getProductsBySpecialty(specialtyId);

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
          const store = item.sellerType === 'store' ? database.getStoreById(item.sellerId) : undefined;
          const manufacturerName = item.sellerType === 'manufacturer' ? database.getFactoryById(item.sellerId)?.name : undefined;
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
