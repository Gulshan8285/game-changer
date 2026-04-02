'use client';

import { useState, useEffect, useCallback } from 'react';
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

type Tab = 'dashboard' | 'plans' | 'payments' | 'withdrawals' | 'notifications' | 'users' | 'content';

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

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_TOKEN = 'btc-admin-2024';
const AUTH_KEY = 'btc-admin-auth';

const NAV_ITEMS: { tab: Tab; label: string; icon: React.ReactNode }[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-5" /> },
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
      { key: 'hero_title', label: 'Hero Title', type: 'input' as const, placeholder: 'BitPay Wallet' },
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
      { key: 'contact_address', label: 'Company Name', type: 'input' as const, placeholder: 'BitPay Wallet Pvt. Ltd.' },
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
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});

  // Loading states
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  // Filter states
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
        fetchPayments('pending');
        fetchWithdrawals('pending');
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
  }, [authed, activeTab, fetchStats, fetchPayments, fetchWithdrawals, fetchPlans, fetchNotifications, fetchUsers, fetchContent]);

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

  // ─── LOGIN ─────────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/25">
                <span className="text-3xl font-bold text-white">₿</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-zinc-500 text-sm mt-1">Sign in to manage your platform</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-zinc-400">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-400">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500/50"
                />
              </div>
              <Button
                type="submit"
                disabled={loginLoading || !loginUser || !loginPass}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold h-11"
              >
                {loginLoading ? <Loader2 className="size-5 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <span className="text-xl font-bold text-white">₿</span>
        </div>
        <div>
          <h2 className="text-white font-bold text-lg leading-tight">Admin Panel</h2>
          <p className="text-zinc-500 text-xs">Management Dashboard</p>
        </div>
      </div>
      <Separator className="bg-zinc-800" />
      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.tab}
            onClick={() => switchTab(item.tab)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === item.tab
                ? 'bg-amber-500/15 text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
          >
            {item.icon}
            {item.label}
            {item.tab === 'payments' && stats && stats.pendingPayments > 0 && (
              <span className="ml-auto bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {stats.pendingPayments}
              </span>
            )}
            {item.tab === 'withdrawals' && stats && stats.pendingWithdrawals > 0 && (
              <span className="ml-auto bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {stats.pendingWithdrawals}
              </span>
            )}
          </button>
        ))}
      </nav>
      <Separator className="bg-zinc-800" />
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="size-5" />
          Logout
        </button>
      </div>
    </div>
  );

  // ─── DASHBOARD TAB ────────────────────────────────────────────────────────

  const DashboardTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-zinc-500 text-sm mt-1">Overview of your platform</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-white mt-1">{loadingStats ? '...' : stats?.totalUsers ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Users className="size-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm">Active Investments</p>
                <p className="text-3xl font-bold text-white mt-1">{loadingStats ? '...' : stats?.activeInvestments ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <DollarSign className="size-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm">Pending Payments</p>
                <p className="text-3xl font-bold text-white mt-1">{loadingStats ? '...' : stats?.pendingPayments ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <CreditCard className="size-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm">Pending Withdrawals</p>
                <p className="text-3xl font-bold text-white mt-1">{loadingStats ? '...' : stats?.pendingWithdrawals ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                <ArrowUpCircle className="size-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Invested */}
      {stats && stats.totalInvestedAmount > 0 && (
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Total Invested Amount</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(stats.totalInvestedAmount)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <DollarSign className="size-6 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Pending Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card className="bg-zinc-900 border-zinc-800">
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
              <p className="text-zinc-500 text-sm text-center py-8">No pending payments</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500">User</TableHead>
                      <TableHead className="text-zinc-500">Plan</TableHead>
                      <TableHead className="text-zinc-500">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 5).map((p) => (
                      <TableRow key={p.id} className="border-zinc-800">
                        <TableCell className="text-zinc-300 text-xs">{p.userName}</TableCell>
                        <TableCell className="text-zinc-300 text-xs">{p.planName}</TableCell>
                        <TableCell className="text-amber-400 font-medium text-xs">{formatCurrency(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Withdrawals */}
        <Card className="bg-zinc-900 border-zinc-800">
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
              <p className="text-zinc-500 text-sm text-center py-8">No pending withdrawals</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500">User</TableHead>
                      <TableHead className="text-zinc-500">Amount</TableHead>
                      <TableHead className="text-zinc-500">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.slice(0, 5).map((w) => (
                      <TableRow key={w.id} className="border-zinc-800">
                        <TableCell className="text-zinc-300 text-xs">{w.userName}</TableCell>
                        <TableCell className="text-red-400 font-medium text-xs">{formatCurrency(w.amount)}</TableCell>
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

  // ─── INVESTMENT PLANS TAB ─────────────────────────────────────────────────

  const PlansTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Investment Plans</h2>
          <p className="text-zinc-500 text-sm mt-1">Manage your investment plans</p>
        </div>
        <Button
          onClick={openNewPlan}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
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
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-16 text-center">
            <DollarSign className="size-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No investment plans yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-500">Name</TableHead>
                    <TableHead className="text-zinc-500">Price</TableHead>
                    <TableHead className="text-zinc-500">Daily</TableHead>
                    <TableHead className="text-zinc-500">Monthly</TableHead>
                    <TableHead className="text-zinc-500">Total Return</TableHead>
                    <TableHead className="text-zinc-500">Status</TableHead>
                    <TableHead className="text-zinc-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id} className="border-zinc-800">
                      <TableCell className="text-white font-medium">{plan.name}</TableCell>
                      <TableCell className="text-zinc-300">{formatCurrency(plan.price)}</TableCell>
                      <TableCell className="text-emerald-400">{formatCurrency(plan.daily)}</TableCell>
                      <TableCell className="text-amber-400">{formatCurrency(plan.monthly)}</TableCell>
                      <TableCell className="text-blue-400">{formatCurrency(plan.totalReturn)}</TableCell>
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
    </div>
  );

  // ─── PAYMENTS TAB ─────────────────────────────────────────────────────────

  const PaymentsTab = () => {
    const filterBtns = ['all', 'pending', 'approved', 'rejected'];
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Payments</h2>
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
                  ? 'bg-amber-500 text-black hover:bg-amber-600'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            {loadingPayments ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-zinc-500" />
              </div>
            ) : payments.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-16">No payments found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500">User</TableHead>
                      <TableHead className="text-zinc-500">Plan</TableHead>
                      <TableHead className="text-zinc-500">Amount</TableHead>
                      <TableHead className="text-zinc-500">Status</TableHead>
                      <TableHead className="text-zinc-500">Date</TableHead>
                      <TableHead className="text-zinc-500 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id} className="border-zinc-800">
                        <TableCell>
                          <div>
                            <p className="text-zinc-200 text-sm font-medium">{p.userName}</p>
                            <p className="text-zinc-500 text-xs">{p.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-300">{p.planName}</TableCell>
                        <TableCell className="text-amber-400 font-semibold">{formatCurrency(p.amount)}</TableCell>
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
          <h2 className="text-2xl font-bold text-white">Withdrawals</h2>
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
                  ? 'bg-amber-500 text-black hover:bg-amber-600'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            {loadingWithdrawals ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-zinc-500" />
              </div>
            ) : withdrawals.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-16">No withdrawals found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500">User</TableHead>
                      <TableHead className="text-zinc-500">Amount</TableHead>
                      <TableHead className="text-zinc-500">Status</TableHead>
                      <TableHead className="text-zinc-500">Date</TableHead>
                      <TableHead className="text-zinc-500 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((w) => (
                      <TableRow key={w.id} className="border-zinc-800">
                        <TableCell>
                          <div>
                            <p className="text-zinc-200 text-sm font-medium">{w.userName}</p>
                            <p className="text-zinc-500 text-xs">{w.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-red-400 font-semibold">{formatCurrency(w.amount)}</TableCell>
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
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
          <p className="text-zinc-500 text-sm mt-1">Send and manage notifications</p>
        </div>
        <Button
          onClick={() => { setNotifyForm({ title: '', message: '', type: 'info' }); setNotifyDialogOpen(true); }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
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
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-16 text-center">
            <Bell className="size-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No notifications sent yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-white font-medium text-sm">{n.title}</h3>
                      <NotificationBadge type={n.type} />
                    </div>
                    <p className="text-zinc-400 text-sm line-clamp-2">{n.message}</p>
                    <p className="text-zinc-600 text-xs mt-2">{formatDate(n.createdAt)}</p>
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

  // ─── USERS TAB ────────────────────────────────────────────────────────────

  const filteredUsers = users.filter(
    (u) =>
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const UsersTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Users</h2>
          <p className="text-zinc-500 text-sm mt-1">{users.length} registered users</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input
            placeholder="Search by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white pl-9 placeholder:text-zinc-600"
          />
        </div>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-zinc-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-16">{userSearch ? 'No users match your search' : 'No users yet'}</p>
          ) : (
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-zinc-900 z-10">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-500">Name</TableHead>
                    <TableHead className="text-zinc-500">Email</TableHead>
                    <TableHead className="text-zinc-500">Phone</TableHead>
                    <TableHead className="text-zinc-500">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className="border-zinc-800">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white text-sm font-medium">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">{u.email}</TableCell>
                      <TableCell className="text-zinc-400 text-sm">{u.phone || '—'}</TableCell>
                      <TableCell className="text-zinc-500 text-xs">{formatDateShort(u.createdAt)}</TableCell>
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

  // ─── SITE CONTENT TAB ─────────────────────────────────────────────────────

  const ContentTab = () => {
    const currentSection = CONTENT_SECTIONS[contentPage];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Site Content</h2>
          <p className="text-zinc-500 text-sm mt-1">Edit all pages & content from here</p>
        </div>

        {/* Page Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CONTENT_SECTIONS.map((section, idx) => (
            <button
              key={section.title}
              onClick={() => setContentPage(idx)}
              className={`shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                contentPage === idx
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Current Section Header */}
        <Card className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold">{currentSection.title}</h3>
            <p className="text-zinc-400 text-xs mt-0.5">{currentSection.description}</p>
            <p className="text-zinc-600 text-[10px] mt-1">Leave fields empty to use default content</p>
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
              <Card key={item.key} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <Label className="text-zinc-300 text-sm font-medium">{item.label}</Label>
                    {item.type === 'textarea' ? (
                      <Textarea
                        value={siteContent[item.key] || ''}
                        onChange={(e) => setSiteContent((prev) => ({ ...prev, [item.key]: e.target.value }))}
                        placeholder={item.placeholder}
                        rows={6}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 resize-y min-h-[100px]"
                      />
                    ) : (
                      <Input
                        value={siteContent[item.key] || ''}
                        onChange={(e) => setSiteContent((prev) => ({ ...prev, [item.key]: e.target.value }))}
                        placeholder={item.placeholder}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
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
  };

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
      case 'plans': return <PlansTab />;
      case 'payments': return <PaymentsTab />;
      case 'withdrawals': return <WithdrawalsTab />;
      case 'notifications': return <NotificationsTab />;
      case 'users': return <UsersTab />;
      case 'content': return <ContentTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 min-h-screen sticky top-0">
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
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-zinc-800">
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
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-zinc-500 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
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
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {renderTab()}
        </div>
      </main>

      {/* Global Approve/Reject Dialog */}
      <ApproveRejectDialog />
    </div>
  );
}
