import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../hooks/preview';
import type { Role } from '../types/ui';
// Visual navigation only. No real authentication or authorization.
export function Protected({ role }: { role: Role }) { const { data: user } = useSession(); if (!user) return <Navigate to="/login" replace/>; if (user.role !== role) return <Navigate to={user.role === 'Admin' ? '/admin/products' : '/products'} replace/>; return <Outlet/>; }
