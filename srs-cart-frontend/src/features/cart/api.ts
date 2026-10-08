import { request } from '../../services/apiClient';
import { endpoints } from '../../services/endpoints';
import type { Cart, QuantityRequest } from '../../types/api';
export const cartApi = { get: (signal?: AbortSignal) => request<Cart>({ url: endpoints.cart, signal }), add: (data: QuantityRequest) => request<Cart>({ method: 'POST', url: endpoints.items, data }), update: ({ productId, quantity }: QuantityRequest) => request<Cart>({ method: 'PATCH', url: endpoints.item(productId), data: { quantity } }), remove: (id: string) => request<Cart>({ method: 'DELETE', url: endpoints.item(id) }) };
