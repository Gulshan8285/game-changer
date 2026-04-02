'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageLayout from './PageLayout';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Globe, Headphones, CheckCircle2 } from 'lucide-react';

export default function ContactUsScreen() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [contactInfo, setContactInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.content) {
          setContactInfo(data.content);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <PageLayout title="Contact Us">
      {submitted && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm shadow-lg backdrop-blur-xl">
          <CheckCircle2 className="w-4 h-4" />
          Message sent successfully!
        </div>
      )}

      {/* Hero */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 mb-4">
          <Headphones className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Get in Touch</h2>
        <p className="text-zinc-400 mt-1 text-sm">We&apos;re here to help. Reach out anytime!</p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {[
          { icon: <Mail className="w-5 h-5 text-amber-400" />, label: 'Email', value: contactInfo.contact_email || 'support@bitpaywallet.in', sub: contactInfo.contact_email_sub || 'Reply within 24 hours' },
          { icon: <Phone className="w-5 h-5 text-emerald-400" />, label: 'Phone', value: contactInfo.contact_phone || '+91 22-4000-5000', sub: contactInfo.contact_phone_sub || 'Mon-Sat, 9 AM - 8 PM IST' },
          { icon: <MapPin className="w-5 h-5 text-blue-400" />, label: 'Address', value: contactInfo.contact_address || 'BitPay Wallet Pvt. Ltd.', sub: contactInfo.address_detail || 'BKC, Mumbai 400051, Maharashtra' },
          { icon: <Clock className="w-5 h-5 text-purple-400" />, label: 'Support Hours', value: contactInfo.contact_hours || '24/7 Live Chat', sub: contactInfo.contact_hours_sub || 'Email: 24 hours' },
        ].map((item, i) => (
          <Card key={i} className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/80 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">{item.label}</p>
                <p className="text-sm text-white font-medium mt-0.5">{item.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Social Links */}
      <Card className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-white font-medium">Follow Us</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: 'Twitter', color: 'bg-sky-500/20 text-sky-400' },
              { name: 'Instagram', color: 'bg-pink-500/20 text-pink-400' },
              { name: 'Telegram', color: 'bg-blue-500/20 text-blue-400' },
              { name: 'YouTube', color: 'bg-red-500/20 text-red-400' },
            ].map((social) => (
              <button key={social.name} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${social.color} transition-colors`}>
                <MessageCircle className="w-5 h-5" />
                <span className="text-[10px] font-medium">{social.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-sm mb-4">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-5 h-5 text-amber-500" />
            <h3 className="text-white font-semibold">Send us a Message</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs font-medium">Your Name</Label>
              <Input
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder-zinc-600 h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs font-medium">Email Address</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder-zinc-600 h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs font-medium">Subject</Label>
              <Input
                placeholder="What is this about?"
                value={form.subject}
                onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
                className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder-zinc-600 h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs font-medium">Message</Label>
              <Textarea
                placeholder="Describe your query in detail..."
                value={form.message}
                onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder-zinc-600 min-h-[120px] resize-none"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-5"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ Quick Links */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardContent className="p-5 text-center">
          <p className="text-zinc-400 text-sm">Need quick answers?</p>
          <p className="text-xs text-zinc-500 mt-1">Check our FAQ or browse other policies in the Profile section</p>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
