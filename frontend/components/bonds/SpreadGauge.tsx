"use client";

import { useBondStore } from "@/store/bondStore";

export default function SpreadGauge() {
    const { metrics, isLoadingData } = useBondStore();

    if (isLoadingData || !metrics) {
        return (
            <div className="w-full bg-black/30 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
                <div className="h-32 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    const { spread, isInverted } = metrics;

    // Gauge range: -2% to +2%
    const minSpread = -2;
    const maxSpread = 2;
    const range = maxSpread - minSpread;

    // Calculate position (0 to 100%)
    const clampedSpread = Math.max(minSpread, Math.min(maxSpread, spread));
    const position = ((clampedSpread - minSpread) / range) * 100;

    // Color based on spread value
    const getBarColor = () => {
        if (spread < -0.5) return "bg-gradient-to-r from-red-600 to-red-400";
        if (spread < 0) return "bg-gradient-to-r from-orange-600 to-orange-400";
        if (spread < 0.5) return "bg-gradient-to-r from-yellow-600 to-yellow-400";
        return "bg-gradient-to-r from-green-600 to-green-400";
    };

    const getStatusText = () => {
        if (spread < -0.5) return { text: "DEEP INVERSION", color: "text-red-400" };
        if (spread < 0) return { text: "INVERTED", color: "text-orange-400" };
        if (spread < 0.25) return { text: "FLAT", color: "text-yellow-400" };
        return { text: "NORMAL", color: "text-green-400" };
    };

    const status = getStatusText();

    return (
        <div className="w-full bg-black/30 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Recession Watch
                        {isInverted && (
                            <span className="animate-pulse">
                                <svg
                                    className="w-5 h-5 text-red-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </span>
                        )}
                    </h3>
                    <p className="text-sm text-gray-400">10Y - 2Y Treasury Spread</p>
                </div>
                <div className="text-right">
                    <p className={`text-3xl font-bold ${status.color}`}>
                        {spread >= 0 ? "+" : ""}
                        {spread.toFixed(2)}%
                    </p>
                    <p className={`text-sm font-semibold ${status.color}`}>{status.text}</p>
                </div>
            </div>

            {/* Gauge Bar */}
            <div className="relative mt-6 mb-2">
                {/* Background Bar */}
                <div className="h-6 rounded-full bg-gradient-to-r from-red-900/50 via-yellow-900/50 to-green-900/50 border border-white/10">
                    {/* Fill Bar */}
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
                        style={{ width: `${position}%` }}
                    />
                </div>

                {/* Indicator */}
                <div
                    className="absolute top-0 -translate-x-1/2 transition-all duration-500"
                    style={{ left: `${position}%` }}
                >
                    <div className="w-1 h-6 bg-white rounded-full shadow-lg shadow-white/30" />
                    <div className="w-3 h-3 bg-white rounded-full -mt-1 -ml-1 shadow-lg shadow-white/50" />
                </div>

                {/* Zero Line Marker */}
                <div
                    className="absolute top-0 w-0.5 h-8 -mt-1 bg-white/30"
                    style={{ left: "50%" }}
                />
            </div>

            {/* Scale Labels */}
            <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                <span>-2%</span>
                <span className="text-red-400">Inverted</span>
                <span>0%</span>
                <span className="text-green-400">Normal</span>
                <span>+2%</span>
            </div>

            {/* Explanation Box */}
            <div
                className={`mt-6 p-4 rounded-xl border ${
                    isInverted
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-green-500/10 border-green-500/30"
                }`}
            >
                <p className={`text-sm ${isInverted ? "text-red-300" : "text-green-300"}`}>
                    {isInverted ? (
                        <>
                            <strong>Warning:</strong> An inverted yield curve (short-term rates
                            higher than long-term) has historically preceded every US recession.
                            The bond market is signaling that investors expect economic slowdown.
                        </>
                    ) : (
                        <>
                            <strong>Normal:</strong> Long-term bonds yield more than short-term,
                            indicating healthy economic growth expectations. Investors require
                            higher compensation for longer-term risk.
                        </>
                    )}
                </p>
            </div>

            {/* Historical Context */}
            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400">2Y Yield (Fed Policy)</p>
                    <p className="text-lg font-bold text-blue-400">
                        {metrics.yield2Y.toFixed(2)}%
                    </p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400">10Y Yield (Global Benchmark)</p>
                    <p className="text-lg font-bold text-cyan-400">
                        {metrics.yield10Y.toFixed(2)}%
                    </p>
                </div>
            </div>
        </div>
    );
}
