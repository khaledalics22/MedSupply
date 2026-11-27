import { supabase } from '../../lib/supabase';
import type {
  Factory,
  ManufacturerInput,
  Product,
  ProductInput,
  Store,
  StoreInput,
  Specialty,
  OrderCreationItem,
  OrderCreationResult,
  OrderActionResult,
  Order,
  OrderLineSnapshot,
} from './data_types';
import { ProducerType } from './data_types';
import { calculatePharmacistPrice } from './database';

export class SupabaseProviderDatabase {
  private mapStore(row: Record<string, unknown>): Store {
    return {
      id: String(row.id),
      type: ProducerType.Store,
      name: String(row.name ?? ''),
      description: String(row.description ?? 'No description available'),
      image: String(row.image_url ?? `https://picsum.photos/seed/store-${row.id}/100`),
      address: row.address ? String(row.address) : undefined,
      location: row.location ? row.location as string : undefined,
      phone: String(row.phone ?? ''),
      contactPerson: String(row.contact_person ?? ''),
      status: row.status === 'inactive' ? 'inactive' : 'active',
      openHours: row.open_hours ? String(row.open_hours) : 'Not specified',
      rating: row.rating === null || row.rating === undefined ? 0 : Number(row.rating),
      minimumOrderValue: row.minimum_order_value == null ? 0 : Number(row.minimum_order_value),
    };
  }

  private mapFactory(row: Record<string, unknown>): Factory {
    return {
      id: String(row.id),
      type: ProducerType.Manufacturer,
      name: String(row.name ?? ''),
      description: String(row.description ?? 'No description available'),
      image: String(row.image_url ?? `https://picsum.photos/seed/factory-${row.id}/100`),
      address: row.address ? String(row.address) : undefined,
      location: row.location ? row.location as string : row.address ? String(row.address) : undefined,
      phone: String(row.phone ?? ''),
      contactPerson: String(row.contact_person ?? ''),
      certification: String(row.certification ?? 'Pending'),
      productionCapacity: String(row.production_capacity ?? 'Not specified'),
      status: row.status === 'inactive' ? 'inactive' : 'active',
      minimumOrderValue: row.minimum_order_value == null ? 0 : Number(row.minimum_order_value),
    };
  }

  private mapProduct(row: Record<string, unknown>): Product {
    const consumerPrice = Number(row.consumer_price ?? 0);
    const discount = Number(row.discount_percentage ?? 0);
    const pharmacyPrice = row.pharmacist_price_after_discount == null ? calculatePharmacistPrice(consumerPrice, discount) : Number(row.pharmacist_price_after_discount);
    return {
      id: String(row.id), name: String(row.name ?? ''), description: row.description ? String(row.description) : undefined,
      image: row.image_url ? String(row.image_url) : undefined, specialtyId: String(row.specialty_id ?? 'general'),
      sellerType: row.store_id ? ProducerType.Store : ProducerType.Manufacturer,
      sellerId: row.store_id ? String(row.store_id) : String(row.manufacturer_id),
      manufacturerId: row.source_manufacturer_id ? String(row.source_manufacturer_id) : undefined,
      manufacturer: row.source_manufacturer_name ? String(row.source_manufacturer_name) : undefined,
      dosage: row.dosage ? String(row.dosage) : undefined, packageSize: row.package_size ? String(row.package_size) : undefined,
      variant: row.variant ? String(row.variant) : undefined, barcode: row.barcode ? String(row.barcode) : undefined,
      expiryDate: row.expiry_date ? String(row.expiry_date) : undefined,
      consumerPrice, discountPercentage: discount, pharmacyPriceAfterDiscount: pharmacyPrice,
      stockQuantity: Number(row.stock_quantity ?? 0), isAvailable: Boolean(row.is_available),
    };
  }

  private mapOrder(row: Record<string, unknown>): Order {
    const items: OrderLineSnapshot[] = [];
    const groups = Array.isArray(row.order_provider_groups) ? row.order_provider_groups : [];
    const profileData = row.profiles;
    const profile = Array.isArray(profileData) ? profileData[0] as Record<string, unknown> : profileData as Record<string, unknown> | undefined;

    for (const rawGroup of groups) {
      const group = rawGroup as Record<string, unknown>;
      const itemRows = Array.isArray(group.order_items) ? group.order_items : [];
      for (const rawItem of itemRows) {
        const item = rawItem as Record<string, unknown>;
        items.push({
          productId: item.product_id ? String(item.product_id) : '',
          productName: String(item.product_name ?? ''),
          dosage: item.dosage ? String(item.dosage) : undefined,
          packageSize: item.package_size ? String(item.package_size) : undefined,
          variant: item.variant ? String(item.variant) : undefined,
          sellerId: String(group.store_id ?? group.manufacturer_id ?? ''),
          sellerName: String(group.provider_name ?? 'Unknown provider'),
          sellerType: String(group.provider_type) === 'store' ? 'store' : 'manufacturer',
          unitPrice: Number(item.final_unit_price ?? 0),
          discountPercentage: Number(item.discount_percentage ?? 0),
          quantity: Number(item.quantity ?? 0),
          lineTotal: Number(item.line_subtotal_after_discount ?? 0),
          consumerPrice: Number(item.consumer_unit_price ?? 0),
          pharmacyPriceAfterDiscount: Number(item.final_unit_price ?? 0),
          specialtyName: item.specialty_name ? String(item.specialty_name) : undefined,
          minimumOrderValueSnapshot: Number(group.minimum_order_value_snapshot ?? 0),
        });
      }
    }

    return {
      id: String(row.id),
      customerName: profile?.full_name ? String(profile.full_name) : undefined,
      pharmacistId: String(row.pharmacist_id),
      pharmacyName: profile?.pharmacy_name ? String(profile.pharmacy_name) : undefined,
      pharmacistEmail: profile?.email ? String(profile.email) : undefined,
      pharmacistPhone: profile?.phone ? String(profile.phone) : undefined,
      items,
      totalItems: Number(row.total_quantity ?? 0),
      subtotalAmount: row.subtotal_amount == null ? undefined : Number(row.subtotal_amount),
      lineCount: row.line_count == null ? undefined : Number(row.line_count),
      totalDiscount: Number(row.discount_amount ?? 0),
      totalPrice: Number(row.total_amount ?? 0),
      status: String(row.status) as Order['status'],
      createdAt: String(row.created_at ?? ''),
      rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
      approvedAt: row.approved_at ? String(row.approved_at) : undefined,
      rejectedAt: row.rejected_at ? String(row.rejected_at) : undefined,
      completedAt: row.completed_at ? String(row.completed_at) : undefined,
      stockDeducted: Boolean(row.stock_deducted),
    };
  }

  private mapOrderActionResult(data: unknown, expectedStatus: 'approved' | 'rejected' | 'completed'): OrderActionResult {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Supabase did not return a valid order action result.');
    }
    const result = data as Record<string, unknown>;
    const orderId = typeof result.order_id === 'string' ? result.order_id.trim() : '';
    const status = result.status;
    if (!orderId) throw new Error('Supabase did not return a valid order ID.');
    if (status !== expectedStatus) throw new Error(`Unexpected order action status: ${String(status)}.`);
    return { orderId, status: expectedStatus };
  }

  async getProductsByStore(storeId: string): Promise<Product[]> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('provider_products').select('*').eq('store_id', storeId).is('deleted_at', null).order('name');
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return (data ?? []).map((row) => this.mapProduct(row));
  }

  async getProductsByManufacturer(manufacturerId: string): Promise<Product[]> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('provider_products').select('*').eq('manufacturer_id', manufacturerId).is('deleted_at', null).order('name');
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return (data ?? []).map((row) => this.mapProduct(row));
  }

  async getProductById(productId: string): Promise<Product | undefined> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('provider_products').select('*').eq('id', productId).is('deleted_at', null).maybeSingle();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return data ? this.mapProduct(data) : undefined;
  }

  async addProviderProduct(providerType: ProducerType, providerId: string, input: ProductInput): Promise<Product> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const duplicate = await this.findProviderProductDuplicate(providerType, providerId, input.name, input.dosage);
    if (duplicate) throw new Error(`Duplicate product: ${duplicate.name} — ${duplicate.dosage ?? 'No dosage'} already exists for this provider`);
    const payload: Record<string, unknown> = {
      store_id: providerType === ProducerType.Store ? providerId : null,
      manufacturer_id: providerType === ProducerType.Manufacturer ? providerId : null,
      specialty_id: await this.resolveSpecialtyId(input.specialtyId),
      name: input.name.trim().replace(/\s+/g, ' '), description: input.description?.trim() || null,
      image_url: input.image?.trim() || null, dosage: input.dosage.trim().replace(/\s+/g, ' '),
      package_size: input.packageSize ?? null, variant: input.variant ?? null, expiry_date: input.expiryDate?.trim() || null,
      consumer_price: Number(input.consumerPrice), discount_percentage: Number(input.discountPercentage),
      stock_quantity: Number(input.stockQuantity), is_available: input.isAvailable,
    };
    const { data, error } = await client.from('provider_products').insert(payload).select('*').single();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    if (!data) throw new Error('Supabase did not return the created product.');
    return this.mapProduct(data);
  }

  async updateProviderProduct(productId: string, input: ProductInput): Promise<Product> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const current = await this.getProductById(productId);
    if (!current) throw new Error('Product not found');
    const duplicate = await this.findProviderProductDuplicate(current.sellerType, current.sellerId, input.name, input.dosage, productId);
    if (duplicate) throw new Error(`Duplicate product: ${duplicate.name} — ${duplicate.dosage ?? 'No dosage'} already exists for this provider`);
    const { data, error } = await client.from('provider_products').update({
      specialty_id: await this.resolveSpecialtyId(input.specialtyId), name: input.name.trim().replace(/\s+/g, ' '),
      description: input.description?.trim() || null, image_url: input.image?.trim() || null,
      dosage: input.dosage.trim().replace(/\s+/g, ' '), package_size: input.packageSize ?? null,
      variant: input.variant ?? null, expiry_date: input.expiryDate?.trim() || null,
      consumer_price: Number(input.consumerPrice), discount_percentage: Number(input.discountPercentage),
      stock_quantity: Number(input.stockQuantity), is_available: input.isAvailable,
    }).eq('id', productId).is('deleted_at', null).select('*').single();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    if (!data) throw new Error('Supabase did not return the updated product.');
    return this.mapProduct(data);
  }

  async setProviderProductStatus(productId: string, isAvailable: boolean): Promise<Product> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('provider_products').update({ is_available: isAvailable }).eq('id', productId).is('deleted_at', null).select('*').single();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    if (!data) throw new Error('Supabase did not return the updated product.');
    return this.mapProduct(data);
  }

  async softDeleteProviderProduct(productId: string): Promise<void> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { error } = await client.from('provider_products').update({ deleted_at: new Date().toISOString(), is_available: false }).eq('id', productId).is('deleted_at', null);
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
  }

  async findProviderProductDuplicate(providerType: ProducerType, providerId: string, name: string, dosage: string, excludeProductId?: string): Promise<Product | undefined> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    let query = client.from('provider_products').select('*').is('deleted_at', null).eq(providerType === ProducerType.Store ? 'store_id' : 'manufacturer_id', providerId);
    if (excludeProductId) query = query.neq('id', excludeProductId);
    const { data, error } = await query;
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    const normalizedName = name.trim().replace(/\s+/g, ' ').toLowerCase();
    const normalizedDosage = dosage.trim().replace(/\s+/g, '').replace(/milligrams?/gi, 'mg').replace(/grams?/gi, 'g').replace(/milliliters?/gi, 'ml').toLowerCase();
    const match = (data ?? []).find((row) => {
      const rowName = String(row.name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
      const rowDosage = String(row.dosage ?? '').trim().replace(/\s+/g, '').replace(/milligrams?/gi, 'mg').replace(/grams?/gi, 'g').replace(/milliliters?/gi, 'ml').toLowerCase();
      return rowName === normalizedName && rowDosage === normalizedDosage;
    });
    return match ? this.mapProduct(match) : undefined;
  }

  async getStores(includeInactive = true): Promise<Store[]> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    let query = client.from('stores').select('*').is('deleted_at', null).order('name');
    if (!includeInactive) query = query.eq('status', 'active');
    const { data, error } = await query;
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return (data ?? []).map((row) => this.mapStore(row));
  }

  async getStoreById(storeId: string): Promise<Store | undefined> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('stores').select('*').eq('id', storeId).is('deleted_at', null).maybeSingle();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return data ? this.mapStore(data) : undefined;
  }

  async addStore(input: StoreInput): Promise<Store> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('stores').insert({
      name: input.name.trim(), description: input.description?.trim() || null,
      image_url: input.image?.trim() || null, address: input.address.trim(),
      phone: input.phone.trim(), contact_person: input.contactPerson.trim(), status: input.status,
      minimum_order_value: input.minimumOrderValue,
    }).select('*').single();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    if (!data) throw new Error('Supabase did not return the created store.');
    return this.mapStore(data);
  }

  async updateStore(storeId: string, input: StoreInput): Promise<Store> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('stores').update({
      name: input.name.trim(), description: input.description?.trim() || null,
      image_url: input.image?.trim() || null, address: input.address.trim(),
      phone: input.phone.trim(), contact_person: input.contactPerson.trim(), status: input.status,
      minimum_order_value: input.minimumOrderValue,
    }).eq('id', storeId).is('deleted_at', null).select('*').single();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    if (!data) throw new Error('Supabase did not return the updated store.');
    return this.mapStore(data);
  }

  async setStoreStatus(storeId: string, status: 'active' | 'inactive'): Promise<Store> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('stores').update({ status }).eq('id', storeId).is('deleted_at', null).select('*').single();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    if (!data) throw new Error('Supabase did not return the updated store.');
    return this.mapStore(data);
  }

  async getFactories(includeInactive = true): Promise<Factory[]> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    let query = client.from('manufacturers').select('*').is('deleted_at', null).order('name');
    if (!includeInactive) query = query.eq('status', 'active');
    const { data, error } = await query;
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return (data ?? []).map((row) => this.mapFactory(row));
  }

  async getFactoryById(factoryId: string): Promise<Factory | undefined> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('manufacturers').select('*').eq('id', factoryId).is('deleted_at', null).maybeSingle();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return data ? this.mapFactory(data) : undefined;
  }

  async addFactory(input: ManufacturerInput): Promise<Factory> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('manufacturers').insert({
      name: input.name.trim(), description: input.description?.trim() || null,
      image_url: input.image?.trim() || null, address: input.address.trim(),
      phone: input.phone.trim(), contact_person: input.contactPerson.trim(), status: input.status,
      minimum_order_value: input.minimumOrderValue,
    }).select('*').single();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    if (!data) throw new Error('Supabase did not return the created manufacturer.');
    return this.mapFactory(data);
  }

  async updateFactory(factoryId: string, input: ManufacturerInput): Promise<Factory> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('manufacturers').update({
      name: input.name.trim(), description: input.description?.trim() || null,
      image_url: input.image?.trim() || null, address: input.address.trim(),
      phone: input.phone.trim(), contact_person: input.contactPerson.trim(), status: input.status,
      minimum_order_value: input.minimumOrderValue,
    }).eq('id', factoryId).is('deleted_at', null).select('*').single();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    if (!data) throw new Error('Supabase did not return the updated manufacturer.');
    return this.mapFactory(data);
  }

  async setFactoryStatus(factoryId: string, status: 'active' | 'inactive'): Promise<Factory> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('manufacturers').update({ status }).eq('id', factoryId).is('deleted_at', null).select('*').single();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    if (!data) throw new Error('Supabase did not return the updated manufacturer.');
    return this.mapFactory(data);
  }

  private async resolveSpecialtyId(specialtyId: string): Promise<string> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(specialtyId)) {
      const { data, error } = await client.from('specialties').select('id').eq('id', specialtyId).maybeSingle();
      if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
      if (data) return String(data.id);
    }

    const { data, error } = await client.from('specialties').select('id').eq('legacy_id', specialtyId).maybeSingle();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    if (!data) throw new Error(`Unknown specialty: ${specialtyId}. Run the specialty seed migration first.`);
    return String(data.id);
  }

  async getSpecialties(): Promise<Specialty[]> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('specialties').select('id, legacy_id, name, description, image_url, is_active').eq('is_active', true).order('name');
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: String(row.id), legacyId: row.legacy_id ? String(row.legacy_id) : undefined,
      name: String(row.name ?? ''), description: String(row.description ?? ''),
      image: String(row.image_url ?? ''), isActive: Boolean(row.is_active),
    }));
  }

  async getSpecialtyById(specialtyId: string): Promise<Specialty | undefined> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(specialtyId);
    const column = isUuid ? 'id' : 'legacy_id';
    const { data, error } = await client.from('specialties').select('id, legacy_id, name, description, image_url, is_active').eq(column, specialtyId).maybeSingle();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return data ? {
      id: String(data.id), legacyId: data.legacy_id ? String(data.legacy_id) : undefined,
      name: String(data.name ?? ''), description: String(data.description ?? ''),
      image: String(data.image_url ?? ''), isActive: Boolean(data.is_active),
    } : undefined;
  }

  async getAvailableProducts(): Promise<Product[]> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const [activeStores, activeManufacturers, productResult] = await Promise.all([
      this.getStores(false),
      this.getFactories(false),
      client.from('provider_products').select('*').eq('is_available', true).gt('stock_quantity', 0).is('deleted_at', null).order('name'),
    ]);
    if (productResult.error) throw new Error(`${productResult.error.code ?? 'DB_ERROR'}: ${productResult.error.message}`);
    const storeIds = new Set(activeStores.map((store) => store.id));
    const manufacturerIds = new Set(activeManufacturers.map((manufacturer) => manufacturer.id));
    return (productResult.data ?? [])
      .filter((row) => row.store_id ? storeIds.has(String(row.store_id)) : manufacturerIds.has(String(row.manufacturer_id)))
      .map((row) => this.mapProduct(row));
  }

  async getProductsBySpecialty(specialtyId: string): Promise<Product[]> {
    const specialty = await this.getSpecialtyById(specialtyId);
    if (!specialty) return [];
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('provider_products').select('*').eq('specialty_id', specialty.id).is('deleted_at', null).order('name');
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    const [activeStores, activeManufacturers] = await Promise.all([this.getStores(false), this.getFactories(false)]);
    const storeIds = new Set(activeStores.map((store) => store.id));
    const manufacturerIds = new Set(activeManufacturers.map((manufacturer) => manufacturer.id));
    return (data ?? [])
      .filter((row) => row.store_id ? storeIds.has(String(row.store_id)) : manufacturerIds.has(String(row.manufacturer_id)))
      .map((row) => this.mapProduct(row));
  }

  async getAllOrdersAsync(): Promise<Order[]> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('orders').select('*, profiles:pharmacist_id(full_name, pharmacy_name, email), order_provider_groups(*, order_items(*))').order('created_at', { ascending: false });
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return (data ?? []).map((row) => this.mapOrder(row));
  }

  async getOwnOrdersAsync(pharmacistId: string): Promise<Order[]> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client
      .from('orders')
      .select('*, profiles:pharmacist_id(full_name, pharmacy_name, email), order_provider_groups(*, order_items(*))')
      .eq('pharmacist_id', pharmacistId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return (data ?? []).map((row) => this.mapOrder(row)).filter((order) => order.pharmacistId === pharmacistId);
  }

  async getOrderByIdAsync(orderId: string): Promise<Order | undefined> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.from('orders').select('*, profiles:pharmacist_id(full_name, pharmacy_name, email), order_provider_groups(*, order_items(*))').eq('id', orderId).maybeSingle();
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return data ? this.mapOrder(data) : undefined;
  }

  async createOrderAsync(items: OrderCreationItem[]): Promise<OrderCreationResult> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');

    const payload = items.map((item) => ({ product_id: item.productId, quantity: item.quantity }));
    const { data, error } = await client.rpc('create_order', { order_items_input: payload });

    console.log('[MedSupply create_order] RPC response', {
      hasError: Boolean(error),
      errorCode: error?.code,
      errorMessage: error?.message,
      hasData: data != null,
      dataType: Array.isArray(data) ? 'array' : typeof data,
      dataKeys: data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : [],
      returnedOrderId: data && typeof data === 'object' && 'order_id' in data ? data.order_id : null,
    });

    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    if (!data) throw new Error('Supabase did not return an order creation result.');

    return {
      orderId: String(data.order_id),
      totalQuantity: Number(data.total_quantity),
      lineCount: Number(data.line_count),
      subtotalAmount: Number(data.subtotal_amount),
      discountAmount: Number(data.discount_amount),
      totalAmount: Number(data.total_amount),
      status: 'pending',
    };
  }

  async approveOrderAsync(orderId: string): Promise<OrderActionResult> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.rpc('approve_order', { target_order_id: orderId });
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return this.mapOrderActionResult(data, 'approved');
  }

  async rejectOrderAsync(orderId: string): Promise<OrderActionResult> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.rpc('reject_order', { target_order_id: orderId });
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return this.mapOrderActionResult(data, 'rejected');
  }

  async completeOrderAsync(orderId: string): Promise<OrderActionResult> {
    const client = supabase;
    if (!client) throw new Error('Supabase is not configured.');
    const { data, error } = await client.rpc('complete_order', { target_order_id: orderId });
    if (error) throw new Error(`${error.code ?? 'DB_ERROR'}: ${error.message}`);
    return this.mapOrderActionResult(data, 'completed');
  }
}

export const supabaseProviderDatabase = new SupabaseProviderDatabase();
