"use client";

import { useWeatherStore } from "@/store/weatherStore";
import { useI18n } from "@/lib/i18n";

// Sentiment-based styling
const sentimentStyles = {
    risk_on: {
        bg: "from-amber-500/20 to-orange-500/20",
        border: "border-amber-500/30",
        icon: "bg-gradient-to-br from-amber-400 to-orange-500",
        text: "text-amber-400",
        pulse: "bg-amber-500"
    },
    risk_off: {
        bg: "from-blue-500/20 to-cyan-500/20",
        border: "border-blue-500/30",
        icon: "bg-gradient-to-br from-blue-400 to-cyan-500",
        text: "text-blue-400",
        pulse: "bg-blue-500"
    },
    neutral: {
        bg: "from-gray-500/20 to-slate-500/20",
        border: "border-gray-500/30",
        icon: "bg-gradient-to-br from-gray-400 to-slate-500",
        text: "text-gray-400",
        pulse: "bg-gray-500"
    }
};

// Weather icons based on conditions
const weatherIcons = {
    risk_on: { emoji: "sun", description: "Sunny" },
    risk_off: { emoji: "storm", description: "Storm" },
    neutral: { emoji: "cloud", description: "Cloudy" }
};

export default function AIHeadline() {
    const { weather, isLoading } = useWeatherStore();
    const { t } = useI18n();

    if (isLoading) {
        return (
            <div className="w-full max-w-3xl mx-auto animate-pulse">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="h-8 bg-white/10 rounded-lg w-3/4 mb-3" />
                    <div className="h-5 bg-white/10 rounded-lg w-1/2" />
                </div>
            </div>
        );
    }

    if (!weather) {
        return (
            <div className="w-full max-w-3xl mx-auto">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-gray-400">{t("common.loading")}...</p>
                </div>
            </div>
        );
    }

    const styles = sentimentStyles[weather.globalSentiment];
    const icon = weatherIcons[weather.globalSentiment];

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Main Headline Card */}
            <div className={`relative p-8 rounded-3xl bg-gradient-to-br ${styles.bg} border ${styles.border} backdrop-blur-sm overflow-hidden`}>
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-2 h-2 rounded-full ${styles.pulse} opacity-30 animate-float`}
                            style={{
                                left: `${20 + i * 15}%`,
                                top: `${30 + (i % 3) * 20}%`,
                                animationDelay: `${i * 0.5}s`,
                                animationDuration: `${3 + i}s`
                            }}
                        />
                    ))}
                </div>

                {/* Weather Icon */}
                <div className="flex items-start gap-6">
                    <div className={`flex-shrink-0 w-20 h-20 rounded-2xl ${styles.icon} flex items-center justify-center shadow-lg`}>
                        {icon.emoji === "sun" && (
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="5" />
                                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
                            </svg>
                        )}
                        {icon.emoji === "storm" && (
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
                            </svg>
                        )}
                        {icon.emoji === "cloud" && (
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                            </svg>
                        )}
                    </div>

                    <div className="flex-1">
                        {/* Main Headline */}
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                            {weather.headline}
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg text-gray-300 mb-4">
                            {weather.subheadline}
                        </p>

                        {/* Quick Stats Row */}
                        <div className="flex flex-wrap gap-4 mt-4">
                            <StatPill
                                label="DXY"
                                value={weather.stats.dollarIndex.toFixed(1)}
                                change={weather.stats.dollarChange}
                                sentiment={weather.dollarStrength === "strong" ? "up" : weather.dollarStrength === "weak" ? "down" : "neutral"}
                            />
                            <StatPill
                                label="VIX"
                                value={weather.stats.vix.toFixed(1)}
                                change={weather.stats.vixChange}
                                sentiment={weather.volatilityLevel === "storm" ? "danger" : weather.volatilityLevel === "elevated" ? "warning" : "calm"}
                            />
                            <StatPill
                                label="10Y"
                                value={`${weather.stats.bondYield10Y.toFixed(2)}%`}
                                change={weather.stats.bondYieldChange}
                                sentiment="neutral"
                            />
                            <StatPill
                                label="S&P"
                                value={`${weather.stats.sp500Change >= 0 ? "+" : ""}${weather.stats.sp500Change.toFixed(2)}%`}
                                change={weather.stats.sp500Change}
                                sentiment={weather.stats.sp500Change > 0 ? "up" : weather.stats.sp500Change < 0 ? "down" : "neutral"}
                            />
                        </div>
                    </div>
                </div>

                {/* Sentiment Badge */}
                <div className="absolute top-4 right-4">
                    <div className={`px-3 py-1 rounded-full ${styles.icon} text-white text-sm font-medium flex items-center gap-2`}>
                        <span className={`w-2 h-2 rounded-full bg-white animate-pulse`} />
                        {weather.globalSentiment === "risk_on" ? "RISK ON" :
                         weather.globalSentiment === "risk_off" ? "RISK OFF" : "NEUTRAL"}
                    </div>
                </div>
            </div>

            {/* CSS for floating animation */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-10px) translateX(5px); }
                    50% { transform: translateY(-5px) translateX(-5px); }
                    75% { transform: translateY(-15px) translateX(3px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

// Stat Pill Component
function StatPill({
    label,
    value,
    change,
    sentiment
}: {
    label: string;
    value: string;
    change: number;
    sentiment: "up" | "down" | "neutral" | "danger" | "warning" | "calm";
}) {
    const colorMap = {
        up: "text-green-400",
        down: "text-red-400",
        neutral: "text-gray-300",
        danger: "text-red-500",
        warning: "text-amber-400",
        calm: "text-green-400"
    };

    const bgMap = {
        up: "bg-green-500/10 border-green-500/20",
        down: "bg-red-500/10 border-red-500/20",
        neutral: "bg-gray-500/10 border-gray-500/20",
        danger: "bg-red-500/10 border-red-500/20",
        warning: "bg-amber-500/10 border-amber-500/20",
        calm: "bg-green-500/10 border-green-500/20"
    };

    return (
        <div className={`px-3 py-2 rounded-xl border ${bgMap[sentiment]} flex items-center gap-2`}>
            <span className="text-xs text-gray-500 font-medium">{label}</span>
            <span className={`text-sm font-bold ${colorMap[sentiment]}`}>{value}</span>
            {change !== 0 && (
                <span className={`text-xs ${change > 0 ? "text-green-400" : "text-red-400"}`}>
                    {change > 0 ? "+" : ""}{change.toFixed(2)}
                </span>
            )}
        </div>
    );
}
