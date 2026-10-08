import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCart, useSession } from '../hooks/preview';
import type { Role } from '../types/ui';
// Local UI stage navigation; production authorization still requires a backend.
export function Protected({ role }: { role: Role }) {
  const { data: user } = useSession();
  const { data: cart } = useCart();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role !== role) return <Navigate to={user.role === 'Admin' ? '/admin/products' : '/products'} replace/>;
  // Order history/details remain accessible in every stage (FR-8.5.2).
  if (role === 'Customer' && !location.pathname.startsWith('/orders')) {
    const expected = cart.stage === 'payment' ? '/checkout' : cart.stage === 'success' ? '/success' : null;
    if (expected && location.pathname !== expected) return <Navigate to={expected} replace/>;
    if (!expected && ['/checkout', '/success'].includes(location.pathname)) return <Navigate to="/cart" replace/>;
  }
  return <Outlet/>;
}
