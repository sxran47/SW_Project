import { request } from '../../services/apiClient';
import { endpoints } from '../../services/endpoints';
import type { Cart, CouponRequest } from '../../types/api';
export const couponApi = { apply: (data: CouponRequest) => request<Cart>({ method: 'PUT', url: endpoints.coupon, data }) };
