import { create } from 'zustand';
import { previewCoupons, previewOrder, previewOrders, previewProducts } from '../data/preview';
import type { Cart, CheckoutRequest, Coupon, Order, Product, ProductUpdateRequest, QuantityRequest, SaleStatus, User } from '../types/ui';
interface PreviewState { user: User | null; products: Product[]; coupons: Coupon[]; cart: Cart; orders: Order[]; currentOrder: Order; signIn: (username: string) => void; signOut: () => void }
export const usePreview = create<PreviewState>((set) => ({ user: null, products: structuredClone(previewProducts), coupons: structuredClone(previewCoupons), orders: structuredClone(previewOrders), currentOrder: structuredClone(previewOrder), cart: { stage: 'cart', lines: [], subtotal: 0, itemCount: 0, couponCode: null, checkoutAllowed: false, currentOrderId: null }, signIn: (username) => set({ user: { username, role: username === 'admin01' ? 'Admin' : 'Customer', memberTier: username === 'cus_prime' ? 'prime' : 'normal' } }), signOut: () => set({ user: null }) }));
function updateBag(lines: Cart['lines']) { const cart = usePreview.getState().cart; usePreview.setState({ cart: { ...cart, lines, itemCount: lines.length, subtotal: lines.reduce((total, line) => total + line.lineTotal, 0), checkoutAllowed: lines.length > 0 } }); return usePreview.getState().cart; }
// These actions drive visual interactions only; they do not enforce SRS domain rules.
export const bagPreview = {
  add: async ({ productId, quantity }: QuantityRequest) => { const state = usePreview.getState(); const product = state.products.find((p) => p.productId === productId)!; const existing = state.cart.lines.find((line) => line.productId === productId); const nextQuantity = (existing?.quantity ?? 0) + quantity; const line = { ...product, quantity: nextQuantity, available: true, lineTotal: product.price * nextQuantity }; return updateBag([...state.cart.lines.filter((l) => l.productId !== productId), line]); },
  update: async ({ productId, quantity }: QuantityRequest) => updateBag(usePreview.getState().cart.lines.map((line) => line.productId === productId ? { ...line, quantity, lineTotal: line.price * quantity } : line)),
  remove: async (productId: string) => updateBag(usePreview.getState().cart.lines.filter((line) => line.productId !== productId)),
};
export const couponPreview = { apply: async ({ code }: { code: string }) => { usePreview.setState((state) => ({ cart: { ...state.cart, couponCode: code } })); return usePreview.getState().cart; } };
export const checkoutPreview = {
  press: async ({ zone, speed }: CheckoutRequest) => { const order = { ...structuredClone(previewOrder), zone, speed }; usePreview.setState((state) => ({ currentOrder: order, cart: { ...state.cart, stage: 'payment', currentOrderId: order.orderId } })); return order; },
  cancel: async () => { usePreview.setState((state) => ({ cart: { ...state.cart, stage: 'cart', currentOrderId: null } })); return usePreview.getState().cart; },
  continue: async () => { usePreview.setState((state) => ({ cart: { ...state.cart, stage: 'cart', currentOrderId: null } })); return usePreview.getState().cart; },
};
export const adminPreview = {
  update: async (id: string, values: ProductUpdateRequest) => { usePreview.setState((state) => ({ products: state.products.map((p) => p.productId === id ? { ...p, ...values } : p) })); return usePreview.getState().products.find((p) => p.productId === id)!; },
  setProductStatus: async (id: string, { status }: { status: SaleStatus }) => { usePreview.setState((state) => ({ products: state.products.map((p) => p.productId === id ? { ...p, status } : p) })); return usePreview.getState().products.find((p) => p.productId === id)!; },
  setCouponStatus: async (code: string, { status }: { status: SaleStatus }) => { usePreview.setState((state) => ({ coupons: state.coupons.map((c) => c.code === code ? { ...c, status } : c) })); return usePreview.getState().coupons.find((c) => c.code === code)!; },
};
