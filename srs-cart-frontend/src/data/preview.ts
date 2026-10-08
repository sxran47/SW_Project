import type { Coupon, Product, User } from '../types/ui';
// SRS section 7 seeds for the local UI demonstration, not production server data.
export const previewProducts: Product[] = [
  { productId: 'P1', name: 'Coffee Beans 250g', price: 450, weightGram: 300, stock: 20, status: 'enabled' },
  { productId: 'P2', name: 'Drip Kettle', price: 1200, weightGram: 900, stock: 3, status: 'enabled' },
  { productId: 'P3', name: 'Espresso Machine', price: 15000, weightGram: 8000, stock: 5, status: 'enabled' },
];
export const previewCoupons: Coupon[] = [
  { code: 'SAVE10', percent: 10, minSpend: 1000, status: 'enabled' },
  { code: 'WELCOME10', percent: 10, minSpend: 0, status: 'enabled' },
  { code: 'SAVE15', percent: 15, minSpend: 500, status: 'disabled' },
  { code: 'welcome01', percent: 10, minSpend: 0, status: 'enabled' },
];
export const previewUsers: User[] = [
  { username: 'cus_normal', role: 'Customer', memberTier: 'normal' },
  { username: 'cus_prime', role: 'Customer', memberTier: 'prime' },
  { username: 'admin01', role: 'Admin' },
];

