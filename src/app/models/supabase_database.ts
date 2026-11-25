import { supabase } from '../../lib/supabase';
import type {
  Factory,
  ManufacturerInput,
  Store,
  StoreInput,
} from './data_types';
import { ProducerType } from './data_types';

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
    };
  }

  async getStores(includeInactive = true): Promise<Store[]> {
    if (!supabase) throw new Error('Supabase is not configured.');
    let query = supabase.from('stores').select('*').is('deleted_at', null).order('name');
    if (!includeInactive) query = query.eq('status', 'active');
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => this.mapStore(row));
  }

  async getStoreById(storeId: string): Promise<Store | undefined> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('stores').select('*').eq('id', storeId).is('deleted_at', null).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? this.mapStore(data) : undefined;
  }

  async addStore(input: StoreInput): Promise<Store> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('stores').insert({
      name: input.name.trim(),
      contact_person: input.contactPerson.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      description: input.description?.trim() || 'No description available',
      image_url: input.image?.trim() || null,
      status: input.status,
    }).select('*').single();
    if (error) throw new Error(error.message);
    return this.mapStore(data);
  }

  async updateStore(storeId: string, input: StoreInput): Promise<Store> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('stores').update({
      name: input.name.trim(),
      contact_person: input.contactPerson.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      description: input.description?.trim() || 'No description available',
      image_url: input.image?.trim() || null,
      status: input.status,
    }).eq('id', storeId).is('deleted_at', null).select('*').single();
    if (error) throw new Error(error.message);
    return this.mapStore(data);
  }

  async setStoreStatus(storeId: string, status: 'active' | 'inactive'): Promise<Store> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('stores').update({ status }).eq('id', storeId).is('deleted_at', null).select('*').single();
    if (error) throw new Error(error.message);
    return this.mapStore(data);
  }

  async getFactories(includeInactive = true): Promise<Factory[]> {
    if (!supabase) throw new Error('Supabase is not configured.');
    let query = supabase.from('manufacturers').select('*').is('deleted_at', null).order('name');
    if (!includeInactive) query = query.eq('status', 'active');
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => this.mapFactory(row));
  }

  async getFactoryById(factoryId: string): Promise<Factory | undefined> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('manufacturers').select('*').eq('id', factoryId).is('deleted_at', null).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? this.mapFactory(data) : undefined;
  }

  async addFactory(input: ManufacturerInput): Promise<Factory> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('manufacturers').insert({
      name: input.name.trim(),
      contact_person: input.contactPerson.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      location: input.address.trim(),
      description: input.description?.trim() || 'No description available',
      image_url: input.image?.trim() || null,
      status: input.status,
    }).select('*').single();
    if (error) throw new Error(error.message);
    return this.mapFactory(data);
  }

  async updateFactory(factoryId: string, input: ManufacturerInput): Promise<Factory> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('manufacturers').update({
      name: input.name.trim(),
      contact_person: input.contactPerson.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      location: input.address.trim(),
      description: input.description?.trim() || 'No description available',
      image_url: input.image?.trim() || null,
      status: input.status,
    }).eq('id', factoryId).is('deleted_at', null).select('*').single();
    if (error) throw new Error(error.message);
    return this.mapFactory(data);
  }

  async setFactoryStatus(factoryId: string, status: 'active' | 'inactive'): Promise<Factory> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.from('manufacturers').update({ status }).eq('id', factoryId).is('deleted_at', null).select('*').single();
    if (error) throw new Error(error.message);
    return this.mapFactory(data);
  }
}

export const supabaseProviderDatabase = new SupabaseProviderDatabase();
