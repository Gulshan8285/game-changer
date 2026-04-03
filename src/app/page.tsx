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
  const { currentScreen, isAuthenticated, needsTermsAcceptance } = useAppStore();

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
