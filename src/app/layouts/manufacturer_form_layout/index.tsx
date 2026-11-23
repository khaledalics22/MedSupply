import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { Factory, ManufacturerInput, ManufacturerStatus } from '../../models/data_types';
import { iocContainer } from '../../models/ioc_container';
import styles from './styles';

export default function ManufacturerFormLayout({ factory, onBack, onSaved }: { factory?: Factory; onBack: () => void; onSaved: (message: string) => void }) {
  const database = iocContainer.getDatabase();
  const [name, setName] = useState(factory?.name ?? '');
  const [contactPerson, setContactPerson] = useState(factory?.contactPerson ?? '');
  const [phone, setPhone] = useState(factory?.phone ?? '');
  const [address, setAddress] = useState(typeof factory?.location === 'string' ? factory.location : factory?.address ?? '');
  const [description, setDescription] = useState(factory?.description ?? '');
  const [image, setImage] = useState(factory?.image ?? '');
  const [status, setStatus] = useState<ManufacturerStatus>(factory?.status ?? 'active');
  const [error, setError] = useState('');
  const [confirmSave, setConfirmSave] = useState(false);

  const validate = () => {
    if (!name.trim() || !contactPerson.trim() || !phone.trim() || !address.trim()) return 'Please complete all required fields.';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) return 'Please enter a valid phone number.';
    return '';
  };

  const save = () => {
    const validation = validate();
    if (validation) { setError(validation); return; }
    const input: ManufacturerInput = { name, contactPerson, phone, address, description, image, status };
    if (factory) database.updateFactory(factory.id, input);
    else database.addFactory(input);
    setConfirmSave(false);
    onSaved(factory ? 'Manufacturer updated successfully.' : 'Manufacturer added successfully.');
  };

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
        <Text style={styles.label}>Status *</Text>
        <View style={styles.statusRow}>
          {(['active', 'inactive'] as ManufacturerStatus[]).map((option) => (
            <TouchableOpacity key={option} style={[styles.statusOption, status === option && styles.statusOptionActive]} onPress={() => setStatus(option)}>
              <Ionicons name={option === 'active' ? 'checkmark-circle' : 'pause-circle'} size={18} color={status === option ? '#208AEF' : '#94A3B8'} />
              <Text style={[styles.statusText, status === option && styles.statusTextActive]}>{option === 'active' ? 'Active' : 'Inactive'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={() => { const validation = validate(); if (validation) setError(validation); else setConfirmSave(true); }}><Text style={styles.saveText}>{factory ? 'Save Changes' : 'Add Manufacturer'}</Text></TouchableOpacity>
      </ScrollView>
      <Modal visible={confirmSave} transparent animationType="fade" onRequestClose={() => setConfirmSave(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>{factory ? 'Save manufacturer changes?' : 'Add this manufacturer?'}</Text><Text style={styles.modalText}>Please confirm the manufacturer information before saving.</Text><View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmSave(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmButton} onPress={save}><Text style={styles.confirmText}>Confirm</Text></TouchableOpacity></View></View></View>
      </Modal>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline, phone }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean; phone?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} style={[styles.input, multiline && styles.textArea]} multiline={multiline} keyboardType={phone ? 'phone-pad' : 'default'} /></View>;
}
