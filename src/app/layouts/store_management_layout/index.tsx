import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { Store } from '../../models/data_types';
import { iocContainer } from '../../models/ioc_container';
import styles from './styles';

export default function StoreManagementLayout({ onBack, onAddStore, onStoreSelected, feedback }: { onBack: () => void; onAddStore: () => void; onStoreSelected: (storeId: string) => void; feedback?: string }) {
  const database = iocContainer.getDatabase();
  const [query, setQuery] = useState('');
  const [version, setVersion] = useState(0);
  const stores = database.getStores().filter((store) => store.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.title}>Store Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddStore}><Ionicons name="add" size={22} color="#FFFFFF" /></TouchableOpacity>
      </View>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color="#718096" />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search stores by name" style={styles.searchInput} />
      </View>
      {stores.length === 0 ? (
        <View style={styles.emptyState}><Ionicons name="storefront-outline" size={38} color="#94A3B8" /><Text style={styles.emptyTitle}>No stores found</Text><Text style={styles.emptyText}>Add a store to start building the marketplace.</Text></View>
      ) : (
        <FlatList
          data={stores}
          extraData={version}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: Store }) => (
            <TouchableOpacity style={styles.storeCard} onPress={() => onStoreSelected(item.id)} activeOpacity={0.8}>
              <View style={styles.storeIcon}><Ionicons name="storefront-outline" size={22} color="#208AEF" /></View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{item.name}</Text>
                <Text style={styles.storeMeta}>{item.contactPerson}</Text>
                <Text style={styles.storeMeta}>{item.phone}</Text>
                <Text style={styles.storeMeta} numberOfLines={1}>{item.address}</Text>
              </View>
              <View style={[styles.status, item.status === 'active' ? styles.active : styles.inactive]}>
                <Text style={[styles.statusText, item.status === 'active' ? styles.activeText : styles.inactiveText]}>{item.status}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
    </View>
  );
}
