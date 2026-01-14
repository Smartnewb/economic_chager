import { create } from "zustand";

// Currency Pair Data
interface CurrencyPairData {
    pair: string; // USD/JPY, EUR/USD, etc.
    rate: number;
    change24h: number; // % change
    high24h: number;
    low24h: number;
    timestamp: string;
}

// Dollar Index Data
interface DollarIndexData {
    value: number;
    change24h: number;
    trend: "strong" | "neutral" | "weak";
}

// Capital Flow Data for Globe
interface CapitalFlow {
    from: string;
    to: string;
    volume: number; // 0-1 scale
    type: "risk_on" | "risk_off";
}

// FX Analysis Result from AI
interface FXAnalysisResult {
    dollarIndex: number;
    majorPairs: CurrencyPairData[];
    kostolany_response: string;
    buffett_response: string;
    munger_response: string;
    dalio_response: string;
    synthesis: string;
}

// Current market metrics
interface FXMetrics {
    dollarIndex: DollarIndexData;
    majorPairs: CurrencyPairData[];
    capitalFlows: CapitalFlow[];
    riskSentiment: "risk_on" | "risk_off" | "neutral";
    lastUpdated: string;
}

interface FXState {
    // Data State
    metrics: FXMetrics | null;

    // UI State
    isLoadingData: boolean;
    selectedPair: string; // Which pair user is focusing on

    // On-Demand AI State
    isAnalyzing: boolean;
    currentAgent: string | null;
    analysisResult: FXAnalysisResult | null;
    analysisError: string | null;
    showAnalysisPanel: boolean;

    // Actions
    fetchFXData: () => Promise<void>;
    setSelectedPair: (pair: string) => void;
    requestAnalysis: (language?: string) => Promise<void>;
    closeAnalysisPanel: () => void;
    reset: () => void;
}

// Mock data generator
const generateMockFXData = (): FXMetrics => {
    const dollarStrength = 104.5 + (Math.random() * 2 - 1);
    const isStrongDollar = dollarStrength > 104;

    return {
        dollarIndex: {
            value: Math.round(dollarStrength * 100) / 100,
            change24h: Math.round((Math.random() * 1.5 - 0.75) * 100) / 100,
            trend: dollarStrength > 105 ? "strong" : dollarStrength < 103 ? "weak" : "neutral",
        },
        majorPairs: [
            {
                pair: "USD/JPY",
                rate: 154.5 + (Math.random() * 2 - 1),
                change24h: Math.round((Math.random() * 1.5 - 0.75) * 100) / 100,
                high24h: 155.2,
                low24h: 153.8,
                timestamp: new Date().toISOString(),
            },
            {
                pair: "EUR/USD",
                rate: 1.085 + (Math.random() * 0.01 - 0.005),
                change24h: Math.round((Math.random() * 1 - 0.5) * 100) / 100,
                high24h: 1.092,
                low24h: 1.082,
                timestamp: new Date().toISOString(),
            },
            {
                pair: "GBP/USD",
                rate: 1.27 + (Math.random() * 0.01 - 0.005),
                change24h: Math.round((Math.random() * 1 - 0.5) * 100) / 100,
                high24h: 1.278,
                low24h: 1.265,
                timestamp: new Date().toISOString(),
            },
            {
                pair: "USD/CNY",
                rate: 7.24 + (Math.random() * 0.02 - 0.01),
                change24h: Math.round((Math.random() * 0.5 - 0.25) * 100) / 100,
                high24h: 7.26,
                low24h: 7.22,
                timestamp: new Date().toISOString(),
            },
            {
                pair: "USD/KRW",
                rate: 1380 + (Math.random() * 20 - 10),
                change24h: Math.round((Math.random() * 1 - 0.5) * 100) / 100,
                high24h: 1395,
                low24h: 1370,
                timestamp: new Date().toISOString(),
            },
        ],
        capitalFlows: [
            { from: "USA", to: "Japan", volume: isStrongDollar ? 0.3 : 0.6, type: isStrongDollar ? "risk_off" : "risk_on" },
            { from: "EU", to: "USA", volume: isStrongDollar ? 0.7 : 0.4, type: isStrongDollar ? "risk_off" : "risk_on" },
            { from: "USA", to: "China", volume: 0.4, type: "risk_on" },
            { from: "Japan", to: "USA", volume: isStrongDollar ? 0.5 : 0.3, type: "risk_off" },
            { from: "USA", to: "Korea", volume: 0.35, type: "risk_on" },
        ],
        riskSentiment: isStrongDollar ? "risk_off" : "risk_on",
        lastUpdated: new Date().toISOString(),
    };
};

export const useFXStore = create<FXState>((set, get) => ({
    // Initial Data State
    metrics: null,

    // Initial UI State
    isLoadingData: false,
    selectedPair: "USD/JPY",

    // Initial On-Demand AI State
    isAnalyzing: false,
    currentAgent: null,
    analysisResult: null,
    analysisError: null,
    showAnalysisPanel: false,

    // Fetch FX Data
    fetchFXData: async () => {
        set({ isLoadingData: true });

        try {
            const response = await fetch("http://localhost:8001/api/fx/data");

            if (response.ok) {
                const data = await response.json();
                set({
                    metrics: data,
                    isLoadingData: false,
                });
            } else {
                throw new Error("API not available");
            }
        } catch {
            // Fallback to mock data
            set({
                metrics: generateMockFXData(),
                isLoadingData: false,
            });
        }
    },

    // Set selected pair for analysis context
    setSelectedPair: (pair) => {
        set({ selectedPair: pair });
    },

    // On-Demand: Request AI Analysis (with daily cache support)
    requestAnalysis: async (language = "en") => {
        const { metrics, selectedPair } = get();

        if (!metrics) {
            set({ analysisError: "No FX data available. Please wait for data to load." });
            return;
        }

        set({
            isAnalyzing: true,
            analysisError: null,
            currentAgent: "kostolany",
            showAnalysisPanel: true,
        });

        try {
            // First, check if there's a cached analysis for today (pair-specific)
            const cacheResponse = await fetch(`http://localhost:8001/api/analyze/fx/cached?language=${language}&selected_pair=${encodeURIComponent(selectedPair)}`);
            if (cacheResponse.ok) {
                const cacheData = await cacheResponse.json();
                if (cacheData.cached && cacheData.result) {
                    // Use cached result
                    set({
                        analysisResult: {
                            dollarIndex: metrics.dollarIndex.value,
                            majorPairs: metrics.majorPairs,
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
            const response = await fetch("http://localhost:8001/api/analyze/fx", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    dollar_index: metrics.dollarIndex.value,
                    dollar_trend: metrics.dollarIndex.trend,
                    major_pairs: metrics.majorPairs,
                    risk_sentiment: metrics.riskSentiment,
                    selected_pair: selectedPair,
                    language: language,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get analysis");
            }

            const data = await response.json();
            set({
                analysisResult: {
                    dollarIndex: metrics.dollarIndex.value,
                    majorPairs: metrics.majorPairs,
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
                analysisError: error instanceof Error ? error.message : "Failed to analyze FX data",
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
            metrics: null,
            isLoadingData: false,
            selectedPair: "USD/JPY",
            isAnalyzing: false,
            currentAgent: null,
            analysisResult: null,
            analysisError: null,
            showAnalysisPanel: false,
        });
    },
}));
