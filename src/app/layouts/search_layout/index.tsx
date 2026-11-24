import { useEffect, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

import ProductCard from '../../components/product_card';
import SearchBar from '../../components/search_bar';
import { t, type LanguageCode } from '../../i18n';
import { iocContainer } from '../../models/ioc_container';
import { useAppState } from '../../state/app_state';
import styles from './styles';

const database = iocContainer.getDatabase();

type SearchProps = {
  language: LanguageCode;
  categoryType?: any;
  notificationsCount?: number;
  onProductSelected?: (productId: string) => void;
  onItemSelected?: (item: any) => void;
  onNotificationsPress?: () => void;
};

export default function Search({ language, onProductSelected }: SearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [providerType, setProviderType] = useState<'all' | 'store' | 'manufacturer'>('all');
  const [categoryId, setCategoryId] = useState<'all' | string>('all');
  const [minDiscount, setMinDiscount] = useState('');
  const [includeOutOfStock, setIncludeOutOfStock] = useState(false);
  const [sortMode, setSortMode] = useState<'none' | 'priceAsc' | 'priceDesc' | 'discount'>('none');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const { cart, addToCart, updateQuantity } = useAppState();

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim().replace(/\s+/g, ' ')), 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const normalizedQuery = debouncedQuery.toLowerCase();
  const specialties = database.getSpecialties();

  const items = useMemo(() => {
    let products = database.getProducts().filter((product) => {
      if (providerType !== 'all' && product.sellerType !== providerType) return false;
      if (!includeOutOfStock && (!product.isAvailable || product.stockQuantity <= 0)) return false;

      if (product.sellerType === 'store') {
        const store = database.getStoreById(product.sellerId);
        if (!store || store.status !== 'active') return false;
      } else {
        const manufacturer = database.getFactoryById(product.sellerId);
        if (!manufacturer || manufacturer.status !== 'active') return false;
      }

      if (categoryId !== 'all' && product.specialtyId !== categoryId) return false;
      if (minDiscount.trim()) {
        const minimum = Number(minDiscount);
        if (!Number.isFinite(minimum) || product.discountPercentage < minimum) return false;
      }

      if (normalizedQuery) {
        const name = product.name.toLowerCase().replace(/\s+/g, ' ').trim();
        const dosage = (product.dosage ?? '').toLowerCase().replace(/\s+/g, '').trim();
        const compactQuery = normalizedQuery.replace(/\s+/g, '');
        if (!name.includes(normalizedQuery) && !dosage.includes(compactQuery)) return false;
      }
      return true;
    });

    if (sortMode === 'priceAsc') products = [...products].sort((a, b) => a.pharmacyPriceAfterDiscount - b.pharmacyPriceAfterDiscount);
    if (sortMode === 'priceDesc') products = [...products].sort((a, b) => b.pharmacyPriceAfterDiscount - a.pharmacyPriceAfterDiscount);
    if (sortMode === 'discount') products = [...products].sort((a, b) => b.discountPercentage - a.discountPercentage);

    return products;
  }, [debouncedQuery, providerType, categoryId, minDiscount, includeOutOfStock, sortMode]);

  const clearFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setProviderType('all');
    setCategoryId('all');
    setMinDiscount('');
    setIncludeOutOfStock(false);
    setSortMode('none');
  };

  const activeFilterCount = (providerType !== 'all' ? 1 : 0) + (categoryId !== 'all' ? 1 : 0) + (minDiscount.trim() ? 1 : 0) + (includeOutOfStock ? 1 : 0) + (sortMode !== 'none' ? 1 : 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar value={query} onChangeText={setQuery} placeholder={t('searchProducts', language)} placeholderTextColor="rgba(255,255,255,0.8)" showFilterButton onFilterPress={() => setShowFilterMenu((value) => !value)} />
        {query.length > 0 ? <TouchableOpacity onPress={() => { setQuery(''); setDebouncedQuery(''); }} style={styles.clearSearch}><Text style={styles.clearSearchText}>Clear</Text></TouchableOpacity> : null}
      </View>

      {showFilterMenu ? (
        <View style={styles.dropDownMenu}>
          <Text style={styles.menuHeader}>Sort and availability</Text>
          {([
            ['none', 'No sort'], ['priceAsc', 'Lowest pharmacist price'], ['priceDesc', 'Highest pharmacist price'], ['discount', 'Highest discount'],
          ] as const).map(([value, label]) => (
            <TouchableOpacity key={value} style={[styles.menuOption, sortMode === value && styles.menuOptionSelected]} onPress={() => setSortMode(value)}>
              <Text style={[styles.menuOptionText, sortMode === value && styles.menuOptionTextSelected]}>{label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.menuOption, includeOutOfStock && styles.menuOptionSelected]} onPress={() => setIncludeOutOfStock((current) => !current)}>
            <Text style={[styles.menuOptionText, includeOutOfStock && styles.menuOptionTextSelected]}>{includeOutOfStock ? 'Including out-of-stock' : 'Include out-of-stock'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.filterRow}>
        {(['all', 'store', 'manufacturer'] as const).map((type) => (
          <TouchableOpacity key={type} style={[styles.filterButton, providerType === type && styles.filterButtonActive]} onPress={() => setProviderType(type)}>
            <Text style={[styles.filterButtonText, providerType === type && styles.filterButtonTextActive]}>{type === 'all' ? 'All providers' : type === 'store' ? 'Stores' : 'Manufacturers'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.categoryRow}>
        {(['all', ...specialties.map((item) => item.id)] as const).map((id) => (
          <TouchableOpacity key={id} style={[styles.categoryButton, categoryId === id && styles.categoryButtonActive]} onPress={() => setCategoryId(id)}>
            <Text style={[styles.categoryText, categoryId === id && styles.categoryTextActive]}>{id === 'all' ? 'All categories' : specialties.find((item) => item.id === id)?.name ?? id}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.discountRow}>
        <Text style={styles.discountLabel}>Minimum discount</Text>
        <TextInput value={minDiscount} onChangeText={setMinDiscount} keyboardType="numeric" placeholder="0" style={styles.discountInput} />
        {activeFilterCount > 0 ? <TouchableOpacity style={styles.clearFilters} onPress={clearFilters}><Text style={styles.clearFiltersText}>Clear ({activeFilterCount})</Text></TouchableOpacity> : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyState}>{t('noMatchingItems', language)}</Text>}
        renderItem={({ item }) => {
          const cartItem = cart.find((entry) => entry.productId === item.id);
          const store = item.sellerType === 'store' ? database.getStoreById(item.sellerId) : undefined;
          const manufacturerName = item.sellerType === 'manufacturer' ? database.getFactoryById(item.sellerId)?.name : undefined;
          return (
            <View>
              <ProductCard
                product={item}
                store={store}
                manufacturerName={manufacturerName}
                cartQuantity={cartItem?.quantity ?? 0}
                maxQuantity={item.stockQuantity}
                onPress={() => onProductSelected?.(item.id)}
                onAddToCart={() => addToCart(item.id, 1)}
                onIncreaseQuantity={() => updateQuantity(item.id, (cartItem?.quantity ?? 0) + 1)}
                onDecreaseQuantity={() => updateQuantity(item.id, (cartItem?.quantity ?? 1) - 1)}
              />
            </View>
          );
        }}
      />
    </View>
  );
}
