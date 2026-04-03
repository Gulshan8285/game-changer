'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import PageLayout from './PageLayout';
import { ScrollText, FileText, Scale, AlertTriangle, Shield, Users, Lock, Banknote, CheckCircle2, Gavel, RefreshCw, Bitcoin } from 'lucide-react';

const SECTIONS = [
  {
    icon: <FileText className="w-5 h-5 text-amber-500" />,
    title: '1. Acceptance of Terms',
    content: [
      'By creating an account and using BitPay Wallet ("the Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms") in their entirety. If you do not agree to any part of these Terms, you must not use our services.',
      'These Terms constitute a legally binding agreement between you ("User") and BitPay Wallet Pvt. Ltd. ("Company"), a company incorporated under the laws of India.',
    ]
  },
  {
    icon: <Users className="w-5 h-5 text-amber-500" />,
    title: '2. Eligibility',
    content: [
      'You must be at least 18 years of age and a resident of India to use this Platform.',
      'By using this service, you represent and warrant that you meet these eligibility requirements.',
      'Users must provide accurate and complete information during registration and keep their profile updated.',
      'You must not be barred from using the services under any applicable law.',
    ]
  },
  {
    icon: <Shield className="w-5 h-5 text-amber-500" />,
    title: '3. Account Registration & Security',
    content: [
      'When you create an account, you must provide accurate, current, and complete information including your full name, email address, phone number, and other required details.',
      'You are solely responsible for maintaining the confidentiality of your account credentials (password, 2FA codes, PIN).',
      'You must notify us immediately of any unauthorized access or use of your account.',
      'BitPay Wallet will never ask for your password or 2FA codes via email, phone, or chat.',
      'Each user is limited to one account. Multiple accounts may result in suspension.',
    ]
  },
  {
    icon: <Bitcoin className="w-5 h-5 text-amber-500" />,
    title: '4. Bitcoin Services',
    content: [
      'BitPay Wallet provides Bitcoin-related services including real-time price tracking in INR, portfolio management, and payment processing.',
      'Bitcoin is a volatile digital asset, and its value can fluctuate significantly. We do not provide investment advice, and you should conduct your own research before making any investment decisions.',
      'All Bitcoin transactions, once confirmed on the blockchain, are irreversible. BitPay Wallet is not liable for losses arising from market fluctuations.',
      'We provide real-time INR pricing sourced from multiple exchanges. Prices may vary slightly due to market conditions.',
      'BitPay Wallet acts as an intermediary and is not a financial institution, bank, or registered broker-dealer.',
    ]
  },
  {
    icon: <Banknote className="w-5 h-5 text-amber-500" />,
    title: '5. KYC & Banking Information',
    content: [
      'To use certain features, you may be required to complete KYC (Know Your Customer) verification and provide banking information including account numbers, IFSC codes, and UPI IDs.',
      'You are solely responsible for the accuracy of this information. BitPay Wallet takes reasonable measures to protect your data but cannot be held liable for losses arising from incorrect banking information.',
      'KYC information is processed in compliance with RBI guidelines and Indian data protection laws.',
    ]
  },
  {
    icon: <Lock className="w-5 h-5 text-amber-500" />,
    title: '6. UPI Transactions',
    content: [
      'All UPI transactions are processed through authorized payment gateway partners.',
      'BitPay Wallet acts as an intermediary and is not responsible for any failures, delays, or issues arising from the underlying UPI infrastructure or your bank.',
      'UPI transaction limits are subject to RBI guidelines and your bank\'s policies.',
      'Transaction fees, if any, will be clearly displayed before confirmation.',
    ]
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    title: '7. Prohibited Activities',
    content: [
      'Using the Platform for any illegal activities under Indian or international law.',
      'Attempting to hack, bypass, compromise, or exploit security vulnerabilities in our systems.',
      'Using automated bots, scripts, or scraping tools to access the Platform.',
      'Engaging in money laundering, terrorist financing, fraud, or other financial crimes.',
      'Impersonating any person or entity or providing false information.',
      'Sharing your account credentials with any third party.',
      'Using the Platform to circumvent any applicable economic sanctions.',
      'Posting or transmitting any harmful, offensive, or objectionable content.',
    ]
  },
  {
    icon: <Scale className="w-5 h-5 text-amber-500" />,
    title: '8. Risk Disclosure',
    content: [
      'Cryptocurrency investments carry inherent risks including but not limited to: market volatility, regulatory changes, technology failures, security breaches, liquidity risks, and loss of private keys.',
      'The value of Bitcoin can decrease dramatically and you may lose your entire investment.',
      'Past performance is not indicative of future results.',
      'BitPay Wallet shall not be liable for any losses resulting from Bitcoin price fluctuations, network congestion, or blockchain confirmation delays.',
      'You acknowledge these risks and agree that BitPay Wallet shall not be liable for any investment losses.',
    ]
  },
  {
    icon: <CheckCircle2 className="w-5 h-5 text-amber-500" />,
    title: '9. Intellectual Property',
    content: [
      'All content, logos, trademarks, service marks, and intellectual property displayed on the Platform are owned by or licensed to BitPay Wallet Pvt. Ltd.',
      'The BitPay Wallet name, logo, and all related branding are proprietary assets.',
      'You may not reproduce, distribute, modify, create derivative works from, or commercially exploit any content without our express written permission.',
      'Unauthorized use of our intellectual property will result in legal action.',
    ]
  },
  {
    icon: <Gavel className="w-5 h-5 text-amber-500" />,
    title: '10. Limitation of Liability',
    content: [
      'To the maximum extent permitted by applicable Indian law, BitPay Wallet shall not be liable for any indirect, incidental, special, consequential, or punitive damages.',
      'Our total liability for any claim shall not exceed the fees paid by you in the twelve (12) months preceding the event giving rise to the claim.',
      'We are not liable for any loss of Bitcoin, fiat currency, or other assets arising from: (a) Unauthorized access due to your failure to secure your credentials, (b) Market volatility, (c) Force majeure events, (d) Third-party service failures.',
    ]
  },
  {
    icon: <RefreshCw className="w-5 h-5 text-amber-500" />,
    title: '11. Indemnification',
    content: [
      'You agree to indemnify, defend, and hold harmless BitPay Wallet, its officers, directors, employees, agents, affiliates, and partners from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising from: (a) Your use of the Platform, (b) Your violation of these Terms, (c) Your violation of any applicable law or regulation.',
    ]
  },
  {
    icon: <Users className="w-5 h-5 text-amber-500" />,
    title: '12. Termination',
    content: [
      'We reserve the right to suspend or terminate your account at our sole discretion, without prior notice, for any violation of these Terms, suspicious activity, or regulatory requirements.',
      'You may terminate your account at any time by contacting support.',
      'Upon termination, your right to use the Platform ceases immediately. You may withdraw your Bitcoin balance within 30 days of termination.',
      'Sections that by their nature should survive termination will remain in effect.',
    ]
  },
  {
    icon: <Gavel className="w-5 h-5 text-amber-500" />,
    title: '13. Dispute Resolution & Governing Law',
    content: [
      'These Terms are governed by and construed in accordance with the laws of India, specifically the state of Maharashtra.',
      'Any disputes shall first be attempted to be resolved through amicable negotiation within 30 days.',
      'If unresolved, disputes shall be referred to arbitration in Mumbai in accordance with the Arbitration and Conciliation Act, 1996.',
      'The language of arbitration shall be English, and the arbitral tribunal shall consist of a sole arbitrator.',
      'Courts in Mumbai, Maharashtra shall have exclusive jurisdiction over any legal proceedings.',
    ]
  },
  {
    icon: <RefreshCw className="w-5 h-5 text-amber-500" />,
    title: '14. Amendments',
    content: [
      'We reserve the right to modify these Terms at any time.',
      'Material changes will be notified via email or in-app notification at least 15 days before taking effect.',
      'Your continued use of the Platform after such changes constitutes acceptance of the revised Terms.',
      'The latest version of these Terms will always be available on this page and in your Profile section.',
    ]
  },
  {
    icon: <ScrollText className="w-5 h-5 text-amber-500" />,
    title: '15. Contact Information',
    content: [
      'For any questions, concerns, or legal notices regarding these Terms, please contact us:',
      'Email: legal@bitpaywallet.in',
      'Phone: +91 22-4000-5000',
      'Address: BitPay Wallet Pvt. Ltd., Bandra Kurla Complex (BKC), Mumbai 400051, Maharashtra, India.',
    ]
  },
];

export default function TermsPageScreen() {
  const [customContent, setCustomContent] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCustomContent(data.content);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <PageLayout title="Terms & Conditions">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 mb-4">
          <ScrollText className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Terms & Conditions</h2>
        <p className="text-zinc-400 mt-1 text-sm">Last Updated: {customContent?.terms_last_updated || 'January 2025'}</p>
        <p className="text-zinc-500 text-xs mt-2 max-w-sm mx-auto">
          Please read these Terms carefully. By using BitPay Wallet, you agree to all the terms listed below.
        </p>
      </div>

      {customContent?.terms_page_full_text ? (
        <div className="space-y-4">
          {customContent!.terms_page_full_text.split('\n\n').map((section, i) => {
            const lines = section.split('\n').filter(l => l.trim());
            if (lines.length === 0) return null;
            return (
              <Card key={i} className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-sm">
                <CardContent className="p-5">
                  <ul className="space-y-2">
                    {lines.map((line, j) => (
                      <li key={j} className="text-zinc-400 text-sm leading-relaxed flex gap-2">
                        <span className="text-amber-500/50 mt-1.5 shrink-0">•</span>
                        <span>{line.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {SECTIONS.map((section, i) => (
            <Card key={i} className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  {section.icon}
                  <h3 className="text-white font-semibold text-sm">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {section.content.map((item, j) => (
                    <li key={j} className="text-zinc-400 text-sm leading-relaxed flex gap-2">
                      <span className="text-amber-500/50 mt-1.5 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Acknowledgment */}
      <Card className="mt-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardContent className="p-5 text-center">
          <CheckCircle2 className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-white font-medium text-sm">Acknowledgment</p>
          <p className="text-zinc-400 text-xs mt-1">
            By using BitPay Wallet, you confirm that you have read, understood, and agree to these Terms & Conditions.
          </p>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
