import { useState } from 'react';
import { View } from 'react-native';

import NavBar, { Tab } from './components/nav_bar';
import CartLayout from './layouts/cart_layout';
import CategoryDetailLayout from './layouts/category_detail_layout';
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
import { AppStateProvider, useAppState } from './state/app_state';
import { CategoryType, Item, ItemType } from './utils/types';
import styles from './styles/index.styles';

function AppContent() {
  const [tab, setTab] = useState<Tab>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const { language, setLanguage, cartCount, unreadNotifications } = useAppState();

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
      return <CartLayout onAddItems={() => { setShowCart(false); setTab('search'); }} onCheckout={() => { setShowCart(false); setShowCheckout(true); }} />;
    }

    if (selectedProductId) {
      return <ProductDetailLayout productId={selectedProductId} language={language} onBack={() => setSelectedProductId(null)} />;
    }

    if (selectedSpecialtyId) {
      return (
        <CategoryDetailLayout
          categoryType={CategoryType.Cosmetics}
          language={language}
          specialtyId={selectedSpecialtyId}
          onItemSelected={() => {}}
          onProductSelected={(productId) => { setSelectedProductId(productId); setSelectedSpecialtyId(null); }}
          onBack={() => setSelectedSpecialtyId(null)}
        />
      );
    }

    if (selectedItem) {
      if ((selectedItem as any).type === 'store') {
        return <StoreDetailLayout storeId={selectedItem.id} language={language} onBack={() => setSelectedItem(null)} onProductSelected={(productId) => { setSelectedProductId(productId); setSelectedItem(null); }} />;
      }

      if ((selectedItem as any).type === 'factory') {
        return <FactoryDetailLayout factoryId={selectedItem.id} language={language} onBack={() => setSelectedItem(null)} onProductSelected={(productId) => { setSelectedProductId(productId); setSelectedItem(null); }} />;
      }

      if ((selectedItem as any).type === 'specialty') {
        setSelectedSpecialtyId(selectedItem.id);
        setSelectedItem(null);
        return null;
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
      return (
        <CategoryDetailLayout
          categoryType={selectedCategory}
          language={language}
          onItemSelected={(item) => {
            if ((item as any).type === CategoryType.Specialty) setSelectedSpecialtyId(item.id);
            else setSelectedItem(item);
          }}
          onProductSelected={(productId) => { setSelectedProductId(productId); setSelectedItem(null); }}
          onBack={() => { setSelectedCategory(null); setTab('home'); clearSectionState(); }}
        />
      );
    }

    if (tab === 'home') {
      return <Home language={language} cartCount={cartCount} notificationsCount={unreadNotifications} onLanguageChange={setLanguage} onCategorySelected={setSelectedCategory} onCartPress={() => setShowCart(true)} onNotificationsPress={() => setShowNotifications(true)} onSearchPress={() => setTab('search')} />;
    }

    if (tab === 'search') {
      return <Search language={language} notificationsCount={unreadNotifications} categoryType={undefined} onProductSelected={(productId) => setSelectedProductId(productId)} onItemSelected={(item) => setSelectedItem(item)} onCartPress={() => setShowCart(true)} onNotificationsPress={() => setShowNotifications(true)} />;
    }

    if (tab === 'cart') return <CartLayout onAddItems={() => setTab('search')} onCheckout={() => setShowCheckout(true)} />;
    if (tab === 'orders') return <OrdersLayout language={language} onBack={() => setTab('home')} onCartPress={() => setShowCart(true)} />;

    return <ProfileLayout language={language} onBack={() => setTab('home')} onCartPress={() => setShowCart(true)} />;
  };

  const showTabBar = !showCart && !showNotifications && !showCheckout && !selectedProductId && !selectedItem && !selectedSpecialtyId && !selectedCategory;

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>
      {showTabBar && <NavBar active={tab} language={language} onChange={(nextTab) => setTab(nextTab)} />}
    </View>
  );
}

export default function HomeScreen() {
  return <AppStateProvider><AppContent /></AppStateProvider>;
}

