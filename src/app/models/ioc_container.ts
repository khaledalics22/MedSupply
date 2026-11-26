import { Database, MockDatabase } from './database';
import { supabaseProviderDatabase } from './supabase_database';

export class IoCContainer {
  private static instance: IoCContainer | null = null;
  private readonly database: Database;

  private constructor() {
    this.database = new ProviderAwareDatabase(new MockDatabase(), supabaseProviderDatabase);
  }

  static getInstance(): IoCContainer {
    if (!IoCContainer.instance) IoCContainer.instance = new IoCContainer();
    return IoCContainer.instance;
  }

  getDatabase(): Database {
    return this.database;
  }

  getSupabaseProviders() {
    return supabaseProviderDatabase;
  }
}

class ProviderAwareDatabase extends Database {
  constructor(private readonly mock: MockDatabase, private readonly supabaseProviders: typeof supabaseProviderDatabase) {
    super();
  }

  getAdvertisements() { return this.mock.getAdvertisements(); }
  getSpecialties() { return this.mock.getSpecialties(); }
  getSpecialtiesAsync() { return this.supabaseProviders.getSpecialties(); }
  getSpecialtyById(id: string) { return this.mock.getSpecialtyById(id); }
  getSpecialtyByIdAsync(id: string) { return this.supabaseProviders.getSpecialtyById(id); }
  getProducts() { return this.mock.getProducts(); }
  getAvailableProducts() { return this.mock.getAvailableProducts(); }
  getAvailableProductsAsync() { return this.supabaseProviders.getAvailableProducts(); }
  getProductsBySpecialty(id: string) { return this.mock.getProductsBySpecialty(id); }
  getProductsBySpecialtyAsync(id: string) { return this.supabaseProviders.getProductsBySpecialty(id); }
  getProductsByStore(id: string) { return this.mock.getProductsByStore(id); }
  getProductsByManufacturer(id: string) { return this.mock.getProductsByManufacturer(id); }
  getStores() { return this.mock.getStores(); }
  getActiveStores() { return this.mock.getActiveStores(); }
  addStore(input: any) { return this.mock.addStore(input); }
  updateStore(id: string, input: any) { return this.mock.updateStore(id, input); }
  setStoreStatus(id: string, status: 'active' | 'inactive') { return this.mock.setStoreStatus(id, status); }
  getFactories() { return this.mock.getFactories(); }
  getActiveFactories() { return this.mock.getActiveFactories(); }
  addFactory(input: any) { return this.mock.addFactory(input); }
  updateFactory(id: string, input: any) { return this.mock.updateFactory(id, input); }
  setFactoryStatus(id: string, status: 'active' | 'inactive') { return this.mock.setFactoryStatus(id, status); }
  getPharmacies() { return this.mock.getPharmacies(); }
  getProductById(id: string) { return this.mock.getProductById(id); }
  getStoreById(id: string) { return this.mock.getStoreById(id); }
  getFactoryById(id: string) { return this.mock.getFactoryById(id); }
  getBestPriceProducts() { return this.mock.getBestPriceProducts(); }
  createCartItem(productId: string, quantity?: number) { return this.mock.createCartItem(productId, quantity); }
  deductProductStock(productId: string, quantity: number) { this.mock.deductProductStock(productId, quantity); }
  addProviderProduct(providerType: any, providerId: string, input: any) { return this.mock.addProviderProduct(providerType, providerId, input); }
  updateProviderProduct(productId: string, input: any) { return this.mock.updateProviderProduct(productId, input); }
  setProviderProductStatus(productId: string, isAvailable: boolean) { return this.mock.setProviderProductStatus(productId, isAvailable); }
  findSimilarProviderProducts(providerType: any, providerId: string, name: string) { return this.mock.findSimilarProviderProducts(providerType, providerId, name); }
  findProviderProductDuplicate(providerType: any, providerId: string, name: string, dosage: string, excludeProductId?: string) { return this.mock.findProviderProductDuplicate(providerType, providerId, name, dosage, excludeProductId); }
  validateOrderStock(lines: any[]) { return this.mock.validateOrderStock(lines); }
  approveAndDeductOrderStock(lines: any[]) { return this.mock.approveAndDeductOrderStock(lines); }

  getProductsByStoreAsync(storeId: string) { return this.supabaseProviders.getProductsByStore(storeId); }
  getProductsByManufacturerAsync(manufacturerId: string) { return this.supabaseProviders.getProductsByManufacturer(manufacturerId); }
  getProductByIdAsync(productId: string) { return this.supabaseProviders.getProductById(productId); }
  addProviderProductAsync(providerType: any, providerId: string, input: any) { return this.supabaseProviders.addProviderProduct(providerType, providerId, input); }
  updateProviderProductAsync(productId: string, input: any) { return this.supabaseProviders.updateProviderProduct(productId, input); }
  setProviderProductStatusAsync(productId: string, isAvailable: boolean) { return this.supabaseProviders.setProviderProductStatus(productId, isAvailable); }
  softDeleteProviderProductAsync(productId: string) { return this.supabaseProviders.softDeleteProviderProduct(productId); }
  findProviderProductDuplicateAsync(providerType: any, providerId: string, name: string, dosage: string, excludeProductId?: string) { return this.supabaseProviders.findProviderProductDuplicate(providerType, providerId, name, dosage, excludeProductId); }

  getStoresAsync(includeInactive = true) { return this.supabaseProviders.getStores(includeInactive); }
  getActiveStoresAsync() { return this.supabaseProviders.getStores(false); }
  getStoreByIdAsync(storeId: string) { return this.supabaseProviders.getStoreById(storeId); }
  addStoreAsync(input: any) { return this.supabaseProviders.addStore(input); }
  updateStoreAsync(storeId: string, input: any) { return this.supabaseProviders.updateStore(storeId, input); }
  setStoreStatusAsync(storeId: string, status: 'active' | 'inactive') { return this.supabaseProviders.setStoreStatus(storeId, status); }
  getFactoriesAsync(includeInactive = true) { return this.supabaseProviders.getFactories(includeInactive); }
  getActiveFactoriesAsync() { return this.supabaseProviders.getFactories(false); }
  getFactoryByIdAsync(factoryId: string) { return this.supabaseProviders.getFactoryById(factoryId); }
  addFactoryAsync(input: any) { return this.supabaseProviders.addFactory(input); }
  updateFactoryAsync(factoryId: string, input: any) { return this.supabaseProviders.updateFactory(factoryId, input); }
  setFactoryStatusAsync(factoryId: string, status: 'active' | 'inactive') { return this.supabaseProviders.setFactoryStatus(factoryId, status); }
  createOrderAsync(items: any[]) { return this.supabaseProviders.createOrderAsync(items); }
}

export const iocContainer = IoCContainer.getInstance();

export default function IoCModule() {
  return null;
}
