import { create } from "zustand";

// Insight Article from RSS
export interface InsightArticle {
  id: string;
  source: string;
  source_icon: string;
  title: string;
  link: string;
  published: string | null;
  summary_raw: string;
  full_text?: string | null;
}

// Source info
export interface InsightSource {
  name: string;
  icon: string;
  category: string;
  description: string;
}

// Behavioral Bias Warning
export interface BehavioralBias {
  name: string;
  warning: string;
  icon: string;
  condition: string;
  indicator: string;
}

// AI Analysis Result
export interface InsightAnalysisResult {
  article_id: string;
  translator_response: string;
  synthesis: string;
}

interface InsightState {
  // Data State
  articles: InsightArticle[];
  sources: InsightSource[];
  selectedArticle: InsightArticle | null;

  // Behavioral Bias
  behavioralBias: BehavioralBias | null;

  // UI State
  isLoadingArticles: boolean;
  isLoadingSources: boolean;
  articlesError: string | null;

  // Analysis State
  isAnalyzing: boolean;
  analysisResult: InsightAnalysisResult | null;
  analysisError: string | null;
  showAnalysisPanel: boolean;

  // Actions
  fetchArticles: (useMock?: boolean) => Promise<void>;
  fetchSources: () => Promise<void>;
  fetchBehavioralBias: (vix?: number, rsi?: number, marketChange1m?: number, language?: string) => Promise<void>;
  selectArticle: (article: InsightArticle | null) => void;
  requestAnalysis: (article: InsightArticle, language?: string) => Promise<void>;
  closeAnalysisPanel: () => void;
  reset: () => void;
}

const API_BASE = "http://localhost:8001";

export const useInsightStore = create<InsightState>((set, get) => ({
  // Initial State
  articles: [],
  sources: [],
  selectedArticle: null,
  behavioralBias: null,
  isLoadingArticles: false,
  isLoadingSources: false,
  articlesError: null,
  isAnalyzing: false,
  analysisResult: null,
  analysisError: null,
  showAnalysisPanel: false,

  // Fetch RSS articles
  fetchArticles: async (useMock = false) => {
    set({ isLoadingArticles: true, articlesError: null });
    try {
      const res = await fetch(`${API_BASE}/api/insights/list?use_mock=${useMock}&max_per_source=3`);
      if (!res.ok) throw new Error("Failed to fetch articles");
      const data = await res.json();
      set({ articles: data.articles, isLoadingArticles: false });
    } catch (error) {
      set({ articlesError: (error as Error).message, isLoadingArticles: false });
    }
  },

  // Fetch available sources
  fetchSources: async () => {
    set({ isLoadingSources: true });
    try {
      const res = await fetch(`${API_BASE}/api/insights/sources`);
      if (!res.ok) throw new Error("Failed to fetch sources");
      const data = await res.json();
      set({ sources: data.sources, isLoadingSources: false });
    } catch (error) {
      set({ isLoadingSources: false });
    }
  },

  // Fetch behavioral bias warning
  fetchBehavioralBias: async (vix?: number, rsi?: number, marketChange1m?: number, language = "en") => {
    try {
      const params = new URLSearchParams();
      if (vix !== undefined) params.append("vix", vix.toString());
      if (rsi !== undefined) params.append("rsi", rsi.toString());
      if (marketChange1m !== undefined) params.append("market_change_1m", marketChange1m.toString());
      params.append("language", language);

      const res = await fetch(`${API_BASE}/api/insights/behavioral-bias?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bias");
      const data = await res.json();
      set({ behavioralBias: data.has_warning ? data.bias : null });
    } catch (error) {
      set({ behavioralBias: null });
    }
  },

  // Select article
  selectArticle: (article) => {
    set({ selectedArticle: article, analysisResult: null, analysisError: null });
  },

  // Request AI analysis
  requestAnalysis: async (article, language = "en") => {
    set({ isAnalyzing: true, analysisError: null, showAnalysisPanel: true });

    try {
      // Check cache first
      const cacheRes = await fetch(
        `${API_BASE}/api/analyze/insights/cached?article_id=${article.id}&language=${language}`
      );
      const cacheData = await cacheRes.json();

      if (cacheData.cached && cacheData.result) {
        set({ analysisResult: cacheData.result, isAnalyzing: false });
        return;
      }

      // Request new analysis
      const res = await fetch(`${API_BASE}/api/analyze/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: article.id,
          source: article.source,
          title: article.title,
          original_text: article.summary_raw + (article.full_text || ""),
          language,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const result = await res.json();
      set({ analysisResult: result, isAnalyzing: false });
    } catch (error) {
      set({ analysisError: (error as Error).message, isAnalyzing: false });
    }
  },

  // Close analysis panel
  closeAnalysisPanel: () => {
    set({ showAnalysisPanel: false });
  },

  // Reset state
  reset: () => {
    set({
      articles: [],
      selectedArticle: null,
      behavioralBias: null,
      isLoadingArticles: false,
      articlesError: null,
      isAnalyzing: false,
      analysisResult: null,
      analysisError: null,
      showAnalysisPanel: false,
    });
  },
}));
