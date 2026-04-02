'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import PageLayout from './PageLayout';
import { Shield, Eye, Lock, Database, Bell, UserCheck, Server, FileText, Globe } from 'lucide-react';

const SECTIONS = [
  {
    icon: <Eye className="w-5 h-5 text-amber-500" />,
    title: '1. Information We Collect',
    content: [
      'Personal Information: When you create an account, we collect your full name, email address, phone number, and profile photo. This information is necessary for account creation, identity verification, and to provide our services.',
      'Banking Information: We collect bank account details (account number, IFSC code, bank name) and UPI IDs that you voluntarily provide for processing transactions. This data is encrypted using AES-256 encryption.',
      'Transaction Data: We record details of all Bitcoin transactions processed through our platform, including amounts, timestamps, and wallet addresses involved.',
      'Device & Usage Data: We automatically collect information about your device (type, operating system, browser), IP address, and usage patterns (pages visited, features used, time spent) to improve our services.',
      'Location Data: With your consent, we may collect your approximate location to provide location-specific services and comply with regulatory requirements.',
    ]
  },
  {
    icon: <Database className="w-5 h-5 text-amber-500" />,
    title: '2. How We Use Your Information',
    content: [
      'To provide, maintain, and improve BitPay Wallet services including Bitcoin trading, portfolio management, and price tracking.',
      'To process your transactions securely and maintain accurate records.',
      'To verify your identity and prevent fraud, money laundering, and unauthorized access.',
      'To send you important notifications about your account, transactions, and security alerts.',
      'To provide customer support and respond to your inquiries.',
      'To comply with Indian laws, regulations, and legal processes including RBI guidelines.',
      'To analyze usage patterns and improve our platform\'s user experience.',
      'To send promotional communications (only with your opt-in consent, which you can withdraw anytime).',
    ]
  },
  {
    icon: <Server className="w-5 h-5 text-amber-500" />,
    title: '3. Data Storage & Security',
    content: [
      'All personal data is stored on secure servers located in India, complying with data localization requirements.',
      'Your banking details and UPI IDs are encrypted using AES-256 encryption at rest and TLS 1.3 for data in transit.',
      'We use industry-standard security measures including firewalls, intrusion detection systems, and regular security audits.',
      'Access to your personal data is strictly limited to authorized personnel on a need-to-know basis.',
      'We perform regular backups and have a disaster recovery plan in place.',
      'Two-factor authentication (2FA) is available to add an extra layer of security to your account.',
    ]
  },
  {
    icon: <Globe className="w-5 h-5 text-amber-500" />,
    title: '4. Data Sharing & Third Parties',
    content: [
      'We do NOT sell, rent, or trade your personal information to third parties for marketing purposes.',
      'We may share your data with: Payment processors (for UPI/bank transactions), Government authorities (when legally required), Law enforcement (with valid court orders), Service providers who assist in operating our platform (bound by strict data processing agreements).',
      'If BitPay Wallet is involved in a merger, acquisition, or asset sale, your personal data may be transferred to the acquiring entity with continued protection under this policy.',
    ]
  },
  {
    icon: <UserCheck className="w-5 h-5 text-amber-500" />,
    title: '5. Your Rights',
    content: [
      'Right to Access: You can request a copy of all personal data we hold about you by contacting our support team.',
      'Right to Correction: You can update or correct your personal information through your Profile settings or by contacting support.',
      'Right to Deletion: You can request deletion of your account and personal data. Some data may be retained for legal compliance.',
      'Right to Portability: You can request your data in a machine-readable format.',
      'Right to Withdraw Consent: You can withdraw consent for data processing at any time by contacting support.',
      'Right to Opt-Out: You can opt out of promotional communications by clicking the unsubscribe link or updating your notification preferences.',
    ]
  },
  {
    icon: <Bell className="w-5 h-5 text-amber-500" />,
    title: '6. Cookies & Tracking',
    content: [
      'We use essential cookies to maintain your session, remember your preferences, and ensure security.',
      'Analytics cookies help us understand how users interact with our platform so we can improve the experience.',
      'You can manage cookie preferences through your browser settings. Disabling cookies may affect some features.',
      'We do not use third-party advertising cookies or participate in cross-site tracking.',
    ]
  },
  {
    icon: <FileText className="w-5 h-5 text-amber-500" />,
    title: '7. Data Retention',
    content: [
      'We retain your personal data for as long as your account is active or as needed to provide services.',
      'Transaction records are maintained for a minimum of 5 years as required by Indian financial regulations.',
      'If you delete your account, we will remove your personal data within 30 days, except where retention is legally required.',
      'Inactive accounts (no login for 24+ months) may be archived with limited data retention.',
    ]
  },
  {
    icon: <Lock className="w-5 h-5 text-amber-500" />,
    title: '8. Children\'s Privacy',
    content: [
      'BitPay Wallet is not intended for use by individuals under 18 years of age.',
      'We do not knowingly collect personal information from children. If we discover that a child under 18 has provided us with personal data, we will delete it promptly.',
    ]
  },
  {
    icon: <Shield className="w-5 h-5 text-amber-500" />,
    title: '9. Changes to This Policy',
    content: [
      'We may update this Privacy Policy from time to time. Material changes will be notified via email or in-app notification at least 15 days before taking effect.',
      'The updated policy will be posted on this page with the revised "Last Updated" date.',
      'Continued use of BitPay Wallet after changes constitutes acceptance of the revised policy.',
    ]
  },
];

export default function PrivacyPolicyScreen() {
  const [customContent, setCustomContent] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.content?.privacy_full_text) {
          setCustomContent(data.content.privacy_full_text);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <PageLayout title="Privacy Policy">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
        <p className="text-zinc-400 mt-1 text-sm">Last Updated: January 2025</p>
        <p className="text-zinc-500 text-xs mt-2 max-w-sm mx-auto">
          Your privacy matters to us. This policy explains how BitPay Wallet collects, uses, protects, and shares your personal information.
        </p>
      </div>

      {customContent ? (
        <div className="space-y-4">
          {customContent.split('\n\n').map((section, i) => {
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

      {/* Contact */}
      <Card className="mt-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardContent className="p-5 text-center">
          <p className="text-white font-medium text-sm">Questions about your privacy?</p>
          <p className="text-zinc-400 text-xs mt-1">Contact our Data Protection Officer at privacy@bitpaywallet.in</p>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
