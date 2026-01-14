import { create } from "zustand";

interface DebateResult {
    scenario: string;
    kostolany_response: string;
    buffett_response: string;
    munger_response: string;
    dalio_response: string;
    synthesis: string;
}

interface DebateState {
    isLoading: boolean;
    currentAgent: string | null;
    result: DebateResult | null;
    error: string | null;
    runDebate: (scenario: string) => Promise<void>;
    reset: () => void;
}

export const useDebateStore = create<DebateState>((set) => ({
    isLoading: false,
    currentAgent: null,
    result: null,
    error: null,

    runDebate: async (scenario: string) => {
        set({ isLoading: true, error: null, currentAgent: "kostolany" });

        try {
            const response = await fetch("http://localhost:8000/api/debate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ scenario }),
            });

            if (!response.ok) {
                throw new Error("Failed to run debate");
            }

            const data = await response.json();
            set({ result: data, isLoading: false, currentAgent: null });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "Unknown error",
                isLoading: false,
                currentAgent: null,
            });
        }
    },

    reset: () => {
        set({ isLoading: false, currentAgent: null, result: null, error: null });
    },
}));
