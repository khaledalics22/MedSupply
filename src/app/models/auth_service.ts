import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthAccount, PasswordChangeInput, ProfileUpdateInput, RegistrationInput, User } from './auth';

const ACCOUNTS_KEY = 'medsupply.auth.accounts.v1';
const SESSION_KEY = 'medsupply.auth.session.v1';

const ADMIN: AuthAccount = {
  user: {
    id: 'admin-1',
    fullName: 'MedSupply Admin',
    email: 'admin@medsupply.app',
    phone: '+20 100 000 0000',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  passwordHash: mockHash('Admin123!'),
};

function mockHash(value: string): string {
  // Development-only non-reversible mock hash. Replace with secure backend hashes.
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `mock-${(hash >>> 0).toString(16)}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class AuthService {
  async getStoredAccounts(): Promise<AuthAccount[]> {
    const stored = await AsyncStorage.getItem(ACCOUNTS_KEY);
    if (!stored) return [ADMIN];

    try {
      const accounts = JSON.parse(stored) as AuthAccount[];
      const hasAdmin = accounts.some((account) => account.user.role === 'admin');
      return hasAdmin ? accounts : [ADMIN, ...accounts];
    } catch {
      return [ADMIN];
    }
  }

  async register(input: RegistrationInput): Promise<User> {
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

    const accounts = await this.getStoredAccounts();
    const existing = accounts.find((account) => account.user.role === 'pharmacist' && normalizeEmail(account.user.email) === email);
    if (existing) {
      const status = existing.user.accountStatus;
      if (status === 'pending') throw new Error('A registration with this email is awaiting Admin approval.');
      if (status === 'active') throw new Error('An active account with this email already exists.');
      if (status === 'inactive') throw new Error('This account is inactive. Please contact an Admin.');
    }

    const user: User = {
      id: `pharmacist-${Date.now()}`,
      fullName,
      email,
      phone,
      pharmacyName: input.pharmacyName?.trim() || undefined,
      pharmacyAddress: input.pharmacyAddress?.trim() || undefined,
      accountStatus: 'pending',
      accountDecisions: [],
      role: 'pharmacist',
      createdAt: new Date().toISOString(),
    };

    const nextAccounts: AuthAccount[] = [
      ...accounts.filter((account) => account.user.role !== 'admin'),
      { user, passwordHash: mockHash(input.password) },
    ];

    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts));
    return user;
  }

  async login(email: string, password: string): Promise<User> {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) throw new Error('Please enter your email and password.');

    const accounts = await this.getStoredAccounts();
    const account = accounts.find((item) => normalizeEmail(item.user.email) === normalizedEmail);
    if (!account || account.passwordHash !== mockHash(password)) {
      throw new Error('Invalid email or password.');
    }

    if (account.user.role === 'pharmacist') {
      const status = account.user.accountStatus ?? 'active';
      if (status === 'pending') throw new Error('Your registration is awaiting Admin approval.');
      if (status === 'rejected') throw new Error(account.user.rejectionReason ? `Registration rejected: ${account.user.rejectionReason}` : 'Your registration was rejected.');
      if (status === 'inactive') throw new Error('This pharmacist account is inactive. Please contact an Admin.');
      if (status !== 'active') throw new Error('This pharmacist account is not currently active.');
    }

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(account.user));
    return account.user;
  }

  async restoreSession(): Promise<User | null> {
    const stored = await AsyncStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    try {
      const user = JSON.parse(stored) as User;
      if ((user.role !== 'pharmacist' && user.role !== 'admin') || !user.id) return null;
      if (user.role === 'pharmacist' && user.accountStatus !== 'active') {
        await AsyncStorage.removeItem(SESSION_KEY);
        return null;
      }
      return user;
    } catch {
      await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
  }

  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<User> {
    const fullName = input.fullName.trim();
    const email = normalizeEmail(input.email);
    const phone = input.phone.trim();
    const pharmacyName = input.pharmacyName.trim();
    const pharmacyAddress = input.pharmacyAddress.trim();

    if (!fullName || !email || !phone || !pharmacyName || !pharmacyAddress) throw new Error('Please complete all required profile fields.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Please enter a valid email address.');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) throw new Error('Please enter a valid phone number.');

    const accounts = await this.getStoredAccounts();
    if (accounts.some((account) => account.user.id !== userId && normalizeEmail(account.user.email) === email)) throw new Error('This email is already used by another account.');

    const accountIndex = accounts.findIndex((account) => account.user.id === userId);
    if (accountIndex < 0) throw new Error('Account not found.');

    const updatedUser: User = {
      ...accounts[accountIndex].user,
      fullName,
      email,
      phone,
      profilePicture: input.profilePicture?.trim() || undefined,
      pharmacyName,
      pharmacyAddress,
    };

    const updatedAccounts = accounts.map((account) => account.user.id === userId ? { ...account, user: updatedUser } : account);
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));

    const session = await AsyncStorage.getItem(SESSION_KEY);
    if (session) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }

  async changePassword(userId: string, input: PasswordChangeInput): Promise<void> {
    if (!input.currentPassword || !input.newPassword || !input.confirmPassword) throw new Error('Please complete all password fields.');
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(input.newPassword)) throw new Error('New password must be at least 8 characters and include a letter and number.');
    if (input.newPassword !== input.confirmPassword) throw new Error('New passwords do not match.');

    const accounts = await this.getStoredAccounts();
    const account = accounts.find((item) => item.user.id === userId);
    if (!account) throw new Error('Account not found.');
    if (account.passwordHash !== mockHash(input.currentPassword)) throw new Error('The current password is incorrect.');

    const updatedAccounts = accounts.map((item) => item.user.id === userId ? { ...item, passwordHash: mockHash(input.newPassword) } : item);
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
  }

  async getPharmacists(): Promise<User[]> {
    const accounts = await this.getStoredAccounts();
    return accounts.filter((account) => account.user.role === 'pharmacist').map((account) => account.user);
  }

  async setPharmacistStatus(userId: string, status: 'active' | 'rejected' | 'inactive', reason?: string): Promise<User> {
    const accounts = await this.getStoredAccounts();
    const index = accounts.findIndex((account) => account.user.id === userId && account.user.role === 'pharmacist');
    if (index < 0) throw new Error('Pharmacist account not found.');

    const current = accounts[index].user;
    if (current.accountStatus === 'pending' && status !== 'active' && status !== 'rejected') throw new Error('Invalid status transition.');
    if (status === 'rejected' && !reason?.trim()) throw new Error('A rejection reason is required.');

    const decisionStatus = status === 'active'
      ? (current.accountStatus === 'inactive' ? 'reactivated' : 'approved')
      : status;

    const updatedUser: User = {
      ...current,
      accountStatus: status,
      rejectionReason: status === 'rejected' ? reason?.trim() : undefined,
      accountDecisions: [
        ...(current.accountDecisions ?? []),
        { status: decisionStatus, reason: status === 'rejected' ? reason?.trim() : undefined, decidedAt: new Date().toISOString() },
      ],
    };

    const updatedAccounts = accounts.map((account) => account.user.id === userId ? { ...account, user: updatedUser } : account);
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));

    const storedSession = await AsyncStorage.getItem(SESSION_KEY);
    if (storedSession) {
      try {
        const sessionUser = JSON.parse(storedSession) as User;
        if (sessionUser.id === userId) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      } catch {}
    }
    return updatedUser;
  }
}

export const authService = new AuthService();

export const MOCK_ADMIN_CREDENTIALS = {
  email: 'admin@medsupply.app',
  password: 'Admin123!',
} as const;
