import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { CartPage } from '../features/cart/CartPage';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { OrderDetailPage, OrdersPage } from '../features/orders/OrdersPages';
import { AdminCouponsPage, AdminProductsPage } from '../features/admin/AdminPages';
import { Protected } from '../routes/Protected';
import { Shell } from '../components/layout/Shell';
import { useUI } from '../stores/ui';
export function App() { const dark = useUI((s) => s.dark); useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]); return <BrowserRouter><a className="skip-link" href="#main-content">Skip to content</a><div id="main-content"><Routes><Route path="/login" element={<LoginPage/>}/><Route element={<Protected role="Customer"/>}><Route element={<Shell/>}><Route path="/products" element={<ProductsPage/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="/success" element={<CheckoutPage success/>}/><Route path="/orders" element={<OrdersPage/>}/><Route path="/orders/:orderId" element={<OrderDetailPage/>}/></Route></Route><Route element={<Protected role="Admin"/>}><Route element={<Shell/>}><Route path="/admin/products" element={<AdminProductsPage/>}/><Route path="/admin/coupons" element={<AdminCouponsPage/>}/></Route></Route><Route path="*" element={<Navigate to="/products" replace/>}/></Routes></div></BrowserRouter>; }
