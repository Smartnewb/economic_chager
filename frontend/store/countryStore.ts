import { create } from "zustand";

// Country Economic Health Metrics (0-100 scale)
export interface EconomicMetrics {
    currencyPower: number; // FX strength vs USD
    marketSentiment: number; // Stock market performance
    creditRisk: number; // Bond yield / CDS risk (inverted - higher is better)
    liquidity: number; // Monetary policy stance
    inflation: number; // Price stability (inverted - lower inflation = higher score)
    growth: number; // GDP growth outlook
}

// Country Profile
export interface CountryProfile {
    code: string;
    name: string;
    flag: string;
    region: string;
    currency: string;
    currencyCode: string;
}

// FX Data for country
export interface CountryFXData {
    pair: string;
    rate: number;
    change24h: number;
    change1w: number;
    change1m: number;
    high52w: number;
    low52w: number;
    percentOfRange: number; // where current rate sits in 52w range
}

// Bond Data for country
export interface CountryBondData {
    yield10y: number;
    yield2y: number;
    spread: number;
    isInverted: boolean;
    change24h: number;
    vsUSSpread: number;
}

// Stock Data for country
export interface CountryStockData {
    indexName: string;
    indexSymbol: string;
    price: number;
    change1d: number;
    change1m: number;
    change3m: number;
    changeYTD: number;
    per: number; // P/E ratio
    pbr: number; // P/B ratio
}

// Policy Data for country
export interface CountryPolicyData {
    centralBank: string;
    policyRate: number;
    realRate: number;
    inflationRate: number;
    status: "hiking" | "paused" | "cutting" | "low";
    cyclePosition: number;
    nextMeetingDate: string;
    nextMeetingDays: number;
}

// Full Country Data
export interface CountryData {
    profile: CountryProfile;
    metrics: EconomicMetrics;
    fx: CountryFXData;
    bond: CountryBondData;
    stock: CountryStockData;
    policy: CountryPolicyData;
    overallGrade: string; // A+, A, B+, B, C, D, F
    overallScore: number; // 0-100
}

// AI Analysis Result
export interface CountryAnalysisResult {
    diagnosis: string; // Brief diagnosis title
    grade: string;
    positiveFactors: string[];
    negativeFactors: string[];
    kostolany_response: string;
    buffett_response: string;
    munger_response: string;
    dalio_response: string;
    synthesis: string;
}

// Available countries
export const AVAILABLE_COUNTRIES: CountryProfile[] = [
    { code: "US", name: "United States", flag: "🇺🇸", region: "Americas", currency: "US Dollar", currencyCode: "USD" },
    { code: "KR", name: "South Korea", flag: "🇰🇷", region: "Asia", currency: "Korean Won", currencyCode: "KRW" },
    { code: "JP", name: "Japan", flag: "🇯🇵", region: "Asia", currency: "Japanese Yen", currencyCode: "JPY" },
    { code: "CN", name: "China", flag: "🇨🇳", region: "Asia", currency: "Chinese Yuan", currencyCode: "CNY" },
    { code: "DE", name: "Germany", flag: "🇩🇪", region: "Europe", currency: "Euro", currencyCode: "EUR" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧", region: "Europe", currency: "British Pound", currencyCode: "GBP" },
    { code: "FR", name: "France", flag: "🇫🇷", region: "Europe", currency: "Euro", currencyCode: "EUR" },
    { code: "AU", name: "Australia", flag: "🇦🇺", region: "Oceania", currency: "Australian Dollar", currencyCode: "AUD" },
    { code: "CA", name: "Canada", flag: "🇨🇦", region: "Americas", currency: "Canadian Dollar", currencyCode: "CAD" },
    { code: "BR", name: "Brazil", flag: "🇧🇷", region: "Americas", currency: "Brazilian Real", currencyCode: "BRL" },
    { code: "IN", name: "India", flag: "🇮🇳", region: "Asia", currency: "Indian Rupee", currencyCode: "INR" },
    { code: "MX", name: "Mexico", flag: "🇲🇽", region: "Americas", currency: "Mexican Peso", currencyCode: "MXN" },
];

interface CountryStore {
    // Data
    selectedCountry: string | null;
    countryData: CountryData | null;
    searchQuery: string;
    recentCountries: string[];

    // Loading states
    isLoadingData: boolean;

    // Analysis
    showAnalysisPanel: boolean;
    isAnalyzing: boolean;
    currentAgent: string | null;
    analysisResult: CountryAnalysisResult | null;
    analysisError: string | null;

    // Actions
    setSearchQuery: (query: string) => void;
    selectCountry: (code: string) => Promise<void>;
    fetchCountryData: (code: string) => Promise<void>;
    triggerAnalysis: (language?: string) => Promise<void>;
    openAnalysisPanel: () => void;
    closeAnalysisPanel: () => void;
    clearSelection: () => void;
}

// Calculate overall grade from score
const calculateGrade = (score: number): string => {
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "A-";
    if (score >= 75) return "B+";
    if (score >= 70) return "B";
    if (score >= 65) return "B-";
    if (score >= 60) return "C+";
    if (score >= 55) return "C";
    if (score >= 50) return "C-";
    if (score >= 45) return "D+";
    if (score >= 40) return "D";
    return "F";
};

// Mock data generator for a country
const generateMockCountryData = (code: string): CountryData => {
    const profile = AVAILABLE_COUNTRIES.find((c) => c.code === code)!;

    // Base metrics vary by country
    const countrySeeds: Record<string, Partial<EconomicMetrics>> = {
        US: { currencyPower: 85, marketSentiment: 78, creditRisk: 90, liquidity: 65, inflation: 70, growth: 72 },
        KR: { currencyPower: 55, marketSentiment: 62, creditRisk: 75, liquidity: 60, inflation: 72, growth: 58 },
        JP: { currencyPower: 45, marketSentiment: 70, creditRisk: 85, liquidity: 90, inflation: 80, growth: 45 },
        CN: { currencyPower: 60, marketSentiment: 48, creditRisk: 65, liquidity: 75, inflation: 85, growth: 55 },
        DE: { currencyPower: 70, marketSentiment: 65, creditRisk: 88, liquidity: 70, inflation: 68, growth: 50 },
        GB: { currencyPower: 62, marketSentiment: 60, creditRisk: 80, liquidity: 55, inflation: 55, growth: 52 },
        FR: { currencyPower: 70, marketSentiment: 58, creditRisk: 78, liquidity: 70, inflation: 65, growth: 48 },
        AU: { currencyPower: 58, marketSentiment: 68, creditRisk: 82, liquidity: 60, inflation: 62, growth: 65 },
        CA: { currencyPower: 65, marketSentiment: 64, creditRisk: 85, liquidity: 58, inflation: 68, growth: 60 },
        BR: { currencyPower: 45, marketSentiment: 55, creditRisk: 55, liquidity: 50, inflation: 50, growth: 52 },
        IN: { currencyPower: 52, marketSentiment: 72, creditRisk: 60, liquidity: 55, inflation: 55, growth: 78 },
        MX: { currencyPower: 50, marketSentiment: 58, creditRisk: 58, liquidity: 48, inflation: 52, growth: 55 },
    };

    const baseSeed = countrySeeds[code] || { currencyPower: 50, marketSentiment: 50, creditRisk: 50, liquidity: 50, inflation: 50, growth: 50 };

    // Add some randomness
    const addNoise = (base: number) => Math.max(0, Math.min(100, base + (Math.random() - 0.5) * 10));

    const metrics: EconomicMetrics = {
        currencyPower: addNoise(baseSeed.currencyPower!),
        marketSentiment: addNoise(baseSeed.marketSentiment!),
        creditRisk: addNoise(baseSeed.creditRisk!),
        liquidity: addNoise(baseSeed.liquidity!),
        inflation: addNoise(baseSeed.inflation!),
        growth: addNoise(baseSeed.growth!),
    };

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
        metrics.currencyPower * 0.15 +
        metrics.marketSentiment * 0.2 +
        metrics.creditRisk * 0.2 +
        metrics.liquidity * 0.15 +
        metrics.inflation * 0.15 +
        metrics.growth * 0.15
    );

    // Generate FX data
    const fxRates: Record<string, { rate: number; high: number; low: number }> = {
        US: { rate: 1, high: 1, low: 1 },
        KR: { rate: 1380, high: 1450, low: 1280 },
        JP: { rate: 154.5, high: 162, low: 140 },
        CN: { rate: 7.24, high: 7.35, low: 7.05 },
        DE: { rate: 0.92, high: 0.98, low: 0.88 },
        GB: { rate: 0.79, high: 0.84, low: 0.75 },
        FR: { rate: 0.92, high: 0.98, low: 0.88 },
        AU: { rate: 1.55, high: 1.62, low: 1.45 },
        CA: { rate: 1.36, high: 1.42, low: 1.32 },
        BR: { rate: 5.05, high: 5.40, low: 4.80 },
        IN: { rate: 83.5, high: 85, low: 82 },
        MX: { rate: 17.2, high: 18.5, low: 16.5 },
    };

    const fxBase = fxRates[code] || { rate: 1, high: 1.1, low: 0.9 };
    const fxRate = fxBase.rate + (Math.random() - 0.5) * fxBase.rate * 0.02;
    const percentOfRange = ((fxRate - fxBase.low) / (fxBase.high - fxBase.low)) * 100;

    const fx: CountryFXData = {
        pair: code === "US" ? "DXY" : `USD/${profile.currencyCode}`,
        rate: Math.round(fxRate * 100) / 100,
        change24h: Math.round((Math.random() - 0.5) * 2 * 100) / 100,
        change1w: Math.round((Math.random() - 0.5) * 4 * 100) / 100,
        change1m: Math.round((Math.random() - 0.5) * 8 * 100) / 100,
        high52w: fxBase.high,
        low52w: fxBase.low,
        percentOfRange: Math.round(percentOfRange),
    };

    // Generate Bond data
    const bondYields: Record<string, { y10: number; y2: number }> = {
        US: { y10: 4.55, y2: 4.85 },
        KR: { y10: 3.45, y2: 3.55 },
        JP: { y10: 0.95, y2: 0.25 },
        CN: { y10: 2.25, y2: 1.85 },
        DE: { y10: 2.35, y2: 2.65 },
        GB: { y10: 4.15, y2: 4.35 },
        FR: { y10: 2.95, y2: 2.85 },
        AU: { y10: 4.25, y2: 4.15 },
        CA: { y10: 3.45, y2: 3.85 },
        BR: { y10: 11.5, y2: 10.8 },
        IN: { y10: 7.1, y2: 6.8 },
        MX: { y10: 9.8, y2: 10.2 },
    };

    const bondBase = bondYields[code] || { y10: 4, y2: 4 };
    const yield10y = bondBase.y10 + (Math.random() - 0.5) * 0.2;
    const yield2y = bondBase.y2 + (Math.random() - 0.5) * 0.2;
    const spread = yield10y - yield2y;

    const bond: CountryBondData = {
        yield10y: Math.round(yield10y * 100) / 100,
        yield2y: Math.round(yield2y * 100) / 100,
        spread: Math.round(spread * 100) / 100,
        isInverted: spread < 0,
        change24h: Math.round((Math.random() - 0.5) * 0.1 * 100) / 100,
        vsUSSpread: Math.round((yield10y - 4.55) * 100) / 100,
    };

    // Generate Stock data
    const stockData: Record<string, { index: string; symbol: string; price: number; per: number; pbr: number }> = {
        US: { index: "S&P 500", symbol: "^GSPC", price: 5850, per: 24.5, pbr: 4.8 },
        KR: { index: "KOSPI", symbol: "^KS11", price: 2650, per: 12.5, pbr: 0.95 },
        JP: { index: "Nikkei 225", symbol: "^N225", price: 38500, per: 22.8, pbr: 1.85 },
        CN: { index: "CSI 300", symbol: "000300.SS", price: 3450, per: 11.2, pbr: 1.25 },
        DE: { index: "DAX", symbol: "^GDAXI", price: 19200, per: 14.5, pbr: 1.65 },
        GB: { index: "FTSE 100", symbol: "^FTSE", price: 8150, per: 11.8, pbr: 1.75 },
        FR: { index: "CAC 40", symbol: "^FCHI", price: 7850, per: 13.2, pbr: 1.55 },
        AU: { index: "ASX 200", symbol: "^AXJO", price: 8050, per: 17.5, pbr: 2.1 },
        CA: { index: "TSX", symbol: "^GSPTSE", price: 22500, per: 15.8, pbr: 1.85 },
        BR: { index: "Bovespa", symbol: "^BVSP", price: 128000, per: 8.5, pbr: 1.45 },
        IN: { index: "Nifty 50", symbol: "^NSEI", price: 22800, per: 23.5, pbr: 3.2 },
        MX: { index: "IPC", symbol: "^MXX", price: 56000, per: 12.8, pbr: 1.65 },
    };

    const stockBase = stockData[code] || { index: "Index", symbol: "^IDX", price: 1000, per: 15, pbr: 1.5 };

    const stock: CountryStockData = {
        indexName: stockBase.index,
        indexSymbol: stockBase.symbol,
        price: Math.round(stockBase.price * (1 + (Math.random() - 0.5) * 0.02)),
        change1d: Math.round((Math.random() - 0.5) * 3 * 100) / 100,
        change1m: Math.round((Math.random() - 0.5) * 8 * 100) / 100,
        change3m: Math.round((Math.random() - 0.5) * 15 * 100) / 100,
        changeYTD: Math.round((Math.random() - 0.3) * 25 * 100) / 100,
        per: Math.round(stockBase.per * (1 + (Math.random() - 0.5) * 0.1) * 10) / 10,
        pbr: Math.round(stockBase.pbr * (1 + (Math.random() - 0.5) * 0.1) * 100) / 100,
    };

    // Generate Policy data
    const policyData: Record<string, { bank: string; rate: number; inflation: number; status: "hiking" | "paused" | "cutting" | "low"; cycle: number }> = {
        US: { bank: "Federal Reserve", rate: 5.50, inflation: 3.4, status: "paused", cycle: 75 },
        KR: { bank: "Bank of Korea", rate: 3.50, inflation: 2.8, status: "paused", cycle: 68 },
        JP: { bank: "Bank of Japan", rate: 0.10, inflation: 2.6, status: "hiking", cycle: 15 },
        CN: { bank: "PBOC", rate: 3.45, inflation: 0.7, status: "cutting", cycle: 55 },
        DE: { bank: "ECB", rate: 4.50, inflation: 2.8, status: "paused", cycle: 70 },
        GB: { bank: "Bank of England", rate: 5.25, inflation: 4.0, status: "paused", cycle: 72 },
        FR: { bank: "ECB", rate: 4.50, inflation: 2.5, status: "paused", cycle: 70 },
        AU: { bank: "RBA", rate: 4.35, inflation: 4.1, status: "paused", cycle: 70 },
        CA: { bank: "Bank of Canada", rate: 5.00, inflation: 2.9, status: "paused", cycle: 73 },
        BR: { bank: "BCB", rate: 11.25, inflation: 4.5, status: "cutting", cycle: 50 },
        IN: { bank: "RBI", rate: 6.50, inflation: 5.1, status: "paused", cycle: 68 },
        MX: { bank: "Banxico", rate: 11.25, inflation: 4.9, status: "paused", cycle: 72 },
    };

    const policyBase = policyData[code] || { bank: "Central Bank", rate: 3, inflation: 3, status: "paused" as const, cycle: 50 };
    const policyRate = policyBase.rate + (Math.random() - 0.5) * 0.1;
    const inflationRate = policyBase.inflation + (Math.random() - 0.5) * 0.2;

    const policy: CountryPolicyData = {
        centralBank: policyBase.bank,
        policyRate: Math.round(policyRate * 100) / 100,
        realRate: Math.round((policyRate - inflationRate) * 100) / 100,
        inflationRate: Math.round(inflationRate * 100) / 100,
        status: policyBase.status,
        cyclePosition: policyBase.cycle,
        nextMeetingDate: new Date(Date.now() + Math.random() * 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        nextMeetingDays: Math.floor(Math.random() * 45) + 5,
    };

    return {
        profile,
        metrics,
        fx,
        bond,
        stock,
        policy,
        overallGrade: calculateGrade(overallScore),
        overallScore,
    };
};

export const useCountryStore = create<CountryStore>((set, get) => ({
    // Initial state
    selectedCountry: null,
    countryData: null,
    searchQuery: "",
    recentCountries: [],
    isLoadingData: false,
    showAnalysisPanel: false,
    isAnalyzing: false,
    currentAgent: null,
    analysisResult: null,
    analysisError: null,

    setSearchQuery: (query) => set({ searchQuery: query }),

    selectCountry: async (code) => {
        set({ selectedCountry: code });
        await get().fetchCountryData(code);

        // Add to recent countries
        const { recentCountries } = get();
        const updated = [code, ...recentCountries.filter((c) => c !== code)].slice(0, 5);
        set({ recentCountries: updated });
    },

    fetchCountryData: async (code) => {
        set({ isLoadingData: true });

        try {
            // In production, this would be an API call
            // const response = await fetch(`/api/country/${code}`);
            // const data = await response.json();

            await new Promise((resolve) => setTimeout(resolve, 500));
            const data = generateMockCountryData(code);

            set({ countryData: data, isLoadingData: false });
        } catch (error) {
            console.error("Failed to fetch country data:", error);
            set({ isLoadingData: false });
        }
    },

    triggerAnalysis: async (language = "en") => {
        const { countryData } = get();
        if (!countryData) return;

        set({
            showAnalysisPanel: true,
            isAnalyzing: true,
            currentAgent: "kostolany",
            analysisResult: null,
            analysisError: null,
        });

        try {
            // First, check if there's a cached analysis for today (country-specific)
            const cacheResponse = await fetch(`http://localhost:8001/api/analyze/country/cached?country_code=${countryData.profile.code}&language=${language}`);
            if (cacheResponse.ok) {
                const cacheData = await cacheResponse.json();
                if (cacheData.cached && cacheData.result) {
                    // Use cached result
                    const result: CountryAnalysisResult = {
                        diagnosis: cacheData.result.diagnosis || "",
                        grade: countryData.overallGrade,
                        positiveFactors: cacheData.result.positiveFactors || [],
                        negativeFactors: cacheData.result.negativeFactors || [],
                        kostolany_response: cacheData.result.kostolany_response || "",
                        buffett_response: cacheData.result.buffett_response || "",
                        munger_response: cacheData.result.munger_response || "",
                        dalio_response: cacheData.result.dalio_response || "",
                        synthesis: cacheData.result.synthesis || "",
                    };
                    set({ isAnalyzing: false, currentAgent: null, analysisResult: result });
                    return;
                }
            }

            // No cache available, request new analysis
            // Simulate agent progression for visual feedback
            const agentOrder = ["kostolany", "buffett", "munger", "dalio"];
            let agentIndex = 0;
            const agentInterval = setInterval(() => {
                agentIndex++;
                if (agentIndex < agentOrder.length) {
                    set({ currentAgent: agentOrder[agentIndex] });
                }
            }, 2000);

            const response = await fetch("http://localhost:8001/api/analyze/country", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    country_code: countryData.profile.code,
                    country_name: countryData.profile.name,
                    overall_grade: countryData.overallGrade,
                    overall_score: countryData.overallScore,
                    fx_change1m: countryData.fx.change1m,
                    bond_yield10y: countryData.bond.yield10y,
                    bond_spread: countryData.bond.spread,
                    stock_change3m: countryData.stock.change3m,
                    stock_per: countryData.stock.per,
                    policy_rate: countryData.policy.policyRate,
                    real_rate: countryData.policy.realRate,
                    inflation_rate: countryData.policy.inflationRate,
                    language: language,
                }),
            });

            clearInterval(agentInterval);

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();

            const result: CountryAnalysisResult = {
                diagnosis: data.diagnosis || "",
                grade: countryData.overallGrade,
                positiveFactors: data.positiveFactors || [],
                negativeFactors: data.negativeFactors || [],
                kostolany_response: data.kostolany_response || "",
                buffett_response: data.buffett_response || "",
                munger_response: data.munger_response || "",
                dalio_response: data.dalio_response || "",
                synthesis: data.synthesis || "",
            };

            set({ isAnalyzing: false, currentAgent: null, analysisResult: result });
        } catch (error) {
            console.error("Analysis error:", error);
            set({
                isAnalyzing: false,
                currentAgent: null,
                analysisError: "Failed to run country analysis. Please try again.",
            });
        }
    },

    openAnalysisPanel: () =>
        set({
            showAnalysisPanel: true,
        }),

    closeAnalysisPanel: () =>
        set({
            showAnalysisPanel: false,
            // Keep analysisResult so user can reopen panel without re-analyzing
        }),

    clearSelection: () =>
        set({
            selectedCountry: null,
            countryData: null,
        }),
}));
