import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import ProductCard from '../../components/product_card';
import SearchBar from '../../components/search_bar';
import { matchesAnySearch } from '../../utils/search';
import { type LanguageCode } from '../../i18n';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import styles from './styles';

export default function StoreDetailLayout({
  storeId,
  language,
  onBack,
  onProductSelected,
}: {
  storeId: string;
  language: LanguageCode;
  onBack: () => void;
  onProductSelected?: (productId: string) => void;
}) {
  const database = iocContainer.getDatabase();
  const { cart, addToCart, updateQuantity, favoriteStores, toggleFavoriteStore, orders, favoriteProducts, toggleFavoriteProduct } = useAppState();
  const [tab, setTab] = useState<'medicines' | 'pending' | 'my-orders'>('medicines');
  const [productQuery, setProductQuery] = useState('');
  const [store, setStore] = useState<import('../../models/data_types').Store | undefined>(undefined);
  const [products, setProducts] = useState<import('../../models/data_types').Product[]>([]);

  useEffect(() => {
    let active = true;
    database.getStoreByIdAsync(storeId).then((item) => { if (active) setStore(item); });
    database.getProductsByStoreAsync(storeId).then((items) => { if (active) setProducts(items); });
    return () => { active = false; };
  }, [database, storeId]);

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.sellerType === 'store' && order.sellerId === storeId && order.status === 'pending'),
    [orders, storeId],
  );

  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.sellerType === 'store' && order.sellerId === storeId && order.status === 'completed'),
    [orders, storeId],
  );

  if (!store || store.status !== 'active') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{store ? 'Store is currently inactive' : 'Store not found'}</Text>
        </View>
      </View>
    );
  }

  const isFavorite = favoriteStores.includes(storeId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{store.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: store.image ?? 'https://picsum.photos/seed/store/240' }} style={styles.image} />
          <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.8} onPress={() => toggleFavoriteStore(storeId)}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4D67' : '#fff'} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeDescription}>{store.description ?? 'No description available.'}</Text>
          <Text style={styles.detailText}>{store.address ?? 'Address unavailable'}</Text>
          <Text style={styles.detailText}>Rating: {store.rating ?? 0}/5</Text>
        </View>

        <View style={styles.tabs}>
          {[
            { key: 'medicines', label: 'Medicines' },
            { key: 'pending', label: 'Pending Orders' },
            { key: 'my-orders', label: 'My Orders' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              onPress={() => setTab(item.key as 'medicines' | 'pending' | 'my-orders')}
              style={[styles.tab, tab === item.key && styles.tabActive]}>
              <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'medicines' && (
          <View style={styles.listWrap}>
            <SearchBar
              value={productQuery}
              onChangeText={setProductQuery}
              placeholder="Search store products..."
            />
            {products.length === 0 ? (
              <Text style={styles.emptyState}>No products available for this store.</Text>
            ) : (
              products.filter((product) => matchesAnySearch([product.name, product.description, product.dosage, product.packageSize], productQuery)).map((product) => {
                const cartItem = cart.find((entry) => entry.productId === product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    store={store}
                    cartQuantity={cartItem?.quantity ?? 0}
                    maxQuantity={product.stockQuantity}
                    isFavorite={favoriteProducts.includes(product.id)}
                    onToggleFavorite={() => toggleFavoriteProduct(product.id)}
                    onPress={() => onProductSelected?.(product.id)}
                    onAddToCart={() => addToCart(product.id, 1)}
                    onIncreaseQuantity={() => updateQuantity(product.id, (cartItem?.quantity ?? 0) + 1)}
                    onDecreaseQuantity={() => updateQuantity(product.id, (cartItem?.quantity ?? 1) - 1)}
                  />
                );
              })
            )}
          </View>
        )}

        {tab === 'pending' && (
          <View style={styles.listWrap}>
            {pendingOrders.length === 0 ? (
              <Text style={styles.emptyState}>No pending orders.</Text>
            ) : (
              pendingOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderMeta}>{order.createdAt}</Text>
                  <Text style={styles.orderMeta}>{order.totalItems} items</Text>
                  <Text style={styles.orderMeta}>{order.totalPrice} EGP</Text>
                  <Text style={styles.orderStatus}>{order.status}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'my-orders' && (
          <View style={styles.listWrap}>
            {deliveredOrders.length === 0 ? (
              <Text style={styles.emptyState}>No previous orders.</Text>
            ) : (
              deliveredOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderMeta}>{order.createdAt}</Text>
                  <Text style={styles.orderMeta}>{order.totalItems} items</Text>
                  <Text style={styles.orderMeta}>{order.totalPrice} EGP</Text>
                  <Text style={styles.orderStatus}>{order.status}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
