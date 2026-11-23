export interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  specialtyId: string;
  sellerType: ProducerType;
  sellerId: string;
  manufacturer?: string;
  manufacturerId?: string;
  barcode?: string;
  dosage?: string;
  packageSize?: string;
  variant?: string;
  form?: string;
  consumerPrice: number;
  discountPercentage: number;
  pharmacyPriceAfterDiscount: number;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface Specialty {
  id: string;
  name: string;
  description: string;
  image: string;
  isActive?: boolean;
}

export enum ProducerType {
  Store = 'store',
  Manufacturer = 'manufacturer',
}

export interface Producer {
  id: string;
  type: ProducerType;
  name: string;
  description: string;
  image: string;
  address?: string;
  location?: { latitude?: number; longitude?: number } | string;
  phone: string;
}

export type StoreStatus = 'active' | 'inactive';

export interface Store extends Producer {
  type: ProducerType.Store;
  openHours?: string;
  rating?: number;
  contactPerson: string;
  status: StoreStatus;
}

export type ManufacturerStatus = 'active' | 'inactive';

export interface Factory extends Producer {
  type: ProducerType.Manufacturer;
  certification: string;
  productionCapacity: string;
  contactPerson: string;
  status: ManufacturerStatus;
}

export interface CartItem {
  id: string;
  sellerType: 'store' | 'manufacturer';
  sellerId: string;
  sellerName: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  productName: string;
  packageSize?: string;
  variant?: string;
  dosage?: string;
  product?: Product;
  store?: Store;
  manufacturer?: Factory;
}

export interface OrderLineSnapshot {
  productId: string;
  productName: string;
  dosage?: string;
  packageSize?: string;
  variant?: string;
  sellerId: string;
  sellerName: string;
  unitPrice: number;
  discountPercentage: number;
  quantity: number;
  lineTotal: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customerName?: string;
  sellerType: 'store' | 'manufacturer';
  sellerId: string;
  sellerName: string;
  items: OrderLineSnapshot[];
  totalItems: number;
  totalDiscount: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  deliveredAt?: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  description?: string;
  image?: string;
  address?: string;
  location?: { latitude?: number; longitude?: number };
  phone?: string;
  isActive?: boolean;
  openHours?: string;
}

export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  image?: string;
  backgroundColor?: string;
  sortOrder?: number;
}

export interface StoreInput {
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  description?: string;
  image?: string;
  status: StoreStatus;
}

export interface ManufacturerInput {
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  description?: string;
  image?: string;
  status: ManufacturerStatus;
}