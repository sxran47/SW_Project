import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { Leaf, LogOut, Moon, Sun, ShoppingBag, Package, Ticket, ArrowUpRight } from 'lucide-react';
import { useSession, useCart } from '../../hooks/preview';
import { usePreview } from '../../stores/preview';
import { useUI } from '../../stores/ui';


import { AppMessage } from '../ui/common';
export function Shell() { const { data: user } = useSession(); const { data: cart } = useCart(); const dark = useUI((s) => s.dark); const toggle = useUI((s) => s.toggleTheme); const navigate = useNavigate(); useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  function logout() { usePreview.getState().signOut(); useUI.getState().notify(null); navigate('/login'); }
  const admin = user?.role === 'Admin';
  return <div className="app-shell"><div className="announcement">{admin ? 'UI PREVIEW / STORE ADMINISTRATION' : 'UI PREVIEW · Sample data only'}<span>EST. 2026</span></div><header className="site-header"><NavLink to={admin ? '/admin/products' : '/products'} className="brand"><span className="brand-symbol"><Leaf size={23}/></span>ritual<span className="brand-supply">SUPPLY</span></NavLink><nav aria-label="Main navigation">{admin ? <><NavLink data-testid="nav-admin-products" to="/admin/products"><Package size={16}/>Products</NavLink><NavLink data-testid="nav-admin-coupons" to="/admin/coupons"><Ticket size={16}/>Coupons</NavLink></> : <><NavLink data-testid="nav-products" to="/products">Shop essentials</NavLink><NavLink data-testid="nav-orders" to="/orders">My orders</NavLink><NavLink data-testid="nav-cart" to="/cart"><ShoppingBag size={17}/>Bag <span className="bag-count">{cart?.itemCount ?? 0}</span></NavLink></>}</nav><div className="header-actions"><span className="user-name">{user?.username}<small>{admin ? 'Administrator' : user?.memberTier === 'prime' ? 'Prime member' : 'Member'}</small></span><button className="icon-button" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button><button className="icon-button" onClick={() => void logout()} aria-label="Sign out"><LogOut size={18}/></button></div></header><div className="content-wrap"><AppMessage/><Outlet/></div><footer><div><span className="footer-brand">ritual supply.</span><p>A little ritual. A better day.</p></div><span>Made for the moments in between. <ArrowUpRight size={15}/></span><small>© 2026 Ritual Supply</small></footer></div>;
}
