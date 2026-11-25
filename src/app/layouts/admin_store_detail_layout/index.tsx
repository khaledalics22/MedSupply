import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { iocContainer } from '../../models/ioc_container';
import { getStockStatus } from '../../models/database';
import type { Product } from '../../models/data_types';
import styles from './styles';

export default function AdminStoreDetailLayout({ storeId, onBack, onEdit, onAddProduct, onEditProduct }: { storeId: string; onBack: () => void; onEdit: (storeId: string) => void; onAddProduct: () => void; onEditProduct: (product: Product) => void }) {
  const database = iocContainer.getDatabase();
  const [, refresh] = useState(0);
  const [store, setStore] = useState<import('../../models/data_types').Store | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'available' | 'low-stock' | 'out-of-stock'>('all');

  useEffect(() => {
    let active = true;
    iocContainer.getDatabase().getStoreByIdAsync(storeId)
      .then((item) => { if (active) setStore(item); })
      .catch((caught) => setFeedback(caught instanceof Error ? caught.message : 'Unable to load store'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [storeId, refresh]);

  useEffect(() => {
    let active = true;
    const database = iocContainer.getDatabase();
    console.log('[MedSupply][AdminStoreDetail] mounted', { providerId: storeId, productQueryProviderId: storeId, databaseImplementation: database.constructor?.name });
    database.getProductsByStoreAsync(storeId)
      .then((items) => {
        if (!active) return;
        console.log('[MedSupply][AdminStoreDetail] Supabase products returned', {
          providerId: storeId,
          count: items.length,
          products: items.map((item) => ({ id: item.id, name: item.name, providerId: item.sellerId, sellerType: item.sellerType })),
        });
        setProducts(items);
      })
      .catch((caught) => {
        const code = caught && typeof caught === 'object' && 'code' in caught ? String((caught as { code?: unknown }).code ?? '') : '';
        console.warn('[MedSupply][AdminStoreDetail] Supabase product query failed', {
          providerId: storeId,
          code,
          message: caught instanceof Error ? caught.message : String(caught),
          databaseImplementation: database.constructor?.name,
        });
        setFeedback(caught instanceof Error ? caught.message : 'Unable to load products');
      });
    return () => { active = false; };
  }, [storeId, refresh]);

  if (loading) {
    return <View style={styles.container}><View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Loading store...</Text></View></View>;
  }

  if (!store) {
    return <View style={styles.container}><View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Store not found</Text></View></View>;
  }

  const changeStatus = async () => {
    if (!store) return;
    const nextStatus = store.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await iocContainer.getDatabase().setStoreStatusAsync(store.id, nextStatus);
      setStore(updated);
      setConfirmStatus(false);
      setFeedback(`Store ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
      refresh((value) => value + 1);
    } catch (caught) {
      setConfirmStatus(false);
      setFeedback(caught instanceof Error ? caught.message : 'Unable to update store status.');
    }
  };

  const confirmDeleteProduct = (productId: string) => {
    setDeleteProductId(productId);
  };

  const cancelDeleteProduct = () => {
    setDeleteProductId(null);
  };

  const deleteProduct = async () => {
    if (!deleteProductId || deletingProduct) return;
    setDeletingProduct(true);
    try {
      await iocContainer.getDatabase().softDeleteProviderProductAsync(deleteProductId);
      setProducts((items) => items.filter((item) => item.id !== deleteProductId));
      setDeleteProductId(null);
      setFeedback('Product deleted successfully.');
      refresh((value) => value + 1);
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : 'Unable to delete product.');
      setDeleteProductId(null);
    } finally {
      setDeletingProduct(false);
    }
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
          <View style={styles.productsHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
            <TouchableOpacity style={styles.addProductButton} onPress={onAddProduct}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.addProductText}>Add Product</Text></TouchableOpacity>
          </View>
          <View style={styles.productSearch}><Ionicons name="search" size={18} color="#718096" /><TextInput value={productQuery} onChangeText={setProductQuery} placeholder="Search products by name" style={styles.productSearchInput} /></View>
          <View style={styles.productFilters}>
            {(['all', 'active', 'inactive'] as const).map((filter) => (
              <TouchableOpacity key={filter} style={[styles.productFilter, statusFilter === filter && styles.productFilterActive]} onPress={() => setStatusFilter(filter)}>
                <Text style={[styles.productFilterText, statusFilter === filter && styles.productFilterTextActive]}>{filter}</Text>
              </TouchableOpacity>
            ))}
            {(['all', 'available', 'low-stock', 'out-of-stock'] as const).map((filter) => (
              <TouchableOpacity key={filter} style={[styles.productFilter, stockStatusFilter === filter && styles.productFilterActive]} onPress={() => setStockStatusFilter(filter)}>
                <Text style={[styles.productFilterText, stockStatusFilter === filter && styles.productFilterTextActive]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {products.filter((product) => 
            (!productQuery.trim() || product.name.toLowerCase().includes(productQuery.trim().toLowerCase())) && 
            (statusFilter === 'all' || (statusFilter === 'active' ? product.isAvailable : !product.isAvailable)) &&
            (stockStatusFilter === 'all' || (stockStatusFilter === 'available' ? product.stockQuantity > 5 : stockStatusFilter === 'low-stock' ? product.stockQuantity > 0 && product.stockQuantity <= 5 : product.stockQuantity === 0))
          ).length === 0 ? (
            <View style={styles.emptyProducts}><Ionicons name="cube-outline" size={30} color="#94A3B8" /><Text style={styles.emptyTitle}>No matching products</Text><Text style={styles.emptyText}>Try a different search or status filter.</Text></View>
          ) : products.filter((product) => 
            (!productQuery.trim() || product.name.toLowerCase().includes(productQuery.trim().toLowerCase())) && 
            (statusFilter === 'all' || (statusFilter === 'active' ? product.isAvailable : !product.isAvailable)) &&
            (stockStatusFilter === 'all' || (stockStatusFilter === 'available' ? product.stockQuantity > 5 : stockStatusFilter === 'low-stock' ? product.stockQuantity > 0 && product.stockQuantity <= 5 : product.stockQuantity === 0))
          ).map((product) => (
            <View key={product.id} style={styles.productRow}>
              <TouchableOpacity style={styles.productIcon} onPress={() => onEditProduct(product)}><Ionicons name="cube-outline" size={20} color="#208AEF" /></TouchableOpacity>
              <TouchableOpacity style={styles.productInfo} onPress={() => onEditProduct(product)}><Text style={styles.productName}>{product.name}</Text><Text style={styles.productMeta}>{product.dosage ?? 'Dosage unspecified'} • {product.stockQuantity} in stock • {getStockStatus(product.stockQuantity, product.isAvailable).replace('-', ' ')}</Text><Text style={styles.productMeta}>Consumer {product.consumerPrice.toFixed(2)} • Discount {product.discountPercentage}%</Text></TouchableOpacity>
              <View style={styles.productActions}><Text style={styles.productPrice}>{product.pharmacyPriceAfterDiscount.toFixed(2)} EGP</Text><TouchableOpacity onPress={async () => { try { await iocContainer.getDatabase().setProviderProductStatusAsync(product.id, !product.isAvailable); setFeedback(`Product ${product.isAvailable ? 'deactivated' : 'activated'} successfully.`); refresh((value) => value + 1); } catch (caught) { setFeedback(caught instanceof Error ? caught.message : 'Unable to update product status.'); } }}><Text style={styles.toggleText}>{product.isAvailable ? 'Deactivate' : 'Activate'}</Text></TouchableOpacity><TouchableOpacity onPress={() => setDeleteProductId(product.id)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity></View>
            </View>
          ))}
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

      <Modal visible={deleteProductId !== null} transparent animationType="fade" onRequestClose={() => setDeleteProductId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete product?</Text>
            <Text style={styles.modalText}>This product will be removed from normal management and pharmacist listings. Historical orders will remain unchanged.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDeleteProductId(null)} disabled={deletingProduct}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={deleteProduct} disabled={deletingProduct}><Text style={styles.confirmText}>{deletingProduct ? 'Deleting...' : 'Delete'}</Text></TouchableOpacity>
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
