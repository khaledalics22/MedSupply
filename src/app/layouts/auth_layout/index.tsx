import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';

import { useAppState } from '../../state/app_state';
import { useAuthState } from '../../state/auth_state';
import { t } from '../../i18n';
import styles from './styles';

export default function AuthLayout() {
  const { login, register } = useAuthState();
  const { language, setLanguage } = useAppState();
  const pendingExit = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (!email.trim() || !password) return t('enterEmailPassword', language);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return t('invalidEmail', language);
    return '';
  };

  const submit = async () => {
    resetFeedback();
    const validation = mode === 'login'
      ? validateLogin()
      : (!fullName.trim() || !email.trim() || !phone.trim() || !pharmacyName.trim() || !pharmacyAddress.trim() || !password || !confirmPassword
        ? t('completeRequiredFields', language)
        : !/^\S+@\S+\.\S+$/.test(email.trim())
          ? t('invalidEmail', language)
          : !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)
            ? t('passwordRequirements', language)
            : password !== confirmPassword ? t('passwordsDoNotMatch', language) : '');

    if (validation) { setError(validation); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ fullName, email, phone, password, confirmPassword, pharmacyName, pharmacyAddress });
        setSuccess(t('registrationSubmitted', language));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('authenticationFailed', language));
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

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (mode === 'register') {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        return true;
      }
      if (pendingExit.current) {
        BackHandler.exitApp();
        return true;
      }
      pendingExit.current = true;
      ToastAndroid.show(language === 'ar' ? 'اضغط رجوع مرة أخرى للخروج.' : 'Press back again to exit.', ToastAndroid.SHORT);
      if (exitTimer.current) clearTimeout(exitTimer.current);
      exitTimer.current = setTimeout(() => {
        pendingExit.current = false;
        exitTimer.current = null;
      }, 2000);
      return true;
    });
    return () => {
      subscription.remove();
      if (exitTimer.current) clearTimeout(exitTimer.current);
      pendingExit.current = false;
      exitTimer.current = null;
    };
  }, [mode, language]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <View style={styles.logo}><Ionicons name="medical" size={30} color="#FFFFFF" /></View>
            <View>
              <Text style={styles.brandName}>MedSupply</Text>
              <Text style={styles.brandTagline}>Trusted pharmacy marketplace</Text>
            </View>
          </View>

          <View style={styles.languageRow}>
            {(['en', 'ar'] as const).map((code) => (
              <TouchableOpacity key={code} style={[styles.languageButton, language === code && styles.languageButtonActive]} onPress={() => setLanguage(code)}>
                <Text style={[styles.languageText, language === code && styles.languageTextActive]}>{code === 'en' ? 'English' : 'العربية'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.title}>{mode === 'login' ? t('welcomeBack', language) : t('createAccount', language)}</Text>
          <Text style={styles.subtitle}>{mode === 'login' ? t('loginSubtitle', language) : t('registerSubtitle', language)}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          {mode === 'register' ? (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>{t('fullName', language)}</Text>
              <View style={styles.inputRow}><TextInput value={fullName} onChangeText={setFullName} placeholder="Ahmed Ali" style={styles.input} autoCapitalize="words" /></View>
            </View>
          ) : null}

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>{t('email', language)}</Text>
            <View style={styles.inputRow}><TextInput value={email} onChangeText={setEmail} placeholder="name@example.com" style={styles.input} keyboardType="email-address" autoCapitalize="none" /></View>
          </View>

          {mode === 'register' ? (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>{t('phoneNumber', language)}</Text>
              <View style={styles.inputRow}><TextInput value={phone} onChangeText={setPhone} placeholder="+20 100 000 0000" style={styles.input} keyboardType="phone-pad" /></View>
            </View>
          ) : null}

          {mode === 'register' ? (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>{t('pharmacyName', language)}</Text>
              <View style={styles.inputRow}><TextInput value={pharmacyName} onChangeText={setPharmacyName} placeholder="Al-Ahrar Pharmacy" style={styles.input} autoCapitalize="words" /></View>
            </View>
          ) : null}

          {mode === 'register' ? (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>{t('pharmacyAddress', language)}</Text>
              <View style={styles.inputRow}><TextInput value={pharmacyAddress} onChangeText={setPharmacyAddress} placeholder="123 Main St, Heliopolis" style={styles.input} autoCapitalize="words" /></View>
            </View>
          ) : null}

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>{t('password', language)}</Text>
            <View style={styles.inputRow}>
              <TextInput value={password} onChangeText={setPassword} placeholder={t('password', language)} style={styles.input} secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity style={styles.iconButton} onPress={() => setShowPassword((current) => !current)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#718096" />
              </TouchableOpacity>
            </View>
          </View>

          {mode === 'register' ? (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>{t('confirmPassword', language)}</Text>
              <View style={styles.inputRow}><TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder={t('confirmPassword', language)} style={styles.input} secureTextEntry={!showPassword} autoCapitalize="none" /></View>
            </View>
          ) : (
            <TouchableOpacity style={styles.forgotButton} onPress={() => setForgotVisible(true)}><Text style={styles.forgotText}>{t('forgotPassword', language)}</Text></TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={() => void submit()} disabled={loading}>
            <Text style={loading ? styles.loadingText : styles.primaryText}>{loading ? t('pleaseWait', language) : mode === 'login' ? t('login', language) : t('createAccount', language)}</Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{mode === 'login' ? t('newPharmacist', language) : t('existingAccount', language)}</Text>
            <TouchableOpacity onPress={switchMode}><Text style={styles.switchLink}>{mode === 'login' ? t('register', language) : t('login', language)}</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={forgotVisible} transparent animationType="fade" onRequestClose={() => setForgotVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('forgotPassword', language)}</Text>
            <Text style={styles.modalText}>{t('authenticationFailed', language)}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setForgotVisible(false)}><Text style={styles.primaryText}>{t('yes', language)}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
