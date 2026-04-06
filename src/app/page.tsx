'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import dynamic from 'next/dynamic';

// Dynamic imports — LoginScreen preloaded for instant first load
const LoginScreen = dynamic(() => import('@/components/bitcoin/LoginScreen'), { ssr: false });
const SignupScreen = dynamic(() => import('@/components/bitcoin/SignupScreen'), { ssr: false });
const TermsScreen = dynamic(() => import('@/components/bitcoin/TermsScreen'), { ssr: false });
const DashboardScreen = dynamic(() => import('@/components/bitcoin/DashboardScreen'), { ssr: false });
const ProfileScreen = dynamic(() => import('@/components/bitcoin/ProfileScreen'), { ssr: false });
const AboutUsScreen = dynamic(() => import('@/components/bitcoin/AboutUsScreen'), { ssr: false });
const ContactUsScreen = dynamic(() => import('@/components/bitcoin/ContactUsScreen'), { ssr: false });
const PrivacyPolicyScreen = dynamic(() => import('@/components/bitcoin/PrivacyPolicyScreen'), { ssr: false });
const RefundPolicyScreen = dynamic(() => import('@/components/bitcoin/RefundPolicyScreen'), { ssr: false });
const TermsPageScreen = dynamic(() => import('@/components/bitcoin/TermsPageScreen'), { ssr: false });

export default function Home() {
  const { currentScreen, isAuthenticated, needsTermsAcceptance, user, logout } = useAppStore();

  // Prevent phone back button from killing the app
  useEffect(() => {
    // Push a dummy state so back button has somewhere to go
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // Push again so next back press is also blocked
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let cancelled = false;

    const pingSession = async () => {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, action: 'heartbeat' }),
        });
        const data = await res.json().catch(() => null);

        if (!cancelled && data?.forceLogout) {
          logout();
        }
      } catch {
        // Ignore transient heartbeat issues.
      }
    };

    pingSession();
    const interval = window.setInterval(pingSession, 60000);
    const handleFocus = () => { void pingSession(); };
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void pingSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user?.id, logout]);

  // Force terms screen if user needs to accept terms
  const effectiveScreen = (isAuthenticated && needsTermsAcceptance) ? 'terms' : currentScreen;

  // Instant render — no AnimatePresence to avoid wait delay
  switch (effectiveScreen) {
    case 'login': return <LoginScreen />;
    case 'signup': return <SignupScreen />;
    case 'terms': return <TermsScreen />;
    case 'dashboard': return <DashboardScreen />;
    case 'profile': return <ProfileScreen />;
    case 'about': return <AboutUsScreen />;
    case 'contact': return <ContactUsScreen />;
    case 'privacy': return <PrivacyPolicyScreen />;
    case 'refund': return <RefundPolicyScreen />;
    case 'termsPage': return <TermsPageScreen />;
    default: return <LoginScreen />;
  }
}
