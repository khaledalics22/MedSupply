import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { iocContainer } from '../../models/ioc_container';
import { getStockStatus } from '../../models/database';
import { useAppState } from '../../state/app_state';
import { useAuthState } from '../../state/auth_state';
import styles from './styles';

type SummaryCardProps = {
  label: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
};

function SummaryCard({ label, count, icon, color, backgroundColor }: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor }]}>
        <Ionicons name={icon} size={21} color={color} />
      </View>
      <Text style={styles.summaryCount}>{count}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function AdminLayout({ onStoreManagement, onAddStore, onManufacturerManagement, onAddManufacturer, onManageOrders, onProductOverview, onLowStockOverview }: {
  onStoreManagement: () => void;
  onAddStore: () => void;
  onManufacturerManagement: () => void;
  onAddManufacturer: () => void;
  onManageOrders: (status?: 'pending' | 'approved' | 'rejected' | 'completed') => void;
  onProductOverview: () => void;
  onLowStockOverview: () => void;
}) {
  const { user, logout } = useAuthState();
  const { orders } = useAppState();
  const database = iocContainer.getDatabase();

  const stores = database.getStores();
  const manufacturers = database.getFactories();
  const products = database.getProducts();
  const activeStores = stores.filter((store) => store.status === 'active').length;
  const activeManufacturers = manufacturers.filter((manufacturer) => manufacturer.status === 'active').length;
  const activeProducts = products.filter((product) => product.isAvailable && product.stockQuantity > 0).length;
  const lowStockProducts = products.filter((product) => getStockStatus(product.stockQuantity, product.isAvailable) === 'low-stock').length;
  const outOfStockProducts = products.filter((product) => getStockStatus(product.stockQuantity, product.isAvailable) === 'out-of-stock').length;
  const pendingOrderCount = orders.filter((order) => order.status === 'pending').length;
  const approvedOrderCount = orders.filter((order) => order.status === 'approved').length;
  const rejectedOrderCount = orders.filter((order) => order.status === 'rejected').length;
  const completedOrderCount = orders.filter((order) => order.status === 'completed').length;

  const pendingOrders = orders.filter((order) => order.status === 'pending');
  const pendingPreview = [...pendingOrders]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 3);

  const formatDate = (date: string) => {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const actions: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Add Store', icon: 'storefront-outline' },
    { label: 'Add Manufacturer', icon: 'business-outline' },
    { label: 'Add Product', icon: 'cube-outline' },
    { label: 'Manage Orders', icon: 'receipt-outline' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandMark}><Ionicons name="shield-checkmark" size={24} color="#FFFFFF" /></View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>{user?.fullName}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => void logout()}
          accessibilityLabel="Logout"
          accessibilityRole="button">
          <Ionicons name="log-out-outline" size={21} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryGrid}>
          <TouchableOpacity style={styles.summaryCardWrapper} onPress={onStoreManagement} activeOpacity={0.8}><SummaryCard label="Total Stores" count={stores.length} icon="storefront-outline" color="#208AEF" backgroundColor="#EAF4FF" /></TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardWrapper} onPress={onStoreManagement} activeOpacity={0.8}><SummaryCard label="Active Stores" count={activeStores} icon="checkmark-circle-outline" color="#16794A" backgroundColor="#DCFCE7" /></TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardWrapper} onPress={onManufacturerManagement} activeOpacity={0.8}><SummaryCard label="Total Manufacturers" count={manufacturers.length} icon="business-outline" color="#7C3AED" backgroundColor="#F3E8FF" /></TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardWrapper} onPress={onManufacturerManagement} activeOpacity={0.8}><SummaryCard label="Active Manufacturers" count={activeManufacturers} icon="checkmark-circle-outline" color="#16794A" backgroundColor="#DCFCE7" /></TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardWrapper} onPress={onProductOverview} activeOpacity={0.8}><SummaryCard label="Product Listings" count={products.length} icon="cube-outline" color="#0F9F6E" backgroundColor="#DCFCE7" /></TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardWrapper} onPress={onProductOverview} activeOpacity={0.8}><SummaryCard label="Active Products" count={activeProducts} icon="checkmark-done-outline" color="#16794A" backgroundColor="#DCFCE7" /></TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardWrapper} onPress={onLowStockOverview} activeOpacity={0.8}><SummaryCard label="Low Stock" count={lowStockProducts} icon="warning-outline" color="#D97706" backgroundColor="#FEF3C7" /></TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardWrapper} onPress={onProductOverview} activeOpacity={0.8}><SummaryCard label="Out of Stock" count={outOfStockProducts} icon="close-circle-outline" color="#BE123C" backgroundColor="#FFE4E6" /></TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardWrapper} onPress={() => onManageOrders('pending')} activeOpacity={0.8}><SummaryCard label="Pending Orders" count={pendingOrderCount} icon="time-outline" color="#D97706" backgroundColor="#FEF3C7" /></TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardWrapper} onPress={() => onManageOrders('approved')} activeOpacity={0.8}><SummaryCard label="Approved Orders" count={approvedOrderCount} icon="checkmark-circle-outline" color="#16794A" backgroundColor="#DCFCE7" /></TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardWrapper} onPress={() => onManageOrders('rejected')} activeOpacity={0.8}><SummaryCard label="Rejected Orders" count={rejectedOrderCount} icon="close-circle-outline" color="#BE123C" backgroundColor="#FFE4E6" /></TouchableOpacity>
          <TouchableOpacity style={styles.summaryCardWrapper} onPress={() => onManageOrders('completed')} activeOpacity={0.8}><SummaryCard label="Completed Orders" count={completedOrderCount} icon="checkmark-done-outline" color="#4338CA" backgroundColor="#E0E7FF" /></TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                disabled={action.label !== 'Add Store' && action.label !== 'Add Manufacturer' && action.label !== 'Manage Orders'}
                activeOpacity={0.8}
                onPress={action.label === 'Add Store' ? onAddStore : action.label === 'Add Manufacturer' ? onAddManufacturer : action.label === 'Manage Orders' ? () => onManageOrders() : undefined}>
                <View style={styles.actionIcon}><Ionicons name={action.icon} size={22} color="#208AEF" /></View>
                <Text style={styles.actionText}>{action.label}</Text>
                <Text style={styles.actionStatus}>{action.label === 'Add Store' || action.label === 'Add Manufacturer' || action.label === 'Manage Orders' ? 'Open management' : 'Coming soon'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Orders</Text>
            {pendingOrders.length > 0 ? <Text style={styles.previewCount}>{pendingOrders.length} awaiting review</Text> : null}
          </View>

          {pendingPreview.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}><Ionicons name="checkmark-done-outline" size={26} color="#208AEF" /></View>
              <Text style={styles.emptyTitle}>No pending orders</Text>
              <Text style={styles.emptyText}>New pharmacist orders will appear here.</Text>
            </View>
          ) : (
            <View>
              {pendingPreview.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId} numberOfLines={1}>{order.id}</Text>
                    <Text style={styles.orderStatus}>Pending</Text>
                  </View>
                  <Text style={styles.customerName}>Pharmacist • {order.customerName ?? order.sellerName}</Text>
                  <View style={styles.orderFooter}>
                    <View>
                      <Text style={styles.orderMeta}>{formatDate(order.createdAt)}</Text>
                      <Text style={styles.orderMeta}>{order.totalItems} item(s)</Text>
                    </View>
                    <Text style={styles.orderTotal}>{order.totalPrice.toFixed(2)} EGP</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.viewAllButton} disabled activeOpacity={1}>
                <Text style={styles.viewAllText}>View All</Text>
                <Text style={styles.viewAllStatus}>Coming soon</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
