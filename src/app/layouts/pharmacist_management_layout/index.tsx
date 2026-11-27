import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { PharmacistAccountStatus, User } from '../../models/auth';
import { authService } from '../../models/auth_service';
import FilterPanel from '../../components/filter_panel';
import styles from './styles';

export default function PharmacistManagementLayout({ onBack, onSelected, initialStatus }: { onBack: () => void; onSelected: (userId: string) => void; initialStatus?: 'all' | PharmacistAccountStatus }) {
  const [pharmacists, setPharmacists] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | PharmacistAccountStatus>(initialStatus ?? 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    authService.getPharmacists().then(setPharmacists).catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load pharmacists')).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
    return pharmacists.filter((pharmacist) => status === 'all' || pharmacist.accountStatus === status).filter((pharmacist) => {
      if (!normalized) return true;
      return [pharmacist.fullName, pharmacist.email, pharmacist.phone, pharmacist.pharmacyName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [pharmacists, query, status]);

  const pendingCount = pharmacists.filter((pharmacist) => pharmacist.accountStatus === 'pending').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Pharmacists</Text><View style={styles.headerSpace} /></View>
      <View style={styles.searchRow}><Ionicons name="search" size={20} color="#718096" /><TextInput value={query} onChangeText={setQuery} placeholder="Search name, pharmacy, email or phone" style={styles.searchInput} /><TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters((visible) => !visible)}><Ionicons name="options" size={18} color="#208AEF" /></TouchableOpacity></View>
      <FilterPanel visible={showFilters} title="Filters" clearLabel="Clear" applyLabel="Apply" onClear={() => setStatus('all')} onApply={() => setShowFilters(false)}>
        <View style={styles.filters}>{(['all', 'pending', 'active', 'rejected', 'inactive'] as const).map((filter) => <TouchableOpacity key={filter} style={[styles.filter, status === filter && styles.filterActive]} onPress={() => setStatus(filter)}><Text style={[styles.filterText, status === filter && styles.filterTextActive]}>{filter}{filter === 'pending' && pendingCount > 0 && ` (${pendingCount})`}</Text></TouchableOpacity>)}</View>
      </FilterPanel>
      {loading ? <Text style={styles.emptyText}>Loading pharmacists...</Text> : error ? <Text style={styles.error}>{error}</Text> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="people-outline" size={38} color="#94A3B8" /><Text style={styles.emptyTitle}>No pharmacists found</Text></View>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => onSelected(item.id)} activeOpacity={0.8}>
              <View style={styles.icon}><Ionicons name="person-outline" size={22} color="#208AEF" /></View>
              <View style={styles.info}><Text style={styles.name}>{item.fullName}</Text><Text style={styles.meta}>{item.pharmacyName ?? 'Pharmacy not provided'}</Text><Text style={styles.meta}>{item.email}</Text><Text style={styles.meta}>{item.phone ?? 'Phone unavailable'}</Text><Text style={styles.meta}>Registered: {new Date(item.createdAt).toLocaleDateString()}</Text></View>
              <View style={[styles.status, styles[`status_${item.accountStatus ?? 'pending'}`]]}><Text style={[styles.statusText, styles[`statusText_${item.accountStatus ?? 'pending'}`]]}>{item.accountStatus ?? 'pending'}</Text></View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
