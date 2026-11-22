import {
  ProducerType,
  type Advertisement,
  type CartItem,
  type Factory,
  type Pharmacy,
  type Product,
  type Specialty,
  type Store,
} from './data_types';

export abstract class Database {
  abstract getAdvertisements(): Advertisement[];
  abstract getSpecialties(): Specialty[];
  abstract getSpecialtyById(specialtyId: string): Specialty | undefined;
  abstract getProducts(): Product[];
  abstract getAvailableProducts(): Product[];
  abstract getProductsBySpecialty(specialtyId: string): Product[];
  abstract getProductsByStore(storeId: string): Product[];
  abstract getProductsByManufacturer(manufacturerId: string): Product[];
  abstract getStores(): Store[];
  abstract getFactories(): Factory[];
  abstract getPharmacies(): Pharmacy[];
  abstract getProductById(productId: string): Product | undefined;
  abstract getStoreById(storeId: string): Store | undefined;
  abstract getFactoryById(factoryId: string): Factory | undefined;
  abstract getBestPriceProducts(): Product[];
  abstract createCartItem(productId: string, quantity?: number): CartItem;
  abstract deductProductStock(productId: string, quantity: number): void;
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

  private readonly stores: Store[] = [
    { id: 'store-1', type: ProducerType.Store, name: 'العزبي', description: 'صيدلية متكاملة توصل الأدوية والمستلزمات', image: 'https://picsum.photos/seed/store-azaby/100', address: '12 شارع النيل، القاهرة', phone: '+20 2 1234 4400', openHours: '8:00 ص - 12:00 م', rating: 4.8 },
    { id: 'store-2', type: ProducerType.Store, name: 'الشفاء', description: 'مكملات ومنتجات صحية وعناية يومية', image: 'https://picsum.photos/seed/store-shifa/100', address: '78 طريق المطار، الجيزة', phone: '+20 2 2345 1010', openHours: '9:00 ص - 11:00 م', rating: 4.6 },
    { id: 'store-3', type: ProducerType.Store, name: 'الصحة', description: 'أدوية ومستحضرات عناية ومستلزمات طبية', image: 'https://picsum.photos/seed/store-seha/100', address: '45 شارع التحرير، القاهرة', phone: '+20 2 3456 5678', openHours: '8:00 ص - 12:00 م', rating: 4.7 },
    { id: 'store-4', type: ProducerType.Store, name: 'الدواء', description: 'منتجات عشبية وطبيعية ومستلزمات منزلية', image: 'https://picsum.photos/seed/store-dawa/100', address: '23 شارع المسيد، الرياض', phone: '+966 55 345 6789', openHours: '9:00 ص - 10:00 م', rating: 4.5 },
  ];

  private readonly factories: Factory[] = [
    { id: 'factory-1', type: ProducerType.Manufacturer, name: 'فارما إيجيبت', description: 'إنتاج الأدوية الصيدلية والمعلبات', image: 'https://picsum.photos/seed/factory-farma-egypt/100', location: 'المنطقة الصناعية، العاشر', certification: 'GMP', productionCapacity: '3 مليون عبوة شهرياً', phone: '+20 55 888 1234' },
    { id: 'factory-2', type: ProducerType.Manufacturer, name: 'نوفا هيلث', description: 'إنتاج المكملات والمنتجات الصحية', image: 'https://picsum.photos/seed/factory-nova-health/100', location: 'مدينة التقنية، الرياض', certification: 'ISO 13485', productionCapacity: '500 ألف وحدة شهرياً', phone: '+966 11 777 0909' },
    { id: 'factory-3', type: ProducerType.Manufacturer, name: 'هيلث لابز', description: 'أجهزة قياس ومستلزمات طبية', image: 'https://picsum.photos/seed/factory-health-labs/100', location: 'المنطقة الصناعية، القاهرة', certification: 'ISO 9001', productionCapacity: '1 مليون وحدة شهرياً', phone: '+20 11 666 1122' },
  ];

  private readonly products: Product[] = [
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
  getSpecialtyById(specialtyId: string): Specialty | undefined { return this.specialties.find((item) => item.id === specialtyId); }
  getProducts(): Product[] { return [...this.products]; }
  getAvailableProducts(): Product[] { return this.products.filter((product) => product.isAvailable && product.stockQuantity > 0); }
  getProductsBySpecialty(specialtyId: string): Product[] { return this.products.filter((product) => product.specialtyId === specialtyId); }
  getProductsByStore(storeId: string): Product[] { return this.products.filter((product) => product.sellerType === ProducerType.Store && product.sellerId === storeId); }
  getProductsByManufacturer(manufacturerId: string): Product[] { return this.products.filter((product) => product.sellerType === ProducerType.Manufacturer && product.sellerId === manufacturerId); }
  getStores(): Store[] { return [...this.stores]; }
  getFactories(): Factory[] { return [...this.factories]; }
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
    };
  }

  deductProductStock(productId: string, quantity: number): void {
    const product = this.getProductById(productId);
    if (!product || !product.isAvailable || product.stockQuantity < quantity) throw new Error('Product stock validation failed');
    product.stockQuantity -= quantity;
    if (product.stockQuantity === 0) product.isAvailable = false;
  }
}

export default function DatabaseModule() { return null; }

export const iocContainer = {
  getDatabase: () => new MockDatabase(),
};
