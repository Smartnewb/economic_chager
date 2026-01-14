import { create } from "zustand";

// IMF Forecast data point
export interface IMFForecast {
    year: number;
    value: number;
    is_forecast: boolean;
}

// IMF Outlook for a country
export interface IMFOutlook {
    country_code: string;
    country_name: string;
    weo_edition: string;
    gdp_growth: IMFForecast[];
    inflation: IMFForecast[];
    government_debt: IMFForecast[];
    current_account: IMFForecast[];
    sentiment: "bearish" | "neutral" | "bullish";
    key_risks: string[];
}

// Report Card from an institution
export interface InstitutionalReportCard {
    institution: string;
    last_report_date: string;
    key_keywords: string[];
    sentiment: "bearish" | "neutral" | "bullish";
    sentiment_icon: string;
}

// Global Report Card response
export interface GlobalReportCard {
    country_code: string;
    country_name: string;
    report_cards: InstitutionalReportCard[];
    consensus_view: "bearish" | "mixed" | "bullish";
}

// AI Analysis result (Soros & Dalio)
export interface InstitutionalAnalysisResult {
    country_code: string;
    soros_response: string;
    dalio_response: string;
    synthesis: string;
}

interface InstitutionalStore {
    // Data
    selectedCountry: string | null;
    imfOutlook: IMFOutlook | null;
    reportCard: GlobalReportCard | null;
    analysisResult: InstitutionalAnalysisResult | null;

    // Loading states
    isLoadingIMF: boolean;
    isLoadingReportCard: boolean;
    isAnalyzing: boolean;
    currentAgent: "soros" | "dalio" | null;

    // Error
    error: string | null;

    // Actions
    fetchIMFOutlook: (countryCode: string) => Promise<void>;
    fetchReportCard: (countryCode: string) => Promise<void>;
    runInstitutionalAnalysis: (countryCode: string, countryName: string, language?: string) => Promise<void>;
    clearData: () => void;
}

export const useInstitutionalStore = create<InstitutionalStore>((set, get) => ({
    // Initial state
    selectedCountry: null,
    imfOutlook: null,
    reportCard: null,
    analysisResult: null,
    isLoadingIMF: false,
    isLoadingReportCard: false,
    isAnalyzing: false,
    currentAgent: null,
    error: null,

    fetchIMFOutlook: async (countryCode: string) => {
        set({ isLoadingIMF: true, error: null, selectedCountry: countryCode });

        try {
            const response = await fetch(`http://localhost:8001/api/institutional/imf/${countryCode}`);
            if (!response.ok) throw new Error("Failed to fetch IMF data");

            const data = await response.json();
            set({ imfOutlook: data, isLoadingIMF: false });
        } catch (error) {
            console.error("IMF fetch error:", error);
            set({ isLoadingIMF: false, error: "Failed to load IMF data" });
        }
    },

    fetchReportCard: async (countryCode: string) => {
        set({ isLoadingReportCard: true, error: null });

        try {
            const response = await fetch(`http://localhost:8001/api/institutional/report-card/${countryCode}`);
            if (!response.ok) throw new Error("Failed to fetch report card");

            const data = await response.json();
            set({ reportCard: data, isLoadingReportCard: false });
        } catch (error) {
            console.error("Report card fetch error:", error);
            set({ isLoadingReportCard: false, error: "Failed to load report card" });
        }
    },

    runInstitutionalAnalysis: async (countryCode: string, countryName: string, language = "en") => {
        const { imfOutlook } = get();

        set({
            isAnalyzing: true,
            currentAgent: "soros",
            analysisResult: null,
            error: null,
        });

        // Simulate agent progression
        const agentTimer = setTimeout(() => {
            set({ currentAgent: "dalio" });
        }, 3000);

        try {
            const response = await fetch("http://localhost:8001/api/analyze/institutional", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    country_code: countryCode,
                    country_name: countryName,
                    imf_sentiment: imfOutlook?.sentiment || "neutral",
                    key_risks: imfOutlook?.key_risks || [],
                    language,
                }),
            });

            clearTimeout(agentTimer);

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();
            set({
                analysisResult: data,
                isAnalyzing: false,
                currentAgent: null,
            });
        } catch (error) {
            clearTimeout(agentTimer);
            console.error("Institutional analysis error:", error);
            set({
                isAnalyzing: false,
                currentAgent: null,
                error: "Failed to run institutional analysis",
            });
        }
    },

    clearData: () => set({
        selectedCountry: null,
        imfOutlook: null,
        reportCard: null,
        analysisResult: null,
        error: null,
    }),
}));
