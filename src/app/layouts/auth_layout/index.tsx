import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuthState } from '../../state/auth_state';
import styles from './styles';

export default function AuthLayout() {
  const { login, register } = useAuthState();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyAddress, setPharmacyAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [forgotVisible, setForgotVisible] = useState(false);

  const resetFeedback = () => { setError(''); setSuccess(''); };

  const validateLogin = () => {
    if (!email.trim() || !password) return 'Please enter your email and password.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email address.';
    return '';
  };

  const submit = async () => {
    resetFeedback();
    const validation = mode === 'login'
      ? validateLogin()
      : (!fullName.trim() || !email.trim() || !phone.trim() || !pharmacyName.trim() || !pharmacyAddress.trim() || !password || !confirmPassword
        ? 'Please complete all required fields.'
        : !/^\S+@\S+\.\S+$/.test(email.trim())
          ? 'Please enter a valid email address.'
          : !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)
            ? 'Password must be at least 8 characters and include a letter and number.'
            : password !== confirmPassword ? 'Passwords do not match.' : '');

    if (validation) { setError(validation); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ fullName, email, phone, password, confirmPassword, pharmacyName, pharmacyAddress });
        setSuccess('Registration submitted successfully. Your account is awaiting Admin approval.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    resetFeedback();
    setMode((current) => current === 'login' ? 'register' : 'login');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <View style={styles.logo}><Ionicons name="medical" size={30} color="#FFFFFF" /></View>
            <View>
              <Text style={styles.brandName}>MedSupply</Text>
              <Text style={styles.brandTagline}>Trusted pharmacy marketplace</Text>
            </View>
          </View>

          <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create pharmacist account'}</Text>
          <Text style={styles.subtitle}>{mode === 'login' ? 'Sign in to continue to MedSupply.' : 'Register to browse products, manage cart items, and place orders.'}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          {mode === 'register' ? (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Full name</Text>
              <View style={styles.inputRow}><TextInput value={fullName} onChangeText={setFullName} placeholder="Ahmed Ali" style={styles.input} autoCapitalize="words" /></View>
            </View>
          ) : null}

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}><TextInput value={email} onChangeText={setEmail} placeholder="name@example.com" style={styles.input} keyboardType="email-address" autoCapitalize="none" /></View>
          </View>

          {mode === 'register' ? (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Phone number</Text>
              <View style={styles.inputRow}><TextInput value={phone} onChangeText={setPhone} placeholder="+20 100 000 0000" style={styles.input} keyboardType="phone-pad" /></View>
            </View>
          ) : null}

          {mode === 'register' ? (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Pharmacy name</Text>
              <View style={styles.inputRow}><TextInput value={pharmacyName} onChangeText={setPharmacyName} placeholder="Al-Ahrar Pharmacy" style={styles.input} autoCapitalize="words" /></View>
            </View>
          ) : null}

          {mode === 'register' ? (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Pharmacy address</Text>
              <View style={styles.inputRow}><TextInput value={pharmacyAddress} onChangeText={setPharmacyAddress} placeholder="123 Main St, Heliopolis" style={styles.input} autoCapitalize="words" /></View>
            </View>
          ) : null}

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <TextInput value={password} onChangeText={setPassword} placeholder="Enter password" style={styles.input} secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity style={styles.iconButton} onPress={() => setShowPassword((current) => !current)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#718096" />
              </TouchableOpacity>
            </View>
          </View>

          {mode === 'register' ? (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.inputRow}><TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat password" style={styles.input} secureTextEntry={!showPassword} autoCapitalize="none" /></View>
            </View>
          ) : (
            <TouchableOpacity style={styles.forgotButton} onPress={() => setForgotVisible(true)}><Text style={styles.forgotText}>Forgot password?</Text></TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={() => void submit()} disabled={loading}>
            <Text style={loading ? styles.loadingText : styles.primaryText}>{loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}</Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{mode === 'login' ? 'New pharmacist? ' : 'Already have an account? '}</Text>
            <TouchableOpacity onPress={switchMode}><Text style={styles.switchLink}>{mode === 'login' ? 'Register' : 'Login'}</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={forgotVisible} transparent animationType="fade" onRequestClose={() => setForgotVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Password recovery</Text>
            <Text style={styles.modalText}>Password recovery will be available when backend authentication is integrated. No email has been sent.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setForgotVisible(false)}><Text style={styles.primaryText}>Got it</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
