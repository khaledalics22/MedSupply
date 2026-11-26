import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { type LanguageCode } from "../../i18n";
import { iocContainer } from "../../models/ioc_container";
import { useAppState } from "../../state/app_state";
import { useAuthState } from "../../state/auth_state";
import styles from "./styles";

export default function ProfileLayout({
  language,
  onBack,
  onFavorites,
}: {
  language: LanguageCode;
  onBack: () => void;
  onFavorites: () => void;
}) {
  const { favoriteStores } = useAppState();
  const { user, logout, updateProfile, changePassword } = useAuthState();
  const database = iocContainer.getDatabase();
  const [favoriteStoreItems, setFavoriteStoreItems] = useState<import('../../models/data_types').Store[]>([]);
  const [favoriteStoresLoading, setFavoriteStoresLoading] = useState(true);
  const [favoriteStoresError, setFavoriteStoresError] = useState('');

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture ?? "");
  const [pharmacyName, setPharmacyName] = useState(user?.pharmacyName ?? "");
  const [pharmacyAddress, setPharmacyAddress] = useState(user?.pharmacyAddress ?? "");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setProfilePicture(user?.profilePicture ?? "");
    setPharmacyName(user?.pharmacyName ?? "");
    setPharmacyAddress(user?.pharmacyAddress ?? "");
  }, [user]);

  useEffect(() => {
    let active = true;
    const loadFavorites = async () => {
      setFavoriteStoresLoading(true);
      setFavoriteStoresError('');
      try {
        const stores = await Promise.all(favoriteStores.map((storeId) => database.getStoreByIdAsync(storeId)));
        if (active) setFavoriteStoreItems(stores.filter((store): store is import('../../models/data_types').Store => Boolean(store)));
      } catch (caught) {
        if (active) setFavoriteStoresError(caught instanceof Error ? caught.message : 'Unable to load favorite stores.');
      } finally {
        if (active) setFavoriteStoresLoading(false);
      }
    };
    void loadFavorites();
    return () => { active = false; };
  }, [database, favoriteStores]);

  const cancelEdit = () => {
    setFullName(user?.fullName ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setProfilePicture(user?.profilePicture ?? "");
    setPharmacyName(user?.pharmacyName ?? "");
    setPharmacyAddress(user?.pharmacyAddress ?? "");
    setError("");
    setEditing(false);
  };

  const saveProfile = async () => {
    setError("");
    setFeedback("");
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !pharmacyName.trim() ||
      !pharmacyAddress.trim()
    ) {
      setError("Please complete all required profile fields.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        fullName,
        email,
        phone,
        profilePicture,
        pharmacyName,
        pharmacyAddress,
      });
      setEditing(false);
      setFeedback("Profile updated successfully.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const submitPassword = async () => {
    setError("");
    setPasswordLoading(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      setPasswordVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFeedback("Password changed successfully.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons
            name={profilePicture ? "person" : "person-outline"}
            size={34}
            color="#208AEF"
          />
        </View>
        <View style={styles.profileHeaderText}>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        {!editing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setError("");
              setFeedback("");
              setEditing(true);
            }}
          >
            <Ionicons name="create-outline" size={18} color="#208AEF" />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {feedback ? <Text style={styles.success}>{feedback}</Text> : null}

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Field
            label="Full name *"
            value={fullName}
            onChangeText={setFullName}
            editable={editing}
          />
          <Field
            label="Email address *"
            value={email}
            onChangeText={setEmail}
            editable={editing}
            email
          />
          <Field
            label="Phone number *"
            value={phone}
            onChangeText={setPhone}
            editable={editing}
            phone
          />
          <Field
            label="Profile picture URL"
            value={profilePicture}
            onChangeText={setProfilePicture}
            editable={editing}
          />
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Pharmacy Information</Text>
          <Field
            label="Pharmacy name *"
            value={pharmacyName}
            onChangeText={setPharmacyName}
            editable={editing}
          />
          <Field
            label="Pharmacy address *"
            value={pharmacyAddress}
            onChangeText={setPharmacyAddress}
            editable={editing}
            multiline
          />
        </View>

        {editing ? (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelEdit}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => void saveProfile()}
              disabled={saving}
            >
              <Text style={styles.saveText}>
                {saving ? "Saving..." : "Save changes"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              setError("");
              setPasswordVisible(true);
            }}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="key-outline" size={20} color="#208AEF" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Change password</Text>
              <Text style={styles.settingMeta}>Update your account password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={onFavorites}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="heart-outline" size={20} color="#208AEF" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Favorites</Text>
              <Text style={styles.settingMeta}>View your saved provider products</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Favorite Stores</Text>
          {favoriteStoresLoading ? (
            <Text style={styles.empty}>Loading favorite stores...</Text>
          ) : favoriteStoreItems.length === 0 ? (
            <Text style={styles.empty}>No favorites yet.</Text>
          ) : (
            <FlatList
              data={favoriteStoreItems}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.favoriteRow}>
                  <Text style={styles.favoriteName}>{item.name}</Text>
                  <Text style={styles.favoriteMeta}>
                    {item.address ?? "Local store"}
                  </Text>
                </View>
              )}
            />
          )}
          {favoriteStoresError ? (
            <Text style={styles.error}>{favoriteStoresError}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={logout}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={19} color="#BE123C" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={passwordVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change password</Text>
            <Field
              label="Current password *"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              editable
              password
            />
            <Field
              label="New password *"
              value={newPassword}
              onChangeText={setNewPassword}
              editable
              password
            />
            <Field
              label="Confirm new password *"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable
              password
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setPasswordVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => void submitPassword()}
                disabled={passwordLoading}
              >
                <Text style={styles.saveText}>
                  {passwordLoading ? "Saving..." : "Change password"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  editable,
  email,
  phone,
  password,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
  email?: boolean;
  phone?: boolean;
  password?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={password}
        multiline={multiline}
        keyboardType={
          email ? "email-address" : phone ? "phone-pad" : "default"
        }
        style={[
          styles.input,
          editable && styles.inputEditable,
          multiline && styles.textArea,
        ]}
        autoCapitalize={email ? "none" : "sentences"}
      />
    </View>
  );
}
