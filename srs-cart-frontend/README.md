# Ritual Supply — UI preview

Frontend UI only, built with React, TypeScript, Vite, Tailwind CSS, React Router, Zustand, React Hook Form, Zod, and Lucide icons.

## Run

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173.

This is a frontend-only demonstration. Enter any non-empty username and password to open the Customer interface. Use `cus_prime` for Prime membership or `admin01` for Admin; any password works for these accounts too. Other usernames use normal Customer membership and have their own local cart and order history. Credentials are not verified; there is no authentication service.

## Screens

- Login, product catalog, shopping bag, coupon entry, delivery selection
- Checkout with pending/failure/success states
- Per-customer order history and snapshot details
- Membership and demo wallet with top-ups, payment, and transaction history
- Admin product and coupon interfaces
- Admin membership management (Normal / Prime)
- Responsive mobile/desktop layouts and light/dark themes

Products, coupons, and accounts start from SRS section 7. Each Customer starts with an empty cart and no orders. The local UI model demonstrates the SRS quantity limits, validation order/error codes, coupon/member discount rules, shipping amounts, and stock reservation/cancellation transitions. These are demo values and actions, not server records or real payments.

Checkout uses the selected cart and current product prices. Orders retain price snapshots; Admin changes update current cart prices/availability. Customer carts, coupons, stages, and orders are separated by account. Session-storage snapshots preserve the demonstration across reload and sign-out/sign-in in the same browser tab; they are not an authoritative database or secure authentication.

Stage navigation restores pending checkout or success. Order history/details remain accessible in every stage. Invalid or inaccessible order IDs show `ORDER_NOT_FOUND`.

During `npm run dev`, payment preview controls are clearly separated in the **Development only · simulated payment gateway** panel. Failure retains the pending order/reservation and allows retry; success clears the cart/coupon and enables Continue shopping. The panel is excluded from production builds. Without a real backend/gateway, the production build does not perform payment processing.

## Membership and demo wallet

For Prime testing, use username `prime` and password `prime`. This preview does not verify passwords. It starts with Prime membership, an empty cart, and zero wallet funds; use demo top-up on the account page to test wallet payment. The original `cus_prime` account remains available.

Open **Membership & wallet** (`/account`) to view the current tier, benefits, balance, and transaction history. Each customer starts with zero demo funds. Top-ups accept whole-number THB amounts from 1 to 50,000, with a maximum wallet balance of 100,000 THB. Confirmations explicitly describe simulated funds.

Pending checkout offers demo wallet payment. Insufficient funds leave the order and balance unchanged, and the account page remains accessible for top-ups during payment. A successful wallet payment deducts the recorded order total once, records a transaction, and completes the order. Cancellation does not deduct funds; gateway simulation does not affect the wallet. Wallet funds and history are separated by customer and retained in session storage.

Admins can open **Members** (`/admin/members`) to change Normal/Prime tiers and view balances. This requested extension supersedes the original SRS restriction that membership cannot change. Tier changes affect future checkout calculations; existing order totals remain unchanged. Prime benefits retain the existing SRS discount and shipping rules. Existing session snapshots receive wallet defaults automatically.

There are no backend services, REST API clients, or mock API servers in this project. Wallet operations are simulated in the production frontend as well as development; they never process real money. Production enforcement and authoritative persistence/calculations still require the separately developed backend. The store tests use the existing TypeScript dependency and Node, with no additional test framework.

## Check and build

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The original SRS remains in the parent directory as reference material.
