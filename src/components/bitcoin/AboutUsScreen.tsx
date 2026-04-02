'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import PageLayout from './PageLayout';
import { Bitcoin, Shield, Zap, Users, Globe, Award, Heart, Star, Target, TrendingUp, Lock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

function AboutContactButton() {
  const { setScreen } = useAppStore();
  return (
    <button
      onClick={() => setScreen('contact')}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
    >
      Contact Us
    </button>
  );
}

export default function AboutUsScreen() {
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.content) {
          setContent(data.content);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <PageLayout title="About Us">
      {/* Hero */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 mb-4">
          <Bitcoin className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">BitPay Wallet</h2>
        <p className="text-zinc-400 mt-1 text-sm">{content.about_subtitle || "India's Trusted Bitcoin Platform"}</p>
      </div>

      {/* Mission */}
      <Card className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-sm mb-4">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-amber-500" />
            <h3 className="text-white font-semibold">Our Mission</h3>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {content.about_mission_text || "BitPay Wallet is on a mission to make Bitcoin accessible to every Indian. We believe that financial freedom is a fundamental right, and cryptocurrency is the key to unlocking it. Our platform bridges the gap between complex blockchain technology and everyday users, making it simple for anyone to buy, sell, and hold Bitcoin using Indian Rupees."}
          </p>
        </CardContent>
      </Card>

      {/* Story */}
      <Card className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-sm mb-4">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="text-white font-semibold">Our Story</h3>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {content.about_story_text || "Founded in 2023, BitPay Wallet was born from a simple observation: while India has one of the largest tech-savvy populations in the world, cryptocurrency adoption was still limited by complex interfaces, high fees, and lack of Indian payment integration. Our founders, a team of blockchain engineers and fintech experts from Mumbai and Bangalore, set out to build a platform that speaks Indian — with UPI integration, INR pricing, and a mobile-first experience."}
          </p>
        </CardContent>
      </Card>

      {/* Values */}
      <Card className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-sm mb-4">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-amber-500" />
            <h3 className="text-white font-semibold">Our Values</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: <Shield className="w-5 h-5 text-emerald-400" />, title: 'Security First', desc: '256-bit encryption, cold storage, and multi-factor authentication to protect your assets.' },
              { icon: <Zap className="w-5 h-5 text-amber-400" />, title: 'Speed & Simplicity', desc: 'Buy Bitcoin in under 60 seconds with UPI, bank transfer, or card payments.' },
              { icon: <Users className="w-5 h-5 text-blue-400" />, title: 'Customer Obsessed', desc: '24/7 customer support in English, Hindi, and regional languages.' },
              { icon: <Globe className="w-5 h-5 text-purple-400" />, title: 'Transparency', desc: 'No hidden fees. Real-time INR pricing. Clear policies. What you see is what you get.' },
              { icon: <Award className="w-5 h-5 text-pink-400" />, title: 'Compliance', desc: 'Fully compliant with RBI guidelines and Indian financial regulations.' },
              { icon: <TrendingUp className="w-5 h-5 text-cyan-400" />, title: 'Innovation', desc: 'Continuously improving with the latest blockchain technology and DeFi features.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/20">
                <div className="shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <h4 className="text-white text-sm font-medium">{item.title}</h4>
                  <p className="text-zinc-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Users', value: '50K+', color: 'text-amber-400' },
          { label: 'Transactions', value: '2M+', color: 'text-emerald-400' },
          { label: 'States', value: '28+', color: 'text-blue-400' },
        ].map((stat, i) => (
          <Card key={i} className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-sm">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team */}
      <Card className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-sm mb-4">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-amber-500" />
            <h3 className="text-white font-semibold">Our Team</h3>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed mb-3">
            {content.about_team_text || "We are a passionate team of 40+ professionals including blockchain developers, security engineers, UI/UX designers, and financial compliance experts. Headquartered in Mumbai, we are committed to bringing the best cryptocurrency experience to India."}
          </p>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Our team has 100+ years combined experience in fintech and blockchain technology</span>
          </div>
        </CardContent>
      </Card>

      {/* Contact footer */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 backdrop-blur-sm">
        <CardContent className="p-5 text-center">
          <h3 className="text-white font-semibold mb-2">Want to know more?</h3>
          <p className="text-zinc-400 text-sm mb-3">Reach out to us — we&apos;d love to hear from you!</p>
          <AboutContactButton />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
