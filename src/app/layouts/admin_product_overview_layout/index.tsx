import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { Product } from '../../models/data_types';
import { iocContainer } from '../../models/ioc_container';
import { getStockStatus } from '../../models/database';
import styles from './styles';

export default function AdminProductOverviewLayout({ onBack, onProductSelected, initialStockFilter }: { onBack: () => void; onProductSelected: (product: Product) => void; initialStockFilter?: 'all' | 'available' | 'low-stock' | 'out-of-stock' }) {
  const database = iocContainer.getDatabase();
  const specialties = database.getSpecialties();
  const [query, setQuery] = useState('');
  const [providerType, setProviderType] = useState<'all' | 'store' | 'manufacturer'>('all');
  const [categoryId, setCategoryId] = useState<'all' | string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'low-stock' | 'out-of-stock'>(initialStockFilter ?? 'all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortMode, setSortMode] = useState<'name' | 'priceAsc' | 'priceDesc' | 'discount' | 'stockAsc' | 'stockDesc'>('name');

  const providerName = (product: Product) => {
    if (product.sellerType === 'store') return database.getStoreById(product.sellerId)?.name ?? 'Unknown store';
    return database.getFactoryById(product.sellerId)?.name ?? 'Unknown manufacturer';
  };

  const products = useMemo(() => {
    const normalizedQuery = query.trim().replace(/\s+/g, ' ').toLowerCase();
    const compactQuery = normalizedQuery.replace(/\s+/g, '').replace(/\s/g, '');

    let filtered = database.getProducts().filter((product) => {
      if (providerType !== 'all' && product.sellerType !== providerType) return false;
      if (categoryId !== 'all' && product.specialtyId !== categoryId) return false;
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
  }, [query, providerType, categoryId, stockFilter, availabilityFilter, sortMode]);

  const clearFilters = () => {
    setQuery('');
    setProviderType('all');
    setCategoryId('all');
    setStockFilter('all');
    setAvailabilityFilter('all');
    setSortMode('name');
  };

  const activeFilterCount = (providerType !== 'all' ? 1 : 0) + (categoryId !== 'all' ? 1 : 0) + (stockFilter !== 'all' ? 1 : 0) + (availabilityFilter !== 'all' ? 1 : 0) + (query.trim() ? 1 : 0) + (sortMode !== 'name' ? 1 : 0);

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
        {(['all', ...specialties.map((item) => item.id)] as const).map((id) => (
          <TouchableOpacity key={id} style={[styles.categoryFilter, categoryId === id && styles.categoryFilterActive]} onPress={() => setCategoryId(id)}><Text style={[styles.categoryText, categoryId === id && styles.categoryTextActive]}>{id === 'all' ? 'All categories' : specialties.find((item) => item.id === id)?.name ?? id}</Text></TouchableOpacity>
        ))}
      </View>

      {activeFilterCount > 0 ? <TouchableOpacity style={styles.clearButton} onPress={clearFilters}><Text style={styles.clearText}>Clear filters ({activeFilterCount})</Text></TouchableOpacity> : null}

      <FlatList
        data={products}
        keyExtractor={(product) => product.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="cube-outline" size={38} color="#94A3B8" /><Text style={styles.emptyTitle}>No products found</Text><Text style={styles.emptyText}>Try clearing or changing filters.</Text></View>}
        renderItem={({ item }: { item: Product }) => (
          <TouchableOpacity style={styles.card} onPress={() => onProductSelected(item)} activeOpacity={0.8}>
            <View style={styles.icon}><Ionicons name="cube-outline" size={24} color="#208AEF" /></View>
            <View style={styles.info}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.meta}>{item.dosage ?? 'Dosage unspecified'} • {specialties.find((category) => category.id === item.specialtyId)?.name ?? item.specialtyId}</Text>
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
