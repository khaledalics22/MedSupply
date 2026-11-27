import { useRef, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { t, type LanguageCode } from '../../i18n';
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
  const { cart, cartMutating, cartTotal, createOrder, orders, refreshCartPricing } = useAppState();
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [changesReviewed, setChangesReviewed] = useState(false);
  const [issues, setIssues] = useState<Array<{ productId: string; productName: string; currentStock: number; requestedQuantity: number; reason: string; oldConsumerPrice?: number; currentConsumerPrice?: number; oldPharmacistPrice?: number; currentPharmacistPrice?: number; oldDiscount?: number; currentDiscount?: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const providerGroups = new Map<string, { name: string; type: 'store' | 'manufacturer'; items: typeof cart }>();
  cart.forEach((item) => {
    const key = `${item.sellerType}-${item.sellerId}`;
    const existing = providerGroups.get(key);
    if (existing) existing.items.push(item);
    else providerGroups.set(key, { name: item.sellerName, type: item.sellerType, items: [item] });
  });

  const handleReview = async () => {
    if (cartMutating || submittingRef.current || cart.length === 0) return;
    try {
      const changeIssues = await refreshCartPricing();
      setChangesReviewed(changeIssues.length === 0);
      setIssues(changeIssues);
      if (changeIssues.length === 0) setConfirmVisible(true);
    } catch (caught) {
      setIssues([{ productId: '', productName: 'Cart', requestedQuantity: cart.length, currentStock: 0, reason: 'unavailable' }]);
    }
  };

  const handleConfirm = async () => {
    if (cartMutating || submittingRef.current || cart.length === 0) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const result = await createOrder();
      if (result.success) {
        setOrderConfirmed(true);
        setCreatedOrderId(result.orderId ?? null);
        setConfirmVisible(false);
        setIssues([]);
      } else {
        setIssues(result.issues);
      }
    } catch (caught) {
      setIssues([{ productId: '', productName: 'Cart', requestedQuantity: cart.length, currentStock: 0, reason: 'unavailable' }]);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('checkout', language)}</Text>
      </View>

      {issues.length > 0 ? (
        <View style={styles.issuesBox}>
          <Text style={styles.issuesTitle}>{t('reviewCart', language)}</Text>
          {issues.map((issue) => (
            <Text key={`${issue.productName}-${issue.reason}`} style={styles.issueText}>
              • {issue.productName}: {issue.reason === 'insufficient-stock' ? `requested ${issue.requestedQuantity}, available ${issue.currentStock}` : issue.reason === 'inactive-provider' ? 'provider is inactive' : issue.reason === 'inactive-product' ? 'product is unavailable or out of stock' : issue.reason === 'price-change' ? `consumer price changed from ${issue.oldConsumerPrice?.toFixed(2)} to ${issue.currentConsumerPrice?.toFixed(2)} EGP; pharmacist price changed from ${issue.oldPharmacistPrice?.toFixed(2)} to ${issue.currentPharmacistPrice?.toFixed(2)} EGP` : issue.reason === 'discount-change' ? `discount changed from ${issue.oldDiscount}% to ${issue.currentDiscount}%` : 'product is unavailable'}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.summaryCard}>
        <Text style={styles.section}>{t('orderSummary', language)}</Text>
        {cart.length === 0 ? (
          <Text style={styles.empty}>{t('emptyCart', language)}</Text>
        ) : (
          Array.from(providerGroups.values()).map((group) => {
            const subtotal = group.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
            return (
              <View key={`${group.type}-${group.items[0].sellerId}`} style={styles.providerGroup}>
                <View style={styles.providerHeader}>
                  <View><Text style={styles.providerName}>{group.name}</Text><Text style={styles.providerType}>{group.type === 'store' ? t('store', language) : t('manufacturer', language)}</Text></View>
                  <Text style={styles.providerSubtotal}>{subtotal.toFixed(2)} EGP</Text>
                </View>
                {group.items.map((item) => (
                  <View key={item.productId} style={styles.row}>
                    <View style={styles.checkoutItemInfo}>
                      <Text style={styles.label}>{item.productName}</Text>
                      {item.dosage ? <Text style={styles.checkoutDosage}>{t('dosage', language)}: {item.dosage}</Text> : null}
                      <Text style={styles.checkoutMeta}>{t('quantity', language)} {item.quantity} × {item.unitPrice.toFixed(2)} EGP • -{item.discountPercentage}%</Text>
                    </View>
                    <Text style={styles.value}>{(item.unitPrice * item.quantity).toFixed(2)} EGP</Text>
                  </View>
                ))}
              </View>
            );
          })
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('total', language)}</Text>
          <Text style={styles.totalValue}>{cartTotal.toFixed(2)} EGP</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.8} disabled={submitting || cartMutating || cart.length === 0 || orderConfirmed} onPress={handleReview} style={[styles.confirmButton, (submitting || cartMutating || cart.length === 0 || orderConfirmed) && styles.confirmButtonDisabled]}>
        <Text style={styles.confirmText}>{submitting ? t('placingOrder', language) : orderConfirmed ? t('orderPlaced', language) : t('placeOrder', language)}</Text>
      </TouchableOpacity>

      {orderConfirmed ? (
        <View style={styles.confirmationMessage}>
          <Text style={styles.confirmationText}>{t('thankYou', language)}</Text>
          <Text style={styles.confirmationText}>{t('orderId', language)}: {createdOrderId}</Text>
        </View>
      ) : null}

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('placeOrder', language)}</Text>
            <Text style={styles.modalText}>{t('placeOrderModalInfo', language)}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmVisible(false)}><Text style={styles.cancelText}>{t('cancel', language)}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmButtonModal} onPress={handleConfirm} disabled={submitting || cartMutating}><Text style={styles.confirmText}>{submitting ? 'Placing...' : 'Confirm & Place Order'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
