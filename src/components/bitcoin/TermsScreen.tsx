'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, ArrowRight, ScrollText, CheckCircle2 } from 'lucide-react';

const TERMS_CONTENT = `
BITPAY WALLET - TERMS AND CONDITIONS
Last Updated: January 2025

Welcome to BitPay Wallet ("the Platform"). By accessing or using our services, you agree to be bound by these Terms and Conditions ("Terms"). Please read them carefully before proceeding.

1. ACCEPTANCE OF TERMS
By creating an account and using BitPay Wallet, you acknowledge that you have read, understood, and agree to be bound by these Terms in their entirety. If you do not agree to any part of these Terms, you must not use our services.

2. ELIGIBILITY
You must be at least 18 years of age and a resident of India to use this Platform. By using this service, you represent and warrant that you meet these eligibility requirements. Users must provide accurate and complete information during registration.

3. ACCOUNT REGISTRATION
When you create an account, you must provide accurate, current, and complete information including your full name, email address, phone number, and other required details. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

4. BITCOIN SERVICES
BitPay Wallet provides Bitcoin-related services including price tracking, portfolio management, and payment processing. Bitcoin is a volatile digital asset, and its value can fluctuate significantly. We do not provide investment advice, and you should conduct your own research before making any investment decisions.

5. KYC AND BANKING INFORMATION
To use certain features, you may be required to provide banking information including account numbers, IFSC codes, and UPI IDs. You are solely responsible for the accuracy of this information. BitPay Wallet takes reasonable measures to protect your data but cannot be held liable for losses arising from incorrect banking information.

6. UPI TRANSACTIONS
All UPI transactions are processed through authorized payment gateways. BitPay Wallet acts as an intermediary and is not responsible for any failures, delays, or issues arising from the underlying UPI infrastructure or your bank.

7. PRIVACY AND DATA PROTECTION
We collect and process your personal data in accordance with applicable Indian data protection laws. Your personal information, including banking details and UPI IDs, is encrypted and stored securely. We will never share your personal data with third parties without your explicit consent, except as required by law.

8. FEES AND CHARGES
BitPay Wallet reserves the right to charge fees for certain services. Any applicable fees will be clearly communicated to you before you are charged. We reserve the right to modify our fee structure with reasonable notice.

9. PROHIBITED ACTIVITIES
You agree not to: (a) use the Platform for any illegal activities; (b) attempt to hack, bypass, or compromise our security systems; (c) use automated bots or scripts to access the Platform; (d) engage in money laundering, fraud, or other financial crimes; (e) impersonate any person or entity.

10. RISK DISCLOSURE
Cryptocurrency investments carry inherent risks including but not limited to: market volatility, regulatory changes, technology failures, and security breaches. You acknowledge these risks and agree that BitPay Wallet shall not be liable for any losses resulting from Bitcoin price fluctuations.

11. INTELLECTUAL PROPERTY
All content, logos, trademarks, and intellectual property displayed on the Platform are owned by or licensed to BitPay Wallet. You may not reproduce, distribute, or create derivative works without our express written permission.

12. LIMITATION OF LIABILITY
To the maximum extent permitted by law, BitPay Wallet shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. Our total liability shall not exceed the fees paid by you in the twelve months preceding the claim.

13. INDEMNIFICATION
You agree to indemnify and hold harmless BitPay Wallet, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Platform or violation of these Terms.

14. TERMINATION
We reserve the right to suspend or terminate your account at our sole discretion, without prior notice, for any violation of these Terms or suspicious activity. Upon termination, your right to use the Platform ceases immediately.

15. DISPUTE RESOLUTION
Any disputes arising from these Terms shall be resolved through arbitration in accordance with the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted in English in Mumbai, India.

16. GOVERNING LAW
These Terms are governed by the laws of India. Any legal proceedings shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.

17. AMENDMENTS
We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Platform. Your continued use of the Platform after such changes constitutes your acceptance of the revised Terms.

18. CONTACT INFORMATION
For any questions or concerns regarding these Terms, please contact us at:
Email: support@bitpaywallet.in
Address: BitPay Wallet Pvt. Ltd., Mumbai, Maharashtra, India

By scrolling through and accepting these Terms, you confirm that you have read, understood, and agree to be bound by all the provisions outlined above. This acceptance is legally binding and forms the basis of your relationship with BitPay Wallet.

Thank you for choosing BitPay Wallet. Happy investing!
`;

export default function TermsScreen() {
  const [termsContent, setTermsContent] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, setScreen, setUser, setNeedsTermsAcceptance } = useAppStore();

  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.content?.login_terms_text) {
          setTermsContent(data.content.login_terms_text);
        }
      })
      .catch(() => {});
  }, []);

  // SAFETY GUARD: If no user, redirect to login
  useEffect(() => {
    if (!user?.id) {
      setScreen('login');
    }
  }, [user, setScreen]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      setScrollProgress(100);
      setHasScrolledToBottom(true);
      return;
    }
    const pct = Math.min(100, Math.round((el.scrollTop / maxScroll) * 100));
    setScrollProgress(pct);
    if (pct >= 90) {
      setHasScrolledToBottom(true);
    }
  }, []);

  const handleAccept = useCallback(() => {
    // Safety: block if already submitting or not accepted
    if (submitting || !accepted) return;
    setSubmitting(true);

    // Step 1: Update local state IMMEDIATELY
    if (user) {
      setUser({ ...user, termsAccepted: true });
    }
    setNeedsTermsAcceptance(false);

    // Step 2: Navigate to dashboard IMMEDIATELY — don't wait for API
    setScreen('dashboard');

    // Step 3: Save to database in background (fire and forget)
    if (user?.id) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, termsAccepted: true }),
        signal: controller.signal,
      }).catch(() => { /* silently ignore */ })
        .finally(() => clearTimeout(timeout));
    }

    setSubmitting(false);
  }, [accepted, submitting, user, setUser, setNeedsTermsAcceptance, setScreen]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-orange-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 mb-3">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Terms & Conditions</h1>
          <p className="text-zinc-400 mt-1">Please read carefully before proceeding</p>
        </div>

        <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-6">
            {/* Scroll indicator */}
            {!hasScrolledToBottom && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-4 animate-pulse">
                <ScrollText className="w-4 h-4 shrink-0" />
                <span>Scroll down to read all terms ({scrollProgress}%)</span>
              </div>
            )}
            {hasScrolledToBottom && !accepted && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All terms read! Please check the box below to accept.</span>
              </div>
            )}
            {hasScrolledToBottom && accepted && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Terms accepted! Click &quot;Accept &amp; Continue&quot; to proceed.</span>
              </div>
            )}

            {/* Scrollable terms content */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-[350px] overflow-y-auto rounded-lg bg-zinc-800/50 border border-zinc-700 p-4 text-sm text-zinc-300 leading-relaxed custom-scrollbar"
            >
              <pre className="whitespace-pre-wrap font-sans">{(termsContent || TERMS_CONTENT).trim()}</pre>
            </div>

            {/* Progress indicator */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${scrollProgress >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
              <span className={`text-xs font-medium min-w-[36px] text-right ${scrollProgress >= 90 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {scrollProgress}%
              </span>
            </div>

            {/* Accept checkbox */}
            <div className="mt-4 flex items-start gap-3">
              <Checkbox
                id="accept-terms"
                checked={accepted}
                onCheckedChange={(checked) => {
                  setAccepted(checked === true);
                }}
                disabled={!hasScrolledToBottom}
                className="mt-0.5 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
              <label
                htmlFor="accept-terms"
                className={`text-sm leading-snug ${hasScrolledToBottom ? 'text-zinc-300 cursor-pointer' : 'text-zinc-600 cursor-not-allowed'}`}
              >
                I have read and agree to the Terms & Conditions, Privacy Policy, and acknowledge the risk disclosure related to cryptocurrency investments.
              </label>
            </div>

            {/* Accept button */}
            <button
              type="button"
              onClick={handleAccept}
              disabled={!accepted || submitting}
              className={`w-full mt-4 font-semibold py-5 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                accepted && !submitting
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/25 cursor-pointer'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed shadow-none'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  Accept & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
