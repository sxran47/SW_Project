export type Role = 'Customer' | 'Admin';
export type Stage = 'cart' | 'payment' | 'success';
export type Zone = 'inCity' | 'upcountry' | 'remote';
export type Speed = 'standard' | 'express';
export type SaleStatus = 'enabled' | 'disabled';
export type OrderStatus = 'pending' | 'paid' | 'cancelled';
export interface User { username: string; role: Role; memberTier?: 'normal' | 'prime' }
export interface LoginRequest { username: string; password: string }
export interface Session { user: User; token: string }
export interface Product { productId: string; name: string; price: number; weightGram: number; stock: number; status: SaleStatus }
export interface CartLine extends Product { quantity: number; available: boolean; lineTotal: number }
export interface Cart { stage: Stage; lines: CartLine[]; subtotal: number; itemCount: number; couponCode: string | null; checkoutAllowed: boolean; currentOrderId: string | null }
export interface QuantityRequest { productId: string; quantity: number }
export interface CouponRequest { code: string }
export interface Coupon { code: string; percent: number; minSpend: number; status: SaleStatus }
export interface CheckoutRequest { zone: Zone; speed: Speed }
export interface OrderLine { productId: string; name: string; price: number; quantity: number; lineTotal: number }
export interface Order { orderId: string; createdAt: string; status: OrderStatus; lines: OrderLine[]; subtotal: number; discount: number; shipping: number; total: number; zone: Zone; speed: Speed; couponCode: string | null; paymentFailed: boolean }
export interface ProductUpdateRequest { price?: number; stock?: number }
export interface StatusRequest { status: SaleStatus }
export interface ApiMessage { kind: 'error' | 'notice' | 'info'; code: string; message: string; fields?: string[]; productIds?: string[] }
export interface ApiResponse<T> { data: T; messages?: ApiMessage[] }
export interface ApiErrorBody { error: { code: string; message: string; fields?: string[]; productIds?: string[] } }
