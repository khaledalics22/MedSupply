import type {
  CartItem,
  Factory,
  Pharmacy,
  Product,
  Specialty,
  Store,
  StoreProductOffer,
  ManufacturerProductOffer,
} from '../models/data_types';

export enum CategoryType {
  Medicines = 'medicines',
  BestPrices = 'best-prices',
  Manufacturers = 'manufacturers',
  Stores = 'stores',
  Cosmetics = 'cosmetics',
  MyPharmacy = 'my-pharmacy',
  Specialty = 'specialty',
}

export interface CategoryItem {
  id: string;
  type: CategoryType;
  title: string;
  description: string;
  image: string;
  icon?: string;
  route?: string;
  isActive?: boolean;
  sortOrder?: number;
  itemLayout: 'grid' | 'list';
}

export type Category = CategoryItem;

export enum ItemType {
  Medicine = 'medicine',
  Product = 'product',
  Store = 'store',
  Factory = 'factory',
  Pharmacy = 'pharmacy',
}

export type Medicine = {
  id: string;
  type: ItemType.Medicine;
  productId?: string;
  name: string;
  description: string;
  image: string;
  price: number;
  discount: number;
  dosage: string;
  stock: number;
};

export type {
  CartItem,
  Factory,
  Pharmacy,
  Product,
  Specialty,
  Store,
  StoreProductOffer,
  ManufacturerProductOffer,
};

export type Item =
  | Medicine
  | (Product & { type: ItemType.Product })
  | (Store & { type: ItemType.Store })
  | (Factory & { type: ItemType.Factory })
  | (Pharmacy & { type: ItemType.Pharmacy });







