'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Camera, Save, User, Landmark, Wallet, MapPin, CheckCircle2, Shield, FileText, Phone, Info, RotateCcw, ScrollText, ChevronRight, LogOut, Share2, MessageCircle, Copy, Check } from 'lucide-react';
import { BarChart3, History } from 'lucide-react';

export default function ProfileScreen() {
  const { user, setUser, setScreen, logout, setLoading: setAppLoading, setDashboardView } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    accountNo: user?.accountNo || '', accountNo2: user?.accountNo2 || '',
    ifscCode: user?.ifscCode || '', bankName: user?.bankName || '',
    upiId: user?.upiId || '', address: user?.address || '',
    city: user?.city || '', state: user?.state || '', pincode: user?.pincode || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => { setForm((prev) => ({ ...prev, [field]: value })); setErrors((prev) => ({ ...prev, [field]: '' })); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.accountNo && form.accountNo !== form.accountNo2) e.accountNo2 = 'Account numbers do not match';
    if (form.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode)) e.ifscCode = 'Invalid IFSC code format';
    if (form.upiId && !form.upiId.includes('@')) e.upiId = 'UPI ID must contain @';
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) e.pincode = 'Invalid pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true); setAppLoading(true); setSuccess(false);
    try {
      const res = await fetch('/api/profile/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.id, ...form }) });
      if (res.ok) { const data = await res.json(); setUser(data.user); setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
    } catch { /* error */ } finally { setSaving(false); setAppLoading(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user?.id) return;
    setUploading(true);
    const formData = new FormData(); formData.append('userId', user.id); formData.append('avatar', file);
    try { const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData }); if (res.ok) { const data = await res.json(); setUser({ ...user, avatar: data.avatarUrl }); } } catch { /* error */ } finally { setUploading(false); }
  };

  const sectionHeader = (icon: any, title: string) => (<div className="flex items-center gap-2 mb-4">{icon}<h3 className="text-white font-semibold">{title}</h3></div>);
  const inputField = (label: string, field: string, placeholder: string, type = 'text', icon?: any) => (
    <div className="space-y-1.5">
      <Label className="text-zinc-400 text-xs font-medium">{label}</Label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</div>}
        <Input type={type} placeholder={placeholder} value={form[field as keyof typeof form]} onChange={(e) => updateField(field, e.target.value)} className={`${icon ? 'pl-10' : ''} bg-zinc-800/50 border-zinc-700/50 text-white placeholder-zinc-600 focus:border-amber-500/50 focus:ring-amber-500/20 h-11`} />
      </div>
      {errors[field] && <p className="text-xs text-red-400 mt-1">{errors[field]}</p>}
    </div>
  );

  const pages = [
    { icon: <Info className="w-4 h-4 text-amber-400" />, label: 'About Us', screen: 'about' as const, desc: 'Learn about our mission & team' },
    { icon: <Phone className="w-4 h-4 text-emerald-400" />, label: 'Contact Us', screen: 'contact' as const, desc: 'Get in touch with us' },
    { icon: <Shield className="w-4 h-4 text-blue-400" />, label: 'Privacy Policy', screen: 'privacy' as const, desc: 'How we protect your data' },
    { icon: <RotateCcw className="w-4 h-4 text-purple-400" />, label: 'Refund Policy', screen: 'refund' as const, desc: 'Refund rules & process' },
    { icon: <ScrollText className="w-4 h-4 text-orange-400" />, label: 'Terms & Conditions', screen: 'termsPage' as const, desc: 'Platform usage terms' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-[150px]" /></div>

      <header className="relative z-10 px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => setScreen('dashboard')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" /><span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-lg font-semibold text-white">My Profile</h1>
          <Button onClick={handleSave} disabled={saving} size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs">
            {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}Save
          </Button>
        </div>
      </header>

      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm shadow-lg backdrop-blur-xl">
          <CheckCircle2 className="w-4 h-4" />Profile updated successfully!
        </div>
      )}

      <main className="relative z-10 px-4 pb-24">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Avatar + Logout */}
          <Card className="bg-zinc-900/40 border-zinc-800/30 backdrop-blur-sm">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-amber-500/20 shadow-lg shadow-amber-500/10">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-2xl font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg hover:bg-amber-600 transition-colors" disabled={uploading}>
                  {uploading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>
              <h2 className="text-xl font-bold text-white mt-3">{user?.name || 'User'}</h2>
              <p className="text-sm text-zinc-400">{user?.email}</p>
              {user?.phone && <p className="text-xs text-zinc-500 mt-0.5">{user.phone}</p>}
              {user?.isGoogleAuth && <p className="text-[10px] text-amber-500/60 mt-1">Signed in with Google</p>}
              {/* Logout Button */}
              <button
                onClick={() => logout()}
                className="mt-4 flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </CardContent>
          </Card>

          {/* Editable Profile Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-zinc-900/40 border border-zinc-800/20 rounded-2xl h-auto p-1 grid grid-cols-4">
              <TabsTrigger value="personal" className="rounded-lg py-2.5 text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 data-[state=active]:shadow-none text-zinc-500"><User className="w-3.5 h-3.5 mr-1" /><span className="hidden sm:inline">Personal</span></TabsTrigger>
              <TabsTrigger value="bank" className="rounded-lg py-2.5 text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 data-[state=active]:shadow-none text-zinc-500"><Landmark className="w-3.5 h-3.5 mr-1" /><span className="hidden sm:inline">Bank</span></TabsTrigger>
              <TabsTrigger value="payment" className="rounded-lg py-2.5 text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 data-[state=active]:shadow-none text-zinc-500"><Wallet className="w-3.5 h-3.5 mr-1" /><span className="hidden sm:inline">UPI</span></TabsTrigger>
              <TabsTrigger value="address" className="rounded-lg py-2.5 text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 data-[state=active]:shadow-none text-zinc-500"><MapPin className="w-3.5 h-3.5 mr-1" /><span className="hidden sm:inline">Address</span></TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-4">
              <Card className="bg-zinc-900/40 border-zinc-800/20 backdrop-blur-sm"><CardContent className="p-5 space-y-4">
                {sectionHeader(<User className="w-4 h-4 text-amber-500" />, 'Personal Information')}
                <Separator className="bg-zinc-800/60" />
                <div className="space-y-4 pt-2">
                  {inputField('Full Name', 'name', 'Enter your full name', 'text', <User className="w-4 h-4" />)}
                  {inputField('Email Address', 'email', 'Enter your email', 'email', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>)}
                  {inputField('Phone Number', 'phone', '+91 9876543210', 'tel', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>)}
                </div>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="bank" className="mt-4">
              <Card className="bg-zinc-900/40 border-zinc-800/20 backdrop-blur-sm"><CardContent className="p-5 space-y-4">
                {sectionHeader(<Landmark className="w-4 h-4 text-amber-500" />, 'Bank Account Details')}
                <Separator className="bg-zinc-800/60" />
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs"><Shield className="w-4 h-4 shrink-0" /><span>Your bank details are encrypted and securely stored</span></div>
                <div className="space-y-4 pt-2">
                  {inputField('Bank Name', 'bankName', 'e.g. State Bank of India', 'text', <Landmark className="w-4 h-4" />)}
                  {inputField('Account Number', 'accountNo', 'Enter your account number', 'text', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>)}
                  {inputField('Re-enter Account Number', 'accountNo2', 'Confirm your account number', 'text', <CheckCircle2 className="w-4 h-4" />)}
                  {inputField('IFSC Code', 'ifscCode', 'e.g. SBIN0001234', 'text', <span className="text-xs font-mono">IFSC</span>)}
                </div>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="payment" className="mt-4">
              <Card className="bg-zinc-900/40 border-zinc-800/20 backdrop-blur-sm"><CardContent className="p-5 space-y-4">
                {sectionHeader(<Wallet className="w-4 h-4 text-amber-500" />, 'UPI Payment')}
                <Separator className="bg-zinc-800/60" />
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs"><Wallet className="w-4 h-4 shrink-0" /><span>Add your UPI ID for instant Bitcoin transactions</span></div>
                <div className="space-y-4 pt-2">
                  {inputField('UPI ID', 'upiId', 'yourname@upi', 'text', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)}
                </div>
                <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">Supported UPI Apps</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                      <div key={app} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-zinc-800/50"><div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center"><span className="text-xs font-bold text-zinc-400">{app.charAt(0)}</span></div><span className="text-[10px] text-zinc-500">{app}</span></div>
                    ))}
                  </div>
                </div>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="address" className="mt-4">
              <Card className="bg-zinc-900/40 border-zinc-800/20 backdrop-blur-sm"><CardContent className="p-5 space-y-4">
                {sectionHeader(<MapPin className="w-4 h-4 text-amber-500" />, 'Address Details')}
                <Separator className="bg-zinc-800/60" />
                <div className="space-y-4 pt-2">
                  {inputField('Street Address', 'address', 'House/Flat No., Street Name', 'text', <MapPin className="w-4 h-4" />)}
                  <div className="grid grid-cols-2 gap-3">
                    {inputField('City', 'city', 'City', 'text')}
                    {inputField('State', 'state', 'State', 'text')}
                  </div>
                  {inputField('PIN Code', 'pincode', '6-digit PIN', 'text', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>)}
                </div>
              </CardContent></Card>
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-5 shadow-lg shadow-amber-500/25 transition-all duration-300">
            {saving ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving Changes...</div> : <div className="flex items-center gap-2"><Save className="w-4 h-4" />Save All Changes</div>}
          </Button>

          {/* Share & Invite Section */}
          <Card className="bg-zinc-900/40 border-zinc-800/20 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-white">Share & Invite</span>
              </div>
              <p className="text-xs text-zinc-400 mb-4">Share BitPay Wallet with friends & family. They can start trading Bitcoin instantly!</p>
              
              {/* Invite Link */}
              <div className="bg-zinc-800/40 rounded-xl p-3 mb-4 border border-zinc-700/30">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-1.5">Your Invite Link</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-zinc-900/60 rounded-lg px-3 py-2 text-xs text-amber-400/80 font-mono truncate">
                    {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch {}
                    }}
                    className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center hover:bg-amber-500/30 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp Button */}
                <button
                  onClick={() => {
                    const text = encodeURIComponent(
                      `🚀 *BitPay Wallet - Bitcoin Trading App*\n\n` +
                      `Check out this amazing Bitcoin wallet app! Buy & Sell Bitcoin instantly with UPI.\n\n` +
                      `🔗 Open here: ${window.location.href}\n\n` +
                      `⚡ Features:\n` +
                      `• Live BTC/INR Price\n` +
                      `• Instant Buy & Sell\n` +
                      `• Secure UPI Payments\n` +
                      `• Real-time Charts\n\n` +
                      `Don\'t miss out on Bitcoin! 📈`
                    );
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-all duration-300 group"
                >
                  <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/20">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#25D366] group-hover:text-[#25D366]">WhatsApp</p>
                    <p className="text-[10px] text-zinc-500">Share now</p>
                  </div>
                </button>

                {/* General Share Button */}
                <button
                  onClick={async () => {
                    const shareData = {
                      title: 'BitPay Wallet - Bitcoin Trading App',
                      text: `🚀 Check out BitPay Wallet! Buy & Sell Bitcoin instantly with UPI. Open here: ${window.location.href}`,
                      url: window.location.href,
                    };
                    if (navigator.share) {
                      try {
                        await navigator.share(shareData);
                        setShareSuccess(true);
                        setTimeout(() => setShareSuccess(false), 2000);
                      } catch {}
                    } else {
                      // Fallback: copy link
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch {}
                    }
                  }}
                  className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-all duration-300 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Share2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-amber-400 group-hover:text-amber-400">Share</p>
                    <p className="text-[10px] text-zinc-500">More options</p>
                  </div>
                </button>
              </div>

              {shareSuccess && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />Shared successfully!
                </div>
              )}
              {copied && !shareSuccess && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />Link copied to clipboard!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pages & Policies - BOTTOM */}
          <Card className="bg-zinc-900/40 border-zinc-800/20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-amber-500" /><span className="text-sm font-medium text-white">Pages & Policies</span></div>
              <div className="space-y-1">
                {pages.map((page) => (
                  <button key={page.screen} onClick={() => setScreen(page.screen)} className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-zinc-800/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center">{page.icon}</div>
                      <div className="text-left"><p className="text-sm text-zinc-200 group-hover:text-white transition-colors">{page.label}</p><p className="text-[11px] text-zinc-500">{page.desc}</p></div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-sm mx-auto px-4 pb-2 pointer-events-auto">
          <div className="flex items-center justify-between rounded-2xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/40 px-2 py-1.5 shadow-lg shadow-black/5 dark:shadow-black/20">
            <button onClick={() => { setDashboardView('dashboard'); setScreen('dashboard'); }} className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200">
              <BarChart3 className="w-5 h-5 stroke-[1.5]" />
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button onClick={() => { setDashboardView('history'); setScreen('dashboard'); }} className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200">
              <History className="w-5 h-5 stroke-[1.5]" />
              <span className="text-[10px] font-medium">History</span>
            </button>
            <button onClick={() => { setDashboardView('wallet'); setScreen('dashboard'); }} className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200">
              <Wallet className="w-5 h-5 stroke-[1.5]" />
              <span className="text-[10px] font-medium">Wallet</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl bg-amber-500/15 text-amber-500 transition-all duration-200">
              <User className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[10px] font-semibold">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
