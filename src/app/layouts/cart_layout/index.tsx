import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppState } from "../../state/app_state";
import { t } from '../../i18n';
import styles from "./styles";
import AppHeader from "@/app/components/app_header";

export default function CartLayout({
  onCheckout,
  onAddItems,
  onBack,
}: {
  onCheckout?: () => void;
  onAddItems?: () => void;
  onBack?: () => void;
}) {
  const { cart, updateQuantity, removeFromCart, cartTotal, language } = useAppState();
  const [stockMessage, setStockMessage] = useState("");

  const providerGroups = new Map<
    string,
    { name: string; type: "store" | "manufacturer"; items: typeof cart }
  >();
  cart.forEach((item) => {
    const key = `${item.sellerType}-${item.sellerId}`;
    const existing = providerGroups.get(key);
    if (existing) existing.items.push(item);
    else
      providerGroups.set(key, {
        name: item.sellerName,
        type: item.sellerType,
        items: [item],
      });
  });

  if (cart.length === 0) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.header}>
          {onBack ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.title}>{t('cart', language)}</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={44} color="#94A3B8" />
          <Text style={styles.emptyText}>{t('cartEmpty', language)}</Text>
          {onAddItems && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onAddItems}
              style={styles.checkoutButton}
            >
              <Text style={styles.checkoutText}>{t('continueShopping', language)}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.title}>{t('cart', language)}</Text>
      </View>
      {stockMessage ? (
        <View style={styles.stockMessage}>
          <Text style={styles.stockMessageText}>{stockMessage}</Text>
        </View>
      ) : null}
      <FlatList
        data={Array.from(providerGroups.values())}
        keyExtractor={(group) => `${group.type}-${group.items[0].sellerId}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: group }) => {
          const subtotal = group.items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
          );
          return (
            <View style={styles.providerGroup}>
              <View style={styles.providerHeader}>
                <View>
                  <Text style={styles.providerName}>{group.name}</Text>
                  <Text style={styles.providerType}>
                    {t(group.type === "store" ? 'storeLabel' : 'manufacturerLabel', language)}
                  </Text>
                </View>
                <Text style={styles.providerSubtotal}>
                  {subtotal.toFixed(2)} EGP
                </Text>
              </View>

              {group.items.map((item) => {
                const stock = item.product?.stockQuantity ?? 0;
                const consumerPrice =
                  item.consumerPrice ?? item.product?.consumerPrice ?? item.unitPrice;
                return (
                  <View key={item.productId} style={styles.itemCard}>
                    {item.product?.image ? (
                      <Image
                        source={{ uri: item.product.image }}
                        style={styles.itemImage}
                      />
                    ) : (
                      <View style={styles.itemImagePlaceholder}>
                        <Ionicons name="cube-outline" size={24} color="#208AEF" />
                      </View>
                    )}
                    <View style={styles.itemContent}>
                      <View style={styles.itemHeader}>
                        <View style={styles.itemTitleWrap}>
                          <Text style={styles.itemName}>{item.productName}</Text>
                          {item.dosage ? (
                            <Text style={styles.itemDosage}>{item.dosage}</Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          onPress={() => removeFromCart(item.productId)}
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeText}>{t('remove', language)}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.priceRow}>
                        <View>
                          {consumerPrice > item.unitPrice ? (
                            <Text style={styles.originalPrice}>
                              {consumerPrice.toFixed(2)} EGP
                            </Text>
                          ) : null}
                          <Text style={styles.unitPrice}>
                            {item.unitPrice.toFixed(2)} EGP
                          </Text>
                        </View>
                        {item.discountPercentage > 0 ? (
                          <Text style={styles.discountBadge}>
                            -{item.discountPercentage}%
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.itemFooter}>
                        <View style={styles.quantityRow}>
                          <TouchableOpacity
                            disabled={item.quantity <= 1}
                            onPress={() => {
                              setStockMessage("");
                              updateQuantity(item.productId, item.quantity - 1);
                            }}
                            style={[
                              styles.qtyButton,
                              item.quantity <= 1 && styles.qtyButtonDisabled,
                            ]}
                          >
                            <Text style={styles.qtyText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyValue}>{item.quantity}</Text>
                          <TouchableOpacity
                            disabled={item.quantity >= stock}
                            onPress={() => {
                              if (item.quantity >= stock)
                                setStockMessage(
                                  `${t('stockLimitReachedFor', language)} ${item.productName}. ${t('available', language)}: ${stock}`
                                );
                              else {
                                setStockMessage("");
                                updateQuantity(item.productId, item.quantity + 1);
                              }
                            }}
                            style={[
                              styles.qtyButton,
                              item.quantity >= stock && styles.qtyButtonDisabled,
                            ]}
                          >
                            <Text style={styles.qtyText}>+</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.lineTotal}>
                          {(item.unitPrice * item.quantity).toFixed(2)} EGP
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        }}
      />

      <View style={[styles.summaryCard, { paddingBottom: 14 }]}>
        <Text style={styles.summaryLabel}>{t('overallTotal', language)}</Text>
        <Text style={styles.summaryTotal}>{cartTotal.toFixed(2)} EGP</Text>
        {onCheckout && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onCheckout}
            style={styles.checkoutButton}
          >
            <Text style={styles.checkoutText}>{t('checkout', language)}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
