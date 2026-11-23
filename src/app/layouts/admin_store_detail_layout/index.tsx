import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { iocContainer } from '../../models/ioc_container';
import styles from './styles';

export default function AdminStoreDetailLayout({ storeId, onBack, onEdit }: { storeId: string; onBack: () => void; onEdit: (storeId: string) => void }) {
  const database = iocContainer.getDatabase();
  const [, refresh] = useState(0);
  const store = database.getStoreById(storeId);
  const products = useMemo(() => database.getProductsByStore(storeId), [database, storeId, refresh]);
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!store) {
    return <View style={styles.container}><View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Store not found</Text></View></View>;
  }

  const changeStatus = () => {
    const nextStatus = store.status === 'active' ? 'inactive' : 'active';
    database.setStoreStatus(store.id, nextStatus);
    setConfirmStatus(false);
    setFeedback(`Store ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
    refresh((value) => value + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.title}>Store Details</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(store.id)}><Ionicons name="create-outline" size={20} color="#FFFFFF" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        <View style={styles.infoCard}>
          <View style={styles.logo}><Ionicons name="storefront-outline" size={30} color="#208AEF" /></View>
          <Text style={styles.storeName}>{store.name}</Text>
          <View style={[styles.status, store.status === 'active' ? styles.active : styles.inactive]}><Text style={[styles.statusText, store.status === 'active' ? styles.activeText : styles.inactiveText]}>{store.status}</Text></View>
          <Text style={styles.description}>{store.description}</Text>
          <InfoRow icon="person-outline" label="Contact person" value={store.contactPerson} />
          <InfoRow icon="call-outline" label="Phone" value={store.phone} />
          <InfoRow icon="location-outline" label="Address" value={store.address ?? 'Address unavailable'} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.editAction} onPress={() => onEdit(store.id)}><Ionicons name="create-outline" size={18} color="#208AEF" /><Text style={styles.editActionText}>Edit Store</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.statusAction, store.status === 'active' ? styles.deactivateAction : styles.activateAction]} onPress={() => setConfirmStatus(true)}>
            <Ionicons name={store.status === 'active' ? 'pause-circle-outline' : 'checkmark-circle-outline'} size={18} color={store.status === 'active' ? '#B45309' : '#16794A'} />
            <Text style={[styles.statusActionText, store.status === 'active' ? styles.deactivateText : styles.activateText]}>{store.status === 'active' ? 'Deactivate' : 'Activate'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productsSection}>
          <View style={styles.productsHeader}><Text style={styles.sectionTitle}>Products</Text><Text style={styles.productCount}>{products.length}</Text></View>
          {products.length === 0 ? (
            <View style={styles.emptyProducts}><Ionicons name="cube-outline" size={30} color="#94A3B8" /><Text style={styles.emptyTitle}>No products yet</Text><Text style={styles.emptyText}>Products assigned to this store will appear here.</Text></View>
          ) : (
            products.map((product) => (
              <View key={product.id} style={styles.productRow}>
                <View style={styles.productIcon}><Ionicons name="cube-outline" size={20} color="#208AEF" /></View>
                <View style={styles.productInfo}><Text style={styles.productName}>{product.name}</Text><Text style={styles.productMeta}>{product.dosage ?? 'Dosage unspecified'} • {product.stockQuantity} in stock</Text></View>
                <Text style={styles.productPrice}>{product.pharmacyPriceAfterDiscount.toFixed(2)} EGP</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={confirmStatus} transparent animationType="fade" onRequestClose={() => setConfirmStatus(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{store.status === 'active' ? 'Deactivate store?' : 'Activate store?'}</Text>
            <Text style={styles.modalText}>{store.status === 'active' ? 'The store will no longer be available to pharmacists. Products and historical orders will be preserved.' : 'The store and its available products will return to pharmacist marketplace browsing.'}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmStatus(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, store.status === 'active' ? styles.confirmDeactivate : styles.confirmActivate]} onPress={changeStatus}><Text style={styles.confirmText}>Confirm</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return <View style={styles.infoRow}><Ionicons name={icon} size={18} color="#718096" /><View style={styles.infoText}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View></View>;
}
