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

// Key Theme from multi-article analysis
export interface KeyTheme {
  theme: string;
  description: string;
  sentiment: "bullish" | "bearish" | "neutral";
  relevance: number;
  related_articles: string[];
}

// Multi-Article Analysis Result
export interface MultiArticleAnalysisResult {
  key_themes: KeyTheme[];
  overall_sentiment: "bullish" | "bearish" | "neutral";
  market_implications: string;
  action_items: string[];
  sources_analyzed: number;
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

  // Multi-Article Analysis State
  isAnalyzingMultiple: boolean;
  multiAnalysisResult: MultiArticleAnalysisResult | null;
  multiAnalysisError: string | null;
  showThemesPanel: boolean;

  // Actions
  fetchArticles: (useMock?: boolean) => Promise<void>;
  fetchSources: () => Promise<void>;
  fetchBehavioralBias: (vix?: number, rsi?: number, marketChange1m?: number, language?: string) => Promise<void>;
  selectArticle: (article: InsightArticle | null) => void;
  requestAnalysis: (article: InsightArticle, language?: string) => Promise<void>;
  requestMultiAnalysis: (articles: InsightArticle[], language?: string) => Promise<void>;
  closeAnalysisPanel: () => void;
  closeThemesPanel: () => void;
  reset: () => void;
}

const API_BASE = "http://localhost:8000";

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
  isAnalyzingMultiple: false,
  multiAnalysisResult: null,
  multiAnalysisError: null,
  showThemesPanel: false,

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

  // Request multi-article analysis for key themes
  requestMultiAnalysis: async (articles, language = "en") => {
    set({ isAnalyzingMultiple: true, multiAnalysisError: null, showThemesPanel: true });

    try {
      console.log("[Insights] Requesting multi-article analysis for", articles.length, "articles");

      const requestBody = {
        articles: articles.map(a => ({
          id: a.id,
          source: a.source,
          title: a.title,
          summary_raw: a.summary_raw,
        })),
        language,
      };
      console.log("[Insights] Request body:", JSON.stringify(requestBody, null, 2));

      const res = await fetch(`${API_BASE}/api/insights/analyze-multiple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("[Insights] Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[Insights] Error response:", errorText);
        throw new Error(`Analysis failed: ${res.status} - ${errorText}`);
      }

      const result = await res.json();
      console.log("[Insights] Analysis result:", result);

      // Validate result structure
      if (!result.key_themes || !Array.isArray(result.key_themes)) {
        console.warn("[Insights] No key_themes in result, using empty array");
        result.key_themes = [];
      }

      set({ multiAnalysisResult: result, isAnalyzingMultiple: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("[Insights] Multi-analysis error:", errorMessage);
      set({ multiAnalysisError: errorMessage, isAnalyzingMultiple: false });
    }
  },

  // Close themes panel
  closeThemesPanel: () => {
    set({ showThemesPanel: false });
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
      isAnalyzingMultiple: false,
      multiAnalysisResult: null,
      multiAnalysisError: null,
      showThemesPanel: false,
    });
  },
}));
