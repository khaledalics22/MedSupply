import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { Factory, ManufacturerInput, ManufacturerStatus } from '../../models/data_types';
import { iocContainer } from '../../models/ioc_container';
import styles from './styles';

export default function ManufacturerFormLayout({ factoryId, onBack, onSaved }: { factoryId?: string; onBack: () => void; onSaved: (message: string) => void }) {
  const [factory, setFactory] = useState<Factory | undefined>(undefined);
  const [loading, setLoading] = useState(Boolean(factoryId));
  const [name, setName] = useState(factory?.name ?? '');
  const [contactPerson, setContactPerson] = useState(factory?.contactPerson ?? '');
  const [phone, setPhone] = useState(factory?.phone ?? '');
  const [address, setAddress] = useState(typeof factory?.location === 'string' ? factory.location : factory?.address ?? '');
  const [description, setDescription] = useState(factory?.description ?? '');
  const [image, setImage] = useState(factory?.image ?? '');
  const [status, setStatus] = useState<ManufacturerStatus>(factory?.status ?? 'active');
  const [error, setError] = useState('');
  const [confirmSave, setConfirmSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [minimumOrderValue, setMinimumOrderValue] = useState(factory?.minimumOrderValue?.toFixed(2) ?? '0.00');

  useEffect(() => {
    if (!factoryId) { setLoading(false); return; }

    let active = true;
    iocContainer.getDatabase().getFactoryByIdAsync(factoryId)
      .then((item) => {
        if (!active) return;
        setFactory(item);
        setName(item?.name ?? '');
        setContactPerson(item?.contactPerson ?? '');
        setPhone(item?.phone ?? '');
        setAddress(typeof item?.location === 'string' ? item.location : item?.address ?? '');
        setDescription(item?.description ?? '');
        setImage(item?.image ?? '');
        setStatus(item?.status ?? 'active');
        setMinimumOrderValue(item?.minimumOrderValue?.toFixed(2) ?? '0.00');
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load manufacturer.'))
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [factoryId]);

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
    const input: ManufacturerInput = { name, contactPerson, phone, address, description, image, status, minimumOrderValue: Number(minimumOrderValue) };
    try {
      if (factory) await iocContainer.getDatabase().updateFactoryAsync(factory.id, input);
      else await iocContainer.getDatabase().addFactoryAsync(input);
      setConfirmSave(false);
      onSaved(factory ? 'Manufacturer updated successfully.' : 'Manufacturer added successfully.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save manufacturer.');
      setConfirmSave(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.container}><View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>Loading manufacturer...</Text></View></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={onBack}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity><Text style={styles.title}>{factory ? 'Edit Manufacturer' : 'Add Manufacturer'}</Text><View style={styles.space} /></View>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Field label="Manufacturer name *" value={name} onChangeText={setName} placeholder="Manufacturer name" />
        <Field label="Contact person *" value={contactPerson} onChangeText={setContactPerson} placeholder="Full name" />
        <Field label="Phone number *" value={phone} onChangeText={setPhone} placeholder="+20 100 000 0000" phone />
        <Field label="Address *" value={address} onChangeText={setAddress} placeholder="Manufacturer address" multiline />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Optional description" multiline />
        <Field label="Logo / Image URL" value={image} onChangeText={setImage} placeholder="https://..." />
        <Field label="Minimum Order Value (EGP) *" value={minimumOrderValue} onChangeText={setMinimumOrderValue} placeholder="0.00" numeric />
        <Text style={styles.label}>Status *</Text>
        <View style={styles.statusRow}>
          {(['active', 'inactive'] as ManufacturerStatus[]).map((option) => (
            <TouchableOpacity key={option} style={[styles.statusOption, status === option && styles.statusOptionActive]} onPress={() => setStatus(option)}>
              <Ionicons name={option === 'active' ? 'checkmark-circle' : 'pause-circle'} size={18} color={status === option ? '#208AEF' : '#94A3B8'} />
              <Text style={[styles.statusText, status === option && styles.statusTextActive]}>{option === 'active' ? 'Active' : 'Inactive'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={() => { const validation = validate(); if (validation) setError(validation); else setConfirmSave(true); }} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Saving...' : factory ? 'Save Changes' : 'Add Manufacturer'}</Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal visible={confirmSave} transparent animationType="fade" onRequestClose={() => setConfirmSave(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>{factory ? 'Save manufacturer changes?' : 'Add this manufacturer?'}</Text><Text style={styles.modalText}>Please confirm the manufacturer information before saving.</Text><View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmSave(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmButton} onPress={save}><Text style={styles.confirmText}>Confirm</Text></TouchableOpacity></View></View></View>
      </Modal>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline, phone, numeric }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean; phone?: boolean; numeric?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} style={[styles.input, multiline && styles.textArea]} multiline={multiline} keyboardType={phone ? 'phone-pad' : numeric ? 'decimal-pad' : 'default'} /></View>;
}
