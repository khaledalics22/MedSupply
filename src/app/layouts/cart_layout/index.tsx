import { Ionicons } from "@expo/vector-icons";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

import { useAppState } from "../../state/app_state";
import styles from "./styles";
import AppHeader from "@/app/components/app_header";

export default function CartLayout({
  onCheckout,
  onAddItems,
}: {
  onCheckout?: () => void;
  onAddItems?: () => void;
}) {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useAppState();

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader title="Checkout List" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          {onAddItems && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onAddItems}
              style={styles.checkoutButton}
            >
              <Text style={styles.checkoutText}>Add Items</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Checkout Your List" />
      <FlatList
        data={cart}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemMeta}>
              <TouchableOpacity
                onPress={() => removeFromCart(item.productId)}
                style={styles.removeButton}
              >
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemStore}>{item.sellerName}</Text>
            </View>

            <View style={styles.itemRow}>
              <Text style={styles.unitPrice}>{item.unitPrice} EGP</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                  style={styles.qtyButton}
                >
                  <Text style={styles.qtyText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= (item.product?.stockQuantity ?? 0)}
                  style={styles.qtyButton}
                >
                  <Text style={styles.qtyText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total</Text>
        <Text style={styles.summaryTotal}>{cartTotal} EGP</Text>
        {onCheckout && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onCheckout}
            style={styles.checkoutButton}
          >
            <Text style={styles.checkoutText}>Checkout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
