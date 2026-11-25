import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { Product, ProductInput, ProducerType } from '../../models/data_types';
import { iocContainer } from '../../models/ioc_container';
import { calculatePharmacistPrice, normalizeProductDosage, normalizeProductName } from '../../models/database';
import styles from './styles';

export default function ProductFormLayout({ providerType, providerId, product, onBack, onSaved }: { providerType: ProducerType; providerId: string; product?: Product; onBack: () => void; onSaved: (message: string) => void }) {
  const database = iocContainer.getDatabase();
  const specialties = database.getSpecialties();
  const [name, setName] = useState(product?.name ?? '');
  const [dosage, setDosage] = useState(product?.dosage ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [specialtyId, setSpecialtyId] = useState(product?.specialtyId ?? specialties[0]?.id ?? 'general');
  const [consumerPrice, setConsumerPrice] = useState(product ? String(product.consumerPrice) : '');
  const [discount, setDiscount] = useState(product ? String(product.discountPercentage) : '0');
  const [stock, setStock] = useState(product ? String(product.stockQuantity) : '');
  const [image, setImage] = useState(product?.image ?? '');
  const [expiryDate, setExpiryDate] = useState(product?.expiryDate ?? '');
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [providerProducts, setProviderProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    const load = providerType === 'store'
      ? iocContainer.getDatabase().getProductsByStoreAsync(providerId)
      : iocContainer.getDatabase().getProductsByManufacturerAsync(providerId);
    load.then((items) => { if (active) setProviderProducts(items); })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load provider products.'));
    return () => { active = false; };
  }, [providerType, providerId]);

  const price = calculatePharmacistPrice(Number(consumerPrice) || 0, Number(discount) || 0);
  const suggestions = useMemo(() => {
    const query = normalizeProductName(name);
    if (!query) return [];
    return providerProducts.filter((item) => normalizeProductName(item.name).includes(query) || query.includes(normalizeProductName(item.name))).slice(0, 6);
  }, [name, providerProducts]);

  const validate = () => {
    if (!name.trim() || !dosage.trim() || !stock.trim() || !consumerPrice.trim()) return 'Please complete all required fields.';
    const consumer = Number(consumerPrice);
    const discountValue = Number(discount);
    const stockValue = Number(stock);
    if (!Number.isFinite(consumer) || consumer <= 0) return 'Consumer price must be greater than zero.';
    if (!Number.isFinite(discountValue) || discountValue < 0 || discountValue > 100) return 'Discount must be between 0% and 100%.';
    if (!Number.isInteger(stockValue) || stockValue < 0) return 'Stock quantity must be a whole number of zero or more.';
    return '';
  };

  const save = async () => {
    const validation = validate();
    if (validation) { setError(validation); return; }
    if (saving) return;

    const input: ProductInput = {
      name,
      dosage,
      description,
      specialtyId,
      consumerPrice: Number(consumerPrice),
      discountPercentage: Number(discount),
      stockQuantity: Number(stock),
      image,
      expiryDate,
      isAvailable,
    };
    setSaving(true);
    setError('');
    try {
      if (product) {
        await iocContainer.getDatabase().updateProviderProductAsync(product.id, input);
      } else {
        const created = await iocContainer.getDatabase().addProviderProductAsync(providerType, providerId, input);
        console.log('[MedSupply][ProductForm] product created', {
          selectedProviderId: providerId,
          providerType,
          returnedProductId: created.id,
          returnedProductName: created.name,
        });
      }
      setConfirm(false);
      onSaved(product ? 'Product updated successfully.' : 'Product added successfully.');
    } catch (caught) {
      setConfirm(false);
      setError(caught instanceof Error ? caught.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>{product ? 'Edit Product' : 'Add Product'}</Text><View style={styles.space} /></View>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Field label="Product name *" value={name} onChangeText={(value) => { setName(value); setError(''); }} placeholder="e.g. Panadol" />
        {suggestions.length > 0 ? <View style={styles.suggestions}><Text style={styles.suggestionTitle}>Similar existing products</Text>{suggestions.map((item) => { const exact = normalizeProductName(item.name) === normalizeProductName(name) && normalizeProductDosage(item.dosage ?? '') === normalizeProductDosage(dosage); return <View key={item.id} style={styles.suggestionRow}><Text style={styles.suggestionName}>{item.name}</Text><Text style={[styles.suggestionMeta, exact && styles.exactMeta]}>{item.dosage ?? 'No dosage'}{exact ? ' • Exact duplicate' : ''}</Text></View>; })}</View> : null}
        <Field label="Dosage *" value={dosage} onChangeText={(value) => { setDosage(value); setError(''); }} placeholder="e.g. 500 mg" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Optional description" multiline />
        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{specialties.map((item) => <TouchableOpacity key={item.id} style={[styles.category, specialtyId === item.id && styles.categoryActive]} onPress={() => setSpecialtyId(item.id)}><Text style={[styles.categoryText, specialtyId === item.id && styles.categoryTextActive]}>{item.name}</Text></TouchableOpacity>)}</ScrollView>
        <View style={styles.priceRow}><Field label="Consumer price *" value={consumerPrice} onChangeText={setConsumerPrice} placeholder="100" numeric />
          <Field label="Discount % *" value={discount} onChangeText={setDiscount} placeholder="20" numeric /></View>
        <View style={styles.calculated}><Text style={styles.calculatedLabel}>Pharmacist price</Text><Text style={styles.calculatedValue}>{price.toFixed(2)} EGP</Text></View>
        <Field label="Stock quantity *" value={stock} onChangeText={setStock} placeholder="0" numeric />
        <Field label="Product image URL" value={image} onChangeText={setImage} placeholder="https://..." />
        <Field label="Expiry date" value={expiryDate} onChangeText={setExpiryDate} placeholder="YYYY-MM-DD" />
        <Text style={styles.label}>Availability *</Text>
        <View style={styles.statusRow}>{([true, false] as boolean[]).map((option) => <TouchableOpacity key={String(option)} style={[styles.statusOption, isAvailable === option && styles.statusOptionActive]} onPress={() => setIsAvailable(option)}><Ionicons name={option ? 'checkmark-circle' : 'pause-circle'} size={18} color={isAvailable === option ? '#208AEF' : '#94A3B8'} /><Text style={[styles.statusText, isAvailable === option && styles.statusTextActive]}>{option ? 'Active' : 'Inactive'}</Text></TouchableOpacity>)}</View>
        <TouchableOpacity style={styles.saveButton} onPress={() => { const validation = validate(); if (validation) setError(validation); else setConfirm(true); }} disabled={saving}><Text style={styles.saveText}>{saving ? 'Saving...' : product ? 'Save Changes' : 'Add Product'}</Text></TouchableOpacity>
      </ScrollView>
      <Modal visible={confirm} transparent animationType="fade" onRequestClose={() => setConfirm(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>{product ? 'Save product changes?' : 'Add this product?'}</Text><Text style={styles.modalText}>Please confirm the provider-specific product details.</Text><View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setConfirm(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmButton} onPress={save}><Text style={styles.confirmText}>Confirm</Text></TouchableOpacity></View></View></View></Modal>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline, numeric }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean; numeric?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} style={[styles.input, multiline && styles.textArea]} multiline={multiline} keyboardType={numeric ? 'decimal-pad' : 'default'} /></View>;
}
