import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { iocContainer } from '../../models/ioc_container';
import styles from './styles';

export default function AdminManufacturerDetailLayout({ factoryId, onBack, onEdit }: { factoryId: string; onBack: () => void; onEdit: (factoryId: string) => void }) {
  const database = iocContainer.getDatabase();
  const [, refresh] = useState(0);
  const factory = database.getFactoryById(factoryId);
  const products = useMemo(() => database.getProductsByManufacturer(factoryId), [database, factoryId, refresh]);
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!factory) return <View style={styles.container}><View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Manufacturer not found</Text></View></View>;

  const changeStatus = () => {
    const nextStatus = factory.status === 'active' ? 'inactive' : 'active';
    database.setFactoryStatus(factory.id, nextStatus);
    setConfirmStatus(false); setFeedback(`Manufacturer ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`); refresh((value) => value + 1);
  };

  const address = typeof factory.location === 'string' ? factory.location : factory.address ?? 'Address unavailable';

  return (
    <View style={styles.container}>
      <View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Manufacturer Details</Text><TouchableOpacity style={styles.editButton} onPress={() => onEdit(factory.id)}><Ionicons name="create-outline" size={20} color="#FFFFFF" /></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content}>
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        <View style={styles.infoCard}>
          <View style={styles.logo}><Ionicons name="business-outline" size={30} color="#208AEF" /></View>
          <Text style={styles.name}>{factory.name}</Text>
          <View style={[styles.status, factory.status === 'active' ? styles.active : styles.inactive]}><Text style={[styles.statusText, factory.status === 'active' ? styles.activeText : styles.inactiveText]}>{factory.status}</Text></View>
          <Text style={styles.description}>{factory.description}</Text>
          <InfoRow icon="person-outline" label="Contact person" value={factory.contactPerson} />
          <InfoRow icon="call-outline" label="Phone" value={factory.phone} />
          <InfoRow icon="location-outline" label="Address" value={address} />
        </View>
        <View style={styles.actions}><TouchableOpacity style={styles.editAction} onPress={() => onEdit(factory.id)}><Ionicons name="create-outline" size={18} color="#208AEF" /><Text style={styles.editActionText}>Edit Manufacturer</Text></TouchableOpacity><TouchableOpacity style={[styles.statusAction, factory.status === 'active' ? styles.deactivateAction : styles.activateAction]} onPress={() => setConfirmStatus(true)}><Ionicons name={factory.status === 'active' ? 'pause-circle-outline' : 'checkmark-circle-outline'} size={18} color={factory.status === 'active' ? '#B45309' : '#16794A'} /><Text style={[styles.statusActionText, factory.status === 'active' ? styles.deactivateText : styles.activateText]}>{factory.status === 'active' ? 'Deactivate' : 'Activate'}</Text></TouchableOpacity></View>
        <View style={styles.productsSection}><View style={styles.productsHeader}><Text style={styles.sectionTitle}>Products</Text><Text style={styles.productCount}>{products.length}</Text></View>{products.length === 0 ? <View style={styles.emptyProducts}><Ionicons name="cube-outline" size={30} color="#94A3B8" /><Text style={styles.emptyTitle}>No products yet</Text><Text style={styles.emptyText}>Products assigned to this manufacturer will appear here.</Text></View> : products.map((product) => <View key={product.id} style={styles.productRow}><View style={styles.productIcon}><Ionicons name="cube-outline" size={20} color="#208AEF" /></View><View style={styles.productInfo}><Text style={styles.productName}>{product.name}</Text><Text style={styles.productMeta}>{product.dosage ?? 'Dosage unspecified'} • {product.stockQuantity} in stock</Text></View><Text style={styles.productPrice}>{product.pharmacyPriceAfterDiscount.toFixed(2)} EGP</Text></View>)}</View>
      </ScrollView>
      <Modal visible={confirmStatus} transparent animationType="fade" onRequestClose={() => setConfirmStatus(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>{factory.status === 'active' ? 'Deactivate manufacturer?' : 'Activate manufacturer?'}</Text><Text style={styles.modalText}>{factory.status === 'active' ? 'The manufacturer will no longer be available to pharmacists. Products and historical orders will be preserved.' : 'The manufacturer and its available products will return to pharmacist marketplace browsing.'}</Text><View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmStatus(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.confirmButton, factory.status === 'active' ? styles.confirmDeactivate : styles.confirmActivate]} onPress={changeStatus}><Text style={styles.confirmText}>Confirm</Text></TouchableOpacity></View></View></View></Modal>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return <View style={styles.infoRow}><Ionicons name={icon} size={18} color="#718096" /><View style={styles.infoText}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View></View>;
}
