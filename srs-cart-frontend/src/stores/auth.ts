import { create } from 'zustand';
import type { Session } from '../types/api';
interface AuthState { token: string | null; setSession: (session: Session) => void; clear: () => void }
// Only the session credential is retained. User, role, stage, and domain data come from the API.
export const useAuth = create<AuthState>((set) => ({ token: sessionStorage.getItem('ritual-token'), setSession: ({ token }) => { sessionStorage.setItem('ritual-token', token); set({ token }); }, clear: () => { sessionStorage.removeItem('ritual-token'); set({ token: null }); } }));
