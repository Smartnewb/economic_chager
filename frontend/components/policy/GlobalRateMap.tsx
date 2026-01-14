"use client";

import { usePolicyStore, CentralBankData } from "@/store/policyStore";
import { useState } from "react";

// Get color based on real rate (positive = tightening/purple, negative = easing/green)
const getRealRateColor = (realRate: number): string => {
    if (realRate >= 3) return "#7c3aed"; // Strong purple - very tight
    if (realRate >= 2) return "#8b5cf6"; // Purple - tight
    if (realRate >= 1) return "#a78bfa"; // Light purple - moderately tight
    if (realRate >= 0) return "#c4b5fd"; // Very light purple - slightly tight
    if (realRate >= -1) return "#86efac"; // Light green - slightly easy
    if (realRate >= -2) return "#4ade80"; // Green - easy
    return "#22c55e"; // Strong green - very easy
};

// Get status color
const getStatusColor = (status: string): string => {
    switch (status) {
        case "hiking":
            return "#ef4444";
        case "cutting":
            return "#3b82f6";
        case "paused":
            return "#f59e0b";
        default:
            return "#22c55e";
    }
};

// Country card component
const CountryCard = ({
    bank,
    isSelected,
    onSelect,
}: {
    bank: CentralBankData;
    isSelected: boolean;
    onSelect: () => void;
}) => {
    const realRateColor = getRealRateColor(bank.realRate);
    const statusColor = getStatusColor(bank.status);

    return (
        <div
            onClick={onSelect}
            className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                isSelected
                    ? "bg-white/10 border-purple-500/50 scale-105"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            }`}
            style={{
                boxShadow: isSelected ? `0 0 20px ${realRateColor}40` : "none",
            }}
        >
            {/* Real rate indicator bar */}
            <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{ backgroundColor: realRateColor }}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{bank.flag}</span>
                    <div>
                        <div className="font-bold text-white">{bank.code}</div>
                        <div className="text-xs text-gray-400">{bank.country}</div>
                    </div>
                </div>
                {/* Status badge */}
                <div
                    className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                    style={{
                        backgroundColor: `${statusColor}20`,
                        color: statusColor,
                    }}
                >
                    {bank.status}
                </div>
            </div>

            {/* Rate info */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <div className="text-xs text-gray-400">Policy</div>
                    <div className="text-lg font-bold text-white">
                        {bank.currentRate.toFixed(1)}%
                    </div>
                </div>
                <div>
                    <div className="text-xs text-gray-400">Inflation</div>
                    <div className="text-lg font-bold text-orange-400">
                        {bank.inflationRate.toFixed(1)}%
                    </div>
                </div>
                <div>
                    <div className="text-xs text-gray-400">Real</div>
                    <div
                        className="text-lg font-bold"
                        style={{ color: realRateColor }}
                    >
                        {bank.realRate >= 0 ? "+" : ""}
                        {bank.realRate.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Change indicator */}
            {bank.lastChange !== "0.00%" && (
                <div className="mt-2 text-center">
                    <span
                        className={`text-sm font-medium ${
                            bank.lastChange.startsWith("+")
                                ? "text-red-400"
                                : "text-blue-400"
                        }`}
                    >
                        Last: {bank.lastChange}
                    </span>
                </div>
            )}
        </div>
    );
};

// Summary stats component
const SummaryStats = ({ banks }: { banks: CentralBankData[] }) => {
    const avgRate =
        banks.reduce((sum, b) => sum + b.currentRate, 0) / banks.length;
    const avgRealRate =
        banks.reduce((sum, b) => sum + b.realRate, 0) / banks.length;
    const avgInflation =
        banks.reduce((sum, b) => sum + b.inflationRate, 0) / banks.length;

    const hikingCount = banks.filter((b) => b.status === "hiking").length;
    const cuttingCount = banks.filter((b) => b.status === "cutting").length;
    const pausedCount = banks.filter((b) => b.status === "paused").length;

    const globalStance =
        hikingCount > cuttingCount
            ? "Tightening"
            : cuttingCount > hikingCount
              ? "Easing"
              : "Mixed";

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-gray-400 mb-1">
                    Global Average Rate
                </div>
                <div className="text-2xl font-bold text-white">
                    {avgRate.toFixed(2)}%
                </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-gray-400 mb-1">
                    Average Real Rate
                </div>
                <div
                    className="text-2xl font-bold"
                    style={{ color: getRealRateColor(avgRealRate) }}
                >
                    {avgRealRate >= 0 ? "+" : ""}
                    {avgRealRate.toFixed(2)}%
                </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Average Inflation</div>
                <div className="text-2xl font-bold text-orange-400">
                    {avgInflation.toFixed(1)}%
                </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Global Stance</div>
                <div className="flex items-center gap-2">
                    <span
                        className={`text-2xl font-bold ${
                            globalStance === "Tightening"
                                ? "text-purple-400"
                                : globalStance === "Easing"
                                  ? "text-green-400"
                                  : "text-yellow-400"
                        }`}
                    >
                        {globalStance}
                    </span>
                </div>
                <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-red-400">🔥 {hikingCount}</span>
                    <span className="text-yellow-400">⏸️ {pausedCount}</span>
                    <span className="text-blue-400">💧 {cuttingCount}</span>
                </div>
            </div>
        </div>
    );
};

export default function GlobalRateMap() {
    const { centralBanks, isLoadingData, selectedCountry, setSelectedCountry } =
        usePolicyStore();
    const [sortBy, setSortBy] = useState<"rate" | "realRate" | "country">("realRate");

    if (isLoadingData) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Global Rate Map
                </h3>
                <div className="h-[400px] flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">
                        Loading rate data...
                    </div>
                </div>
            </div>
        );
    }

    // Sort banks
    const sortedBanks = [...centralBanks].sort((a, b) => {
        if (sortBy === "rate") return b.currentRate - a.currentRate;
        if (sortBy === "realRate") return b.realRate - a.realRate;
        return a.country.localeCompare(b.country);
    });

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        Global Rate Map
                    </h3>
                    <p className="text-sm text-gray-400">
                        Real rates reveal true monetary stance
                    </p>
                </div>
                {/* Sort controls */}
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button
                        onClick={() => setSortBy("realRate")}
                        className={`px-3 py-1 rounded text-sm transition-all ${
                            sortBy === "realRate"
                                ? "bg-purple-600 text-white"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Real Rate
                    </button>
                    <button
                        onClick={() => setSortBy("rate")}
                        className={`px-3 py-1 rounded text-sm transition-all ${
                            sortBy === "rate"
                                ? "bg-purple-600 text-white"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Policy Rate
                    </button>
                    <button
                        onClick={() => setSortBy("country")}
                        className={`px-3 py-1 rounded text-sm transition-all ${
                            sortBy === "country"
                                ? "bg-purple-600 text-white"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        A-Z
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <SummaryStats banks={centralBanks} />

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mb-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-gray-400">Tight (High Real Rate)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-gray-400">Easy (Low/Neg Real Rate)</span>
                </div>
            </div>

            {/* Country Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedBanks.map((bank) => (
                    <CountryCard
                        key={bank.code}
                        bank={bank}
                        isSelected={selectedCountry === bank.code}
                        onSelect={() =>
                            setSelectedCountry(
                                selectedCountry === bank.code ? null : bank.code
                            )
                        }
                    />
                ))}
            </div>

            {/* Explanation */}
            <div className="mt-6 p-4 bg-white/5 rounded-xl">
                <h4 className="text-sm font-medium text-white mb-2">
                    💡 Understanding Real Rates
                </h4>
                <p className="text-xs text-gray-400">
                    <strong className="text-purple-400">Real Rate = Policy Rate - Inflation.</strong>{" "}
                    A positive real rate means the central bank is{" "}
                    <strong className="text-purple-400">tightening</strong> (money is expensive).
                    A negative real rate means they&apos;re{" "}
                    <strong className="text-green-400">easing</strong> (money is cheap). Japan&apos;s
                    deeply negative real rate shows extreme monetary easing despite recent hikes.
                </p>
            </div>
        </div>
    );
}
