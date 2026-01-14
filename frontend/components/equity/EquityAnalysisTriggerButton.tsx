"use client";

import { useEquityStore } from "@/store/equityStore";
import { useI18n } from "@/lib/i18n";

export default function EquityAnalysisTriggerButton() {
    const { requestAnalysis, isAnalyzing, isLoadingData, globalIndices, sectors, vix } =
        useEquityStore();
    const { language } = useI18n();

    const isReady = !isLoadingData && globalIndices.length > 0 && sectors.length > 0;

    // Calculate market sentiment
    const usIndices = globalIndices.filter((i) => i.region === "US");
    const avgChange =
        usIndices.length > 0
            ? usIndices.reduce((sum, i) => sum + i.change, 0) / usIndices.length
            : 0;
    const sentiment = avgChange > 0.5 ? "bullish" : avgChange < -0.5 ? "bearish" : "neutral";

    // Top performing sector
    const topSector =
        sectors.length > 0 ? [...sectors].sort((a, b) => b.change - a.change)[0] : null;

    return (
        <div className="flex flex-col items-center">
            {/* Market Summary Preview */}
            {isReady && (
                <div className="mb-6 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">US Markets:</span>
                            <span
                                className={`font-bold ${avgChange >= 0 ? "text-green-400" : "text-red-400"}`}
                            >
                                {avgChange >= 0 ? "+" : ""}
                                {avgChange.toFixed(2)}%
                            </span>
                        </div>
                        <div className="w-px h-4 bg-white/20" />
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">VIX:</span>
                            <span
                                className={`font-bold ${vix && vix.level === "low" ? "text-green-400" : vix && vix.level === "extreme" ? "text-red-400" : "text-yellow-400"}`}
                            >
                                {vix?.value.toFixed(1) || "--"}
                            </span>
                        </div>
                        {topSector && (
                            <>
                                <div className="w-px h-4 bg-white/20" />
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm">Hot:</span>
                                    <span className="text-green-400 font-medium">
                                        {topSector.shortName}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Trigger Button */}
            <button
                onClick={() => requestAnalysis(language)}
                disabled={!isReady || isAnalyzing}
                className={`
          group relative px-8 py-4 rounded-2xl font-bold text-lg
          transition-all duration-300 transform
          ${
              isReady && !isAnalyzing
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }
        `}
            >
                {/* Animated background */}
                {isReady && !isAnalyzing && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/50 to-pink-600/50 blur-xl group-hover:blur-2xl transition-all duration-300 -z-10" />
                )}

                {/* Button content */}
                <div className="flex items-center gap-3">
                    {isAnalyzing ? (
                        <>
                            <svg
                                className="animate-spin h-5 w-5"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            <span>Board is Debating...</span>
                        </>
                    ) : !isReady ? (
                        <>
                            <span className="text-xl">⏳</span>
                            <span>Loading Market Data...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-xl">📊</span>
                            <span>Analyze the Market</span>
                            <span className="text-xl">🔥</span>
                        </>
                    )}
                </div>
            </button>

            {/* Sentiment hint */}
            {isReady && !isAnalyzing && (
                <p className="mt-4 text-sm text-gray-500">
                    Market sentiment is{" "}
                    <span
                        className={`font-medium ${sentiment === "bullish" ? "text-green-400" : sentiment === "bearish" ? "text-red-400" : "text-gray-400"}`}
                    >
                        {sentiment}
                    </span>
                    . Click to hear what Musk, Buffett, and Thiel think.
                </p>
            )}
        </div>
    );
}
