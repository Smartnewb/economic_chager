import { create } from "zustand";

// ============================================
// COMMODITY DATA TYPES
// ============================================

export type CommodityType = "oil" | "gold" | "copper";

export interface CommodityData {
    symbol: string;
    name: string;
    shortName: string;
    price: number;
    change24h: number;
    change1w: number;
    change1m: number;
    high52w: number;
    low52w: number;
    percentOfRange: number;
    unit: string;
    signal: "bullish" | "bearish" | "neutral"; // Traffic light signal
    interpretation: string; // What this commodity's move means
}

export interface CommoditySignals {
    oil: CommodityData;
    gold: CommodityData;
    copper: CommodityData;
    overallSignal: "risk_on" | "risk_off" | "mixed" | "goldilocks";
    interpretation: string;
}

// ============================================
// ECONOMIC INDICATOR DATA TYPES
// ============================================

export type IndicatorType = "pmi" | "cpi" | "gdp" | "unemployment" | "retail_sales";

export interface EconomicIndicator {
    name: string;
    shortName: string;
    country: string;
    countryCode: string;
    flag: string;
    value: number;
    previousValue: number;
    consensus: number; // Market expectation
    change: number; // vs previous
    surprise: number; // vs consensus (positive = beat, negative = miss)
    releaseDate: string;
    nextRelease: string;
    unit: string;
    isExpansion?: boolean; // For PMI: > 50 = expansion
    trend: "improving" | "worsening" | "stable";
}

export interface PMIData extends EconomicIndicator {
    type: "manufacturing" | "services" | "composite";
    expansionThreshold: number; // Usually 50
}

export interface CPIData extends EconomicIndicator {
    type: "headline" | "core";
    targetRate: number; // Central bank target (usually 2%)
    isAboveTarget: boolean;
}

// ============================================
// TRADE BALANCE DATA TYPES
// ============================================

export interface TradeBalanceData {
    country: string;
    countryCode: string;
    flag: string;
    balance: number; // Positive = surplus, negative = deficit
    exports: number;
    imports: number;
    change: number; // vs previous period
    trend: "improving" | "worsening" | "stable";
    majorPartners: {
        country: string;
        flag: string;
        volume: number;
        type: "export" | "import";
    }[];
}

// ============================================
// ECONOMIC CALENDAR EVENT
// ============================================

export interface EconomicEvent {
    id: string;
    name: string;
    country: string;
    countryCode: string;
    flag: string;
    date: string;
    time: string;
    impact: "high" | "medium" | "low";
    actual?: number;
    forecast?: number;
    previous?: number;
    unit: string;
    category: "inflation" | "employment" | "growth" | "manufacturing" | "trade" | "policy";
}

// ============================================
// STORE STATE
// ============================================

interface EconomyStore {
    // Commodity data
    commodities: CommoditySignals | null;
    isLoadingCommodities: boolean;

    // PMI data
    pmiData: PMIData[];
    isLoadingPMI: boolean;

    // CPI data
    cpiData: CPIData[];
    isLoadingCPI: boolean;

    // Trade balance
    tradeData: TradeBalanceData[];
    isLoadingTrade: boolean;

    // Economic calendar
    upcomingEvents: EconomicEvent[];
    isLoadingEvents: boolean;

    // Analysis
    showAnalysisPanel: boolean;
    isAnalyzing: boolean;
    currentAgent: string | null;
    analysisResult: EconomyAnalysisResult | null;
    analysisError: string | null;

    // Selected view
    selectedView: "commodities" | "indicators" | "calendar";

    // Actions
    fetchCommodities: () => Promise<void>;
    fetchPMI: () => Promise<void>;
    fetchCPI: () => Promise<void>;
    fetchTradeBalance: () => Promise<void>;
    fetchUpcomingEvents: () => Promise<void>;
    fetchAllData: () => Promise<void>;
    triggerAnalysis: (language?: string) => Promise<void>;
    closeAnalysisPanel: () => void;
    setSelectedView: (view: "commodities" | "indicators" | "calendar") => void;
}

// Analysis result
export interface EconomyAnalysisResult {
    kostolany_response: string;
    buffett_response: string;
    munger_response: string;
    dalio_response: string;
    synthesis: string;
}

// ============================================
// MOCK DATA GENERATORS
// ============================================

const generateMockCommodities = (): CommoditySignals => {
    const randomChange = (base: number, range: number) =>
        Math.round((base + (Math.random() - 0.5) * range) * 100) / 100;

    // Oil (WTI)
    const oilPrice = randomChange(75, 10);
    const oilChange24h = randomChange(0, 4);
    const oilChange1m = randomChange(-2, 10);
    const oilSignal: "bullish" | "bearish" | "neutral" =
        oilChange1m > 5 ? "bullish" : oilChange1m < -5 ? "bearish" : "neutral";

    // Gold
    const goldPrice = randomChange(2350, 100);
    const goldChange24h = randomChange(0, 2);
    const goldChange1m = randomChange(2, 8);
    const goldSignal: "bullish" | "bearish" | "neutral" =
        goldChange1m > 3 ? "bullish" : goldChange1m < -3 ? "bearish" : "neutral";

    // Copper
    const copperPrice = randomChange(4.2, 0.5);
    const copperChange24h = randomChange(0, 3);
    const copperChange1m = randomChange(0, 12);
    const copperSignal: "bullish" | "bearish" | "neutral" =
        copperChange1m > 5 ? "bullish" : copperChange1m < -5 ? "bearish" : "neutral";

    // Determine overall signal
    let overallSignal: "risk_on" | "risk_off" | "mixed" | "goldilocks";
    let interpretation: string;

    if (oilSignal === "bearish" && copperSignal === "bullish" && goldSignal === "neutral") {
        overallSignal = "goldilocks";
        interpretation = "골디락스 시나리오: 인플레 하락 + 제조업 회복. 주식에 최적의 환경입니다.";
    } else if (goldSignal === "bullish" && copperSignal === "bearish") {
        overallSignal = "risk_off";
        interpretation = "공포 모드: 안전자산(금) 급등, 산업금속(구리) 급락. 경기 침체 신호입니다.";
    } else if (oilSignal === "bullish" && copperSignal === "bullish") {
        overallSignal = "risk_on";
        interpretation = "과열 경고: 원자재 전반 상승. 인플레이션 압력이 커지고 있습니다.";
    } else {
        overallSignal = "mixed";
        interpretation = "혼조세: 원자재 시장이 방향성을 찾지 못하고 있습니다. 관망 필요.";
    }

    return {
        oil: {
            symbol: "CL=F",
            name: "WTI Crude Oil",
            shortName: "WTI",
            price: oilPrice,
            change24h: oilChange24h,
            change1w: randomChange(-1, 6),
            change1m: oilChange1m,
            high52w: 95,
            low52w: 65,
            percentOfRange: Math.round(((oilPrice - 65) / (95 - 65)) * 100),
            unit: "$/barrel",
            signal: oilSignal,
            interpretation:
                oilSignal === "bullish"
                    ? "유가 상승 → 인플레 압력 ↑, 운송/항공 비용 ↑"
                    : oilSignal === "bearish"
                    ? "유가 하락 → 인플레 완화, 소비자 구매력 ↑"
                    : "유가 안정 → 시장 균형 상태",
        },
        gold: {
            symbol: "GC=F",
            name: "Gold Futures",
            shortName: "Gold",
            price: goldPrice,
            change24h: goldChange24h,
            change1w: randomChange(0.5, 4),
            change1m: goldChange1m,
            high52w: 2500,
            low52w: 1900,
            percentOfRange: Math.round(((goldPrice - 1900) / (2500 - 1900)) * 100),
            unit: "$/oz",
            signal: goldSignal,
            interpretation:
                goldSignal === "bullish"
                    ? "금 급등 → 공포 심리, 달러 약세, 인플레 헤지 수요"
                    : goldSignal === "bearish"
                    ? "금 하락 → 위험자산 선호, 금리 상승 영향"
                    : "금 안정 → 시장 불확실성 제한적",
        },
        copper: {
            symbol: "HG=F",
            name: "Copper Futures",
            shortName: "Copper",
            price: copperPrice,
            change24h: copperChange24h,
            change1w: randomChange(0, 5),
            change1m: copperChange1m,
            high52w: 5.0,
            low52w: 3.5,
            percentOfRange: Math.round(((copperPrice - 3.5) / (5.0 - 3.5)) * 100),
            unit: "$/lb",
            signal: copperSignal,
            interpretation:
                copperSignal === "bullish"
                    ? "구리(Dr. Copper) 상승 → 제조업 회복, 경기 확장 신호"
                    : copperSignal === "bearish"
                    ? "구리 급락 → 경기 침체 경고! 산업 수요 감소"
                    : "구리 횡보 → 제조업 현상 유지",
        },
        overallSignal,
        interpretation,
    };
};

const generateMockPMI = (): PMIData[] => {
    const countries = [
        { code: "US", name: "United States", flag: "🇺🇸" },
        { code: "CN", name: "China", flag: "🇨🇳" },
        { code: "DE", name: "Germany", flag: "🇩🇪" },
        { code: "JP", name: "Japan", flag: "🇯🇵" },
        { code: "KR", name: "South Korea", flag: "🇰🇷" },
        { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    ];

    const basePMI: Record<string, number> = {
        US: 52.5,
        CN: 49.5,
        DE: 47.8,
        JP: 50.2,
        KR: 51.0,
        GB: 48.5,
    };

    return countries.map((country) => {
        const base = basePMI[country.code] || 50;
        const value = Math.round((base + (Math.random() - 0.5) * 4) * 10) / 10;
        const previousValue = Math.round((base + (Math.random() - 0.5) * 3) * 10) / 10;
        const consensus = Math.round((base + (Math.random() - 0.5) * 2) * 10) / 10;

        return {
            name: "Manufacturing PMI",
            shortName: "PMI",
            country: country.name,
            countryCode: country.code,
            flag: country.flag,
            value,
            previousValue,
            consensus,
            change: Math.round((value - previousValue) * 10) / 10,
            surprise: Math.round((value - consensus) * 10) / 10,
            releaseDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            nextRelease: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            unit: "index",
            type: "manufacturing" as const,
            expansionThreshold: 50,
            isExpansion: value > 50,
            trend:
                value > previousValue
                    ? "improving"
                    : value < previousValue
                    ? "worsening"
                    : "stable",
        };
    });
};

const generateMockCPI = (): CPIData[] => {
    const countries = [
        { code: "US", name: "United States", flag: "🇺🇸", target: 2.0 },
        { code: "EU", name: "Eurozone", flag: "🇪🇺", target: 2.0 },
        { code: "JP", name: "Japan", flag: "🇯🇵", target: 2.0 },
        { code: "GB", name: "United Kingdom", flag: "🇬🇧", target: 2.0 },
        { code: "KR", name: "South Korea", flag: "🇰🇷", target: 2.0 },
        { code: "CN", name: "China", flag: "🇨🇳", target: 3.0 },
    ];

    const baseCPI: Record<string, number> = {
        US: 3.4,
        EU: 2.8,
        JP: 2.6,
        GB: 4.0,
        KR: 2.8,
        CN: 0.7,
    };

    return countries.map((country) => {
        const base = baseCPI[country.code] || 2.5;
        const value = Math.round((base + (Math.random() - 0.5) * 0.6) * 10) / 10;
        const previousValue = Math.round((base + (Math.random() - 0.5) * 0.4) * 10) / 10;
        const consensus = Math.round((base + (Math.random() - 0.5) * 0.3) * 10) / 10;

        return {
            name: "Consumer Price Index (YoY)",
            shortName: "CPI",
            country: country.name,
            countryCode: country.code,
            flag: country.flag,
            value,
            previousValue,
            consensus,
            change: Math.round((value - previousValue) * 10) / 10,
            surprise: Math.round((value - consensus) * 10) / 10,
            releaseDate: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            nextRelease: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            unit: "%",
            type: "headline" as const,
            targetRate: country.target,
            isAboveTarget: value > country.target,
            trend:
                value > previousValue
                    ? "worsening" // Higher inflation is worse
                    : value < previousValue
                    ? "improving"
                    : "stable",
        };
    });
};

const generateMockUpcomingEvents = (): EconomicEvent[] => {
    const events: Omit<EconomicEvent, "id" | "date" | "time">[] = [
        {
            name: "US CPI (YoY)",
            country: "United States",
            countryCode: "US",
            flag: "🇺🇸",
            impact: "high",
            forecast: 3.2,
            previous: 3.4,
            unit: "%",
            category: "inflation",
        },
        {
            name: "Fed Interest Rate Decision",
            country: "United States",
            countryCode: "US",
            flag: "🇺🇸",
            impact: "high",
            forecast: 5.5,
            previous: 5.5,
            unit: "%",
            category: "policy",
        },
        {
            name: "US Non-Farm Payrolls",
            country: "United States",
            countryCode: "US",
            flag: "🇺🇸",
            impact: "high",
            forecast: 180,
            previous: 275,
            unit: "K",
            category: "employment",
        },
        {
            name: "China Manufacturing PMI",
            country: "China",
            countryCode: "CN",
            flag: "🇨🇳",
            impact: "high",
            forecast: 50.2,
            previous: 49.5,
            unit: "index",
            category: "manufacturing",
        },
        {
            name: "ECB Interest Rate Decision",
            country: "Eurozone",
            countryCode: "EU",
            flag: "🇪🇺",
            impact: "high",
            forecast: 4.5,
            previous: 4.5,
            unit: "%",
            category: "policy",
        },
        {
            name: "Japan GDP (QoQ)",
            country: "Japan",
            countryCode: "JP",
            flag: "🇯🇵",
            impact: "medium",
            forecast: 0.3,
            previous: -0.1,
            unit: "%",
            category: "growth",
        },
        {
            name: "UK Retail Sales (MoM)",
            country: "United Kingdom",
            countryCode: "GB",
            flag: "🇬🇧",
            impact: "medium",
            forecast: 0.4,
            previous: -0.2,
            unit: "%",
            category: "growth",
        },
        {
            name: "Germany ZEW Economic Sentiment",
            country: "Germany",
            countryCode: "DE",
            flag: "🇩🇪",
            impact: "medium",
            forecast: 15.0,
            previous: 10.5,
            unit: "index",
            category: "growth",
        },
    ];

    return events.map((event, index) => ({
        ...event,
        id: `event-${index}`,
        date: new Date(Date.now() + (index + 1) * 2 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        time: `${8 + Math.floor(Math.random() * 10)}:${Math.random() > 0.5 ? "00" : "30"}`,
    }));
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useEconomyStore = create<EconomyStore>((set, get) => ({
    // Initial state
    commodities: null,
    isLoadingCommodities: false,
    pmiData: [],
    isLoadingPMI: false,
    cpiData: [],
    isLoadingCPI: false,
    tradeData: [],
    isLoadingTrade: false,
    upcomingEvents: [],
    isLoadingEvents: false,
    showAnalysisPanel: false,
    isAnalyzing: false,
    currentAgent: null,
    analysisResult: null,
    analysisError: null,
    selectedView: "commodities",

    fetchCommodities: async () => {
        set({ isLoadingCommodities: true });
        try {
            // Mock delay
            await new Promise((resolve) => setTimeout(resolve, 500));
            const data = generateMockCommodities();
            set({ commodities: data, isLoadingCommodities: false });
        } catch (error) {
            console.error("Failed to fetch commodities:", error);
            set({ isLoadingCommodities: false });
        }
    },

    fetchPMI: async () => {
        set({ isLoadingPMI: true });
        try {
            await new Promise((resolve) => setTimeout(resolve, 400));
            const data = generateMockPMI();
            set({ pmiData: data, isLoadingPMI: false });
        } catch (error) {
            console.error("Failed to fetch PMI:", error);
            set({ isLoadingPMI: false });
        }
    },

    fetchCPI: async () => {
        set({ isLoadingCPI: true });
        try {
            await new Promise((resolve) => setTimeout(resolve, 400));
            const data = generateMockCPI();
            set({ cpiData: data, isLoadingCPI: false });
        } catch (error) {
            console.error("Failed to fetch CPI:", error);
            set({ isLoadingCPI: false });
        }
    },

    fetchTradeBalance: async () => {
        set({ isLoadingTrade: true });
        try {
            await new Promise((resolve) => setTimeout(resolve, 400));
            // Trade balance mock data would go here
            set({ isLoadingTrade: false });
        } catch (error) {
            console.error("Failed to fetch trade balance:", error);
            set({ isLoadingTrade: false });
        }
    },

    fetchUpcomingEvents: async () => {
        set({ isLoadingEvents: true });
        try {
            await new Promise((resolve) => setTimeout(resolve, 300));
            const data = generateMockUpcomingEvents();
            set({ upcomingEvents: data, isLoadingEvents: false });
        } catch (error) {
            console.error("Failed to fetch events:", error);
            set({ isLoadingEvents: false });
        }
    },

    fetchAllData: async () => {
        const { fetchCommodities, fetchPMI, fetchCPI, fetchUpcomingEvents } = get();
        await Promise.all([fetchCommodities(), fetchPMI(), fetchCPI(), fetchUpcomingEvents()]);
    },

    triggerAnalysis: async (language = "en") => {
        const { commodities, pmiData, cpiData } = get();
        if (!commodities) return;

        set({
            showAnalysisPanel: true,
            isAnalyzing: true,
            currentAgent: "kostolany",
            analysisResult: null,
            analysisError: null,
        });

        try {
            // First, check if there's a cached analysis for today
            const cacheResponse = await fetch(`http://localhost:8001/api/analyze/economy/cached?language=${language}`);
            if (cacheResponse.ok) {
                const cacheData = await cacheResponse.json();
                if (cacheData.cached && cacheData.result) {
                    // Use cached result
                    set({
                        isAnalyzing: false,
                        currentAgent: null,
                        analysisResult: cacheData.result,
                    });
                    return;
                }
            }

            // No cache available, request new analysis
            const response = await fetch("http://localhost:8001/api/analyze/economy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    oil_price: commodities.oil.price,
                    oil_change: commodities.oil.change1m,
                    gold_price: commodities.gold.price,
                    gold_change: commodities.gold.change1m,
                    copper_price: commodities.copper.price,
                    copper_change: commodities.copper.change1m,
                    commodity_signal: commodities.overallSignal,
                    us_pmi: pmiData.find((p) => p.countryCode === "US")?.value || 50,
                    us_cpi: cpiData.find((c) => c.countryCode === "US")?.value || 3.0,
                    language: language,
                }),
            });

            if (!response.ok) throw new Error("Analysis failed");

            const result = await response.json();
            set({
                isAnalyzing: false,
                currentAgent: null,
                analysisResult: result,
            });
        } catch (error) {
            console.error("Analysis error:", error);
            set({
                isAnalyzing: false,
                currentAgent: null,
                analysisError: "Failed to run economy analysis. Please try again.",
            });
        }
    },

    closeAnalysisPanel: () =>
        set({
            showAnalysisPanel: false,
            // Keep analysisResult so user can reopen panel without re-analyzing
        }),

    setSelectedView: (view) => set({ selectedView: view }),
}));
