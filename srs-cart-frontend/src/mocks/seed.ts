import type { Coupon, Product, User } from '../types/api';
export const seedProducts: Product[] = [
  { productId: 'P1', name: 'Coffee Beans 250g', price: 450, weightGram: 300, stock: 20, status: 'enabled' },
  { productId: 'P2', name: 'Drip Kettle', price: 1200, weightGram: 900, stock: 3, status: 'enabled' },
  { productId: 'P3', name: 'Espresso Machine', price: 15000, weightGram: 8000, stock: 5, status: 'enabled' },
];
export const seedCoupons: Coupon[] = [{ code: 'SAVE10', percent: 10, minSpend: 1000, status: 'enabled' }];
export const seedUsers: User[] = [{ username: 'cus_normal', role: 'Customer', memberTier: 'normal' }, { username: 'cus_prime', role: 'Customer', memberTier: 'prime' }, { username: 'admin01', role: 'Admin' }];
// SRS omits passwords: this credential is a documented development adapter choice.
export const mockPassword = 'password';
