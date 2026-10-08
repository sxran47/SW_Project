import { useMemo, useRef, useState } from 'react';
import { usePreview, viewPreviewCart } from '../stores/preview';
import { useUI } from '../stores/ui';
import { errorMessage, PreviewError } from '../data/errors';

const ready = <T,>(data: T) => ({ data, isLoading: false, error: null as PreviewError | null, refetch: async () => undefined });
function useDisplayState<T>(data: T, empty: T) {
  const scenario = useUI((s) => s.scenario);
  return { data: scenario === 'empty' ? empty : data, isLoading: scenario === 'loading',
    error: scenario === 'error' ? new PreviewError('', 'The preview could not load this screen. Please try again.') : null,
    refetch: async () => useUI.getState().setScenario('normal') };
}
export const useSession = () => ready(usePreview((s) => s.user));
export function useCart() {
  const state = usePreview();
  const cart = useMemo(() => viewPreviewCart(state), [state]);
  return useDisplayState(cart, { ...cart, lines: [], subtotal: 0, itemCount: 0, checkoutAllowed: false });
}
export function useProducts() {
  const state = usePreview();
  const data = useMemo(() => state.products.filter((p) => state.user?.role === 'Admin' || p.status === 'enabled' && p.stock > 0), [state]);
  return useDisplayState(data, []);
}
export const useCoupons = () => useDisplayState(usePreview((s) => s.coupons), []);
export function useOrders() {
  const state = usePreview();
  return useDisplayState(useMemo(() => state.orders.filter((o) => o.owner === state.user?.username).slice().reverse(), [state]), []);
}
export function useOrder(id: string | null) {
  const state = usePreview();
  return useMemo(() => {
    const customer = state.user ? state.customers[state.user.username] : undefined;
    const requested = id ?? customer?.currentOrderId;
    const order = state.orders.find((o) => o.orderId === requested && o.owner === state.user?.username);
    return { ...ready(order), error: requested && !order ? new PreviewError('ORDER_NOT_FOUND', 'We could not find that order.') : null };
  }, [state, id]);
}

export function useAction<T, V>(fn: (variables: V) => Promise<T>, success?: (data: T) => void) {
  const [isPending, setPending] = useState(false);
  const pending = useRef(false);
  return { isPending, mutate: (variables: V) => {
    if (pending.current) return;
    pending.current = true;
    setPending(true);
    useUI.getState().notify(null);
    void Promise.resolve().then(() => fn(variables)).then((result) => success?.(result))
      .catch((error: unknown) => useUI.getState().notify(errorMessage(error)))
      .finally(() => { pending.current = false; setPending(false); });
  } };
}
