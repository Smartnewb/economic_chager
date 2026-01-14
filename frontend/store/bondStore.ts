import { create } from "zustand";

// Treasury Yield Data Point
interface YieldDataPoint {
    maturity: string; // 1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y
    yield: number;
    date: string;
}

// Historical Yield Curve for comparison
interface YieldCurve {
    date: string;
    data: YieldDataPoint[];
}

// Global Bond Yield (10Y benchmark for each country)
export interface GlobalBondYield {
    country: string;
    countryCode: string;
    flag: string;
    yield10Y: number;
    change24h: number;
    spread_vs_us: number; // Spread vs US 10Y
    trend: "up" | "down" | "flat";
}

// Bond Flow between countries
export interface BondFlow {
    from: string;
    to: string;
    volume: number; // 0-1 scale
    type: "flight_to_safety" | "yield_seeking" | "diversification";
}

// Bond Analysis Result from AI
interface BondAnalysisResult {
    yield2Y: number;
    yield10Y: number;
    spread: number;
    kostolany_response: string;
    buffett_response: string;
    munger_response: string;
    dalio_response: string;
    synthesis: string;
}

// Current market metrics
interface BondMetrics {
    yield2Y: number;
    yield10Y: number;
    spread: number; // 10Y - 2Y
    isInverted: boolean;
    lastUpdated: string;
}

interface BondState {
    // Data State
    currentCurve: YieldCurve | null;
    previousCurve: YieldCurve | null; // For comparison (last month)
    metrics: BondMetrics | null;

    // Global Bond Data
    globalBonds: GlobalBondYield[];
    bondFlows: BondFlow[];
    selectedCountry: string; // Which country user is focused on

    // UI State
    isLoadingData: boolean;
    selectedMetric: "2Y" | "10Y" | "spread" | "curve" | "global"; // What user is looking at

    // On-Demand AI State
    isAnalyzing: boolean;
    currentAgent: string | null;
    analysisResult: BondAnalysisResult | null;
    analysisError: string | null;
    showAnalysisPanel: boolean;

    // Actions
    fetchBondData: () => Promise<void>;
    setSelectedMetric: (metric: "2Y" | "10Y" | "spread" | "curve" | "global") => void;
    setSelectedCountry: (country: string) => void;
    requestAnalysis: (language?: string) => Promise<void>;
    closeAnalysisPanel: () => void;
    reset: () => void;
}

// Generate mock global bond data
const generateMockGlobalBonds = (usYield10Y: number): GlobalBondYield[] => {
    const getTrend = (): "up" | "down" | "flat" => {
        const r = Math.random();
        if (r > 0.6) return "up";
        if (r > 0.3) return "down";
        return "flat";
    };

    const bonds: GlobalBondYield[] = [
        {
            country: "United States",
            countryCode: "US",
            flag: "🇺🇸",
            yield10Y: usYield10Y,
            change24h: Math.round((Math.random() * 0.1 - 0.05) * 100) / 100,
            spread_vs_us: 0,
            trend: getTrend(),
        },
        {
            country: "Germany",
            countryCode: "DE",
            flag: "🇩🇪",
            yield10Y: Math.round((2.35 + Math.random() * 0.2 - 0.1) * 100) / 100,
            change24h: Math.round((Math.random() * 0.08 - 0.04) * 100) / 100,
            spread_vs_us: 0,
            trend: getTrend(),
        },
        {
            country: "Japan",
            countryCode: "JP",
            flag: "🇯🇵",
            yield10Y: Math.round((0.95 + Math.random() * 0.1 - 0.05) * 100) / 100,
            change24h: Math.round((Math.random() * 0.05 - 0.025) * 100) / 100,
            spread_vs_us: 0,
            trend: getTrend(),
        },
        {
            country: "United Kingdom",
            countryCode: "GB",
            flag: "🇬🇧",
            yield10Y: Math.round((4.15 + Math.random() * 0.2 - 0.1) * 100) / 100,
            change24h: Math.round((Math.random() * 0.08 - 0.04) * 100) / 100,
            spread_vs_us: 0,
            trend: getTrend(),
        },
        {
            country: "China",
            countryCode: "CN",
            flag: "🇨🇳",
            yield10Y: Math.round((2.25 + Math.random() * 0.1 - 0.05) * 100) / 100,
            change24h: Math.round((Math.random() * 0.04 - 0.02) * 100) / 100,
            spread_vs_us: 0,
            trend: getTrend(),
        },
        {
            country: "France",
            countryCode: "FR",
            flag: "🇫🇷",
            yield10Y: Math.round((2.95 + Math.random() * 0.15 - 0.075) * 100) / 100,
            change24h: Math.round((Math.random() * 0.06 - 0.03) * 100) / 100,
            spread_vs_us: 0,
            trend: getTrend(),
        },
        {
            country: "Italy",
            countryCode: "IT",
            flag: "🇮🇹",
            yield10Y: Math.round((3.65 + Math.random() * 0.2 - 0.1) * 100) / 100,
            change24h: Math.round((Math.random() * 0.1 - 0.05) * 100) / 100,
            spread_vs_us: 0,
            trend: getTrend(),
        },
        {
            country: "Australia",
            countryCode: "AU",
            flag: "🇦🇺",
            yield10Y: Math.round((4.25 + Math.random() * 0.15 - 0.075) * 100) / 100,
            change24h: Math.round((Math.random() * 0.08 - 0.04) * 100) / 100,
            spread_vs_us: 0,
            trend: getTrend(),
        },
    ];

    return bonds.map(bond => ({
        ...bond,
        spread_vs_us: Math.round((bond.yield10Y - usYield10Y) * 100) / 100,
    }));
};

// Generate mock bond flows
const generateMockBondFlows = (): BondFlow[] => {
    return [
        { from: "JP", to: "US", volume: 0.8, type: "flight_to_safety" },
        { from: "EU", to: "US", volume: 0.6, type: "yield_seeking" },
        { from: "CN", to: "US", volume: 0.5, type: "diversification" },
        { from: "US", to: "DE", volume: 0.3, type: "diversification" },
        { from: "GB", to: "US", volume: 0.4, type: "yield_seeking" },
        { from: "AU", to: "US", volume: 0.35, type: "yield_seeking" },
    ];
};

// Mock data for development (will be replaced with FRED API)
const generateMockYieldCurve = (date: string, shift: number = 0): YieldCurve => {
    const maturities = ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"];
    const baseYields = [5.45, 5.40, 5.35, 5.10, 4.85, 4.60, 4.45, 4.50, 4.55, 4.80, 4.70];

    return {
        date,
        data: maturities.map((maturity, idx) => ({
            maturity,
            yield: Math.round((baseYields[idx] + shift + (Math.random() * 0.1 - 0.05)) * 100) / 100,
            date,
        })),
    };
};

export const useBondStore = create<BondState>((set, get) => ({
    // Initial Data State
    currentCurve: null,
    previousCurve: null,
    metrics: null,

    // Global Bond Data
    globalBonds: [],
    bondFlows: [],
    selectedCountry: "US",

    // Initial UI State
    isLoadingData: false,
    selectedMetric: "curve",

    // Initial On-Demand AI State
    isAnalyzing: false,
    currentAgent: null,
    analysisResult: null,
    analysisError: null,
    showAnalysisPanel: false,

    // Fetch Bond Data from API
    fetchBondData: async () => {
        set({ isLoadingData: true });

        try {
            // Try to fetch from API first
            const response = await fetch("http://localhost:8000/api/bonds/yields");

            if (response.ok) {
                const data = await response.json();
                // Map API response (yield_value) to our format (yield)
                const mapCurveData = (curve: { date: string; data: Array<{ maturity: string; yield_value: number; date: string }> }): YieldCurve => ({
                    date: curve.date,
                    data: curve.data.map((d) => ({
                        maturity: d.maturity,
                        yield: d.yield_value,
                        date: d.date,
                    })),
                });
                const mappedCurrentCurve = mapCurveData(data.current_curve);
                const mappedPreviousCurve = mapCurveData(data.previous_curve);
                const yield2Y = mappedCurrentCurve.data.find((d) => d.maturity === "2Y")?.yield || 0;
                const yield10Y = mappedCurrentCurve.data.find((d) => d.maturity === "10Y")?.yield || 0;
                const spread = Math.round((yield10Y - yield2Y) * 100) / 100;

                // Generate global bond data based on US 10Y yield
                const globalBonds = generateMockGlobalBonds(yield10Y);
                const bondFlows = generateMockBondFlows();

                set({
                    currentCurve: mappedCurrentCurve,
                    previousCurve: mappedPreviousCurve,
                    metrics: {
                        yield2Y,
                        yield10Y,
                        spread,
                        isInverted: spread < 0,
                        lastUpdated: new Date().toISOString(),
                    },
                    globalBonds,
                    bondFlows,
                    isLoadingData: false,
                });
            } else {
                throw new Error("API not available");
            }
        } catch {
            // Fallback to mock data if API is not available
            const today = new Date().toISOString().split("T")[0];
            const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

            const currentCurve = generateMockYieldCurve(today, 0);
            const previousCurve = generateMockYieldCurve(lastMonth, -0.15);

            const yield2Y = currentCurve.data.find(d => d.maturity === "2Y")?.yield || 0;
            const yield10Y = currentCurve.data.find(d => d.maturity === "10Y")?.yield || 0;
            const spread = Math.round((yield10Y - yield2Y) * 100) / 100;

            // Generate global bond data based on US 10Y yield
            const globalBonds = generateMockGlobalBonds(yield10Y);
            const bondFlows = generateMockBondFlows();

            set({
                currentCurve,
                previousCurve,
                metrics: {
                    yield2Y,
                    yield10Y,
                    spread,
                    isInverted: spread < 0,
                    lastUpdated: new Date().toISOString(),
                },
                globalBonds,
                bondFlows,
                isLoadingData: false,
            });
        }
    },

    // Set selected metric for analysis context
    setSelectedMetric: (metric) => {
        set({ selectedMetric: metric });
    },

    // Set selected country for global bond view
    setSelectedCountry: (country) => {
        set({ selectedCountry: country });
    },

    // On-Demand: Request AI Analysis (with daily cache support)
    requestAnalysis: async (language = "en") => {
        const { metrics, selectedMetric, currentCurve } = get();

        if (!metrics) {
            set({ analysisError: "No bond data available. Please wait for data to load." });
            return;
        }

        set({
            isAnalyzing: true,
            analysisError: null,
            currentAgent: "kostolany", // Start with Kostolany
            showAnalysisPanel: true,
        });

        try {
            // First, check if there's a cached analysis for today
            const cacheResponse = await fetch(`http://localhost:8000/api/analyze/bonds/cached?language=${language}`);
            if (cacheResponse.ok) {
                const cacheData = await cacheResponse.json();
                if (cacheData.cached && cacheData.result) {
                    // Use cached result
                    set({
                        analysisResult: {
                            yield2Y: metrics.yield2Y,
                            yield10Y: metrics.yield10Y,
                            spread: metrics.spread,
                            kostolany_response: cacheData.result.kostolany_response,
                            buffett_response: cacheData.result.buffett_response,
                            munger_response: cacheData.result.munger_response,
                            dalio_response: cacheData.result.dalio_response,
                            synthesis: cacheData.result.synthesis,
                        },
                        isAnalyzing: false,
                        currentAgent: null,
                    });
                    return;
                }
            }

            // No cache available, request new analysis
            const response = await fetch("http://localhost:8000/api/analyze/bonds", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    yield_2y: metrics.yield2Y,
                    yield_10y: metrics.yield10Y,
                    spread: metrics.spread,
                    is_inverted: metrics.isInverted,
                    selected_metric: selectedMetric,
                    curve_data: currentCurve?.data,
                    language: language,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get analysis");
            }

            const data = await response.json();
            set({
                analysisResult: {
                    yield2Y: metrics.yield2Y,
                    yield10Y: metrics.yield10Y,
                    spread: metrics.spread,
                    kostolany_response: data.kostolany_response,
                    buffett_response: data.buffett_response,
                    munger_response: data.munger_response,
                    dalio_response: data.dalio_response,
                    synthesis: data.synthesis,
                },
                isAnalyzing: false,
                currentAgent: null,
            });
        } catch (error) {
            set({
                analysisError: error instanceof Error ? error.message : "Failed to analyze bond data",
                isAnalyzing: false,
                currentAgent: null,
            });
        }
    },

    // Close the analysis panel
    closeAnalysisPanel: () => {
        set({ showAnalysisPanel: false });
    },

    // Reset all state
    reset: () => {
        set({
            currentCurve: null,
            previousCurve: null,
            metrics: null,
            globalBonds: [],
            bondFlows: [],
            selectedCountry: "US",
            isLoadingData: false,
            selectedMetric: "curve",
            isAnalyzing: false,
            currentAgent: null,
            analysisResult: null,
            analysisError: null,
            showAnalysisPanel: false,
        });
    },
}));
