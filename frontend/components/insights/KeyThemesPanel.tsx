"use client";

import { KeyTheme, MultiArticleAnalysisResult } from "@/store/insightStore";

interface KeyThemesPanelProps {
  result: MultiArticleAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  language?: string;
}

export default function KeyThemesPanel({
  result,
  isLoading,
  error,
  onClose,
  language = "en",
}: KeyThemesPanelProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      case "bearish":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "📈";
      case "bearish":
        return "📉";
      default:
        return "➡️";
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    if (language === "ko") {
      switch (sentiment) {
        case "bullish":
          return "긍정적";
        case "bearish":
          return "부정적";
        default:
          return "중립";
      }
    }
    return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-[#0f1117] border-b border-white/10 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {language === "ko" ? "핵심 테마 분석" : "Key Themes Analysis"}
                </h2>
                {result && (
                  <p className="text-sm text-gray-400">
                    {language === "ko"
                      ? `${result.sources_analyzed}개 소스 분석 완료`
                      : `Analyzed ${result.sources_analyzed} sources`}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="mt-4 text-gray-400">
                {language === "ko" ? "테마 추출 중..." : "Extracting themes..."}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-4xl mb-4">⚠️</span>
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Empty Result State */}
          {result && !isLoading && result.key_themes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-4xl mb-4">📭</span>
              <p className="text-gray-400 text-center">
                {language === "ko"
                  ? "분석할 수 있는 테마가 발견되지 않았습니다.\n다른 기사를 선택해 주세요."
                  : "No themes could be extracted from the selected articles.\nTry selecting different articles."}
              </p>
            </div>
          )}

          {/* Results */}
          {result && !isLoading && result.key_themes.length > 0 && (
            <div className="space-y-6">
              {/* Overall Sentiment */}
              <div
                className={`p-4 rounded-xl border ${getSentimentColor(
                  result.overall_sentiment
                )}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">
                    {getSentimentIcon(result.overall_sentiment)}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-400">
                      {language === "ko" ? "전체 시장 심리" : "Overall Sentiment"}
                    </div>
                    <div className="text-lg font-bold">
                      {getSentimentLabel(result.overall_sentiment)}
                    </div>
                  </div>
                </div>
                <p className="text-sm opacity-80">{result.market_implications}</p>
              </div>

              {/* Key Themes */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">
                  {language === "ko" ? "주요 테마" : "Key Themes"}
                </h3>
                <div className="space-y-3">
                  {result.key_themes && result.key_themes.length > 0 ? (
                    result.key_themes.map((theme, index) => (
                      <ThemeCard key={index} theme={theme} language={language} />
                    ))
                  ) : (
                    <div className="p-4 bg-[#1a1a24] rounded-xl border border-white/5 text-center">
                      <span className="text-gray-500 text-sm">
                        {language === "ko"
                          ? "감지된 테마가 없습니다. 기사 내용이 충분하지 않을 수 있습니다."
                          : "No specific themes detected. Article content may be insufficient."}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Items */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">
                  {language === "ko" ? "권장 행동" : "Action Items"}
                </h3>
                <ul className="space-y-2">
                  {result.action_items.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <span className="text-emerald-400">✓</span>
                      <span className="text-sm text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  language,
}: {
  theme: KeyTheme;
  language: string;
}) {
  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            {language === "ko" ? "긍정" : "Bullish"}
          </span>
        );
      case "bearish":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            {language === "ko" ? "부정" : "Bearish"}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
            {language === "ko" ? "중립" : "Neutral"}
          </span>
        );
    }
  };

  return (
    <div className="p-4 bg-[#1a1a24] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white">{theme.theme}</span>
          {getSentimentBadge(theme.sentiment)}
        </div>
        {/* Relevance Bar */}
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
              style={{ width: `${theme.relevance * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {Math.round(theme.relevance * 100)}%
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-400">{theme.description}</p>
      {theme.related_articles.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {language === "ko"
            ? `${theme.related_articles.length}개 기사 관련`
            : `${theme.related_articles.length} articles related`}
        </div>
      )}
    </div>
  );
}
