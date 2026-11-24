import { useRef, useState } from 'react';
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
  const { cart, cartTotal, createOrder, orders } = useAppState();
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [issues, setIssues] = useState<Array<{ productName: string; currentStock: number; requestedQuantity: number; reason: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const providerGroups = new Map<string, { name: string; type: 'store' | 'manufacturer'; items: typeof cart }>();
  cart.forEach((item) => {
    const key = `${item.sellerType}-${item.sellerId}`;
    const existing = providerGroups.get(key);
    if (existing) existing.items.push(item);
    else providerGroups.set(key, { name: item.sellerName, type: item.sellerType, items: [item] });
  });

  const handleConfirm = () => {
    if (submittingRef.current || cart.length === 0) return;
    submittingRef.current = true;
    setSubmitting(true);

    const result = createOrder();
    if (result.success) {
      setOrderConfirmed(true);
      setIssues([]);
      submittingRef.current = false;
      onComplete();
    } else {
      setIssues(result.issues);
      submittingRef.current = false;
    }
    setSubmitting(false);
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
          Array.from(providerGroups.values()).map((group) => {
            const subtotal = group.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
            return (
              <View key={`${group.type}-${group.items[0].sellerId}`} style={styles.providerGroup}>
                <View style={styles.providerHeader}>
                  <View><Text style={styles.providerName}>{group.name}</Text><Text style={styles.providerType}>{group.type === 'store' ? 'Store' : 'Manufacturer'}</Text></View>
                  <Text style={styles.providerSubtotal}>{subtotal.toFixed(2)} EGP</Text>
                </View>
                {group.items.map((item) => (
                  <View key={item.productId} style={styles.row}>
                    <View style={styles.checkoutItemInfo}>
                      <Text style={styles.label}>{item.productName}</Text>
                      {item.dosage ? <Text style={styles.checkoutDosage}>Dosage: {item.dosage}</Text> : null}
                      <Text style={styles.checkoutMeta}>Qty {item.quantity} × {item.unitPrice.toFixed(2)} EGP • -{item.discountPercentage}%</Text>
                    </View>
                    <Text style={styles.value}>{(item.unitPrice * item.quantity).toFixed(2)} EGP</Text>
                  </View>
                ))}
              </View>
            );
          })
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{cartTotal.toFixed(2)} EGP</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.8} disabled={submitting || cart.length === 0} onPress={handleConfirm} style={[styles.confirmButton, (submitting || cart.length === 0) && styles.confirmButtonDisabled]}>
        <Text style={styles.confirmText}>{submitting ? 'Placing order...' : 'Place Order'}</Text>
      </TouchableOpacity>

      {orderConfirmed && (
        <View style={styles.confirmationMessage}>
          <Text style={styles.confirmationText}>Thank you! Your order has been confirmed. Order ID: {orders[0]?.id}</Text>
        </View>
      )}
    </View>
  );
}
