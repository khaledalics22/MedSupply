import { useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, Platform, ToastAndroid, View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import NavBar, { Tab } from './components/nav_bar';
import CartLayout from './layouts/cart_layout';
import CheckoutLayout from './layouts/checkout_layout';
import FactoryDetailLayout from './layouts/factory_detail_layout';
import Home from './layouts/home_layout';
import ItemDetailLayout from './layouts/item_detail_layout';
import NotificationsLayout from './layouts/notifications_layout';
import OrdersLayout from './layouts/orders_layout';
import ProductDetailLayout from './layouts/product_detail_layout';
import ProfileLayout from './layouts/profile_layout';
import Search from './layouts/search_layout';
import StoreDetailLayout from './layouts/store_detail_layout';
import BestPricesLayout from './layouts/best_prices_layout';
import SpecialtyLayout from './layouts/specialty_layout';
import SpecialtyDetailLayout from './layouts/specialty_detail_layout';
import ManufacturersLayout from './layouts/manufacturers_layout';
import StoresLayout from './layouts/stores_layout';
import BeautyProductsLayout from './layouts/beauty_products_layout';
import { AppStateProvider, useAppState } from './state/app_state';
import { AuthStateProvider, useAuthState } from './state/auth_state';
import styles from './styles/index.styles';
import AuthLayout from './layouts/auth_layout';
import AdminLayout from './layouts/admin_layout';
import StoreManagementLayout from './layouts/store_management_layout';
import StoreFormLayout from './layouts/store_form_layout';
import AdminStoreDetailLayout from './layouts/admin_store_detail_layout';
import ManufacturerManagementLayout from './layouts/manufacturer_management_layout';
import ManufacturerFormLayout from './layouts/manufacturer_form_layout';
import AdminManufacturerDetailLayout from './layouts/admin_manufacturer_detail_layout';
import { iocContainer } from './models/ioc_container';
import ProductFormLayout from './layouts/product_form_layout';
import { ProducerType, type Product } from './models/data_types';

import { CategoryType, Item, ItemType } from './utils/types';
import AdminOrdersLayout from './layouts/admin_orders_layout';
import AdminOrderDetailLayout from './layouts/admin_order_detail_layout';
import AdminProductOverviewLayout from './layouts/admin_product_overview_layout';
import PharmacistManagementLayout from './layouts/pharmacist_management_layout';
import PharmacistDetailLayout from './layouts/pharmacist_detail_layout';
import FavoritesLayout from './layouts/favorites_layout';

function useDoubleBackToExit(resetKey: string) {
  const pendingExit = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => {
    pendingExit.current = false;
    if (exitTimer.current) clearTimeout(exitTimer.current);
    exitTimer.current = null;
  };

  useEffect(() => {
    reset();
  }, [resetKey]);

  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
  }, []);

  const handle = () => {
    if (Platform.OS !== 'android') return false;
    if (pendingExit.current) {
      BackHandler.exitApp();
      return true;
    }

    pendingExit.current = true;
    ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
    exitTimer.current = setTimeout(reset, 2000);
    return true;
  };

  return handle;
}

function AppContent() {
  const [tab, setTab] = useState<Tab>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [showFavorites, setShowFavorites] = useState(false);
  const [cartOrigin, setCartOrigin] = useState<Tab>('home');
  const [tabBarHeight, setTabBarHeight] = useState(62);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const lastScrollY = useRef(0);
  const { language, setLanguage, cartCount, unreadNotifications } = useAppState();

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const clearSectionState = () => {
    setSelectedItem(null);
    setSelectedSpecialtyId(null);
    setSelectedProductId(null);
    setShowCart(false);
    setShowNotifications(false);
    setShowCheckout(false);
  };

  const renderContent = () => {
    if (showNotifications) return <NotificationsLayout language={language} onBack={() => setShowNotifications(false)} />;

    if (showCheckout) {
      return <CheckoutLayout language={language} onBack={() => setShowCheckout(false)} onComplete={() => { setShowCheckout(false); setTab('home'); }} />;
    }

    if (showCart) {
      return <CartLayout onBack={() => setShowCart(false)} onAddItems={() => { setShowCart(false); setTab('search'); }} onCheckout={() => { setShowCart(false); setShowCheckout(true); }} />;
    }

    if (selectedProductId) {
      return <ProductDetailLayout productId={selectedProductId} language={language} onBack={() => setSelectedProductId(null)} />;
    }

    if (selectedSpecialtyId) {
      return <SpecialtyDetailLayout specialtyId={selectedSpecialtyId} language={language} onBack={() => setSelectedSpecialtyId(null)} onProductSelected={setSelectedProductId} />;
    }

    if (selectedItem) {
      if ((selectedItem as any).type === 'store') {
        return <StoreDetailLayout storeId={selectedItem.id} language={language} onBack={() => setSelectedItem(null)} onProductSelected={(productId) => { setSelectedProductId(productId); setSelectedItem(null); }} />;
      }

      if ((selectedItem as any).type === 'factory') {
        return <FactoryDetailLayout factoryId={selectedItem.id} language={language} onBack={() => setSelectedItem(null)} onProductSelected={(productId) => { setSelectedProductId(productId); setSelectedItem(null); }} />;
      }

      if ((selectedItem as any).type === ItemType.Store) {
        return <StoreDetailLayout storeId={selectedItem.id} language={language} onBack={() => setSelectedItem(null)} onProductSelected={(productId) => setSelectedProductId(productId)} />;
      }

      if ((selectedItem as any).type === ItemType.Factory) {
        return <FactoryDetailLayout factoryId={selectedItem.id} language={language} onBack={() => setSelectedItem(null)} onProductSelected={(productId) => setSelectedProductId(productId)} />;
      }

      return <ItemDetailLayout item={selectedItem} language={language} onBack={() => setSelectedItem(null)} />;
    }

    if (selectedCategory) {
      const closeCategory = () => { setSelectedCategory(null); setTab('home'); clearSectionState(); };

      if (selectedCategory === CategoryType.BestPrices) {
        return <BestPricesLayout language={language} onBack={closeCategory} onProductSelected={setSelectedProductId} />;
      }

      if (selectedCategory === CategoryType.Specialty) {
        return <SpecialtyLayout language={language} onBack={closeCategory} onSpecialtySelected={setSelectedSpecialtyId} />;
      }

      if (selectedCategory === CategoryType.Manufacturers) {
        return <ManufacturersLayout language={language} onBack={closeCategory} onManufacturerSelected={(manufacturerId) => setSelectedItem({ id: manufacturerId, type: 'factory' } as any)} />;
      }

      if (selectedCategory === CategoryType.Stores) {
        return <StoresLayout language={language} onBack={closeCategory} onStoreSelected={(storeId) => setSelectedItem({ id: storeId, type: 'store' } as any)} />;
      }

      if (selectedCategory === CategoryType.Cosmetics) {
        return <BeautyProductsLayout language={language} onBack={closeCategory} onProductSelected={setSelectedProductId} />;
      }
    }

    if (tab === 'home') {
      return <Home language={language} notificationsCount={unreadNotifications} onLanguageChange={setLanguage} onCategorySelected={setSelectedCategory} onNotificationsPress={() => setShowNotifications(true)} onSearchPress={() => setTab('search')} />;
    }

    if (tab === 'search') {
      return <Search language={language} notificationsCount={unreadNotifications} categoryType={undefined} onProductSelected={(productId) => setSelectedProductId(productId)} onItemSelected={(item) => setSelectedItem(item)} onNotificationsPress={() => setShowNotifications(true)} />;

    }

    if (tab === 'orders') return <OrdersLayout language={language} onBack={() => setTab('home')} />;

    const showProfile = tab === 'profile' && !showCart && !showCheckout && !showNotifications && !selectedProductId && !selectedItem && !selectedSpecialtyId && !selectedCategory;

    return showProfile ? <ProfileLayout language={language} onBack={() => setTab('home')} onFavorites={() => setShowFavorites(true)} /> : null;
  };

  const showTabBar = !showCart && !showNotifications && !showCheckout && !showFavorites && !selectedProductId && !selectedItem && !selectedSpecialtyId && !selectedCategory;
  const showGlobalCart = tab !== 'profile' && !showFavorites && !showCart && !showCheckout && !showNotifications;
  const handleDoubleBack = useDoubleBackToExit(`${tab}:${showCart}:${showCheckout}:${showNotifications}:${showFavorites}:${selectedCategory}:${selectedItem?.id}:${selectedSpecialtyId}:${selectedProductId}`);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (keyboardVisible) {
        Keyboard.dismiss();
        return true;
      }
      if (showCheckout) {
        setShowCheckout(false);
        setShowCart(true);
        return true;
      }
      if (showCart) {
        setShowCart(false);
        setTab(cartOrigin);
        return true;
      }
      if (showNotifications) { setShowNotifications(false); return true; }
      if (showFavorites) { setShowFavorites(false); return true; }
      if (selectedProductId) { setSelectedProductId(null); return true; }
      if (selectedSpecialtyId) { setSelectedSpecialtyId(null); return true; }
      if (selectedItem) { setSelectedItem(null); return true; }
      if (selectedCategory) { setSelectedCategory(null); setTab('home'); return true; }
      if (tab !== 'home') { setTab('home'); return true; }

      return handleDoubleBack();
    });

    return () => subscription.remove();
  }, [keyboardVisible, tab, cartOrigin, showCart, showCheckout, showNotifications, showFavorites, selectedCategory, selectedItem, selectedSpecialtyId, selectedProductId, handleDoubleBack]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>
      {showTabBar && <NavBar active={tab} language={language} onChange={(nextTab) => setTab(nextTab)} onLayoutHeight={setTabBarHeight} />}
      {showGlobalCart && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => { setCartOrigin(tab); setShowCart(true); }}
          accessibilityLabel={`Cart, ${cartCount} items`}
          style={{ position: 'absolute', right: 18, bottom: showTabBar ? tabBarHeight + 12 : insets.bottom + 18, width: 52, height: 52, borderRadius: 26, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center', zIndex: 20, elevation: 8, shadowColor: '#102A43', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
        >
          <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
          {cartCount > 0 && <View style={{ position: 'absolute', top: -3, right: -3, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#FF5A5F', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}><Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>{cartCount}</Text></View>}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  return (
    <AuthStateProvider>
      <AppStateProvider>
        <RoleBasedApp />
      </AppStateProvider>
    </AuthStateProvider>
  );
}

function RoleBasedApp() {
  const { user, isRestoring } = useAuthState();

  if (isRestoring) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F8FF' }}>
          <View />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) return <AuthLayout />;
  if (user.role === 'admin') return <AdminApp />;

  return <AppContent />;
}

function AdminApp() {
  const [screen, setScreen] = useState<'dashboard' | 'store-list' | 'store-form' | 'store-detail' | 'manufacturer-list' | 'manufacturer-form' | 'manufacturer-detail' | 'provider-product-form' | 'admin-orders' | 'admin-order-detail' | 'product-overview' | 'pharmacist-list' | 'pharmacist-detail'>('dashboard');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [editingStoreId, setEditingStoreId] = useState<string | undefined>(undefined);
  const [selectedFactoryId, setSelectedFactoryId] = useState<string | null>(null);
  const [editingFactoryId, setEditingFactoryId] = useState<string | undefined>(undefined);
  const [storeFeedback, setStoreFeedback] = useState('');
  const [manufacturerFeedback, setManufacturerFeedback] = useState('');
  const [providerProduct, setProviderProduct] = useState<Product | undefined>(undefined);
  const [providerType, setProviderType] = useState<'store' | 'manufacturer'>('store');
  const [providerId, setProviderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [productOverviewStockFilter, setProductOverviewStockFilter] = useState<'all' | 'available' | 'low-stock' | 'out-of-stock'>('all');
  const [adminOrdersInitialStatus, setAdminOrdersInitialStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [selectedPharmacistId, setSelectedPharmacistId] = useState<string | null>(null);
  const [pharmacistInitialStatus, setPharmacistInitialStatus] = useState<'all' | 'pending' | 'active' | 'rejected' | 'inactive'>('all');
  const [storeListRefresh, setStoreListRefresh] = useState(0);
  const [manufacturerListRefresh, setManufacturerListRefresh] = useState(0);

  const openStoreForm = (storeId?: string) => { setEditingStoreId(storeId); setScreen('store-form'); };
  const openManufacturerForm = (factoryId?: string) => { setEditingFactoryId(factoryId); setScreen('manufacturer-form'); };

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'dashboard') return true;
      if (screen === 'store-list') { setScreen('dashboard'); return true; }
      if (screen === 'store-detail') { setScreen('store-list'); return true; }
      if (screen === 'store-form') { setScreen(editingStoreId ? 'store-detail' : 'store-list'); return true; }
      if (screen === 'manufacturer-list') { setScreen('dashboard'); return true; }
      if (screen === 'manufacturer-detail') { setScreen('manufacturer-list'); return true; }
      if (screen === 'manufacturer-form') { setScreen(editingFactoryId ? 'manufacturer-detail' : 'manufacturer-list'); return true; }
      if (screen === 'provider-product-form') { setScreen(providerType === 'store' ? 'store-detail' : 'manufacturer-detail'); return true; }
      if (screen === 'admin-orders') { setScreen('dashboard'); return true; }
      if (screen === 'admin-order-detail') { setScreen('admin-orders'); return true; }
      if (screen === 'product-overview') { setScreen('dashboard'); return true; }
      if (screen === 'pharmacist-list') { setScreen('dashboard'); return true; }
      if (screen === 'pharmacist-detail') { setScreen('pharmacist-list'); return true; }
      return true;
    });

    return () => subscription.remove();
  }, [screen, editingStoreId, editingFactoryId, providerType]);

  if (screen === 'store-list') {
    return <StoreManagementLayout refreshToken={storeListRefresh} onBack={() => setScreen('dashboard')} onAddStore={() => openStoreForm()} onStoreSelected={(storeId) => { setSelectedStoreId(storeId); setScreen('store-detail'); }} feedback={storeFeedback} />;
  }
  if (screen === 'store-detail' && selectedStoreId) {
    return <AdminStoreDetailLayout
      storeId={selectedStoreId}
      onBack={() => setScreen('store-list')}
      onEdit={(storeId) => openStoreForm(storeId)}
      onAddProduct={() => { setProviderType('store'); setProviderId(selectedStoreId); setProviderProduct(undefined); setScreen('provider-product-form'); }}
      onEditProduct={(product) => { setProviderType('store'); setProviderId(selectedStoreId); setProviderProduct(product); setScreen('provider-product-form'); }}
    />;
  }
  if (screen === 'store-form') {
    return <StoreFormLayout
      storeId={editingStoreId}
      onBack={() => setScreen(editingStoreId ? 'store-detail' : 'store-list')}
      onSaved={(message) => { setStoreFeedback(message); setStoreListRefresh((value) => value + 1); setEditingStoreId(undefined); setScreen('store-list'); }}
    />;
  }

  if (screen === 'manufacturer-list') {
    return <ManufacturerManagementLayout refreshToken={manufacturerListRefresh} onBack={() => setScreen('dashboard')} onAdd={() => openManufacturerForm()} onSelected={(factoryId) => { setSelectedFactoryId(factoryId); setScreen('manufacturer-detail'); }} feedback={manufacturerFeedback} />;
  }
  if (screen === 'manufacturer-detail' && selectedFactoryId) {
    return <AdminManufacturerDetailLayout
      factoryId={selectedFactoryId}
      onBack={() => setScreen('manufacturer-list')}
      onEdit={(factoryId) => openManufacturerForm(factoryId)}
      onAddProduct={() => { setProviderType('manufacturer'); setProviderId(selectedFactoryId); setProviderProduct(undefined); setScreen('provider-product-form'); }}
      onEditProduct={(product) => { setProviderType('manufacturer'); setProviderId(selectedFactoryId); setProviderProduct(product); setScreen('provider-product-form'); }}
    />;
  }
  if (screen === 'manufacturer-form') {
    return <ManufacturerFormLayout
      factoryId={editingFactoryId}
      onBack={() => setScreen(editingFactoryId ? 'manufacturer-detail' : 'manufacturer-list')}
      onSaved={(message) => { setManufacturerFeedback(message); setManufacturerListRefresh((value) => value + 1); setEditingFactoryId(undefined); setScreen('manufacturer-list'); }}
    />;
  }

  if (screen === 'provider-product-form' && providerId) {
    return <ProductFormLayout
      providerType={providerType === 'store' ? ProducerType.Store : ProducerType.Manufacturer}
      providerId={providerId}
      product={providerProduct}
      onBack={() => setScreen(providerType === 'store' ? 'store-detail' : 'manufacturer-detail')}
      onSaved={() => setScreen(providerType === 'store' ? 'store-detail' : 'manufacturer-detail')}
    />;
  }

  if (screen === 'admin-orders') {
    return <AdminOrdersLayout initialStatus={adminOrdersInitialStatus} onBack={() => setScreen('dashboard')} onOrderSelected={(orderId) => { setSelectedOrderId(orderId); setScreen('admin-order-detail'); }} />;
  }
  if (screen === 'admin-order-detail' && selectedOrderId) {
    return <AdminOrderDetailLayout orderId={selectedOrderId} onBack={() => setScreen('admin-orders')} />;
  }

  if (screen === 'product-overview') {
    return <AdminProductOverviewLayout
      onBack={() => setScreen('dashboard')}
      initialStockFilter={productOverviewStockFilter}
      onProductSelected={(product) => {
        if (product.sellerType === 'store') { setSelectedStoreId(product.sellerId); setScreen('store-detail'); }
        else { setSelectedFactoryId(product.sellerId); setScreen('manufacturer-detail'); }
      }}
    />;
  }

  if (screen === 'pharmacist-list') {
    return <PharmacistManagementLayout initialStatus={pharmacistInitialStatus} onBack={() => setScreen('dashboard')} onSelected={(pharmacistId) => { setSelectedPharmacistId(pharmacistId); setScreen('pharmacist-detail'); }} />;
  }
  if (screen === 'pharmacist-detail' && selectedPharmacistId) {
    return <PharmacistDetailLayout pharmacistId={selectedPharmacistId} onBack={() => setScreen('pharmacist-list')} />;
  }

  return <AdminLayout
    onStoreManagement={() => setScreen('store-list')}
    onAddStore={() => openStoreForm()}
    onManufacturerManagement={() => setScreen('manufacturer-list')}
    onAddManufacturer={() => openManufacturerForm()}
    onManageOrders={(status) => { setAdminOrdersInitialStatus(status ?? 'all'); setScreen('admin-orders'); }}
    onProductOverview={() => { setProductOverviewStockFilter('all'); setScreen('product-overview'); }}
    onLowStockOverview={() => { setProductOverviewStockFilter('low-stock'); setScreen('product-overview'); }}
    onPharmacists={(status) => { setPharmacistInitialStatus(status ?? 'all'); setScreen('pharmacist-list'); }}
  />;
}

