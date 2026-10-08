import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
export class OrdersPage { constructor(readonly page: Page) {} async goto() { await this.page.getByRole('link', { name: 'My orders', exact: true }).click(); await expect(this.page.getByTestId('page-orders')).toBeVisible(); } order(id: string) { return this.page.getByTestId(`order-row-${id}`); } async open(id: string) { await this.order(id).getByRole('link', { name: `View order ${id}`, exact: true }).click(); await expect(this.page.getByTestId('page-order-detail')).toBeVisible(); } }
