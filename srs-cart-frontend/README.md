# Ritual Supply — UI preview

Frontend UI only, built with React, TypeScript, Vite, Tailwind CSS, React Router, Zustand, React Hook Form, Zod, and Lucide icons.

## Run

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173.

The sign-in screen is a visual preview. Enter `admin01` to open the Admin interface, or any other username to open the Customer interface. Any non-empty password opens the preview. There is no authentication service.

## Screens

- Login, product catalog, shopping bag, coupon entry, delivery selection
- Checkout with pending/failure/success preview screens
- Sample order history and order details
- Admin product and coupon interfaces
- Responsive mobile/desktop layouts and light/dark themes

Data in `src/data/preview.ts` is illustrative. UI interactions update temporary in-memory state and reset on reload. Checkout shows a fixed sample order; it does not calculate a real quote, place an order, reserve stock, or process payment. Admin edits affect only the current preview.

There are no backend services, REST API clients, mock API servers, automated test suites, or test dependencies in this project.

## Check and build

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

The original SRS remains in the parent directory as reference material.
