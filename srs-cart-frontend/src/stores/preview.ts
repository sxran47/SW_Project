import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { previewCoupons, previewProducts, previewUsers } from '../data/preview';
import { PreviewError } from '../data/errors';
import { MAX_ORDER_WEIGHT_GRAM, totalWeightGram } from '../data/weight';
import { useUI } from './ui';
import type { Cart, CheckoutRequest, Coupon, MemberTier, Order, Product, ProductUpdateRequest, QuantityRequest, SaleStatus, Stage, User, WalletTransaction } from '../types/ui';

interface CustomerPreview {
  memberTier: MemberTier;
  walletBalance: number;
  transactions: WalletTransaction[];
  stage: Stage;
  items: Record<string, number>;
  couponCode: string | null;
  currentOrderId: string | null;
}

export interface PreviewState {
  user: User | null;
  products: Product[];
  coupons: Coupon[];
  customers: Record<string, CustomerPreview>;
  orders: Order[];
  sequence: number;
  signIn: (username: string, password: string) => void;
  signOut: () => void;
}

function initialData() {
  return {
    user: null as User | null,
    products: structuredClone(previewProducts),
    coupons: structuredClone(previewCoupons),
    customers: Object.fromEntries(previewUsers.filter((u) => u.role === 'Customer').map((u) => [u.username, {
      memberTier: u.memberTier ?? 'normal', walletBalance: 0, transactions: [],
      stage: 'cart' as Stage, items: {}, couponCode: null, currentOrderId: null,
    }])),
    orders: [] as Order[],
    sequence: 0,
  };
}

// Local UI demonstration only. Session snapshots preserve the preview on reload;
// they are not authoritative records, authentication, or backend integration.
export const usePreview = create<PreviewState>()(persist((set) => ({
  ...initialData(),
  signIn: (username) => {
    const user: User = previewUsers.find((candidate) => candidate.username === username)
      ?? { username, role: 'Customer', memberTier: 'normal' };
    set((state) => ({
      user: { ...user, ...(user.role === 'Customer' ? { memberTier: state.customers[username]?.memberTier ?? user.memberTier } : {}) },
      customers: user.role === 'Customer' && !Object.hasOwn(state.customers, username)
        ? { ...state.customers, [username]: { memberTier: user.memberTier ?? 'normal', walletBalance: 0, transactions: [], stage: 'cart', items: {}, couponCode: null, currentOrderId: null } }
        : state.customers,
    }));
  },
  signOut: () => set({ user: null }),
}), {
  name: 'ritual-ui-preview-v2', storage: createJSONStorage(() => sessionStorage),
  merge: (persisted, current) => {
    const saved = persisted as Partial<PreviewState>;
    const coupons = saved.coupons ?? current.coupons;
    const customers = Object.fromEntries(Object.entries({ ...current.customers, ...saved.customers }).map(([username, customer]) => [username, {
      ...customer,
      memberTier: customer.memberTier ?? previewUsers.find((u) => u.username === username)?.memberTier ?? 'normal',
      walletBalance: customer.walletBalance ?? 0,
      transactions: customer.transactions ?? [],
    }]));
    const user = saved.user?.role === 'Customer' ? { ...saved.user, memberTier: customers[saved.user.username]?.memberTier ?? 'normal' } : saved.user ?? null;
    return { ...current, ...saved, user, customers, coupons: [
      ...coupons,
      ...previewCoupons.filter((seed) => !coupons.some((coupon) => coupon.code === seed.code)),
    ] };
  },
}));

function requireUser(role: User['role']) {
  const user = usePreview.getState().user;
  if (!user) throw new PreviewError('AUTH_REQUIRED', 'Please sign in to continue.');
  if (user.role !== role) throw new PreviewError('AUTH_FORBIDDEN', 'Your account cannot perform this action.');
  return user;
}

function requireStage(user: User, stage: Stage) {
  if (usePreview.getState().customers[user.username].stage !== stage) {
    throw new PreviewError('OPERATION_NOT_ALLOWED', 'This action is unavailable in the current checkout stage.');
  }
}

export function viewPreviewCart(state: PreviewState): Cart {
  const customer = state.user?.role === 'Customer' ? state.customers[state.user.username] : undefined;
  const lines = Object.entries(customer?.items ?? {}).map(([id, quantity]) => {
    const product = state.products.find((p) => p.productId === id)!;
    return { ...product, quantity, available: product.status === 'enabled' && product.stock >= 1, lineTotal: product.price * quantity };
  });
  const stage = customer?.stage ?? 'cart';
  return { stage, lines, subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0), itemCount: lines.length,
    couponCode: customer?.couponCode ?? null, currentOrderId: customer?.currentOrderId ?? null,
    checkoutAllowed: stage === 'cart' && lines.length > 0 };
}

export const walletPreview = {
  topUp: async (amount: number) => {
    const user = requireUser('Customer');
    if (!Number.isInteger(amount) || amount < 1 || amount > 50000) {
      throw new PreviewError('VALIDATION_ERROR', 'Enter a whole-number top-up from 1 to 50,000 THB.', ['amount']);
    }
    const state = usePreview.getState();
    const customer = state.customers[user.username];
    const balance = customer.walletBalance + amount;
    if (balance > 100000) throw new PreviewError('WALLET_LIMIT_EXCEEDED', 'The demo wallet can hold at most 100,000 THB.');
    const transaction: WalletTransaction = { id: crypto.randomUUID(), kind: 'topup', amount, balanceAfter: balance, createdAt: new Date().toISOString() };
    usePreview.setState({ customers: { ...state.customers, [user.username]: { ...customer, walletBalance: balance, transactions: [...customer.transactions, transaction] } } });
    return transaction;
  },
  pay: async (orderId: string) => {
    const user = requireUser('Customer');
    requireStage(user, 'payment');
    const state = usePreview.getState();
    const customer = state.customers[user.username];
    const order = state.orders.find((o) => o.orderId === orderId && o.owner === user.username);
    if (!order) throw new PreviewError('ORDER_NOT_FOUND', 'Order not found.');
    if (order.status !== 'pending' || customer.currentOrderId !== orderId) throw new PreviewError('OPERATION_NOT_ALLOWED', 'This order is not awaiting payment.');
    if (customer.walletBalance < order.total) throw new PreviewError('WALLET_INSUFFICIENT_FUNDS', 'Your wallet balance is too low. Top up before paying.');
    const balance = customer.walletBalance - order.total;
    const transaction: WalletTransaction = { id: crypto.randomUUID(), kind: 'payment', amount: -order.total, balanceAfter: balance, createdAt: new Date().toISOString(), orderId };
    const paid: Order = { ...order, status: 'paid', paymentFailed: false, paymentMethod: 'wallet' };
    usePreview.setState({ orders: state.orders.map((o) => o.orderId === orderId ? paid : o),
      customers: { ...state.customers, [user.username]: { ...customer, walletBalance: balance, transactions: [...customer.transactions, transaction], stage: 'success', items: {}, couponCode: null } } });
    return paid;
  },
};

function changeQuantity({ productId, quantity }: QuantityRequest, operation: 'add' | 'update') {
  const user = requireUser('Customer');
  requireStage(user, 'cart');
  const state = usePreview.getState();
  const customer = state.customers[user.username];
  if (!Number.isInteger(quantity)) throw new PreviewError('VALIDATION_ERROR', 'Quantity must be a whole number.');
  if (quantity < 1 || quantity > 10) throw new PreviewError('QTY_OUT_OF_RANGE', 'Choose a quantity from 1 to 10.');
  const product = state.products.find((p) => p.productId === productId);
  if (operation === 'add' && !product) throw new PreviewError('PRODUCT_NOT_FOUND', 'This product does not exist.');
  if (operation === 'update' && !customer.items[productId]) throw new PreviewError('ITEM_NOT_IN_CART', 'ไม่พบสินค้าในตะกร้า');
  if (!product || product.status !== 'enabled' || product.stock < 1) throw new PreviewError('PRODUCT_UNAVAILABLE', 'This product is unavailable for sale.');
  const next = operation === 'add' ? (customer.items[productId] ?? 0) + quantity : quantity;
  if (next > 10) throw new PreviewError('QTY_OUT_OF_RANGE', 'A cart line can contain at most 10 units.');
  if (next > product.stock) throw new PreviewError('INSUFFICIENT_STOCK', 'The requested quantity exceeds available stock.');
  usePreview.setState({ customers: { ...state.customers, [user.username]: { ...customer, items: { ...customer.items, [productId]: next } } } });
  return viewPreviewCart(usePreview.getState());
}

export const bagPreview = {
  add: async (values: QuantityRequest) => changeQuantity(values, 'add'),
  update: async (values: QuantityRequest) => changeQuantity(values, 'update'),
  remove: async (productId: string) => {
    const user = requireUser('Customer');
    requireStage(user, 'cart');
    const state = usePreview.getState();
    const customer = state.customers[user.username];
    if (!Object.keys(customer.items).length) throw new PreviewError('CART_EMPTY', 'ไม่มีสินค้าให้ลบ');
    if (!customer.items[productId]) throw new PreviewError('ITEM_NOT_IN_CART', 'ไม่พบสินค้าในตะกร้า');
    const items = { ...customer.items };
    delete items[productId];
    usePreview.setState({ customers: { ...state.customers, [user.username]: { ...customer, items } } });
    if (!Object.keys(items).length) useUI.getState().notify({ kind: 'info', code: '', message: 'ตะกร้าว่าง' });
    return viewPreviewCart(usePreview.getState());
  },
};

export const couponPreview = { apply: async ({ code }: { code: string }) => {
  const user = requireUser('Customer');
  requireStage(user, 'cart');
  const state = usePreview.getState();
  if (!state.coupons.some((c) => c.code === code && c.status === 'enabled')) throw new PreviewError('COUPON_INVALID', 'This coupon is invalid or disabled. Codes are case-sensitive.');
  usePreview.setState({ customers: { ...state.customers, [user.username]: { ...state.customers[user.username], couponCode: code } } });
  return viewPreviewCart(usePreview.getState());
} };

export const checkoutPreview = {
  press: async ({ zone, speed }: CheckoutRequest) => {
    const user = requireUser('Customer');
    requireStage(user, 'cart');
    const state = usePreview.getState();
    const customer = state.customers[user.username];
    if (!['inCity', 'upcountry', 'remote'].includes(zone) || !['standard', 'express'].includes(speed)) throw new PreviewError('VALIDATION_ERROR', 'Select a valid delivery zone and speed.');
    const cart = viewPreviewCart(state);
    if (!cart.lines.length) throw new PreviewError('CART_EMPTY', 'ไม่สามารถชำระเงินได้ ตะกร้าว่าง');
    const unavailable = cart.lines.filter((l) => !l.available || l.quantity > l.stock).map((l) => l.productId);
    if (unavailable.length) throw new PreviewError('ITEMS_UNAVAILABLE', 'Some items are unavailable. Review your cart.', [], unavailable);
    const weight = totalWeightGram(cart.lines);
    if (weight > MAX_ORDER_WEIGHT_GRAM) throw new PreviewError('WEIGHT_LIMIT_EXCEEDED', 'Your order exceeds the 20,000 g weight limit. Reduce quantities or remove items before checkout.');
    const coupon = state.coupons.find((c) => c.code === customer.couponCode);
    const applicable = coupon?.status === 'enabled' && cart.subtotal >= coupon.minSpend;
    const couponCode = applicable ? coupon!.code : null;
    const prime = user.memberTier === 'prime';
    const discount = Math.floor(cart.subtotal * (applicable ? coupon!.percent : prime ? 5 : 0) / 100);
    const rates = weight <= 1000 ? [30, 50, 80] : weight <= 5000 ? [50, 80, 120] : [80, 120, 180];
    const base = rates[['inCity', 'upcountry', 'remote'].indexOf(zone)];
    const shipping = Math.floor(base * (prime ? speed === 'standard' ? 0 : .5 : speed === 'standard' ? 1 : 1.5));
    const sequence = state.sequence + 1;
    const order: Order = { orderId: `ORD-${String(sequence).padStart(4, '0')}`, owner: user.username, createdAt: new Date().toISOString(), status: 'pending',
      lines: cart.lines.map((l) => ({ productId: l.productId, name: l.name, price: l.price, quantity: l.quantity, lineTotal: l.lineTotal })),
      subtotal: cart.subtotal, discount, shipping, total: cart.subtotal - discount + shipping, zone, speed, couponCode, paymentFailed: false };
    usePreview.setState({ sequence, orders: [...state.orders, order],
      products: state.products.map((p) => ({ ...p, stock: p.stock - (customer.items[p.productId] ?? 0) })),
      customers: { ...state.customers, [user.username]: { ...customer, stage: 'payment', couponCode, currentOrderId: order.orderId } } });
    if (customer.couponCode && !applicable) useUI.getState().notify({ kind: 'notice', code: 'COUPON_NOT_APPLICABLE', message: 'คูปองไม่สามารถใช้กับคำสั่งซื้อนี้' });
    return order;
  },
  cancel: async () => {
    const user = requireUser('Customer');
    requireStage(user, 'payment');
    const state = usePreview.getState();
    const customer = state.customers[user.username];
    const order = state.orders.find((o) => o.orderId === customer.currentOrderId)!;
    if (order.status !== 'pending') throw new PreviewError('OPERATION_NOT_ALLOWED', 'This order cannot be cancelled.');
    usePreview.setState({ orders: state.orders.map((o) => o.orderId === order.orderId ? { ...o, status: 'cancelled' } : o),
      products: state.products.map((p) => ({ ...p, stock: p.stock + (order.lines.find((l) => l.productId === p.productId)?.quantity ?? 0) })),
      customers: { ...state.customers, [user.username]: { ...customer, stage: 'cart', currentOrderId: null } } });
    return viewPreviewCart(usePreview.getState());
  },
  continue: async () => {
    const user = requireUser('Customer');
    requireStage(user, 'success');
    const state = usePreview.getState();
    usePreview.setState({ customers: { ...state.customers, [user.username]: { ...state.customers[user.username], stage: 'cart', currentOrderId: null } } });
    return viewPreviewCart(usePreview.getState());
  },
};

// The gateway is separate from Customer operations. Its controls are development-only.
export async function previewGateway(orderId: string, result: 'success' | 'fail') {
  if (!import.meta.env.DEV) throw new PreviewError('AUTH_FORBIDDEN', 'Gateway preview is unavailable in the production UI.');
  const state = usePreview.getState();
  const order = state.orders.find((o) => o.orderId === orderId);
  if (!order) throw new PreviewError('ORDER_NOT_FOUND', 'Order not found.');
  const customer = state.customers[order.owner];
  if (customer.stage !== 'payment' || order.status !== 'pending') throw new PreviewError('OPERATION_NOT_ALLOWED', 'This order is not awaiting payment.');
  if (result === 'fail') {
    usePreview.setState({ orders: state.orders.map((o) => o.orderId === orderId ? { ...o, paymentFailed: true } : o) });
    useUI.getState().notify({ kind: 'info', code: '', message: 'การชำระเงินล้มเหลว กรุณาลองใหม่' });
  } else {
    usePreview.setState({ orders: state.orders.map((o) => o.orderId === orderId ? { ...o, status: 'paid', paymentFailed: false, paymentMethod: 'gateway' } : o),
      customers: { ...state.customers, [order.owner]: { ...customer, stage: 'success', items: {}, couponCode: null } } });
    useUI.getState().notify(null);
  }
}

export const adminPreview = {
  setMemberTier: async (username: string, memberTier: MemberTier) => {
    requireUser('Admin');
    const state = usePreview.getState();
    const customer = state.customers[username];
    if (!customer) throw new PreviewError('USER_NOT_FOUND', 'Customer not found.');
    if (!['normal', 'prime'].includes(memberTier)) throw new PreviewError('VALIDATION_ERROR', 'Select Normal or Prime membership.');
    usePreview.setState({ customers: { ...state.customers, [username]: { ...customer, memberTier } } });
    return memberTier;
  },
  update: async (id: string, values: ProductUpdateRequest) => {
    requireUser('Admin');
    const state = usePreview.getState();
    if (!state.products.some((p) => p.productId === id)) throw new PreviewError('PRODUCT_NOT_FOUND', 'Product not found.');
    const fields: string[] = [];
    if (values.price === undefined && values.stock === undefined) fields.push('price', 'stock');
    if (values.price !== undefined && (!Number.isInteger(values.price) || values.price < 1 || values.price > 50000)) fields.push('price');
    if (values.stock !== undefined && (!Number.isInteger(values.stock) || values.stock < 0 || values.stock > 9999)) fields.push('stock');
    if (fields.length) throw new PreviewError('VALIDATION_ERROR', 'Review the price and stock values.', fields);
    usePreview.setState({ products: state.products.map((p) => p.productId === id ? { ...p,
      ...(values.price !== undefined ? { price: values.price } : {}), ...(values.stock !== undefined ? { stock: values.stock } : {}) } : p) });
    return usePreview.getState().products.find((p) => p.productId === id)!;
  },
  setProductStatus: async (id: string, { status }: { status: SaleStatus }) => {
    requireUser('Admin');
    const state = usePreview.getState();
    if (!state.products.some((p) => p.productId === id)) throw new PreviewError('PRODUCT_NOT_FOUND', 'Product not found.');
    usePreview.setState({ products: state.products.map((p) => p.productId === id ? { ...p, status } : p) });
    return usePreview.getState().products.find((p) => p.productId === id)!;
  },
  setCouponStatus: async (code: string, { status }: { status: SaleStatus }) => {
    requireUser('Admin');
    const state = usePreview.getState();
    if (!state.coupons.some((c) => c.code === code)) throw new PreviewError('COUPON_NOT_FOUND', 'Coupon not found.');
    usePreview.setState({ coupons: state.coupons.map((c) => c.code === code ? { ...c, status } : c) });
    return usePreview.getState().coupons.find((c) => c.code === code)!;
  },
};

export function resetPreview() {
  if (import.meta.env.DEV) { usePreview.setState(initialData()); useUI.getState().notify(null); }
}
