import { Text, TouchableOpacity, View } from 'react-native';

import { type LanguageCode } from '../../i18n';
import { useAppState } from '../../state/app_state';
import styles from './styles';

export default function CheckoutLayout({
  language,
  onBack,
  onComplete,
}: {
  language: LanguageCode;
  onBack: () => void;
  onComplete: () => void;
}) {
  const { cart, cartTotal, createOrder } = useAppState();

  const handleConfirm = () => {
    if (createOrder()) {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.section}>Order Summary</Text>
        {cart.length === 0 ? (
          <Text style={styles.empty}>Your cart is empty.</Text>
        ) : (
          cart.map((item) => (
            <View key={`${item.offerType}-${item.offerId}`} style={styles.row}>
              <Text style={styles.label}>{item.productName} x {item.quantity}</Text>
              <Text style={styles.value}>{item.quantity * item.unitPrice} EGP</Text>
            </View>
          ))
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{cartTotal} EGP</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.8} onPress={handleConfirm} style={styles.confirmButton}>
        <Text style={styles.confirmText}>Confirm Order</Text>
      </TouchableOpacity>
    </View>
  );
}
