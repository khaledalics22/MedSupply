import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { Product } from '../../models/data_types';
import { iocContainer } from '../../models/ioc_container';
import { getStockStatus } from '../../models/database';
import styles from './styles';

export default function AdminProductOverviewLayout({ onBack, onProductSelected, initialStockFilter }: { onBack: () => void; onProductSelected: (product: Product) => void; initialStockFilter?: 'all' | 'available' | 'low-stock' | 'out-of-stock' }) {
  const database = iocContainer.getDatabase();
  const [query, setQuery] = useState('');
  const [providerType, setProviderType] = useState<'all' | 'store' | 'manufacturer'>('all');
  const [categoryId, setCategoryId] = useState<'all' | string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'low-stock' | 'out-of-stock'>(initialStockFilter ?? 'all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortMode, setSortMode] = useState<'name' | 'priceAsc' | 'priceDesc' | 'discount' | 'stockAsc' | 'stockDesc'>('name');
  const [specialties, setSpecialties] = useState<import('../../models/data_types').Specialty[]>([]);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [manufacturerNames, setManufacturerNames] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [specialtyItems, storeItems, manufacturerItems] = await Promise.all([
          database.getSpecialtiesAsync(),
          database.getStoresAsync(true),
          database.getFactoriesAsync(true),
        ]);
        if (!active) return;

        setSpecialties(specialtyItems);
        setStoreNames(Object.fromEntries(storeItems.map((store) => [store.id, store.name])));
        setManufacturerNames(Object.fromEntries(manufacturerItems.map((manufacturer) => [manufacturer.id, manufacturer.name])));

        const [storeProducts, manufacturerProducts] = await Promise.all([
          Promise.all(storeItems.map((store) => database.getProductsByStoreAsync(store.id))),
          Promise.all(manufacturerItems.map((manufacturer) => database.getProductsByManufacturerAsync(manufacturer.id))),
        ]);
        if (!active) return;

        const combined = [...storeProducts.flat(), ...manufacturerProducts.flat()];
        const deduplicated = Array.from(new Map(combined.map((product) => [product.id, product])).values());
        setProducts(deduplicated);
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load product overview.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [database, refreshVersion]);

  const providerName = (product: Product) => {
    if (product.sellerType === 'store') return storeNames[product.sellerId] ?? 'Unknown store';
    return manufacturerNames[product.sellerId] ?? 'Unknown manufacturer';
  };

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().replace(/\s+/g, ' ').toLowerCase();
    const compactQuery = normalizedQuery.replace(/\s+/g, '').replace(/\s/g, '');

    let filtered = products.filter((product) => {
      if (providerType !== 'all' && product.sellerType !== providerType) return false;
      if (categoryId !== 'all') {
        const selectedSpecialty = specialties.find((specialty) => specialty.id === categoryId || specialty.legacyId === categoryId);
        const matchesSpecialty = Boolean(selectedSpecialty && (
          product.specialtyId === selectedSpecialty.id ||
          (selectedSpecialty.legacyId && product.specialtyId === selectedSpecialty.legacyId)
        )) || product.specialtyId === categoryId;
        if (!matchesSpecialty) return false;
      }
      if (availabilityFilter === 'active' && !product.isAvailable) return false;
      if (availabilityFilter === 'inactive' && product.isAvailable) return false;

      const stockStatus = getStockStatus(product.stockQuantity, product.isAvailable);
      if (stockFilter !== 'all' && stockStatus !== stockFilter) return false;

      if (normalizedQuery) {
        const name = product.name.toLowerCase().replace(/\s+/g, ' ').trim();
        const dosage = (product.dosage ?? '').toLowerCase().replace(/\s+/g, '').trim();
        if (!name.includes(normalizedQuery) && !dosage.includes(compactQuery)) return false;
      }
      return true;
    });

    if (sortMode === 'name') filtered = [...filtered].sort((left, right) => left.name.localeCompare(right.name));
    if (sortMode === 'priceAsc') filtered = [...filtered].sort((left, right) => left.pharmacyPriceAfterDiscount - right.pharmacyPriceAfterDiscount);
    if (sortMode === 'priceDesc') filtered = [...filtered].sort((left, right) => right.pharmacyPriceAfterDiscount - left.pharmacyPriceAfterDiscount);
    if (sortMode === 'discount') filtered = [...filtered].sort((left, right) => right.discountPercentage - left.discountPercentage);
    if (sortMode === 'stockAsc') filtered = [...filtered].sort((left, right) => left.stockQuantity - right.stockQuantity);
    if (sortMode === 'stockDesc') filtered = [...filtered].sort((left, right) => right.stockQuantity - left.stockQuantity);
    return filtered;
  }, [query, providerType, categoryId, stockFilter, availabilityFilter, sortMode, products, specialties]);

  const clearFilters = () => {
    setQuery('');
    setProviderType('all');
    setCategoryId('all');
    setStockFilter('all');
    setAvailabilityFilter('all');
    setSortMode('name');
  };

  const activeFilterCount = (providerType !== 'all' ? 1 : 0) + (categoryId !== 'all' ? 1 : 0) + (stockFilter !== 'all' ? 1 : 0) + (availabilityFilter !== 'all' ? 1 : 0) + (query.trim() ? 1 : 0) + (sortMode !== 'name' ? 1 : 0);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Product Overview</Text><View style={styles.headerSpace} /></View>
        <View style={styles.empty}><Text style={styles.emptyTitle}>Unable to load products</Text><Text style={styles.emptyText}>{error}</Text><TouchableOpacity style={styles.clearButton} onPress={() => setRefreshVersion((value) => value + 1)}><Text style={styles.clearText}>Retry</Text></TouchableOpacity></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.title}>Product Overview</Text>
        <View style={styles.headerSpace} />
      </View>

      <View style={styles.searchRow}><Ionicons name="search" size={20} color="#718096" /><TextInput value={query} onChangeText={setQuery} placeholder="Search product or dosage" style={styles.searchInput} /></View>

      <View style={styles.filters}>
        {(['all', 'store', 'manufacturer'] as const).map((filter) => (
          <TouchableOpacity key={filter} style={[styles.filter, providerType === filter && styles.filterActive]} onPress={() => setProviderType(filter)}><Text style={[styles.filterText, providerType === filter && styles.filterTextActive]}>{filter === 'all' ? 'All providers' : filter === 'store' ? 'Stores' : 'Manufacturers'}</Text></TouchableOpacity>
        ))}
      </View>

      <View style={styles.filters}>
        {(['all', 'available', 'low-stock', 'out-of-stock'] as const).map((filter) => (
          <TouchableOpacity key={filter} style={[styles.filter, stockFilter === filter && styles.filterActive]} onPress={() => setStockFilter(filter)}><Text style={[styles.filterText, stockFilter === filter && styles.filterTextActive]}>{filter === 'all' ? 'All stock' : filter}</Text></TouchableOpacity>
        ))}
      </View>

      <View style={styles.filters}>
        {(['all', 'active', 'inactive'] as const).map((filter) => (
          <TouchableOpacity key={filter} style={[styles.filter, availabilityFilter === filter && styles.filterActive]} onPress={() => setAvailabilityFilter(filter)}><Text style={[styles.filterText, availabilityFilter === filter && styles.filterTextActive]}>{filter}</Text></TouchableOpacity>
        ))}
      </View>

      <View style={styles.filters}>
        <TouchableOpacity style={[styles.sortFilter, sortMode === 'name' && styles.filterActive]} onPress={() => setSortMode('name')}><Text style={[styles.filterText, sortMode === 'name' && styles.filterTextActive]}>Name</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.sortFilter, sortMode === 'priceAsc' && styles.filterActive]} onPress={() => setSortMode('priceAsc')}><Text style={[styles.filterText, sortMode === 'priceAsc' && styles.filterTextActive]}>Lowest price</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.sortFilter, sortMode === 'priceDesc' && styles.filterActive]} onPress={() => setSortMode('priceDesc')}><Text style={[styles.filterText, sortMode === 'priceDesc' && styles.filterTextActive]}>Highest price</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.sortFilter, sortMode === 'discount' && styles.filterActive]} onPress={() => setSortMode('discount')}><Text style={[styles.filterText, sortMode === 'discount' && styles.filterTextActive]}>Discount</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.sortFilter, sortMode === 'stockAsc' && styles.filterActive]} onPress={() => setSortMode('stockAsc')}><Text style={[styles.filterText, sortMode === 'stockAsc' && styles.filterTextActive]}>Lowest stock</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.sortFilter, sortMode === 'stockDesc' && styles.filterActive]} onPress={() => setSortMode('stockDesc')}><Text style={[styles.filterText, sortMode === 'stockDesc' && styles.filterTextActive]}>Highest stock</Text></TouchableOpacity>
      </View>

      <View style={styles.categoryRow}>
        {(['all', ...specialties.map((item) => item.legacyId ?? item.id)] as const).map((id) => {
          const specialty = specialties.find((item) => item.id === id || item.legacyId === id);
          return (
            <TouchableOpacity key={id} style={[styles.categoryFilter, categoryId === id && styles.categoryFilterActive]} onPress={() => setCategoryId(id)}>
              <Text style={[styles.categoryText, categoryId === id && styles.categoryTextActive]}>{id === 'all' ? 'All categories' : specialty?.name ?? id}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeFilterCount > 0 ? <TouchableOpacity style={styles.clearButton} onPress={clearFilters}><Text style={styles.clearText}>Clear filters ({activeFilterCount})</Text></TouchableOpacity> : null}

      <FlatList
        data={filteredProducts}
        keyExtractor={(product) => product.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="cube-outline" size={38} color="#94A3B8" /><Text style={styles.emptyTitle}>No products found</Text><Text style={styles.emptyText}>Try clearing or changing filters.</Text></View>}
        renderItem={({ item }: { item: Product }) => (
          <TouchableOpacity style={styles.card} onPress={() => onProductSelected(item)} activeOpacity={0.8}>
            <View style={styles.icon}><Ionicons name="cube-outline" size={24} color="#208AEF" /></View>
            <View style={styles.info}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.meta}>{item.dosage ?? 'Dosage unspecified'} • {specialties.find((category) => category.id === item.specialtyId || category.legacyId === item.specialtyId)?.name ?? item.specialtyId}</Text>
              <Text style={styles.provider}>{providerName(item)} • {item.sellerType === 'store' ? 'Store' : 'Manufacturer'}</Text>
              <Text style={styles.meta}>Stock: {item.stockQuantity} • {getStockStatus(item.stockQuantity, item.isAvailable).replace('-', ' ')} • {item.isAvailable ? 'Active' : 'Inactive'}</Text>
              <View style={styles.prices}><Text style={styles.consumer}>{item.consumerPrice.toFixed(2)} EGP</Text><Text style={styles.pharmacist}>{item.pharmacyPriceAfterDiscount.toFixed(2)} EGP</Text><Text style={styles.discount}>-{item.discountPercentage}%</Text></View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
