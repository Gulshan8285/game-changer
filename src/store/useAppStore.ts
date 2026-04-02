import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  accountNo?: string;
  accountNo2?: string;
  ifscCode?: string;
  bankName?: string;
  upiId?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  termsAccepted: boolean;
  isGoogleAuth: boolean;
}

export type AppScreen =
  | 'login'
  | 'signup'
  | 'terms'
  | 'dashboard'
  | 'profile'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'refund'
  | 'termsPage';

const SUB_PAGES: AppScreen[] = ['about', 'contact', 'privacy', 'refund', 'termsPage'];

interface AppState {
  // Navigation
  currentScreen: AppScreen;
  previousScreen: AppScreen | null;
  setScreen: (screen: AppScreen) => void;
  goBack: () => void;

  // Auth
  isAuthenticated: boolean;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
  needsTermsAcceptance: boolean;
  setNeedsTermsAcceptance: (v: boolean) => void;

  // Bitcoin data
  bitcoinPrice: { inr: number; usd: number; change24h: number; marketCap: number; volume24h: number } | null;
  bitcoinHistory: any[];
  setBitcoinData: (price: any, history: any[]) => void;

  // Dashboard sub-view (shared across screens)
  dashboardView: 'dashboard' | 'wallet' | 'history';
  setDashboardView: (view: 'dashboard' | 'wallet' | 'history') => void;

  // UI state
  isLoading: boolean;
  setLoading: (v: boolean) => void;
  _hydrated: boolean;
  setHydrated: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentScreen: 'login',
      previousScreen: null,
      setScreen: (screen) =>
        set({ previousScreen: get().currentScreen, currentScreen: screen }),
      goBack: () => {
        const prev = get().previousScreen;
        if (prev) set({ currentScreen: prev, previousScreen: null });
      },

      // Auth
      isAuthenticated: false,
      user: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false, currentScreen: 'login', previousScreen: null, needsTermsAcceptance: false }),

      needsTermsAcceptance: false,
      setNeedsTermsAcceptance: (v) => set({ needsTermsAcceptance: v }),

      // Bitcoin
      bitcoinPrice: null,
      bitcoinHistory: [],
      setBitcoinData: (price, history) => set({ bitcoinPrice: price, bitcoinHistory: history }),

      // Dashboard sub-view
      dashboardView: 'dashboard' as const,
      setDashboardView: (view) => set({ dashboardView: view }),

      // UI
      isLoading: false,
      setLoading: (v) => set({ isLoading: v }),
      _hydrated: false,
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'btc-wallet-storage',
      partialize: (state) => ({
        currentScreen: state.currentScreen,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        needsTermsAcceptance: state.needsTermsAcceptance,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hydrated = true;
          // If user is authenticated but hasn't accepted terms, force terms screen
          if (state.isAuthenticated && state.needsTermsAcceptance) {
            state.currentScreen = 'terms';
          }
          // If terms already accepted but stuck on terms screen, go to dashboard
          else if (state.user?.termsAccepted && state.currentScreen === 'terms') {
            state.currentScreen = 'dashboard';
            state.needsTermsAcceptance = false;
          }
          // Fix stale navigation: if authenticated and on sub-page, go to dashboard
          else if (state.isAuthenticated && SUB_PAGES.includes(state.currentScreen)) {
            state.currentScreen = 'dashboard';
          }
        }
      },
    }
  )
);
