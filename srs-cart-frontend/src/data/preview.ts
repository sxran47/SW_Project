import type { Coupon, Order, Product } from '../types/ui';
// Display-only fixtures. No authorization, stock reservations, or payment processing.
export const previewProducts: Product[] = [
  { productId: 'P1', name: 'Coffee Beans 250g', price: 450, weightGram: 300, stock: 20, status: 'enabled' },
  { productId: 'P2', name: 'Drip Kettle', price: 1200, weightGram: 900, stock: 3, status: 'enabled' },
  { productId: 'P3', name: 'Espresso Machine', price: 15000, weightGram: 8000, stock: 5, status: 'enabled' },
];
export const previewCoupons: Coupon[] = [{ code: 'SAVE10', percent: 10, minSpend: 1000, status: 'enabled' }];
export const previewOrder: Order = { orderId: 'PREVIEW-001', createdAt: '2026-10-08T02:00:00Z', status: 'pending', lines: [{ productId: 'P1', name: 'Coffee Beans 250g', price: 450, quantity: 1, lineTotal: 450 }, { productId: 'P2', name: 'Drip Kettle', price: 1200, quantity: 1, lineTotal: 1200 }], subtotal: 1650, discount: 165, shipping: 30, total: 1515, zone: 'inCity', speed: 'standard', couponCode: 'SAVE10', paymentFailed: false };
export const previewOrders: Order[] = [{ ...previewOrder, orderId: 'PREVIEW-002', status: 'paid' }, { ...previewOrder, orderId: 'PREVIEW-001', status: 'cancelled', createdAt: '2026-10-07T02:00:00Z' }];
