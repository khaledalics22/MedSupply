import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { Store, StoreInput, StoreStatus } from '../../models/data_types';
import { iocContainer } from '../../models/ioc_container';
import styles from './styles';

export default function StoreFormLayout({ storeId, onBack, onSaved }: { storeId?: string; onBack: () => void; onSaved: (message: string) => void }) {
  const [store, setStore] = useState<Store | undefined>(undefined);
  const [name, setName] = useState(store?.name ?? '');
  const [contactPerson, setContactPerson] = useState(store?.contactPerson ?? '');
  const [phone, setPhone] = useState(store?.phone ?? '');
  const [address, setAddress] = useState(store?.address ?? '');
  const [description, setDescription] = useState(store?.description ?? '');
  const [image, setImage] = useState(store?.image ?? '');
  const [status, setStatus] = useState<StoreStatus>(store?.status ?? 'active');
  const [minimumOrderValue, setMinimumOrderValue] = useState(store?.minimumOrderValue?.toFixed(2) ?? '0.00');
  const [error, setError] = useState('');
  const [confirmSave, setConfirmSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) { setLoading(false); return; }

    let active = true;
    iocContainer.getDatabase().getStoreByIdAsync(storeId)
      .then((item) => {
        if (!active) return;
        setStore(item);
        setName(item?.name ?? '');
        setContactPerson(item?.contactPerson ?? '');
        setPhone(item?.phone ?? '');
        setAddress(item?.address ?? '');
        setDescription(item?.description ?? '');
        setImage(item?.image ?? '');
        setStatus(item?.status ?? 'active');
        setMinimumOrderValue(item?.minimumOrderValue?.toFixed(2) ?? '0.00');
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load store.'))
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [storeId]);

  const validate = () => {
    if (!name.trim() || !contactPerson.trim() || !phone.trim() || !address.trim()) return 'Please complete all required fields.';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) return 'Please enter a valid phone number.';
    const minimum = Number(minimumOrderValue);
    if (!minimumOrderValue.trim() || !Number.isFinite(minimum)) return 'Minimum Order Value must be a valid number.';
    if (minimum < 0) return 'Minimum Order Value cannot be negative.';
    return '';
  };

  const save = async () => {
    const validation = validate();
    if (validation) { setError(validation); return; }
    if (saving) return;

    setSaving(true);
    setError('');
    const input: StoreInput = { name, contactPerson, phone, address, description, image, status, minimumOrderValue: Number(minimumOrderValue) };
    try {
      if (store) await iocContainer.getDatabase().updateStoreAsync(store.id, input);
      else await iocContainer.getDatabase().addStoreAsync(input);
      setConfirmSave(false);
      onSaved(store ? 'Store updated successfully.' : 'Store added successfully.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save store.');
      setConfirmSave(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.container}><View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Loading store...</Text></View></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.title}>{store ? 'Edit Store' : 'Add Store'}</Text>
        <View style={styles.headerSpace} />
      </View>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Field label="Store name *" value={name} onChangeText={(value) => { setName(value); setError(''); }} placeholder="Store name" />
        <Field label="Contact person / Owner *" value={contactPerson} onChangeText={(value) => { setContactPerson(value); setError(''); }} placeholder="Full name" />
        <Field label="Phone number *" value={phone} onChangeText={(value) => { setPhone(value); setError(''); }} placeholder="+20 100 000 0000" keyboardType="phone-pad" />
        <Field label="Address *" value={address} onChangeText={(value) => { setAddress(value); setError(''); }} placeholder="Store address" multiline />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Optional description" multiline />
        <Field label="Logo / Image URL" value={image} onChangeText={setImage} placeholder="https://..." />
        <Field label="Minimum Order Value (EGP) *" value={minimumOrderValue} onChangeText={(value) => { setMinimumOrderValue(value); setError(''); }} placeholder="0.00" keyboardType="decimal-pad" />
        <Text style={styles.label}>Status *</Text>
        <View style={styles.statusRow}>
          {(['active', 'inactive'] as StoreStatus[]).map((option) => (
            <TouchableOpacity key={option} style={[styles.statusOption, status === option && styles.statusOptionActive]} onPress={() => setStatus(option)}>
              <Ionicons name={option === 'active' ? 'checkmark-circle' : 'pause-circle'} size={18} color={status === option ? '#208AEF' : '#94A3B8'} />
              <Text style={[styles.statusText, status === option && styles.statusTextActive]}>{option === 'active' ? 'Active' : 'Inactive'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={() => { if (!validate()) setConfirmSave(true); else setError(validate()); }}>
          <Text style={styles.saveText}>{store ? 'Save Changes' : 'Add Store'}</Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal visible={confirmSave} transparent animationType="fade" onRequestClose={() => setConfirmSave(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{store ? 'Save store changes?' : 'Add this store?'}</Text>
            <Text style={styles.modalText}>Please confirm the store information before saving.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmSave(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={save}><Text style={styles.confirmText}>Confirm</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean; keyboardType?: 'phone-pad' | 'decimal-pad' }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} style={[styles.input, multiline && styles.textArea]} multiline={multiline} keyboardType={keyboardType} /></View>;
}
