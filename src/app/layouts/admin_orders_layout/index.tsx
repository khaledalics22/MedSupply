import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { Order, OrderStatus } from '../../models/data_types';
import { iocContainer } from '../../models/ioc_container';
import FilterPanel from '../../components/filter_panel';
import styles from './styles';

export default function AdminOrdersLayout({ onBack, onOrderSelected, initialStatus }: { onBack: () => void; onOrderSelected: (orderId: string) => void; initialStatus?: 'all' | OrderStatus }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>(initialStatus ?? 'all');
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    iocContainer.getDatabase().getAllOrdersAsync()
      .then((items) => { if (active) setOrders(items); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to load orders.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshVersion]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders
      .filter((order) => statusFilter === 'all' || order.status === statusFilter)
      .filter((order) => !normalized || order.id.toLowerCase().includes(normalized) || (order.customerName ?? '').toLowerCase().includes(normalized));
  }, [orders, statusFilter, query]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.title}>Order Management</Text>
        <View style={styles.headerSpace} />
      </View>
      <View style={styles.searchRow}><Ionicons name="search" size={20} color="#718096" /><TextInput value={query} onChangeText={setQuery} placeholder="Search order ID or pharmacist" style={styles.searchInput} /><TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters((visible) => !visible)}><Ionicons name="options" size={18} color="#208AEF" /></TouchableOpacity></View>
      <FilterPanel visible={showFilters} title="Filters" clearLabel="Clear" applyLabel="Apply" onClear={() => { setStatusFilter('all'); setQuery(''); }} onApply={() => setShowFilters(false)}>
        <View style={styles.filters}>{(['all', 'pending', 'approved', 'rejected', 'completed'] as const).map((status) => {
          const count = status === 'all' ? orders.length : orders.filter((order) => order.status === status).length;
          return <TouchableOpacity key={status} style={[styles.filter, statusFilter === status && styles.filterActive]} onPress={() => setStatusFilter(status)}><Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>{status === 'all' ? 'All Orders' : status} ({count})</Text></TouchableOpacity>;
        })}</View>
      </FilterPanel>
      {loading ? <Text style={styles.emptyText}>Loading orders...</Text> : error ? <View style={styles.empty}><Text style={styles.emptyTitle}>Unable to load orders</Text><Text style={styles.emptyText}>{error}</Text><TouchableOpacity style={styles.filter} onPress={() => setRefreshVersion((value) => value + 1)}><Text style={styles.filterText}>Retry</Text></TouchableOpacity></View> : null}
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : (
        <FlatList
          data={filtered}
          keyExtractor={(order) => order.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="receipt-outline" size={38} color="#94A3B8" /><Text style={styles.emptyTitle}>No orders found</Text><Text style={styles.emptyText}>Try another status or search value.</Text></View>}
          renderItem={({ item }: { item: Order }) => (
            <TouchableOpacity style={styles.card} onPress={() => onOrderSelected(item.id)} activeOpacity={0.8}>
              <View style={styles.cardHeader}><Text style={styles.orderId}>{item.id}</Text><StatusBadge status={item.status} /></View>
              <Text style={styles.customer}>{item.customerName ?? 'Pharmacist'}</Text>
              <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
              <View style={styles.cardFooter}><Text style={styles.meta}>{item.totalItems} item(s)</Text><Text style={styles.total}>{item.totalPrice.toFixed(2)} EGP</Text></View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return <View style={[styles.status, styles[`status_${status}`] as any]}><Text style={[styles.statusText, styles[`statusText_${status}`] as any]}>{status}</Text></View>;
}

function formatDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString();
}
