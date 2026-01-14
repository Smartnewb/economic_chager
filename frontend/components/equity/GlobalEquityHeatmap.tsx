"use client";

import { useEquityStore, MarketIndex } from "@/store/equityStore";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useI18n } from "@/lib/i18n";

// Color based on change percentage
const getColor = (change: number): string => {
    if (change >= 2) return "#22c55e"; // Strong green
    if (change >= 1) return "#4ade80"; // Green
    if (change >= 0.5) return "#86efac"; // Light green
    if (change >= 0) return "#bbf7d0"; // Very light green
    if (change >= -0.5) return "#fecaca"; // Very light red
    if (change >= -1) return "#f87171"; // Light red
    if (change >= -2) return "#ef4444"; // Red
    return "#dc2626"; // Strong red
};

// Custom treemap content - using proper type for recharts v3
interface TreemapContentProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    name?: string;
    change?: number;
    flag?: string;
    country?: string;
}

const CustomizedContent = (props: TreemapContentProps) => {
    const { x = 0, y = 0, width = 0, height = 0, name, change = 0, flag, country } = props;

    // Skip rendering if we don't have valid dimensions or name
    if (!name || width <= 0 || height <= 0) return null;

    if (width < 50 || height < 40) {
        // Too small to show content
        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={getColor(change)}
                    stroke="#1f2937"
                    strokeWidth={2}
                    rx={4}
                />
            </g>
        );
    }

    const isPositive = change >= 0;
    const textColor = Math.abs(change) > 1 ? "#ffffff" : "#1f2937";

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={getColor(change)}
                stroke="#1f2937"
                strokeWidth={2}
                rx={4}
                className="transition-all duration-300 hover:brightness-110"
            />
            {/* Flag */}
            {height > 60 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 - 18}
                    textAnchor="middle"
                    fontSize={width > 100 ? 24 : 18}
                >
                    {flag}
                </text>
            )}
            {/* Index Name */}
            <text
                x={x + width / 2}
                y={y + height / 2 + (height > 60 ? 5 : 0)}
                textAnchor="middle"
                fill={textColor}
                fontSize={width > 120 ? 14 : 11}
                fontWeight="bold"
            >
                {name}
            </text>
            {/* Change Percentage */}
            <text
                x={x + width / 2}
                y={y + height / 2 + (height > 60 ? 22 : 15)}
                textAnchor="middle"
                fill={textColor}
                fontSize={width > 120 ? 16 : 12}
                fontWeight="bold"
            >
                {isPositive ? "+" : ""}
                {change.toFixed(2)}%
            </text>
            {/* Country name if space allows */}
            {height > 80 && width > 100 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 40}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={10}
                    opacity={0.8}
                >
                    {country}
                </text>
            )}
        </g>
    );
};

// Custom tooltip - needs t function passed as prop
const CustomTooltip = ({
    active,
    payload,
    t,
}: {
    active?: boolean;
    payload?: Array<{ payload: MarketIndex }>;
    t: (key: string) => string;
}) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const isPositive = data.change >= 0;

    return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{data.flag}</span>
                <span className="font-bold text-white">{data.name}</span>
            </div>
            <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400">{t("stocks.price")}:</span>
                    <span className="text-white font-medium">
                        {data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400">{t("stocks.change")}:</span>
                    <span className={`font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                        {isPositive ? "+" : ""}
                        {data.change.toFixed(2)}%
                    </span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400">{t("stocks.marketCap")}:</span>
                    <span className="text-white">${(data.marketCap / 1000).toFixed(1)}T</span>
                </div>
            </div>
        </div>
    );
};

export default function GlobalEquityHeatmap() {
    const { globalIndices, isLoadingData, selectedRegion, setSelectedRegion } = useEquityStore();
    const { t } = useI18n();

    if (isLoadingData) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10 h-[500px]">
                <h3 className="text-lg font-semibold text-white mb-4">{t("stocks.globalMarketHeatmap")}</h3>
                <div className="h-[420px] flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">{t("stocks.loadingMarketData")}</div>
                </div>
            </div>
        );
    }

    if (globalIndices.length === 0) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10 h-[500px]">
                <h3 className="text-lg font-semibold text-white mb-4">{t("stocks.globalMarketHeatmap")}</h3>
                <div className="h-[420px] flex items-center justify-center">
                    <div className="text-gray-400">{t("stocks.noMarketData")}</div>
                </div>
            </div>
        );
    }

    // Filter by region if selected
    const filteredIndices = selectedRegion
        ? globalIndices.filter((i) => i.region === selectedRegion)
        : globalIndices;

    // Transform data for treemap
    const treemapData = filteredIndices.map((index) => ({
        name: index.name,
        size: index.marketCap,
        change: index.change,
        flag: index.flag,
        country: index.country,
        price: index.price,
        marketCap: index.marketCap,
        region: index.region,
    }));

    // Calculate region summaries
    const regionSummary = {
        US: globalIndices.filter((i) => i.region === "US"),
        Asia: globalIndices.filter((i) => i.region === "Asia"),
        EU: globalIndices.filter((i) => i.region === "EU"),
    };

    const getRegionAvg = (region: MarketIndex[]) =>
        region.length > 0 ? region.reduce((sum, i) => sum + i.change, 0) / region.length : 0;

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{t("stocks.globalMarketHeatmap")}</h3>
                {/* Region Filter */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedRegion(null)}
                        className={`px-3 py-1 rounded-lg text-sm transition-all ${
                            !selectedRegion
                                ? "bg-white/20 text-white"
                                : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                    >
                        {t("stocks.all")}
                    </button>
                    {(["US", "Asia", "EU"] as const).map((region) => {
                        const avg = getRegionAvg(regionSummary[region]);
                        return (
                            <button
                                key={region}
                                onClick={() => setSelectedRegion(region)}
                                className={`px-3 py-1 rounded-lg text-sm transition-all flex items-center gap-1 ${
                                    selectedRegion === region
                                        ? "bg-white/20 text-white"
                                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                                }`}
                            >
                                {region}
                                <span
                                    className={`text-xs ${avg >= 0 ? "text-green-400" : "text-red-400"}`}
                                >
                                    {avg >= 0 ? "+" : ""}
                                    {avg.toFixed(1)}%
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Treemap */}
            <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        data={treemapData}
                        dataKey="size"
                        aspectRatio={4 / 3}
                        stroke="#1f2937"
                        content={<CustomizedContent />}
                    >
                        <Tooltip content={<CustomTooltip t={t} />} />
                    </Treemap>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-green-500" />
                    <span className="text-gray-400">{t("stocks.strongUp")}</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-green-300" />
                    <span className="text-gray-400">{t("stocks.up")}</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-red-300" />
                    <span className="text-gray-400">{t("stocks.down")}</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-red-500" />
                    <span className="text-gray-400">{t("stocks.strongDown")}</span>
                </div>
            </div>
        </div>
    );
}
