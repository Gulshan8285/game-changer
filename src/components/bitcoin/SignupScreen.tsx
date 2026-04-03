'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Bitcoin, Mail, Lock, Eye, EyeOff, ArrowRight, Phone, User, ArrowLeft, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function SignupScreen() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});
  const { setScreen, setUser, setNeedsTermsAcceptance, setLoading: setAppLoading } = useAppStore();

  // Fetch site content from API
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/content');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.content) {
            setSiteContent(data.content);
          }
        }
      } catch { /* ignore */ }
    };
    fetchContent();
  }, []);

  // Handle Google OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleData = params.get('google_data');
    const googleError = params.get('google_error');
    const googleErrorDesc = params.get('google_error_desc');

    if (googleData || googleError) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (googleError) {
      if (googleError === 'redirect_uri_mismatch' || (googleErrorDesc && googleErrorDesc.includes('redirect_uri_mismatch'))) {
        setError('Domain not authorized in Google Cloud Console. Click ℹ for help.');
        setShowGoogleHelp(true);
      } else {
        setError(`Google sign-up failed (${googleError}). Please try again or use email signup.`);
      }
      return;
    }

    if (!googleData) return;

    let parsed;
    try {
      parsed = JSON.parse(decodeURIComponent(googleData));
    } catch {
      setError('Google login data corrupted. Please try again.');
      return;
    }

    const completeGoogleLogin = async () => {
      setLoading(true);
      setAppLoading(true);
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Google sign-up failed');
        } else {
          fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'signup', userId: data.user?.id, userName: parsed.name, userEmail: parsed.email, method: 'google' }) }).catch(() => {});
          const userData = { termsAccepted: false, isGoogleAuth: false, ...data.user };
          setUser(userData);
          setNeedsTermsAcceptance(!!data.needsTermsAcceptance);
          setScreen(data.needsTermsAcceptance ? 'terms' : 'dashboard');
        }
      } catch {
        setError('Google sign-up failed. Please try again.');
      } finally {
        setLoading(false);
        setAppLoading(false);
      }
    };
    completeGoogleLogin();
  }, [setUser, setNeedsTermsAcceptance, setScreen, setAppLoading]);

  const updateField = (field: string, value: string) => { setForm((prev) => ({ ...prev, [field]: value })); setError(''); };

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();
  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength] || '';
  const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-400'][passwordStrength] || '';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (form.phone && !/^[0-9]{10}$/.test(form.phone.replace(/\s+/g, ''))) { setError('Phone number must be exactly 10 digits'); return; }
    setLoading(true); setAppLoading(true);
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Signup failed'); }
      else {
        fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'signup', userId: data.user?.id, userName: form.name, userEmail: form.email, userPhone: form.phone, method: 'email' }) }).catch(() => {});
        const userData = { termsAccepted: false, isGoogleAuth: false, ...data.user };
        setUser(userData);
        setNeedsTermsAcceptance(true);
        setScreen('terms');
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); setAppLoading(false); }
  };

  const handleGoogleSignup = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google login not configured. Use email signup.');
      return;
    }
    const redirectUri = `${window.location.origin}/api/auth/google-callback`;
    const scope = 'openid profile email';
    const state = encodeURIComponent(window.location.origin);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&state=${state}`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-orange-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <button onClick={() => setScreen('login')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 mb-4">
            <Bitcoin className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{siteContent.signup_title || 'Create Account'}</h1>
          <p className="text-zinc-400 mt-1">Start your Bitcoin journey today</p>
        </div>
        <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1"><span>{error}</span></div>
                  <button type="button" onClick={() => setError('')} className="shrink-0 hover:text-red-300"><X className="w-3 h-3" /></button>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  {form.name && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
                  <Input placeholder="Enter your full name" value={form.name} onChange={(e) => updateField('name', e.target.value)} className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500/50 focus:ring-amber-500/20" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  {form.email && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
                  <Input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => updateField('email', e.target.value)} className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500/50 focus:ring-amber-500/20" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Phone Number <span className="text-zinc-500">(10 digits)</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  {form.phone && form.phone.replace(/\s+/g, '').length === 10 && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      updateField('phone', val.length > 10 ? val.slice(0, 10) : val);
                    }}
                    maxLength={10}
                    className={`pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500/50 focus:ring-amber-500/20 ${form.phone && form.phone.length > 0 && form.phone.length !== 10 ? 'border-red-500/50' : ''}`}
                  />
                  {form.phone && form.phone.length > 0 && (
                    <p className={`text-xs mt-1 ${form.phone.length === 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {form.phone.length}/10 digits{form.phone.length !== 10 ? ' — must be exactly 10 digits' : ' ✓'}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={(e) => updateField('password', e.target.value)} className="pl-10 pr-10 bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500/50 focus:ring-amber-500/20" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                {form.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => (<div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColor : 'bg-zinc-700'}`} />))}</div>
                    <p className="text-xs text-zinc-500">{strengthLabel}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} className="pl-10 pr-10 bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500/50 focus:ring-amber-500/20" required />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">{showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && <p className="text-xs text-red-400">Passwords don&apos;t match</p>}
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-5 shadow-lg shadow-amber-500/25 transition-all duration-300">
                {loading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating Account...</div> : <div className="flex items-center gap-2">Create Account <ArrowRight className="w-4 h-4" /></div>}
              </Button>
              <Separator className="bg-zinc-800" />
              <div className="relative">
                <Button type="button" variant="outline" onClick={handleGoogleSignup} disabled={loading} className="w-full bg-zinc-800/50 border-zinc-700 text-zinc-200 hover:bg-zinc-700/50 hover:text-white py-5 transition-all duration-300">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Sign up with Google
                </Button>
                <button type="button" onClick={() => setShowGoogleHelp(true)} className="absolute -top-1 -right-1 text-zinc-600 hover:text-zinc-400 transition-colors" title="Google sign-in help">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-400">Already have an account?{' '}<button onClick={() => setScreen('login')} className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">Sign In</button></p>
            </div>
          </CardContent>
        </Card>

        {/* Google Help Dialog */}
        {showGoogleHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowGoogleHelp(false)}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-amber-500" />
                  Google Sign-in Setup
                </h3>
                <button onClick={() => setShowGoogleHelp(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-sm text-zinc-300">
                <p className="font-medium text-amber-400">Step-by-step fix:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">Google Cloud Console</a></li>
                  <li>Select your project</li>
                  <li>Go to <span className="text-amber-400">APIs & Services → Credentials</span></li>
                  <li>Click your <span className="text-amber-400">OAuth 2.0 Client ID</span></li>
                  <li>In <span className="text-amber-400">&quot;Authorized redirect URIs&quot;</span> add:</li>
                </ol>
                <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <p className="text-xs text-zinc-400 font-medium mb-1">Add this URL:</p>
                  <p className="text-xs text-amber-400 break-all font-mono select-all">{typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google-callback` : 'your-domain/api/auth/google-callback'}</p>
                </div>
                <p className="text-zinc-500 text-xs">💡 Email/Phone signup always works as backup.</p>
              </div>
              <Button onClick={() => setShowGoogleHelp(false)} className="w-full mt-5 bg-zinc-800 hover:bg-zinc-700 text-white">Got it</Button>
            </div>
          </div>
        )}

        <p className="text-center text-zinc-600 text-xs mt-6">By signing up, you agree to our Terms of Service</p>
      </div>
    </div>
  );
}
