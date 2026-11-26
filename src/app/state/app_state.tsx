import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { LanguageCode } from '../i18n';
import { iocContainer } from '../models/ioc_container';
import type { CartItem, CheckoutValidationIssue, Order, OrderLineSnapshot } from '../models/data_types';
import { useAuthState } from './auth_state';

export type NotificationItem = { id: string; title: string; message: string; read: boolean; createdAt: string };

type AppStateContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  cart: CartItem[];
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => void;
  refreshCartPricing: () => Promise<CheckoutValidationIssue[]>;
  cartTotal: number;
  cartCount: number;
  notifications: NotificationItem[];
  unreadNotifications: number;
  markNotificationRead: (id: string) => void;
  orders: Order[];
  createOrder: () => Promise<{ success: boolean; issues: CheckoutValidationIssue[]; orderId?: string }>;
  favoriteStores: string[];
  toggleFavoriteStore: (storeId: string) => void;
  approveOrder: (orderId: string) => { success: boolean; errors: string[] };
  rejectOrder: (orderId: string, reason: string) => boolean;
  completeOrder: (orderId: string) => { success: boolean; errors: string[] };
  reorderOrder: (orderId: string) => Promise<{
    added: Array<{ productName: string; quantity: number }>;
    limited: Array<{ productName: string; requested: number; added: number; available: number }>;
    skipped: Array<{ productName: string; reason: string }>;
  }>;
  favoriteProducts: string[];
  toggleFavoriteProduct: (productId: string) => void;
  isFavoriteProduct: (productId: string) => boolean;
  cartMutating: boolean;
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
  const cartRef = useRef<CartItem[]>([]);
  const cartMutationQueue = useRef(Promise.resolve());
  const cartMutationPending = useRef(0);
  const [cartMutating, setCartMutating] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [favoriteStores, setFavoriteStores] = useState<string[]>(['store-1']);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([]);
  const approvedOrderIds = useRef(new Set<string>());

  const enqueueCartMutation = <T,>(operation: () => Promise<T> | T): Promise<T> => {
    cartMutationPending.current += 1;
    setCartMutating(true);
    const result = cartMutationQueue.current.then(operation, operation);
    cartMutationQueue.current = result.then(() => undefined, () => undefined);
    return result.finally(() => {
      cartMutationPending.current -= 1;
      if (cartMutationPending.current === 0) setCartMutating(false);
    });
  };

  const commitCart = (next: CartItem[]) => {
    cartRef.current = next;
    setCart(next);
  };

  const addToCart = (productId: string, quantity = 1) => enqueueCartMutation(async () => {
    const database = iocContainer.getDatabase();
    const product = await database.getProductByIdAsync(productId);
    if (!product || !product.isAvailable || product.stockQuantity <= 0 || quantity > product.stockQuantity) {
      throw new Error('Requested product is unavailable');
    }

    const provider = product.sellerType === 'store'
      ? await database.getStoreByIdAsync(product.sellerId)
      : await database.getFactoryByIdAsync(product.sellerId);
    if (!provider || provider.status !== 'active') throw new Error('The product provider is currently inactive');

    const previous = cartRef.current;
    const existing = previous.find((item) => item.productId === productId);
    if (existing) {
      if (existing.quantity + quantity > product.stockQuantity) throw new Error('Requested quantity exceeds available stock');
      commitCart(previous.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item));
      return;
    }

    const item: CartItem = {
      id: `cart-${product.id}-${Date.now()}`,
      sellerType: product.sellerType,
      sellerId: product.sellerId,
      sellerName: provider.name,
      productId: product.id,
      quantity,
      unitPrice: product.pharmacyPriceAfterDiscount,
      discountPercentage: product.discountPercentage,
      productName: product.name,
      packageSize: product.packageSize,
      variant: product.variant,
      dosage: product.dosage,
      product,
      store: product.sellerType === 'store' ? provider as import('../models/data_types').Store : undefined,
      manufacturer: product.sellerType === 'manufacturer' ? provider as import('../models/data_types').Factory : undefined,
      consumerPrice: product.consumerPrice,
      pharmacyPriceAtPurchase: product.pharmacyPriceAfterDiscount,
    };
    commitCart([...previous, item]);
  });

  const updateQuantity = (productId: string, quantity: number) => enqueueCartMutation(async () => {
    if (quantity < 0) return;
    if (quantity === 0) {
      commitCart(cartRef.current.filter((item) => item.productId !== productId));
      return;
    }

    const database = iocContainer.getDatabase();
    const product = await database.getProductByIdAsync(productId);
    if (!product || !product.isAvailable || quantity > product.stockQuantity) throw new Error('Requested quantity exceeds available stock');

    const provider = product.sellerType === 'store'
      ? await database.getStoreByIdAsync(product.sellerId)
      : await database.getFactoryByIdAsync(product.sellerId);
    if (!provider || provider.status !== 'active') throw new Error('The product provider is currently inactive');

    commitCart(cartRef.current.map((item) => item.productId === productId
      ? { ...item, quantity, unitPrice: product.pharmacyPriceAfterDiscount, discountPercentage: product.discountPercentage, consumerPrice: product.consumerPrice, pharmacyPriceAtPurchase: product.pharmacyPriceAfterDiscount }
      : item));
  });

  const removeFromCart = (productId: string) => enqueueCartMutation(() => {
    commitCart(cartRef.current.filter((item) => item.productId !== productId));
  });

  const refreshCartPricing = (): Promise<CheckoutValidationIssue[]> => enqueueCartMutation(async () => {
    const database = iocContainer.getDatabase();
    const issues: CheckoutValidationIssue[] = [];

    const refreshed = await Promise.all(cartRef.current.map(async (item) => {
      const product = await database.getProductByIdAsync(item.productId);
      if (!product) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: 0, requestedQuantity: item.quantity, reason: 'unavailable' });
        return item;
      }

      const provider = product.sellerType === 'store'
        ? await database.getStoreByIdAsync(product.sellerId)
        : await database.getFactoryByIdAsync(product.sellerId);
      if (!provider || provider.status !== 'active') {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'inactive-provider' });
        return item;
      }
      if (!product.isAvailable || product.stockQuantity <= 0) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'inactive-product' });
      }
      if (product.stockQuantity < item.quantity) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'insufficient-stock' });
      }
      if (item.consumerPrice !== undefined && item.consumerPrice !== product.consumerPrice) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'price-change', oldConsumerPrice: item.consumerPrice, currentConsumerPrice: product.consumerPrice, oldPharmacistPrice: item.unitPrice, currentPharmacistPrice: product.pharmacyPriceAfterDiscount });
      }
      if (item.discountPercentage !== product.discountPercentage) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'discount-change', oldDiscount: item.discountPercentage, currentDiscount: product.discountPercentage, oldPharmacistPrice: item.unitPrice, currentPharmacistPrice: product.pharmacyPriceAfterDiscount });
      }

      return {
        ...item,
        unitPrice: product.pharmacyPriceAfterDiscount,
        discountPercentage: product.discountPercentage,
        consumerPrice: product.consumerPrice,
        pharmacyPriceAtPurchase: product.pharmacyPriceAfterDiscount,
        productName: product.name,
        dosage: product.dosage,
        product,
      };
    }));

    commitCart(refreshed);
    return issues;
  });

  const createOrder = (): Promise<{
    success: boolean;
    issues: CheckoutValidationIssue[];
    orderId?: string;
  }> => enqueueCartMutation(async () => {
    if (cartRef.current.length === 0) return { success: false, issues: [] };

    const database = iocContainer.getDatabase();
    const issues: CheckoutValidationIssue[] = [];
    const liveLines: Array<{ item: CartItem; product: import('../models/data_types').Product }> = [];

    for (const item of cartRef.current) {
      const product = await database.getProductByIdAsync(item.productId);
      if (!product) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: 0, requestedQuantity: item.quantity, reason: 'unavailable' });
        continue;
      }
      if (!product.isAvailable || product.stockQuantity <= 0) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'inactive-product' });
        continue;
      }

      const provider = product.sellerType === 'store'
        ? await database.getStoreByIdAsync(product.sellerId)
        : await database.getFactoryByIdAsync(product.sellerId);
      if (!provider || provider.status !== 'active') {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'inactive-provider' });
        continue;
      }
      if (product.stockQuantity < item.quantity) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'insufficient-stock' });
      }
      if (item.consumerPrice !== undefined && item.consumerPrice !== product.consumerPrice) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'price-change', oldConsumerPrice: item.consumerPrice, currentConsumerPrice: product.consumerPrice, oldPharmacistPrice: item.unitPrice, currentPharmacistPrice: product.pharmacyPriceAfterDiscount });
      }
      if (item.discountPercentage !== product.discountPercentage) {
        issues.push({ productId: item.productId, productName: item.productName, currentStock: product.stockQuantity, requestedQuantity: item.quantity, reason: 'discount-change', oldDiscount: item.discountPercentage, currentDiscount: product.discountPercentage, oldPharmacistPrice: item.unitPrice, currentPharmacistPrice: product.pharmacyPriceAfterDiscount });
      }
      liveLines.push({ item, product });
    }

    if (issues.length > 0) return { success: false, issues };

    const lines: OrderLineSnapshot[] = liveLines.map(({ item, product }) => ({
      productId: item.productId,
      productName: product.name,
      dosage: product.dosage,
      packageSize: product.packageSize,
      variant: product.variant,
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      sellerType: item.sellerType,
      unitPrice: product.pharmacyPriceAfterDiscount,
      discountPercentage: product.discountPercentage,
      quantity: item.quantity,
      lineTotal: product.pharmacyPriceAfterDiscount * item.quantity,
      consumerPrice: product.consumerPrice,
      pharmacyPriceAfterDiscount: product.pharmacyPriceAfterDiscount,
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
    commitCart([]);
    return { success: true, issues: [], orderId: order.id };
  });

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

  const completeOrder = (orderId: string): { success: boolean; errors: string[] } => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return { success: false, errors: ['Order not found.'] };
    if (order.status !== 'approved') return { success: false, errors: ['Only approved orders can be completed.'] };

    setOrders((previous) => previous.map((item) => item.id === orderId
      ? { ...item, status: 'completed', completedAt: new Date().toISOString() }
      : item));
    return { success: true, errors: [] };
  };

  const reorderOrder = (orderId: string): Promise<{
    added: Array<{ productName: string; quantity: number }>;
    limited: Array<{ productName: string; requested: number; added: number; available: number }>;
    skipped: Array<{ productName: string; reason: string }>;
  }> => enqueueCartMutation(async () => {
    const order = orders.find((item) => item.id === orderId);
    const report = { added: [] as Array<{ productName: string; quantity: number }>, limited: [] as Array<{ productName: string; requested: number; added: number; available: number }>, skipped: [] as Array<{ productName: string; reason: string }> };
    if (!order || order.pharmacistId !== user?.id) {
      report.skipped.push({ productName: 'Order', reason: 'Order not found or access is not permitted' });
      return Promise.resolve(report);
    }

    const database = iocContainer.getDatabase();
    let next = cartRef.current.map((item) => ({ ...item }));

    const promises = order.items.map(async (line) => {
      const product = await database.getProductByIdAsync(line.productId);
      if (!product) { report.skipped.push({ productName: line.productName, reason: 'Product no longer exists' }); return; }
      if (!product.isAvailable || product.stockQuantity <= 0) { report.skipped.push({ productName: line.productName, reason: 'Product is inactive or out of stock' }); return; }

      const provider = product.sellerType === 'store'
        ? await database.getStoreByIdAsync(product.sellerId)
        : await database.getFactoryByIdAsync(product.sellerId);
      if (!provider || provider.status !== 'active') { report.skipped.push({ productName: line.productName, reason: product.sellerType === 'store' ? 'Store is inactive' : 'Manufacturer is inactive' }); return; }

      const existing = next.find((item) => item.productId === product.id);
      const existingQuantity = existing?.quantity ?? 0;
      const quantityToAdd = Math.max(0, Math.min(line.quantity, product.stockQuantity - existingQuantity));

      if (quantityToAdd <= 0) { report.limited.push({ productName: line.productName, requested: line.quantity, added: 0, available: product.stockQuantity }); return; }

      if (existing) next = next.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item);
      else next = [...next, {
        id: `cart-${product.id}-${Date.now()}`,
        sellerType: product.sellerType,
        sellerId: product.sellerId,
        sellerName: provider.name,
        productId: product.id,
        quantity: quantityToAdd,
        unitPrice: product.pharmacyPriceAfterDiscount,
        discountPercentage: product.discountPercentage,
        productName: product.name,
        packageSize: product.packageSize,
        variant: product.variant,
        dosage: product.dosage,
        product,
        store: product.sellerType === 'store' ? provider as import('../models/data_types').Store : undefined,
        manufacturer: product.sellerType === 'manufacturer' ? provider as import('../models/data_types').Factory : undefined,
        consumerPrice: product.consumerPrice,
        pharmacyPriceAtPurchase: product.pharmacyPriceAfterDiscount,
      }];

      if (quantityToAdd < line.quantity) report.limited.push({ productName: line.productName, requested: line.quantity, added: quantityToAdd, available: product.stockQuantity });
      else report.added.push({ productName: line.productName, quantity: quantityToAdd });
    });

    await Promise.all(promises);
    commitCart(next);
    return report;
  });

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);
  const unreadNotifications = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const value = useMemo<AppStateContextValue>(() => ({
    language, setLanguage, cart, addToCart, updateQuantity, removeFromCart,
    refreshCartPricing,
    cartTotal, cartCount, notifications, unreadNotifications, markNotificationRead,
    orders, createOrder, approveOrder, rejectOrder, completeOrder, favoriteStores, toggleFavoriteStore, reorderOrder,
    favoriteProducts, toggleFavoriteProduct, isFavoriteProduct: (productId) => favoriteProducts.includes(productId),
    cartMutating,
  }), [language, cart, cartCount, cartTotal, notifications, unreadNotifications, orders, favoriteStores, favoriteProducts, cartMutating]);

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

  useEffect(() => {
    if (cartMutationPending.current === 0) cartRef.current = cart;
  }, [cart]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export default function AppStateModule() { return null; }

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider');
  return context;
}
