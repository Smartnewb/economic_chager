import { create } from "zustand";

// ============================================================================
// WHALE RADAR STORE - Smart Money Tracking
// Connects to backend whale_tracker.py API endpoints
// ============================================================================

// Insider Trade Data
export interface InsiderTrade {
    symbol: string;
    companyName: string;
    reporterName: string;
    reporterTitle: string;
    transactionType: string;
    transactionDate: string;
    sharesTransacted: number;
    price: number;
    totalValue: number;
    isBuy: boolean;
    signalStrength: string;
}

// Guru Holding Data (13F Filings)
export interface GuruHolding {
    symbol: string;
    companyName: string;
    shares: number;
    value: number;
    weightPercent: number;
    changeType: string; // "new" | "increased" | "decreased" | "unchanged" | "sold"
    changeShares: number;
    changePercent: number;
    quarter: string;
    filingDate: string;
}

// Guru Info
export interface Guru {
    id: string;
    name: string;
    manager: string;
    avatar: string;
}

// Whale Alert for Radar Visualization
export interface WhaleAlert {
    alertType: string; // "insider" | "guru" | "cluster" | "options"
    symbol: string;
    headline: string;
    description: string;
    signal: string; // "bullish" | "bearish" | "neutral"
    magnitude: string; // "small" | "medium" | "large"
    timestamp: string;
    source: string;
}

// Cluster Activity Detection
export interface ClusterActivity {
    symbol: string;
    companyName: string;
    activityType: string; // "buying" | "selling"
    insiderCount: number;
    totalValue: number;
    dateRange: string;
    insiders: string[];
    urgency: string; // "low" | "medium" | "high"
}

// Consensus Picks (stocks multiple gurus are buying)
export interface ConsensusPick {
    symbol: string;
    guruCount: number;
    gurus: string[];
    totalValue: number;
}

// Radar Data for Visualization
export interface RadarBlip {
    symbol: string;
    type: string;
    signal: string;
    magnitude: number; // 0-1 scale
    angle: number; // 0-360 degrees
    distance: number; // 0-1 scale (closer = more recent)
    details: string;
}

// Whale Analysis Result from AI
interface WhaleAnalysisResult {
    spyResponse: string;
    sorosResponse: string;
    buffettResponse: string;
    burryResponse: string;
    synthesis: string;
}

interface WhaleState {
    // Data State
    insiderTrades: InsiderTrade[];
    selectedSymbolTrades: InsiderTrade[];
    gurus: Guru[];
    selectedGuruHoldings: GuruHolding[];
    whaleAlerts: WhaleAlert[];
    consensusPicks: ConsensusPick[];
    clusterActivity: ClusterActivity | null;
    radarBlips: RadarBlip[];
    putCallRatio: { ratio: number; signal: string; interpretation: string } | null;

    // UI State
    isLoadingTrades: boolean;
    isLoadingGuru: boolean;
    isLoadingAlerts: boolean;
    isLoadingRadar: boolean;
    selectedSymbol: string | null;
    selectedGuru: string | null;
    viewMode: "radar" | "insider" | "guru" | "consensus";

    // On-Demand AI State
    isAnalyzing: boolean;
    analysisResult: WhaleAnalysisResult | null;
    analysisError: string | null;
    showAnalysisPanel: boolean;

    // Actions
    fetchInsiderTrades: (symbol?: string, limit?: number) => Promise<void>;
    fetchGuruList: () => Promise<void>;
    fetchGuruHoldings: (guruId: string, limit?: number) => Promise<void>;
    fetchWhaleAlerts: (symbols?: string[], limit?: number) => Promise<void>;
    fetchConsensusPicks: (topN?: number) => Promise<void>;
    fetchClusterActivity: (symbol: string, days?: number) => Promise<void>;
    fetchRadarData: (symbols?: string[]) => Promise<void>;
    fetchPutCallRatio: (symbol?: string) => Promise<void>;
    setSelectedSymbol: (symbol: string | null) => void;
    setSelectedGuru: (guruId: string | null) => void;
    setViewMode: (mode: "radar" | "insider" | "guru" | "consensus") => void;
    requestAnalysis: (language?: string) => Promise<void>;
    closeAnalysisPanel: () => void;
    reset: () => void;
}

const API_BASE = "http://localhost:8001";

export const useWhaleStore = create<WhaleState>((set, get) => ({
    // Initial Data State
    insiderTrades: [],
    selectedSymbolTrades: [],
    gurus: [],
    selectedGuruHoldings: [],
    whaleAlerts: [],
    consensusPicks: [],
    clusterActivity: null,
    radarBlips: [],
    putCallRatio: null,

    // Initial UI State
    isLoadingTrades: false,
    isLoadingGuru: false,
    isLoadingAlerts: false,
    isLoadingRadar: false,
    selectedSymbol: null,
    selectedGuru: null,
    viewMode: "radar",

    // Initial AI State
    isAnalyzing: false,
    analysisResult: null,
    analysisError: null,
    showAnalysisPanel: false,

    // Fetch all insider trades or for a specific symbol
    fetchInsiderTrades: async (symbol?: string, limit = 50) => {
        set({ isLoadingTrades: true });

        try {
            const url = symbol
                ? `${API_BASE}/api/whale/insider/${symbol}?limit=${limit}`
                : `${API_BASE}/api/whale/insider?limit=${limit}`;

            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                const trades: InsiderTrade[] = data.trades.map((t: Record<string, unknown>) => ({
                    symbol: t.symbol,
                    companyName: t.company_name,
                    reporterName: t.reporter_name,
                    reporterTitle: t.reporter_title,
                    transactionType: t.transaction_type,
                    transactionDate: t.transaction_date,
                    sharesTransacted: t.shares_transacted,
                    price: t.price,
                    totalValue: t.total_value,
                    isBuy: t.is_buy,
                    signalStrength: t.signal_strength,
                }));

                if (symbol) {
                    set({ selectedSymbolTrades: trades, isLoadingTrades: false });
                } else {
                    set({ insiderTrades: trades, isLoadingTrades: false });
                }
            } else {
                throw new Error("API not available");
            }
        } catch (error) {
            console.error("Error fetching insider trades:", error);
            set({ isLoadingTrades: false });
        }
    },

    // Fetch list of available gurus
    fetchGuruList: async () => {
        set({ isLoadingGuru: true });

        try {
            const response = await fetch(`${API_BASE}/api/whale/guru`);

            if (response.ok) {
                const data = await response.json();
                const gurus: Guru[] = data.gurus.map((g: Record<string, unknown>) => ({
                    id: g.id,
                    name: g.name,
                    manager: g.manager,
                    avatar: g.avatar,
                }));

                set({ gurus, isLoadingGuru: false });
            } else {
                throw new Error("API not available");
            }
        } catch (error) {
            console.error("Error fetching guru list:", error);
            set({ isLoadingGuru: false });
        }
    },

    // Fetch holdings for a specific guru
    fetchGuruHoldings: async (guruId: string, limit = 20) => {
        set({ isLoadingGuru: true, selectedGuru: guruId });

        try {
            const response = await fetch(`${API_BASE}/api/whale/guru/${guruId}?limit=${limit}`);

            if (response.ok) {
                const data = await response.json();
                const holdings: GuruHolding[] = data.holdings.map((h: Record<string, unknown>) => ({
                    symbol: h.symbol,
                    companyName: h.company_name,
                    shares: h.shares,
                    value: h.value,
                    weightPercent: h.weight_percent,
                    changeType: h.change_type,
                    changeShares: h.change_shares,
                    changePercent: h.change_percent,
                    quarter: h.quarter,
                    filingDate: h.filing_date,
                }));

                set({ selectedGuruHoldings: holdings, isLoadingGuru: false });
            } else {
                throw new Error("API not available");
            }
        } catch (error) {
            console.error("Error fetching guru holdings:", error);
            set({ isLoadingGuru: false });
        }
    },

    // Fetch whale alerts
    fetchWhaleAlerts: async (symbols?: string[], limit = 20) => {
        set({ isLoadingAlerts: true });

        try {
            const symbolsParam = symbols ? `symbols=${symbols.join(",")}&` : "";
            const response = await fetch(`${API_BASE}/api/whale/alerts?${symbolsParam}limit=${limit}`);

            if (response.ok) {
                const data = await response.json();
                const alerts: WhaleAlert[] = data.alerts.map((a: Record<string, unknown>) => ({
                    alertType: a.alert_type,
                    symbol: a.symbol,
                    headline: a.headline,
                    description: a.description,
                    signal: a.signal,
                    magnitude: a.magnitude,
                    timestamp: a.timestamp,
                    source: a.source,
                }));

                set({ whaleAlerts: alerts, isLoadingAlerts: false });
            } else {
                throw new Error("API not available");
            }
        } catch (error) {
            console.error("Error fetching whale alerts:", error);
            set({ isLoadingAlerts: false });
        }
    },

    // Fetch consensus picks (stocks multiple gurus are buying)
    fetchConsensusPicks: async (topN = 10) => {
        try {
            const response = await fetch(`${API_BASE}/api/whale/consensus?top_n=${topN}`);

            if (response.ok) {
                const data = await response.json();
                const picks: ConsensusPick[] = data.consensus_picks.map((p: Record<string, unknown>) => ({
                    symbol: p.symbol,
                    guruCount: p.guru_count,
                    gurus: p.gurus,
                    totalValue: p.total_value,
                }));

                set({ consensusPicks: picks });
            }
        } catch (error) {
            console.error("Error fetching consensus picks:", error);
        }
    },

    // Fetch cluster activity for a symbol
    fetchClusterActivity: async (symbol: string, days = 30) => {
        try {
            const response = await fetch(`${API_BASE}/api/whale/cluster/${symbol}?days=${days}`);

            if (response.ok) {
                const data = await response.json();

                if (data.detected && data.cluster) {
                    const cluster: ClusterActivity = {
                        symbol: data.cluster.symbol,
                        companyName: data.cluster.company_name,
                        activityType: data.cluster.activity_type,
                        insiderCount: data.cluster.insider_count,
                        totalValue: data.cluster.total_value,
                        dateRange: data.cluster.date_range,
                        insiders: data.cluster.insiders,
                        urgency: data.cluster.urgency,
                    };
                    set({ clusterActivity: cluster });
                } else {
                    set({ clusterActivity: null });
                }
            }
        } catch (error) {
            console.error("Error fetching cluster activity:", error);
        }
    },

    // Fetch radar visualization data
    fetchRadarData: async (symbols?: string[]) => {
        set({ isLoadingRadar: true });

        try {
            const symbolsParam = symbols ? `symbols=${symbols.join(",")}` : "";
            const response = await fetch(`${API_BASE}/api/whale/radar?${symbolsParam}`);

            if (response.ok) {
                const data = await response.json();

                // Transform to radar blips for visualization
                const blips: RadarBlip[] = (data.blips || []).map((b: Record<string, unknown>, idx: number) => ({
                    symbol: b.symbol,
                    type: b.type,
                    signal: b.signal,
                    magnitude: b.magnitude || 0.5,
                    angle: (idx * 360) / (data.blips?.length || 1), // Distribute evenly
                    distance: b.distance || Math.random() * 0.8 + 0.1,
                    details: b.details || "",
                }));

                set({ radarBlips: blips, isLoadingRadar: false });
            } else {
                throw new Error("API not available");
            }
        } catch (error) {
            console.error("Error fetching radar data:", error);
            set({ isLoadingRadar: false });
        }
    },

    // Fetch put/call ratio
    fetchPutCallRatio: async (symbol = "SPY") => {
        try {
            const response = await fetch(`${API_BASE}/api/whale/put-call-ratio?symbol=${symbol}`);

            if (response.ok) {
                const data = await response.json();
                set({
                    putCallRatio: {
                        ratio: data.ratio,
                        signal: data.signal,
                        interpretation: data.interpretation,
                    },
                });
            }
        } catch (error) {
            console.error("Error fetching put/call ratio:", error);
        }
    },

    // UI Actions
    setSelectedSymbol: (symbol) => {
        set({ selectedSymbol: symbol });
        if (symbol) {
            get().fetchInsiderTrades(symbol);
            get().fetchClusterActivity(symbol);
        }
    },

    setSelectedGuru: (guruId) => {
        set({ selectedGuru: guruId });
        if (guruId) {
            get().fetchGuruHoldings(guruId);
        }
    },

    setViewMode: (mode) => {
        set({ viewMode: mode });
    },

    // On-Demand AI Analysis
    requestAnalysis: async (language = "en") => {
        const { insiderTrades, whaleAlerts, consensusPicks, clusterActivity } = get();

        set({
            isAnalyzing: true,
            analysisError: null,
            showAnalysisPanel: true,
        });

        try {
            // Check cache first
            const cacheResponse = await fetch(`${API_BASE}/api/analyze/whale/cached?language=${language}`);
            if (cacheResponse.ok) {
                const cacheData = await cacheResponse.json();
                if (cacheData.cached && cacheData.result) {
                    set({
                        analysisResult: {
                            spyResponse: cacheData.result.spy_response,
                            sorosResponse: cacheData.result.soros_response,
                            buffettResponse: cacheData.result.buffett_response,
                            burryResponse: cacheData.result.burry_response,
                            synthesis: cacheData.result.synthesis,
                        },
                        isAnalyzing: false,
                    });
                    return;
                }
            }

            // Build analysis request
            const symbols = [...new Set(insiderTrades.slice(0, 10).map((t) => t.symbol))];
            const buyCount = insiderTrades.filter((t) => t.isBuy).length;
            const sellCount = insiderTrades.length - buyCount;
            const overallSignal = buyCount > sellCount ? "bullish" : buyCount < sellCount ? "bearish" : "neutral";

            const insiderSummary = `${insiderTrades.length} trades: ${buyCount} buys, ${sellCount} sells`;
            const guruActivity = consensusPicks.length > 0
                ? `${consensusPicks.length} consensus picks: ${consensusPicks.slice(0, 3).map((p) => p.symbol).join(", ")}`
                : "No consensus picks detected";

            const response = await fetch(`${API_BASE}/api/analyze/whale`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    symbols,
                    insider_summary: insiderSummary,
                    guru_activity: guruActivity,
                    cluster_detected: clusterActivity !== null,
                    overall_signal: overallSignal,
                    language,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get analysis");
            }

            const data = await response.json();
            set({
                analysisResult: {
                    spyResponse: data.spy_response,
                    sorosResponse: data.soros_response,
                    buffettResponse: data.buffett_response,
                    burryResponse: data.burry_response,
                    synthesis: data.synthesis,
                },
                isAnalyzing: false,
            });
        } catch (error) {
            set({
                analysisError: error instanceof Error ? error.message : "Failed to analyze whale activity",
                isAnalyzing: false,
            });
        }
    },

    closeAnalysisPanel: () => {
        set({ showAnalysisPanel: false });
    },

    reset: () => {
        set({
            insiderTrades: [],
            selectedSymbolTrades: [],
            gurus: [],
            selectedGuruHoldings: [],
            whaleAlerts: [],
            consensusPicks: [],
            clusterActivity: null,
            radarBlips: [],
            putCallRatio: null,
            isLoadingTrades: false,
            isLoadingGuru: false,
            isLoadingAlerts: false,
            isLoadingRadar: false,
            selectedSymbol: null,
            selectedGuru: null,
            viewMode: "radar",
            isAnalyzing: false,
            analysisResult: null,
            analysisError: null,
            showAnalysisPanel: false,
        });
    },
}));
