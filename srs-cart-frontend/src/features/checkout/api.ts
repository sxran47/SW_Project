import { request } from '../../services/apiClient';
import { endpoints, testControlsEnabled } from '../../services/endpoints';
import type { Cart, CheckoutRequest, Order } from '../../types/api';
export const checkoutApi = { press: (data: CheckoutRequest) => request<Order>({ method: 'POST', url: endpoints.checkout, data }), cancel: () => request<Cart>({ method: 'POST', url: endpoints.cancel }), continue: () => request<Cart>({ method: 'POST', url: endpoints.continue }) };
export async function simulateGateway(id: string, result: 'success' | 'fail') { if (!testControlsEnabled) throw new Error('Gateway simulation is unavailable'); return request<Order>({ method: 'POST', url: endpoints.gateway(id, result) }); }
