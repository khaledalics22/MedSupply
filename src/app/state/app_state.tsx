import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { LanguageCode } from '../i18n';
import { iocContainer } from '../models/ioc_container';
import type { CartItem, Order, OrderLineSnapshot } from '../models/data_types';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type AppStateContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  cart: CartItem[];
  addToCart: (offerType: 'store' | 'manufacturer', offerId: string, quantity?: number) => void;
  updateQuantity: (offerType: 'store' | 'manufacturer', offerId: string, quantity: number) => void;
  removeFromCart: (offerType: 'store' | 'manufacturer', offerId: string) => void;
  cartTotal: number;
  cartCount: number;
  notifications: NotificationItem[];
  unreadNotifications: number;
  markNotificationRead: (id: string) => void;
  orders: Order[];
  createOrder: () => boolean;
  favoriteStores: string[];
  toggleFavoriteStore: (storeId: string) => void;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const initialNotifications: NotificationItem[] = [
  { id: 'n-1', title: 'Flash Sale', message: 'Save up to 30% on selected medicines today.', read: false, createdAt: '2h ago' },
  { id: 'n-2', title: 'Order update', message: 'Your delivery from CityCare Pharmacy is on the way.', read: true, createdAt: '1d ago' },
  { id: 'n-3', title: 'New offer', message: 'Wellness Hub added a discount on vitamins.', read: false, createdAt: '2d ago' },
];

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [favoriteStores, setFavoriteStores] = useState<string[]>(['store-1']);
  const [orders, setOrders] = useState<Order[]>([]);

  const addToCart = (offerType: 'store' | 'manufacturer', offerId: string, quantity = 1) => {
    const database = iocContainer.getDatabase();

    setCart((previous) => {
      const existing = previous.find((item) => item.offerType === offerType && item.offerId === offerId);

      if (existing) {
        const maxQuantity = offerType === 'store'
          ? database.getStoreOfferById(offerId)?.stockQuantity
          : database.getManufacturerOfferById(offerId)?.stockQuantity;

        if (existing.quantity + quantity > (maxQuantity ?? 0)) {
          throw new Error('Requested quantity exceeds available stock');
        }

        return previous.map((item) =>
          item.offerType === offerType && item.offerId === offerId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      const item = database.createCartItem(offerType, offerId, quantity);
      return [...previous, item];
    });
  };

  const updateQuantity = (offerType: 'store' | 'manufacturer', offerId: string, quantity: number) => {
    if (quantity < 0) return;

    setCart((previous) => {
      if (quantity === 0) {
        return previous.filter((item) => !(item.offerType === offerType && item.offerId === offerId));
      }

      const database = iocContainer.getDatabase();
      const maxQuantity = offerType === 'store'
        ? database.getStoreOfferById(offerId)?.stockQuantity
        : database.getManufacturerOfferById(offerId)?.stockQuantity;

      if (!maxQuantity || quantity > maxQuantity) {
        throw new Error('Requested quantity exceeds available stock');
      }

      return previous.map((item) =>
        item.offerType === offerType && item.offerId === offerId
          ? { ...item, quantity }
          : item,
      );
    });
  };

  const removeFromCart = (offerType: 'store' | 'manufacturer', offerId: string) => {
    setCart((previous) => previous.filter((item) => !(item.offerType === offerType && item.offerId === offerId)));
  };

  const createOrder = (): boolean => {
    if (cart.length === 0) return false;

    const database = iocContainer.getDatabase();

    try {
      for (const item of cart) {
        if (item.offerType === 'store') {
          const offer = database.getStoreOfferById(item.offerId);
          if (!offer || !offer.isAvailable || offer.stockQuantity < item.quantity) return false;
        } else {
          const offer = database.getManufacturerOfferById(item.offerId);
          if (!offer || !offer.isAvailable || offer.stockQuantity < item.quantity) return false;
        }
      }

      for (const item of cart) {
        database.deductOfferStock(item.offerType, item.offerId, item.quantity);
      }

      const grouped = new Map<string, Order>();

      for (const item of cart) {
        const key = `${item.offerType}-${item.sellerId}`;
        const existing = grouped.get(key);
        const line: OrderLineSnapshot = {
          productId: item.productId,
          productName: item.productName,
          dosage: item.dosage,
          packageSize: item.packageSize,
          variant: item.variant,
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          unitPrice: item.unitPrice,
          discountPercentage: item.discountPercentage,
          quantity: item.quantity,
          lineTotal: item.unitPrice * item.quantity,
        };

        if (existing) {
          existing.items.push(line);
          existing.totalItems += item.quantity;
          existing.totalPrice += line.lineTotal;
        } else {
          grouped.set(key, {
            id: `ORD-${Date.now()}-${key}`,
            sellerType: item.offerType,
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            items: [line],
            totalItems: item.quantity,
            totalDiscount: 0,
            totalPrice: line.lineTotal,
            status: 'pending',
            createdAt: new Date().toISOString(),
          });
        }
      }

      setOrders((previous) => [...Array.from(grouped.values()), ...previous]);
      setCart([]);
      return true;
    } catch {
      return false;
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((previous) => previous.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
  };

  const toggleFavoriteStore = (storeId: string) => {
    setFavoriteStores((previous) => previous.includes(storeId) ? previous.filter((id) => id !== storeId) : [...previous, storeId]);
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);
  const unreadNotifications = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const value = useMemo<AppStateContextValue>(() => ({
    language,
    setLanguage,
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    cartTotal,
    cartCount,
    notifications,
    unreadNotifications,
    markNotificationRead,
    orders,
    createOrder,
    favoriteStores,
    toggleFavoriteStore,
  }), [language, cart, cartCount, cartTotal, notifications, unreadNotifications, orders, favoriteStores]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export default function AppStateModule() { return null; }

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider');
  return context;
}
