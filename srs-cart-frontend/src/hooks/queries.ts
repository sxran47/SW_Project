import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../stores/auth';
import { useUI } from '../stores/ui';
import { normalizeError } from '../services/apiClient';
import { authApi } from '../features/auth/api';
import { cartApi } from '../features/cart/api';
import { orderApi } from '../features/orders/api';
export const useSession = () => { const token = useAuth((s) => s.token); return useQuery({ queryKey: ['session', token], queryFn: ({ signal }) => authApi.session(signal), enabled: !!token, retry: false }); };
export const useCart = () => { const { data: user } = useSession(); return useQuery({ queryKey: ['cart', user?.username], queryFn: ({ signal }) => cartApi.get(signal), enabled: user?.role === 'Customer', refetchInterval: 5000 }); };
export const useOrder = (id: string | null) => { const { data: user } = useSession(); return useQuery({ queryKey: ['order', user?.username, id], queryFn: ({ signal }) => orderApi.get(id!, signal), enabled: !!id && user?.role === 'Customer', refetchInterval: 3000 }); };
export function useAction<T, V>(fn: (variables: V) => Promise<T>, success?: (data: T) => void) { const client = useQueryClient(); return useMutation({ mutationFn: fn, onSuccess: async (data) => { await client.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'session' }); success?.(data); }, onError: (error) => { const e = normalizeError(error); useUI.getState().notify({ kind: 'error', code: e.code, message: e.message, fields: e.fields, productIds: e.productIds }); } }); }
