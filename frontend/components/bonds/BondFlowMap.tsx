"use client";

import { useBondStore, BondFlow } from "@/store/bondStore";

// Flow type colors and labels
const flowTypeConfig = {
    flight_to_safety: {
        color: "from-yellow-500 to-amber-500",
        label: "Flight to Safety",
        description: "Capital seeking safety in government bonds",
    },
    yield_seeking: {
        color: "from-green-500 to-emerald-500",
        label: "Yield Seeking",
        description: "Capital chasing higher returns",
    },
    diversification: {
        color: "from-blue-500 to-cyan-500",
        label: "Diversification",
        description: "Portfolio rebalancing flows",
    },
};

// Country code to flag mapping
const countryFlags: Record<string, string> = {
    US: "🇺🇸",
    JP: "🇯🇵",
    DE: "🇩🇪",
    GB: "🇬🇧",
    CN: "🇨🇳",
    EU: "🇪🇺",
    FR: "🇫🇷",
    IT: "🇮🇹",
    AU: "🇦🇺",
};

// Single flow item component
const FlowItem = ({ flow }: { flow: BondFlow }) => {
    const config = flowTypeConfig[flow.type];
    const volumePercent = Math.round(flow.volume * 100);

    return (
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            {/* From country */}
            <div className="flex items-center gap-1.5 min-w-[60px]">
                <span className="text-xl">{countryFlags[flow.from] || "🌐"}</span>
                <span className="text-sm font-medium text-white">{flow.from}</span>
            </div>

            {/* Flow arrow with volume */}
            <div className="flex-1 relative">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-gradient-to-r ${config.color} rounded-full transition-all duration-500`}
                        style={{ width: `${volumePercent}%` }}
                    />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/60 text-xs">
                    →
                </div>
            </div>

            {/* To country */}
            <div className="flex items-center gap-1.5 min-w-[60px] justify-end">
                <span className="text-sm font-medium text-white">{flow.to}</span>
                <span className="text-xl">{countryFlags[flow.to] || "🌐"}</span>
            </div>

            {/* Volume badge */}
            <div
                className={`px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r ${config.color} text-white`}
            >
                {volumePercent}%
            </div>
        </div>
    );
};

export default function BondFlowMap() {
    const { bondFlows, isLoadingData } = useBondStore();

    if (isLoadingData) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Capital Flow Patterns
                </h3>
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="h-12 bg-white/5 rounded-lg animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (bondFlows.length === 0) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Capital Flow Patterns
                </h3>
                <div className="text-center py-8 text-gray-400">
                    No flow data available
                </div>
            </div>
        );
    }

    // Group flows by type
    const flowsByType = bondFlows.reduce(
        (acc, flow) => {
            if (!acc[flow.type]) {
                acc[flow.type] = [];
            }
            acc[flow.type].push(flow);
            return acc;
        },
        {} as Record<string, BondFlow[]>
    );

    // Calculate total inflows to US
    const usInflows = bondFlows
        .filter((f) => f.to === "US")
        .reduce((sum, f) => sum + f.volume, 0);
    const usOutflows = bondFlows
        .filter((f) => f.from === "US")
        .reduce((sum, f) => sum + f.volume, 0);
    const netFlow = usInflows - usOutflows;

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                    Capital Flow Patterns
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">US Net Flow:</span>
                    <span
                        className={`text-sm font-bold ${
                            netFlow > 0
                                ? "text-green-400"
                                : netFlow < 0
                                  ? "text-red-400"
                                  : "text-gray-400"
                        }`}
                    >
                        {netFlow > 0 ? "+" : ""}
                        {Math.round(netFlow * 100)}%
                    </span>
                </div>
            </div>

            {/* Flow Type Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
                {Object.entries(flowTypeConfig).map(([type, config]) => (
                    <div
                        key={type}
                        className="flex items-center gap-2 text-xs"
                    >
                        <div
                            className={`w-3 h-3 rounded bg-gradient-to-r ${config.color}`}
                        />
                        <span className="text-gray-400">{config.label}</span>
                    </div>
                ))}
            </div>

            {/* Flow List */}
            <div className="space-y-2">
                {bondFlows
                    .sort((a, b) => b.volume - a.volume)
                    .map((flow, index) => (
                        <FlowItem key={`${flow.from}-${flow.to}-${index}`} flow={flow} />
                    ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                        {Math.round(usInflows * 100)}%
                    </div>
                    <div className="text-xs text-gray-400">US Inflows</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                        {Math.round(usOutflows * 100)}%
                    </div>
                    <div className="text-xs text-gray-400">US Outflows</div>
                </div>
                <div className="text-center">
                    <div
                        className={`text-2xl font-bold ${
                            netFlow > 0 ? "text-green-400" : "text-red-400"
                        }`}
                    >
                        {netFlow > 0 ? "+" : ""}
                        {Math.round(netFlow * 100)}%
                    </div>
                    <div className="text-xs text-gray-400">Net Position</div>
                </div>
            </div>

            {/* Interpretation */}
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-gray-400">
                    {netFlow > 0.5 ? (
                        <span>
                            <strong className="text-yellow-400">Strong inflows to US</strong>{" "}
                            - Global investors seeking safety in US Treasuries. Risk-off
                            sentiment dominant.
                        </span>
                    ) : netFlow > 0 ? (
                        <span>
                            <strong className="text-blue-400">Moderate US inflows</strong> -
                            Mixed sentiment with slight preference for US bonds.
                        </span>
                    ) : netFlow < -0.3 ? (
                        <span>
                            <strong className="text-red-400">Capital leaving US</strong> -
                            Investors seeking higher yields abroad. Risk-on sentiment.
                        </span>
                    ) : (
                        <span>
                            <strong className="text-gray-300">Balanced flows</strong> -
                            Capital moving both directions. Market in equilibrium.
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
