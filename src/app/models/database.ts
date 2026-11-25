import {
  ProducerType,
  type Advertisement,
  type CartItem,
  type Factory,
  type Pharmacy,
  type Product,
  type Specialty,
  type Store,
  type StoreInput,
  type ManufacturerInput,
  type ProductInput,
  type OrderLineSnapshot,
} from './data_types';

export abstract class Database {
  abstract getAdvertisements(): Advertisement[];
  abstract getSpecialties(): Specialty[];
  abstract getSpecialtiesAsync(): Promise<Specialty[]>;
  abstract getSpecialtyById(specialtyId: string): Specialty | undefined;
  abstract getProducts(): Product[];
  abstract getAvailableProducts(): Product[];
  abstract getProductsBySpecialty(specialtyId: string): Product[];
  abstract getProductsByStore(storeId: string): Product[];
  abstract getProductsByManufacturer(manufacturerId: string): Product[];
  abstract getStores(): Store[];
  abstract getActiveStores(): Store[];
  abstract addStore(input: StoreInput): Store;
  abstract updateStore(storeId: string, input: StoreInput): Store;
  abstract setStoreStatus(storeId: string, status: 'active' | 'inactive'): Store;
  abstract getFactories(): Factory[];
  abstract getActiveFactories(): Factory[];
  abstract addFactory(input: ManufacturerInput): Factory;
  abstract updateFactory(factoryId: string, input: ManufacturerInput): Factory;
  abstract setFactoryStatus(factoryId: string, status: 'active' | 'inactive'): Factory;
  abstract getPharmacies(): Pharmacy[];
  abstract getProductById(productId: string): Product | undefined;
  abstract getStoreById(storeId: string): Store | undefined;
  abstract getFactoryById(factoryId: string): Factory | undefined;
  abstract getBestPriceProducts(): Product[];
  abstract createCartItem(productId: string, quantity?: number): CartItem;
  abstract deductProductStock(productId: string, quantity: number): void;
  abstract addProviderProduct(providerType: ProducerType, providerId: string, input: ProductInput): Product;
  abstract updateProviderProduct(productId: string, input: ProductInput): Product;
  abstract setProviderProductStatus(productId: string, isAvailable: boolean): Product;
  abstract findSimilarProviderProducts(providerType: ProducerType, providerId: string, name: string): Product[];
  abstract findProviderProductDuplicate(providerType: ProducerType, providerId: string, name: string, dosage: string, excludeProductId?: string): Product | undefined;
  abstract validateOrderStock(lines: OrderLineSnapshot[]): string[];
  abstract approveAndDeductOrderStock(lines: OrderLineSnapshot[]): { success: boolean; errors: string[] };

  abstract getStoresAsync(includeInactive?: boolean): Promise<Store[]>;
  abstract getActiveStoresAsync(): Promise<Store[]>;
  abstract getStoreByIdAsync(storeId: string): Promise<Store | undefined>;
  abstract addStoreAsync(input: StoreInput): Promise<Store>;
  abstract updateStoreAsync(storeId: string, input: StoreInput): Promise<Store>;
  abstract setStoreStatusAsync(storeId: string, status: 'active' | 'inactive'): Promise<Store>;

  abstract getFactoriesAsync(includeInactive?: boolean): Promise<Factory[]>;
  abstract getActiveFactoriesAsync(): Promise<Factory[]>;
  abstract getFactoryByIdAsync(factoryId: string): Promise<Factory | undefined>;
  abstract addFactoryAsync(input: ManufacturerInput): Promise<Factory>;
  abstract updateFactoryAsync(factoryId: string, input: ManufacturerInput): Promise<Factory>;
  abstract setFactoryStatusAsync(factoryId: string, status: 'active' | 'inactive'): Promise<Factory>;

  abstract getProductsByStoreAsync(storeId: string): Promise<Product[]>;
  abstract getProductsByManufacturerAsync(manufacturerId: string): Promise<Product[]>;
  abstract getProductByIdAsync(productId: string): Promise<Product | undefined>;
  abstract addProviderProductAsync(providerType: ProducerType, providerId: string, input: ProductInput): Promise<Product>;
  abstract updateProviderProductAsync(productId: string, input: ProductInput): Promise<Product>;
  abstract setProviderProductStatusAsync(productId: string, isAvailable: boolean): Promise<Product>;
  abstract softDeleteProviderProductAsync(productId: string): Promise<void>;
  abstract findProviderProductDuplicateAsync(providerType: ProducerType, providerId: string, name: string, dosage: string, excludeProductId?: string): Promise<Product | undefined>;
}

export class MockDatabase extends Database {
  private readonly specialties: Specialty[] = [
    { id: 'general', name: 'عام', description: 'منتجات صيدلية عامة', image: 'https://picsum.photos/seed/specialty-general/100', isActive: true },
    { id: 'beauty', name: 'جمال', description: 'منتجات التجميل والعناية الشخصية', image: 'https://picsum.photos/seed/specialty-beauty/100', isActive: true },
    { id: 'health', name: 'صحة', description: 'منتجات الصحة والعافية', image: 'https://picsum.photos/seed/specialty-health/100', isActive: true },
    { id: 'baby', name: 'طفل', description: 'منتجات العناية بالطفل', image: 'https://picsum.photos/seed/specialty-baby/100', isActive: true },
    { id: 'elderly', name: 'كبار السن', description: 'منتجات العناية بكبار السن', image: 'https://picsum.photos/seed/specialty-elderly/100', isActive: true },
    { id: 'supplements', name: 'مكملات', description: 'مكملات غذائية ومنتجات دوائية', image: 'https://picsum.photos/seed/specialty-supplements/100', isActive: true },
    { id: 'medical', name: 'طبي', description: 'منتجات طبية ومستلزمات قياس', image: 'https://picsum.photos/seed/specialty-medical/100', isActive: true },
    { id: 'herbal', name: 'عشبي', description: 'منتجات الأعشاب الطبيعية', image: 'https://picsum.photos/seed/specialty-herbal/100', isActive: true },
    { id: 'dental', name: 'أسنان', description: 'منتجات العناية بالأسنان', image: 'https://picsum.photos/seed/specialty-dental/100', isActive: true },
    { id: 'ophthalmic', name: 'عيون', description: 'منتجات العناية بالعيون', image: 'https://picsum.photos/seed/specialty-ophthalmic/100', isActive: true },
  ];

  private stores: Store[] = [
    { id: 'store-1', type: ProducerType.Store, name: 'العزبي', description: 'صيدلية متكاملة توصل الأدوية والمستلزمات', image: 'https://picsum.photos/seed/store-azaby/100', address: '12 شارع النيل، القاهرة', phone: '+20 2 1234 4400', contactPerson: 'Store Manager', status: 'active', openHours: '8:00 ص - 12:00 م', rating: 4.8 },
    { id: 'store-2', type: ProducerType.Store, name: 'الشفاء', description: 'مكملات ومنتجات صحية وعناية يومية', image: 'https://picsum.photos/seed/store-shifa/100', address: '78 طريق المطار، الجيزة', phone: '+20 2 2345 1010', contactPerson: 'Store Manager', status: 'active', openHours: '9:00 ص - 11:00 م', rating: 4.6 },
    { id: 'store-3', type: ProducerType.Store, name: 'الصحة', description: 'أدوية ومستحضرات عناية ومستلزمات طبية', image: 'https://picsum.photos/seed/store-seha/100', address: '45 شارع التحرير، القاهرة', phone: '+20 2 3456 5678', contactPerson: 'Store Manager', status: 'active', openHours: '8:00 ص - 12:00 م', rating: 4.7 },
    { id: 'store-4', type: ProducerType.Store, name: 'الدواء', description: 'منتجات عشبية وطبيعية ومستلزمات منزلية', image: 'https://picsum.photos/seed/store-dawa/100', address: '23 شارع المسيد، الرياض', phone: '+966 55 345 6789', contactPerson: 'Store Manager', status: 'active', openHours: '9:00 ص - 10:00 م', rating: 4.5 },
  ];

  private factories: Factory[] = [
    { id: 'factory-1', type: ProducerType.Manufacturer, name: 'فارما إيجيبت', description: 'إنتاج الأدوية الصيدلية والمعلبات', image: 'https://picsum.photos/seed/factory-farma-egypt/100', location: 'المنطقة الصناعية، العاشر', address: 'المنطقة الصناعية، العاشر', certification: 'GMP', productionCapacity: '3 مليون عبوة شهرياً', phone: '+20 55 888 1234', contactPerson: 'Manufacturing Manager', status: 'active' },
    { id: 'factory-2', type: ProducerType.Manufacturer, name: 'نوفا هيلث', description: 'إنتاج المكملات والمنتجات الصحية', image: 'https://picsum.photos/seed/factory-nova-health/100', location: 'مدينة التقنية، الرياض', address: 'مدينة التقنية، الرياض', certification: 'ISO 13485', productionCapacity: '500 ألف وحدة شهرياً', phone: '+966 11 777 0909', contactPerson: 'Manufacturing Manager', status: 'active' },
    { id: 'factory-3', type: ProducerType.Manufacturer, name: 'هيلث لابز', description: 'أجهزة قياس ومستلزمات طبية', image: 'https://picsum.photos/seed/factory-health-labs/100', location: 'المنطقة الصناعية، القاهرة', address: 'المنطقة الصناعية، القاهرة', certification: 'ISO 9001', productionCapacity: '1 مليون وحدة شهرياً', phone: '+20 11 666 1122', contactPerson: 'Manufacturing Manager', status: 'active' },
  ];

  private products: Product[] = [
    this.makeProduct('store-1-prod-1', 'باراسيتامول', 'مسكن للألم وخافض للحرارة', 'store-1', ProducerType.Store, 'general', 'factory-1', 'فارما إيجيبت', '500 mg', '20 قرصاً', 30, 17, 120, true),
    this.makeProduct('store-1-prod-2', 'أموكسيسيلين', 'مضاد حيوي واسع المجال', 'store-1', ProducerType.Store, 'general', 'factory-1', 'فارما إيجيبت', '250 mg', '12 كبسولة', 140, 14, 42, true),
    this.makeProduct('store-1-prod-3', 'سيروم فيتامين سي', 'سيروم يومي للترطيب والإشراق', 'store-1', ProducerType.Store, 'beauty', 'factory-2', 'نوفا هيلث', '30 ml', 'عبوة واحدة', 95, 10, 25, true),
    this.makeProduct('store-2-prod-1', 'فيتامين سي', 'مكمل يومي لدعم المناعة', 'store-2', ProducerType.Store, 'supplements', 'factory-2', 'نوفا هيلث', '1000 mg', '30 قرصاً', 90, 11, 60, true),
    this.makeProduct('store-2-prod-2', 'كريم واقي شمس', 'حماية واسعة الطيف للاستخدام اليومي', 'store-2', ProducerType.Store, 'beauty', 'factory-2', 'نوفا هيلث', '50 ml', 'أنبوب', 180, 20, 18, true),
    this.makeProduct('store-2-prod-3', 'سكروم الشعر', 'تقوية الشعر وتقليل التساقط', 'store-2', ProducerType.Store, 'beauty', 'factory-2', 'نوفا هيلث', '100 ml', 'عبوة واحدة', 220, 15, 0, false),
    this.makeProduct('store-3-prod-1', 'جهاز قياس الضغط', 'جهاز رقمي محمول لقياس ضغط الدم', 'store-3', ProducerType.Store, 'medical', 'factory-3', 'هيلث لابز', 'جهاز رقمي', 'عبوة واحدة', 520, 13, 16, true),
    this.makeProduct('store-3-prod-2', 'ميزان حرارة رقمي', 'قياس سريع وقراءة دقيقة', 'store-3', ProducerType.Store, 'medical', 'factory-3', 'هيلث لابز', 'رقمي', 'عبوة واحدة', 110, 14, 30, true),
    this.makeProduct('store-3-prod-3', 'قطرة عيون مرطبة', 'مرطب للعيون الجافة', 'store-3', ProducerType.Store, 'ophthalmic', 'factory-1', 'فارما إيجيبت', '10 ml', 'قطارة', 75, 8, 24, true),
    this.makeProduct('store-4-prod-1', 'عسل زعتر', 'عسل طبيعي بنكهة الزعتر', 'store-4', ProducerType.Store, 'herbal', 'factory-2', 'نوفا هيلث', 'Natural', '250 g', 125, 12, 35, true),
    this.makeProduct('store-4-prod-2', 'معجون أسنان عشبي', 'عناية أسنان بالنعناع والأعشاب', 'store-4', ProducerType.Store, 'dental', 'factory-2', 'نوفا هيلث', 'Herbal', '75 ml', 65, 10, 50, true),
    this.makeProduct('factory-1-prod-1', 'باراسيتامول', 'مسكن للألم وخافض للحرارة', 'factory-1', ProducerType.Manufacturer, 'general', 'factory-1', 'فارما إيجيبت', '500 mg', '10 أقراص', 25, 10, 220, true),
    this.makeProduct('factory-1-prod-2', 'باراسيتامول', 'مسكن للألم وخافض للحرارة', 'factory-1', ProducerType.Manufacturer, 'general', 'factory-1', 'فارما إيجيبت', '500 mg', '20 قرصاً', 42, 12, 180, true),
    this.makeProduct('factory-2-prod-1', 'أوميجا 3', 'دعم القلب والدماغ', 'factory-2', ProducerType.Manufacturer, 'supplements', 'factory-2', 'نوفا هيلث', '1000 mg', '30 كبسولة', 210, 15, 75, true),
    this.makeProduct('factory-2-prod-2', 'كريم البشرة', 'ترطيب وتنشيط البشرة الجافة', 'factory-2', ProducerType.Manufacturer, 'beauty', 'factory-2', 'نوفا هيلث', '50 ml', 'أنبوب', 155, 18, 34, true),
    this.makeProduct('factory-3-prod-1', 'جهاز قياس الضغط', 'جهاز رقمي لقياس ضغط الدم', 'factory-3', ProducerType.Manufacturer, 'medical', 'factory-3', 'هيلث لابز', 'جهاز رقمي', 'عبوة واحدة', 430, 10, 40, true),
  ];

  private readonly advertisements: Advertisement[] = [
    { id: 'ad-1', title: 'خصم اليوم', description: 'خصومات على مستلزمات صحية مختارة', image: 'https://picsum.photos/seed/flash-sale/100', backgroundColor: '#208AEF', sortOrder: 1 },
    { id: 'ad-2', title: 'توصيل مجاني', description: 'اطلب قبل الساعة 8 مساءً للتوصيل اليوم', image: 'https://picsum.photos/seed/delivery/100', backgroundColor: '#14B8A6', sortOrder: 2 },
  ];

  private readonly pharmacies: Pharmacy[] = [];

  private makeProduct(id: string, name: string, description: string, sellerId: string, sellerType: ProducerType, specialtyId: string, manufacturerId: string, manufacturer: string, dosage: string, packageSize: string, consumerPrice: number, discountPercentage: number, stockQuantity: number, isAvailable: boolean): Product {
    const pharmacyPriceAfterDiscount = this.calculatePrice(consumerPrice, discountPercentage);
    return {
      id, name, description,
      image: `https://picsum.photos/seed/${id}/100`,
      specialtyId, sellerType, sellerId, manufacturerId, manufacturer,
      dosage, packageSize, form: packageSize,
      consumerPrice,
      discountPercentage,
      pharmacyPriceAfterDiscount,
      stockQuantity,
      isAvailable,
    };
  }

  private calculatePrice(consumerPrice: number, discountPercentage: number): number {
    const cents = Math.round(consumerPrice * 100);
    const discountCents = Math.round(cents * discountPercentage / 100);
    return Math.round(cents - discountCents) / 100;
  }

  getAdvertisements(): Advertisement[] { return [...this.advertisements].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)); }
  getSpecialties(): Specialty[] { return [...this.specialties]; }
  async getSpecialtiesAsync(): Promise<Specialty[]> { return [...this.specialties]; }
  getSpecialtyById(specialtyId: string): Specialty | undefined { return this.specialties.find((item) => item.id === specialtyId); }
  getProducts(): Product[] { return [...this.products]; }
  getAvailableProducts(): Product[] {
    return this.products.filter((product) => {
      if (!product.isAvailable || product.stockQuantity <= 0) return false;
      if (product.sellerType === ProducerType.Store) {
        const store = this.getStoreById(product.sellerId);
        if (!store || store.status !== 'active') return false;
      }
      if (product.sellerType === ProducerType.Manufacturer) {
        const manufacturer = this.getFactoryById(product.sellerId);
        if (!manufacturer || manufacturer.status !== 'active') return false;
      }
      return true;
    });
  }
  getProductsBySpecialty(specialtyId: string): Product[] { return this.products.filter((product) => product.specialtyId === specialtyId); }
  getProductsByStore(storeId: string): Product[] { return this.products.filter((product) => product.sellerType === ProducerType.Store && product.sellerId === storeId); }
  getProductsByManufacturer(manufacturerId: string): Product[] { return this.products.filter((product) => product.sellerType === ProducerType.Manufacturer && product.sellerId === manufacturerId); }
  getStores(): Store[] { return [...this.stores]; }
  getActiveStores(): Store[] { return this.stores.filter((store) => store.status === 'active').map((store) => ({ ...store })); }
  addStore(input: StoreInput): Store {
    const store: Store = {
      id: `store-${Date.now()}`,
      type: ProducerType.Store,
      name: input.name.trim(),
      description: input.description?.trim() || 'No description available',
      image: input.image?.trim() || `https://picsum.photos/seed/store-${Date.now()}/100`,
      address: input.address.trim(),
      phone: input.phone.trim(),
      contactPerson: input.contactPerson.trim(),
      status: input.status,
      rating: 0,
      openHours: 'Not specified',
    };
    this.stores = [...this.stores, store];
    return { ...store };
  }
  updateStore(storeId: string, input: StoreInput): Store {
    const index = this.stores.findIndex((store) => store.id === storeId);
    if (index < 0) throw new Error('Store not found');
    const updated: Store = {
      ...this.stores[index],
      name: input.name.trim(),
      contactPerson: input.contactPerson.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      description: input.description?.trim() || 'No description available',
      image: input.image?.trim() || this.stores[index].image,
      status: input.status,
    };
    this.stores = this.stores.map((store) => store.id === storeId ? updated : store);
    return { ...updated };
  }
  setStoreStatus(storeId: string, status: 'active' | 'inactive'): Store {
    const index = this.stores.findIndex((store) => store.id === storeId);
    if (index < 0) throw new Error('Store not found');
    const updated = { ...this.stores[index], status };
    this.stores = this.stores.map((store) => store.id === storeId ? updated : store);
    return updated;
  }
  getFactories(): Factory[] { return [...this.factories]; }
  getActiveFactories(): Factory[] { return this.factories.filter((factory) => factory.status === 'active').map((factory) => ({ ...factory })); }
  addFactory(input: ManufacturerInput): Factory {
    const factory: Factory = {
      id: `factory-${Date.now()}`,
      type: ProducerType.Manufacturer,
      name: input.name.trim(),
      description: input.description?.trim() || 'No description available',
      image: input.image?.trim() || `https://picsum.photos/seed/factory-${Date.now()}/100`,
      location: input.address.trim(),
      address: input.address.trim(),
      phone: input.phone.trim(),
      contactPerson: input.contactPerson.trim(),
      status: input.status,
      certification: 'Pending',
      productionCapacity: 'Not specified',
    };
    this.factories = [...this.factories, factory];
    return { ...factory };
  }
  updateFactory(factoryId: string, input: ManufacturerInput): Factory {
    const index = this.factories.findIndex((factory) => factory.id === factoryId);
    if (index < 0) throw new Error('Manufacturer not found');
    const updated: Factory = {
      ...this.factories[index],
      name: input.name.trim(),
      contactPerson: input.contactPerson.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      location: input.address.trim(),
      description: input.description?.trim() || 'No description available',
      image: input.image?.trim() || this.factories[index].image,
      status: input.status,
    };
    this.factories = this.factories.map((factory) => factory.id === factoryId ? updated : factory);
    return { ...updated };
  }
  setFactoryStatus(factoryId: string, status: 'active' | 'inactive'): Factory {
    const index = this.factories.findIndex((factory) => factory.id === factoryId);
    if (index < 0) throw new Error('Manufacturer not found');
    const updated = { ...this.factories[index], status };
    this.factories = this.factories.map((factory) => factory.id === factoryId ? updated : factory);
    return updated;
  }
  getPharmacies(): Pharmacy[] { return [...this.pharmacies]; }
  getProductById(productId: string): Product | undefined { return this.products.find((product) => product.id === productId); }
  getStoreById(storeId: string): Store | undefined { return this.stores.find((store) => store.id === storeId); }
  getFactoryById(factoryId: string): Factory | undefined { return this.factories.find((factory) => factory.id === factoryId); }
  getBestPriceProducts(): Product[] { return this.getAvailableProducts().sort((left, right) => left.pharmacyPriceAfterDiscount - right.pharmacyPriceAfterDiscount); }

  createCartItem(productId: string, quantity = 1): CartItem {
    const product = this.getProductById(productId);
    if (!product || !product.isAvailable || product.stockQuantity < quantity) throw new Error('Requested product is unavailable');

    const seller = product.sellerType === ProducerType.Store
      ? this.getStoreById(product.sellerId)
      : this.getFactoryById(product.sellerId);

    if (!seller) throw new Error('Product seller not found');

    return {
      id: `cart-${product.id}`,
      sellerType: product.sellerType,
      sellerId: product.sellerId,
      sellerName: seller.name,
      productId: product.id,
      quantity,
      unitPrice: product.pharmacyPriceAfterDiscount,
      discountPercentage: product.discountPercentage,
      productName: product.name,
      packageSize: product.packageSize,
      variant: product.variant,
      dosage: product.dosage,
      product,
      store: product.sellerType === ProducerType.Store ? seller as Store : undefined,
      manufacturer: product.sellerType === ProducerType.Manufacturer ? seller as Factory : undefined,
      consumerPrice: product.consumerPrice,
      pharmacyPriceAtPurchase: product.pharmacyPriceAfterDiscount,
    };
  }

  deductProductStock(productId: string, quantity: number): void {
    const product = this.getProductById(productId);
    if (!product || !product.isAvailable || product.stockQuantity < quantity) throw new Error('Product stock validation failed');
    product.stockQuantity -= quantity;
    if (product.stockQuantity === 0) product.isAvailable = false;
  }

  findProviderProductDuplicate(providerType: ProducerType, providerId: string, name: string, dosage: string, excludeProductId?: string): Product | undefined {
    const key = normalizeProductKey(name, dosage);
    return this.products.find((product) =>
      product.sellerType === providerType &&
      product.sellerId === providerId &&
      product.id !== excludeProductId &&
      normalizeProductKey(product.name, product.dosage) === key
    );
  }
  findSimilarProviderProducts(providerType: ProducerType, providerId: string, name: string): Product[] {
    const normalized = normalizeProductName(name);
    if (!normalized) return [];
    return this.products.filter((product) =>
      product.sellerType === providerType &&
      product.sellerId === providerId &&
      (normalizeProductName(product.name).includes(normalized) || normalized.includes(normalizeProductName(product.name)))
    ).slice(0, 20);
  }
  addProviderProduct(providerType: ProducerType, providerId: string, input: ProductInput): Product {
    if (!input.name.trim() || !input.dosage.trim()) throw new Error('Product name and dosage are required');
    if (input.consumerPrice <= 0) throw new Error('Consumer price must be greater than zero');
    if (input.discountPercentage < 0 || input.discountPercentage > 100) throw new Error('Discount must be between 0% and 100%');
    if (!Number.isInteger(input.stockQuantity) || input.stockQuantity < 0) throw new Error('Stock quantity must be zero or greater');
    const duplicate = this.findProviderProductDuplicate(providerType, providerId, input.name, input.dosage);
    if (duplicate) throw new Error(`Duplicate product: ${duplicate.name} — ${duplicate.dosage ?? 'No dosage'} already exists for this provider`);
    const provider = providerType === ProducerType.Store ? this.getStoreById(providerId) : this.getFactoryById(providerId);
    if (!provider) throw new Error('Provider not found');
    const product: Product = {
      id: `${providerType}-${providerId}-prod-${Date.now()}`,
      name: input.name.trim().replace(/\s+/g, ' '),
      description: input.description?.trim(),
      image: input.image?.trim() || `https://picsum.photos/seed/${providerType}-${providerId}-${Date.now()}/120`,
      specialtyId: input.specialtyId,
      sellerType: providerType,
      sellerId: providerId,
      manufacturerId: providerType === ProducerType.Manufacturer ? providerId : undefined,
      manufacturer: providerType === ProducerType.Manufacturer ? provider.name : undefined,
      dosage: input.dosage.trim().replace(/\s+/g, ' '),
      packageSize: input.packageSize,
      variant: input.variant,
      form: input.packageSize,
      consumerPrice: roundCurrency(input.consumerPrice),
      discountPercentage: roundCurrency(input.discountPercentage),
      pharmacyPriceAfterDiscount: calculatePharmacistPrice(input.consumerPrice, input.discountPercentage),
      stockQuantity: input.stockQuantity,
      isAvailable: input.isAvailable && input.stockQuantity > 0,
      expiryDate: input.expiryDate?.trim() || undefined,
    };
    this.products = [...this.products, product];
    return { ...product };
  }
  updateProviderProduct(productId: string, input: ProductInput): Product {
    const index = this.products.findIndex((product) => product.id === productId);
    if (index < 0) throw new Error('Product not found');
    const existing = this.products[index];
    if (input.consumerPrice <= 0) throw new Error('Consumer price must be greater than zero');
    if (input.discountPercentage < 0 || input.discountPercentage > 100) throw new Error('Discount must be between 0% and 100%');
    if (!Number.isInteger(input.stockQuantity) || input.stockQuantity < 0) throw new Error('Stock quantity must be zero or greater');
    const duplicate = this.findProviderProductDuplicate(existing.sellerType, existing.sellerId, input.name, input.dosage, productId);
    if (duplicate) throw new Error(`Duplicate product: ${duplicate.name} — ${duplicate.dosage ?? 'No dosage'} already exists for this provider`);
    const updated: Product = {
      ...existing,
      name: input.name.trim().replace(/\s+/g, ' '),
      dosage: input.dosage.trim().replace(/\s+/g, ' '),
      description: input.description?.trim(),
      specialtyId: input.specialtyId,
      consumerPrice: roundCurrency(input.consumerPrice),
      discountPercentage: roundCurrency(input.discountPercentage),
      pharmacyPriceAfterDiscount: calculatePharmacistPrice(input.consumerPrice, input.discountPercentage),
      stockQuantity: input.stockQuantity,
      image: input.image?.trim() || existing.image,
      isAvailable: input.isAvailable,
      expiryDate: input.expiryDate?.trim() || undefined,
    };
    this.products = this.products.map((product) => product.id === productId ? updated : product);
    return { ...updated };
  }
  setProviderProductStatus(productId: string, isAvailable: boolean): Product {
    const index = this.products.findIndex((product) => product.id === productId);
    if (index < 0) throw new Error('Product not found');
    const updated = { ...this.products[index], isAvailable };
    this.products = this.products.map((product) => product.id === productId ? updated : product);
    return updated;
  }

  validateOrderStock(lines: OrderLineSnapshot[]): string[] {
    const errors: string[] = [];
    const productQuantities: { [key: string]: number } = {};

    lines.forEach((line) => {
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        errors.push(`Invalid quantity for ${line.sellerName} — ${line.productName}`);
        return;
      }
      productQuantities[line.productId] = (productQuantities[line.productId] || 0) + line.quantity;
    });

    for (const [productId, quantity] of Object.entries(productQuantities)) {
      const product = this.getProductById(productId);
      if (!product) {
        errors.push(`Product not found: ${productId}`);
        continue;
      }
      if (!product.isAvailable || product.stockQuantity <= 0) {
        errors.push(`${productId}: product is unavailable or out of stock`);
        continue;
      }
      if (product.sellerType === ProducerType.Store && this.getStoreById(product.sellerId)?.status !== 'active') {
        errors.push(`${productId}: store provider is inactive`);
      }
      if (product.sellerType === ProducerType.Manufacturer && this.getFactoryById(product.sellerId)?.status !== 'active') {
        errors.push(`${productId}: manufacturer provider is inactive`);
      }
      if (product.stockQuantity < quantity) {
        errors.push(`${productId}: requested ${quantity}, available ${product.stockQuantity}`);
      }
    }

    return errors;
  }

  approveAndDeductOrderStock(lines: OrderLineSnapshot[]): { success: boolean; errors: string[] } {
    const errors = this.validateOrderStock(lines);
    if (errors.length > 0) return { success: false, errors };

    const quantities: { [productId: string]: number } = {};
    lines.forEach((line) => { quantities[line.productId] = (quantities[line.productId] || 0) + line.quantity; });

    for (const [productId, quantity] of Object.entries(quantities)) {
      const product = this.getProductById(productId);
      if (!product || !Number.isInteger(quantity) || quantity <= 0 || product.stockQuantity < quantity) {
        return { success: false, errors: [`Atomic stock validation failed for ${productId}`] };
      }
    }

    for (const [productId, quantity] of Object.entries(quantities)) this.deductProductStock(productId, quantity);
    return { success: true, errors: [] };
  }

  // Async provider-product methods
  async getProductsByStoreAsync(storeId: string): Promise<Product[]> { return this.getProductsByStore(storeId); }
  async getProductsByManufacturerAsync(manufacturerId: string): Promise<Product[]> { return this.getProductsByManufacturer(manufacturerId); }
  async getProductByIdAsync(productId: string): Promise<Product | undefined> { return this.getProductById(productId); }
  async addProviderProductAsync(providerType: ProducerType, providerId: string, input: ProductInput): Promise<Product> { return this.addProviderProduct(providerType, providerId, input); }
  async updateProviderProductAsync(productId: string, input: ProductInput): Promise<Product> { return this.updateProviderProduct(productId, input); }
  async setProviderProductStatusAsync(productId: string, isAvailable: boolean): Promise<Product> { return this.setProviderProductStatus(productId, isAvailable); }
  async softDeleteProviderProductAsync(productId: string): Promise<void> {
    const product = this.getProductById(productId);
    if (!product) throw new Error('Product not found');
    product.isAvailable = false;
  }
  async findProviderProductDuplicateAsync(providerType: ProducerType, providerId: string, name: string, dosage: string, excludeProductId?: string): Promise<Product | undefined> { return this.findProviderProductDuplicate(providerType, providerId, name, dosage, excludeProductId); }

  // Async methods
  async getStoresAsync(includeInactive?: boolean): Promise<Store[]> {
    return includeInactive ? [...this.stores] : this.stores.filter((store) => store.status === 'active');
  }
  async getActiveStoresAsync(): Promise<Store[]> {
    return this.stores.filter((store) => store.status === 'active');
  }
  async getStoreByIdAsync(storeId: string): Promise<Store | undefined> {
    return this.stores.find((store) => store.id === storeId);
  }
  async addStoreAsync(input: StoreInput): Promise<Store> {
    const store = this.addStore(input);
    return new Promise((resolve) => setTimeout(() => resolve(store), 100));
  }
  async updateStoreAsync(storeId: string, input: StoreInput): Promise<Store> {
    const store = this.updateStore(storeId, input);
    return new Promise((resolve) => setTimeout(() => resolve(store), 100));
  }
  async setStoreStatusAsync(storeId: string, status: 'active' | 'inactive'): Promise<Store> {
    const store = this.setStoreStatus(storeId, status);
    return new Promise((resolve) => setTimeout(() => resolve(store), 100));
  }
  async getFactoriesAsync(includeInactive?: boolean): Promise<Factory[]> {
    return includeInactive ? [...this.factories] : this.factories.filter((factory) => factory.status === 'active');
  }
  async getActiveFactoriesAsync(): Promise<Factory[]> {
    return this.factories.filter((factory) => factory.status === 'active');
  }
  async getFactoryByIdAsync(factoryId: string): Promise<Factory | undefined> {
    return this.factories.find((factory) => factory.id === factoryId);
  }
  async addFactoryAsync(input: ManufacturerInput): Promise<Factory> {
    const factory = this.addFactory(input);
    return new Promise((resolve) => setTimeout(() => resolve(factory), 100));
  }
  async updateFactoryAsync(factoryId: string, input: ManufacturerInput): Promise<Factory> {
    const factory = this.updateFactory(factoryId, input);
    return new Promise((resolve) => setTimeout(() => resolve(factory), 100));
  }
  async setFactoryStatusAsync(factoryId: string, status: 'active' | 'inactive'): Promise<Factory> {
    const factory = this.setFactoryStatus(factoryId, status);
    return new Promise((resolve) => setTimeout(() => resolve(factory), 100));
  }
}

export default function DatabaseModule() { return null; }

const mockDatabase = new MockDatabase();

export const iocContainer = {
  getDatabase: () => mockDatabase,
};

export function normalizeProductName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function normalizeProductDosage(value: string): string {
  return value.trim().replace(/\s+/g, '').replace(/milligrams?/gi, 'mg').replace(/grams?/gi, 'g').replace(/milliliters?/gi, 'ml').toLowerCase();
}

export function normalizeProductKey(name: string, dosage?: string): string {
  return `${normalizeProductName(name)}|${normalizeProductDosage(dosage ?? '')}`;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculatePharmacistPrice(consumerPrice: number, discountPercentage: number): number {
  if (!Number.isFinite(consumerPrice) || consumerPrice <= 0) return 0;
  if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) return 0;
  return roundCurrency(consumerPrice * (1 - discountPercentage / 100));
}

export const LOW_STOCK_THRESHOLD = 5;

export function getStockStatus(stockQuantity: number, isAvailable: boolean): 'available' | 'low-stock' | 'out-of-stock' {
  if (stockQuantity <= 0 || !isAvailable) return 'out-of-stock';
  if (stockQuantity <= LOW_STOCK_THRESHOLD) return 'low-stock';
  return 'available';
}
