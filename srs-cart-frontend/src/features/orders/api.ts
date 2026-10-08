import { request } from '../../services/apiClient';
import { endpoints } from '../../services/endpoints';
import type { Order } from '../../types/api';
export const orderApi = { list: (signal?: AbortSignal) => request<Order[]>({ url: endpoints.orders, signal }), get: (id: string, signal?: AbortSignal) => request<Order>({ url: endpoints.order(id), signal }) };
