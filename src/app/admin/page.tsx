'use client';

import { useState, useEffect, useCallback, useRef, memo, useLayoutEffect } from 'react';
import {
  LayoutDashboard,
  DollarSign,
  CreditCard,
  ArrowUpCircle,
  Bell,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  Ban,
  Search,
  Send,
  Save,
  Loader2,
  ShieldCheck,
  Bitcoin,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock as ClockIcon,
  Calendar,
  Globe,
  Link2,
  Palette,
  CircleDollarSign,
  Wallet,
  Coins,
  ArrowDownLeft,
  UserCheck,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'proofs' | 'plans' | 'payments' | 'withdrawals' | 'notifications' | 'users' | 'content';

interface AdminStats {
  totalUsers: number;
  activeInvestments: number;
  pendingPayments: number;
  pendingWithdrawals: number;
  totalInvestedAmount: number;
  totalPayments: number;
}

interface InvestmentPlan {
  id: string;
  name: string;
  price: number;
  daily: number;
  monthly: number;
  totalReturn: number;
  color: string;
  iconBg: string;
  iconColor: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  amount: number;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string; phone: string | null };
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string; phone: string | null };
}

interface PaymentProofItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  utr: string;
  planName: string;
  amount: number;
  screenshotFilename: string;
  status: string;
  adminNote: string | null;
  planData: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
}

interface BtcPrice {
  inr: number;
  change24h: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_TOKEN = 'btc-admin-2024';
const AUTH_KEY = 'btc-admin-auth';

const NAV_ITEMS: { tab: Tab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-5" /> },
  { tab: 'proofs', label: 'Payment Proofs', icon: <ShieldCheck className="size-5" /> },
  { tab: 'plans', label: 'Investment Plans', icon: <DollarSign className="size-5" /> },
  { tab: 'payments', label: 'Payments', icon: <CreditCard className="size-5" /> },
  { tab: 'withdrawals', label: 'Withdrawals', icon: <ArrowUpCircle className="size-5" /> },
  { tab: 'notifications', label: 'Notifications', icon: <Bell className="size-5" /> },
  { tab: 'users', label: 'Users', icon: <Users className="size-5" /> },
  { tab: 'content', label: 'Pages & Content', icon: <FileText className="size-5" /> },
];

const CONTENT_SECTIONS = [
  {
    title: 'General Settings',
    description: 'Main app title, subtitle & support info',
    keys: [
      { key: 'hero_title', label: 'Hero Title', type: 'input' as const, placeholder: 'Dhan Kamao' },
      { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea' as const, placeholder: 'India\'s Trusted Bitcoin Platform' },
      { key: 'support_email', label: 'Support Email', type: 'input' as const, placeholder: 'support@bitpaywallet.in' },
      { key: 'support_whatsapp', label: 'Support WhatsApp', type: 'input' as const, placeholder: '+91 9876543210' },
    ]
  },
  {
    title: 'Login - Terms & Conditions',
    description: 'Terms shown when user first logs in / signs up',
    keys: [
      { key: 'login_terms_text', label: 'Login Terms Content (Full Text)', type: 'textarea' as const, placeholder: 'Enter the full terms and conditions text that users see during login/signup...' },
    ]
  },
  {
    title: 'About Us Page',
    description: 'Content displayed on the About Us page',
    keys: [
      { key: 'about_subtitle', label: 'Page Subtitle', type: 'input' as const, placeholder: "India's Trusted Bitcoin Platform" },
      { key: 'about_mission_text', label: 'Our Mission', type: 'textarea' as const, placeholder: 'Write your mission statement...' },
      { key: 'about_story_text', label: 'Our Story', type: 'textarea' as const, placeholder: 'Write your company story...' },
      { key: 'about_team_text', label: 'Our Team Description', type: 'textarea' as const, placeholder: 'Describe your team...' },
    ]
  },
  {
    title: 'Contact Us Page',
    description: 'Contact information displayed on Contact page',
    keys: [
      { key: 'contact_email', label: 'Support Email', type: 'input' as const, placeholder: 'support@bitpaywallet.in' },
      { key: 'contact_email_sub', label: 'Email Subtitle', type: 'input' as const, placeholder: 'Reply within 24 hours' },
      { key: 'contact_phone', label: 'Phone Number', type: 'input' as const, placeholder: '+91 22-4000-5000' },
      { key: 'contact_phone_sub', label: 'Phone Subtitle', type: 'input' as const, placeholder: 'Mon-Sat, 9 AM - 8 PM IST' },
      { key: 'contact_address', label: 'Company Name', type: 'input' as const, placeholder: 'Dhan Kamao Pvt. Ltd.' },
      { key: 'address_detail', label: 'Full Address', type: 'input' as const, placeholder: 'BKC, Mumbai 400051, Maharashtra' },
      { key: 'contact_hours', label: 'Support Hours', type: 'input' as const, placeholder: '24/7 Live Chat' },
      { key: 'contact_hours_sub', label: 'Hours Subtitle', type: 'input' as const, placeholder: 'Email: 24 hours' },
    ]
  },
  {
    title: 'Privacy Policy Page',
    description: 'Full privacy policy content (leave empty to use defaults)',
    keys: [
      { key: 'privacy_full_text', label: 'Full Privacy Policy Content', type: 'textarea' as const, placeholder: 'Enter the complete privacy policy text. Use blank lines between sections and each line becomes a bullet point within a section...' },
    ]
  },
  {
    title: 'Refund Policy Page',
    description: 'Full refund policy content (leave empty to use defaults)',
    keys: [
      { key: 'refund_full_text', label: 'Full Refund Policy Content', type: 'textarea' as const, placeholder: 'Enter the complete refund policy text. Use blank lines between sections and each line becomes a bullet point within a section...' },
    ]
  },
  {
    title: 'Terms & Conditions Page',
    description: 'Full terms and conditions page content (leave empty to use defaults)',
    keys: [
      { key: 'terms_page_full_text', label: 'Full Terms & Conditions Content', type: 'textarea' as const, placeholder: 'Enter the complete terms and conditions text. Use blank lines between sections and each line becomes a bullet point within a section...' },
    ]
  },
  {
    title: 'App Branding & Login',
    description: 'App name, login screen text & security info',
    keys: [
      { key: 'app_name', label: 'App Name', type: 'input' as const, placeholder: 'Dhan Kamao' },
      { key: 'app_subtitle', label: 'App Subtitle', type: 'input' as const, placeholder: 'Your gateway to Bitcoin in India' },
      { key: 'login_security_text', label: 'Login Security Badge Text', type: 'input' as const, placeholder: 'Secured with 256-bit encryption' },
      { key: 'signup_title', label: 'Signup Page Title', type: 'input' as const, placeholder: 'Create Account' },
    ]
  },
  {
    title: 'Dashboard Settings',
    description: 'Welcome text, labels & dashboard display options',
    keys: [
      { key: 'dashboard_welcome_text', label: 'Welcome Message', type: 'input' as const, placeholder: 'Welcome back' },
      { key: 'dashboard_top_gainers_title', label: 'Top Gainers Section Title', type: 'input' as const, placeholder: 'Top Gainers' },
    ]
  },
  {
    title: 'About Us - Values',
    description: '6 core values displayed on About page (title | description per line, one per value)',
    keys: [
      { key: 'about_values', label: 'Core Values (JSON)', type: 'textarea' as const, placeholder: '[{"title":"Security First","icon":"Shield","desc":"Your funds are protected..."},{"title":"Speed","icon":"Zap","desc":"Lightning fast..."},...]' },
    ]
  },
  {
    title: 'About Us - Statistics',
    description: 'Stats shown on About page (users count, transactions, states)',
    keys: [
      { key: 'about_stat_users', label: 'Users Count Text', type: 'input' as const, placeholder: '50K+' },
      { key: 'about_stat_users_label', label: 'Users Label', type: 'input' as const, placeholder: 'Active Users' },
      { key: 'about_stat_transactions', label: 'Transactions Text', type: 'input' as const, placeholder: '2M+' },
      { key: 'about_stat_transactions_label', label: 'Transactions Label', type: 'input' as const, placeholder: 'Transactions Completed' },
      { key: 'about_stat_states', label: 'States Text', type: 'input' as const, placeholder: '28+' },
      { key: 'about_stat_states_label', label: 'States Label', type: 'input' as const, placeholder: 'States Covered' },
    ]
  },
  {
    title: 'Social Media Links',
    description: 'Social media links displayed on Contact page',
    keys: [
      { key: 'social_twitter', label: 'Twitter/X URL', type: 'input' as const, placeholder: 'https://twitter.com/bitpaywallet' },
      { key: 'social_instagram', label: 'Instagram URL', type: 'input' as const, placeholder: 'https://instagram.com/bitpaywallet' },
      { key: 'social_telegram', label: 'Telegram URL', type: 'input' as const, placeholder: 'https://t.me/bitpaywallet' },
      { key: 'social_youtube', label: 'YouTube URL', type: 'input' as const, placeholder: 'https://youtube.com/@bitpaywallet' },
    ]
  },
  {
    title: 'UPI Payment Settings',
    description: 'UPI ID for receiving investment payments (very sensitive - keep secure)',
    keys: [
      { key: 'upi_id', label: 'UPI ID', type: 'input' as const, placeholder: 'gulshanyadav62000-6@okicici' },
      { key: 'upi_name', label: 'UPI Display Name', type: 'input' as const, placeholder: 'Gulshan Yadav' },
    ]
  },
  {
    title: 'Policy Last Updated Dates',
    description: 'Last updated date shown on policy pages',
    keys: [
      { key: 'privacy_last_updated', label: 'Privacy Policy Date', type: 'input' as const, placeholder: 'January 2025' },
      { key: 'refund_last_updated', label: 'Refund Policy Date', type: 'input' as const, placeholder: 'January 2025' },
      { key: 'terms_last_updated', label: 'Terms & Conditions Date', type: 'input' as const, placeholder: 'January 2025' },
    ]
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatBtcInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

// ─── Animated Background Orbs ────────────────────────────────────────────────

function AnimatedOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute top-1/3 -right-40 w-80 h-80 bg-orange-500/6 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" />
      <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-amber-600/5 rounded-full blur-3xl animate-[pulse_12s_ease-in-out_infinite_4s]" />
    </div>
  );
}

// ─── Login Floating Grid Background ──────────────────────────────────────────

function LoginBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-[#0a0a0a] to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-orange-500/5 animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-orange-500/8 via-transparent to-transparent animate-[pulse_8s_ease-in-out_infinite_3s]" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-amber-500/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      {/* Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-orange-500/8 rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite_2s]" />
    </div>
  );
}

// ─── AdminClock (memoized, outside AdminPage) ────────────────────────────────

const AdminClock = memo(function AdminClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="hidden sm:flex items-center gap-1.5 text-zinc-500 text-xs">
      <ClockIcon className="size-3.5" />
      <span className="tabular-nums">{time}</span>
    </div>
  );
});

// ─── BtcPriceWidget (memoized, outside AdminPage) ────────────────────────────

const BtcPriceWidget = memo(function BtcPriceWidget() {
  const [btcPrice, setBtcPrice] = useState<BtcPrice | null>(null);
  const [btcLoading, setBtcLoading] = useState(true);

  const fetchBtcPrice = useCallback(async () => {
    try {
      const res = await fetch('/api/bitcoin/price');
      const data = await res.json();
      if (data && data.price && data.price.inr) {
        setBtcPrice({ inr: data.price.inr, change24h: data.price.change24h ?? 0 });
      }
    } catch { /* silent */ }
    finally { setBtcLoading(false); }
  }, []);

  useEffect(() => {
    fetchBtcPrice();
    const interval = setInterval(fetchBtcPrice, 30000);
    return () => clearInterval(interval);
  }, [fetchBtcPrice]);

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800/60 backdrop-blur-sm">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
        <Bitcoin className="size-3.5 text-white" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-white font-semibold text-sm">BTC</span>
        {btcLoading ? (
          <Loader2 className="size-3 animate-spin text-zinc-500" />
        ) : btcPrice ? (
          <>
            <span className="text-zinc-300 text-sm font-mono">{formatBtcInr(btcPrice.inr)}</span>
            <span className={`text-xs font-medium flex items-center gap-0.5 ${btcPrice.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {btcPrice.change24h >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(btcPrice.change24h).toFixed(2)}%
            </span>
          </>
        ) : (
          <span className="text-zinc-600 text-xs">N/A</span>
        )}
      </div>
    </div>
  );
});

// ─── ContentTab (memoized, outside AdminPage to prevent focus loss) ───────────

interface ContentTabProps {
  siteContent: Record<string, string>;
  setSiteContent: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  contentPage: number;
  setContentPage: React.Dispatch<React.SetStateAction<number>>;
  loadingContent: boolean;
  savingContentKey: string | null;
  handleSaveContent: (key: string, value: string) => void;
}

const ContentTab = memo(function ContentTab({ siteContent, setSiteContent, contentPage, setContentPage, loadingContent, savingContentKey, handleSaveContent }: ContentTabProps) {
  const currentSection = CONTENT_SECTIONS[contentPage];

  // Icon mapping for sections
  const sectionIcons: Record<string, React.ReactNode> = {
    'General Settings': <Globe className="size-4" />,
    'Login - Terms & Conditions': <ShieldCheck className="size-4" />,
    'About Us Page': <FileText className="size-4" />,
    'Contact Us Page': <Link2 className="size-4" />,
    'Privacy Policy Page': <ShieldCheck className="size-4" />,
    'Refund Policy Page': <DollarSign className="size-4" />,
    'Terms & Conditions Page': <FileText className="size-4" />,
    'App Branding & Login': <Palette className="size-4" />,
    'Dashboard Settings': <LayoutDashboard className="size-4" />,
    'About Us - Values': <Zap className="size-4" />,
    'About Us - Statistics': <Activity className="size-4" />,
    'Social Media Links': <Link2 className="size-4" />,
    'Policy Last Updated Dates': <Calendar className="size-4" />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Site Content
          <FileText className="size-5 text-amber-500" />
        </h2>
        <p className="text-zinc-500 text-sm mt-1">Edit all pages & content from here</p>
      </div>

      {/* Page Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CONTENT_SECTIONS.map((section, idx) => (
          <button
            key={section.title}
            onClick={() => setContentPage(idx)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
              contentPage === idx
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/5'
                : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            {sectionIcons[section.title]}
            {section.title}
          </button>
        ))}
      </div>

      {/* Current Section Header */}
      <Card className="bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent border-amber-500/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/10">
            {sectionIcons[currentSection.title]}
          </div>
          <div>
            <h3 className="text-white font-semibold">{currentSection.title}</h3>
            <p className="text-zinc-400 text-xs mt-0.5">{currentSection.description}</p>
            <p className="text-zinc-600 text-[10px] mt-1">Leave fields empty to use default content</p>
          </div>
        </CardContent>
      </Card>

      {/* Fields */}
      {loadingContent ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {currentSection.keys.map((item) => (
            <Card key={item.key} className="bg-zinc-900 border-zinc-800/60 hover:border-zinc-700/60 transition-colors">
              <CardContent className="p-5">
                <div className="space-y-3">
                  <Label className="text-zinc-300 text-sm font-medium">{item.label}</Label>
                  {item.type === 'textarea' ? (
                    <Textarea
                      value={siteContent[item.key] || ''}
                      onChange={(e) => setSiteContent((prev) => ({ ...prev, [item.key]: e.target.value }))}
                      placeholder={item.placeholder}
                      rows={6}
                      className="bg-zinc-800/60 border-zinc-700/60 text-white placeholder:text-zinc-600 resize-y min-h-[100px]"
                    />
                  ) : (
                    <Input
                      value={siteContent[item.key] || ''}
                      onChange={(e) => setSiteContent((prev) => ({ ...prev, [item.key]: e.target.value }))}
                      placeholder={item.placeholder}
                      className="bg-zinc-800/60 border-zinc-700/60 text-white placeholder:text-zinc-600"
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 text-xs font-mono">{item.key}</span>
                    <Button
                      size="sm"
                      onClick={() => handleSaveContent(item.key, siteContent[item.key] || '')}
                      disabled={savingContentKey === item.key}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 h-8 text-xs"
                    >
                      {savingContentKey === item.key ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Save className="size-3 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

// ─── UsersTab (memoized, outside AdminPage to prevent focus loss) ─────────────

interface UsersTabProps {
  users: UserItem[];
  loadingUsers: boolean;
  userSearch: string;
  setUserSearch: React.Dispatch<React.SetStateAction<string>>;
  handleDeleteUser: (userId: string, userName: string) => Promise<void>;
}

const UsersTab = memo(function UsersTab({ users, loadingUsers, userSearch, setUserSearch, handleDeleteUser }: UsersTabProps) {
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetting, setResetting] = useState(false);
  const filteredUsers = users.filter(
    (u) =>
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Users
            <UserCheck className="size-5 text-amber-500" />
          </h2>
          <p className="text-zinc-500 text-sm mt-1">{users.length} registered users</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input
            placeholder="Search by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="bg-zinc-800/60 border-zinc-700/60 text-white pl-9 placeholder:text-zinc-600"
          />
        </div>
      </div>

      <Card className="bg-zinc-900 border-zinc-800/60">
        <CardContent className="p-0">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-zinc-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="size-14 text-zinc-800 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">{userSearch ? 'No users match your search' : 'No users yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-zinc-900 z-10">
                  <TableRow className="border-zinc-800/60 hover:bg-transparent">
                    <TableHead className="text-zinc-500 text-xs">Name</TableHead>
                    <TableHead className="text-zinc-500 text-xs">Email</TableHead>
                    <TableHead className="text-zinc-500 text-xs">Phone</TableHead>
                    <TableHead className="text-zinc-500 text-xs">Joined</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u, i) => (
                    <TableRow key={u.id} className={`border-zinc-800/40 ${i % 2 === 0 ? 'bg-transparent' : 'bg-zinc-800/20'} hover:bg-zinc-800/40 transition-colors`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm shadow-amber-500/20">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white text-sm font-medium">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">{u.email}</TableCell>
                      <TableCell className="text-zinc-400 text-sm">{u.phone || '—'}</TableCell>
                      <TableCell className="text-zinc-500 text-xs">{formatDateShort(u.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => setResetTarget({ id: u.id, name: u.name })}
                          className="p-2 rounded-lg text-zinc-600 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                          title="Force Logout User"
                        >
                          <LogOut className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset User Confirmation Dialog */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !resetting && setResetTarget(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Force Logout User</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-2">
              Kya aap <span className="text-white font-semibold">{resetTarget.name}</span> ko logout karna chahte hain?
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
              <p className="text-amber-400 text-xs">⚠️ User ko turant logout kar diya jayega. Wo phir se login karega — uska data safe rahega.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setResetTarget(null)}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setResetting(true);
                  await handleDeleteUser(resetTarget.id, resetTarget.name);
                  setResetting(false);
                  setResetTarget(null);
                }}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Logging out...</>
                ) : (
                  'Force Logout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  // Auth state
  const [authed, setAuthed] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Navigation
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [proofs, setProofs] = useState<PaymentProofItem[]>([]);
  const [pendingProofsCount, setPendingProofsCount] = useState(0);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});

  // BTC price widget and clock are now separate memoized components outside AdminPage

  // Loading states
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  // Filter states
  const [proofFilter, setProofFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [withdrawalFilter, setWithdrawalFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  // Dialog states
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: 0,
    daily: 0,
    monthly: 0,
    totalReturn: 0,
    color: 'bg-emerald-500',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    isActive: true,
    sortOrder: 0,
  });

  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '', type: 'info' });

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveType, setApproveType] = useState<'payment' | 'withdrawal'>('payment');
  const [approveId, setApproveId] = useState('');
  const [approveAction, setApproveAction] = useState<'approved' | 'rejected'>('approved');
  const [approveNote, setApproveNote] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);

  const [savingContentKey, setSavingContentKey] = useState<string | null>(null);
  const [contentPage, setContentPage] = useState(0);

  // ─── Auth ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(AUTH_KEY)) {
      setAuthed(true);
    }
  }, []);

  // ─── Clock and BTC Price are now separate memoized components ──────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPass) return;
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(AUTH_KEY, data.token);
        setAuthed(true);
        toast.success('Login successful!');
      } else {
        toast.error(data.error || 'Invalid credentials');
      }
    } catch {
      toast.error('Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setActiveTab('dashboard');
    toast.success('Logged out');
  };

  // ─── API helpers ──────────────────────────────────────────────────────────

  const headers = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    }),
    [],
  );

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats', { headers: headers() });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch {
      /* silent */
    } finally {
      setLoadingStats(false);
    }
  }, [headers]);

  const fetchProofs = useCallback(
    async (status?: string) => {
      setLoadingProofs(true);
      try {
        const url = status && status !== 'all' ? `/api/admin/payment-proofs?status=${status}` : '/api/admin/payment-proofs';
        const res = await fetch(url, { headers: headers() });
        const data = await res.json();
        if (data.success) {
          setProofs(data.proofs);
          setPendingProofsCount(data.pendingCount || 0);
        }
      } catch {
        /* silent */
      } finally {
        setLoadingProofs(false);
      }
    },
    [headers],
  );

  const handleApproveRejectProof = async (id: string, action: 'approved' | 'rejected', note?: string) => {
    try {
      const res = await fetch(`/api/admin/payment-proofs/${id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ status: action, adminNote: note || '' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${action === 'approved' ? '✅ Approved! Plan will be added to user account.' : '❌ Rejected'}`, {
          description: action === 'approved' ? 'User will see the plan activated automatically.' : 'User has been notified.',
          duration: 4000,
        });
        fetchProofs(proofFilter);
        fetchStats();
      } else toast.error(data.error || 'Action failed');
    } catch {
      toast.error('Action failed');
    }
  };

  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch('/api/admin/plans', { headers: headers() });
      const data = await res.json();
      if (data.success) setPlans(data.plans);
    } catch {
      /* silent */
    } finally {
      setLoadingPlans(false);
    }
  }, [headers]);

  const fetchPayments = useCallback(
    async (status?: string) => {
      setLoadingPayments(true);
      try {
        const url = status && status !== 'all' ? `/api/admin/payments?status=${status}` : '/api/admin/payments';
        const res = await fetch(url, { headers: headers() });
        const data = await res.json();
        if (data.success) setPayments(data.payments);
      } catch {
        /* silent */
      } finally {
        setLoadingPayments(false);
      }
    },
    [headers],
  );

  const fetchWithdrawals = useCallback(
    async (status?: string) => {
      setLoadingWithdrawals(true);
      try {
        const url = status && status !== 'all' ? `/api/admin/withdrawals?status=${status}` : '/api/admin/withdrawals';
        const res = await fetch(url, { headers: headers() });
        const data = await res.json();
        if (data.success) setWithdrawals(data.withdrawals);
      } catch {
        /* silent */
      } finally {
        setLoadingWithdrawals(false);
      }
    },
    [headers],
  );

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetch('/api/admin/notifications', { headers: headers() });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch {
      /* silent */
    } finally {
      setLoadingNotifications(false);
    }
  }, [headers]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', { headers: headers() });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch {
      /* silent */
    } finally {
      setLoadingUsers(false);
    }
  }, [headers]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE', headers: headers() });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${userName}" ko logout kar diya gaya! Wo phir login karega.`);
        fetchUsers();
      } else toast.error(data.error || 'Logout failed');
    } catch {
      toast.error('Logout failed');
    }
  };

  const fetchContent = useCallback(async () => {
    setLoadingContent(true);
    try {
      const res = await fetch('/api/admin/content', { headers: headers() });
      const data = await res.json();
      if (data.success) setSiteContent(data.content);
    } catch {
      /* silent */
    } finally {
      setLoadingContent(false);
    }
  }, [headers]);

  // ─── Tab change + data fetch ──────────────────────────────────────────────

  const switchTab = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      setSidebarOpen(false);
    },
    [],
  );

  useEffect(() => {
    if (!authed) return;
    switch (activeTab) {
      case 'dashboard':
        fetchStats();
        fetchProofs('pending');
        fetchPayments('pending');
        fetchWithdrawals('pending');
        break;
      case 'proofs':
        fetchProofs(proofFilter);
        break;
      case 'plans':
        fetchPlans();
        break;
      case 'payments':
        fetchPayments(paymentFilter);
        break;
      case 'withdrawals':
        fetchWithdrawals(withdrawalFilter);
        break;
      case 'notifications':
        fetchNotifications();
        break;
      case 'users':
        fetchUsers();
        break;
      case 'content':
        fetchContent();
        break;
    }
  }, [authed, activeTab, fetchStats, fetchProofs, proofFilter, fetchPayments, fetchWithdrawals, fetchPlans, fetchNotifications, fetchUsers, fetchContent]);

  useEffect(() => {
    if (authed && activeTab === 'proofs') fetchProofs(proofFilter);
  }, [authed, activeTab, proofFilter, fetchProofs]);

  useEffect(() => {
    if (authed && activeTab === 'payments') fetchPayments(paymentFilter);
  }, [authed, activeTab, paymentFilter, fetchPayments]);

  useEffect(() => {
    if (authed && activeTab === 'withdrawals') fetchWithdrawals(withdrawalFilter);
  }, [authed, activeTab, withdrawalFilter, fetchWithdrawals]);

  // ─── Plan CRUD ────────────────────────────────────────────────────────────

  const openNewPlan = () => {
    setEditingPlan(null);
    setPlanForm({ name: '', price: 0, daily: 0, monthly: 0, totalReturn: 0, color: 'bg-emerald-500', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', isActive: true, sortOrder: 0 });
    setPlanDialogOpen(true);
  };

  const openEditPlan = (plan: InvestmentPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price: plan.price,
      daily: plan.daily,
      monthly: plan.monthly,
      totalReturn: plan.totalReturn,
      color: plan.color,
      iconBg: plan.iconBg,
      iconColor: plan.iconColor,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    });
    setPlanDialogOpen(true);
  };

  const handleSavePlan = async () => {
    try {
      if (editingPlan) {
        const res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
          method: 'PUT',
          headers: headers(),
          body: JSON.stringify(planForm),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Plan saved successfully!');
          setPlanDialogOpen(false);
          fetchPlans();
        } else toast.error(data.error || 'Failed to update');
      } else {
        const res = await fetch('/api/admin/plans', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(planForm),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Plan saved successfully!');
          setPlanDialogOpen(false);
          fetchPlans();
        } else toast.error(data.error || 'Failed to create');
      }
    } catch {
      toast.error('Operation failed');
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE', headers: headers() });
      const data = await res.json();
      if (data.success) {
        toast.success('Plan deleted!');
        fetchPlans();
      } else toast.error(data.error || 'Failed to delete');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleTogglePlan = async (plan: InvestmentPlan) => {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(plan.isActive ? 'Plan deactivated' : 'Plan activated');
        fetchPlans();
      } else toast.error('Failed to toggle');
    } catch {
      toast.error('Toggle failed');
    }
  };

  // ─── Approve / Reject ─────────────────────────────────────────────────────

  const openApproveDialog = (type: 'payment' | 'withdrawal', id: string, action: 'approved' | 'rejected') => {
    setApproveType(type);
    setApproveId(id);
    setApproveAction(action);
    setApproveNote('');
    setApproveDialogOpen(true);
  };

  const handleApproveReject = async () => {
    setApproveLoading(true);
    try {
      const endpoint = approveType === 'payment' ? `/api/admin/payments/${approveId}` : `/api/admin/withdrawals/${approveId}`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ status: approveAction, adminNote: approveNote }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${approveAction === 'approved' ? 'Approved' : 'Rejected'} successfully`, {
          description: `${approveType === 'payment' ? 'Payment' : 'Withdrawal'} status updated.`,
          duration: 3000,
        });
        setApproveDialogOpen(false);
        if (approveType === 'payment') fetchPayments(paymentFilter);
        else fetchWithdrawals(withdrawalFilter);
        if (activeTab === 'dashboard') {
          fetchStats();
          fetchPayments('pending');
          fetchWithdrawals('pending');
        }
      } else toast.error(data.error || 'Action failed');
    } catch {
      toast.error('Action failed');
    } finally {
      setApproveLoading(false);
    }
  };

  // ─── Notifications ────────────────────────────────────────────────────────

  const handleSendNotification = async () => {
    if (!notifyForm.title || !notifyForm.message) return;
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(notifyForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Notification sent to all users!');
        setNotifyDialogOpen(false);
        setNotifyForm({ title: '', message: '', type: 'info' });
        fetchNotifications();
      } else toast.error(data.error || 'Failed to send');
    } catch {
      toast.error('Failed to send notification');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: headers(),
        body: JSON.stringify({ id }),
      });
      if (res.ok || res.status === 200) {
        toast.success('Notification deleted');
        fetchNotifications();
        return;
      }
    } catch {
      // fallback: remove from local state
    }
    // If DELETE not supported, filter locally
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success('Notification removed');
  };

  // ─── Site Content ─────────────────────────────────────────────────────────

  const handleSaveContent = async (key: string, value: string) => {
    setSavingContentKey(key);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Content saved successfully!', {
          description: 'Changes are now live.',
          duration: 3000,
        });
        setSiteContent((prev) => ({ ...prev, [key]: value }));
      } else toast.error(data.error || 'Failed to save');
    } catch {
      toast.error('Save failed');
    } finally {
      setSavingContentKey(null);
    }
  };

  // ─── Status Badge ─────────────────────────────────────────────────────────

  const StatusBadge = ({ status }: { status: string }) => {
    const s = status.toLowerCase();
    if (s === 'approved') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">Approved</Badge>;
    if (s === 'rejected') return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">Rejected</Badge>;
    return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">Pending</Badge>;
  };

  const NotificationBadge = ({ type }: { type: string }) => {
    const t = type.toLowerCase();
    if (t === 'warning') return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Warning</Badge>;
    if (t === 'success') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Success</Badge>;
    if (t === 'alert') return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Alert</Badge>;
    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Info</Badge>;
  };

  // Scroll position preservation
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);

  const handleContentScroll = useCallback(() => {
    if (contentScrollRef.current) {
      scrollPosRef.current = contentScrollRef.current.scrollTop;
    }
  }, []);

  useLayoutEffect(() => {
    const el = contentScrollRef.current;
    if (el && scrollPosRef.current > 0) {
      el.scrollTop = scrollPosRef.current;
    }
  });

  // ─── LOGIN ─────────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <LoginBackground />

        {/* Floating animation style */}
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
            25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
            50% { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
            75% { transform: translateY(-30px) translateX(15px); opacity: 0.5; }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.3), 0 0 60px rgba(245, 158, 11, 0.1); }
            50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.5), 0 0 80px rgba(245, 158, 11, 0.2); }
          }
        `}</style>

        {/* Glass card */}
        <Card className="w-full max-w-md relative z-10 bg-zinc-900/60 backdrop-blur-2xl border border-zinc-700/50 shadow-2xl shadow-black/50">
          <CardContent className="p-8">
            {/* Animated logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-5">
                {/* Outer ring */}
                <div className="absolute inset-[-12px] rounded-full border border-amber-500/20 animate-[spin-slow_20s_linear_infinite]" style={{ borderTopColor: 'rgba(245,158,11,0.6)', borderRightColor: 'rgba(245,158,11,0.2)' }} />
                {/* Logo circle */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30 animate-[pulse-glow_3s_ease-in-out_infinite]">
                  <span className="text-4xl font-bold text-white drop-shadow-lg">₿</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Admin Panel</h1>
              <p className="text-zinc-500 text-sm mt-2 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-amber-500/60" />
                Sign in to manage your platform
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="username" className="text-zinc-400 text-sm">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="bg-zinc-800/60 border-zinc-700/60 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 h-11"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-zinc-400 text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="bg-zinc-800/60 border-zinc-700/60 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={loginLoading || !loginUser || !loginPass}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold h-11 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-shadow"
              >
                {loginLoading ? <Loader2 className="size-5 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-zinc-600 text-xs flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Secured with 256-bit encryption
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── MAIN LAYOUT ──────────────────────────────────────────────────────────

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <span className="text-xl font-bold text-white">₿</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg leading-tight">Admin Panel</h2>
          <p className="text-zinc-500 text-xs">Management Dashboard</p>
        </div>
      </div>
      <Separator className="bg-zinc-800/60" />
      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.tab}
            onClick={() => switchTab(item.tab)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
              activeTab === item.tab
                ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-400 shadow-sm shadow-amber-500/5'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
          >
            {/* Active gradient accent strip */}
            {activeTab === item.tab && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-amber-400 to-orange-500" />
            )}
            <span className={activeTab === item.tab ? 'drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]' : ''}>
              {item.icon}
            </span>
            {item.label}
            {item.tab === 'payments' && stats && stats.pendingPayments > 0 && (
              <span className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                {stats.pendingPayments}
              </span>
            )}
            {item.tab === 'proofs' && pendingProofsCount > 0 && (
              <span className="ml-auto bg-gradient-to-r from-emerald-500 to-green-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                {pendingProofsCount}
              </span>
            )}
            {item.tab === 'withdrawals' && stats && stats.pendingWithdrawals > 0 && (
              <span className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                {stats.pendingWithdrawals}
              </span>
            )}
          </button>
        ))}
      </nav>
      <Separator className="bg-zinc-800/60" />

      {/* User section at bottom */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800/40">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-amber-500/20">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-zinc-300 text-sm font-medium truncate">Admin</p>
            <p className="text-zinc-600 text-[10px]">Super Admin</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="size-5" />
          Logout
        </button>
      </div>
    </div>
  );



  // ─── DASHBOARD TAB ────────────────────────────────────────────────────────

  const DashboardTab = () => {
    // Compute revenue summary from payments
    const totalApproved = payments.reduce((sum, p) => p.status === 'approved' ? sum + p.amount : sum, 0);
    const totalPending = payments.reduce((sum, p) => p.status === 'pending' ? sum + p.amount : sum, 0);
    const totalRejected = payments.reduce((sum, p) => p.status === 'rejected' ? sum + p.amount : sum, 0);
    const totalWithdrawalAmt = withdrawals.reduce((sum, w) => w.status === 'approved' ? sum + w.amount : sum, 0);
    const totalPaymentsForBar = totalApproved + totalPending + totalRejected;
    const approvedPct = totalPaymentsForBar > 0 ? Math.round((totalApproved / totalPaymentsForBar) * 100) : 0;
    const pendingPct = totalPaymentsForBar > 0 ? Math.round((totalPending / totalPaymentsForBar) * 100) : 0;
    const rejectedPct = totalPaymentsForBar > 0 ? Math.round((totalRejected / totalPaymentsForBar) * 100) : 0;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Dashboard
            <Activity className="size-5 text-amber-500" />
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Overview of your platform performance</p>
        </div>

        {/* Stat Cards with gradient borders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="group relative">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
            <Card className="bg-zinc-900 border-zinc-800/60 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-l-xl" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Total Users</p>
                    <p className="text-3xl font-bold text-white mt-2 tabular-nums">{loadingStats ? '...' : stats?.totalUsers ?? 0}</p>
                    <p className="text-zinc-600 text-xs mt-1 flex items-center gap-1">
                      <Users className="size-3" /> registered accounts
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center border border-blue-500/10">
                    <Users className="size-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Investments */}
          <div className="group relative">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
            <Card className="bg-zinc-900 border-zinc-800/60 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-green-400 rounded-l-xl" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Active Investments</p>
                    <p className="text-3xl font-bold text-white mt-2 tabular-nums">{loadingStats ? '...' : stats?.activeInvestments ?? 0}</p>
                    <p className="text-zinc-600 text-xs mt-1 flex items-center gap-1">
                      <DollarSign className="size-3" /> active plans
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 flex items-center justify-center border border-emerald-500/10">
                    <DollarSign className="size-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Payments */}
          <div className="group relative">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
            <Card className="bg-zinc-900 border-zinc-800/60 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-orange-400 rounded-l-xl" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Pending Payments</p>
                    <p className="text-3xl font-bold text-white mt-2 tabular-nums">{loadingStats ? '...' : stats?.pendingPayments ?? 0}</p>
                    <p className="text-zinc-600 text-xs mt-1 flex items-center gap-1">
                      <ClockIcon className="size-3" /> awaiting review
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/10">
                    <CreditCard className="size-6 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Withdrawals */}
          <div className="group relative">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-red-500/30 to-rose-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
            <Card className="bg-zinc-900 border-zinc-800/60 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-rose-400 rounded-l-xl" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Pending Withdrawals</p>
                    <p className="text-3xl font-bold text-white mt-2 tabular-nums">{loadingStats ? '...' : stats?.pendingWithdrawals ?? 0}</p>
                    <p className="text-zinc-600 text-xs mt-1 flex items-center gap-1">
                      <ArrowUpCircle className="size-3" /> need approval
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/10 flex items-center justify-center border border-red-500/10">
                    <ArrowUpCircle className="size-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Total Invested */}
        {stats && stats.totalInvestedAmount > 0 && (
          <Card className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent" />
            <CardContent className="p-5 flex items-center justify-between relative">
              <div>
                <p className="text-zinc-400 text-sm flex items-center gap-1.5">
                  <Coins className="size-4 text-amber-500/60" />
                  Total Invested Amount
                </p>
                <p className="text-3xl font-bold text-amber-400 mt-2 tabular-nums">{formatCurrency(stats.totalInvestedAmount)}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/15 shadow-lg shadow-amber-500/10">
                <CircleDollarSign className="size-7 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Summary */}
        <Card className="bg-zinc-900 border-zinc-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Wallet className="size-4 text-amber-400" />
              Revenue Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4">
                <p className="text-emerald-400/70 text-xs font-medium uppercase tracking-wider">Approved Revenue</p>
                <p className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">{formatCurrency(totalApproved)}</p>
              </div>
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4">
                <p className="text-amber-400/70 text-xs font-medium uppercase tracking-wider">Pending Amount</p>
                <p className="text-xl font-bold text-amber-400 mt-1 tabular-nums">{formatCurrency(totalPending)}</p>
              </div>
              <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4">
                <p className="text-red-400/70 text-xs font-medium uppercase tracking-wider">Total Withdrawals</p>
                <p className="text-xl font-bold text-red-400 mt-1 tabular-nums">{formatCurrency(totalWithdrawalAmt)}</p>
              </div>
            </div>

            {/* Progress bar */}
            {totalPaymentsForBar > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Payment Distribution</span>
                  <span>{payments.length} total</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800">
                  {approvedPct > 0 && (
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                      style={{ width: `${approvedPct}%` }}
                    />
                  )}
                  {pendingPct > 0 && (
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
                      style={{ width: `${pendingPct}%` }}
                    />
                  )}
                  {rejectedPct > 0 && (
                    <div
                      className="bg-gradient-to-r from-red-500 to-red-400 transition-all duration-700"
                      style={{ width: `${rejectedPct}%` }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Approved {approvedPct}%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Pending {pendingPct}%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Rejected {rejectedPct}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Pending Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <Card className="bg-zinc-900 border-zinc-800/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <CreditCard className="size-4 text-amber-400" />
                Recent Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPayments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-zinc-500" />
                </div>
              ) : payments.length === 0 ? (
                <div className="py-8 text-center">
                  <ArrowDownLeft className="size-10 text-zinc-800 mx-auto mb-2" />
                  <p className="text-zinc-600 text-sm">No pending payments</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800/60 hover:bg-transparent">
                        <TableHead className="text-zinc-500 text-xs">User</TableHead>
                        <TableHead className="text-zinc-500 text-xs">Plan</TableHead>
                        <TableHead className="text-zinc-500 text-xs">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.slice(0, 5).map((p, i) => (
                        <TableRow key={p.id} className={`border-zinc-800/40 ${i % 2 === 0 ? 'bg-transparent' : 'bg-zinc-800/20'} hover:bg-zinc-800/40 transition-colors`}>
                          <TableCell className="text-zinc-300 text-xs font-medium">{p.userName}</TableCell>
                          <TableCell className="text-zinc-400 text-xs">{p.planName}</TableCell>
                          <TableCell className="text-amber-400 font-semibold text-xs tabular-nums">{formatCurrency(p.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Withdrawals */}
          <Card className="bg-zinc-900 border-zinc-800/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <ArrowUpCircle className="size-4 text-red-400" />
                Recent Pending Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingWithdrawals ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-zinc-500" />
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="py-8 text-center">
                  <ArrowUpCircle className="size-10 text-zinc-800 mx-auto mb-2" />
                  <p className="text-zinc-600 text-sm">No pending withdrawals</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800/60 hover:bg-transparent">
                        <TableHead className="text-zinc-500 text-xs">User</TableHead>
                        <TableHead className="text-zinc-500 text-xs">Amount</TableHead>
                        <TableHead className="text-zinc-500 text-xs">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.slice(0, 5).map((w, i) => (
                        <TableRow key={w.id} className={`border-zinc-800/40 ${i % 2 === 0 ? 'bg-transparent' : 'bg-zinc-800/20'} hover:bg-zinc-800/40 transition-colors`}>
                          <TableCell className="text-zinc-300 text-xs font-medium">{w.userName}</TableCell>
                          <TableCell className="text-red-400 font-semibold text-xs tabular-nums">{formatCurrency(w.amount)}</TableCell>
                          <TableCell className="text-zinc-400 text-xs">{formatDateShort(w.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ─── INVESTMENT PLANS TAB ─────────────────────────────────────────────────

  const PlansTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Investment Plans
            <DollarSign className="size-5 text-amber-500" />
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Manage your investment plans</p>
        </div>
        <Button
          onClick={openNewPlan}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20"
        >
          <Plus className="size-4 mr-2" />
          Add New Plan
        </Button>
      </div>

      {loadingPlans ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-zinc-500" />
        </div>
      ) : plans.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800/60">
          <CardContent className="py-16 text-center">
            <DollarSign className="size-14 text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No investment plans yet</p>
            <p className="text-zinc-600 text-xs mt-1">Click &quot;Add New Plan&quot; to get started</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800/60 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800/60 hover:bg-transparent">
                    <TableHead className="text-zinc-500 text-xs">Name</TableHead>
                    <TableHead className="text-zinc-500 text-xs">Price</TableHead>
                    <TableHead className="text-zinc-500 text-xs">Daily</TableHead>
                    <TableHead className="text-zinc-500 text-xs">Monthly</TableHead>
                    <TableHead className="text-zinc-500 text-xs">Total Return</TableHead>
                    <TableHead className="text-zinc-500 text-xs">Status</TableHead>
                    <TableHead className="text-zinc-500 text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan, i) => (
                    <TableRow key={plan.id} className={`border-zinc-800/40 ${i % 2 === 0 ? 'bg-transparent' : 'bg-zinc-800/20'} hover:bg-zinc-800/40 transition-colors`}>
                      <TableCell className="text-white font-medium">{plan.name}</TableCell>
                      <TableCell className="text-zinc-300 tabular-nums">{formatCurrency(plan.price)}</TableCell>
                      <TableCell className="text-emerald-400 tabular-nums">{formatCurrency(plan.daily)}</TableCell>
                      <TableCell className="text-amber-400 tabular-nums">{formatCurrency(plan.monthly)}</TableCell>
                      <TableCell className="text-blue-400 tabular-nums">{formatCurrency(plan.totalReturn)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.isActive}
                            onCheckedChange={() => handleTogglePlan(plan)}
                            className="data-[state=checked]:bg-amber-500"
                          />
                          <span className={`text-xs ${plan.isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditPlan(plan)} className="text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 h-8 w-8 p-0">
                            <Pencil className="size-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0">
                                <Trash2 className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Delete Plan</AlertDialogTitle>
                                <AlertDialogDescription className="text-zinc-400">
                                  Are you sure you want to delete &quot;{plan.name}&quot;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePlan(plan.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );

  // ─── PAYMENT PROOFS TAB ─────────────────────────────────────────────────

  const ProofsTab = () => {
    const [expandedProof, setExpandedProof] = useState<string | null>(null);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Payment Proofs
            <ShieldCheck className="size-5 text-emerald-500" />
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Verify user payment screenshots & approve plans</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <Button
              key={f}
              variant={proofFilter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setProofFilter(f)}
              className={
                proofFilter === f
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-green-600 border-0'
                  : 'bg-zinc-900 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && pendingProofsCount > 0 && (
                <span className="ml-1.5 bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">{pendingProofsCount}</span>
              )}
            </Button>
          ))}
        </div>

        {loadingProofs ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-zinc-500" />
          </div>
        ) : proofs.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800/60">
            <CardContent className="p-16 text-center">
              <ShieldCheck className="size-14 text-zinc-800 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No payment proofs found</p>
              <p className="text-zinc-600 text-xs mt-1">Proofs will appear here when users submit payment screenshots</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {proofs.map((proof) => (
              <Card key={proof.id} className="bg-zinc-900 border-zinc-800/60 overflow-hidden hover:border-zinc-700/60 transition-colors">
                <CardContent className="p-0">
                  {/* Header row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-zinc-800/40 transition-colors"
                    onClick={() => setExpandedProof(expandedProof === proof.id ? null : proof.id)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                      {(proof.userName || '?').charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium truncate">{proof.userName}</p>
                        <StatusBadge status={proof.status} />
                      </div>
                      <p className="text-zinc-500 text-xs truncate">{proof.planName} • ₹{proof.amount.toLocaleString('en-IN')} • UTR: {proof.utr}</p>
                    </div>

                    {/* Date + Expand */}
                    <div className="text-right shrink-0">
                      <p className="text-zinc-500 text-[10px]">{formatDate(proof.createdAt)}</p>
                      <ChevronDown className={`size-4 text-zinc-500 mx-auto mt-1 transition-transform ${expandedProof === proof.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedProof === proof.id && (
                    <div className="border-t border-zinc-800/60 p-4 space-y-4 bg-zinc-800/20">
                      {/* User Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-zinc-800/60 rounded-lg p-3">
                          <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Name</p>
                          <p className="text-white text-sm font-medium mt-0.5">{proof.userName}</p>
                        </div>
                        <div className="bg-zinc-800/60 rounded-lg p-3">
                          <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Phone</p>
                          <p className="text-white text-sm font-medium mt-0.5">{proof.userPhone || '—'}</p>
                        </div>
                        <div className="bg-zinc-800/60 rounded-lg p-3">
                          <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Email</p>
                          <p className="text-zinc-400 text-sm mt-0.5 truncate">{proof.userEmail}</p>
                        </div>
                        <div className="bg-zinc-800/60 rounded-lg p-3">
                          <p className="text-zinc-500 text-[10px] uppercase tracking-wider">UTR Number</p>
                          <p className="text-amber-400 text-sm font-mono font-medium mt-0.5">{proof.utr}</p>
                        </div>
                      </div>

                      {/* Plan + Amount */}
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5">
                          <p className="text-emerald-400/70 text-[10px] uppercase tracking-wider">Plan</p>
                          <p className="text-emerald-400 text-base font-bold">{proof.planName}</p>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5">
                          <p className="text-amber-400/70 text-[10px] uppercase tracking-wider">Amount</p>
                          <p className="text-amber-400 text-base font-bold">₹{proof.amount.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-zinc-800/60 rounded-lg px-4 py-2.5">
                          <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Screenshot</p>
                          <p className="text-zinc-300 text-xs font-mono mt-0.5 truncate max-w-[200px]">{proof.screenshotFilename}</p>
                        </div>
                      </div>

                      {/* Plan data preview */}
                      {proof.planData && (
                        <div className="bg-zinc-800/40 rounded-lg p-3">
                          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Plan Details (will be added on approve)</p>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              try {
                                const pd = JSON.parse(proof.planData);
                                return [
                                  <Badge key="daily" variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">Daily: ₹{pd.daily}</Badge>,
                                  <Badge key="monthly" variant="outline" className="text-amber-400 border-amber-500/30 text-xs">Monthly: ₹{pd.monthly}</Badge>,
                                  <Badge key="total" variant="outline" className="text-purple-400 border-purple-500/30 text-xs">Total: ₹{pd.totalReturn}</Badge>,
                                ];
                              } catch { return null; }
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Admin note (if rejected/approved with note) */}
                      {proof.adminNote && (
                        <div className={`rounded-lg p-3 ${proof.status === 'rejected' ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                          <p className={`text-xs font-medium ${proof.status === 'rejected' ? 'text-red-400' : 'text-emerald-400'}`}>Admin Note: {proof.adminNote}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      {proof.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRejectProof(proof.id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                          >
                            <Check className="size-4 mr-1.5" />
                            Approve Plan
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveRejectProof(proof.id, 'rejected')}
                            className="bg-red-600 hover:bg-red-700 text-white h-9"
                          >
                            <Ban className="size-4 mr-1.5" />
                            Reject
                          </Button>
                          <a
                            href={`https://wa.me/${proof.userPhone ? '91' + proof.userPhone : ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto"
                          >
                            <Button size="sm" variant="outline" className="bg-green-600/10 border-green-500/30 text-green-400 hover:bg-green-600/20 h-9">
                              <Send className="size-3.5 mr-1.5" />
                              WhatsApp User
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── PAYMENTS TAB ─────────────────────────────────────────────────────────

  const PaymentsTab = () => {
    const filterBtns = ['all', 'pending', 'approved', 'rejected'];
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Payments
            <CreditCard className="size-5 text-amber-500" />
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Manage payment requests</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filterBtns.map((f) => (
            <Button
              key={f}
              variant={paymentFilter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentFilter(f)}
              className={
                paymentFilter === f
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 border-0'
                  : 'bg-zinc-900 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        <Card className="bg-zinc-900 border-zinc-800/60">
          <CardContent className="p-0">
            {loadingPayments ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-zinc-500" />
              </div>
            ) : payments.length === 0 ? (
              <div className="py-16 text-center">
                <CreditCard className="size-14 text-zinc-800 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No payments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800/60 hover:bg-transparent">
                      <TableHead className="text-zinc-500 text-xs">User</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Plan</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Amount</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Status</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Date</TableHead>
                      <TableHead className="text-zinc-500 text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p, i) => (
                      <TableRow key={p.id} className={`border-zinc-800/40 ${i % 2 === 0 ? 'bg-transparent' : 'bg-zinc-800/20'} hover:bg-zinc-800/40 transition-colors`}>
                        <TableCell>
                          <div>
                            <p className="text-zinc-200 text-sm font-medium">{p.userName}</p>
                            <p className="text-zinc-500 text-xs">{p.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-300">{p.planName}</TableCell>
                        <TableCell className="text-amber-400 font-semibold tabular-nums">{formatCurrency(p.amount)}</TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-zinc-400 text-xs">{formatDate(p.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          {p.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                onClick={() => openApproveDialog('payment', p.id, 'approved')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                              >
                                <Check className="size-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => openApproveDialog('payment', p.id, 'rejected')}
                                className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                              >
                                <Ban className="size-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : p.adminNote ? (
                            <span className="text-zinc-500 text-xs italic" title={p.adminNote}>
                              {p.adminNote.length > 20 ? p.adminNote.slice(0, 20) + '...' : p.adminNote}
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── WITHDRAWALS TAB ──────────────────────────────────────────────────────

  const WithdrawalsTab = () => {
    const filterBtns = ['all', 'pending', 'approved', 'rejected'];
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Withdrawals
            <ArrowUpCircle className="size-5 text-amber-500" />
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Manage withdrawal requests</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filterBtns.map((f) => (
            <Button
              key={f}
              variant={withdrawalFilter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setWithdrawalFilter(f)}
              className={
                withdrawalFilter === f
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 border-0'
                  : 'bg-zinc-900 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        <Card className="bg-zinc-900 border-zinc-800/60">
          <CardContent className="p-0">
            {loadingWithdrawals ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-zinc-500" />
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="py-16 text-center">
                <ArrowUpCircle className="size-14 text-zinc-800 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No withdrawals found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800/60 hover:bg-transparent">
                      <TableHead className="text-zinc-500 text-xs">User</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Amount</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Status</TableHead>
                      <TableHead className="text-zinc-500 text-xs">Date</TableHead>
                      <TableHead className="text-zinc-500 text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((w, i) => (
                      <TableRow key={w.id} className={`border-zinc-800/40 ${i % 2 === 0 ? 'bg-transparent' : 'bg-zinc-800/20'} hover:bg-zinc-800/40 transition-colors`}>
                        <TableCell>
                          <div>
                            <p className="text-zinc-200 text-sm font-medium">{w.userName}</p>
                            <p className="text-zinc-500 text-xs">{w.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-red-400 font-semibold tabular-nums">{formatCurrency(w.amount)}</TableCell>
                        <TableCell><StatusBadge status={w.status} /></TableCell>
                        <TableCell className="text-zinc-400 text-xs">{formatDate(w.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          {w.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                onClick={() => openApproveDialog('withdrawal', w.id, 'approved')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                              >
                                <Check className="size-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => openApproveDialog('withdrawal', w.id, 'rejected')}
                                className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                              >
                                <Ban className="size-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : w.adminNote ? (
                            <span className="text-zinc-500 text-xs italic" title={w.adminNote}>
                              {w.adminNote.length > 20 ? w.adminNote.slice(0, 20) + '...' : w.adminNote}
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── NOTIFICATIONS TAB ────────────────────────────────────────────────────

  const NotificationsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Notifications
            <Bell className="size-5 text-amber-500" />
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Send and manage notifications</p>
        </div>
        <Button
          onClick={() => { setNotifyForm({ title: '', message: '', type: 'info' }); setNotifyDialogOpen(true); }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20"
        >
          <Send className="size-4 mr-2" />
          Send New Notification
        </Button>
      </div>

      {loadingNotifications ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-zinc-500" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800/60">
          <CardContent className="py-16 text-center">
            <Bell className="size-14 text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No notifications sent yet</p>
            <p className="text-zinc-600 text-xs mt-1">Send your first notification to all users</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className="bg-zinc-900 border-zinc-800/60 hover:border-zinc-700/60 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-white font-medium text-sm">{n.title}</h3>
                      <NotificationBadge type={n.type} />
                    </div>
                    <p className="text-zinc-400 text-sm line-clamp-2">{n.message}</p>
                    <p className="text-zinc-600 text-xs mt-2 flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteNotification(n.id)}
                    className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );

  // ─── UsersTab and ContentTab are now memoized components outside AdminPage ──

  // ─── APPROVE / REJECT DIALOG ──────────────────────────────────────────────

  const ApproveRejectDialog = () => (
    <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className={`text-white ${approveAction === 'approved' ? '' : ''}`}>
            {approveAction === 'approved' ? '✅ Approve' : '❌ Reject'} {approveType === 'payment' ? 'Payment' : 'Withdrawal'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Are you sure you want to {approveAction} this {approveType} request?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Admin Note (optional)</Label>
            <Textarea
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              placeholder="Add a note for the user..."
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setApproveDialogOpen(false)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" disabled={approveLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleApproveReject}
            disabled={approveLoading}
            className={
              approveAction === 'approved'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }
          >
            {approveLoading ? <Loader2 className="size-4 animate-spin" /> : approveAction === 'approved' ? <Check className="size-4 mr-1" /> : <Ban className="size-4 mr-1" />}
            {approveAction === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ─── RENDER TAB CONTENT ───────────────────────────────────────────────────

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'proofs': return <ProofsTab />;
      case 'plans': return <PlansTab />;
      case 'payments': return <PaymentsTab />;
      case 'withdrawals': return <WithdrawalsTab />;
      case 'notifications': return <NotificationsTab />;
      case 'users': return <UsersTab users={users} loadingUsers={loadingUsers} userSearch={userSearch} setUserSearch={setUserSearch} handleDeleteUser={handleDeleteUser} />;
      case 'content': return <ContentTab siteContent={siteContent} setSiteContent={setSiteContent} contentPage={contentPage} setContentPage={setContentPage} loadingContent={loadingContent} savingContentKey={savingContentKey} handleSaveContent={handleSaveContent} />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex relative">
      <AnimatedOrbs />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-800/60 min-h-screen sticky top-0 relative z-10">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent className="w-72 bg-zinc-950 border-zinc-800 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 min-h-screen relative z-10">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-[#0a0a0b]/70 backdrop-blur-2xl border-b border-zinc-800/50">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-zinc-400 hover:text-white hover:bg-zinc-800 h-9 w-9 p-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <h1 className="text-white font-bold text-lg">
                {NAV_ITEMS.find((n) => n.tab === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* BTC Price Widget */}
              <div className="hidden md:block">
                <BtcPriceWidget />
              </div>

              {/* Date/Time */}
              <AdminClock />

              {/* Notification bell */}
              <button className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors">
                <Bell className="size-4" />
                {stats && (stats.pendingPayments + stats.pendingWithdrawals) > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse shadow-sm shadow-amber-500/50" />
                )}
              </button>

              {/* Online status */}
              <div className="hidden sm:flex items-center gap-2 text-zinc-500 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                <span className="text-xs">Online</span>
              </div>

              <Separator orientation="vertical" className="hidden sm:block h-6 bg-zinc-800" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 h-9"
              >
                <LogOut className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div
          ref={contentScrollRef}
          onScroll={handleContentScroll}
          className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto"
          style={{ height: 'calc(100vh - 4rem)' }}
        >
          {renderTab()}
        </div>
      </main>

      {/* Global Dialogs (outside tabs to prevent blink on open) */}
      <ApproveRejectDialog />

      {/* Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editingPlan ? 'Update the investment plan details' : 'Fill in the details for the new plan'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Plan Name</Label>
              <Input value={planForm.name} onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Basic Plan" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Price (₹)</Label>
                <Input type="number" value={planForm.price} onChange={(e) => setPlanForm((p) => ({ ...p, price: Number(e.target.value) }))} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Daily Profit (₹)</Label>
                <Input type="number" value={planForm.daily} onChange={(e) => setPlanForm((p) => ({ ...p, daily: Number(e.target.value) }))} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Monthly Profit (₹)</Label>
                <Input type="number" value={planForm.monthly} onChange={(e) => setPlanForm((p) => ({ ...p, monthly: Number(e.target.value) }))} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Total Return (₹)</Label>
                <Input type="number" value={planForm.totalReturn} onChange={(e) => setPlanForm((p) => ({ ...p, totalReturn: Number(e.target.value) }))} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
            </div>
            <Separator className="bg-zinc-800" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Color Class</Label>
                <Input value={planForm.color} onChange={(e) => setPlanForm((p) => ({ ...p, color: e.target.value }))} placeholder="bg-emerald-500" className="bg-zinc-800 border-zinc-700 text-white font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Icon BG Class</Label>
                <Input value={planForm.iconBg} onChange={(e) => setPlanForm((p) => ({ ...p, iconBg: e.target.value }))} placeholder="bg-emerald-500/20" className="bg-zinc-800 border-zinc-700 text-white font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Icon Color Class</Label>
                <Input value={planForm.iconColor} onChange={(e) => setPlanForm((p) => ({ ...p, iconColor: e.target.value }))} placeholder="text-emerald-400" className="bg-zinc-800 border-zinc-700 text-white font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Sort Order</Label>
                <Input type="number" value={planForm.sortOrder} onChange={(e) => setPlanForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={planForm.isActive} onCheckedChange={(checked) => setPlanForm((p) => ({ ...p, isActive: checked }))} className="data-[state=checked]:bg-amber-500" />
              <Label className="text-zinc-300">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={!planForm.name || planForm.price <= 0} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600">
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Send Notification</DialogTitle>
            <DialogDescription className="text-zinc-400">This notification will be sent to all users</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Title</Label>
              <Input value={notifyForm.title} onChange={(e) => setNotifyForm((p) => ({ ...p, title: e.target.value }))} placeholder="Notification title" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Message</Label>
              <Textarea value={notifyForm.message} onChange={(e) => setNotifyForm((p) => ({ ...p, message: e.target.value }))} placeholder="Notification message" rows={4} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Type</Label>
              <Select value={notifyForm.type} onValueChange={(v) => setNotifyForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Cancel
            </Button>
            <Button onClick={handleSendNotification} disabled={!notifyForm.title || !notifyForm.message} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600">
              <Send className="size-4 mr-2" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
