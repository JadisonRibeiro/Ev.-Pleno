import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types/api';
import { setToken } from './api';

interface AuthState {
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setSession: (token, user) => {
        setToken(token);
        set({ user });
      },
      logout: () => {
        setToken(null);
        set({ user: null });
      },
    }),
    { name: 'igreja.auth', partialize: (s) => ({ user: s.user }) },
  ),
);
