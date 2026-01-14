"use client";

import { useFXStore } from "@/store/fxStore";
import { useI18n } from "@/lib/i18n";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function DollarIndexGauge() {
    const { metrics, isLoadingData } = useFXStore();
    const { t } = useI18n();

    if (isLoadingData || !metrics) {
        return (
            <div className="w-full bg-black/30 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
                <div className="h-48 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    const { dollarIndex } = metrics;

    // DXY typically ranges from 90 to 115
    const minDXY = 90;
    const maxDXY = 115;
    const range = maxDXY - minDXY;

    const clampedValue = Math.max(minDXY, Math.min(maxDXY, dollarIndex.value));
    const position = ((clampedValue - minDXY) / range) * 100;

    const getTrendColor = () => {
        switch (dollarIndex.trend) {
            case "strong":
                return "text-green-400";
            case "weak":
                return "text-red-400";
            default:
                return "text-yellow-400";
        }
    };

    const getTrendText = () => {
        switch (dollarIndex.trend) {
            case "strong":
                return "STRONG DOLLAR";
            case "weak":
                return "WEAK DOLLAR";
            default:
                return "NEUTRAL";
        }
    };

    const getBarGradient = () => {
        if (dollarIndex.trend === "strong") {
            return "bg-gradient-to-r from-yellow-500 via-green-500 to-green-400";
        } else if (dollarIndex.trend === "weak") {
            return "bg-gradient-to-r from-red-500 to-red-400";
        }
        return "bg-gradient-to-r from-yellow-600 to-yellow-400";
    };

    return (
        <div className="w-full bg-black/30 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {t("fx.dollarIndex")}
                        <span className="text-xl">💵</span>
                        <InfoTooltip content={t("fx.dollarIndexDesc")} />
                    </h3>
                    <p className="text-sm text-gray-400">{t("fx.globalDollarStrength")}</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-white">
                        {dollarIndex.value.toFixed(2)}
                    </p>
                    <p className={`text-sm font-semibold ${getTrendColor()}`}>
                        {getTrendText()}
                    </p>
                </div>
            </div>

            {/* Change Badge */}
            <div className="flex items-center gap-2 mb-4">
                <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                        dollarIndex.change24h >= 0
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                    }`}
                >
                    {dollarIndex.change24h >= 0 ? "+" : ""}{dollarIndex.change24h.toFixed(2)}% (24h)
                </span>
            </div>

            {/* Gauge Bar */}
            <div className="relative mt-6 mb-2">
                {/* Background Bar */}
                <div className="h-6 rounded-full bg-gradient-to-r from-red-900/50 via-yellow-900/50 to-green-900/50 border border-white/10">
                    {/* Fill Bar */}
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarGradient()}`}
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
            </div>

            {/* Scale Labels */}
            <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                <span>90</span>
                <span className="text-red-400">Weak $</span>
                <span>100</span>
                <span className="text-green-400">Strong $</span>
                <span>115</span>
            </div>

            {/* Explanation Box */}
            <div className={`mt-6 p-4 rounded-xl border ${
                dollarIndex.trend === "strong"
                    ? "bg-green-500/10 border-green-500/30"
                    : dollarIndex.trend === "weak"
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-yellow-500/10 border-yellow-500/30"
            }`}>
                <p className={`text-sm ${
                    dollarIndex.trend === "strong"
                        ? "text-green-300"
                        : dollarIndex.trend === "weak"
                        ? "text-red-300"
                        : "text-yellow-300"
                }`}>
                    {dollarIndex.trend === "strong" ? (
                        <>
                            <strong>Strong Dollar:</strong> Capital flowing into USD assets.
                            Risk-off sentiment dominates. EM currencies and commodities may face pressure.
                            US exporters face headwinds.
                        </>
                    ) : dollarIndex.trend === "weak" ? (
                        <>
                            <strong>Weak Dollar:</strong> Capital flowing out of USD.
                            Risk-on sentiment rising. Emerging markets and commodities benefit.
                            Good for US exporters and multinationals.
                        </>
                    ) : (
                        <>
                            <strong>Neutral:</strong> Dollar in consolidation mode.
                            Markets awaiting direction from Fed policy or macro data.
                            Watch for breakout signals.
                        </>
                    )}
                </p>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400">Risk Sentiment</p>
                    <p className={`text-lg font-bold ${
                        metrics.riskSentiment === "risk_on"
                            ? "text-yellow-400"
                            : metrics.riskSentiment === "risk_off"
                            ? "text-blue-400"
                            : "text-gray-400"
                    }`}>
                        {metrics.riskSentiment === "risk_on" ? "Risk-On 📈" : metrics.riskSentiment === "risk_off" ? "Risk-Off 📉" : "Neutral ↔️"}
                    </p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400">Capital Flow</p>
                    <p className={`text-lg font-bold ${
                        dollarIndex.trend === "strong" ? "text-green-400" : "text-yellow-400"
                    }`}>
                        {dollarIndex.trend === "strong" ? "→ USD" : "→ EM/Risk"}
                    </p>
                </div>
            </div>
        </div>
    );
}
