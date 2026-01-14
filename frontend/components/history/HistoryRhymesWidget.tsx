"use client";

import { useEffect } from "react";
import { useHistoryStore, HistoricalMatch } from "@/store/historyStore";
import { useI18n } from "@/lib/i18n";

// Similarity color scale
const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 90) return "text-red-400";
    if (similarity >= 80) return "text-orange-400";
    if (similarity >= 70) return "text-yellow-400";
    if (similarity >= 60) return "text-green-400";
    return "text-blue-400";
};

// Get background gradient based on similarity
const getSimilarityGradient = (similarity: number): string => {
    if (similarity >= 90) return "from-red-500/20 to-red-900/20";
    if (similarity >= 80) return "from-orange-500/20 to-orange-900/20";
    if (similarity >= 70) return "from-yellow-500/20 to-yellow-900/20";
    if (similarity >= 60) return "from-green-500/20 to-green-900/20";
    return "from-blue-500/20 to-blue-900/20";
};

// Get return color
const getReturnColor = (ret: number | null): string => {
    if (ret === null) return "text-gray-500";
    if (ret > 10) return "text-green-400";
    if (ret > 0) return "text-green-300";
    if (ret > -10) return "text-red-300";
    return "text-red-400";
};

// Historical Match Card Component
function MatchCard({ match, rank }: { match: HistoricalMatch; rank: number }) {
    const { t, language } = useI18n();

    const yearLabel = match.period_name || `${match.year} Period`;

    return (
        <div
            className={`relative p-4 rounded-xl bg-gradient-to-br ${getSimilarityGradient(
                match.similarity
            )} border border-white/10 hover:border-white/20 transition-all group cursor-pointer`}
        >
            {/* Rank Badge */}
            <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                #{rank}
            </div>

            {/* Similarity Score */}
            <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                <span className={`text-sm font-bold ${getSimilarityColor(match.similarity)}`}>
                    {match.similarity.toFixed(1)}%
                </span>
            </div>

            {/* Year & Period Name */}
            <div className="mt-4 mb-3">
                <h3 className="text-xl font-bold text-white">
                    {match.year}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-1">
                    {yearLabel}
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-black/20 rounded-lg">
                    <p className="text-xs text-gray-500">CAPE</p>
                    <p className="text-sm font-bold text-white">{match.cape?.toFixed(1) || "N/A"}</p>
                </div>
                <div className="text-center p-2 bg-black/20 rounded-lg">
                    <p className="text-xs text-gray-500">{t("history.rate")}</p>
                    <p className="text-sm font-bold text-white">{match.interest_rate?.toFixed(1) || "N/A"}%</p>
                </div>
                <div className="text-center p-2 bg-black/20 rounded-lg">
                    <p className="text-xs text-gray-500">{t("history.inflation")}</p>
                    <p className="text-sm font-bold text-white">{match.inflation?.toFixed(1) || "N/A"}%</p>
                </div>
            </div>

            {/* Forward Returns */}
            <div className="border-t border-white/10 pt-3">
                <p className="text-xs text-gray-500 mb-2">{t("history.forwardReturns")}</p>
                <div className="flex justify-between">
                    <div className="text-center">
                        <p className="text-xs text-gray-500">1Y</p>
                        <p className={`text-sm font-bold ${getReturnColor(match.forward_return_1y)}`}>
                            {match.forward_return_1y !== null
                                ? `${match.forward_return_1y > 0 ? "+" : ""}${match.forward_return_1y.toFixed(0)}%`
                                : "N/A"}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">3Y</p>
                        <p className={`text-sm font-bold ${getReturnColor(match.forward_return_3y)}`}>
                            {match.forward_return_3y !== null
                                ? `${match.forward_return_3y > 0 ? "+" : ""}${match.forward_return_3y.toFixed(0)}%`
                                : "N/A"}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">5Y</p>
                        <p className={`text-sm font-bold ${getReturnColor(match.forward_return_5y)}`}>
                            {match.forward_return_5y !== null
                                ? `${match.forward_return_5y > 0 ? "+" : ""}${match.forward_return_5y.toFixed(0)}%`
                                : "N/A"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Description hover effect */}
            {match.description && (
                <div className="absolute inset-0 bg-black/90 rounded-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center">
                    <p className="text-sm text-gray-300 leading-relaxed">
                        {match.description}
                    </p>
                </div>
            )}
        </div>
    );
}

// Loading Skeleton
function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse"
                >
                    <div className="h-6 bg-white/10 rounded mb-3" />
                    <div className="h-4 bg-white/10 rounded w-2/3 mb-4" />
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="h-12 bg-white/10 rounded" />
                        <div className="h-12 bg-white/10 rounded" />
                        <div className="h-12 bg-white/10 rounded" />
                    </div>
                    <div className="h-16 bg-white/10 rounded" />
                </div>
            ))}
        </div>
    );
}

export default function HistoryRhymesWidget() {
    const {
        matches,
        currentConditions,
        isLoading,
        error,
        fetchHistoricalParallels,
        requestAnalysis,
        isAnalyzing,
    } = useHistoryStore();
    const { t, language } = useI18n();

    useEffect(() => {
        fetchHistoricalParallels();
    }, [fetchHistoricalParallels]);

    return (
        <div className="p-6 bg-black/30 rounded-2xl border border-white/10 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">&#x1F3DB;</span>
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {t("history.title")}
                        </h2>
                        <p className="text-sm text-gray-400">
                            {t("history.subtitle")}
                        </p>
                    </div>
                </div>

                {/* Current Conditions Summary */}
                {currentConditions && (
                    <div className="hidden md:flex items-center gap-4 text-sm">
                        <div className="px-3 py-1 bg-white/5 rounded-lg">
                            <span className="text-gray-400">CAPE:</span>{" "}
                            <span className="text-white font-bold">{currentConditions.cape}</span>
                        </div>
                        <div className="px-3 py-1 bg-white/5 rounded-lg">
                            <span className="text-gray-400">{t("history.rate")}:</span>{" "}
                            <span className="text-white font-bold">{currentConditions.interest_rate}%</span>
                        </div>
                        <div className="px-3 py-1 bg-white/5 rounded-lg">
                            <span className="text-gray-400">{t("history.inflation")}:</span>{" "}
                            <span className="text-white font-bold">{currentConditions.inflation}%</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl mb-6">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading && <LoadingSkeleton />}

            {/* Matches Grid */}
            {!isLoading && matches.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                        {matches.map((match, index) => (
                            <MatchCard
                                key={`${match.year}-${match.date}`}
                                match={match}
                                rank={index + 1}
                            />
                        ))}
                    </div>

                    {/* Analysis Trigger */}
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => requestAnalysis(language)}
                            disabled={isAnalyzing}
                            className={`
                                px-6 py-3 rounded-xl font-bold transition-all
                                ${isAnalyzing
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105"
                                }
                            `}
                        >
                            {isAnalyzing ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {t("history.analyzing")}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <span>&#x1F4DC;</span>
                                    {t("history.askHistorian")}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span>{t("history.veryHighSimilarity")} (90%+)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500" />
                                <span>{t("history.highSimilarity")} (80-90%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span>{t("history.mediumSimilarity")} (70-80%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span>{t("history.lowSimilarity")} (&lt;70%)</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Empty State */}
            {!isLoading && matches.length === 0 && !error && (
                <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">&#x1F50D;</span>
                    <p className="text-gray-400">{t("history.noData")}</p>
                </div>
            )}
        </div>
    );
}
