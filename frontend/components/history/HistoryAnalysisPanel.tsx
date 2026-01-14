"use client";

import { useHistoryStore } from "@/store/historyStore";
import { useI18n } from "@/lib/i18n";

export default function HistoryAnalysisPanel() {
    const {
        showAnalysisPanel,
        closeAnalysisPanel,
        isAnalyzing,
        analysisResult,
        analysisError,
        matches,
        currentConditions,
    } = useHistoryStore();
    const { t } = useI18n();

    if (!showAnalysisPanel) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={closeAnalysisPanel}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-gray-900/95 backdrop-blur-lg border-l border-white/10 z-50 overflow-hidden flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">&#x1F4DC;</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {t("history.historianAnalysis")}
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {isAnalyzing
                                    ? t("history.consultingHistorian")
                                    : t("history.historicalPerspective")}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={closeAnalysisPanel}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg
                            className="w-6 h-6 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Error State */}
                    {analysisError && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                            <p className="text-red-400">{analysisError}</p>
                        </div>
                    )}

                    {/* Loading State */}
                    {isAnalyzing && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                <div>
                                    <p className="text-white font-medium">
                                        {t("history.historianThinking")}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        {t("history.analyzingPatterns")}
                                    </p>
                                </div>
                            </div>

                            {/* Skeleton Loader */}
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 opacity-50">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl">
                                        &#x1F4DC;
                                    </div>
                                    <div>
                                        <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
                                        <div className="h-3 w-24 bg-white/10 rounded mt-1 animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
                                    <div className="h-3 w-4/5 bg-white/10 rounded animate-pulse" />
                                    <div className="h-3 w-3/5 bg-white/10 rounded animate-pulse" />
                                    <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
                                    <div className="h-3 w-2/3 bg-white/10 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {analysisResult && !isAnalyzing && (
                        <div className="space-y-6">
                            {/* Market Context Header */}
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">
                                    {t("history.currentContext")}
                                </h3>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500">CAPE</p>
                                        <p className="text-lg font-bold text-amber-400">
                                            {currentConditions.cape}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">{t("history.rate")}</p>
                                        <p className="text-lg font-bold text-blue-400">
                                            {currentConditions.interest_rate}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">{t("history.inflation")}</p>
                                        <p className="text-lg font-bold text-cyan-400">
                                            {currentConditions.inflation}%
                                        </p>
                                    </div>
                                </div>

                                {/* Top Matches Summary */}
                                <div className="border-t border-white/10 pt-3">
                                    <p className="text-xs text-gray-500 mb-2">{t("history.topMatches")}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {matches.slice(0, 3).map((match, i) => (
                                            <div
                                                key={match.year}
                                                className="px-3 py-1 bg-white/10 rounded-full text-sm"
                                            >
                                                <span className="text-gray-400">#{i + 1}</span>{" "}
                                                <span className="text-white font-medium">{match.year}</span>
                                                <span className="text-amber-400 ml-1">
                                                    {match.similarity.toFixed(0)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* The Historian Response */}
                            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-900/10 border border-amber-500/30">
                                {/* Historian Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg">
                                        &#x1F4DC;
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-lg">
                                            The Historian
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {t("history.historianStyle")}
                                        </p>
                                    </div>
                                </div>

                                {/* Quote decoration */}
                                <div className="relative pl-4 border-l-2 border-amber-500/50">
                                    <span className="absolute -left-3 -top-2 text-4xl text-amber-500/30">
                                        &#x201C;
                                    </span>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {analysisResult.historian_response}
                                    </p>
                                </div>
                            </div>

                            {/* Synthesis */}
                            {analysisResult.synthesis && (
                                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xl">&#x1F3AF;</span>
                                        <h3 className="font-bold text-white">
                                            {t("history.synthesisTitle")}
                                        </h3>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {analysisResult.synthesis}
                                    </p>
                                </div>
                            )}

                            {/* Historical Disclaimer */}
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <p className="text-xs text-yellow-300/80 italic">
                                    &#x26A0; {t("history.disclaimer")}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={closeAnalysisPanel}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                    >
                        {t("history.closePanel")}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </>
    );
}
