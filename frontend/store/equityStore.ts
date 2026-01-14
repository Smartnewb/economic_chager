import { create } from "zustand";

// Global Market Index
export interface MarketIndex {
    symbol: string;
    name: string;
    country: string;
    region: "US" | "Asia" | "EU";
    flag: string;
    price: number;
    change: number; // percent change
    changeValue: number; // absolute change
    marketCap: number; // in billions for treemap sizing
}

// Sector Performance
export interface SectorData {
    sector: string;
    shortName: string;
    change: number; // percent change
    marketCap: number; // relative size for treemap
    topStock: string;
    topStockChange: number;
}

// Capital Flow between regions
export interface EquityFlow {
    from: string;
    to: string;
    volume: number; // 0-1 scale
    type: "risk_on" | "risk_off" | "rotation";
}

// VIX Fear Gauge
export interface VIXData {
    value: number;
    change: number;
    level: "low" | "moderate" | "elevated" | "high" | "extreme";
    description: string;
}

// Equity Analysis Result from AI
interface EquityAnalysisResult {
    marketSentiment: string;
    kostolany_response: string;
    buffett_response: string;
    munger_response: string;
    dalio_response: string;
    synthesis: string;
}

interface EquityState {
    // Data State
    globalIndices: MarketIndex[];
    sectors: SectorData[];
    equityFlows: EquityFlow[];
    vix: VIXData | null;

    // UI State
    isLoadingData: boolean;
    selectedView: "global" | "sector"; // Toggle between views
    selectedRegion: string | null;
    selectedSector: string | null;

    // On-Demand AI State
    isAnalyzing: boolean;
    currentAgent: string | null;
    analysisResult: EquityAnalysisResult | null;
    analysisError: string | null;
    showAnalysisPanel: boolean;

    // Actions
    fetchEquityData: () => Promise<void>;
    setSelectedView: (view: "global" | "sector") => void;
    setSelectedRegion: (region: string | null) => void;
    setSelectedSector: (sector: string | null) => void;
    requestAnalysis: (language?: string) => Promise<void>;
    closeAnalysisPanel: () => void;
    reset: () => void;
}

// Generate mock global indices data
const generateMockGlobalIndices = (): MarketIndex[] => {
    const randomChange = (base: number, range: number) =>
        Math.round((base + (Math.random() * range - range / 2)) * 100) / 100;

    return [
        // US Markets (largest)
        {
            symbol: "^GSPC",
            name: "S&P 500",
            country: "United States",
            region: "US",
            flag: "🇺🇸",
            price: 5850 + Math.random() * 100,
            change: randomChange(0.5, 3),
            changeValue: randomChange(25, 100),
            marketCap: 45000, // $45T
        },
        {
            symbol: "^IXIC",
            name: "NASDAQ",
            country: "United States",
            region: "US",
            flag: "🇺🇸",
            price: 18500 + Math.random() * 300,
            change: randomChange(0.7, 4),
            changeValue: randomChange(100, 300),
            marketCap: 25000, // $25T
        },
        {
            symbol: "^DJI",
            name: "Dow Jones",
            country: "United States",
            region: "US",
            flag: "🇺🇸",
            price: 42500 + Math.random() * 500,
            change: randomChange(0.3, 2),
            changeValue: randomChange(100, 400),
            marketCap: 15000,
        },
        // Asia Markets
        {
            symbol: "^N225",
            name: "Nikkei 225",
            country: "Japan",
            region: "Asia",
            flag: "🇯🇵",
            price: 38500 + Math.random() * 500,
            change: randomChange(-0.2, 3),
            changeValue: randomChange(-50, 300),
            marketCap: 6000,
        },
        {
            symbol: "^KS11",
            name: "KOSPI",
            country: "South Korea",
            region: "Asia",
            flag: "🇰🇷",
            price: 2650 + Math.random() * 50,
            change: randomChange(-0.5, 3),
            changeValue: randomChange(-10, 40),
            marketCap: 1800,
        },
        {
            symbol: "^HSI",
            name: "Hang Seng",
            country: "Hong Kong",
            region: "Asia",
            flag: "🇭🇰",
            price: 19500 + Math.random() * 300,
            change: randomChange(-0.8, 4),
            changeValue: randomChange(-100, 300),
            marketCap: 4500,
        },
        {
            symbol: "000001.SS",
            name: "Shanghai",
            country: "China",
            region: "Asia",
            flag: "🇨🇳",
            price: 3150 + Math.random() * 50,
            change: randomChange(-0.3, 2.5),
            changeValue: randomChange(-10, 30),
            marketCap: 7000,
        },
        // EU Markets
        {
            symbol: "^GDAXI",
            name: "DAX",
            country: "Germany",
            region: "EU",
            flag: "🇩🇪",
            price: 19200 + Math.random() * 200,
            change: randomChange(0.2, 2.5),
            changeValue: randomChange(30, 150),
            marketCap: 2200,
        },
        {
            symbol: "^FTSE",
            name: "FTSE 100",
            country: "United Kingdom",
            region: "EU",
            flag: "🇬🇧",
            price: 8150 + Math.random() * 100,
            change: randomChange(0.1, 2),
            changeValue: randomChange(10, 80),
            marketCap: 2800,
        },
        {
            symbol: "^FCHI",
            name: "CAC 40",
            country: "France",
            region: "EU",
            flag: "🇫🇷",
            price: 7450 + Math.random() * 100,
            change: randomChange(0.15, 2.2),
            changeValue: randomChange(10, 70),
            marketCap: 2500,
        },
    ];
};

// Generate mock sector data (11 GICS sectors)
const generateMockSectors = (): SectorData[] => {
    const randomChange = (base: number, range: number) =>
        Math.round((base + (Math.random() * range - range / 2)) * 100) / 100;

    return [
        {
            sector: "Information Technology",
            shortName: "Tech",
            change: randomChange(1.2, 4),
            marketCap: 14000,
            topStock: "NVDA",
            topStockChange: randomChange(2.5, 6),
        },
        {
            sector: "Health Care",
            shortName: "Health",
            change: randomChange(0.3, 2.5),
            marketCap: 7500,
            topStock: "UNH",
            topStockChange: randomChange(0.5, 3),
        },
        {
            sector: "Financials",
            shortName: "Finance",
            change: randomChange(0.4, 2.5),
            marketCap: 6800,
            topStock: "JPM",
            topStockChange: randomChange(0.6, 2.5),
        },
        {
            sector: "Consumer Discretionary",
            shortName: "Consumer",
            change: randomChange(0.6, 3),
            marketCap: 5500,
            topStock: "AMZN",
            topStockChange: randomChange(1.0, 4),
        },
        {
            sector: "Communication Services",
            shortName: "Comm",
            change: randomChange(0.8, 3.5),
            marketCap: 4800,
            topStock: "META",
            topStockChange: randomChange(1.5, 5),
        },
        {
            sector: "Industrials",
            shortName: "Industrial",
            change: randomChange(0.2, 2),
            marketCap: 4500,
            topStock: "CAT",
            topStockChange: randomChange(0.3, 2),
        },
        {
            sector: "Consumer Staples",
            shortName: "Staples",
            change: randomChange(-0.1, 1.5),
            marketCap: 4000,
            topStock: "PG",
            topStockChange: randomChange(0.1, 1.5),
        },
        {
            sector: "Energy",
            shortName: "Energy",
            change: randomChange(-0.5, 3),
            marketCap: 2200,
            topStock: "XOM",
            topStockChange: randomChange(-0.3, 2.5),
        },
        {
            sector: "Utilities",
            shortName: "Utilities",
            change: randomChange(-0.2, 1.5),
            marketCap: 1600,
            topStock: "NEE",
            topStockChange: randomChange(0.1, 1.5),
        },
        {
            sector: "Real Estate",
            shortName: "Real Est",
            change: randomChange(-0.4, 2),
            marketCap: 1400,
            topStock: "PLD",
            topStockChange: randomChange(-0.2, 2),
        },
        {
            sector: "Materials",
            shortName: "Materials",
            change: randomChange(0.1, 2),
            marketCap: 1200,
            topStock: "LIN",
            topStockChange: randomChange(0.2, 1.8),
        },
    ];
};

// Generate VIX data
const generateMockVIX = (): VIXData => {
    const value = Math.round((15 + Math.random() * 20) * 100) / 100;
    const change = Math.round((Math.random() * 4 - 2) * 100) / 100;

    let level: VIXData["level"];
    let description: string;

    if (value < 12) {
        level = "low";
        description = "Extreme complacency - markets are calm";
    } else if (value < 20) {
        level = "moderate";
        description = "Normal volatility - typical market conditions";
    } else if (value < 25) {
        level = "elevated";
        description = "Elevated fear - investors are cautious";
    } else if (value < 35) {
        level = "high";
        description = "High fear - significant market stress";
    } else {
        level = "extreme";
        description = "Extreme fear - panic mode";
    }

    return { value, change, level, description };
};

// Generate equity flows
const generateMockEquityFlows = (indices: MarketIndex[]): EquityFlow[] => {
    const usPerformance =
        indices.filter((i) => i.region === "US").reduce((sum, i) => sum + i.change, 0) / 3;
    const isRiskOn = usPerformance > 0;

    return [
        {
            from: isRiskOn ? "Bonds" : "US",
            to: isRiskOn ? "US" : "Bonds",
            volume: Math.abs(usPerformance) / 5,
            type: isRiskOn ? "risk_on" : "risk_off",
        },
        {
            from: isRiskOn ? "EU" : "US",
            to: isRiskOn ? "US" : "EU",
            volume: 0.4,
            type: "rotation",
        },
        {
            from: isRiskOn ? "Asia" : "US",
            to: isRiskOn ? "US" : "Asia",
            volume: 0.35,
            type: "rotation",
        },
        {
            from: "Defensive",
            to: "Growth",
            volume: isRiskOn ? 0.6 : 0.2,
            type: isRiskOn ? "risk_on" : "risk_off",
        },
    ];
};

export const useEquityStore = create<EquityState>((set, get) => ({
    // Initial Data State
    globalIndices: [],
    sectors: [],
    equityFlows: [],
    vix: null,

    // Initial UI State
    isLoadingData: false,
    selectedView: "global",
    selectedRegion: null,
    selectedSector: null,

    // Initial On-Demand AI State
    isAnalyzing: false,
    currentAgent: null,
    analysisResult: null,
    analysisError: null,
    showAnalysisPanel: false,

    // Fetch Equity Data
    fetchEquityData: async () => {
        set({ isLoadingData: true });

        try {
            // Try API first
            const response = await fetch("http://localhost:8000/api/stocks/global");

            if (response.ok) {
                const data = await response.json();
                set({
                    globalIndices: data.global_indices,
                    sectors: data.sectors,
                    vix: data.vix,
                    equityFlows: data.equity_flows,
                    isLoadingData: false,
                });
            } else {
                throw new Error("API not available");
            }
        } catch {
            // Fallback to mock data
            const globalIndices = generateMockGlobalIndices();
            const sectors = generateMockSectors();
            const vix = generateMockVIX();
            const equityFlows = generateMockEquityFlows(globalIndices);

            set({
                globalIndices,
                sectors,
                vix,
                equityFlows,
                isLoadingData: false,
            });
        }
    },

    // UI Actions
    setSelectedView: (view) => {
        set({ selectedView: view });
    },

    setSelectedRegion: (region) => {
        set({ selectedRegion: region });
    },

    setSelectedSector: (sector) => {
        set({ selectedSector: sector });
    },

    // On-Demand AI Analysis (with daily cache support)
    requestAnalysis: async (language = "en") => {
        const { globalIndices, sectors, vix } = get();

        if (globalIndices.length === 0) {
            set({ analysisError: "No equity data available. Please wait for data to load." });
            return;
        }

        set({
            isAnalyzing: true,
            analysisError: null,
            currentAgent: "kostolany",
            showAnalysisPanel: true,
        });

        try {
            // Calculate market metrics for analysis
            const usIndices = globalIndices.filter((i) => i.region === "US");
            const avgUsChange =
                usIndices.reduce((sum, i) => sum + i.change, 0) / usIndices.length;
            const topSector = [...sectors].sort((a, b) => b.change - a.change)[0];
            const bottomSector = [...sectors].sort((a, b) => a.change - b.change)[0];

            // First, check if there's a cached analysis for today
            const cacheResponse = await fetch(`http://localhost:8000/api/analyze/stocks/cached?language=${language}`);
            if (cacheResponse.ok) {
                const cacheData = await cacheResponse.json();
                if (cacheData.cached && cacheData.result) {
                    // Use cached result
                    set({
                        analysisResult: {
                            marketSentiment: avgUsChange > 0 ? "bullish" : "bearish",
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
            const response = await fetch("http://localhost:8000/api/analyze/stocks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    us_market_change: avgUsChange,
                    vix_level: vix?.value || 15,
                    vix_status: vix?.level || "moderate",
                    top_sector: topSector.sector,
                    top_sector_change: topSector.change,
                    bottom_sector: bottomSector.sector,
                    bottom_sector_change: bottomSector.change,
                    global_indices: globalIndices.map((i) => ({
                        name: i.name,
                        change: i.change,
                        region: i.region,
                    })),
                    language: language,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get analysis");
            }

            const data = await response.json();
            set({
                analysisResult: {
                    marketSentiment: avgUsChange > 0 ? "bullish" : "bearish",
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
                analysisError:
                    error instanceof Error ? error.message : "Failed to analyze equity data",
                isAnalyzing: false,
                currentAgent: null,
            });
        }
    },

    closeAnalysisPanel: () => {
        set({ showAnalysisPanel: false });
    },

    reset: () => {
        set({
            globalIndices: [],
            sectors: [],
            equityFlows: [],
            vix: null,
            isLoadingData: false,
            selectedView: "global",
            selectedRegion: null,
            selectedSector: null,
            isAnalyzing: false,
            currentAgent: null,
            analysisResult: null,
            analysisError: null,
            showAnalysisPanel: false,
        });
    },
}));
