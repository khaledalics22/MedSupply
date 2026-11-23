import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { Factory } from '../../models/data_types';
import { iocContainer } from '../../models/ioc_container';
import styles from './styles';

export default function ManufacturerManagementLayout({ onBack, onAdd, onSelected, feedback }: { onBack: () => void; onAdd: () => void; onSelected: (factoryId: string) => void; feedback?: string }) {
  const database = iocContainer.getDatabase();
  const [query, setQuery] = useState('');
  const [, refresh] = useState(0);
  const manufacturers = database.getFactories().filter((factory) => factory.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.title}>Manufacturer Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAdd}><Ionicons name="add" size={22} color="#FFFFFF" /></TouchableOpacity>
      </View>
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      <View style={styles.searchRow}><Ionicons name="search" size={20} color="#718096" /><TextInput value={query} onChangeText={setQuery} placeholder="Search manufacturers by name" style={styles.searchInput} /></View>
      {manufacturers.length === 0 ? (
        <View style={styles.emptyState}><Ionicons name="business-outline" size={38} color="#94A3B8" /><Text style={styles.emptyTitle}>No manufacturers found</Text><Text style={styles.emptyText}>Add a manufacturer to expand the marketplace.</Text></View>
      ) : (
        <FlatList
          data={manufacturers}
          extraData={refresh}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: Factory }) => (
            <TouchableOpacity style={styles.card} onPress={() => onSelected(item.id)} activeOpacity={0.8}>
              <View style={styles.icon}><Ionicons name="business-outline" size={22} color="#208AEF" /></View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.contactPerson}</Text>
                <Text style={styles.meta}>{item.phone}</Text>
                <Text style={styles.meta} numberOfLines={1}>{typeof item.location === 'string' ? item.location : item.address ?? 'Address unavailable'}</Text>
              </View>
              <View style={[styles.status, item.status === 'active' ? styles.active : styles.inactive]}><Text style={[styles.statusText, item.status === 'active' ? styles.activeText : styles.inactiveText]}>{item.status}</Text></View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
