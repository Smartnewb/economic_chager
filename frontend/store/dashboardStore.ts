import { create } from 'zustand';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface MarketHealth {
  vix: number;
  vixStatus: 'EXTREME_FEAR' | 'HIGH_FEAR' | 'FEAR' | 'NORMAL' | 'COMPLACENT';
  spread10y2y: number;
  spreadStatus: 'INVERTED' | 'FLAT' | 'NORMAL' | 'STEEP';
  creditSpread: number | null;
}

interface WhaleActivity {
  topAlerts: Array<{ symbol: string; headline: string; signal: string }>;
  insiderCount: number;
  guruCount: number;
  consensusSymbol: string | null;
}

interface EconomicSnapshot {
  pmiComposite: number | null;
  pmiTrend: 'expanding' | 'contracting' | 'neutral';
  drCopperChange: number | null;
  drCopperStatus: 'bullish' | 'bearish' | 'neutral';
  inflation: number | null;
}

interface FXFlows {
  dxyValue: number | null;
  dxyChange: number | null;
  dxyDirection: 'up' | 'down' | 'flat';
  topFlows: Array<{ from: string; to: string; sentiment: string }>;
  riskSentiment: 'risk_on' | 'risk_off' | 'neutral';
}

interface DashboardData {
  marketHealth: MarketHealth | null;
  whaleActivity: WhaleActivity | null;
  economicSnapshot: EconomicSnapshot | null;
  fxFlows: FXFlows | null;
}

interface DashboardStore {
  data: DashboardData;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  fetchDashboardData: () => Promise<void>;
}

function getVixStatus(vix: number): MarketHealth['vixStatus'] {
  if (vix >= 35) return 'EXTREME_FEAR';
  if (vix >= 30) return 'HIGH_FEAR';
  if (vix >= 25) return 'FEAR';
  if (vix >= 15) return 'NORMAL';
  return 'COMPLACENT';
}

function getSpreadStatus(spread: number): MarketHealth['spreadStatus'] {
  if (spread < -0.2) return 'INVERTED';
  if (spread < 0.2) return 'FLAT';
  if (spread < 1.0) return 'NORMAL';
  return 'STEEP';
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  data: {
    marketHealth: null,
    whaleActivity: null,
    economicSnapshot: null,
    fxFlows: null,
  },
  loading: false,
  error: null,
  lastFetched: null,

  fetchDashboardData: async () => {
    const state = get();
    if (state.loading) return;
    if (state.lastFetched && Date.now() - state.lastFetched.getTime() < 60000) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const results = await Promise.allSettled([
        fetch(`${API_BASE}/api/stocks/data`).then(r => r.json()),
        fetch(`${API_BASE}/api/bonds/data`).then(r => r.json()),
        fetch(`${API_BASE}/api/whale/radar`).then(r => r.json()),
        fetch(`${API_BASE}/api/economy/data`).then(r => r.json()),
        fetch(`${API_BASE}/api/fx/rates`).then(r => r.json()),
      ]);

      const [stocksResult, bondsResult, whaleResult, economyResult, fxResult] = results;

      const stocks = stocksResult.status === 'fulfilled' ? stocksResult.value : null;
      const bonds = bondsResult.status === 'fulfilled' ? bondsResult.value : null;
      const whale = whaleResult.status === 'fulfilled' ? whaleResult.value : null;
      const economy = economyResult.status === 'fulfilled' ? economyResult.value : null;
      const fx = fxResult.status === 'fulfilled' ? fxResult.value : null;

      const vixValue = stocks?.vix?.value ?? stocks?.volatility?.vix ?? 20;
      const spread = bonds?.current_curve?.spread_10y_2y ?? bonds?.yield_curve?.spread ?? 0;

      const marketHealth: MarketHealth = {
        vix: vixValue,
        vixStatus: getVixStatus(vixValue),
        spread10y2y: spread,
        spreadStatus: getSpreadStatus(spread),
        creditSpread: bonds?.credit_spreads?.investment_grade ?? null,
      };

      const blips = whale?.blips ?? whale?.alerts ?? [];
      const whaleActivity: WhaleActivity = {
        topAlerts: blips.slice(0, 3).map((a: { symbol?: string; headline?: string; label?: string; signal?: string }) => ({
          symbol: a.symbol ?? 'N/A',
          headline: a.headline ?? a.label ?? '',
          signal: a.signal ?? 'neutral',
        })),
        insiderCount: blips.length,
        guruCount: whale?.summary?.guru_holdings_count ?? 0,
        consensusSymbol: whale?.summary?.top_consensus ?? null,
      };

      const pmiData = economy?.pmi_data?.[0];
      const copperData = economy?.commodities?.find?.((c: { name?: string }) => c.name?.toLowerCase().includes('copper'));
      const economicSnapshot: EconomicSnapshot = {
        pmiComposite: pmiData?.composite ?? pmiData?.manufacturing ?? null,
        pmiTrend: (pmiData?.composite ?? pmiData?.manufacturing ?? 50) >= 50 ? 'expanding' : 'contracting',
        drCopperChange: copperData?.change_pct ?? null,
        drCopperStatus: (copperData?.change_pct ?? 0) > 0 ? 'bullish' : (copperData?.change_pct ?? 0) < 0 ? 'bearish' : 'neutral',
        inflation: economy?.inflation_data?.headline ?? null,
      };

      const dxyData = fx?.rates?.find?.((r: { pair?: string }) => r.pair === 'DXY') ?? fx?.dxy;
      const fxFlows: FXFlows = {
        dxyValue: dxyData?.value ?? dxyData?.rate ?? null,
        dxyChange: dxyData?.change_24h ?? dxyData?.change ?? null,
        dxyDirection: (dxyData?.change_24h ?? dxyData?.change ?? 0) > 0 ? 'up' : (dxyData?.change_24h ?? dxyData?.change ?? 0) < 0 ? 'down' : 'flat',
        topFlows: fx?.flows?.slice?.(0, 3) ?? [],
        riskSentiment: fx?.market_sentiment ?? fx?.sentiment ?? 'neutral',
      };

      set({
        data: {
          marketHealth,
          whaleActivity,
          economicSnapshot,
          fxFlows,
        },
        loading: false,
        lastFetched: new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
      set({ error: message, loading: false });
    }
  },
}));
