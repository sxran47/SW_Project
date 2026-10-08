import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import type { ApiErrorBody, ApiResponse } from '../types/api';
import { useAuth } from '../stores/auth';
import { useUI } from '../stores/ui';
export class ApiError extends Error { constructor(public code: string, message: string, public fields: string[] = [], public productIds: string[] = []) { super(message); this.name = 'ApiError'; } }
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError<ApiErrorBody>(error)) { const body = error.response?.data?.error; return body ? new ApiError(body.code, body.message, body.fields, body.productIds) : new ApiError('NETWORK_ERROR', 'We could not reach the store. Please try again.'); }
  return new ApiError('UNKNOWN_ERROR', 'Something went wrong. Please try again.');
}
export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', timeout: 15000, withCredentials: true });
apiClient.interceptors.request.use((config) => { const token = useAuth.getState().token; if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
apiClient.interceptors.response.use((response) => { const messages = (response.data as ApiResponse<unknown>).messages; if (messages?.length) useUI.getState().notify(messages[0]); return response; }, (error: unknown) => { const normalized = normalizeError(error); if (normalized.code === 'AUTH_REQUIRED') useAuth.getState().clear(); return Promise.reject(normalized); });
export async function request<T>(config: AxiosRequestConfig): Promise<T> { const response = await apiClient.request<ApiResponse<T>>(config); return response.data.data; }
