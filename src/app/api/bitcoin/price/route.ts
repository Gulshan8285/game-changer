import { NextResponse } from 'next/server';

// In-memory cache for Bitcoin data
let cachedData: any = null;
let lastFetch = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Generate realistic simulated Bitcoin historical data
function generateHistoricalData() {
  const data: Array<{time: number; open: number; high: number; low: number; close: number; volume: number}> = [];
  const now = Date.now();
  let price = 6200000; // ~62,000 USD in INR equivalent starting point
  
  for (let i = 30 * 24; i >= 0; i--) { // 30 days of hourly data
    const timestamp = now - i * 3600000;
    const volatility = (Math.random() - 0.48) * 80000; // slight upward bias
    price = Math.max(5500000, Math.min(7200000, price + volatility));
    
    data.push({
      time: timestamp,
      open: price - Math.random() * 20000,
      high: price + Math.random() * 40000,
      low: price - Math.random() * 40000,
      close: price,
      volume: Math.floor(Math.random() * 5000000000) + 1000000000,
    });
  }
  
  return data;
}

export async function GET() {
  try {
    const now = Date.now();
    
    if (cachedData && now - lastFetch < CACHE_DURATION) {
      return NextResponse.json(cachedData);
    }

    // Fetch real BTC/INR price from CoinGecko
    let btcPriceInr = 0;
    let btcPriceUsd = 0;
    let change24h = 0;
    
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=inr,usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true', {
        next: { revalidate: 30 }
      });
      
      if (response.ok) {
        const data = await response.json();
        btcPriceInr = data.bitcoin.inr;
        btcPriceUsd = data.bitcoin.usd;
        change24h = data.bitcoin.inr_24h_change || 0;
      }
    } catch {
      // Fallback simulated prices
      btcPriceInr = 6500000;
      btcPriceUsd = 77500;
      change24h = 1.5;
    }

    const historicalData = generateHistoricalData();

    cachedData = {
      price: {
        inr: btcPriceInr,
        usd: btcPriceUsd,
        change24h: change24h,
        marketCap: btcPriceInr * 19500000,
        volume24h: Math.floor(btcPriceInr * 250000),
      },
      historical: historicalData,
      lastUpdated: now,
    };

    lastFetch = now;
    return NextResponse.json(cachedData);
  } catch (error) {
    console.error('Bitcoin price error:', error);
    return NextResponse.json({
      price: { inr: 6500000, usd: 77500, change24h: 1.5, marketCap: 126750000000000, volume24h: 1625000000000 },
      historical: generateHistoricalData(),
      lastUpdated: Date.now(),
    });
  }
}
