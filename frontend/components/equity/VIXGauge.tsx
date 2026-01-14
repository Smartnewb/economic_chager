"use client";

import { useEquityStore } from "@/store/equityStore";
import { useI18n } from "@/lib/i18n";
import InfoTooltip from "@/components/ui/InfoTooltip";

// VIX level colors
const getVIXColor = (level: string): string => {
    switch (level) {
        case "low":
            return "#22c55e"; // Green - Complacency
        case "moderate":
            return "#84cc16"; // Lime - Normal
        case "elevated":
            return "#eab308"; // Yellow - Caution
        case "high":
            return "#f97316"; // Orange - Fear
        case "extreme":
            return "#ef4444"; // Red - Panic
        default:
            return "#6b7280";
    }
};

// VIX level emoji
const getVIXEmoji = (level: string): string => {
    switch (level) {
        case "low":
            return "😴";
        case "moderate":
            return "😐";
        case "elevated":
            return "😟";
        case "high":
            return "😰";
        case "extreme":
            return "🔥";
        default:
            return "📊";
    }
};

// Gauge needle position (0-180 degrees)
const getGaugeRotation = (value: number): number => {
    // VIX typically ranges from 10-80
    // Map to 0-180 degrees
    const minVIX = 10;
    const maxVIX = 50;
    const clampedValue = Math.max(minVIX, Math.min(maxVIX, value));
    return ((clampedValue - minVIX) / (maxVIX - minVIX)) * 180;
};

export default function VIXGauge() {
    const { vix, isLoadingData } = useEquityStore();
    const { t } = useI18n();

    if (isLoadingData) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">{t("stocks.vixFearIndex")}</h3>
                <div className="h-[200px] flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">{t("stocks.loadingVixData")}</div>
                </div>
            </div>
        );
    }

    if (!vix) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">{t("stocks.vixFearIndex")}</h3>
                <div className="h-[200px] flex items-center justify-center">
                    <div className="text-gray-400">{t("stocks.noVixData")}</div>
                </div>
            </div>
        );
    }

    const color = getVIXColor(vix.level);
    const emoji = getVIXEmoji(vix.level);
    const rotation = getGaugeRotation(vix.value);

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {t("stocks.vixFearIndex")}
                    <InfoTooltip content={t("stocks.vixFearIndexDesc")} />
                </h3>
                <div
                    className={`px-2 py-1 rounded text-xs font-medium`}
                    style={{ backgroundColor: `${color}20`, color: color }}
                >
                    {vix.level.toUpperCase()}
                </div>
            </div>

            {/* Gauge SVG */}
            <div className="relative flex flex-col items-center">
                <svg viewBox="0 0 200 120" className="w-full max-w-[250px]">
                    {/* Background arc */}
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="25%" stopColor="#84cc16" />
                            <stop offset="50%" stopColor="#eab308" />
                            <stop offset="75%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>

                    {/* Gauge background */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        opacity="0.3"
                    />

                    {/* Gauge foreground (current value) */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(rotation / 180) * 251.2} 251.2`}
                    />

                    {/* Tick marks */}
                    {[0, 45, 90, 135, 180].map((angle, i) => {
                        const labels = ["10", "20", "30", "40", "50"];
                        const rad = ((180 - angle) * Math.PI) / 180;
                        const x1 = 100 + 65 * Math.cos(rad);
                        const y1 = 100 - 65 * Math.sin(rad);
                        const x2 = 100 + 75 * Math.cos(rad);
                        const y2 = 100 - 75 * Math.sin(rad);
                        const tx = 100 + 55 * Math.cos(rad);
                        const ty = 100 - 55 * Math.sin(rad);

                        return (
                            <g key={i}>
                                <line
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke="#6b7280"
                                    strokeWidth="2"
                                />
                                <text
                                    x={tx}
                                    y={ty}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#9ca3af"
                                    fontSize="10"
                                >
                                    {labels[i]}
                                </text>
                            </g>
                        );
                    })}

                    {/* Needle */}
                    <g transform={`rotate(${rotation - 90}, 100, 100)`}>
                        <polygon points="100,25 95,100 105,100" fill={color} />
                        <circle cx="100" cy="100" r="8" fill={color} />
                        <circle cx="100" cy="100" r="4" fill="#1f2937" />
                    </g>
                </svg>

                {/* Value Display */}
                <div className="text-center mt-2">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl">{emoji}</span>
                        <span className="text-4xl font-bold" style={{ color }}>
                            {vix.value.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span
                            className={`text-sm font-medium ${vix.change >= 0 ? "text-red-400" : "text-green-400"}`}
                        >
                            {vix.change >= 0 ? "+" : ""}
                            {vix.change.toFixed(2)}
                        </span>
                        <span className="text-gray-500 text-sm">today</span>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="mt-4 p-3 bg-white/5 rounded-lg text-center">
                <p className="text-sm text-gray-400">{vix.description}</p>
            </div>

            {/* Level Guide */}
            <div className="mt-4 grid grid-cols-5 gap-1 text-xs">
                {[
                    { level: "low", label: "<12", color: "#22c55e" },
                    { level: "moderate", label: "12-20", color: "#84cc16" },
                    { level: "elevated", label: "20-25", color: "#eab308" },
                    { level: "high", label: "25-35", color: "#f97316" },
                    { level: "extreme", label: "35+", color: "#ef4444" },
                ].map((item) => (
                    <div
                        key={item.level}
                        className={`text-center p-1 rounded ${vix.level === item.level ? "ring-2 ring-white/50" : ""}`}
                        style={{ backgroundColor: `${item.color}20` }}
                    >
                        <div style={{ color: item.color }} className="font-medium">
                            {item.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
