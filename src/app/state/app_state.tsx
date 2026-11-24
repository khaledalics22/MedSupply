import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { LanguageCode } from '../i18n';
import { iocContainer } from '../models/ioc_container';
import type { CartItem, Order, OrderLineSnapshot } from '../models/data_types';
import { useAuthState } from './auth_state';

export type NotificationItem = { id: string; title: string; message: string; read: boolean; createdAt: string };

type AppStateContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  cart: CartItem[];
  addToCart: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  cartTotal: number;
  cartCount: number;
  notifications: NotificationItem[];
  unreadNotifications: number;
  markNotificationRead: (id: string) => void;
  orders: Order[];
  createOrder: () => {
    success: boolean;
    issues: Array<{ productId: string; productName: string; currentStock: number; requestedQuantity: number; reason: 'inactive-product' | 'inactive-provider' | 'unavailable' | 'insufficient-stock' }>;
  };
  favoriteStores: string[];
  toggleFavoriteStore: (storeId: string) => void;
  approveOrder: (orderId: string) => { success: boolean; errors: string[] };
  rejectOrder: (orderId: string, reason: string) => boolean;
  reorderOrder: (orderId: string) => {
    added: Array<{ productName: string; quantity: number }>;
    limited: Array<{ productName: string; requested: number; added: number; available: number }>;
    skipped: Array<{ productName: string; reason: string }>;
  };
  favoriteProducts: string[];
  toggleFavoriteProduct: (productId: string) => void;
  isFavoriteProduct: (productId: string) => boolean;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const initialNotifications: NotificationItem[] = [
  { id: 'n-1', title: 'Flash Sale', message: 'Save up to 30% on selected medicines today.', read: false, createdAt: '2h ago' },
  { id: 'n-2', title: 'Order update', message: 'Your delivery from CityCare Pharmacy is on the way.', read: true, createdAt: '1d ago' },
  { id: 'n-3', title: 'New offer', message: 'Wellness Hub added a discount on vitamins.', read: false, createdAt: '2d ago' },
];

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthState();
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [favoriteStores, setFavoriteStores] = useState<string[]>(['store-1']);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([]);
  const approvedOrderIds = useRef(new Set<string>());

  const addToCart = (productId: string, quantity = 1) => {
    const database = iocContainer.getDatabase();

    setCart((previous) => {
      const product = database.getProductById(productId);
      if (!product || !product.isAvailable || product.stockQuantity < quantity) throw new Error('Requested product is unavailable');

      const existing = previous.find((item) => item.productId === productId);
      if (existing) {
        if (existing.quantity + quantity > product.stockQuantity) throw new Error('Requested quantity exceeds available stock');
        return previous.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item);
      }

      return [...previous, database.createCartItem(productId, quantity)];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 0) return;

    setCart((previous) => {
      if (quantity === 0) return previous.filter((item) => item.productId !== productId);

      const product = iocContainer.getDatabase().getProductById(productId);
      if (!product || !product.isAvailable || quantity > product.stockQuantity) throw new Error('Requested quantity exceeds available stock');
      if (product.sellerType === 'store' && iocContainer.getDatabase().getStoreById(product.sellerId)?.status !== 'active') throw new Error('This store is currently inactive');
      if (product.sellerType === 'manufacturer' && iocContainer.getDatabase().getFactoryById(product.sellerId)?.status !== 'active') throw new Error('This manufacturer is currently inactive');

      return previous.map((item) => item.productId === productId ? { ...item, quantity } : item);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((previous) => previous.filter((item) => item.productId !== productId));
  };

  const createOrder = (): {
    success: boolean;
    issues: Array<{ productId: string; productName: string; currentStock: number; requestedQuantity: number; reason: 'inactive-product' | 'inactive-provider' | 'unavailable' | 'insufficient-stock' }>;
  } => {
    if (cart.length === 0) return { success: false, issues: [] };

    const database = iocContainer.getDatabase();
    const issues: Array<{ productId: string; productName: string; currentStock: number; requestedQuantity: number; reason: 'inactive-product' | 'inactive-provider' | 'unavailable' | 'insufficient-stock' }> = [];

    for (const item of cart) {
      const product = database.getProductById(item.productId);
      if (!product) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: 0, requestedQuantity: item.quantity, reason: 'unavailable' });
        continue;
      }
      if (!product.isAvailable || product.stockQuantity <= 0) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'inactive-product' });
        continue;
      }
      if (product.sellerType === 'store' && database.getStoreById(product.sellerId)?.status !== 'active') {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'inactive-provider' });
        continue;
      }
      if (product.sellerType === 'manufacturer' && database.getFactoryById(product.sellerId)?.status !== 'active') {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'inactive-provider' });
        continue;
      }
      if (product.stockQuantity < item.quantity) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'insufficient-stock' });
      }
    }

    if (issues.length > 0) return { success: false, issues };

    try {
      const lines: OrderLineSnapshot[] = cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        dosage: item.dosage,
        packageSize: item.packageSize,
        variant: item.variant,
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        sellerType: item.sellerType,
        unitPrice: item.unitPrice,
        discountPercentage: item.discountPercentage,
        quantity: item.quantity,
        lineTotal: item.unitPrice * item.quantity,
        consumerPrice: item.consumerPrice,
        pharmacyPriceAfterDiscount: item.pharmacyPriceAtPurchase,
      }));

      const order: Order = {
        id: `ORD-${Date.now()}`,
        customerName: user?.fullName,
        pharmacistId: user?.id,
        items: lines,
        totalItems: lines.reduce((sum, line) => sum + line.quantity, 0),
        totalDiscount: 0,
        totalPrice: lines.reduce((sum, line) => sum + line.lineTotal, 0),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setOrders((previous) => [order, ...previous]);
      setCart([]);
      return { success: true, issues: [] };
    } catch {
      return { success: false, issues: [] };
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((previous) => previous.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
  };

  const toggleFavoriteStore = (storeId: string) => {
    setFavoriteStores((previous) => previous.includes(storeId) ? previous.filter((id) => id !== storeId) : [...previous, storeId]);
  };

  const toggleFavoriteProduct = (productId: string) => {
    if (!user?.id) return;
    setFavoriteProducts((previous) => {
      const next = previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId];
      AsyncStorage.setItem(`medsupply.favorites.products.${user.id}`, JSON.stringify(next));
      return next;
    });
  };

  const approveOrder = (orderId: string): { success: boolean; errors: string[] } => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return { success: false, errors: ['Order not found.'] };
    if (approvedOrderIds.current.has(orderId) || order.status !== 'pending') {
      return { success: false, errors: ['This order has already been approved.'] };
    }

    const database = iocContainer.getDatabase();
    const result = database.approveAndDeductOrderStock(order.items);
    if (!result.success) return result;

    approvedOrderIds.current.add(orderId);
    setOrders((previous) => previous.map((item) => item.id === orderId ? { ...item, status: 'approved', approvedAt: new Date().toISOString(), stockDeducted: true } : item));
    return { success: true, errors: [] };
  };

  const rejectOrder = (orderId: string, reason: string): boolean => {
    const reasonText = reason.trim();
    if (!reasonText) return false;
    const order = orders.find((item) => item.id === orderId);
    if (!order || order.status !== 'pending') return false;
    setOrders((previous) => previous.map((item) => item.id === orderId ? { ...item, status: 'rejected', rejectionReason: reasonText, rejectedAt: new Date().toISOString() } : item));
    return true;
  };

  const reorderOrder = (orderId: string): {
    added: Array<{ productName: string; quantity: number }>;
    limited: Array<{ productName: string; requested: number; added: number; available: number }>;
    skipped: Array<{ productName: string; reason: string }>;
  } => {
    const order = orders.find((item) => item.id === orderId);
    const report = { added: [] as Array<{ productName: string; quantity: number }>, limited: [] as Array<{ productName: string; requested: number; added: number; available: number }>, skipped: [] as Array<{ productName: string; reason: string }> };
    if (!order || order.pharmacistId !== user?.id) {
      report.skipped.push({ productName: 'Order', reason: 'Order not found or access is not permitted' });
      return report;
    }

    const database = iocContainer.getDatabase();
    let next = cart.map((item) => ({ ...item }));

    for (const line of order.items) {
      const product = database.getProductById(line.productId);
      if (!product) { report.skipped.push({ productName: line.productName, reason: 'Product no longer exists' }); continue; }
      if (!product.isAvailable) { report.skipped.push({ productName: line.productName, reason: 'Product is inactive or out of stock' }); continue; }
      if (product.sellerType === 'store' && database.getStoreById(product.sellerId)?.status !== 'active') { report.skipped.push({ productName: line.productName, reason: 'Store is inactive' }); continue; }
      if (product.sellerType === 'manufacturer' && database.getFactoryById(product.sellerId)?.status !== 'active') { report.skipped.push({ productName: line.productName, reason: 'Manufacturer is inactive' }); continue; }

      const existing = next.find((item) => item.productId === product.id);
      const existingQuantity = existing?.quantity ?? 0;
      const quantityToAdd = Math.max(0, Math.min(line.quantity, product.stockQuantity - existingQuantity));

      if (quantityToAdd <= 0) { report.limited.push({ productName: line.productName, requested: line.quantity, added: 0, available: product.stockQuantity }); continue; }

      if (existing) next = next.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item);
      else next = [...next, database.createCartItem(product.id, quantityToAdd)];

      if (quantityToAdd < line.quantity) report.limited.push({ productName: line.productName, requested: line.quantity, added: quantityToAdd, available: product.stockQuantity });
      else report.added.push({ productName: line.productName, quantity: quantityToAdd });
    }

    setCart(next);

    return report;
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);
  const unreadNotifications = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const value = useMemo<AppStateContextValue>(() => ({
    language, setLanguage, cart, addToCart, updateQuantity, removeFromCart,
    cartTotal, cartCount, notifications, unreadNotifications, markNotificationRead,
    orders, createOrder, approveOrder, rejectOrder, favoriteStores, toggleFavoriteStore, reorderOrder,
    favoriteProducts, toggleFavoriteProduct, isFavoriteProduct: (productId) => favoriteProducts.includes(productId),
  }), [language, cart, cartCount, cartTotal, notifications, unreadNotifications, orders, favoriteStores, favoriteProducts]);

  useEffect(() => {
    let active = true;
    const key = user?.id ? `medsupply.favorites.products.${user.id}` : null;
    if (!key) { setFavoriteProducts([]); return; }
    AsyncStorage.getItem(key).then((stored) => {
      if (!active) return;
      try { setFavoriteProducts(stored ? JSON.parse(stored) as string[] : []); } catch { setFavoriteProducts([]); }
    });
    return () => { active = false; };
  }, [user?.id]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export default function AppStateModule() { return null; }

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider');
  return context;
}
