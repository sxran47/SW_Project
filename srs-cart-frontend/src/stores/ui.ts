import { create } from 'zustand';
import type { UIMessage } from '../types/ui';
export type DisplayScenario = 'normal' | 'loading' | 'empty' | 'error';
interface UIState { dark: boolean; message: UIMessage | null; scenario: DisplayScenario; setScenario: (scenario: DisplayScenario) => void; toggleTheme: () => void; notify: (message: UIMessage | null) => void }
export const useUI = create<UIState>((set) => ({ dark: localStorage.getItem('ritual-theme') === 'dark', message: null, scenario: 'normal', setScenario: (scenario) => set({ scenario }), toggleTheme: () => set((state) => { const dark = !state.dark; localStorage.setItem('ritual-theme', dark ? 'dark' : 'light'); return { dark }; }), notify: (message) => set({ message }) }));
