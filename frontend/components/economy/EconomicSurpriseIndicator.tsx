"use client";

import { useState } from "react";

// Economic data release with surprise indicator
interface EconomicRelease {
    name: string;
    shortName: string;
    actual: number;
    consensus: number;
    previous: number;
    surprise: number; // (actual - consensus) as percentage
    date: string;
    importance: "high" | "medium" | "low";
    region: "US" | "EU" | "CN" | "JP" | "KR";
    flag: string;
}

// Sample economic releases data
const ECONOMIC_RELEASES: EconomicRelease[] = [
    {
        name: "US CPI (YoY)",
        shortName: "CPI",
        actual: 3.2,
        consensus: 3.4,
        previous: 3.5,
        surprise: -0.2,
        date: "2025-01-10",
        importance: "high",
        region: "US",
        flag: "🇺🇸",
    },
    {
        name: "US Non-Farm Payrolls",
        shortName: "NFP",
        actual: 256000,
        consensus: 165000,
        previous: 212000,
        surprise: 55.2,
        date: "2025-01-10",
        importance: "high",
        region: "US",
        flag: "🇺🇸",
    },
    {
        name: "US Manufacturing PMI",
        shortName: "PMI",
        actual: 49.3,
        consensus: 48.0,
        previous: 48.4,
        surprise: 2.7,
        date: "2025-01-03",
        importance: "high",
        region: "US",
        flag: "🇺🇸",
    },
    {
        name: "Eurozone CPI (YoY)",
        shortName: "CPI",
        actual: 2.4,
        consensus: 2.3,
        previous: 2.2,
        surprise: 4.3,
        date: "2025-01-07",
        importance: "high",
        region: "EU",
        flag: "🇪🇺",
    },
    {
        name: "China Manufacturing PMI",
        shortName: "PMI",
        actual: 50.1,
        consensus: 50.5,
        previous: 50.3,
        surprise: -0.8,
        date: "2025-01-01",
        importance: "high",
        region: "CN",
        flag: "🇨🇳",
    },
    {
        name: "Japan CPI (YoY)",
        shortName: "CPI",
        actual: 2.9,
        consensus: 2.8,
        previous: 2.7,
        surprise: 3.6,
        date: "2025-01-10",
        importance: "medium",
        region: "JP",
        flag: "🇯🇵",
    },
];

// Get surprise color based on value
const getSurpriseColor = (surprise: number) => {
    if (surprise >= 5) return { text: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30" };
    if (surprise >= 1) return { text: "text-green-300", bg: "bg-green-500/10", border: "border-green-500/20" };
    if (surprise >= -1) return { text: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" };
    if (surprise >= -5) return { text: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/20" };
    return { text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30" };
};

// Get surprise emoji
const getSurpriseEmoji = (surprise: number) => {
    if (surprise >= 10) return "🚀";
    if (surprise >= 5) return "📈";
    if (surprise >= 1) return "👍";
    if (surprise >= -1) return "➡️";
    if (surprise >= -5) return "👎";
    return "📉";
};

// Calculate overall economic surprise index
const calculateSurpriseIndex = (releases: EconomicRelease[]): number => {
    const highImportanceReleases = releases.filter(r => r.importance === "high");
    if (highImportanceReleases.length === 0) return 0;
    return highImportanceReleases.reduce((sum, r) => sum + r.surprise, 0) / highImportanceReleases.length;
};

// Get index status
const getIndexStatus = (index: number) => {
    if (index >= 5) return { label: "STRONG BEAT", color: "#22c55e", emoji: "🔥" };
    if (index >= 1) return { label: "BEATING", color: "#4ade80", emoji: "📈" };
    if (index >= -1) return { label: "IN-LINE", color: "#a1a1aa", emoji: "➡️" };
    if (index >= -5) return { label: "MISSING", color: "#f87171", emoji: "📉" };
    return { label: "SHARP MISS", color: "#ef4444", emoji: "⚠️" };
};

export default function EconomicSurpriseIndicator() {
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

    const filteredReleases = selectedRegion
        ? ECONOMIC_RELEASES.filter(r => r.region === selectedRegion)
        : ECONOMIC_RELEASES;

    const surpriseIndex = calculateSurpriseIndex(filteredReleases);
    const indexStatus = getIndexStatus(surpriseIndex);

    const regions = [
        { code: null, label: "All", flag: "🌍" },
        { code: "US", label: "US", flag: "🇺🇸" },
        { code: "EU", label: "EU", flag: "🇪🇺" },
        { code: "CN", label: "China", flag: "🇨🇳" },
        { code: "JP", label: "Japan", flag: "🇯🇵" },
    ];

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white">Economic Surprise Index</h3>
                    <p className="text-xs text-gray-400">Actual vs Consensus: Are data releases beating or missing?</p>
                </div>

                {/* Region Filter */}
                <div className="flex gap-1">
                    {regions.map(region => (
                        <button
                            key={region.code || "all"}
                            onClick={() => setSelectedRegion(region.code)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                                selectedRegion === region.code
                                    ? "bg-white/20 text-white"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                            }`}
                        >
                            <span>{region.flag}</span>
                            <span>{region.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Overall Index Display */}
            <div
                className="p-4 rounded-xl mb-4"
                style={{ backgroundColor: `${indexStatus.color}15`, border: `1px solid ${indexStatus.color}30` }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{indexStatus.emoji}</span>
                        <div>
                            <div className="text-sm text-gray-400">Surprise Index</div>
                            <div className="text-2xl font-bold" style={{ color: indexStatus.color }}>
                                {surpriseIndex >= 0 ? "+" : ""}{surpriseIndex.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                    <div
                        className="px-4 py-2 rounded-full text-sm font-bold"
                        style={{ backgroundColor: `${indexStatus.color}20`, color: indexStatus.color }}
                    >
                        {indexStatus.label}
                    </div>
                </div>
            </div>

            {/* Releases Table */}
            <div className="space-y-2">
                {filteredReleases.map((release, index) => {
                    const colors = getSurpriseColor(release.surprise);
                    return (
                        <div
                            key={index}
                            className={`p-3 rounded-xl ${colors.bg} border ${colors.border} transition-all hover:scale-[1.01]`}
                        >
                            <div className="flex items-center justify-between">
                                {/* Left: Name and Date */}
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{release.flag}</span>
                                    <div>
                                        <div className="font-medium text-white text-sm">{release.name}</div>
                                        <div className="text-xs text-gray-500">{release.date}</div>
                                    </div>
                                </div>

                                {/* Center: Values */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500">Actual</div>
                                        <div className="font-bold text-white">
                                            {typeof release.actual === "number" && release.actual > 1000
                                                ? `${(release.actual / 1000).toFixed(0)}K`
                                                : release.actual}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500">Consensus</div>
                                        <div className="text-gray-400">
                                            {typeof release.consensus === "number" && release.consensus > 1000
                                                ? `${(release.consensus / 1000).toFixed(0)}K`
                                                : release.consensus}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500">Previous</div>
                                        <div className="text-gray-500">
                                            {typeof release.previous === "number" && release.previous > 1000
                                                ? `${(release.previous / 1000).toFixed(0)}K`
                                                : release.previous}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Surprise */}
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{getSurpriseEmoji(release.surprise)}</span>
                                    <div
                                        className={`px-3 py-1 rounded-full text-sm font-bold ${colors.text} ${colors.bg}`}
                                    >
                                        {release.surprise >= 0 ? "+" : ""}{release.surprise.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span>🚀</span>
                        <span className="text-green-400">Strong Beat (+10%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span>📈</span>
                        <span className="text-green-300">Beat (+5%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span>➡️</span>
                        <span className="text-gray-400">In-Line</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span>📉</span>
                        <span className="text-red-300">Miss (-5%)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
