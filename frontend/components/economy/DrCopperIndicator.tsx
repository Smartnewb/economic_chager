"use client";

import { CommodityData } from "@/store/economyStore";

interface DrCopperIndicatorProps {
    copper: CommodityData;
}

// Dr. Copper is called "The Metal with a PhD in Economics"
// Rising copper prices signal economic growth, falling signals recession risk

const getHealthStatus = (copper: CommodityData): {
    status: "healthy" | "warning" | "critical";
    label: string;
    description: string;
    color: string;
    bgColor: string;
    emoji: string;
} => {
    // Determine health based on price trend and signal
    if (copper.signal === "bullish" && copper.change1m > 0) {
        return {
            status: "healthy",
            label: "GROWTH MODE",
            description: "Dr. Copper signals economic expansion. Industrial demand is strong.",
            color: "#22c55e",
            bgColor: "from-green-500/20 to-emerald-500/20",
            emoji: "💪",
        };
    } else if (copper.signal === "bearish" && copper.change1m < -5) {
        return {
            status: "critical",
            label: "RECESSION ALERT",
            description: "Dr. Copper warns of economic slowdown. Industrial demand weakening.",
            color: "#ef4444",
            bgColor: "from-red-500/20 to-orange-500/20",
            emoji: "⚠️",
        };
    } else {
        return {
            status: "warning",
            label: "WATCH CLOSELY",
            description: "Mixed signals from Dr. Copper. Economic momentum is uncertain.",
            color: "#f59e0b",
            bgColor: "from-amber-500/20 to-yellow-500/20",
            emoji: "👀",
        };
    }
};

export default function DrCopperIndicator({ copper }: DrCopperIndicatorProps) {
    const health = getHealthStatus(copper);

    // Calculate pulse animation based on health
    const pulseClass = health.status === "healthy"
        ? "animate-pulse"
        : health.status === "critical"
            ? "animate-ping"
            : "";

    return (
        <div className={`p-6 rounded-2xl bg-gradient-to-br ${health.bgColor} border border-white/10 backdrop-blur-sm`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="text-4xl">🔶</span>
                        <div className="absolute -top-1 -right-1 text-xl">🎓</div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Dr. Copper</h3>
                        <p className="text-xs text-gray-400">The Metal with a PhD in Economics</p>
                    </div>
                </div>

                {/* Status Badge */}
                <div
                    className="relative flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ backgroundColor: `${health.color}20`, border: `1px solid ${health.color}50` }}
                >
                    <div
                        className={`w-3 h-3 rounded-full ${pulseClass}`}
                        style={{ backgroundColor: health.color }}
                    />
                    <span className="text-sm font-bold" style={{ color: health.color }}>
                        {health.label}
                    </span>
                </div>
            </div>

            {/* Main Display */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Price Display */}
                <div className="p-4 bg-black/30 rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">Copper Price</div>
                    <div className="text-3xl font-bold text-white">
                        ${copper.price.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">{copper.unit}</div>
                </div>

                {/* Trend Display */}
                <div className="p-4 bg-black/30 rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">30-Day Change</div>
                    <div
                        className={`text-3xl font-bold ${copper.change1m >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                        {copper.change1m >= 0 ? "+" : ""}{copper.change1m}%
                    </div>
                    <div className="text-xs text-gray-500">
                        {copper.change1m >= 0 ? "📈 Rising" : "📉 Falling"}
                    </div>
                </div>
            </div>

            {/* Health Gauge */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>🥶 Cold Economy</span>
                    <span>🔥 Hot Economy</span>
                </div>
                <div className="relative h-4 bg-gradient-to-r from-blue-500/30 via-yellow-500/30 to-red-500/30 rounded-full overflow-hidden">
                    {/* Position indicator based on 52-week range */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg border-2 transition-all duration-500"
                        style={{
                            left: `${Math.min(95, Math.max(5, copper.percentOfRange))}%`,
                            transform: "translate(-50%, -50%)",
                            borderColor: health.color,
                        }}
                    />
                </div>
                <div className="text-center text-xs text-gray-400 mt-1">
                    {copper.percentOfRange}% of 52-week range
                </div>
            </div>

            {/* Diagnosis */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: `${health.color}10` }}>
                <div className="flex items-start gap-2">
                    <span className="text-2xl">{health.emoji}</span>
                    <div>
                        <h4 className="font-bold text-white text-sm mb-1">Economic Diagnosis</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            {health.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Why Dr. Copper Matters */}
            <div className="mt-4 pt-4 border-t border-white/10">
                <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 hover:text-white transition-colors">
                        <span className="group-open:rotate-90 transition-transform">▶</span>
                        Why is Copper called "Dr. Copper"?
                    </summary>
                    <p className="mt-2 text-xs text-gray-500 leading-relaxed pl-4">
                        Copper is used in construction, electronics, manufacturing, and infrastructure.
                        When economies grow, copper demand rises. When they slow, demand falls.
                        This makes copper prices an excellent leading indicator of economic health—
                        hence the nickname "The Metal with a PhD in Economics."
                    </p>
                </details>
            </div>
        </div>
    );
}
