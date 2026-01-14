// API Configuration
// Uses NEXT_PUBLIC_API_URL environment variable or falls back to localhost

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiEndpoints = {
    // FX/Currency
    fx: {
        rates: `${API_BASE_URL}/api/fx/rates`,
        flows: `${API_BASE_URL}/api/fx/flows`,
    },
    // Bonds
    bonds: {
        yields: `${API_BASE_URL}/api/bonds/yields`,
        curve: `${API_BASE_URL}/api/bonds/curve`,
    },
    // Stocks
    stocks: {
        data: `${API_BASE_URL}/api/stocks`,
        indices: `${API_BASE_URL}/api/stocks/indices`,
        sectors: `${API_BASE_URL}/api/stocks/sectors`,
    },
    // Policy
    policy: {
        global: `${API_BASE_URL}/api/policy/global`,
        rates: `${API_BASE_URL}/api/policy/rates`,
    },
    // Economy
    economy: {
        data: `${API_BASE_URL}/api/economy`,
        commodities: `${API_BASE_URL}/api/economy/commodities`,
        pmi: `${API_BASE_URL}/api/economy/pmi`,
    },
    // Whale Tracker
    whale: {
        alerts: `${API_BASE_URL}/api/whale/alerts`,
        radar: `${API_BASE_URL}/api/whale/radar`,
        insider: `${API_BASE_URL}/api/whale/insider`,
        guru: (guruId: string) => `${API_BASE_URL}/api/whale/guru/${guruId}`,
        consensus: `${API_BASE_URL}/api/whale/consensus`,
    },
    // Macro
    macro: {
        healthCheck: `${API_BASE_URL}/api/macro/health-check`,
    },
    // History
    history: {
        data: `${API_BASE_URL}/api/history`,
    },
    // Country
    country: {
        data: (code: string) => `${API_BASE_URL}/api/country/${code}`,
    },
    // AI Analysis
    analyze: {
        bonds: `${API_BASE_URL}/api/analyze/bonds`,
        stocks: `${API_BASE_URL}/api/analyze/stocks`,
        fx: `${API_BASE_URL}/api/analyze/fx`,
        policy: `${API_BASE_URL}/api/analyze/policy`,
        economy: `${API_BASE_URL}/api/analyze/economy`,
        history: `${API_BASE_URL}/api/analyze/history`,
        country: `${API_BASE_URL}/api/analyze/country`,
        whale: `${API_BASE_URL}/api/analyze/whale`,
        insights: `${API_BASE_URL}/api/analyze/insights`,
        institutional: `${API_BASE_URL}/api/analyze/institutional`,
    },
    // Insights/News
    insights: {
        news: `${API_BASE_URL}/api/insights/news`,
        sources: `${API_BASE_URL}/api/insights/sources`,
    },
    // Institutional
    institutional: {
        imf: (code: string) => `${API_BASE_URL}/api/institutional/imf/${code}`,
        reports: (code: string) => `${API_BASE_URL}/api/institutional/reports/${code}`,
    },
    // Weather/Landing
    weather: {
        data: `${API_BASE_URL}/api/weather`,
    },
} as const;

// Helper function for fetch with common options
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}
