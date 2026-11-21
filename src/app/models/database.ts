import {
  ProducerType,
  type Advertisement,
  type CartItem,
  type Factory,
  type ManufacturerProductOffer,
  type Pharmacy,
  type Product,
  type Specialty,
  type Store,
  type StoreProductOffer,
} from './data_types';

export abstract class Database {
  abstract getAdvertisements(): Advertisement[];
  abstract getSpecialties(): Specialty[];
  abstract getSpecialtyById(specialtyId: string): Specialty | undefined;
  abstract getProducts(): Product[];
  abstract getProductsBySpecialty(specialtyId: string): Product[];
  abstract getProductsByStore(storeId: string): Product[];
  abstract getProductsByManufacturer(manufacturerId: string): Product[];
  abstract getStores(): Store[];
  abstract getFactories(): Factory[];
  abstract getPharmacies(): Pharmacy[];
  abstract getProductById(productId: string): Product | undefined;
  abstract getStoreById(storeId: string): Store | undefined;
  abstract getFactoryById(factoryId: string): Factory | undefined;
  abstract getStoreOffers(): StoreProductOffer[];
  abstract getManufacturerOffers(): ManufacturerProductOffer[];
  abstract getStoreOffersByProduct(productId: string): StoreProductOffer[];
  abstract getManufacturerOffersByProduct(productId: string): ManufacturerProductOffer[];
  abstract getStoreOffersByStore(storeId: string): StoreProductOffer[];
  abstract getManufacturerOffersByManufacturer(manufacturerId: string): ManufacturerProductOffer[];
  abstract getStoreOfferById(offerId: string): StoreProductOffer | undefined;
  abstract getManufacturerOfferById(offerId: string): ManufacturerProductOffer | undefined;
  abstract createCartItem(offerType: 'store' | 'manufacturer', offerId: string, quantity?: number): CartItem;
  abstract deductOfferStock(offerType: 'store' | 'manufacturer', offerId: string, quantity: number): void;
}

export class MockDatabase extends Database {
  private readonly specialties: Specialty[] = [
    { id: 'general', name: 'General', description: 'General pharmacy products', image: 'https://picsum.photos/seed/specialty-general/100', isActive: true },
    { id: 'beauty', name: 'Beauty', description: 'Beauty and cosmetic products', image: 'https://picsum.photos/seed/specialty-beauty/100', isActive: true },
  ];

  private readonly stores: Store[] = [
    { id: 'store-1', type: ProducerType.Store, name: 'CityCare Pharmacy', description: 'Full-service pharmacy with home delivery', image: 'https://picsum.photos/seed/store-citycare/100', address: '12 Nile Street, Cairo', phone: '+966 55 123 4400', openHours: '8:00 AM - 10:00 PM', rating: 4.8 },
    { id: 'store-2', type: ProducerType.Store, name: 'Wellness Hub', description: 'Supplements and personal health products', image: 'https://picsum.photos/seed/store-wellness/100', address: '78 Airport Road, Giza', phone: '+966 55 678 1010', openHours: '9:00 AM - 9:00 PM', rating: 4.6 },
  ];

  private readonly factories: Factory[] = [
    { id: 'factory-1', type: ProducerType.Manufacturer, name: 'Prime Pharma Labs', description: 'Manufacturing sterile pharmaceutical products', image: 'https://picsum.photos/seed/factory-prime/100', location: 'Industrial Zone, Jeddah', certification: 'GMP Certified', productionCapacity: '3 million packs / month', phone: '+966 11 888 1234' },
    { id: 'factory-2', type: ProducerType.Manufacturer, name: 'Nova Health Manufacturing', description: 'Medical device and diagnostic production', image: 'https://picsum.photos/seed/factory-nova/100', location: 'Riyadh Tech Park', certification: 'ISO 13485', productionCapacity: '500k units / month', phone: '+966 11 777 0909' },
  ];

  private readonly products: Product[] = [
    { id: 'store-1-prod-1', name: 'Paracetamol', description: 'Pain relief and fever reducer', image: 'https://picsum.photos/seed/paracetamol/100', specialtyId: 'general', sellerType: ProducerType.Store, sellerId: 'store-1', manufacturerId: 'factory-1', manufacturer: 'Prime Pharma', dosage: '500 mg', packageSize: '20 tablets', form: 'tablet', availability: 'available' },
    { id: 'store-1-prod-2', name: 'Amoxicillin', description: 'Broad-spectrum antibiotic', image: 'https://picsum.photos/seed/amoxicillin/100', specialtyId: 'general', sellerType: ProducerType.Store, sellerId: 'store-1', manufacturerId: 'factory-2', manufacturer: 'Nova Health', dosage: '250 mg', packageSize: '12 capsules', form: 'capsule', availability: 'available' },
    { id: 'store-2-prod-1', name: 'Vitamin C', description: 'Daily immunity support', image: 'https://picsum.photos/seed/vitamin-c/100', specialtyId: 'general', sellerType: ProducerType.Store, sellerId: 'store-2', manufacturerId: 'factory-2', manufacturer: 'Wellness Labs', dosage: '1000 mg', packageSize: '30 tablets', form: 'tablet', availability: 'available' },
    { id: 'factory-1-prod-1', name: 'Paracetamol', description: 'Pain relief and fever reducer', image: 'https://picsum.photos/seed/paracetamol/100', specialtyId: 'general', sellerType: ProducerType.Manufacturer, sellerId: 'factory-1', manufacturerId: 'factory-1', manufacturer: 'Prime Pharma', dosage: '500 mg', packageSize: '10 tablets', form: 'tablet', availability: 'available' },
  ];

  private readonly advertisements: Advertisement[] = [
    { id: 'ad-1', title: 'Flash Sale', description: 'Save up to 30% on essential products', image: 'https://picsum.photos/seed/flash-sale/100', backgroundColor: '#208AEF', sortOrder: 1 },
    { id: 'ad-2', title: 'Free Delivery', description: 'Order before 8 PM and get delivery today', image: 'https://picsum.photos/seed/delivery/100', backgroundColor: '#14B8A6', sortOrder: 2 },
  ];

  private readonly pharmacies: Pharmacy[] = [];

  private readonly storeOffers: StoreProductOffer[] = [
    { id: 'store-offer-1', storeId: 'store-1', productId: 'store-1-prod-1', consumerPrice: 30, discountPercentage: 17, pharmacyPriceAfterDiscount: 24.9, stockQuantity: 120, isAvailable: true },
    { id: 'store-offer-2', storeId: 'store-1', productId: 'store-1-prod-2', consumerPrice: 140, discountPercentage: 14, pharmacyPriceAfterDiscount: 120.4, stockQuantity: 42, isAvailable: true },
    { id: 'store-offer-3', storeId: 'store-2', productId: 'store-2-prod-1', consumerPrice: 90, discountPercentage: 11, pharmacyPriceAfterDiscount: 80.1, stockQuantity: 60, isAvailable: true },
  ];

  private readonly manufacturerOffers: ManufacturerProductOffer[] = [
    { id: 'manufacturer-offer-1', manufacturerId: 'factory-1', productId: 'factory-1-prod-1', consumerPrice: 25, discountPercentage: 10, pharmacyPriceAfterDiscount: 22.5, stockQuantity: 220, isAvailable: true },
  ];

  getAdvertisements(): Advertisement[] { return [...this.advertisements].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)); }
  getSpecialties(): Specialty[] { return [...this.specialties]; }
  getSpecialtyById(specialtyId: string): Specialty | undefined { return this.specialties.find((item) => item.id === specialtyId); }
  getProducts(): Product[] { return [...this.products]; }
  getProductsBySpecialty(specialtyId: string): Product[] { return this.products.filter((product) => product.specialtyId === specialtyId); }
  getProductsByStore(storeId: string): Product[] { return this.products.filter((product) => product.sellerType === ProducerType.Store && product.sellerId === storeId); }
  getProductsByManufacturer(manufacturerId: string): Product[] { return this.products.filter((product) => product.sellerType === ProducerType.Manufacturer && product.sellerId === manufacturerId); }
  getStores(): Store[] { return [...this.stores]; }
  getFactories(): Factory[] { return [...this.factories]; }
  getPharmacies(): Pharmacy[] { return [...this.pharmacies]; }
  getProductById(productId: string): Product | undefined { return this.products.find((product) => product.id === productId); }
  getStoreById(storeId: string): Store | undefined { return this.stores.find((store) => store.id === storeId); }
  getFactoryById(factoryId: string): Factory | undefined { return this.factories.find((factory) => factory.id === factoryId); }
  getStoreOffers(): StoreProductOffer[] { return [...this.storeOffers]; }
  getManufacturerOffers(): ManufacturerProductOffer[] { return [...this.manufacturerOffers]; }
  getStoreOffersByProduct(productId: string): StoreProductOffer[] { return this.storeOffers.filter((offer) => offer.productId === productId); }
  getManufacturerOffersByProduct(productId: string): ManufacturerProductOffer[] { return this.manufacturerOffers.filter((offer) => offer.productId === productId); }
  getStoreOffersByStore(storeId: string): StoreProductOffer[] { return this.storeOffers.filter((offer) => offer.storeId === storeId); }
  getManufacturerOffersByManufacturer(manufacturerId: string): ManufacturerProductOffer[] { return this.manufacturerOffers.filter((offer) => offer.manufacturerId === manufacturerId); }
  getStoreOfferById(offerId: string): StoreProductOffer | undefined { return this.storeOffers.find((offer) => offer.id === offerId); }
  getManufacturerOfferById(offerId: string): ManufacturerProductOffer | undefined { return this.manufacturerOffers.find((offer) => offer.id === offerId); }

  createCartItem(offerType: 'store' | 'manufacturer', offerId: string, quantity = 1): CartItem {
    if (offerType === 'store') {
      const offer = this.getStoreOfferById(offerId);
      if (!offer) throw new Error(`Store offer ${offerId} not found`);
      const product = this.getProductById(offer.productId);
      const store = this.getStoreById(offer.storeId);
      if (!product || product.sellerType !== ProducerType.Store || product.sellerId !== offer.storeId || !store) throw new Error('Invalid store offer ownership');
      if (!offer.isAvailable || offer.stockQuantity < quantity) throw new Error('Requested quantity is unavailable');
      return { id: `${offerType}-${offerId}`, offerId, offerType, sellerId: store.id, sellerName: store.name, productId: product.id, quantity, unitPrice: offer.pharmacyPriceAfterDiscount, discountPercentage: offer.discountPercentage, productName: product.name, packageSize: product.packageSize, variant: product.variant, dosage: product.dosage, product, store };
    }

    const offer = this.getManufacturerOfferById(offerId);
    if (!offer) throw new Error(`Manufacturer offer ${offerId} not found`);
    const product = this.getProductById(offer.productId);
    const manufacturer = this.getFactoryById(offer.manufacturerId);
    if (!product || product.sellerType !== ProducerType.Manufacturer || product.sellerId !== offer.manufacturerId || !manufacturer) throw new Error('Invalid manufacturer offer ownership');
    if (!offer.isAvailable || offer.stockQuantity < quantity) throw new Error('Requested quantity is unavailable');
    return { id: `${offerType}-${offerId}`, offerId, offerType, sellerId: manufacturer.id, sellerName: manufacturer.name, productId: product.id, quantity, unitPrice: offer.pharmacyPriceAfterDiscount, discountPercentage: offer.discountPercentage, productName: product.name, packageSize: product.packageSize, variant: product.variant, dosage: product.dosage, product, manufacturer };
  }

  deductOfferStock(offerType: 'store' | 'manufacturer', offerId: string, quantity: number): void {
    if (offerType === 'store') {
      const offer = this.storeOffers.find((item) => item.id === offerId);
      if (!offer || !offer.isAvailable || offer.stockQuantity < quantity) throw new Error('Store stock validation failed');
      offer.stockQuantity -= quantity;
      if (offer.stockQuantity === 0) offer.isAvailable = false;
      return;
    }

    const offer = this.manufacturerOffers.find((item) => item.id === offerId);
    if (!offer || !offer.isAvailable || offer.stockQuantity < quantity) throw new Error('Manufacturer stock validation failed');
    offer.stockQuantity -= quantity;
    if (offer.stockQuantity === 0) offer.isAvailable = false;
  }
}

export default function DatabaseModule() { return null; }

export const iocContainer = {
  getDatabase: () => new MockDatabase(),
};
