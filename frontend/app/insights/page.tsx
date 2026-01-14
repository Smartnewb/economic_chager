"use client";

import { useEffect, useState } from "react";
import { useInsightStore, InsightArticle } from "@/store/insightStore";
import { useI18n } from "@/lib/i18n";
import Navigation, { StatusIndicator } from "@/components/Navigation";
import InsightCard from "@/components/insights/InsightCard";
import BehavioralBiasWidget from "@/components/insights/BehavioralBiasWidget";
import InsightAnalysisPanel from "@/components/insights/InsightAnalysisPanel";

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
  } = useInsightStore();
  const { t, language } = useI18n();

  const [selectedSource, setSelectedSource] = useState<string>("all");

  useEffect(() => {
    fetchSources();
    fetchArticles(true); // Use mock data for now
    fetchBehavioralBias();
  }, [fetchSources, fetchArticles, fetchBehavioralBias]);

  // Filter articles by selected source
  const filteredArticles =
    selectedSource === "all"
      ? articles
      : articles.filter((a) => a.source === selectedSource);

  // Handle article selection
  const handleSelectArticle = (article: InsightArticle) => {
    selectArticle(article);
  };

  // Handle analyze button click
  const handleAnalyze = async () => {
    if (!selectedArticle) return;
    await requestAnalysis(selectedArticle, language);
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

          {/* Source Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedSource("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedSource === "all"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/5 text-gray-400 border border-transparent hover:text-white hover:bg-white/10"
                }`}
              >
                🌐 {t("insights.allSources")}
              </button>
              {sources.map((source) => (
                <button
                  key={source.name}
                  onClick={() => setSelectedSource(source.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedSource === source.name
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-gray-400 border border-transparent hover:text-white hover:bg-white/10"
                  }`}
                >
                  {source.icon} {source.name}
                </button>
              ))}
            </div>
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
    </div>
  );
}
