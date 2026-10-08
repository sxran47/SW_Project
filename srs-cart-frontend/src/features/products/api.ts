import { request } from '../../services/apiClient';
import { endpoints } from '../../services/endpoints';
import type { Product } from '../../types/api';
export const productApi = { list: (signal?: AbortSignal) => request<Product[]>({ url: endpoints.products, signal }) };
