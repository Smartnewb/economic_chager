import { create } from "zustand";

// Central Bank Policy Status
export type PolicyStatus = "hiking" | "paused" | "cutting" | "low";

// Central Bank Data
export interface CentralBankData {
    country: string;
    code: string;
    flag: string;
    bank: string;
    currentRate: number;
    previousRate: number;
    inflationRate: number;
    realRate: number; // currentRate - inflationRate
    status: PolicyStatus;
    cyclePosition: number; // 0-100, position on the cycle clock
    lastChange: string; // e.g., "+0.25%" or "-0.50%"
    lastMeetingDate: string;
    nextMeetingDate: string;
}

// Upcoming Meeting
export interface UpcomingMeeting {
    country: string;
    flag: string;
    bank: string;
    date: string;
    daysUntil: number;
    expectedAction: "hold" | "hike" | "cut" | "uncertain";
    marketProbability: number; // probability of expected action
}

// Policy Analysis Result
export interface PolicyAnalysisResult {
    kostolany_response: string;
    buffett_response: string;
    munger_response: string;
    dalio_response: string;
    synthesis: string;
}

interface PolicyStore {
    // Data
    centralBanks: CentralBankData[];
    upcomingMeetings: UpcomingMeeting[];
    selectedCountry: string | null;
    selectedView: "cycle" | "map" | "calendar";

    // Loading states
    isLoadingData: boolean;

    // Analysis
    showAnalysisPanel: boolean;
    isAnalyzing: boolean;
    currentAgent: string | null;
    analysisResult: PolicyAnalysisResult | null;
    analysisError: string | null;

    // Actions
    fetchPolicyData: () => Promise<void>;
    setSelectedCountry: (country: string | null) => void;
    setSelectedView: (view: "cycle" | "map" | "calendar") => void;
    triggerAnalysis: (language?: string) => Promise<void>;
    closeAnalysisPanel: () => void;
}

// Mock central bank data generator
const generateMockCentralBanks = (): CentralBankData[] => {
    const banks: CentralBankData[] = [
        {
            country: "United States",
            code: "US",
            flag: "🇺🇸",
            bank: "Federal Reserve (Fed)",
            currentRate: 5.50,
            previousRate: 5.50,
            inflationRate: 3.4,
            realRate: 2.1,
            status: "paused",
            cyclePosition: 75, // Peak & Pause zone
            lastChange: "0.00%",
            lastMeetingDate: "2024-01-31",
            nextMeetingDate: "2024-03-20",
        },
        {
            country: "European Union",
            code: "EU",
            flag: "🇪🇺",
            bank: "European Central Bank (ECB)",
            currentRate: 4.50,
            previousRate: 4.50,
            inflationRate: 2.8,
            realRate: 1.7,
            status: "paused",
            cyclePosition: 70,
            lastChange: "0.00%",
            lastMeetingDate: "2024-01-25",
            nextMeetingDate: "2024-03-07",
        },
        {
            country: "Japan",
            code: "JP",
            flag: "🇯🇵",
            bank: "Bank of Japan (BOJ)",
            currentRate: 0.10,
            previousRate: -0.10,
            inflationRate: 2.6,
            realRate: -2.5,
            status: "hiking",
            cyclePosition: 15, // Just started hiking from ultra-low
            lastChange: "+0.20%",
            lastMeetingDate: "2024-01-23",
            nextMeetingDate: "2024-03-19",
        },
        {
            country: "United Kingdom",
            code: "GB",
            flag: "🇬🇧",
            bank: "Bank of England (BOE)",
            currentRate: 5.25,
            previousRate: 5.25,
            inflationRate: 4.0,
            realRate: 1.25,
            status: "paused",
            cyclePosition: 72,
            lastChange: "0.00%",
            lastMeetingDate: "2024-02-01",
            nextMeetingDate: "2024-03-21",
        },
        {
            country: "China",
            code: "CN",
            flag: "🇨🇳",
            bank: "People's Bank of China (PBOC)",
            currentRate: 3.45,
            previousRate: 3.55,
            inflationRate: 0.7,
            realRate: 2.75,
            status: "cutting",
            cyclePosition: 55, // Cutting zone
            lastChange: "-0.10%",
            lastMeetingDate: "2024-02-20",
            nextMeetingDate: "2024-03-20",
        },
        {
            country: "South Korea",
            code: "KR",
            flag: "🇰🇷",
            bank: "Bank of Korea (BOK)",
            currentRate: 3.50,
            previousRate: 3.50,
            inflationRate: 2.8,
            realRate: 0.7,
            status: "paused",
            cyclePosition: 68,
            lastChange: "0.00%",
            lastMeetingDate: "2024-02-22",
            nextMeetingDate: "2024-04-11",
        },
        {
            country: "Australia",
            code: "AU",
            flag: "🇦🇺",
            bank: "Reserve Bank of Australia (RBA)",
            currentRate: 4.35,
            previousRate: 4.35,
            inflationRate: 4.1,
            realRate: 0.25,
            status: "paused",
            cyclePosition: 70,
            lastChange: "0.00%",
            lastMeetingDate: "2024-02-06",
            nextMeetingDate: "2024-03-19",
        },
        {
            country: "Canada",
            code: "CA",
            flag: "🇨🇦",
            bank: "Bank of Canada (BOC)",
            currentRate: 5.00,
            previousRate: 5.00,
            inflationRate: 2.9,
            realRate: 2.1,
            status: "paused",
            cyclePosition: 73,
            lastChange: "0.00%",
            lastMeetingDate: "2024-01-24",
            nextMeetingDate: "2024-03-06",
        },
        {
            country: "Switzerland",
            code: "CH",
            flag: "🇨🇭",
            bank: "Swiss National Bank (SNB)",
            currentRate: 1.75,
            previousRate: 1.75,
            inflationRate: 1.3,
            realRate: 0.45,
            status: "paused",
            cyclePosition: 65,
            lastChange: "0.00%",
            lastMeetingDate: "2023-12-14",
            nextMeetingDate: "2024-03-21",
        },
        {
            country: "Brazil",
            code: "BR",
            flag: "🇧🇷",
            bank: "Central Bank of Brazil (BCB)",
            currentRate: 11.25,
            previousRate: 11.75,
            inflationRate: 4.5,
            realRate: 6.75,
            status: "cutting",
            cyclePosition: 50, // Actively cutting
            lastChange: "-0.50%",
            lastMeetingDate: "2024-01-31",
            nextMeetingDate: "2024-03-20",
        },
        {
            country: "India",
            code: "IN",
            flag: "🇮🇳",
            bank: "Reserve Bank of India (RBI)",
            currentRate: 6.50,
            previousRate: 6.50,
            inflationRate: 5.1,
            realRate: 1.4,
            status: "paused",
            cyclePosition: 68,
            lastChange: "0.00%",
            lastMeetingDate: "2024-02-08",
            nextMeetingDate: "2024-04-05",
        },
        {
            country: "Mexico",
            code: "MX",
            flag: "🇲🇽",
            bank: "Bank of Mexico (Banxico)",
            currentRate: 11.25,
            previousRate: 11.25,
            inflationRate: 4.9,
            realRate: 6.35,
            status: "paused",
            cyclePosition: 72,
            lastChange: "0.00%",
            lastMeetingDate: "2024-02-08",
            nextMeetingDate: "2024-03-21",
        },
    ];

    // Add some randomness to simulate real-time changes
    return banks.map((bank) => ({
        ...bank,
        currentRate: bank.currentRate + (Math.random() - 0.5) * 0.1,
        inflationRate: bank.inflationRate + (Math.random() - 0.5) * 0.2,
        realRate: bank.currentRate - bank.inflationRate + (Math.random() - 0.5) * 0.1,
    }));
};

// Generate upcoming meetings
const generateUpcomingMeetings = (banks: CentralBankData[]): UpcomingMeeting[] => {
    const today = new Date();

    return banks
        .map((bank) => {
            const meetingDate = new Date(bank.nextMeetingDate);
            const daysUntil = Math.ceil(
                (meetingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            let expectedAction: "hold" | "hike" | "cut" | "uncertain" = "hold";
            let probability = 85;

            if (bank.status === "cutting") {
                expectedAction = "cut";
                probability = 70;
            } else if (bank.status === "hiking") {
                expectedAction = "hike";
                probability = 60;
            } else if (bank.realRate < 0) {
                expectedAction = "hike";
                probability = 55;
            } else if (bank.realRate > 2) {
                expectedAction = "uncertain";
                probability = 45;
            }

            return {
                country: bank.country,
                flag: bank.flag,
                bank: bank.bank,
                date: bank.nextMeetingDate,
                daysUntil,
                expectedAction,
                marketProbability: probability,
            };
        })
        .filter((m) => m.daysUntil > 0)
        .sort((a, b) => a.daysUntil - b.daysUntil);
};

export const usePolicyStore = create<PolicyStore>((set, get) => ({
    // Initial state
    centralBanks: [],
    upcomingMeetings: [],
    selectedCountry: null,
    selectedView: "cycle",
    isLoadingData: false,
    showAnalysisPanel: false,
    isAnalyzing: false,
    currentAgent: null,
    analysisResult: null,
    analysisError: null,

    // Fetch policy data
    fetchPolicyData: async () => {
        set({ isLoadingData: true });

        try {
            // In production, this would be an API call
            // const response = await fetch('/api/policy/global');
            // const data = await response.json();

            // For now, use mock data
            await new Promise((resolve) => setTimeout(resolve, 500));
            const banks = generateMockCentralBanks();
            const meetings = generateUpcomingMeetings(banks);

            set({
                centralBanks: banks,
                upcomingMeetings: meetings,
                isLoadingData: false,
            });
        } catch (error) {
            console.error("Failed to fetch policy data:", error);
            set({ isLoadingData: false });
        }
    },

    setSelectedCountry: (country) => set({ selectedCountry: country }),
    setSelectedView: (view) => set({ selectedView: view }),

    // Trigger AI analysis (with daily cache support)
    triggerAnalysis: async (language = "en") => {
        const { centralBanks, upcomingMeetings } = get();

        set({
            showAnalysisPanel: true,
            isAnalyzing: true,
            currentAgent: "kostolany",
            analysisResult: null,
            analysisError: null,
        });

        try {
            // Find key metrics
            const usBank = centralBanks.find((b) => b.code === "US");
            const hikingCountries = centralBanks.filter((b) => b.status === "hiking");
            const cuttingCountries = centralBanks.filter((b) => b.status === "cutting");
            const nextMeeting = upcomingMeetings[0];

            // First, check if there's a cached analysis for today
            const cacheResponse = await fetch(`http://localhost:8001/api/analyze/policy/cached?language=${language}`);
            if (cacheResponse.ok) {
                const cacheData = await cacheResponse.json();
                if (cacheData.cached && cacheData.result) {
                    // Use cached result
                    const result: PolicyAnalysisResult = {
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

            const response = await fetch("http://localhost:8001/api/analyze/policy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    us_rate: usBank?.currentRate || 5.5,
                    us_real_rate: usBank?.realRate || 2.1,
                    us_status: usBank?.status || "paused",
                    hiking_count: hikingCountries.length,
                    cutting_count: cuttingCountries.length,
                    next_meeting_country: nextMeeting?.country || "US",
                    next_meeting_days: nextMeeting?.daysUntil || 30,
                    language: language,
                }),
            });

            clearInterval(agentInterval);

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();

            const result: PolicyAnalysisResult = {
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
                analysisError: "Failed to run policy analysis. Please try again.",
            });
        }
    },

    closeAnalysisPanel: () =>
        set({
            showAnalysisPanel: false,
            // Keep analysisResult so user can reopen panel without re-analyzing
        }),
}));
