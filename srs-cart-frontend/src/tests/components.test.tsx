import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { App } from '../app/App';
import { ProductCard } from '../features/products/ProductsPage';
import { CouponForm } from '../features/cart/CartPage';
import { Quantity, ErrorState, Loading } from '../components/ui/common';
import { seedProducts } from '../mocks/seed';
import { authApi } from '../features/auth/api';
import { cartApi } from '../features/cart/api';
import { checkoutApi } from '../features/checkout/api';
import { useAuth } from '../stores/auth';
import { productSchema } from '../features/admin/AdminPages';
import type { ReactNode } from 'react';
function mount(ui: ReactNode) { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{ui}</QueryClientProvider>); }
async function login(username = 'cus_normal') { useAuth.getState().setSession(await authApi.login({ username, password: 'password' })); }
describe('Accessible component behavior', () => {
  it('validates empty login form and supports password visibility', async () => { const user = userEvent.setup(); mount(<App/>); await user.click(screen.getByRole('button', { name: 'Sign in' })); expect(await screen.findByText('Enter your username.')).toBeVisible(); expect(screen.getByText('Enter your password.')).toBeVisible(); await user.click(screen.getByRole('button', { name: 'Show password' })); expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text'); });
  it('quantity buttons respect SRS limits', async () => { const user = userEvent.setup(); let value = 0; mount(<Quantity id="q" testId="q" value={1} onChange={(v) => value = v}/>); expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled(); await user.click(screen.getByRole('button', { name: 'Increase quantity' })); expect(value).toBe(2); expect(screen.getByLabelText('Quantity')).toHaveAttribute('max', '10'); });
  it('product card sends selected quantity', async () => { await login(); const user = userEvent.setup(); mount(<ProductCard product={seedProducts[0]}/>); await user.click(screen.getByRole('button', { name: 'Increase quantity' })); await user.click(screen.getByRole('button', { name: 'Add to bag' })); await waitFor(async () => expect((await cartApi.get()).lines[0]?.quantity).toBe(2)); expect(screen.getByTestId('product-price')).toHaveAttribute('data-value', '450'); });
  it('coupon form allows an empty cart and never uppercases entered code', async () => { await login(); const user = userEvent.setup(); mount(<CouponForm code={null}/>); await user.type(screen.getByLabelText('Have a coupon?'), 'SAVE10'); await user.click(screen.getByRole('button', { name: 'Apply' })); await waitFor(async () => expect((await cartApi.get()).couponCode).toBe('SAVE10')); });
  it('loading and error states are accessible and retryable', async () => { const user = userEvent.setup(); let retries = 0; const view = mount(<Loading/>); expect(screen.getByRole('status', { name: 'Loading' })).toBeVisible(); view.rerender(<ErrorState error={new Error()} retry={() => retries++}/>); await user.click(screen.getByRole('button', { name: 'Try again' })); expect(retries).toBe(1); expect(screen.getByRole('alert')).toBeVisible(); });
  it('customer navigation excludes admin operations and empty checkout is disabled', async () => { await login(); window.history.replaceState({}, '', '/cart'); mount(<App/>); expect(await screen.findByTestId('page-cart')).toBeVisible(); expect(screen.queryByTestId('nav-admin-products')).not.toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Proceed to checkout' })).toBeDisabled(); expect(screen.getByRole('link', { name: 'My orders' })).toBeVisible(); });
  it('admin navigation excludes customer operations', async () => { await login('admin01'); window.history.replaceState({}, '', '/admin/products'); mount(<App/>); expect(await screen.findByTestId('page-admin-products')).toBeVisible(); expect(screen.queryByTestId('nav-cart')).not.toBeInTheDocument(); const row = within(screen.getByTestId('admin-product-row-P1')); expect(row.getByLabelText('Price for Coffee Beans 250g')).toBeVisible(); });
  it('restored payment stage redirects a stale catalog URL', async () => { await login(); await cartApi.add({ productId: 'P1', quantity: 1 }); await checkoutApi.press({ zone: 'inCity', speed: 'standard' }); window.history.replaceState({}, '', '/products'); mount(<App/>); expect(await screen.findByTestId('page-checkout')).toBeVisible(); expect(screen.queryByTestId('page-products')).not.toBeInTheDocument(); });
  it('validates exact admin SRS bounds', () => { expect(productSchema.safeParse({ price: 1, stock: 0 }).success).toBe(true); expect(productSchema.safeParse({ price: 50000, stock: 9999 }).success).toBe(true); expect(productSchema.safeParse({ price: 0, stock: 10000 }).success).toBe(false); expect(productSchema.safeParse({ price: 1.5, stock: 0 }).success).toBe(false); });
});

