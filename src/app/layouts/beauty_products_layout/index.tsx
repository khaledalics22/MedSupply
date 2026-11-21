import { FlatList, Text, View } from 'react-native';

import AppHeader from '../../components/app_header';
import ProductCard from '../../components/product_card';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import { type LanguageCode } from '../../i18n';
import styles from './styles';

export default function BeautyProductsLayout({ language, onBack, onProductSelected }: { language: LanguageCode; onBack: () => void; onProductSelected: (productId: string) => void }) {
  const database = iocContainer.getDatabase();
  const { cart, addToCart, updateQuantity } = useAppState();
  const products = database.getProductsBySpecialty('beauty');

  return (
    <View style={styles.container}>
      <AppHeader onBack={onBack} title="Beauty Products" />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyState}>No beauty products available.</Text>}
        renderItem={({ item }) => {
          const storeOffer = database.getStoreOffersByProduct(item.id).find((offer) => offer.isAvailable && offer.stockQuantity > 0);
          const manufacturerOffer = database.getManufacturerOffersByProduct(item.id).find((offer) => offer.isAvailable && offer.stockQuantity > 0);
          const candidate = storeOffer
            ? { offerType: 'store' as const, offer: storeOffer, store: database.getStoreById(storeOffer.storeId) }
            : manufacturerOffer
              ? { offerType: 'manufacturer' as const, offer: manufacturerOffer, store: undefined }
              : undefined;
          const cartItem = candidate ? cart.find((entry) => entry.offerType === candidate.offerType && entry.offerId === candidate.offer.id) : undefined;

          return (
            <View style={styles.cardWrapper}>
              {candidate ? (
                <ProductCard
                  product={item}
                  offer={candidate.offer}
                  store={candidate.store}
                  manufacturerName={candidate.offerType === 'manufacturer' ? database.getFactoryById(candidate.offer.manufacturerId)?.name : undefined}
                  cartQuantity={cartItem?.quantity ?? 0}
                  maxQuantity={candidate.offer.stockQuantity}
                  onPress={() => onProductSelected(item.id)}
                  onAddToCart={() => addToCart(candidate.offerType, candidate.offer.id, 1)}
                  onIncreaseQuantity={() => updateQuantity(candidate.offerType, candidate.offer.id, (cartItem?.quantity ?? 0) + 1)}
                  onDecreaseQuantity={() => updateQuantity(candidate.offerType, candidate.offer.id, (cartItem?.quantity ?? 1) - 1)}
                />
              ) : (
                <ProductCard product={item} showStore={false} onPress={() => onProductSelected(item.id)} />
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
