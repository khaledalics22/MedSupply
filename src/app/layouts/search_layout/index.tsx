import { useMemo, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '../../components/app_header';
import ProductCard from '../../components/product_card';
import SearchBar from '../../components/search_bar';
import { t, type LanguageCode } from '../../i18n';
import { iocContainer } from '../../models/ioc_container';
import { CategoryType } from '../../utils/types';
import { useAppState } from '../../state/app_state';
import { matchesAnySearch } from '../../utils/search';
import styles from './styles';

const database = iocContainer.getDatabase();

type SearchProps = {
  language: LanguageCode;
  categoryType?: CategoryType;
  notificationsCount?: number;
  onProductSelected?: (productId: string) => void;
  onItemSelected?: (item: any) => void;
  onNotificationsPress?: () => void;
};

export default function Search({ language, categoryType, notificationsCount = 0, onProductSelected, onItemSelected, onNotificationsPress }: SearchProps) {
  void categoryType;
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<'none' | 'priceAsc' | 'discount'>('none');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState({ product: true, store: true, factory: true });
  const { cart, addToCart, updateQuantity } = useAppState();

  const items = useMemo(() => {
    const productItems = selectedTypes.product
      ? database.getProducts().map((product) => ({ id: product.id, title: product.name, description: product.description ?? '', type: 'product' as const, raw: product }))
      : [];
    const storeItems = selectedTypes.store
      ? database.getStores().map((store) => ({ id: store.id, title: store.name, description: store.description, type: 'store' as const, raw: store }))
      : [];
    const factoryItems = selectedTypes.factory
      ? database.getFactories().map((factory) => ({ id: factory.id, title: factory.name, description: factory.description, type: 'factory' as const, raw: factory }))
      : [];

    const filtered = [...productItems, ...storeItems, ...factoryItems].filter((item) =>
      matchesAnySearch([
        item.title,
        item.description,
        item.type === 'store' ? item.raw.address : undefined,
        item.type === 'store' || item.type === 'factory' ? item.raw.phone : undefined,
        item.type === 'product' ? item.raw.dosage : undefined,
        item.type === 'product' ? item.raw.packageSize : undefined,
      ], query),
    );

    if (sortMode === 'discount') {
      return [...filtered].sort((left, right) => {
        const leftDiscount = left.type === 'product' ? left.raw.discountPercentage : 0;
        const rightDiscount = right.type === 'product' ? right.raw.discountPercentage : 0;
        return rightDiscount - leftDiscount;
      });
    }

    return filtered;
  }, [query, selectedTypes, sortMode]);

  const toggleType = (type: 'product' | 'store' | 'factory') => {
    setSelectedTypes((previous) => ({ ...previous, [type]: !previous[type] }));
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <SearchBar value={query} onChangeText={setQuery} placeholder={t('searchProducts', language)} placeholderTextColor="rgba(255,255,255,0.8)" showFilterButton onFilterPress={() => setShowFilterMenu((value) => !value)} />
      </View>

      {showFilterMenu && (
        <View style={styles.dropDownMenu}>
          <Text style={styles.menuHeader}>Sort by</Text>
          {[
            { label: 'No sort', value: 'none' as const },
            { label: 'Higher discount', value: 'discount' as const },
          ].map((option) => (
            <TouchableOpacity key={option.value} style={[styles.menuOption, sortMode === option.value && styles.menuOptionSelected]} onPress={() => { setSortMode(option.value); setShowFilterMenu(false); }}>
              <Text style={[styles.menuOptionText, sortMode === option.value && styles.menuOptionTextSelected]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.filterRow}>
        {(['product', 'store', 'factory'] as const).map((type) => (
          <TouchableOpacity key={type} activeOpacity={0.8} onPress={() => toggleType(type)} style={[styles.filterButton, selectedTypes[type] && styles.filterButtonActive]}>
            <Text style={[styles.filterButtonText, selectedTypes[type] && styles.filterButtonTextActive]}>{type === 'factory' ? 'Manufacturer' : type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyState}>{t('noMatchingItems', language)}</Text>}
        renderItem={({ item }) => {
          if (item.type === 'product') {
            const product = item.raw;
            const cartItem = cart.find((entry) => entry.productId === product.id);
            const store = product.sellerType === 'store' ? database.getStoreById(product.sellerId) : undefined;
            const manufacturerName = product.sellerType === 'manufacturer' ? database.getFactoryById(product.sellerId)?.name : undefined;
            return (
              <ProductCard
                product={product}
                store={store}
                manufacturerName={manufacturerName}
                cartQuantity={cartItem?.quantity ?? 0}
                maxQuantity={product.stockQuantity}
                onPress={() => onProductSelected?.(product.id)}
                onAddToCart={() => addToCart(product.id, 1)}
                onIncreaseQuantity={() => updateQuantity(product.id, (cartItem?.quantity ?? 0) + 1)}
                onDecreaseQuantity={() => updateQuantity(product.id, (cartItem?.quantity ?? 1) - 1)}
              />
            );
          }

          const sellerProducts = item.type === 'store'
            ? database.getProductsByStore(item.id)
            : database.getProductsByManufacturer(item.id);
          const availableCount = sellerProducts.filter((product) => product.isAvailable && product.stockQuantity > 0).length;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onItemSelected?.({ ...item.raw, type: item.type === 'store' ? 'store' : 'factory' })}
              style={styles.sellerResultCard}>
              <View style={styles.sellerResultHeader}>
                <Text style={styles.sellerResultName}>{item.title}</Text>
                <Text style={styles.sellerResultCount}>{availableCount} available</Text>
              </View>
              <Text style={styles.sellerResultDescription} numberOfLines={2}>{item.description}</Text>
              {'address' in item.raw && item.raw.address ? <Text style={styles.sellerResultMeta}>{item.raw.address}</Text> : null}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
