'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Bitcoin, Mail, Lock, Eye, EyeOff, ArrowRight, Phone, AlertTriangle, Info, X, Scissors, ClipboardCopy, ClipboardPaste } from 'lucide-react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);
  const [copyCutDetected, setCopyCutDetected] = useState(false);
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});
  const [googleClientId, setGoogleClientId] = useState('');
  const { setScreen, setUser, setNeedsTermsAcceptance, setLoading: setAppLoading } = useAppStore();

  // Fetch site content + Google Client ID from API (runtime, not build-time)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentRes, googleRes] = await Promise.all([
          fetch('/api/content'),
          fetch('/api/auth/google-config'),
        ]);
        if (contentRes.ok) {
          const data = await contentRes.json();
          if (data.success && data.content) {
            setSiteContent(data.content);
          }
        }
        if (googleRes.ok) {
          const googleData = await googleRes.json();
          if (googleData.clientId) {
            setGoogleClientId(googleData.clientId);
          }
        }
      } catch { /* ignore */ }
    };
    fetchData();
  }, []);

  // Handle Google OAuth callback redirect — check URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleData = params.get('google_data');
    const googleError = params.get('google_error');
    const googleErrorDesc = params.get('google_error_desc');

    // Clean URL — remove params so they don't stay on page refresh
    if (googleData || googleError) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (googleError) {
      if (googleError === 'redirect_uri_mismatch' || (googleErrorDesc && googleErrorDesc.includes('redirect_uri_mismatch'))) {
        setError('Domain not authorized in Google Cloud Console. Click the ℹ button on Google login for help.');
        setShowGoogleHelp(true);
      } else {
        setError(`Google login failed (${googleError}). Please try again or use email/phone login.`);
      }
      return;
    }

    if (!googleData) return;

    // Process Google login data from callback
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
          setError(data.error || 'Google login failed');
        } else {
          fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', userId: data.user?.id, userName: parsed.name, userEmail: parsed.email, method: 'google' }) }).catch(() => {});
          const userData = { termsAccepted: false, isGoogleAuth: false, ...data.user };
          setUser(userData);
          setNeedsTermsAcceptance(!!data.needsTermsAcceptance);
          setScreen(data.needsTermsAcceptance ? 'terms' : 'dashboard');
        }
      } catch {
        setError('Google login failed. Please try again.');
      } finally {
        setLoading(false);
        setAppLoading(false);
      }
    };
    completeGoogleLogin();
  }, [setUser, setNeedsTermsAcceptance, setScreen, setAppLoading]);

  // ── Detect copy/cut on login form → block login ──
  const handleCopyCutPaste = (e: React.ClipboardEvent) => {
    const type = e.type;
    if (type === 'copy' || type === 'cut') {
      e.preventDefault();
      setCopyCutDetected(true);
      setTimeout(() => setCopyCutDetected(false), 4000);
    }
  };

  const isPhoneLogin = /^[0-9]+$/.test(email.trim());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (copyCutDetected) {
      setError('Copy/Cut detected! Please type your credentials manually.');
      return;
    }

    if (isPhoneLogin && email.trim().length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);
    setAppLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); }
      else {
        fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', userId: data.user?.id, userName: data.user?.name, userEmail: email.trim(), method: 'email' }) }).catch(() => {});
        const userData = { termsAccepted: false, isGoogleAuth: false, ...data.user };
        setUser(userData);
        setNeedsTermsAcceptance(!!data.needsTermsAcceptance);
        setScreen(data.needsTermsAcceptance ? 'terms' : 'dashboard');
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); setAppLoading(false); }
  };

  const handleGoogleLogin = () => {
    // Use client ID fetched from server API (runtime) — not build-time env
    const clientId = googleClientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google login not configured. Use email/phone login.');
      return;
    }

    const redirectUri = `${window.location.origin}/api/auth/google-callback`;
    const scope = 'openid profile email';
    const state = encodeURIComponent(window.location.origin);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&state=${state}`;
    window.location.href = authUrl;
  };

  const errorMessages: Record<string, string> = {
    redirect_uri_mismatch: 'Domain not authorized. Add your domain to Google Cloud Console "Authorized redirect URIs".',
    missing_config: 'Google Client ID or Secret not configured.',
    token_exchange_failed: 'Token exchange with Google failed.',
    no_access_token: 'No access token received.',
    userinfo_failed: 'Failed to get user info from Google.',
    server_error: 'Server error during Google login.',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 mb-4">
            <Bitcoin className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{siteContent.app_name || 'Dhan Kamao'}</h1>
          <p className="text-zinc-400 mt-1">{siteContent.app_subtitle || 'Your gateway to Bitcoin in India'}</p>
        </div>

        <Card onCopy={handleCopyCutPaste} onCut={handleCopyCutPaste} className="bg-zinc-900/80 border-zinc-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-2">
            <h2 className="text-xl font-semibold text-white">Welcome Back</h2>
            <p className="text-sm text-zinc-400">Sign in to your account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span>{error}</span>
                  </div>
                  <button type="button" onClick={() => setError('')} className="shrink-0 hover:text-red-300">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Email or Phone Number</Label>
                <div className="relative">
                  {isPhoneLogin
                    ? <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    : <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  }
                  <Input
                    type="text"
                    placeholder="you@example.com or 10-digit phone"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      if (/^[0-9]+$/.test(input.value) && input.value.length > 10) {
                        input.value = input.value.slice(0, 10);
                        setEmail(input.value);
                      }
                    }}
                    className={`pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500/50 focus:ring-amber-500/20 ${isPhoneLogin && email.trim().length > 0 && email.trim().length !== 10 ? 'border-red-500/50' : ''}`}
                    required
                  />
                  {isPhoneLogin && email.trim().length > 0 && (
                    <p className={`text-xs mt-1 ${email.trim().length === 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {email.trim().length}/10 digits{email.trim().length !== 10 ? ' — must be exactly 10 digits' : ' ✓'}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-500/50 focus:ring-amber-500/20" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* Copy/Cut Warning Banner */}
              {copyCutDetected && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm animate-pulse">
                  <Scissors className="w-4 h-4 shrink-0" />
                  <span>Copy/Cut detected! Type manually to login.</span>
                  <button type="button" onClick={() => setCopyCutDetected(false)} className="ml-auto shrink-0 hover:text-red-300"><X className="w-3 h-3" /></button>
                </div>
              )}
              <Button type="submit" disabled={loading || copyCutDetected} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-5 shadow-lg shadow-amber-500/25 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? (
                  <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing In...</div>
                ) : (
                  <div className="flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></div>
                )}
              </Button>
              <Separator className="bg-zinc-800" />
              <div className="relative">
                <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-zinc-800/50 border-zinc-700 text-zinc-200 hover:bg-zinc-700/50 hover:text-white py-5 transition-all duration-300">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </Button>
                <button type="button" onClick={() => setShowGoogleHelp(true)} className="absolute -top-1 -right-1 text-zinc-600 hover:text-zinc-400 transition-colors" title="Google sign-in help">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-400">Don&apos;t have an account?{' '}
                <button onClick={() => setScreen('signup')} className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">Sign Up</button>
              </p>
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
                <button onClick={() => setShowGoogleHelp(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-5 h-5" />
                </button>
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
                <p className="text-zinc-500 text-xs">💡 Email/Phone login always works as backup.</p>
              </div>
              <Button onClick={() => setShowGoogleHelp(false)} className="w-full mt-5 bg-zinc-800 hover:bg-zinc-700 text-white">
                Got it
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-zinc-600 text-xs mt-6">{siteContent.login_security_text || 'Secured with 256-bit encryption'}</p>
      </div>
    </div>
  );
}
