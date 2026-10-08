import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrdersPage } from '../pages/OrdersPage';
import { AdminPage } from '../pages/AdminPage';
interface Fixtures { login: LoginPage; products: ProductsPage; cart: CartPage; checkout: CheckoutPage; orders: OrdersPage; admin: AdminPage; isolated: void }
export const test = base.extend<Fixtures>({
  isolated: [async ({ page, request }, use) => { if (process.env.E2E_REAL_API === 'true') { const response = await request.post(`${process.env.E2E_API_BASE_URL || 'http://localhost:3000'}/testing/reset`); expect(response.ok(), 'Real backend test environment must implement the documented reset contract').toBeTruthy(); } await page.goto('/login'); await expect(page.getByTestId('page-login')).toBeVisible(); await use(); }, { auto: true }],
  login: async ({ page }, use) => use(new LoginPage(page)), products: async ({ page }, use) => use(new ProductsPage(page)), cart: async ({ page }, use) => use(new CartPage(page)), checkout: async ({ page }, use) => use(new CheckoutPage(page)), orders: async ({ page }, use) => use(new OrdersPage(page)), admin: async ({ page }, use) => use(new AdminPage(page)),
});
export { expect };
