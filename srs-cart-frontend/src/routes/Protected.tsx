import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/auth';
import { useCart, useSession } from '../hooks/queries';
import { ErrorState, Loading } from '../components/ui/common';
import type { Role } from '../types/api';
export function Protected({ role }: { role: Role }) { const token = useAuth((s) => s.token); const { data: user, isLoading, error, refetch } = useSession(); const cart = useCart(); const location = useLocation(); if (!token) return <Navigate to="/login" replace/>; if (isLoading) return <Loading/>; if (error) return <ErrorState error={error} retry={() => void refetch()}/>; if (!user) return <Loading/>; if (user.role !== role) return <Navigate to={user.role === 'Admin' ? '/admin/products' : '/products'} replace/>; if (role === 'Customer') { if (cart.error) return <ErrorState error={cart.error} retry={() => void cart.refetch()}/>; if (!cart.data) return <Loading/>; // Read-only history is permitted in every stage (FR-8.5.2).
    if (!location.pathname.startsWith('/orders')) { const expected = cart.data.stage === 'payment' ? '/checkout' : cart.data.stage === 'success' ? '/success' : null; if (expected && location.pathname !== expected) return <Navigate to={expected} replace/>; if (!expected && ['/checkout', '/success'].includes(location.pathname)) return <Navigate to="/cart" replace/>; }
  } return <Outlet/>; }
