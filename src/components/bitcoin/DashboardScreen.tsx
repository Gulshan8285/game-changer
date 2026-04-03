'use client';

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Bitcoin, TrendingUp, TrendingDown, BarChart3, Wallet, ArrowUpRight, ArrowDownRight, ArrowLeft, RefreshCw, User, Bell, History, Shield, Zap, IndianRupee, Calendar, CircleDollarSign, CheckCircle2, Sun, Moon, X, Timer, Clock, PauseCircle, PlayCircle } from 'lucide-react';
import { useTheme } from 'next-themes';

// ── Lightweight Sparkline for crypto coin rows (no rAF — CSS transition handles smoothness) ──
const AnimatedSparkline = memo(function AnimatedSparkline({ data, color }: { data: number[]; color: string }) {
  const [prices, setPrices] = useState(data);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) => {
        const last = prev[prev.length - 1];
        const noise = (Math.random() - 0.5) * (Math.abs(last) * 0.004);
        return [...prev.slice(1), last + noise];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [data]);

  if (!prices || prices.length === 0) return null;

  let min = prices[0], max = prices[0];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] < min) min = prices[i];
    if (prices[i] > max) max = prices[i];
  }
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const pad = 2;
  const len = prices.length;

  const points = prices.map((p, i) => {
    const x = pad + (i / (len - 1)) * (w - 2 * pad);
    const y = h - pad - ((p - min) / range) * (h - 2 * pad);
    return `${x},${y}`;
  });

  const lastX = pad + (w - 2 * pad);
  const areaPath = `M${points.join(' L')} L${lastX},${h - pad} L${pad},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={`M${points.join(' L')}`} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

// ── Generate sparkline data for coins ──
function generateSparkData(base: number, volatility: number, trend: number) {
  const pts: number[] = [];
  let p = base;
  for (let i = 0; i < 20; i++) {
    p += (Math.random() - 0.5 + trend * 0.1) * volatility;
    pts.push(p);
  }
  return pts;
}

// ── 10 Crypto coins data (Bitcoin excluded — shown in main card above) ──
const CRYPTO_COINS = [
  { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', bgColor: '#627eea', price: 241500, change24h: 2.35 },
  { name: 'BNB', symbol: 'BNB', icon: 'B', bgColor: '#f3ba2f', price: 58200, change24h: 1.12 },
  { name: 'Solana', symbol: 'SOL', icon: 'S', bgColor: '#9945ff', price: 14200, change24h: -1.85 },
  { name: 'XRP', symbol: 'XRP', icon: 'X', bgColor: '#00aae4', price: 48.5, change24h: 0.92 },
  { name: 'Cardano', symbol: 'ADA', icon: 'A', bgColor: '#0033ad', price: 52.3, change24h: -2.14 },
  { name: 'Dogecoin', symbol: 'DOGE', icon: 'Ð', bgColor: '#c2a633', price: 16.8, change24h: 3.45 },
  { name: 'Polkadot', symbol: 'DOT', icon: '●', bgColor: '#e6007a', price: 580, change24h: -0.47 },
  { name: 'Polygon', symbol: 'MATIC', icon: 'M', bgColor: '#8247e5', price: 42.6, change24h: 1.78 },
  { name: 'Avalanche', symbol: 'AVAX', icon: '▲', bgColor: '#e84142', price: 2650, change24h: -1.23 },
  { name: 'Shiba Inu', symbol: 'SHIB', icon: 'S', bgColor: '#ffa409', price: 0.00142, change24h: 4.67 },
].map((c) => ({
  ...c,
  sparkData: generateSparkData(100, 5, c.change24h > 0 ? 0.3 : -0.3),
  priceDisplay: c.price >= 1
    ? '₹' + c.price.toLocaleString('en-IN', { maximumFractionDigits: c.price >= 1000 ? 0 : 2 })
    : '₹' + c.price.toFixed(6),
}));

// ── Live Line Chart with auto-scrolling animation ──
const LiveChart = memo(function LiveChart({ basePrice, changePercent }: { basePrice: number; changePercent: number }) {
  // Build 60 data points: start from price adjusted by -changePercent, end at basePrice
  const [prices, setPrices] = useState<number[]>(() => {
    const pts: number[] = [];
    // Calculate start price: if change is -2%, start was ~2% higher than current
    const startPrice = basePrice / (1 + changePercent / 100);
    const totalPoints = 60;
    for (let i = 0; i < totalPoints - 1; i++) {
      // Interpolate with noise for realistic look
      const progress = i / (totalPoints - 1);
      const base = startPrice + (basePrice - startPrice) * progress;
      const noise = (Math.random() - 0.5) * basePrice * 0.0015;
      pts.push(base + noise);
    }
    // Last point is exactly the current price
    pts.push(basePrice);
    return pts;
  });
  const prevPricesRef = useRef(prices);
  const [displayPrices, setDisplayPrices] = useState(prices);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) => {
        prevPricesRef.current = prev;
        const noise = (Math.random() - 0.5) * basePrice * 0.0003;
        return [...prev.slice(1), basePrice + noise];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [basePrice]);

  // Smooth interpolation between old and new prices
  useEffect(() => {
    const prev = prevPricesRef.current;
    if (prev.length !== prices.length) return;

    let start: number | null = null;
    const duration = 400;
    const anim = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const interp = prev.map((p, i) => p + (prices[i] - p) * eased);
      setDisplayPrices(interp);
      if (progress < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, [prices]);

  if (!displayPrices || displayPrices.length === 0) return null;

  const min = Math.min(...displayPrices);
  const max = Math.max(...displayPrices);
  const range = max - min || 1;
  const width = 400;
  const height = 160;
  const padding = 10;

  const points = displayPrices.map((p, i) => {
    const x = padding + (i / (displayPrices.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((p - min) / range) * (height - 2 * padding);
    return { x, y };
  });

  const lastPoint = points[points.length - 1];
  const isPositive = displayPrices[displayPrices.length - 1] >= displayPrices[0];
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${width - padding},${height - padding} L${padding},${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 sm:h-48">
      <defs>
        <linearGradient id="liveChartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isPositive ? '#f59e0b' : '#ef4444'} stopOpacity="0.35" />
          <stop offset="100%" stopColor={isPositive ? '#f59e0b' : '#ef4444'} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="liveDotGlow">
          <stop offset="0%" stopColor={isPositive ? '#f59e0b' : '#ef4444'} stopOpacity="0.6" />
          <stop offset="100%" stopColor={isPositive ? '#f59e0b' : '#ef4444'} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Area fill */}
      <path d={areaPath} fill="url(#liveChartGradient)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={isPositive ? '#f59e0b' : '#ef4444'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Glow dot at the end (current price) */}
      <circle cx={lastPoint.x} cy={lastPoint.y} r="12" fill="url(#liveDotGlow)" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill={isPositive ? '#f59e0b' : '#ef4444'} stroke="#0a0a0a" strokeWidth="2" className="dark:stroke-[#0a0a0a] stroke-white" />
      {/* Price label at the end — matches the displayed price above */}
      <text x={lastPoint.x} y={lastPoint.y - 14} textAnchor="end" fill={isPositive ? '#f59e0b' : '#ef4444'} fontSize="9" fontWeight="bold">
        {'₹' + basePrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </text>
    </svg>
  );
});

// ── Live Candlestick Chart with auto-animation ──
const LiveCandlestickChart = memo(function LiveCandlestickChart({ basePrice, changePercent }: { basePrice: number; changePercent: number }) {
  const isUp = changePercent >= 0;
  const [candles, setCandles] = useState(() => {
    const c: { open: number; close: number; high: number; low: number }[] = [];
    // Start price derived from changePercent so chart matches the % shown
    const startPrice = basePrice / (1 + changePercent / 100);
    const totalPoints = 48;
    let p = startPrice;
    for (let i = 0; i < totalPoints - 1; i++) {
      const progress = i / (totalPoints - 1);
      const targetClose = startPrice + (basePrice - startPrice) * (progress + 1 / totalPoints);
      const change = (targetClose - p) + (Math.random() - 0.5) * basePrice * 0.001;
      const open = p;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * basePrice * 0.0008;
      const low = Math.min(open, close) - Math.random() * basePrice * 0.0008;
      c.push({ open, close, high, low });
      p = close;
    }
    // Last candle closes at current price
    const lastOpen = p;
    const high = Math.max(lastOpen, basePrice) + Math.random() * basePrice * 0.0005;
    const low = Math.min(lastOpen, basePrice) - Math.random() * basePrice * 0.0005;
    c.push({ open: lastOpen, close: basePrice, high, low });
    return c;
  });
  const [prevCandles, setPrevCandles] = useState(candles);
  const [displayCandles, setDisplayCandles] = useState(candles);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevCandles(candles);
      setCandles((prev) => {
        const lastClose = prev[prev.length - 1].close;
        const open = lastClose;
        const bias = isUp ? 0.52 : 0.48;
        const change = (Math.random() - bias) * basePrice * 0.002;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * basePrice * 0.0008;
        const low = Math.min(open, close) - Math.random() * basePrice * 0.0008;
        return [...prev.slice(1), { open, close, high, low }];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [basePrice, changePercent, isUp]);

  // Animate transition
  useEffect(() => {
    let start: number | null = null;
    const duration = 400;
    const anim = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const interp = prevCandles.map((pc, i) => {
        const nc = candles[i];
        return {
          open: pc.open + (nc.open - pc.open) * eased,
          close: pc.close + (nc.close - pc.close) * eased,
          high: pc.high + (nc.high - pc.high) * eased,
          low: pc.low + (nc.low - pc.low) * eased,
        };
      });
      setDisplayCandles(interp);
      if (progress < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, [candles, prevCandles]);

  if (!displayCandles || displayCandles.length === 0) return null;

  const allPrices = displayCandles.flatMap((d) => [d.high, d.low]);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const range = max - min || 1;
  const width = 400;
  const height = 200;
  const candleWidth = Math.max(2, (width - 20) / displayCandles.length - 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 sm:h-56">
      {displayCandles.map((d, i) => {
        const x = 10 + (i / displayCandles.length) * (width - 20);
        const highY = height - 10 - ((d.high - min) / range) * (height - 20);
        const lowY = height - 10 - ((d.low - min) / range) * (height - 20);
        const openY = height - 10 - ((d.open - min) / range) * (height - 20);
        const closeY = height - 10 - ((d.close - min) / range) * (height - 20);
        const isGreen = d.close >= d.open;
        const isLast = i === displayCandles.length - 1;

        return (
          <g key={i} opacity={isLast ? 1 : 0.85}>
            <line x1={x} y1={highY} x2={x} y2={lowY} stroke={isGreen ? '#22c55e' : '#ef4444'} strokeWidth="1" />
            <rect
              x={x - candleWidth / 2}
              y={Math.min(openY, closeY)}
              width={candleWidth}
              height={Math.max(1, Math.abs(closeY - openY))}
              fill={isGreen ? '#22c55e' : '#ef4444'}
              rx="0.5"
            />
            {/* Pulse glow on last candle */}
            {isLast && (
              <rect
                x={x - candleWidth / 2 - 2}
                y={Math.min(openY, closeY) - 2}
                width={candleWidth + 4}
                height={Math.max(3, Math.abs(closeY - openY)) + 4}
                fill="none"
                stroke={isGreen ? '#22c55e' : '#ef4444'}
                strokeWidth="1"
                opacity="0.4"
                rx="1"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
});

// ── Animated Number Component ──
const AnimatedNumber = memo(function AnimatedNumber({ value, decimals = 2, prefix = '', suffix = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const targetRef = useRef(value);
  const currentRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    targetRef.current = value;
    const start = currentRef.current;
    const diff = value - start;
    if (Math.abs(diff) < 0.01) return;

    let startTime: number | null = null;
    const duration = 600;

    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      currentRef.current = current;
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  const formatted = display.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <>{prefix}{formatted}{suffix}</>;
});

// ── Helper: format ms remaining into HH:MM:SS ──
function formatCountdown(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Module-level formatINR (pure function, no re-creation per render) ──
const formatINR = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

// Default fallback plans (module-level constant to avoid re-creation on every render)
const DEFAULT_PLANS = [
  { name: 'Basic', investment: 5000, daily: 300, monthly: 9000, total: 14000, color: 'bg-emerald-500', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', btnBg: 'bg-emerald-500 hover:bg-emerald-600' },
  { name: 'Standard', investment: 8000, daily: 700, monthly: 21000, total: 29000, color: 'bg-gradient-to-r from-amber-500 to-orange-500', iconBg: 'bg-amber-500/20', iconColor: 'text-amber-400', btnBg: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' },
  { name: 'Premium', investment: 10000, daily: 1500, monthly: 45000, total: 55000, color: 'bg-purple-500', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', btnBg: 'bg-purple-500 hover:bg-purple-600' },
];

export default function DashboardScreen() {
  // ── Store & Theme at TOP (fixes stale closure bug) ──
  const { bitcoinPrice, bitcoinHistory, setBitcoinData, setScreen, user, logout, dashboardView, setDashboardView } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [investing, setInvesting] = useState(false);
  const [investSuccess, setInvestSuccess] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showAllCoins, setShowAllCoins] = useState(false);
  const [showInvestPlans, setShowInvestPlans] = useState(false);
  // Cancel plan confirmation dialog
  const [cancelPlanId, setCancelPlanId] = useState<number | null>(null);
  const [cancellingPlan, setCancellingPlan] = useState(false);
  // UPI payment states
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'opened' | 'waiting' | 'verifying' | 'uploading' | 'reviewing' | 'completed' | 'failed' | 'cancelled'>('idle');
  // Track consumed approved proof IDs to avoid re-adding plans
  const [consumedProofs, setConsumedProofs] = useState<Set<string>>(new Set());
  // Payment proof upload states
  const [proofPhone, setProofPhone] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [upiId, setUpiId] = useState('gulshanyadav62000-6@okicici');
  const [upiName, setUpiName] = useState('Gulshan Yadav');
  // showWallet/showHistory removed — now using store's dashboardView
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawnTotal, setWithdrawnTotal] = useState(0);
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState('all');

  // ── User's active investments (stored in localStorage) ──
  const [investments, setInvestments] = useState<any[]>([]);
  const [countdowns, setCountdowns] = useState<Record<number, string>>({});
  const [timerPaused, setTimerPaused] = useState(false);
  const [investmentsReady, setInvestmentsReady] = useState(false);
  const pausedAtRef = useRef<number | null>(null);
  const timerPausedRef = useRef(timerPaused);
  timerPausedRef.current = timerPaused;
  const investmentsRef = useRef(investments);
  investmentsRef.current = investments;
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;

  const saveInvestments = (items: any[]) => {
    setInvestments(items);
    localStorage.setItem('btc-wallet-investments', JSON.stringify(items));
  };

  // Load all data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('btc-wallet-investments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setInvestments(parsed);
      } catch { /* ignore */ }
    }
    const savedTx = localStorage.getItem('btc-transactions');
    if (savedTx) {
      try { setTransactions(JSON.parse(savedTx)); } catch { /* ignore */ }
    }
    const savedNotifs = localStorage.getItem('btc-notifications');
    if (savedNotifs) {
      try { setNotifications(JSON.parse(savedNotifs)); } catch { /* ignore */ }
    }
    const savedWithdrawn = localStorage.getItem('btc-wallet-withdrawn');
    if (savedWithdrawn) {
      try { setWithdrawnTotal(JSON.parse(savedWithdrawn)); } catch { /* ignore */ }
    }
    const savedTimerPaused = localStorage.getItem('btc-timer-paused');
    if (savedTimerPaused === 'true') {
      setTimerPaused(true);
    }
    setInvestmentsReady(true);
  }, []);

  // ── 24-hour auto-earning system with countdown timer ──
  // Step 1: On mount + when investments change, credit missed earnings & set initial countdowns
  useEffect(() => {
    if (!investmentsReady) return;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    const invsCopy = investments.map(inv => ({ ...inv }));
    let needSave = false;
    for (let i = 0; i < invsCopy.length; i++) {
      const inv = invsCopy[i];
      if (!inv.createdAt || !inv.lastEarningAt) {
        needSave = true;
        const now = new Date().toISOString();
        invsCopy[i] = { ...inv, createdAt: now, lastEarningAt: now };
        continue;
      }
      const elapsed = Date.now() - new Date(inv.lastEarningAt).getTime();
      if (elapsed >= TWENTY_FOUR_HOURS) {
        const cycles = Math.floor(elapsed / TWENTY_FOUR_HOURS);
        needSave = true;
        invsCopy[i].earned = (inv.earned || 0) + cycles * inv.daily;
        invsCopy[i].lastEarningAt = new Date(
          new Date(inv.lastEarningAt).getTime() + cycles * TWENTY_FOUR_HOURS
        ).toISOString();
        for (let c = 1; c <= cycles; c++) {
          const cycleDate = new Date(new Date(inv.lastEarningAt).getTime() + c * TWENTY_FOUR_HOURS);
          const tx = { id: Date.now() + Math.random() + c, type: 'earning', planName: inv.planName, amount: inv.daily, date: cycleDate.toLocaleString('en-IN'), desc: `${inv.planName} Plan - Daily Profit` };
          setTransactions(prev => { const newTxs = [tx, ...prev]; localStorage.setItem('btc-transactions', JSON.stringify(newTxs)); return newTxs; });
        }
      }
    }
    if (needSave) saveInvestments(invsCopy);

    // Calculate initial countdowns RIGHT AWAY for ALL current investments
    const cds: Record<number, string> = {};
    for (const inv of (needSave ? invsCopy : investments)) {
      if (!inv.lastEarningAt) continue;
      const elapsed = Date.now() - new Date(inv.lastEarningAt).getTime();
      const remaining = TWENTY_FOUR_HOURS - elapsed;
      cds[inv.id] = formatCountdown(remaining);
    }
    setCountdowns(cds);
  }, [investments, investmentsReady]);

  // Step 2: 1-second interval — ALWAYS runs when investmentsReady, skips when paused
  useEffect(() => {
    if (!investmentsReady) return;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    const interval = setInterval(() => {
      // Use ref to get current timerPaused value (closure fix)
      if (timerPausedRef.current) return;

      const invs = investmentsRef.current;
      if (invs.length === 0) return;

      const newCountdowns: Record<number, string> = {};
      let anyCredited = false;
      let creditedTotal = 0;
      const updatedInvs = [...invs];

      for (let i = 0; i < updatedInvs.length; i++) {
        const inv = updatedInvs[i];
        if (!inv.lastEarningAt) continue;

        const elapsed = Date.now() - new Date(inv.lastEarningAt).getTime();
        const remaining = TWENTY_FOUR_HOURS - elapsed;

        if (remaining <= 0) {
          anyCredited = true;
          creditedTotal += inv.daily;
          updatedInvs[i] = { ...inv, earned: inv.earned + inv.daily, lastEarningAt: new Date().toISOString() };
          newCountdowns[inv.id] = '24:00:00';
          const tx = { id: Date.now() + Math.random(), type: 'earning', planName: inv.planName, amount: inv.daily, date: new Date().toLocaleString('en-IN'), desc: `${inv.planName} Plan - Daily Profit` };
          setTransactions(prev => { const newTxs = [tx, ...prev]; localStorage.setItem('btc-transactions', JSON.stringify(newTxs)); return newTxs; });
        } else {
          newCountdowns[inv.id] = formatCountdown(remaining);
        }
      }

      setCountdowns(newCountdowns);

      if (anyCredited) {
        saveInvestments(updatedInvs);
        const notif = { id: Date.now(), icon: 'CheckCircle2', title: 'Daily Profit Credited', desc: `₹${creditedTotal.toLocaleString('en-IN')} daily profit added to wallet`, time: 'Just now', dot: 'bg-emerald-500', read: false };
        setNotifications(prev => { const n = [notif, ...prev]; localStorage.setItem('btc-notifications', JSON.stringify(n)); return n; });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [investmentsReady]);

  // Persist timer pause state to localStorage
  useEffect(() => {
    localStorage.setItem('btc-timer-paused', String(timerPaused));
  }, [timerPaused]);

  // ── Check for admin-approved payment proofs every 30 seconds ──
  // When admin approves, auto-add the plan to user's account
  useEffect(() => {
    if (!user?.id || !investmentsReady) return;

    const checkApprovedProofs = async () => {
      try {
        const res = await fetch(`/api/payment-proof?userId=${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.proofs?.length) return;

        for (const proof of data.proofs) {
          // Skip already consumed proofs
          if (consumedProofs.has(proof.id)) continue;

          // Parse plan data from the proof
          let planData: any = {};
          try {
            planData = JSON.parse(proof.planData);
          } catch { continue; }

          // Add the plan to user's investments
          const newInvestment = {
            id: Date.now() + Math.random(),
            planName: planData.name || proof.planName,
            investment: planData.investment || proof.amount,
            daily: planData.daily || 0,
            monthly: planData.monthly || 0,
            totalReturn: planData.totalReturn || 0,
            date: new Date().toLocaleDateString('en-IN'),
            earned: 0,
            color: planData.color || 'bg-emerald-500',
            iconColor: planData.iconColor || 'text-emerald-400',
            iconBg: planData.iconBg || 'bg-emerald-500/20',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastEarningAt: new Date().toISOString(),
          };
          saveInvestments([...investmentsRef.current, newInvestment]);

          // Record transaction
          const tx = { id: Date.now() + Math.random(), type: 'invest', planName: newInvestment.planName, amount: newInvestment.investment, date: new Date().toLocaleString('en-IN'), desc: `${newInvestment.planName} Plan - Approved by Admin` };
          const newTxs = [tx, ...transactionsRef.current];
          setTransactions(newTxs);
          localStorage.setItem('btc-transactions', JSON.stringify(newTxs));

          // Add notification
          const notif = { id: Date.now() + 1, icon: 'CheckCircle2', title: '🎉 Plan Approved & Activated!', desc: `${newInvestment.planName} Plan (₹${newInvestment.investment.toLocaleString('en-IN')}) has been approved by admin`, time: 'Just now', dot: 'bg-emerald-500', read: false };
          setNotifications(prev => { const n = [notif, ...prev]; localStorage.setItem('btc-notifications', JSON.stringify(n)); return n; });

          // Mark as consumed
          setConsumedProofs(prev => new Set([...prev, proof.id]));
          console.log(`[APPROVED] Plan added for proof ${proof.id}: ${newInvestment.planName}`);
        }
      } catch { /* silent */ }
    };

    // Check immediately on mount
    checkApprovedProofs();

    // Then check every 30 seconds
    const interval = setInterval(checkApprovedProofs, 30000);
    return () => clearInterval(interval);
  }, [user?.id, investmentsReady, consumedProofs]);

  // Handle pause/resume with proper time adjustment
  const toggleTimerPause = useCallback(() => {
    if (timerPaused) {
      // Resuming: adjust lastEarningAt forward by the pause duration
      // so no retroactive earnings are credited
      if (pausedAtRef.current) {
        const pauseDuration = Date.now() - pausedAtRef.current;
        const invs = investmentsRef.current;
        const updated = invs.map(inv => ({
          ...inv,
          lastEarningAt: new Date(new Date(inv.lastEarningAt).getTime() + pauseDuration).toISOString()
        }));
        saveInvestments(updated);
        pausedAtRef.current = null;
      }
      setTimerPaused(false);
    } else {
      // Pausing: record when we paused
      pausedAtRef.current = Date.now();
      setTimerPaused(true);
    }
  }, [timerPaused]);

  // ── Live simulated price fluctuation ──
  const [livePrice, setLivePrice] = useState<{ inr: number; usd: number; change24h: number } | null>(null);
  const [liveStats, setLiveStats] = useState<{ marketCap: number; volume24h: number } | null>(null);

  // ── Live coin prices for the crypto list ──
  const [liveCoinPrices, setLiveCoinPrices] = useState<Record<string, { price: number; change: number }>>({});
  useEffect(() => {
    // Seed from base prices
    const initial: Record<string, { price: number; change: number }> = {};
    CRYPTO_COINS.forEach((c) => { initial[c.symbol] = { price: c.price, change: c.change24h }; });
    setLiveCoinPrices(initial);

    const ticker = setInterval(() => {
      setLiveCoinPrices((prev) => {
        const next: Record<string, { price: number; change: number }> = {};
        for (const c of CRYPTO_COINS) {
          const curr = prev[c.symbol] || { price: c.price, change: c.change24h };
          const delta = (Math.random() - 0.48) * curr.price * 0.002;
          const newPrice = Math.max(curr.price * 0.97, curr.price + delta);
          const changeDelta = (Math.random() - 0.5) * 0.08;
          const newChange = Math.max(-8, Math.min(8, curr.change + changeDelta));
          next[c.symbol] = { price: newPrice, change: newChange };
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(ticker);
  }, []);

  // ── Investment Plans (from API or fallback) ──
  const [apiPlans, setApiPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});

  // Fetch plans + content in parallel (single useEffect, no duplicate API calls)
  useEffect(() => {
    const fetchData = async () => {
      setLoadingPlans(true);
      try {
        const [plansRes, contentRes] = await Promise.all([
          fetch('/api/plans').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/content').then(r => r.ok ? r.json() : null).catch(() => null),
        ]);
        if (plansRes?.success && plansRes.plans?.length > 0) setApiPlans(plansRes.plans);
        if (contentRes?.success && contentRes.content) {
          setSiteContent(contentRes.content);
          if (contentRes.content.upi_id) setUpiId(contentRes.content.upi_id);
          if (contentRes.content.upi_name) setUpiName(contentRes.content.upi_name);
        }
      } catch { /* use fallbacks */ }
      finally { setLoadingPlans(false); }
    };
    fetchData();
  }, []);

  // Map API plans to component format, falling back to defaults
  const plans = useMemo(() => {
    if (apiPlans.length > 0) {
      return apiPlans.map((p: any) => ({
        ...p,
        investment: p.price,
        total: p.totalReturn,
        btnBg: p.color?.includes('gradient') ? p.color + ' hover:opacity-90' : p.color + ' hover:' + p.color?.replace('-500', '-600'),
      }));
    }
    return DEFAULT_PLANS;
  }, [apiPlans]);

  // ── Helper: complete investment (create record + tx + notif) ──
  const completeInvestment = useCallback((planData: any) => {
    const newInvestment = {
      id: Date.now(),
      planName: planData.name,
      investment: planData.investment,
      daily: planData.daily,
      monthly: planData.monthly,
      totalReturn: planData.total,
      date: new Date().toLocaleDateString('en-IN'),
      earned: 0,
      color: planData.color,
      iconColor: planData.iconColor,
      iconBg: planData.iconBg,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastEarningAt: new Date().toISOString(),
    };
    saveInvestments([...investmentsRef.current, newInvestment]);
    // Record transaction (use ref to avoid stale state)
    const tx = { id: Date.now() + 1, type: 'invest', planName: planData.name, amount: planData.investment, date: new Date().toLocaleString('en-IN'), desc: `${planData.name} Plan investment` };
    const newTxs = [tx, ...transactionsRef.current];
    setTransactions(newTxs);
    localStorage.setItem('btc-transactions', JSON.stringify(newTxs));
    // Add notification
    const notif = { id: Date.now() + 2, icon: 'Zap', title: 'Investment Confirmed', desc: `₹${planData.investment.toLocaleString('en-IN')} invested in ${planData.name} Plan`, time: 'Just now', dot: 'bg-amber-500', read: false };
    setNotifications(prev => { const n = [notif, ...prev]; localStorage.setItem('btc-notifications', JSON.stringify(n)); return n; });
    // Track to Google Sheet
    fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'invest', userId: user?.id, userName: user?.name, userEmail: user?.email, userPhone: user?.phone, planName: planData.name, amount: planData.investment, method: 'upi' }) }).catch(() => {});
  }, [investmentsRef, transactionsRef, user]);

  // ── Cancel entire plan ──
  const handleCancelPlan = useCallback((planId: number) => {
    const inv = investmentsRef.current.find((i: any) => i.id === planId);
    if (!inv) return;

    setCancellingPlan(true);

    setTimeout(() => {
      // Remove investment
      const updatedInvestments = investmentsRef.current.filter((i: any) => i.id !== planId);
      saveInvestments(updatedInvestments);

      // Record cancellation transaction (use ref)
      const tx = { id: Date.now() + 3, type: 'cancel', planName: inv.planName, amount: inv.investment, date: new Date().toLocaleString('en-IN'), desc: `${inv.planName} Plan - Cancelled` };
      const newTxs = [tx, ...transactionsRef.current];
      setTransactions(newTxs);
      localStorage.setItem('btc-transactions', JSON.stringify(newTxs));

      // Add notification
      const notif = { id: Date.now() + 4, icon: 'X', title: 'Plan Cancelled', desc: `${inv.planName} Plan (₹${inv.investment.toLocaleString('en-IN')}) has been cancelled. Earned: ₹${inv.earned.toLocaleString('en-IN')}`, time: 'Just now', dot: 'bg-red-500', read: false };
      setNotifications(prev => { const n = [notif, ...prev]; localStorage.setItem('btc-notifications', JSON.stringify(n)); return n; });

      // Track to Google Sheet
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel', userId: user?.id, userName: user?.name, userEmail: user?.email, userPhone: user?.phone, planName: inv.planName, amount: inv.investment }) }).catch(() => {});

      setCancellingPlan(false);
      setCancelPlanId(null);
    }, 800);
  }, [investmentsRef, transactionsRef, user]);

  const handleInvest = async () => {
    if (!selectedPlan || investing) return;

    setInvesting(true);
    const planData = { ...selectedPlan };
    (window as any).__pendingPlan = planData;

    setPaymentStatus('opened');
    setInvesting(false);

    // ── Always use UPI deep link for all plans ──
    const amount = planData.investment.toFixed(2);
    const txnRef = `BTC${Date.now()}`;
    const upiParams = new URLSearchParams({
      pa: upiId,
      pn: upiName || 'BitPay Wallet',
      am: amount,
      cu: 'INR',
      tn: `${planData.name} Plan - ₹${planData.investment}`,
      tr: txnRef,
      mode: '00',
    });
    try {
      window.location.href = `upi://pay?${upiParams.toString()}`;
    } catch { /* silent */ }

    setPaymentStatus('waiting');

    // Detect user returning from payment page
    let returned = false;
    const handleReturn = () => {
      if (returned) return;
      returned = true;
      cleanup();
      // Ask user to confirm payment (instead of auto-completing)
      setPaymentStatus('verifying');
    };

    document.addEventListener('visibilitychange', handleReturn);
    window.addEventListener('focus', handleReturn);

    const timeout = setTimeout(() => {
      if (!returned) {
        cleanup();
        setPaymentStatus('cancelled');
        delete (window as any).__pendingPlan;
        setTimeout(() => { setPaymentStatus('idle'); setSelectedPlan(null); }, 1500);
      }
    }, 5 * 60 * 1000);

    const cleanup = () => {
      document.removeEventListener('visibilitychange', handleReturn);
      window.removeEventListener('focus', handleReturn);
      clearTimeout(timeout);
    };
    (window as any).__upiCleanup = cleanup;
  };

  // ── Confirm payment → show upload form (don't auto-complete) ──
  const confirmPaymentSuccess = () => {
    setPaymentStatus('uploading');
  };

  // ── Submit payment proof (UTR + screenshot) and auto-send to WhatsApp ──
  const submitPaymentProof = async () => {
    if (!proofFile || utrNumber.trim().length < 4) return;
    setUploadingProof(true);
    try {
      const pendingPlan = (window as any).__pendingPlan;
      const formData = new FormData();
      formData.append('userId', user?.id || '');
      formData.append('phone', user?.phone || proofPhone || '');
      formData.append('utr', utrNumber.trim());
      formData.append('planName', pendingPlan?.name || '');
      formData.append('amount', String(pendingPlan?.investment || 0));
      formData.append('planDaily', String(pendingPlan?.daily || 0));
      formData.append('planMonthly', String(pendingPlan?.monthly || 0));
      formData.append('planTotalReturn', String(pendingPlan?.total || 0));
      formData.append('planColor', pendingPlan?.color || 'bg-emerald-500');
      formData.append('planIconBg', pendingPlan?.iconBg || 'bg-emerald-500/20');
      formData.append('planIconColor', pendingPlan?.iconColor || 'text-emerald-400');
      formData.append('userName', user?.name || '');
      formData.append('userEmail', user?.email || '');
      formData.append('screenshot', proofFile);

      const res = await fetch('/api/payment-proof', { method: 'POST', body: formData });
      if (res.ok) {
        // ── Auto-send screenshot + info to WhatsApp 8810381949 ──
        const waText = `🆕 *Payment Proof Submitted*\n\n👤 Name: ${user?.name || 'N/A'}\n📱 Phone: ${user?.phone || proofPhone || 'N/A'}\n📧 Email: ${user?.email || 'N/A'}\n📋 Plan: ${pendingPlan?.name || 'N/A'}\n💰 Amount: ₹${(pendingPlan?.investment || 0).toLocaleString('en-IN')}\n🔑 UTR: ${utrNumber.trim()}\n⏰ Time: ${new Date().toLocaleString('en-IN')}`;

        // Try Web Share API first (works on mobile — can attach file to WhatsApp)
        if (navigator.share && proofFile) {
          try {
            await navigator.share({
              title: 'Payment Proof',
              text: waText,
              files: [new File([proofFile], 'payment_screenshot.jpg', { type: proofFile.type })],
            });
          } catch (shareErr: any) {
            // If user cancelled or share failed, open wa.me link as fallback
            if (shareErr?.name !== 'AbortError') {
              window.open(`https://wa.me/918810381949?text=${encodeURIComponent(waText)}`, '_blank');
            }
          }
        } else {
          // Desktop fallback — open WhatsApp with pre-filled text
          window.open(`https://wa.me/918810381949?text=${encodeURIComponent(waText)}`, '_blank');
        }

        setPaymentStatus('reviewing');
        setProofPhone('');
        setUtrNumber('');
        setProofFile(null);
        setProofPreview(null);
      }
    } catch {
      alert('Upload failed. Please try again.');
    }
    setUploadingProof(false);
  };

  // ── Handle screenshot file selection ──
  const handleProofFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Decline payment (user clicks "No, Payment Failed") ──
  const confirmPaymentFailed = () => {
    delete (window as any).__pendingPlan;
    setPaymentStatus('failed');
    setTimeout(() => {
      setPaymentStatus('idle');
      setSelectedPlan(null);
    }, 2000);
  };
  // useAppStore() moved to top of component to fix stale closure bug

  // When user goes to profile from bottom nav and comes back, view stays as is
  // This is the desired behavior - they return to where they were

  const fetchBitcoinData = useCallback(async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    try {
      const res = await fetch('/api/bitcoin/price');
      if (res.ok) {
        const data = await res.json();
        setBitcoinData(data.price, data.historical);
        // Seed the live simulation
        if (!livePrice) {
          setLivePrice({ inr: data.price.inr, usd: data.price.usd, change24h: data.price.change24h });
          setLiveStats({ marketCap: data.price.marketCap, volume24h: data.price.volume24h });
        }
      }
    } catch {
      // Use cached data
    } finally {
      if (showLoader) setRefreshing(false);
    }
  }, [setBitcoinData, livePrice]);

  useEffect(() => {
    fetchBitcoinData();
    const interval = setInterval(() => fetchBitcoinData(), 60000);
    return () => clearInterval(interval);
  }, [fetchBitcoinData]);

  // ── Live price ticker: fluctuate every 2 seconds ──
  useEffect(() => {
    if (!bitcoinPrice) return;
    // Seed on first load
    if (!livePrice) {
      setLivePrice({ inr: bitcoinPrice.inr, usd: bitcoinPrice.usd, change24h: bitcoinPrice.change24h });
      setLiveStats({ marketCap: bitcoinPrice.marketCap, volume24h: bitcoinPrice.volume24h });
    }

    const ticker = setInterval(() => {
      setLivePrice((prev) => {
        if (!prev) return prev;
        // Simulate small random fluctuation on INR price
        const inrDelta = (Math.random() - 0.48) * bitcoinPrice.inr * 0.0008;
        const newInr = prev.inr + inrDelta;
        // Derive USD from INR ratio
        const ratio = bitcoinPrice.usd / bitcoinPrice.inr;
        const newUsd = newInr * ratio;
        // Fluctuate change24h slightly
        const changeDelta = (Math.random() - 0.5) * 0.06;
        const newChange = prev.change24h + changeDelta;
        // Clamp change to a reasonable range
        const clampedChange = Math.max(-5, Math.min(5, newChange));
        return { inr: newInr, usd: newUsd, change24h: clampedChange };
      });
      setLiveStats((prev) => {
        if (!prev) return prev;
        return {
          marketCap: prev.marketCap + (Math.random() - 0.5) * bitcoinPrice.marketCap * 0.0003,
          volume24h: prev.volume24h + (Math.random() - 0.5) * bitcoinPrice.volume24h * 0.0005,
        };
      });
    }, 5000);
    return () => clearInterval(ticker);
  }, [bitcoinPrice]);

  // ── getFilteredHistory removed — was dead code, never used in JSX ──

  // Auto-scrolling activity feed
  const activityNames = [
    'Ramesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta', 'Vikram Singh',
    'Anjali Verma', 'Rahul Mehta', 'Pooja Yadav', 'Suresh Reddy', 'Kavita Joshi',
    'Arjun Nair', 'Deepika Das', 'Manish Tiwari', 'Neha Agarwal', 'Rajesh Pillai',
    'Swati Kulkarni', 'Sanjay Mishra', 'Ritu Saxena', 'Harish Chauhan', 'Meena Rao',
    'Vivek Pandey', 'Suman Biswas', 'Pradeep Iyer', 'Kirti Deshmukh', 'Ashok Malhotra',
    'Shalini Bhatt', 'Naveen Kapoor', 'Rekha Rangan', 'Sunil Shukla', 'Aparna Hegde',
    'Dinesh Menon', 'Preeti Choudhary', 'Kiran Hegde', 'Vinod Saxena', 'Lata Nair',
    'Ganesh Patil', 'Sunita Rawat', 'Tarun Goel', 'Madhuri Jha', 'Ravi Dubey',
    'Usha Soni', 'Rakesh Bose', 'Anita Thakur', 'Pankaj Trivedi', 'Geeta Shukla',
    'Prakash Verma', 'Sarita Negi', 'Manoj Goyal', 'Bhavna Saxena', 'Ramu Naik',
  ];
  const activityTypes = ['invest', 'withdraw', 'return'] as const;
  const investAmounts = [5000, 8000, 10000];
  const randomAmount = () => {
    const amounts = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
    return amounts[Math.floor(Math.random() * amounts.length)];
  };
  const randomName = () => activityNames[Math.floor(Math.random() * activityNames.length)];
  const randomType = () => activityTypes[Math.floor(Math.random() * activityTypes.length)];
  const randomTime = () => {
    const mins = Math.floor(Math.random() * 60) + 1;
    return `${mins} min ago`;
  };

  const [activityItems] = useState(() => {
    const items: any[] = [];
    for (let i = 0; i < 50; i++) {
      const type = randomType();
      let amount: number;
      if (type === 'invest') {
        amount = investAmounts[Math.floor(Math.random() * investAmounts.length)];
      } else {
        amount = randomAmount();
      }
      items.push({ id: i, type, name: randomName(), amount, time: randomTime() });
    }
    return items;
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let scrollPaused = false;
    let scrollDirection = 1;
    const speed = 1;

    // Use 30fps interval instead of 60fps rAF for better battery life
    const interval = setInterval(() => {
      if (!scrollPaused) {
        el.scrollTop += speed * scrollDirection;
        if (el.scrollTop >= el.scrollHeight - el.clientHeight - 5) scrollDirection = -1;
        if (el.scrollTop <= 0) scrollDirection = 1;
      }
    }, 33);

    const handleMouseEnter = () => { scrollPaused = true; };
    const handleMouseLeave = () => { scrollPaused = false; };
    const handleTouchStart = () => { scrollPaused = true; };
    const handleTouchEnd = () => { setTimeout(() => { scrollPaused = false; }, 2000); };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('touchstart', handleTouchStart);
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      clearInterval(interval);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Which price to show: live simulated or API data
  const showPrice = livePrice || bitcoinPrice;
  const showStats = liveStats;
  const historyFilteredTx = useMemo(() => 
    historyFilter === 'all' ? transactions : transactions.filter(t => t.type === historyFilter),
    [historyFilter, transactions]
  );
  const totalInvested = useMemo(() => investments.reduce((s, i) => s + i.investment, 0), [investments]);
  const totalEarned = useMemo(() => investments.reduce((s, i) => s + i.earned, 0), [investments]);
  const availableBalance = useMemo(() => Math.max(0, totalEarned - withdrawnTotal), [totalEarned, withdrawnTotal]);
  const dailyProfit = useMemo(() => investments.reduce((s, i) => s + i.daily, 0), [investments]);
  const unreadNotifCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Determine which view to show
  const currentView = dashboardView;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] relative overflow-hidden transition-colors duration-300">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none hidden dark:block">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-5 pb-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-amber-500/30 cursor-pointer" onClick={() => setScreen('profile')}>
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{siteContent.dashboard_welcome_text || 'Welcome back'}</p>
              <h2 className="text-zinc-900 dark:text-white font-semibold text-lg">{user?.name || 'User'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400 hover:text-amber-500 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">{unreadNotifCount}</span>}
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400 hover:text-amber-500 transition-all duration-200">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-24">
        {/* WALLET VIEW */}
        {currentView === 'wallet' && (
        <div className="max-w-lg mx-auto space-y-4 pt-2">
          {/* Back Button Header */}
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setDashboardView('dashboard')} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">My Wallet</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Your investments & earnings</p>
              </div>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white">
              <p className="text-[10px] uppercase tracking-wider opacity-80">Total Invested</p>
              <p className="text-xl font-bold mt-1">₹{totalInvested.toLocaleString('en-IN')}</p>
              <p className="text-[10px] mt-1 opacity-70">{investments.length > 0 ? `${investments.length} active plan${investments.length !== 1 ? 's' : ''}` : 'No active plans'}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white">
              <p className="text-[10px] uppercase tracking-wider opacity-80">Total Earnings</p>
              <p className="text-xl font-bold mt-1">₹{totalEarned.toLocaleString('en-IN')}</p>
              <p className="text-[10px] mt-1 opacity-70">₹{dailyProfit.toLocaleString('en-IN')}/day profit</p>
            </div>
          </div>

          {/* Wallet Balance */}
          <Card className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Available Balance</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">₹{availableBalance.toLocaleString('en-IN')}</p>
              <button
                onClick={() => { setShowWithdraw(true); }}
                disabled={investments.length === 0}
                className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold transition-all duration-200 active:scale-95 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <ArrowUpRight className="w-4 h-4" />
                Withdraw Funds
              </button>
            </CardContent>
          </Card>

          {/* Active Investments */}
          <Card className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">Active Investments</p>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{investments.length} plan{investments.length !== 1 ? 's' : ''}</span>
              </div>

              {investments.length === 0 ? (
                <div className="space-y-3">
                  {/* Show zero-value investment cards */}
                  {plans.map((plan: any, idx: number) => (
                    <div key={plan.id || idx} className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700/50 opacity-60">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl ${plan.iconBg} flex items-center justify-center`}>
                            <CircleDollarSign className={`w-5 h-5 ${plan.iconColor}`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{plan.name} Plan</p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-500">Not started</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-400 text-[10px] font-semibold">Inactive</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white dark:bg-zinc-900/50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-zinc-500">Invested</p>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">₹0</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900/50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-zinc-500">Daily</p>
                          <p className="text-xs font-bold text-zinc-400">₹0</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900/50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-zinc-500">Return</p>
                          <p className="text-xs font-bold text-zinc-400">₹0</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900/50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-zinc-500">Earned</p>
                          <p className="text-xs font-bold text-zinc-400">₹0</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2 pb-1">
                    <p className="text-xs text-zinc-400 dark:text-zinc-600">Invest in a plan to start earning</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {investments.map((inv) => (
                    <div key={inv.id} className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl ${inv.iconBg} flex items-center justify-center`}>
                            <CircleDollarSign className={`w-5 h-5 ${inv.iconColor}`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{inv.planName} Plan</p>
                            <p className="text-[10px] text-zinc-500">Started {inv.date}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold">Active</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-white dark:bg-zinc-900/50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-zinc-500">Invested</p>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">₹{inv.investment.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900/50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-zinc-500">Daily</p>
                          <p className="text-xs font-bold text-emerald-500">₹{inv.daily.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900/50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-zinc-500">Total Return</p>
                          <p className="text-xs font-bold text-amber-500">₹{inv.totalReturn?.toLocaleString?.('en-IN') ?? '₹0'}</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900/50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-zinc-500">Earned</p>
                          <p className="text-xs font-bold text-emerald-400">₹{inv.earned.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="relative">
                        <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${inv.color}`} style={{ width: `${Math.min(100, (inv.earned / (inv.totalReturn || 1)) * 100)}%` }} />
                        </div>
                        <p className="text-[9px] text-zinc-500 mt-1 text-right">{((inv.earned / (inv.totalReturn || 1)) * 100).toFixed(1)}% of ₹{inv.totalReturn?.toLocaleString?.('en-IN') ?? '₹0'}</p>
                      </div>
                      {/* 24h Countdown Timer - Prominent */}
                      <div className={`mt-3 rounded-xl border p-2.5 ${timerPaused ? 'bg-red-500/8 border-red-500/15' : 'bg-emerald-500/8 border-emerald-500/15'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className={`w-3.5 h-3.5 ${timerPaused ? 'text-red-400' : 'text-emerald-500'}`} />
                            <span className={`text-[11px] font-semibold ${timerPaused ? 'text-red-400' : 'text-zinc-600 dark:text-zinc-300'}`}>Next Earning</span>
                            {timerPaused && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold animate-pulse">PAUSED</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${timerPaused ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}`}>+₹{inv.daily}</span>
                            <button
                              onClick={toggleTimerPause}
                              className={`p-1 rounded-full transition-all duration-200 ${timerPaused ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-red-400 hover:bg-red-500/20'}`}
                              title={timerPaused ? 'Resume Timer' : 'Pause Timer'}
                            >
                              {timerPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        {/* Animated Countdown Boxes */}
                        <div className="flex items-center justify-center gap-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-md border flex items-center justify-center ${timerPaused ? 'bg-red-500/10 border-red-500/20 opacity-60' : 'bg-emerald-500/15 border-emerald-500/25'}`}>
                              <span className={`text-xs font-mono font-bold ${timerPaused ? 'text-red-300 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{(countdowns[inv.id] || '24:00:00').split(':')[0]}</span>
                            </div>
                            <span className="text-[7px] text-zinc-400 mt-0.5">HRS</span>
                          </div>
                          <span className={`text-xs font-mono font-bold mb-2 ${timerPaused ? 'text-red-300' : 'text-emerald-500 animate-pulse'}`}>:</span>
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-md border flex items-center justify-center ${timerPaused ? 'bg-red-500/10 border-red-500/20 opacity-60' : 'bg-amber-500/15 border-amber-500/25'}`}>
                              <span className={`text-xs font-mono font-bold ${timerPaused ? 'text-red-300 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{(countdowns[inv.id] || '24:00:00').split(':')[1]}</span>
                            </div>
                            <span className="text-[7px] text-zinc-400 mt-0.5">MIN</span>
                          </div>
                          <span className={`text-xs font-mono font-bold mb-2 ${timerPaused ? 'text-red-300' : 'text-amber-500 animate-pulse'}`}>:</span>
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-md border flex items-center justify-center ${timerPaused ? 'bg-red-500/10 border-red-500/20 opacity-60' : 'bg-orange-500/15 border-orange-500/25'}`}>
                              <span className={`text-xs font-mono font-bold ${timerPaused ? 'text-red-300 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>{(countdowns[inv.id] || '24:00:00').split(':')[2]}</span>
                            </div>
                            <span className="text-[7px] text-zinc-400 mt-0.5">SEC</span>
                          </div>
                        </div>
                        {/* Cancel Plan Button */}
                        <div className="mt-2.5 flex justify-end">
                          <button
                            onClick={() => setCancelPlanId(inv.id)}
                            className="text-[10px] px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors font-medium"
                          >
                            Cancel Plan
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction History placeholder */}
          <Card className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Transactions</p>
              </div>
              {investments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-zinc-400 dark:text-zinc-600">No transactions yet</p>
                  <p className="text-[11px] text-zinc-300 dark:text-zinc-700 mt-1">Start investing to see your transaction history</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {investments.map((inv) => (
                    <div key={`tx-${inv.id}`} className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white">{inv.planName} Plan Investment</p>
                          <p className="text-[10px] text-zinc-500">{inv.date}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-red-400">-₹{inv.investment.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {/* HISTORY VIEW */}
        {currentView === 'history' && (
        <div className="max-w-lg mx-auto space-y-4 pt-2">
          {/* Back Button Header */}
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setDashboardView('dashboard')} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <History className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Transaction History</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">All your investment activity</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {['all', 'invest', 'withdraw', 'earning'].map((filter) => (
              <button key={filter} onClick={() => setHistoryFilter(filter as any)} className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${historyFilter === filter ? 'bg-amber-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-zinc-700/50'}`}>
                {filter === 'all' ? 'All' : filter === 'invest' ? 'Invested' : filter === 'withdraw' ? 'Withdrawn' : 'Earnings'}
              </button>
            ))}
          </div>

          {/* Transaction List */}
          <Card className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="max-h-[500px] overflow-y-auto">
                {historyFilteredTx.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-400 dark:text-zinc-600">No transactions yet</p>
                    <p className="text-[11px] text-zinc-300 dark:text-zinc-700 mt-1">Start investing to see your history</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {historyFilteredTx.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'invest' ? 'bg-emerald-500/20' : tx.type === 'withdraw' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                            {tx.type === 'invest' ? <ArrowDownRight className="w-4 h-4 text-green-500" /> : tx.type === 'withdraw' ? <ArrowUpRight className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-zinc-900 dark:text-white">{tx.desc}</p>
                              {tx.planName && <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[9px] font-semibold">{tx.planName}</span>}
                            </div>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-500">{tx.date}</p>
                          </div>
                        </div>
                        {tx.type === 'earning' ? (
                          <span className="text-xs font-bold text-emerald-500">+₹{tx.amount.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-xs font-bold text-red-400">-₹{tx.amount.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* NOTIFICATIONS VIEW */}
        {currentView === 'notifications' && (
        <div className="max-w-lg mx-auto space-y-4 pt-2">
          {/* Back Button Header */}
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setDashboardView('dashboard')} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Notifications</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{unreadNotifCount > 0 ? `${unreadNotifCount} unread` : 'All caught up!'}</p>
              </div>
              {unreadNotifCount > 0 && (
                <button onClick={() => { setNotifications(prev => { const updated = prev.map(n => ({...n, read: true})); localStorage.setItem('btc-notifications', JSON.stringify(updated)); return updated; }); }} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all">
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <Card className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">No notifications yet</p>
                    <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">Your notifications will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notif: any) => {
                      const iconMap: Record<string, any> = { Zap: <Zap className="w-4 h-4 text-amber-500" />, CheckCircle2: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, Shield: <Shield className="w-4 h-4 text-blue-500" />, TrendingUp: <TrendingUp className="w-4 h-4 text-emerald-500" />, Wallet: <Wallet className="w-4 h-4 text-amber-500" /> };
                      return (
                        <div key={notif.id} onClick={() => setNotifications(prev => { const updated = prev.map((n: any) => n.id === notif.id ? {...n, read: true} : n); localStorage.setItem('btc-notifications', JSON.stringify(updated)); return updated; })} className={`flex gap-3 p-4 rounded-xl transition-colors cursor-pointer border ${!notif.read ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-50 dark:bg-zinc-800/50 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/50'}`}>
                          <div className="relative mt-0.5 shrink-0">
                            <span className={`absolute -left-0.5 top-1.5 w-1.5 h-1.5 rounded-full ${notif.dot || 'bg-zinc-400'}`} />
                            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">{iconMap[notif.icon] || <Zap className="w-4 h-4 text-amber-500" />}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs font-semibold ${!notif.read ? 'text-zinc-900 dark:text-zinc-200' : 'text-zinc-500 dark:text-zinc-400'}`}>{notif.title}</p>
                              {!notif.read && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{notif.desc}</p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* DASHBOARD VIEW */}
        {currentView === 'dashboard' && (
        <div className="max-w-lg mx-auto space-y-4">
          {/* Total Earnings Summary - only show when has investments */}
          {investments.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 to-amber-500/10 border border-emerald-500/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Earnings</p>
                    <p className="text-2xl font-bold text-emerald-500">₹{totalEarned.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Daily Profit</p>
                  <p className="text-lg font-bold text-amber-500">₹{dailyProfit.toLocaleString('en-IN')}</p>
                </div>
              </div>
              {/* Next earning countdown for each investment - Prominent timer */}
              <div className="mt-4 space-y-3">
                {investments.map((inv: any) => {
                  const cd = countdowns[inv.id] || '24:00:00';
                  const [hh, mm, ss] = cd.split(':');
                  return (
                    <div key={inv.id} className={`rounded-xl border p-3 ${timerPaused ? 'bg-gradient-to-r from-red-500/8 to-red-500/5 border-red-500/15' : 'bg-gradient-to-r from-emerald-500/8 to-amber-500/8 border-emerald-500/15'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${timerPaused ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                            <Timer className={`w-3.5 h-3.5 ${timerPaused ? 'text-red-400' : 'text-emerald-500'}`} />
                          </div>
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{inv.planName} Plan</span>
                          {timerPaused && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold animate-pulse">PAUSED</span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${timerPaused ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}`}>+₹{inv.daily}</span>
                        </div>
                        <button
                          onClick={toggleTimerPause}
                          className={`p-1 rounded-full transition-all duration-200 ${timerPaused ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-red-400 hover:bg-red-500/20'}`}
                          title={timerPaused ? 'Resume Timer' : 'Pause Timer'}
                        >
                          {timerPaused ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
                        </button>
                      </div>
                      {/* Animated Countdown Boxes */}
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Hours */}
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${timerPaused ? 'bg-red-500/10 border-red-500/20 opacity-60' : 'bg-emerald-500/15 border-emerald-500/25'}`}>
                            <span className={`text-base font-mono font-bold ${timerPaused ? 'text-red-300 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{hh}</span>
                          </div>
                          <span className="text-[8px] text-zinc-400 mt-1">HRS</span>
                        </div>
                        <span className={`text-base font-mono font-bold mb-3 ${timerPaused ? 'text-red-300' : 'text-emerald-500 animate-pulse'}`}>:</span>
                        {/* Minutes */}
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${timerPaused ? 'bg-red-500/10 border-red-500/20 opacity-60' : 'bg-amber-500/15 border-amber-500/25'}`}>
                            <span className={`text-base font-mono font-bold ${timerPaused ? 'text-red-300 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{mm}</span>
                          </div>
                          <span className="text-[8px] text-zinc-400 mt-1">MIN</span>
                        </div>
                        <span className={`text-base font-mono font-bold mb-3 ${timerPaused ? 'text-red-300' : 'text-amber-500 animate-pulse'}`}>:</span>
                        {/* Seconds */}
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${timerPaused ? 'bg-red-500/10 border-red-500/20 opacity-60' : 'bg-orange-500/15 border-orange-500/25'}`}>
                            <span className={`text-base font-mono font-bold ${timerPaused ? 'text-red-300 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>{ss}</span>
                          </div>
                          <span className="text-[8px] text-zinc-400 mt-1">SEC</span>
                        </div>
                      </div>
                      {/* Cancel Plan Button */}
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => setCancelPlanId(inv.id)}
                          className="text-[10px] px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors font-medium"
                        >
                          Cancel Plan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Investment Plans */}
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Investment Plans</h3>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Active</Badge>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {plans.map((plan: any, idx: number) => (
              <div key={plan.id || idx} className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-500/10 via-zinc-900/80 to-zinc-900/60 border border-zinc-500/20 p-3.5 flex flex-col">
                <div className={`absolute top-0 left-0 right-0 h-[2px] ${plan.color}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${plan.iconColor} mb-1`}>{plan.name}</span>
                <p className="text-lg font-bold text-white">₹{plan.investment.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-zinc-500 mb-3">Investment</p>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-1.5">
                    <IndianRupee className={`w-3 h-3 ${plan.iconColor} shrink-0`} />
                    <span className="text-[11px] text-zinc-300"><span className={`font-semibold ${plan.iconColor}`}>₹{plan.daily.toLocaleString('en-IN')}</span>/day</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className={`w-3 h-3 ${plan.iconColor} shrink-0`} />
                    <span className="text-[11px] text-zinc-300"><span className={`font-semibold ${plan.iconColor}`}>₹{plan.monthly.toLocaleString('en-IN')}</span>/month</span>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-700/50">
                  <p className="text-[10px] text-zinc-500 mb-0.5">Total Return</p>
                  <p className={`text-sm font-bold ${plan.iconColor}`}>₹{plan.total.toLocaleString('en-IN')}</p>
                </div>
                <button onClick={() => {
                  if (investments.length > 0) {
                    setCancelPlanId(-1);
                  } else {
                    setSelectedPlan(plan);
                    setPaymentStatus('idle');
                  }
                }} className={`mt-2.5 w-full py-2 rounded-lg ${plan.btnBg} text-white text-xs font-semibold transition-all duration-200 active:scale-95`}>
                  Invest Now
                </button>
              </div>
            ))}
          </div>

          {/* Invest Dialog - Automatic UPI Payment Flow */}
          {selectedPlan && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
              <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700/50 shadow-2xl overflow-hidden">
                <div className={`h-1.5 ${selectedPlan.color}`} />
                <div className="p-6">

                  {/* STEP 1: Plan confirmation (idle) */}
                  {paymentStatus === 'idle' && (
                    <>
                      <div className="text-center mb-5">
                        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${selectedPlan.iconBg} mb-3`}>
                          <CircleDollarSign className={`w-7 h-7 ${selectedPlan.iconColor}`} />
                        </div>
                        <h3 className="text-xl font-bold text-white">{selectedPlan.name} Plan</h3>
                        <p className="text-sm text-zinc-400 mt-1">Confirm your investment</p>
                      </div>
                      {/* Merchant Info - prominently displayed */}
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{upiName || 'Gulshan Yadav'}</p>
                            <p className="text-[11px] font-mono text-amber-400">{upiId}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Investment Amount</span>
                          <span className="text-sm font-bold text-white">₹{selectedPlan.investment.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Daily Profit</span>
                          <span className={`text-sm font-bold ${selectedPlan.iconColor}`}>₹{selectedPlan.daily.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Monthly Profit</span>
                          <span className={`text-sm font-bold ${selectedPlan.iconColor}`}>₹{selectedPlan.monthly.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="border-t border-zinc-700/50 pt-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-300">Total Return</span>
                          <span className={`text-lg font-bold ${selectedPlan.iconColor}`}>₹{selectedPlan.total.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      {/* UPI Payment Info */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-5">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-semibold text-emerald-400">UPI PAYMENT</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">Amount will be auto-filled — ₹{selectedPlan.investment.toLocaleString('en-IN')} will be sent to <span className="text-amber-400 font-semibold">{upiName || 'Gulshan Yadav'}</span></p>
                      </div>
                      <div className="space-y-3">
                        <button onClick={handleInvest} disabled={investing} className={`w-full py-3.5 rounded-xl text-white font-semibold transition-all duration-200 active:scale-[0.98] ${selectedPlan.btnBg} ${investing ? 'opacity-60' : ''}`}>
                          {investing ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Opening UPI...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span>Pay ₹{selectedPlan.investment.toLocaleString('en-IN')}</span>
                              <ArrowUpRight className="w-4 h-4" />
                            </div>
                          )}
                        </button>
                        <button onClick={() => { setSelectedPlan(null); setPaymentStatus('idle'); }} className="w-full py-3 rounded-xl bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors text-sm font-medium">
                          Cancel
                        </button>
                      </div>
                    </>
                  )}

                  {/* STEP 2: UPI app opened — waiting */}
                  {(paymentStatus === 'opened' || paymentStatus === 'waiting') && (
                    <div className="text-center py-2">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/15 mb-4 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping" />
                        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Payment in Progress...</h3>
                      <p className="text-sm text-zinc-400 mt-1 mb-4">Complete payment in your UPI app</p>
                      {/* Merchant name prominently at top */}
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-white">{upiName || 'Gulshan Yadav'}</p>
                            <p className="text-[11px] font-mono text-amber-400">{upiId}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2.5 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Plan</span>
                          <span className="text-sm font-semibold text-white">{selectedPlan.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Amount</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-emerald-400">₹{selectedPlan.investment.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-400 font-medium">Locked</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-500 animate-pulse">
                        ⏳ Waiting for payment completion...
                      </p>
                      {/* Manual UPI option: Copy UPI ID to pay with any app */}
                      <div className="mt-4 pt-3 border-t border-zinc-700/50">
                        <p className="text-[11px] text-zinc-500 mb-2">UPI app not opening? Pay manually:</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(upiId).then(() => {
                            const btn = e.currentTarget;
                            btn.textContent = '✓ Copied!';
                            setTimeout(() => { btn.textContent = 'Copy UPI ID'; }, 2000);
                          }); }}
                          className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 hover:bg-amber-500/20 transition-colors"
                        >Copy UPI ID</button>
                        <p className="text-[10px] text-zinc-600 mt-1.5">Open any UPI app → Pay to <span className="text-amber-500/70">{upiId}</span></p>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Verifying — ask user to confirm payment */}
                  {paymentStatus === 'verifying' && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-4">
                        <Shield className="w-8 h-8 text-amber-400 animate-pulse" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Payment Verification</h3>
                      <p className="text-sm text-zinc-400 mt-2 mb-5">Have you completed the payment?</p>
                      <div className="space-y-3">
                        <button onClick={confirmPaymentSuccess} className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all active:scale-[0.98]">
                          Yes, I Paid ✓
                        </button>
                        <button onClick={confirmPaymentFailed} className="w-full py-3 rounded-xl bg-zinc-800 border border-zinc-700/50 text-red-400 hover:bg-zinc-700/50 transition-colors font-medium text-sm">
                          No, Payment Failed
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Upload payment proof (UTR + screenshot → auto-send to WhatsApp) */}
                  {paymentStatus === 'uploading' && (
                    <div className="py-2">
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 mb-3">
                          <Shield className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Upload Payment Proof</h3>
                        <p className="text-xs text-zinc-400 mt-1">Enter UTR number & upload screenshot</p>
                        <div className="mt-2 flex items-center justify-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          </div>
                          <span className="text-[11px] text-green-400 font-medium">Screenshot will be sent to admin via WhatsApp</span>
                        </div>
                      </div>

                      {/* UTR Number */}
                      <div className="mb-3">
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">UTR Number <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value.trim())}
                          placeholder="Enter 12-digit UTR / Reference No."
                          maxLength={20}
                          className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">Find UTR in your payment app / bank statement</p>
                      </div>

                      {/* Screenshot Upload */}
                      <div className="mb-4">
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Payment Screenshot <span className="text-red-400">*</span></label>
                        {proofPreview ? (
                          <div className="relative rounded-xl overflow-hidden border border-zinc-700/50">
                            <img src={proofPreview} alt="Proof" className="w-full h-40 object-cover" />
                            <button
                              onClick={() => { setProofFile(null); setProofPreview(null); }}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-zinc-700/50 hover:border-emerald-500/40 bg-zinc-800/30 cursor-pointer transition-colors">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center mb-2">
                              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="text-xs font-medium text-zinc-400">Tap to upload screenshot</span>
                            <span className="text-[10px] text-zinc-600 mt-0.5">JPG, PNG — Max 5MB</span>
                            <input type="file" accept="image/*" capture="environment" onChange={handleProofFile} className="hidden" />
                          </label>
                        )}
                      </div>

                      {/* User Info Summary (sent to admin) */}
                      <div className="bg-zinc-800/60 rounded-xl p-3 mb-4 space-y-1.5">
                        <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Admin will receive:</p>
                        <div className="flex items-center gap-2 text-xs">
                          <User className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-zinc-300">{user?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-zinc-500 text-[10px]">📱</span>
                          <span className="text-zinc-300">{user?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-zinc-500 text-[10px]">📧</span>
                          <span className="text-zinc-300">{user?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-zinc-500 text-[10px]">📋</span>
                          <span className="text-zinc-300">{(window as any).__pendingPlan?.name || 'N/A'} — ₹{(window as any).__pendingPlan?.investment?.toLocaleString('en-IN') || '0'}</span>
                        </div>
                      </div>

                      {/* Submit + Cancel */}
                      <div className="space-y-2.5">
                        <button
                          onClick={submitPaymentProof}
                          disabled={!proofFile || utrNumber.trim().length < 4 || uploadingProof}
                          className={`w-full py-3.5 rounded-xl font-semibold transition-all active:scale-[0.98] ${
                            proofFile && utrNumber.trim().length >= 4
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          {uploadingProof ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Uploading & Sending...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span>Submit & Send to WhatsApp</span>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </div>
                          )}
                        </button>
                        <button onClick={confirmPaymentFailed} className="w-full py-2.5 rounded-xl text-zinc-500 hover:text-red-400 text-xs font-medium transition-colors">
                          Payment Failed
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Under review — admin will verify via WhatsApp */}
                  {paymentStatus === 'reviewing' && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-bold text-emerald-400">Proof Submitted! ✓</h3>
                      <p className="text-sm text-zinc-400 mt-2 mb-1">Your screenshot & UTR sent to admin via WhatsApp</p>
                      <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1.5">
                        <p className="text-[11px] text-emerald-400 font-medium">📋 Admin received:</p>
                        <p className="text-[10px] text-zinc-400">• Your Name, Phone & Email</p>
                        <p className="text-[10px] text-zinc-400">• Plan Name & Amount</p>
                        <p className="text-[10px] text-zinc-400">• UTR Number</p>
                        <p className="text-[10px] text-zinc-400">• Payment Screenshot</p>
                      </div>
                      <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                        <p className="text-[11px] text-amber-400 font-medium">⏳ Plan will activate after admin verifies your payment</p>
                      </div>
                      <button
                        onClick={() => { setPaymentStatus('idle'); setSelectedPlan(null); }}
                        className="mt-4 w-full py-2.5 rounded-xl bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors text-sm font-medium"
                      >
                        OK, Got it
                      </button>
                    </div>
                  )}

                  {/* STEP 4: Payment completed */}
                  {paymentStatus === 'completed' && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-bold text-emerald-400">Payment Successful! 🎉</h3>
                      <p className="text-sm text-zinc-400 mt-2">{selectedPlan.name} Plan is now active</p>
                    </div>
                  )}

                  {/* STEP 5: Payment failed */}
                  {paymentStatus === 'failed' && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                        <X className="w-8 h-8 text-red-400" />
                      </div>
                      <h3 className="text-lg font-bold text-red-400">Payment Failed</h3>
                      <p className="text-sm text-zinc-400 mt-2">No amount was charged. Please try again.</p>
                    </div>
                  )}

                  {/* STEP 6: Payment cancelled — auto-closes */}
                  {paymentStatus === 'cancelled' && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                        <X className="w-8 h-8 text-red-400" />
                      </div>
                      <h3 className="text-lg font-bold text-red-400">Payment Cancelled</h3>
                      <p className="text-sm text-zinc-400 mt-2">No amount was charged</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Invest Success Toast */}
          {investSuccess && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[101] flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5" />
              Investment successful! 🎉
            </div>
          )}

          {/* Live Activity Feed */}
          <div className="rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Live Activity</span>
              </div>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600">Auto-scrolling</span>
            </div>
            <div ref={scrollRef} className="h-[180px] overflow-hidden cursor-default">
              <div className="p-2 space-y-1">
                {activityItems.map((item) => (
                  <div key={item.id} className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    item.type === 'invest' ? 'bg-amber-500/5 hover:bg-amber-500/10' :
                    item.type === 'withdraw' ? 'bg-red-500/5 hover:bg-red-500/10' :
                    'bg-emerald-500/5 hover:bg-emerald-500/10'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        item.type === 'invest' ? 'bg-amber-500/20 text-amber-400' :
                        item.type === 'withdraw' ? 'bg-red-500/20 text-red-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {item.name.split(' ').map((n: string) => n.charAt(0)).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{item.name}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-600">{item.time}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      {item.type === 'invest' && (
                        <div className="flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-400">Invested ₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {item.type === 'withdraw' && (
                        <div className="flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-red-400" />
                          <span className="text-xs font-semibold text-red-400">Withdraw ₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {item.type === 'return' && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">Return ₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bitcoin Price Card - LIVE with animated numbers */}
          <Card className="bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <Bitcoin className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-zinc-900 dark:text-white font-semibold">Bitcoin (BTC)</span>
                  <Badge variant="outline" className="text-xs bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">BTC/INR</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {/* Live indicator */}
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    LIVE
                  </span>
                  <button onClick={() => fetchBitcoinData(true)} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-amber-500 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {showPrice ? (
                <>
                  <div className="flex items-end gap-3 mb-1">
                    <span className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">
                      <AnimatedNumber value={showPrice.inr} decimals={2} prefix="₹" />
                    </span>
                    <div className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full mb-1 transition-colors duration-300 ${showPrice.change24h >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {showPrice.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <AnimatedNumber value={Math.abs(showPrice.change24h)} decimals={2} suffix="%" />
                    </div>
                  </div>
                  <p className="text-zinc-500 text-xs tabular-nums">
                    ≈ $<AnimatedNumber value={showPrice.usd} decimals={0} />
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800" />
                  <Skeleton className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart Card - LIVE auto-moving chart */}
          <Card className="bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Live Price Chart</span>
                  <span className="relative flex h-1.5 w-1.5 ml-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800/50 rounded-lg p-0.5">
                  {(['line', 'candle'] as const).map((type) => (
                    <button key={type} onClick={() => setChartType(type)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${chartType === type ? 'bg-amber-500 text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-300'}`}>
                      {type === 'line' ? 'Line' : 'Candle'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                {(['24h', '7d', '30d'] as const).map((range) => (
                  <button key={range} onClick={() => setTimeRange(range)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${timeRange === range ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-200 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700/30 hover:text-zinc-300'}`}>
                    {range}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {showPrice ? (
                chartType === 'line' ? (
                  <LiveChart basePrice={showPrice.inr} changePercent={showPrice.change24h} />
                ) : (
                  <LiveCandlestickChart basePrice={showPrice.inr} changePercent={showPrice.change24h} />
                )
              ) : (
                <Skeleton className="h-48 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              )}
            </CardContent>
          </Card>

          {/* Market Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-xs text-zinc-500 mb-1">Market Cap</p>
                {showStats ? (
                  <p className="text-zinc-900 dark:text-white font-semibold text-lg tabular-nums">
                    {formatINR(showStats.marketCap)}
                  </p>
                ) : (
                  <Skeleton className="h-6 w-28 bg-zinc-200 dark:bg-zinc-800" />
                )}
              </CardContent>
            </Card>
            <Card className="bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-xs text-zinc-500 mb-1">24h Volume</p>
                {showStats ? (
                  <p className="text-zinc-900 dark:text-white font-semibold text-lg tabular-nums">
                    {formatINR(showStats.volume24h)}
                  </p>
                ) : (
                  <Skeleton className="h-6 w-28 bg-zinc-200 dark:bg-zinc-800" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Gainers */}
          <Card className="bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Top Gainers</p>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/25 text-[10px]">Live</Badge>
              </div>
              <div className="space-y-0.5">
                {CRYPTO_COINS
                  .filter(c => c.change24h > 0)
                  .sort((a, b) => (liveCoinPrices[b.symbol]?.change ?? b.change24h) - (liveCoinPrices[a.symbol]?.change ?? a.change24h))
                  .slice(0, 3)
                  .map((coin) => (
                  <div key={coin.symbol} className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: coin.bgColor }}>
                        <span className="text-sm font-bold text-white">{coin.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{coin.name}</p>
                        <p className="text-[11px] text-zinc-500">{coin.symbol}</p>
                      </div>
                    </div>
                    <div className="w-16 h-7 mx-2 shrink-0">
                      <AnimatedSparkline data={coin.sparkData} color="#22c55e" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">
                        <AnimatedNumber value={liveCoinPrices[coin.symbol]?.price ?? coin.price} decimals={coin.price >= 100 ? 0 : 2} prefix="₹" />
                      </p>
                      <p className="text-[11px] font-medium text-emerald-400 tabular-nums">
                        +<AnimatedNumber value={Math.abs(liveCoinPrices[coin.symbol]?.change ?? coin.change24h)} decimals={2} suffix="%" />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Cryptocurrencies */}
          <Card className="bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Top Cryptocurrencies</p>
                </div>
                <button onClick={() => setShowAllCoins(!showAllCoins)} className="text-xs text-amber-500 hover:text-amber-400 transition-colors font-medium">
                  {showAllCoins ? 'Show Less' : 'View All'}
                </button>
              </div>
              <div className="space-y-0.5">
                {CRYPTO_COINS.slice(0, showAllCoins ? CRYPTO_COINS.length : 4).map((coin) => (
                  <div key={coin.symbol} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                    {/* Left: icon + name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: coin.bgColor }}>
                        <span className="text-sm font-bold text-white">{coin.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{coin.name}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-500">{coin.symbol}</p>
                      </div>
                    </div>
                    {/* Middle: mini sparkline chart */}
                    <div className="w-20 h-8 mx-3 shrink-0">
                      <AnimatedSparkline data={coin.sparkData} color={coin.change24h >= 0 ? '#22c55e' : '#ef4444'} />
                    </div>
                    {/* Right: price + change */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">
                        <AnimatedNumber
                          value={liveCoinPrices[coin.symbol]?.price ?? coin.price}
                          decimals={coin.price >= 100 ? 0 : coin.price >= 1 ? 2 : 6}
                          prefix="₹"
                        />
                      </p>
                      <p className={`text-[11px] font-medium tabular-nums ${liveCoinPrices[coin.symbol]?.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {liveCoinPrices[coin.symbol]?.change >= 0 ? '+' : ''}<AnimatedNumber
                          value={Math.abs(liveCoinPrices[coin.symbol]?.change ?? coin.change24h)}
                          decimals={2}
                          suffix="%"
                        />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {!showAllCoins && (
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center mt-2">+{CRYPTO_COINS.length - 4} more coins</p>
              )}
            </CardContent>
          </Card>
        </div>
        )}
      </main>

      {/* Already have a plan warning - when user tries to invest in 2nd plan */}
      {cancelPlanId === -1 && (() => {
        const activeInv = investments.length > 0 ? investments[0] : null;
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCancelPlanId(null)} />
            <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden">
              <div className="h-1.5 bg-amber-500" />
              <div className="p-6">
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 mb-3">
                    <Shield className="w-7 h-7 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">1 Plan at a Time</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Aap ek time pe sirf ek plan use kar sakte hain</p>
                </div>
                {activeInv && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider mb-2">Currently Active Plan</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Plan</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{activeInv.planName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Invested</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">₹{activeInv.investment.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5">
                  <p className="text-[11px] text-red-500 dark:text-red-400 text-center font-medium">⚠️ Pehle current plan ko cancel karein, phir nayi plan invest karein</p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setCancelPlanId(null);
                      setDashboardView('wallet');
                    }}
                    className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    Go to Wallet — Cancel Plan
                  </button>
                  <button
                    onClick={() => setCancelPlanId(null)}
                    className="w-full py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700/50 transition-colors text-sm font-medium"
                  >
                    Baad Mein
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancel Plan Confirmation Dialog */}
      {cancelPlanId !== null && cancelPlanId !== -1 && (() => {
        const cancelInv = investments.find((i: any) => i.id === cancelPlanId);
        return cancelInv && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !cancellingPlan && setCancelPlanId(null)} />
            <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700/50 shadow-2xl overflow-hidden">
              <div className="h-1.5 bg-red-500" />
              <div className="p-6">
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/20 mb-3">
                    <X className="w-7 h-7 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Cancel Plan?</h3>
                  <p className="text-sm text-zinc-400 mt-1">This action cannot be undone</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Plan</span>
                    <span className="text-sm font-bold text-white">{cancelInv.planName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Invested</span>
                    <span className="text-sm font-bold text-red-400">₹{cancelInv.investment.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Earned so far</span>
                    <span className="text-sm font-bold text-emerald-400">₹{cancelInv.earned.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-zinc-700/50 pt-2 flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Will be lost</span>
                    <span className="text-sm font-bold text-red-400">₹{Math.max(0, cancelInv.investment - cancelInv.earned).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5">
                  <p className="text-[11px] text-red-400 text-center font-medium">⚠️ Your invested amount (₹{cancelInv.investment.toLocaleString('en-IN')}) and all future earnings will be lost</p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => handleCancelPlan(cancelPlanId)}
                    disabled={cancellingPlan}
                    className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                  >
                    {cancellingPlan ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Cancelling...
                      </div>
                    ) : (
                      'Yes, Cancel Plan'
                    )}
                  </button>
                  <button
                    onClick={() => setCancelPlanId(null)}
                    disabled={cancellingPlan}
                    className="w-full py-3 rounded-xl bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors text-sm font-medium disabled:opacity-60"
                  >
                    Keep Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Notification Dropdown - visible on ALL pages */}
      {showNotif && (
        <div className="fixed inset-0 z-[100]" onClick={() => setShowNotif(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="absolute top-20 right-4 w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl z-[101] overflow-hidden animate-in fade-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Notifications</h3>
              <button onClick={() => setShowNotif(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 dark:text-zinc-600">No notifications yet</p>
                </div>
              ) : notifications.slice(0, 10).map((notif) => {
                const iconMap: Record<string, any> = { Zap: <Zap className="w-4 h-4 text-amber-500" />, CheckCircle2: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, Shield: <Shield className="w-4 h-4 text-blue-500" />, TrendingUp: <TrendingUp className="w-4 h-4 text-emerald-500" />, Wallet: <Wallet className="w-4 h-4 text-amber-500" /> };
                return (
                  <div key={notif.id} onClick={() => setNotifications(prev => { const updated = prev.map(n => n.id === notif.id ? {...n, read: true} : n); localStorage.setItem('btc-notifications', JSON.stringify(updated)); return updated; })} className={`flex gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 ${!notif.read ? 'bg-amber-500/5' : ''}`}>
                    <div className="relative mt-0.5">
                      <span className={`absolute -left-0.5 top-1.5 w-1.5 h-1.5 rounded-full ${notif.dot}`} />
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">{iconMap[notif.icon] || <Zap className="w-4 h-4 text-amber-500" />}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${!notif.read ? 'text-zinc-900 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'}`}>{notif.title}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{notif.desc}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1">{notif.time}</p>
                    </div>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />}
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <button onClick={() => { setShowNotif(false); setDashboardView('notifications'); }} className="text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors">View All Notifications</button>
            </div>
          </div>
        </div>
      )}

      {/* Invest Plans Modal - opens from Quick Actions Invest button */}
      {showInvestPlans && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={() => setShowInvestPlans(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-4" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Choose Investment Plan</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Select a plan that suits your budget</p>
              </div>
              <button onClick={() => setShowInvestPlans(false)} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plans */}
            <div className="px-5 pb-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {loadingPlans ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                  ))}
                </div>
              ) : (
              plans.map((plan: any, idx: number) => (
              <div key={plan.id || idx} className="relative rounded-2xl border-2 border-zinc-200 dark:border-zinc-700/50 p-4 transition-all cursor-pointer active:scale-[0.98]" onClick={() => {
                if (investments.length > 0) {
                  setCancelPlanId(-1);
                  setShowInvestPlans(false);
                } else {
                  setSelectedPlan(plan);
                  setShowInvestPlans(false);
                }
              }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${plan.iconBg} flex items-center justify-center`}>
                      <CircleDollarSign className={`w-5 h-5 ${plan.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-zinc-900 dark:text-white">{plan.name} Plan</p>
                      <p className="text-xs text-zinc-500">Investment plan</p>
                    </div>
                  </div>
                  <Badge className={`${plan.iconBg} ${plan.iconColor} border-zinc-200 dark:border-zinc-700/50 text-[10px]`}>{plan.name}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-zinc-500">Investment</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">₹{plan.investment.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-zinc-500">Daily Profit</p>
                    <p className={`text-sm font-bold ${plan.iconColor}`}>₹{plan.daily.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-zinc-500">Total Return</p>
                    <p className={`text-sm font-bold ${plan.iconColor}`}>₹{plan.total.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <button className={`mt-3 w-full py-2.5 rounded-xl text-white text-xs font-semibold transition-all duration-200 ${plan.btnBg} active:scale-95`}>
                  Invest ₹{plan.investment.toLocaleString('en-IN')}
                </button>
              </div>
              ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Modal removed - now renders as full page inside main */}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => setShowWithdraw(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4" onClick={(e) => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="p-6">
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 mb-3">
                  <ArrowUpRight className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Withdraw Funds</h3>
                <p className="text-sm text-zinc-500 mt-1">Transfer earnings to your bank</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-zinc-500">Available Balance</span>
                  <span className="text-sm font-bold text-emerald-500">₹{totalEarned.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-zinc-500">Min. Withdrawal</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">₹500</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs text-zinc-500 mb-1.5 block">Enter Amount (₹)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter withdrawal amount"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-zinc-400"
                />
                {withdrawAmount && Number(withdrawAmount) > availableBalance && (
                  <p className="text-[11px] text-red-400 mt-1">Amount exceeds available balance</p>
                )}
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mb-4">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button key={amt} onClick={() => setWithdrawAmount(String(amt))} className="flex-1 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <button
                onClick={async () => {
                  if (!withdrawAmount || Number(withdrawAmount) < 500) return;
                  const wAmt = Number(withdrawAmount);
                  setWithdrawing(true);
                  await new Promise((r) => setTimeout(r, 2500));
                  setWithdrawing(false);
                  // Deduct from withdrawn total
                  const newWithdrawnTotal = withdrawnTotal + wAmt;
                  setWithdrawnTotal(newWithdrawnTotal);
                  localStorage.setItem('btc-wallet-withdrawn', JSON.stringify(newWithdrawnTotal));
                  // Record withdrawal transaction
                  const tx = { id: Date.now(), type: 'withdraw', amount: wAmt, date: new Date().toLocaleString('en-IN'), desc: 'Withdrawal to bank account' };
                  const newTxs = [tx, ...transactions];
                  setTransactions(newTxs);
                  localStorage.setItem('btc-transactions', JSON.stringify(newTxs));
                  // Add notification
                  const notif = { id: Date.now(), icon: 'Wallet', title: 'Withdrawal Processed', desc: `₹${wAmt.toLocaleString('en-IN')} sent to your bank account`, time: 'Just now', dot: 'bg-amber-500', read: false };
                  const newNotifs = [notif, ...notifications];
                  setNotifications(newNotifs);
                  localStorage.setItem('btc-notifications', JSON.stringify(newNotifs));
                  // Track to Google Sheet
                  fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'withdraw', userId: user?.id, userName: user?.name, userEmail: user?.email, userPhone: user?.phone, amount: wAmt, method: 'bank' }) }).catch(() => {});
                  setWithdrawAmount('');
                  setShowWithdraw(false);
                  setWithdrawSuccess(true);
                  setTimeout(() => setWithdrawSuccess(false), 3000);
                }}
                disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) < 500 || Number(withdrawAmount) > availableBalance}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Withdraw ₹${Number(withdrawAmount || 0).toLocaleString('en-IN')}`
                )}
              </button>
              <button onClick={() => { setShowWithdraw(false); setWithdrawAmount(''); }} className="w-full py-3 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors text-sm font-medium mt-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Success Toast */}
      {withdrawSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          Withdrawal successful! Amount sent to bank
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-sm mx-auto px-4 pb-2 pointer-events-auto">
          <div className="flex items-center justify-between rounded-2xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/40 px-2 py-1.5 shadow-lg shadow-black/5 dark:shadow-black/20">
            <button onClick={() => setDashboardView('dashboard')} className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 ${dashboardView === 'dashboard' ? 'bg-amber-500/15 text-amber-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              <BarChart3 className={`w-5 h-5 ${dashboardView === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className={`text-[10px] ${dashboardView === 'dashboard' ? 'font-semibold' : 'font-medium'}`}>Home</span>
            </button>
            <button onClick={() => setDashboardView('history')} className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 ${dashboardView === 'history' ? 'bg-amber-500/15 text-amber-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              <History className={`w-5 h-5 ${dashboardView === 'history' ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className={`text-[10px] ${dashboardView === 'history' ? 'font-semibold' : 'font-medium'}`}>History</span>
            </button>
            <button onClick={() => setDashboardView('wallet')} className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 ${dashboardView === 'wallet' ? 'bg-amber-500/15 text-amber-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              <Wallet className={`w-5 h-5 ${dashboardView === 'wallet' ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className={`text-[10px] ${dashboardView === 'wallet' ? 'font-semibold' : 'font-medium'}`}>Wallet</span>
            </button>
            <button onClick={() => setScreen('profile')} className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200">
              <User className="w-5 h-5 stroke-[1.5]" />
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
