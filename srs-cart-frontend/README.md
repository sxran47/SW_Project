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
- Admin product and coupon interfaces
- Responsive mobile/desktop layouts and light/dark themes

Products, coupons, and accounts start from SRS section 7. Each Customer starts with an empty cart and no orders. The local UI model demonstrates the SRS quantity limits, validation order/error codes, coupon/member discount rules, shipping amounts, and stock reservation/cancellation transitions. These are demo values and actions, not server records or real payments.

Checkout uses the selected cart and current product prices. Orders retain price snapshots; Admin changes update current cart prices/availability. Customer carts, coupons, stages, and orders are separated by account. Session-storage snapshots preserve the demonstration across reload and sign-out/sign-in in the same browser tab; they are not an authoritative database or secure authentication.

Stage navigation restores pending checkout or success. Order history/details remain accessible in every stage. Invalid or inaccessible order IDs show `ORDER_NOT_FOUND`.

During `npm run dev`, payment preview controls are clearly separated in the **Development only · simulated payment gateway** panel. Failure retains the pending order/reservation and allows retry; success clears the cart/coupon and enables Continue shopping. The panel is excluded from production builds. Without a real backend/gateway, the production build does not perform payment processing.

There are no backend services, REST API clients, mock API servers, automated test suites, or test dependencies in this project. Production enforcement and authoritative persistence/calculations still require the separately developed backend.

## Check and build

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

The original SRS remains in the parent directory as reference material.
