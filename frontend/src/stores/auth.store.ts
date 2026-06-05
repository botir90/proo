import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  clearIfStale: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setUser: (user) => set({ user, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
      clearIfStale: () => {
        const { accessToken, refreshToken, user } = useAuthStore.getState();
        if (!accessToken || !user) {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          return true;
        }
        try {
          // PARENT uchun refreshToken = accessToken; boshqalarda refreshToken muddatini tekshiramiz
          const tokenToCheck = (refreshToken && refreshToken !== accessToken) ? refreshToken : accessToken;
          const b64url = tokenToCheck.split('.')[1];
          const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(b64));
          if (Date.now() >= payload.exp * 1000) {
            set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            return true;
          }
          // PARENT rolida sub tekshiruvini o'tkazib yuboramiz
          if (user.role !== 'PARENT' && payload.sub !== user.id) {
            set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'educrm-auth',
      storage: createJSONStorage(() => {
        // SSR da localStorage yo'q — window tekshiruvi
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
