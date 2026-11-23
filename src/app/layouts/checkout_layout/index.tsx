import { useState } from 'react';
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
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [issues, setIssues] = useState<Array<{ productName: string; currentStock: number; requestedQuantity: number; reason: string }>>([]);

  const handleConfirm = () => {
    const result = createOrder();
    if (result.success) {
      setOrderConfirmed(true);
      setIssues([]);
      onComplete();
    } else {
      setIssues(result.issues);
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

      {issues.length > 0 ? (
        <View style={styles.issuesBox}>
          <Text style={styles.issuesTitle}>Please review your cart</Text>
          {issues.map((issue) => (
            <Text key={`${issue.productName}-${issue.reason}`} style={styles.issueText}>
              • {issue.productName}: {issue.reason === 'insufficient-stock' ? `requested ${issue.requestedQuantity}, available ${issue.currentStock}` : issue.reason === 'inactive-provider' ? 'provider is inactive' : issue.reason === 'inactive-product' ? 'product is unavailable or out of stock' : 'product is unavailable'}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.summaryCard}>
        <Text style={styles.section}>Order Summary</Text>
        {cart.length === 0 ? (
          <Text style={styles.empty}>Your cart is empty.</Text>
        ) : (
          cart.map((item) => (
            <View key={item.productId} style={styles.row}>
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

      {orderConfirmed && (
        <View style={styles.confirmationMessage}>
          <Text style={styles.confirmationText}>Thank you! Your order has been confirmed.</Text>
        </View>
      )}
    </View>
  );
}
