import { useState } from 'react';
import { usePreview } from '../stores/preview';
import { useUI } from '../stores/ui';
const ready = <T,>(data: T) => ({ data, isLoading: false, error: null, refetch: async () => undefined });
export const useSession = () => ready(usePreview((s) => s.user));
export const useCart = () => ready(usePreview((s) => s.cart));
export const useProducts = () => ready(usePreview((s) => s.products));
export const useCoupons = () => ready(usePreview((s) => s.coupons));
export const useOrders = () => ready(usePreview((s) => s.orders));
export const useOrder = (id: string | null) => ready(usePreview((state) => {
  if (id === null) return state.currentOrder;
  const historyOrder = state.orders.find((order) => order.orderId === id);
  if (historyOrder) return historyOrder;
  return state.currentOrder.orderId === id ? state.currentOrder : undefined;
}));
export function useAction<T, V>(fn: (variables: V) => Promise<T>, success?: (data: T) => void) { const [isPending, setPending] = useState(false); return { isPending, mutate: (variables: V) => { setPending(true); void fn(variables).then((result) => success?.(result)).catch(() => useUI.getState().notify({ kind: 'error', code: '', message: 'Unable to update this preview.' })).finally(() => setPending(false)); } }; }
