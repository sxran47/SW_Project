import { request } from '../../services/apiClient';
import { endpoints } from '../../services/endpoints';
import type { Coupon, Product, ProductUpdateRequest, StatusRequest } from '../../types/api';
export const adminApi = { update: (id: string, data: ProductUpdateRequest) => request<Product>({ method: 'PATCH', url: endpoints.adminProduct(id), data }), setProductStatus: (id: string, data: StatusRequest) => request<Product>({ method: 'PUT', url: endpoints.productStatus(id), data }), coupons: (signal?: AbortSignal) => request<Coupon[]>({ url: endpoints.coupons, signal }), setCouponStatus: (code: string, data: StatusRequest) => request<Coupon>({ method: 'PUT', url: endpoints.couponStatus(code), data }) };
