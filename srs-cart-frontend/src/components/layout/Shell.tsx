import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { Orbit, LogOut, Moon, Sun, ShoppingCart, Package, Ticket, ArrowUpRight, Wallet, Crown } from 'lucide-react';
import { useSession, useCart } from '../../hooks/preview';
import { usePreview } from '../../stores/preview';
import { useUI } from '../../stores/ui';


import { AppMessage } from '../ui/common';
export function Shell() { const { data: user } = useSession(); const { data: cart } = useCart(); const dark = useUI((s) => s.dark); const toggle = useUI((s) => s.toggleTheme); const navigate = useNavigate(); useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  function logout() { usePreview.getState().signOut(); useUI.getState().notify(null); useUI.getState().setScenario('normal'); navigate('/login'); }
  const admin = user?.role === 'Admin';
  return <div className="app-shell"><div className="announcement">{admin ? 'ORBIT MARKET / STORE ADMINISTRATION' : 'ORBIT MARKET · Your everyday marketplace'}<span>EST. 2026</span></div><header className="site-header"><NavLink to={admin ? '/admin/products' : '/products'} className="brand"><span className="brand-symbol"><Orbit size={23}/></span>orbit<span className="brand-supply">MARKET</span></NavLink><nav aria-label="Main navigation">{admin ? <><NavLink data-testid="nav-admin-products" to="/admin/products"><Package size={16}/>Products</NavLink><NavLink data-testid="nav-admin-members" to="/admin/members"><Crown size={16}/>Members</NavLink><NavLink data-testid="nav-admin-coupons" to="/admin/coupons"><Ticket size={16}/>Coupons</NavLink></> : <><NavLink data-testid="nav-products" to="/products">Shop products</NavLink><NavLink data-testid="nav-orders" to="/orders">My orders</NavLink><NavLink data-testid="nav-account" to="/account"><Wallet size={17}/>Membership & wallet</NavLink><NavLink data-testid="nav-cart" to="/cart"><ShoppingCart size={17}/>Cart <span className="bag-count">{cart?.itemCount ?? 0}</span></NavLink></>}</nav><div className="header-actions"><span className="user-name">{user?.username}<small>{admin ? 'Administrator' : user?.memberTier === 'prime' ? 'Prime member' : 'Member'}</small></span><button className="icon-button" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button><button className="icon-button" onClick={() => void logout()} aria-label="Sign out"><LogOut size={18}/></button></div></header><div className="content-wrap"><AppMessage/><Outlet/></div><footer><div><span className="footer-brand">orbit market.</span><p>Your everyday marketplace.</p></div><span>Browse. Choose. Make it yours. <ArrowUpRight size={15}/></span><small>© 2026 Orbit Market</small></footer></div>;
}
