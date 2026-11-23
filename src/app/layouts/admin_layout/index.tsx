import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { iocContainer } from '../../models/ioc_container';
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

export default function AdminLayout({ onStoreManagement, onAddStore, onManufacturerManagement, onAddManufacturer }: { onStoreManagement: () => void; onAddStore: () => void; onManufacturerManagement: () => void; onAddManufacturer: () => void }) {
  const { user, logout } = useAuthState();
  const { orders } = useAppState();
  const database = iocContainer.getDatabase();

  const totalStores = database.getStores().length;
  const totalManufacturers = database.getFactories().length;
  const totalProducts = database.getProducts().length;
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
          <SummaryCard label="Total Stores" count={totalStores} icon="storefront-outline" color="#208AEF" backgroundColor="#EAF4FF" />
          <SummaryCard label="Manufacturers" count={totalManufacturers} icon="business-outline" color="#7C3AED" backgroundColor="#F3E8FF" />
          <SummaryCard label="Total Products" count={totalProducts} icon="cube-outline" color="#0F9F6E" backgroundColor="#DCFCE7" />
          <SummaryCard label="Pending Orders" count={pendingOrders.length} icon="time-outline" color="#E67E22" backgroundColor="#FEF3C7" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                disabled={action.label !== 'Add Store' && action.label !== 'Add Manufacturer'}
                activeOpacity={0.8}
                onPress={action.label === 'Add Store' ? onAddStore : action.label === 'Add Manufacturer' ? onAddManufacturer : undefined}>
                <View style={styles.actionIcon}><Ionicons name={action.icon} size={22} color="#208AEF" /></View>
                <Text style={styles.actionText}>{action.label}</Text>
                <Text style={styles.actionStatus}>{action.label === 'Add Store' || action.label === 'Add Manufacturer' ? 'Open management' : 'Coming soon'}</Text>
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
