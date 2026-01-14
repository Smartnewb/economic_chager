"use client";

import { useBondStore, GlobalBondYield } from "@/store/bondStore";

// Trend indicator component
const TrendIndicator = ({ trend }: { trend: "up" | "down" | "flat" }) => {
    if (trend === "up") {
        return <span className="text-red-400">↑</span>;
    } else if (trend === "down") {
        return <span className="text-green-400">↓</span>;
    }
    return <span className="text-gray-400">→</span>;
};

// Single bond card component
const BondCard = ({
    bond,
    isSelected,
    onClick,
}: {
    bond: GlobalBondYield;
    isSelected: boolean;
    onClick: () => void;
}) => {
    const changeColor = bond.change24h >= 0 ? "text-red-400" : "text-green-400";
    const spreadColor =
        bond.spread_vs_us > 0
            ? "text-amber-400"
            : bond.spread_vs_us < 0
              ? "text-blue-400"
              : "text-gray-400";

    return (
        <button
            onClick={onClick}
            className={`w-full p-4 rounded-xl border transition-all duration-200 text-left ${
                isSelected
                    ? "bg-blue-500/20 border-blue-500/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            }`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{bond.flag}</span>
                    <div>
                        <div className="font-medium text-white">{bond.countryCode}</div>
                        <div className="text-xs text-gray-400">{bond.country}</div>
                    </div>
                </div>
                <TrendIndicator trend={bond.trend} />
            </div>

            <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                    <span className="text-gray-400 text-sm">10Y Yield</span>
                    <span className="text-xl font-bold text-white">
                        {bond.yield10Y.toFixed(2)}%
                    </span>
                </div>

                <div className="flex justify-between items-baseline">
                    <span className="text-gray-400 text-xs">24h Change</span>
                    <span className={`text-sm font-medium ${changeColor}`}>
                        {bond.change24h >= 0 ? "+" : ""}
                        {bond.change24h.toFixed(2)}%
                    </span>
                </div>

                {bond.countryCode !== "US" && (
                    <div className="flex justify-between items-baseline pt-1 border-t border-white/10">
                        <span className="text-gray-400 text-xs">vs US 10Y</span>
                        <span className={`text-sm font-medium ${spreadColor}`}>
                            {bond.spread_vs_us >= 0 ? "+" : ""}
                            {bond.spread_vs_us.toFixed(2)}%
                        </span>
                    </div>
                )}
            </div>
        </button>
    );
};

export default function GlobalBondYields() {
    const { globalBonds, selectedCountry, setSelectedCountry, isLoadingData } =
        useBondStore();

    if (isLoadingData) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Global 10Y Bond Yields
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="h-32 bg-white/5 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (globalBonds.length === 0) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Global 10Y Bond Yields
                </h3>
                <div className="text-center py-8 text-gray-400">
                    No global bond data available
                </div>
            </div>
        );
    }

    // Sort bonds: US first, then by yield descending
    const sortedBonds = [...globalBonds].sort((a, b) => {
        if (a.countryCode === "US") return -1;
        if (b.countryCode === "US") return 1;
        return b.yield10Y - a.yield10Y;
    });

    // Calculate stats
    const avgYield =
        globalBonds.reduce((sum, b) => sum + b.yield10Y, 0) / globalBonds.length;
    const highestYield = Math.max(...globalBonds.map((b) => b.yield10Y));
    const lowestYield = Math.min(...globalBonds.map((b) => b.yield10Y));

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                    Global 10Y Bond Yields
                </h3>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Avg:</span>
                        <span className="text-white font-medium">
                            {avgYield.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Range:</span>
                        <span className="text-green-400">{lowestYield.toFixed(2)}%</span>
                        <span className="text-gray-500">-</span>
                        <span className="text-red-400">{highestYield.toFixed(2)}%</span>
                    </div>
                </div>
            </div>

            {/* Bond Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sortedBonds.map((bond) => (
                    <BondCard
                        key={bond.countryCode}
                        bond={bond}
                        isSelected={selectedCountry === bond.countryCode}
                        onClick={() => setSelectedCountry(bond.countryCode)}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                    <span className="text-red-400">↑</span>
                    <span>Yield Rising</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-green-400">↓</span>
                    <span>Yield Falling</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-amber-400">+spread</span>
                    <span>Higher than US</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-blue-400">-spread</span>
                    <span>Lower than US</span>
                </div>
            </div>
        </div>
    );
}
