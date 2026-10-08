import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Leaf } from 'lucide-react';
import { authApi } from './api';
import { useAuth } from '../../stores/auth';
import { useUI } from '../../stores/ui';
import { useSession } from '../../hooks/queries';
import { normalizeError } from '../../services/apiClient';
import { AppMessage, ErrorState, Loading } from '../../components/ui/common';
const schema = z.object({ username: z.string().min(1, 'Enter your username.'), password: z.string().min(1, 'Enter your password.') });
export function LoginPage() {
  const [visible, setVisible] = useState(false); const client = useQueryClient(); const { data: user, isLoading, error, refetch } = useSession(); const token = useAuth((s) => s.token);
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const login = useMutation({ mutationFn: authApi.login, onSuccess: (session) => { client.clear(); useUI.getState().notify(null); useAuth.getState().setSession(session); client.setQueryData(['session', session.token], session.user); }, onError: (error) => { const e = normalizeError(error); useUI.getState().notify({ kind: 'error', code: e.code, message: e.message }); } });
  if (user) return <Navigate to={user.role === 'Admin' ? '/admin/products' : '/products'} replace/>;
  if (token && isLoading) return <Loading/>;
  if (token && error) return <ErrorState error={error} retry={() => void refetch()}/>;
  return <main className="login-page" data-testid="page-login"><section className="login-story"><a className="brand" href="/login"><span className="brand-symbol"><Leaf size={24}/></span>ritual<span className="brand-supply">SUPPLY</span></a><div><span className="eyebrow">A LITTLE RITUAL. A BETTER DAY.</span><h1>Good mornings<br/>start here.</h1><p>Thoughtful tools. Beautiful coffee.<br/>Everything for your everyday ritual.</p><div className="login-illustration"><div className="coffee-cup"><span/></div><div className="coffee-saucer"/></div></div><span className="story-bottom">Carefully selected. Simply enjoyed.</span></section><section className="login-form-panel"><div className="login-form"><span className="eyebrow">WELCOME TO RITUAL SUPPLY</span><h2>Make yourself at home.</h2><p>Sign in to shop your essentials or manage your store.</p><AppMessage/><form onSubmit={handleSubmit((values) => login.mutate(values))} noValidate><label htmlFor="username">Username</label><input id="username" data-testid="login-username" autoComplete="username" placeholder="Your username" {...register('username')} aria-invalid={!!errors.username} aria-describedby={errors.username ? 'username-error' : undefined}/>{errors.username && <p className="field-error" id="username-error">{errors.username.message}</p>}<label htmlFor="password">Password</label><div className="password-field"><input id="password" data-testid="login-password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" {...register('password')} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined}/><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>{errors.password && <p className="field-error" id="password-error">{errors.password.message}</p>}<button className="btn primary full" data-testid="login-submit" disabled={login.isPending}>{login.isPending ? 'Signing in…' : 'Sign in'}<ArrowRight size={18}/></button></form>{import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === 'true' && <div className="demo-accounts"><strong>Development accounts</strong><p>cus_normal · cus_prime · admin01<br/>Password for all accounts: <code>password</code></p></div>}<p className="login-footnote">Your next great cup is just a ritual away.</p></div></section></main>;
}
