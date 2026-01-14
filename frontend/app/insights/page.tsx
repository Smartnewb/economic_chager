"use client";

import { useEffect, useState } from "react";
import { useInsightStore, InsightArticle } from "@/store/insightStore";
import { useI18n } from "@/lib/i18n";
import Navigation, { StatusIndicator } from "@/components/Navigation";
import InsightCard from "@/components/insights/InsightCard";
import BehavioralBiasWidget from "@/components/insights/BehavioralBiasWidget";
import InsightAnalysisPanel from "@/components/insights/InsightAnalysisPanel";
import KeyThemesPanel from "@/components/insights/KeyThemesPanel";

export default function InsightsPage() {
  const {
    articles,
    sources,
    behavioralBias,
    selectedArticle,
    analysisResult,
    isLoadingArticles,
    isAnalyzing,
    articlesError,
    analysisError,
    showAnalysisPanel,
    fetchArticles,
    fetchSources,
    fetchBehavioralBias,
    selectArticle,
    requestAnalysis,
    closeAnalysisPanel,
    isAnalyzingMultiple,
    multiAnalysisResult,
    multiAnalysisError,
    showThemesPanel,
    requestMultiAnalysis,
    closeThemesPanel,
  } = useInsightStore();
  const { t, language } = useI18n();

  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [showSentimentBreakdown, setShowSentimentBreakdown] = useState(false);

  useEffect(() => {
    fetchSources();
    fetchArticles(true); // Use mock data for now
    fetchBehavioralBias();
  }, [fetchSources, fetchArticles, fetchBehavioralBias]);

  // Toggle source selection
  const toggleSource = (sourceName: string) => {
    setSelectedSources((prev) => {
      if (prev.includes(sourceName)) {
        return prev.filter((s) => s !== sourceName);
      }
      return [...prev, sourceName];
    });
  };

  // Select all sources
  const selectAllSources = () => {
    setSelectedSources([]);
  };

  // Filter articles by selected sources
  const filteredArticles =
    selectedSources.length === 0
      ? articles
      : articles.filter((a) => selectedSources.includes(a.source));

  // Calculate sentiment breakdown
  const sentimentBreakdown = {
    bullish: filteredArticles.filter((a) => (a.sentiment || 0) > 0.2).length,
    neutral: filteredArticles.filter((a) => Math.abs(a.sentiment || 0) <= 0.2).length,
    bearish: filteredArticles.filter((a) => (a.sentiment || 0) < -0.2).length,
  };

  // Handle article selection
  const handleSelectArticle = (article: InsightArticle) => {
    selectArticle(article);
  };

  // Handle analyze button click
  const handleAnalyze = async () => {
    if (!selectedArticle) return;
    await requestAnalysis(selectedArticle, language);
  };

  // Handle analyze themes for filtered articles
  const handleAnalyzeThemes = async () => {
    if (filteredArticles.length === 0) return;
    await requestMultiAnalysis(filteredArticles, language);
  };

  // Close panel handler
  const handleClosePanel = () => {
    closeAnalysisPanel();
    selectArticle(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navigation Header */}
      <Navigation
        statusIndicator={
          <StatusIndicator
            status={articles.length > 0 ? "live" : "loading"}
            label={articles.length > 0 ? `${articles.length} articles` : undefined}
          />
        }
      />

      {/* Main Content */}
      <main className="pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">💡</span>
              <h1 className="text-3xl font-bold text-white">
                {t("insights.title")}
              </h1>
            </div>
            <p className="text-gray-400">{t("insights.subtitle")}</p>
          </div>

          {/* Behavioral Bias Widget */}
          {behavioralBias && (
            <div className="mb-8">
              <BehavioralBiasWidget bias={behavioralBias} />
            </div>
          )}

          {/* Source Filter - Multi-select */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-400 uppercase">Sources</span>
                <span className="text-xs text-gray-500">
                  ({selectedSources.length === 0 ? 'All' : `${selectedSources.length} selected`})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAnalyzeThemes}
                  disabled={filteredArticles.length === 0 || isAnalyzingMultiple}
                  className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  {isAnalyzingMultiple ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{language === "ko" ? "분석 중..." : "Analyzing..."}</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>{language === "ko" ? "테마 분석" : "Analyze Themes"}</span>
                      <span className="opacity-70">({filteredArticles.length})</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowSentimentBreakdown(!showSentimentBreakdown)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  📊 {showSentimentBreakdown ? 'Hide' : 'Show'} Sentiment Breakdown
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={selectAllSources}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedSources.length === 0
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/5 text-gray-400 border border-transparent hover:text-white hover:bg-white/10"
                }`}
              >
                🌐 {t("insights.allSources")}
              </button>
              {sources.map((source) => (
                <button
                  key={source.name}
                  onClick={() => toggleSource(source.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedSources.includes(source.name)
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-gray-400 border border-transparent hover:text-white hover:bg-white/10"
                  }`}
                >
                  {selectedSources.includes(source.name) && <span className="text-emerald-400">✓</span>}
                  {source.icon} {source.name}
                </button>
              ))}
            </div>

            {/* Sentiment Breakdown */}
            {showSentimentBreakdown && (
              <div className="mt-4 p-4 bg-[#0f1117] rounded-lg border border-white/5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase">Sentiment Distribution</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span className="text-sm text-green-400 font-mono">{sentimentBreakdown.bullish}</span>
                      <span className="text-xs text-gray-500">Bullish</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                      <span className="text-sm text-gray-400 font-mono">{sentimentBreakdown.neutral}</span>
                      <span className="text-xs text-gray-500">Neutral</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      <span className="text-sm text-red-400 font-mono">{sentimentBreakdown.bearish}</span>
                      <span className="text-xs text-gray-500">Bearish</span>
                    </div>
                  </div>
                </div>

                {/* Sentiment Bar */}
                <div className="mt-3 h-2 bg-[#27272a] rounded-full overflow-hidden flex">
                  <div
                    className="bg-green-500 transition-all"
                    style={{ width: `${(sentimentBreakdown.bullish / filteredArticles.length) * 100 || 0}%` }}
                  />
                  <div
                    className="bg-gray-500 transition-all"
                    style={{ width: `${(sentimentBreakdown.neutral / filteredArticles.length) * 100 || 0}%` }}
                  />
                  <div
                    className="bg-red-500 transition-all"
                    style={{ width: `${(sentimentBreakdown.bearish / filteredArticles.length) * 100 || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoadingArticles && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="mt-4 text-gray-400">{t("insights.loading")}</p>
            </div>
          )}

          {/* Error State */}
          {articlesError && !isLoadingArticles && (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="text-4xl mb-4">⚠️</span>
              <p className="text-red-400 mb-4">{articlesError}</p>
              <button
                onClick={() => fetchArticles()}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                {t("insights.retry")}
              </button>
            </div>
          )}

          {/* Articles Grid */}
          {!isLoadingArticles && !articlesError && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArticles.map((article) => (
                  <InsightCard
                    key={article.id}
                    article={article}
                    onSelect={handleSelectArticle}
                    isSelected={selectedArticle?.id === article.id}
                  />
                ))}
              </div>

              {/* Analyze Button - Show when article is selected */}
              {selectedArticle && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg shadow-emerald-500/20"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{language === "ko" ? "분석 중..." : "Analyzing..."}</span>
                      </>
                    ) : (
                      <>
                        <span>🤖</span>
                        <span>{t("insights.analyze")}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoadingArticles && !articlesError && filteredArticles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="text-4xl mb-4">📭</span>
              <p className="text-gray-400">{t("insights.noArticles")}</p>
            </div>
          )}

          {/* Educational Section */}
          <div className="mt-16">
            <h2 className="text-xl font-bold text-white mb-6">
              {language === "ko" ? "주요 기관 소개" : "Key Institutions"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-[#0f1117] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="text-3xl mb-3">🏛️</div>
                <h3 className="text-base font-bold text-white mb-2">
                  {t("insights.imfCard")}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {t("insights.imfCardDesc")}
                </p>
              </div>

              <div className="p-5 bg-[#0f1117] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="text-3xl mb-3">🏦</div>
                <h3 className="text-base font-bold text-white mb-2">
                  {t("insights.fedCard")}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {t("insights.fedCardDesc")}
                </p>
              </div>

              <div className="p-5 bg-[#0f1117] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="text-3xl mb-3">🌍</div>
                <h3 className="text-base font-bold text-white mb-2">
                  {t("insights.bisCard")}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {t("insights.bisCardDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mt-12 p-6 bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 rounded-xl border border-white/5">
            <h2 className="text-lg font-bold text-white mb-6">
              {t("insights.howItWorks")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">
                    {t("insights.step1Title")}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {t("insights.step1Desc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">
                    {t("insights.step2Title")}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {t("insights.step2Desc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">
                    {t("insights.step3Title")}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {t("insights.step3Desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">{t("insights.dataSource")}</p>
          </div>
        </div>
      </main>

      {/* Analysis Panel */}
      {showAnalysisPanel && (
        <InsightAnalysisPanel
          article={selectedArticle}
          result={analysisResult}
          isAnalyzing={isAnalyzing}
          error={analysisError}
          onClose={handleClosePanel}
        />
      )}

      {/* Key Themes Panel */}
      {showThemesPanel && (
        <KeyThemesPanel
          result={multiAnalysisResult}
          isLoading={isAnalyzingMultiple}
          error={multiAnalysisError}
          onClose={closeThemesPanel}
          language={language}
        />
      )}
    </div>
  );
}
