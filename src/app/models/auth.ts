export type UserRole = 'pharmacist' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  pharmacyName?: string;
  pharmacyAddress?: string;
  role: UserRole;
  createdAt: string;
  accountStatus?: PharmacistAccountStatus;
  rejectionReason?: string;
  accountDecisions?: AccountDecision[];
}

export interface AuthAccount {
  user: User;
  passwordHash: string;
}

export interface RegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  pharmacyName?: string;
  pharmacyAddress?: string;
}

export interface ProfileUpdateInput {
  fullName: string;
  email: string;
  phone: string;
  profilePicture?: string;
  pharmacyName: string;
  pharmacyAddress: string;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type PharmacistAccountStatus = 'pending' | 'active' | 'rejected' | 'inactive';

export interface AccountDecision {
  status: 'approved' | 'rejected' | 'inactive' | 'reactivated';
  reason?: string;
  decidedAt: string;
}
