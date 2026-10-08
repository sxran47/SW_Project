import { create } from 'zustand';
import type { UIMessage } from '../types/ui';
interface UIState { dark: boolean; message: UIMessage | null; toggleTheme: () => void; notify: (message: UIMessage | null) => void }
export const useUI = create<UIState>((set) => ({ dark: localStorage.getItem('ritual-theme') === 'dark', message: null, toggleTheme: () => set((state) => { const dark = !state.dark; localStorage.setItem('ritual-theme', dark ? 'dark' : 'light'); return { dark }; }), notify: (message) => set({ message }) }));
