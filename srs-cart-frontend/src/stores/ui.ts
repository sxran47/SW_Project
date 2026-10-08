import { create } from 'zustand';
import type { ApiMessage } from '../types/api';
interface UIState { dark: boolean; message: ApiMessage | null; toggleTheme: () => void; notify: (message: ApiMessage | null) => void }
export const useUI = create<UIState>((set) => ({ dark: localStorage.getItem('ritual-theme') === 'dark', message: null, toggleTheme: () => set((state) => { const dark = !state.dark; localStorage.setItem('ritual-theme', dark ? 'dark' : 'light'); return { dark }; }), notify: (message) => set({ message }) }));
