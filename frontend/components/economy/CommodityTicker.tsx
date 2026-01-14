"use client";

import { CommoditySignals, CommodityData } from "@/store/economyStore";

// Get signal color
const getSignalColor = (signal: "bullish" | "bearish" | "neutral") => {
    switch (signal) {
        case "bullish":
            return { bg: "bg-green-500/20", border: "border-green-500/30", text: "text-green-400", dot: "bg-green-500" };
        case "bearish":
            return { bg: "bg-red-500/20", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-500" };
        default:
            return { bg: "bg-yellow-500/20", border: "border-yellow-500/30", text: "text-yellow-400", dot: "bg-yellow-500" };
    }
};

// Get overall signal style
const getOverallSignalStyle = (signal: "risk_on" | "risk_off" | "mixed" | "goldilocks") => {
    switch (signal) {
        case "goldilocks":
            return { bg: "from-green-500/20 to-blue-500/20", border: "border-green-500/30", icon: "✨", label: "Goldilocks" };
        case "risk_on":
            return { bg: "from-orange-500/20 to-red-500/20", border: "border-orange-500/30", icon: "🔥", label: "Risk On" };
        case "risk_off":
            return { bg: "from-purple-500/20 to-red-500/20", border: "border-purple-500/30", icon: "🛡️", label: "Risk Off" };
        default:
            return { bg: "from-gray-500/20 to-gray-600/20", border: "border-gray-500/30", icon: "⚖️", label: "Mixed" };
    }
};

// Commodity icon
const getCommodityIcon = (type: "oil" | "gold" | "copper") => {
    switch (type) {
        case "oil":
            return "🛢️";
        case "gold":
            return "🥇";
        case "copper":
            return "🔶";
    }
};

// Single commodity card
const CommodityCard = ({
    data,
    type,
}: {
    data: CommodityData;
    type: "oil" | "gold" | "copper";
}) => {
    const colors = getSignalColor(data.signal);
    const icon = getCommodityIcon(type);

    return (
        <div className={`p-4 rounded-xl ${colors.bg} border ${colors.border} transition-all hover:scale-[1.02]`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <div>
                        <h4 className="font-bold text-white">{data.shortName}</h4>
                        <p className="text-xs text-gray-400">{data.name}</p>
                    </div>
                </div>
                {/* Signal indicator */}
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
                    <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
                    <span className={`text-xs font-medium capitalize ${colors.text}`}>
                        {data.signal}
                    </span>
                </div>
            </div>

            {/* Price */}
            <div className="mb-3">
                <div className="text-3xl font-bold text-white">
                    ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-500">{data.unit}</div>
            </div>

            {/* Changes */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-1.5 bg-white/5 rounded">
                    <div className="text-xs text-gray-500">24H</div>
                    <div className={data.change24h >= 0 ? "text-green-400" : "text-red-400"}>
                        {data.change24h >= 0 ? "+" : ""}{data.change24h}%
                    </div>
                </div>
                <div className="text-center p-1.5 bg-white/5 rounded">
                    <div className="text-xs text-gray-500">1W</div>
                    <div className={data.change1w >= 0 ? "text-green-400" : "text-red-400"}>
                        {data.change1w >= 0 ? "+" : ""}{data.change1w}%
                    </div>
                </div>
                <div className="text-center p-1.5 bg-white/5 rounded">
                    <div className="text-xs text-gray-500">1M</div>
                    <div className={data.change1m >= 0 ? "text-green-400" : "text-red-400"}>
                        {data.change1m >= 0 ? "+" : ""}{data.change1m}%
                    </div>
                </div>
            </div>

            {/* 52W Range */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>${data.low52w}</span>
                    <span>${data.high52w}</span>
                </div>
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`absolute left-0 top-0 h-full rounded-full ${colors.dot}`}
                        style={{ width: `${data.percentOfRange}%`, opacity: 0.6 }}
                    />
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${colors.dot} border-2 border-white shadow-lg`}
                        style={{ left: `${Math.min(100, Math.max(0, data.percentOfRange))}%`, transform: "translate(-50%, -50%)" }}
                    />
                </div>
                <div className="text-center text-xs text-gray-400 mt-1">
                    {data.percentOfRange}% of 52W range
                </div>
            </div>

            {/* Interpretation */}
            <div className="p-2 bg-black/30 rounded-lg">
                <p className="text-xs text-gray-300 leading-relaxed">
                    💡 {data.interpretation}
                </p>
            </div>
        </div>
    );
};

// Main component
interface CommodityTickerProps {
    data: CommoditySignals;
}

export default function CommodityTicker({ data }: CommodityTickerProps) {
    const overallStyle = getOverallSignalStyle(data.overallSignal);

    return (
        <div className="space-y-6">
            {/* Overall Signal Banner */}
            <div className={`p-4 rounded-xl bg-gradient-to-r ${overallStyle.bg} border ${overallStyle.border}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{overallStyle.icon}</span>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                원자재 신호등: {overallStyle.label}
                            </h3>
                            <p className="text-sm text-gray-300 mt-1">
                                {data.interpretation}
                            </p>
                        </div>
                    </div>
                    {/* Signal dots */}
                    <div className="flex gap-2">
                        <div className={`w-4 h-4 rounded-full ${getSignalColor(data.oil.signal).dot}`} title="Oil" />
                        <div className={`w-4 h-4 rounded-full ${getSignalColor(data.gold.signal).dot}`} title="Gold" />
                        <div className={`w-4 h-4 rounded-full ${getSignalColor(data.copper.signal).dot}`} title="Copper" />
                    </div>
                </div>
            </div>

            {/* Commodity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CommodityCard data={data.oil} type="oil" />
                <CommodityCard data={data.gold} type="gold" />
                <CommodityCard data={data.copper} type="copper" />
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-gray-400">Bullish</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-gray-400">Neutral</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-gray-400">Bearish</span>
                </div>
            </div>
        </div>
    );
}
