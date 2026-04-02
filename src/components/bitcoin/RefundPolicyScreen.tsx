'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import PageLayout from './PageLayout';
import { RotateCcw, AlertCircle, Clock, CreditCard, Bitcoin, CheckCircle2, XCircle, HelpCircle, FileText } from 'lucide-react';

const SECTIONS = [
  {
    icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
    title: '1. Overview',
    content: [
      'At BitPay Wallet, we strive to provide the best cryptocurrency experience. However, we understand that sometimes things may not go as expected. This Refund Policy outlines the circumstances under which refunds may be issued and the process for requesting one.',
      'This policy applies to all fee-based services, subscription charges, and transaction fees on the BitPay Wallet platform. It does NOT apply to market fluctuations in Bitcoin prices, as cryptocurrency values are determined by the open market.',
    ]
  },
  {
    icon: <CreditCard className="w-5 h-5 text-amber-500" />,
    title: '2. Refundable Services',
    content: [
      'Trading Fees: If a transaction fails due to a technical error on our platform, the trading fees will be fully refunded within 3-5 business days.',
      'Subscription Services: Premium features and subscription charges are eligible for a full refund within 7 days of purchase if you are not satisfied with the service.',
      'Deposit Fees: If a deposit to your BitPay Wallet fails or is delayed beyond 48 hours due to our system error, the deposit fee will be refunded along with the deposited amount.',
      'Promotional Charges: Any amount charged during promotional periods that were incorrectly billed will be fully refunded.',
    ]
  },
  {
    icon: <XCircle className="w-5 h-5 text-amber-500" />,
    title: '3. Non-Refundable Items',
    content: [
      'Bitcoin Price Fluctuations: Losses due to Bitcoin price changes are NOT refundable. Cryptocurrency is a volatile asset, and its value can change rapidly. Users assume all market risk.',
      'Successful Transactions: Once a Bitcoin buy/sell transaction is confirmed on the blockchain, it cannot be reversed or refunded.',
      'Account Inactivity: No refunds are issued for subscription charges after the 7-day refund window has expired.',
      'Third-Party Fees: Bank charges, UPI fees, or network gas fees imposed by third parties are not refundable by BitPay Wallet.',
      'Security Breaches: If a loss occurs due to the user sharing their password, private keys, or 2FA codes, no refund will be issued.',
    ]
  },
  {
    icon: <Clock className="w-5 h-5 text-amber-500" />,
    title: '4. Refund Processing Time',
    content: [
      'Standard Refund Requests: 5-7 business days from approval.',
      'Expedited Refund Requests (Premium users): 2-3 business days from approval.',
      'Failed Transaction Auto-Refunds: Processed within 24-48 hours automatically.',
      'Bank Transfer Refunds: May take an additional 3-5 business days to reflect in your bank account, depending on your bank\'s processing time.',
    ]
  },
  {
    icon: <HelpCircle className="w-5 h-5 text-amber-500" />,
    title: '5. How to Request a Refund',
    content: [
      'Step 1: Log in to your BitPay Wallet account.',
      'Step 2: Go to Profile > Settings > Request Refund.',
      'Step 3: Select the transaction or charge you want a refund for.',
      'Step 4: Provide a reason for the refund request and attach any supporting documents.',
      'Step 5: Submit the request. You will receive a confirmation email within 24 hours.',
      'Step 6: Our team will review your request within 3 business days and notify you of the decision.',
    ]
  },
  {
    icon: <FileText className="w-5 h-5 text-amber-500" />,
    title: '6. Required Documentation',
    content: [
      'For failed transactions: Transaction ID, screenshot of the error, and timestamp.',
      'For service refund: Invoice number, date of purchase, and reason for dissatisfaction.',
      'For duplicate charges: Both transaction IDs and a brief explanation.',
      'Our team may request additional documents during the review process to verify your claim.',
    ]
  },
  {
    icon: <CheckCircle2 className="w-5 h-5 text-amber-500" />,
    title: '7. Dispute Resolution',
    content: [
      'If your refund request is denied and you believe it was unjustified, you can file an appeal within 15 days of the denial by emailing disputes@bitpaywallet.in.',
      'All disputes will be reviewed by a senior team member within 5 business days.',
      'If the dispute remains unresolved, you may escalate the matter to the relevant consumer protection authority in India.',
      'BitPay Wallet is committed to fair resolution and will always consider legitimate claims with utmost care.',
    ]
  },
  {
    icon: <Bitcoin className="w-5 h-5 text-amber-500" />,
    title: '8. Important Disclaimer',
    content: [
      'Bitcoin and other cryptocurrencies are highly volatile digital assets. The value of your holdings can decrease significantly. BitPay Wallet is a platform for buying, selling, and managing Bitcoin — we do NOT guarantee any returns or profits.',
      'Invest only what you can afford to lose. BitPay Wallet is not a financial advisor. Please consult a qualified financial advisor before making investment decisions.',
      'By using BitPay Wallet, you acknowledge and accept the risks associated with cryptocurrency investments.',
    ]
  },
];

export default function RefundPolicyScreen() {
  const [customContent, setCustomContent] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.content?.refund_full_text) {
          setCustomContent(data.content.refund_full_text);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <PageLayout title="Refund Policy">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 mb-4">
          <RotateCcw className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Refund Policy</h2>
        <p className="text-zinc-400 mt-1 text-sm">Last Updated: January 2025</p>
        <p className="text-zinc-500 text-xs mt-2 max-w-sm mx-auto">
          We want you to be completely satisfied with our services. Here&apos;s everything you need to know about our refund process.
        </p>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-xs text-emerald-400 font-medium">Refundable</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Failed txns, fees, subscriptions</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-3 text-center">
            <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <p className="text-xs text-red-400 font-medium">Non-Refundable</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Market losses, confirmed txns</p>
          </CardContent>
        </Card>
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
          <p className="text-white font-medium text-sm">Need help with a refund?</p>
          <p className="text-zinc-400 text-xs mt-1">Email us at refunds@bitpaywallet.in or reach out through the Contact page</p>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
