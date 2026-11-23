export type UserRole = 'pharmacist' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
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
}
