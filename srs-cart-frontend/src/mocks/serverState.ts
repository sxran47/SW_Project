// Development-only simulated server. Never imported by production feature APIs.
import type { Cart, Coupon, Order, Product, Stage, User, Zone, Speed, ApiMessage } from '../types/api';
import { seedProducts, seedCoupons, seedUsers } from './seed';
interface CustomerState { stage: Stage; items: Record<string, number>; couponCode: string | null; currentOrderId: string | null }
export interface MockState { products: Product[]; coupons: Coupon[]; customers: Record<string, CustomerState>; orders: (Order & { owner: string })[]; sequence: number; sessions: Record<string, string> }
export const freshState = (): MockState => ({ products: structuredClone(seedProducts), coupons: structuredClone(seedCoupons), customers: Object.fromEntries(seedUsers.filter((u) => u.role === 'Customer').map((u) => [u.username, { stage: 'cart', items: {}, couponCode: null, currentOrderId: null }])), orders: [], sequence: 0, sessions: {} });
export let state = freshState();
export function resetState() { state = freshState(); }
export function restoreState(value: MockState) { state = value; }
export class DomainError extends Error { constructor(public code: string, message = code, public fields: string[] = [], public productIds: string[] = []) { super(message); } }
export function requireStage(user: User, stage: Stage) { if (state.customers[user.username].stage !== stage) throw new DomainError('OPERATION_NOT_ALLOWED', 'This action is unavailable in the current checkout stage.'); }
export function viewCart(user: User): Cart { const customer = state.customers[user.username]; const lines = Object.entries(customer.items).map(([id, quantity]) => { const product = state.products.find((p) => p.productId === id)!; return { ...product, quantity, available: product.status === 'enabled' && product.stock >= 1, lineTotal: product.price * quantity }; }); return { stage: customer.stage, lines, subtotal: lines.reduce((sum, l) => sum + l.lineTotal, 0), itemCount: lines.length, couponCode: customer.couponCode, checkoutAllowed: customer.stage === 'cart' && lines.length > 0, currentOrderId: customer.currentOrderId }; }
export function changeQuantity(user: User, id: string, quantity: unknown, operation: 'add' | 'update') {
  requireStage(user, 'cart');
  if (typeof quantity !== 'number' || !Number.isInteger(quantity)) throw new DomainError('VALIDATION_ERROR', 'Quantity must be a whole number.');
  if (quantity < 1 || quantity > 10) throw new DomainError('QTY_OUT_OF_RANGE', 'Choose a quantity from 1 to 10.');
  const customer = state.customers[user.username]; const product = state.products.find((p) => p.productId === id);
  if (operation === 'add' && !product) throw new DomainError('PRODUCT_NOT_FOUND');
  if (operation === 'update' && !customer.items[id]) throw new DomainError('ITEM_NOT_IN_CART');
  if (!product || product.status !== 'enabled' || product.stock < 1) throw new DomainError('PRODUCT_UNAVAILABLE', 'This product is no longer available for sale.');
  const next = operation === 'add' ? (customer.items[id] || 0) + quantity : quantity;
  if (next > 10) throw new DomainError('QTY_OUT_OF_RANGE', 'A cart line can contain at most 10 units.');
  if (next > product.stock) throw new DomainError('INSUFFICIENT_STOCK', 'The requested quantity exceeds available stock.');
  customer.items[id] = next; return viewCart(user);
}
export function checkout(user: User, zone: unknown, speed: unknown): { order: Order; messages: ApiMessage[] } {
  requireStage(user, 'cart');
  if (!['inCity', 'upcountry', 'remote'].includes(String(zone)) || !['standard', 'express'].includes(String(speed))) throw new DomainError('VALIDATION_ERROR');
  const cart = viewCart(user); if (!cart.lines.length) throw new DomainError('CART_EMPTY', 'ไม่สามารถชำระเงินได้ ตะกร้าว่าง');
  const unavailable = cart.lines.filter((l) => !l.available || l.quantity > l.stock).map((l) => l.productId);
  if (unavailable.length) throw new DomainError('ITEMS_UNAVAILABLE', 'Some items are unavailable. Review your cart.', [], unavailable);
  const weight = cart.lines.reduce((sum, l) => sum + l.weightGram * l.quantity, 0); if (weight > 20000) throw new DomainError('WEIGHT_LIMIT_EXCEEDED', 'This order exceeds the 20,000 g shipping limit.');
  const customer = state.customers[user.username]; const coupon = state.coupons.find((c) => c.code === customer.couponCode); const validCoupon = coupon?.status === 'enabled' && cart.subtotal >= coupon.minSpend;
  const messages: ApiMessage[] = []; if (customer.couponCode && !validCoupon) messages.push({ kind: 'notice', code: 'COUPON_NOT_APPLICABLE', message: 'คูปองไม่สามารถใช้กับคำสั่งซื้อนี้' });
  const prime = user.memberTier === 'prime'; const discount = Math.floor(cart.subtotal * (validCoupon ? coupon!.percent : prime ? 5 : 0) / 100);
  const rates = weight <= 1000 ? [30, 50, 80] : weight <= 5000 ? [50, 80, 120] : [80, 120, 180]; const base = rates[['inCity', 'upcountry', 'remote'].indexOf(String(zone))];
  const shipping = Math.floor(base * (prime ? speed === 'standard' ? 0 : 0.5 : speed === 'standard' ? 1 : 1.5));
  const sequence = state.sequence + 1;
  const order: Order & { owner: string } = { owner: user.username, orderId: `ORD-${String(sequence).padStart(4, '0')}`, createdAt: new Date(Date.UTC(2026, 9, 8, 2, 0, sequence)).toISOString(), status: 'pending', lines: cart.lines.map((l) => ({ productId: l.productId, name: l.name, price: l.price, quantity: l.quantity, lineTotal: l.lineTotal })), subtotal: cart.subtotal, discount, shipping, total: cart.subtotal - discount + shipping, zone: zone as Zone, speed: speed as Speed, couponCode: validCoupon ? coupon!.code : null, paymentFailed: false };
  // Commit only after all rejection checks: FR-0.7.
  state.sequence = sequence; customer.couponCode = order.couponCode; state.orders.push(order);
  for (const line of cart.lines) state.products.find((p) => p.productId === line.productId)!.stock -= line.quantity;
  customer.stage = 'payment'; customer.currentOrderId = order.orderId; return { order, messages };
}
export function gateway(id: string, result: 'success' | 'fail') {
  const order = state.orders.find((o) => o.orderId === id); if (!order) throw new DomainError('ORDER_NOT_FOUND');
  const customer = state.customers[order.owner]; if (customer.stage !== 'payment' || order.status !== 'pending') throw new DomainError('OPERATION_NOT_ALLOWED');
  if (result === 'fail') { order.paymentFailed = true; return order; }
  order.status = 'paid'; order.paymentFailed = false; customer.items = {}; customer.couponCode = null; customer.stage = 'success'; return order;
}
