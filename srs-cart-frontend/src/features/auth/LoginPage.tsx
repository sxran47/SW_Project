import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Navigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Orbit } from 'lucide-react';

import { usePreview } from '../../stores/preview';
import { errorMessage } from '../../data/errors';
import { useUI } from '../../stores/ui';
import { useSession } from '../../hooks/preview';

import { AppMessage } from '../../components/ui/common';
const schema = z.object({ username: z.string().min(1, 'Enter your username.'), password: z.string().min(1, 'Enter your password.') });
export function LoginPage() {
  const [visible, setVisible] = useState(false); const { data: user } = useSession();
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  function openPreview(values: z.infer<typeof schema>) { useUI.getState().notify(null); try { usePreview.getState().signIn(values.username, values.password); } catch (error) { useUI.getState().notify(errorMessage(error)); } }
  if (user) return <Navigate to={user.role === 'Admin' ? '/admin/products' : '/products'} replace/>;
  return <main className="login-page" data-testid="page-login"><section className="login-story"><a className="brand" href="/login"><span className="brand-symbol"><Orbit size={24}/></span>orbit<span className="brand-supply">MARKET</span></a><div><span className="eyebrow">EVERYDAY FINDS. ONE MARKETPLACE.</span><h1>Your next find<br/>starts here.</h1><p>Discover products for everyday life.<br/>Browse, choose, and shop your way.</p><div className="login-illustration"><div className="market-parcel parcel-back"><span/></div><div className="market-parcel parcel-front"><span/></div><div className="parcel-orbit"/></div></div><span className="story-bottom">A world of everyday possibilities.</span></section><section className="login-form-panel"><div className="login-form"><span className="eyebrow">WELCOME TO ORBIT MARKET</span><h2>Welcome to your marketplace.</h2><p>Explore the Customer or Admin interface with sample data.</p><AppMessage/><form onSubmit={handleSubmit((values) => openPreview(values))} noValidate><label htmlFor="username">Username</label><input id="username" data-testid="login-username" autoComplete="username" placeholder="Your username" {...register('username')} aria-invalid={!!errors.username} aria-describedby={errors.username ? 'username-error' : undefined}/>{errors.username && <p className="field-error" id="username-error">{errors.username.message}</p>}<label htmlFor="password">Password</label><div className="password-field"><input id="password" data-testid="login-password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" {...register('password')} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined}/><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>{errors.password && <p className="field-error" id="password-error">{errors.password.message}</p>}<button className="btn primary full" data-testid="login-submit">Open preview<ArrowRight size={18}/></button></form><div className="demo-accounts"><strong>UI preview · no real sign-in</strong><p>Enter any username and password.<br/>Prime customer: <code>cus_prime</code> · Admin: <code>admin01</code> (any password).</p></div><p className="login-footnote">Your next find is just a browse away.</p></div></section></main>;
}
