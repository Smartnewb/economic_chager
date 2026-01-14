"use client";

import { useFXStore } from "@/store/fxStore";

interface PairCardProps {
    pair: string;
    rate: number;
    change24h: number;
    isSelected: boolean;
    onClick: () => void;
}

function PairCard({ pair, rate, change24h, isSelected, onClick }: PairCardProps) {
    const isPositive = change24h >= 0;
    const formatRate = (p: string, r: number) => {
        if (p.includes("JPY") || p.includes("KRW")) {
            return r.toFixed(2);
        }
        return r.toFixed(4);
    };

    return (
        <button
            onClick={onClick}
            className={`
                p-4 rounded-xl border transition-all duration-200
                ${isSelected
                    ? "bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                }
            `}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white">{pair}</span>
                <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                        isPositive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                    }`}
                >
                    {isPositive ? "+" : ""}{change24h.toFixed(2)}%
                </span>
            </div>
            <p className={`text-2xl font-bold ${isSelected ? "text-cyan-400" : "text-white"}`}>
                {formatRate(pair, rate)}
            </p>
        </button>
    );
}

export default function CurrencyPairChart() {
    const { metrics, isLoadingData, selectedPair, setSelectedPair } = useFXStore();

    if (isLoadingData) {
        return (
            <div className="w-full bg-black/30 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
                <div className="h-64 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-400">Loading FX data...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="w-full bg-black/30 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
                <div className="h-64 flex items-center justify-center">
                    <span className="text-gray-400">No FX data available</span>
                </div>
            </div>
        );
    }

    const selectedPairData = metrics.majorPairs.find((p) => p.pair === selectedPair);

    return (
        <div className="w-full bg-black/30 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Major Currency Pairs</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Select a pair to focus your analysis
                    </p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    metrics.riskSentiment === "risk_on"
                        ? "bg-yellow-500/20 border border-yellow-500/50"
                        : metrics.riskSentiment === "risk_off"
                        ? "bg-blue-500/20 border border-blue-500/50"
                        : "bg-gray-500/20 border border-gray-500/50"
                }`}>
                    <span className={`w-2 h-2 rounded-full ${
                        metrics.riskSentiment === "risk_on"
                            ? "bg-yellow-400 animate-pulse"
                            : metrics.riskSentiment === "risk_off"
                            ? "bg-blue-400"
                            : "bg-gray-400"
                    }`} />
                    <span className={`text-sm font-medium ${
                        metrics.riskSentiment === "risk_on"
                            ? "text-yellow-400"
                            : metrics.riskSentiment === "risk_off"
                            ? "text-blue-400"
                            : "text-gray-400"
                    }`}>
                        {metrics.riskSentiment === "risk_on" ? "Risk-On" : metrics.riskSentiment === "risk_off" ? "Risk-Off" : "Neutral"}
                    </span>
                </div>
            </div>

            {/* Currency Pairs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {metrics.majorPairs.map((pair) => (
                    <PairCard
                        key={pair.pair}
                        pair={pair.pair}
                        rate={pair.rate}
                        change24h={pair.change24h}
                        isSelected={selectedPair === pair.pair}
                        onClick={() => setSelectedPair(pair.pair)}
                    />
                ))}
            </div>

            {/* Selected Pair Detail */}
            {selectedPairData && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Selected for Analysis</p>
                            <p className="text-2xl font-bold text-cyan-400">{selectedPairData.pair}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-right">
                            <div>
                                <p className="text-xs text-gray-500">Current Rate</p>
                                <p className="text-lg font-bold text-white">
                                    {selectedPairData.pair.includes("JPY") || selectedPairData.pair.includes("KRW")
                                        ? selectedPairData.rate.toFixed(2)
                                        : selectedPairData.rate.toFixed(4)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">24h High</p>
                                <p className="text-lg font-bold text-green-400">
                                    {selectedPairData.pair.includes("JPY") || selectedPairData.pair.includes("KRW")
                                        ? selectedPairData.high24h.toFixed(2)
                                        : selectedPairData.high24h.toFixed(4)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">24h Low</p>
                                <p className="text-lg font-bold text-red-400">
                                    {selectedPairData.pair.includes("JPY") || selectedPairData.pair.includes("KRW")
                                        ? selectedPairData.low24h.toFixed(2)
                                        : selectedPairData.low24h.toFixed(4)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
