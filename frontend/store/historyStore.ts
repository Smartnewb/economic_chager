import { create } from "zustand";

// Historical Match from API
export interface HistoricalMatch {
    year: number;
    date: string;
    period_name: string;
    similarity: number;
    cape: number;
    interest_rate: number;
    inflation: number;
    forward_return_1y: number | null;
    forward_return_3y: number | null;
    forward_return_5y: number | null;
    description: string;
}

// Historical Crisis Event
export interface CrisisEvent {
    year: number;
    name: string;
    type: string;
    description: string;
    peak_to_trough: number;
    recovery_months: number;
    trigger: string;
}

// Current Market Conditions for comparison
export interface CurrentConditions {
    cape: number;
    interest_rate: number;
    inflation: number;
    unemployment: number;
    yield_spread: number;
}

// Historical Analysis Result from AI
interface HistoryAnalysisResult {
    historian_response: string;
    synthesis: string;
}

interface HistoryState {
    // Data State
    matches: HistoricalMatch[];
    historicalContext: string;
    currentConditions: CurrentConditions;
    crises: CrisisEvent[];

    // UI State
    isLoading: boolean;
    error: string | null;
    selectedMatch: HistoricalMatch | null;

    // AI Analysis State
    isAnalyzing: boolean;
    analysisResult: HistoryAnalysisResult | null;
    analysisError: string | null;
    showAnalysisPanel: boolean;

    // Actions
    fetchHistoricalParallels: (conditions?: Partial<CurrentConditions>) => Promise<void>;
    fetchCrises: () => Promise<void>;
    setSelectedMatch: (match: HistoricalMatch | null) => void;
    requestAnalysis: (language?: string) => Promise<void>;
    closeAnalysisPanel: () => void;
    reset: () => void;
}

// Default current conditions (will be overwritten by API or user input)
const DEFAULT_CONDITIONS: CurrentConditions = {
    cape: 30.0,
    interest_rate: 4.5,
    inflation: 3.0,
    unemployment: 4.0,
    yield_spread: 0.0,
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
    // Initial Data State
    matches: [],
    historicalContext: "",
    currentConditions: DEFAULT_CONDITIONS,
    crises: [],

    // Initial UI State
    isLoading: false,
    error: null,
    selectedMatch: null,

    // Initial AI State
    isAnalyzing: false,
    analysisResult: null,
    analysisError: null,
    showAnalysisPanel: false,

    // Fetch Historical Parallels from API
    fetchHistoricalParallels: async (conditions?: Partial<CurrentConditions>) => {
        set({ isLoading: true, error: null });

        const currentConditions = {
            ...get().currentConditions,
            ...conditions,
        };

        try {
            const params = new URLSearchParams({
                cape: currentConditions.cape.toString(),
                rate: currentConditions.interest_rate.toString(),
                inflation: currentConditions.inflation.toString(),
                unemployment: currentConditions.unemployment.toString(),
                yield_spread: currentConditions.yield_spread.toString(),
                top_n: "5",
            });

            const response = await fetch(
                `http://localhost:8000/api/history/parallel?${params}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch historical parallels");
            }

            const data = await response.json();

            set({
                matches: data.matches,
                historicalContext: data.historical_context,
                currentConditions: data.current_conditions,
                isLoading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Failed to fetch data",
                isLoading: false,
            });
        }
    },

    // Fetch Historical Crises
    fetchCrises: async () => {
        try {
            const response = await fetch("http://localhost:8000/api/history/crises");

            if (!response.ok) {
                throw new Error("Failed to fetch crises");
            }

            const data = await response.json();
            set({ crises: data.crises });
        } catch (error) {
            console.error("Failed to fetch crises:", error);
        }
    },

    // Set selected match for detail view
    setSelectedMatch: (match) => {
        set({ selectedMatch: match });
    },

    // Request AI Analysis from The Historian
    requestAnalysis: async (language = "en") => {
        const { matches, currentConditions, historicalContext } = get();

        if (matches.length === 0) {
            set({ analysisError: "No historical data available. Please fetch parallels first." });
            return;
        }

        set({
            isAnalyzing: true,
            analysisError: null,
            showAnalysisPanel: true,
        });

        try {
            // First check for cached analysis
            const cacheResponse = await fetch(
                `http://localhost:8000/api/analyze/history/cached?language=${language}`
            );

            if (cacheResponse.ok) {
                const cacheData = await cacheResponse.json();
                if (cacheData.cached && cacheData.result) {
                    set({
                        analysisResult: {
                            historian_response: cacheData.result.historian_response,
                            synthesis: cacheData.result.synthesis,
                        },
                        isAnalyzing: false,
                    });
                    return;
                }
            }

            // No cache, request new analysis
            const response = await fetch("http://localhost:8000/api/analyze/history", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    current_cape: currentConditions.cape,
                    current_rate: currentConditions.interest_rate,
                    current_inflation: currentConditions.inflation,
                    historical_context: historicalContext,
                    top_matches: matches.slice(0, 3).map((m) => ({
                        year: m.year,
                        period_name: m.period_name,
                        similarity: m.similarity,
                        forward_return_1y: m.forward_return_1y,
                    })),
                    language,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get analysis");
            }

            const data = await response.json();
            set({
                analysisResult: {
                    historian_response: data.historian_response,
                    synthesis: data.synthesis,
                },
                isAnalyzing: false,
            });
        } catch (error) {
            set({
                analysisError: error instanceof Error ? error.message : "Failed to analyze",
                isAnalyzing: false,
            });
        }
    },

    // Close analysis panel
    closeAnalysisPanel: () => {
        set({ showAnalysisPanel: false });
    },

    // Reset all state
    reset: () => {
        set({
            matches: [],
            historicalContext: "",
            currentConditions: DEFAULT_CONDITIONS,
            crises: [],
            isLoading: false,
            error: null,
            selectedMatch: null,
            isAnalyzing: false,
            analysisResult: null,
            analysisError: null,
            showAnalysisPanel: false,
        });
    },
}));
