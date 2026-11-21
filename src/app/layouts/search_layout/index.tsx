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
import styles from './styles';

const database = iocContainer.getDatabase();

type SearchProps = {
  language: LanguageCode;
  categoryType?: CategoryType;
  notificationsCount?: number;
  onProductSelected?: (productId: string) => void;
  onItemSelected?: (item: any) => void;
  onCartPress?: () => void;
  onNotificationsPress?: () => void;
};

export default function Search({ language, categoryType, notificationsCount = 0, onProductSelected, onItemSelected, onCartPress, onNotificationsPress }: SearchProps) {
  void categoryType;
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<'none' | 'priceAsc' | 'discount'>('none');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState({ product: true, store: true, factory: true });
  const { addToCart, cartCount } = useAppState();

  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const productItems = selectedTypes.product ? database.getProducts().map((product) => ({ id: product.id, title: product.name, description: product.description ?? '', type: 'product' as const, raw: product })) : [];
    const storeItems = selectedTypes.store ? database.getStores().map((store) => ({ id: store.id, title: store.name, description: store.description, type: 'store' as const, raw: store })) : [];
    const factoryItems = selectedTypes.factory ? database.getFactories().map((factory) => ({ id: factory.id, title: factory.name, description: factory.description, type: 'factory' as const, raw: factory })) : [];

    const filtered = [...productItems, ...storeItems, ...factoryItems].filter((item) => {
      if (!normalizedQuery) return true;
      return item.title.toLowerCase().includes(normalizedQuery) || item.description.toLowerCase().includes(normalizedQuery);
    });

    if (sortMode === 'priceAsc') {
      return filtered.sort((left, right) => {
        const leftPrice = left.type === 'product' ? left.raw.price ?? 0 : 0;
        const rightPrice = right.type === 'product' ? right.raw.price ?? 0 : 0;
        return leftPrice - rightPrice;
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
        <AppHeader title="Search" language={language} cartCount={cartCount} notificationsCount={notificationsCount} onLanguageToggle={() => {}} onCartPress={onCartPress} onNotificationsPress={onNotificationsPress} />
        <SearchBar value={query} onChangeText={setQuery} placeholder={t('searchProducts', language)} placeholderTextColor="rgba(255,255,255,0.8)" showFilterButton onFilterPress={() => setShowFilterMenu((value) => !value)} />
      </View>

      {showFilterMenu && (
        <View style={styles.dropDownMenu}>
          <Text style={styles.menuHeader}>Sort by</Text>
          {[
            { label: 'All', value: 'none' as const },
            { label: 'Lower price', value: 'priceAsc' as const },
          ].map((option) => (
            <TouchableOpacity key={option.value} style={[styles.menuOption, sortMode === option.value && styles.menuOptionSelected]} onPress={() => { setSortMode(option.value); setShowFilterMenu(false); }}>
              <Text style={styles.menuOptionText}>{option.label}</Text>
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
            const candidates = [
              ...database.getStoreOffersByProduct(product.id).filter((offer) => offer.isAvailable && offer.stockQuantity > 0).map((offer) => ({ offerType: 'store' as const, offer })),
              ...database.getManufacturerOffersByProduct(product.id).filter((offer) => offer.isAvailable && offer.stockQuantity > 0).map((offer) => ({ offerType: 'manufacturer' as const, offer })),
            ].sort((left, right) => left.offer.pharmacyPriceAfterDiscount - right.offer.pharmacyPriceAfterDiscount);

            if (candidates.length > 0) {
              const candidate = candidates[0];
              const store = candidate.offerType === 'store' ? database.getStoreById(candidate.offer.storeId) : undefined;
              const manufacturerName = candidate.offerType === 'manufacturer' ? database.getFactoryById(candidate.offer.manufacturerId)?.name : undefined;
              return (
                <ProductCard
                  product={product}
                  offer={candidate.offer}
                  store={store}
                  manufacturerName={manufacturerName}
                  onPress={() => onProductSelected?.(product.id)}
                  onAddToCart={() => addToCart(candidate.offerType, candidate.offer.id, 1)}
                />
              );
            }
          }

          return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => onItemSelected?.({ ...item.raw, type: item.type === 'store' ? 'store' : 'factory' })} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEF4FF' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2A37' }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: '#5D7285', marginTop: 4 }}>{item.description}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
