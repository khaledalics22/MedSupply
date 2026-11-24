import { supabase } from '../../lib/supabase';
import type { PasswordChangeInput, ProfileUpdateInput, RegistrationInput, User } from './auth';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function profileToUser(profile: Record<string, unknown>): User {
  return {
    id: String(profile.id),
    fullName: String(profile.full_name ?? ''),
    email: String(profile.email ?? ''),
    phone: profile.phone ? String(profile.phone) : undefined,
    profilePicture: profile.profile_picture ? String(profile.profile_picture) : undefined,
    pharmacyName: profile.pharmacy_name ? String(profile.pharmacy_name) : undefined,
    pharmacyAddress: profile.pharmacy_address ? String(profile.pharmacy_address) : undefined,
    role: profile.role === 'admin' ? 'admin' : 'pharmacist',
    accountStatus: profile.account_status as User['accountStatus'],
    rejectionReason: profile.rejection_reason ? String(profile.rejection_reason) : undefined,
    createdAt: String(profile.created_at ?? new Date().toISOString()),
  };
}

async function getAuthorizedProfile(): Promise<User> {
  if (!supabase) throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error('Unable to restore the Supabase session.');
  const authUser = sessionData.session?.user;
  if (!authUser) throw new Error('You are not signed in.');

  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,email,phone,profile_picture,pharmacy_name,pharmacy_address,role,account_status,rejection_reason,created_at')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) throw new Error('Unable to retrieve your profile.');
  if (!data) throw new Error('Your profile could not be found. Please contact an administrator.');

  const user = profileToUser(data);
  if (user.role === 'admin') return user;
  if (user.accountStatus === 'pending') throw new Error('Your registration is awaiting Admin approval.');
  if (user.accountStatus === 'rejected') throw new Error(user.rejectionReason ? `Registration rejected: ${user.rejectionReason}` : 'Your registration was rejected.');
  if (user.accountStatus === 'inactive') throw new Error('Your pharmacist account is inactive. Please contact an Administrator.');
  if (user.accountStatus !== 'active') throw new Error('Your pharmacist account is not currently active.');
  return user;
}

export class AuthService {
  async register(input: RegistrationInput): Promise<User> {
    if (!supabase) throw new Error('Supabase is not configured.');

    const fullName = input.fullName.trim();
    const email = normalizeEmail(input.email);
    const phone = input.phone.trim();

    if (!fullName || !email || !phone || !input.password || !input.confirmPassword) {
      throw new Error('Please complete all required fields.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Please enter a valid email address.');
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(input.password)) {
      throw new Error('Password must be at least 8 characters and include a letter and number.');
    }
    if (input.password !== input.confirmPassword) throw new Error('Passwords do not match.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          full_name: fullName,
          phone,
          pharmacy_name: input.pharmacyName?.trim() || null,
          pharmacy_address: input.pharmacyAddress?.trim() || null,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        throw new Error('An account with this email already exists.');
      }
      throw new Error(error.message);
    }
    if (!data.user) throw new Error('Registration could not be completed.');

    await supabase.auth.signOut();

    return {
      id: data.user.id,
      fullName,
      email,
      phone,
      pharmacyName: input.pharmacyName?.trim() || undefined,
      pharmacyAddress: input.pharmacyAddress?.trim() || undefined,
      role: 'pharmacist',
      accountStatus: 'pending',
      rejectionReason: undefined,
      accountDecisions: [],
      createdAt: data.user.created_at,
    };
  }

  async login(email: string, password: string): Promise<User> {
    if (!supabase) throw new Error('Supabase is not configured.');

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) throw new Error('Please enter your email and password.');

    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Invalid email or password.' : error.message);

    try {
      return await getAuthorizedProfile();
    } catch (caught) {
      await supabase.auth.signOut();
      throw caught;
    }
  }

  async restoreSession(): Promise<User | null> {
    if (!supabase) return null;

    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;

    try {
      return await getAuthorizedProfile();
    } catch {
      await supabase.auth.signOut();
      return null;
    }
  }

  async logout(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<User> {
    if (!supabase) throw new Error('Supabase is not configured.');

    const user = await getAuthorizedProfile();
    if (user.id !== userId) throw new Error('You can only update your own profile.');

    const fullName = input.fullName.trim();
    const email = normalizeEmail(input.email);
    const phone = input.phone.trim();
    const pharmacyName = input.pharmacyName.trim();
    const pharmacyAddress = input.pharmacyAddress.trim();

    if (!fullName || !email || !phone || !pharmacyName || !pharmacyAddress) {
      throw new Error('Please complete all required profile fields.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Please enter a valid email address.');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) throw new Error('Please enter a valid phone number.');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        email,
        phone,
        profile_picture: input.profilePicture?.trim() || null,
        pharmacy_name: pharmacyName,
        pharmacy_address: pharmacyAddress,
      })
      .eq('id', userId)
      .select('id,full_name,email,phone,profile_picture,pharmacy_name,pharmacy_address,role,account_status,rejection_reason,created_at')
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Profile not found.');
    return profileToUser(data);
  }

  async changePassword(userId: string, input: PasswordChangeInput): Promise<void> {
    if (!supabase) throw new Error('Supabase is not configured.');

    const user = await getAuthorizedProfile();
    if (user.id !== userId) throw new Error('You can only change your own password.');
    if (!input.currentPassword || !input.newPassword || !input.confirmPassword) {
      throw new Error('Please complete all password fields.');
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(input.newPassword)) {
      throw new Error('New password must be at least 8 characters and include a letter and number.');
    }
    if (input.newPassword !== input.confirmPassword) throw new Error('New passwords do not match.');

    const { error } = await supabase.auth.updateUser({
      password: input.newPassword,
      email: user.email,
    });

    if (error) throw new Error(error.message);
  }

  async getPharmacists(): Promise<User[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name,email,phone,profile_picture,pharmacy_name,pharmacy_address,role,account_status,rejection_reason,created_at')
      .eq('role', 'pharmacist')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((profile) => profileToUser(profile));
  }

  async setPharmacistStatus(userId: string, status: 'active' | 'rejected' | 'inactive', reason?: string): Promise<User> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const admin = await getAuthorizedProfile();
    if (admin.role !== 'admin') throw new Error('Only an Administrator can change pharmacist status.');
    if (status === 'rejected' && !reason?.trim()) throw new Error('A rejection reason is required.');

    const { data, error } = await supabase
      .from('profiles')
      .update({ account_status: status, rejection_reason: status === 'rejected' ? reason?.trim() : null })
      .eq('id', userId)
      .eq('role', 'pharmacist')
      .select('id,full_name,email,phone,profile_picture,pharmacy_name,pharmacy_address,role,account_status,rejection_reason,created_at')
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Pharmacist not found.');

    await supabase.from('account_decisions').insert({
      profile_id: userId,
      status: status === 'active' ? 'approved' : status,
      reason: status === 'rejected' ? reason?.trim() : null,
    });

    return profileToUser(data);
  }
}

export const authService = new AuthService();
