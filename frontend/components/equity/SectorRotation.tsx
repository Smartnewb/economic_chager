"use client";

import { useEquityStore, SectorData } from "@/store/equityStore";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

// Color based on change percentage with glowing effect for strong performers
const getColor = (change: number): string => {
    if (change >= 2) return "#22c55e";
    if (change >= 1) return "#4ade80";
    if (change >= 0.5) return "#86efac";
    if (change >= 0) return "#bbf7d0";
    if (change >= -0.5) return "#fecaca";
    if (change >= -1) return "#f87171";
    if (change >= -2) return "#ef4444";
    return "#dc2626";
};

// Brightness based on performance (hot = bright, cold = dim)
const getBrightness = (change: number): number => {
    const absChange = Math.abs(change);
    if (absChange >= 2) return 1.2;
    if (absChange >= 1) return 1.1;
    return 1.0;
};

// Custom treemap content for sectors
const CustomizedContent = (props: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    shortName?: string;
    sector?: string;
    change?: number;
    topStock?: string;
    topStockChange?: number;
}) => {
    const {
        x = 0,
        y = 0,
        width = 0,
        height = 0,
        shortName,
        sector,
        change = 0,
        topStock,
        topStockChange = 0,
    } = props;

    if (width < 50 || height < 40) {
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
                    style={{ filter: `brightness(${getBrightness(change)})` }}
                />
            </g>
        );
    }

    const isPositive = change >= 0;
    const textColor = Math.abs(change) > 1 ? "#ffffff" : "#1f2937";
    const brightness = getBrightness(change);

    // Glow effect for strong performers
    const glowFilter =
        Math.abs(change) >= 1.5 ? `drop-shadow(0 0 ${Math.abs(change) * 3}px ${getColor(change)})` : "none";

    return (
        <g style={{ filter: glowFilter }}>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={getColor(change)}
                stroke="#1f2937"
                strokeWidth={2}
                rx={4}
                style={{ filter: `brightness(${brightness})` }}
                className="transition-all duration-300"
            />
            {/* Sector Name */}
            <text
                x={x + width / 2}
                y={y + height / 2 - (height > 70 ? 15 : 5)}
                textAnchor="middle"
                fill={textColor}
                fontSize={width > 100 ? 14 : 10}
                fontWeight="bold"
            >
                {shortName}
            </text>
            {/* Change Percentage */}
            <text
                x={x + width / 2}
                y={y + height / 2 + (height > 70 ? 5 : 10)}
                textAnchor="middle"
                fill={textColor}
                fontSize={width > 100 ? 18 : 14}
                fontWeight="bold"
            >
                {isPositive ? "+" : ""}
                {change.toFixed(2)}%
            </text>
            {/* Top Stock (if space allows) */}
            {height > 80 && width > 80 && topStock && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 25}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={10}
                    opacity={0.8}
                >
                    {topStock}: {topStockChange >= 0 ? "+" : ""}
                    {topStockChange.toFixed(1)}%
                </text>
            )}
        </g>
    );
};

// Custom tooltip for sectors
const CustomTooltip = ({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: SectorData & { size: number } }>;
}) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const isPositive = data.change >= 0;

    return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
            <div className="font-bold text-white mb-2">{data.sector}</div>
            <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400">Change:</span>
                    <span className={`font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                        {isPositive ? "+" : ""}
                        {data.change.toFixed(2)}%
                    </span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400">Top Stock:</span>
                    <span className="text-white">{data.topStock}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400">{data.topStock} Change:</span>
                    <span
                        className={`font-medium ${data.topStockChange >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                        {data.topStockChange >= 0 ? "+" : ""}
                        {data.topStockChange.toFixed(2)}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default function SectorRotation() {
    const { sectors, isLoadingData, selectedSector, setSelectedSector } = useEquityStore();

    if (isLoadingData) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10 h-[500px]">
                <h3 className="text-lg font-semibold text-white mb-4">Sector Rotation</h3>
                <div className="h-[420px] flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">Loading sector data...</div>
                </div>
            </div>
        );
    }

    if (sectors.length === 0) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10 h-[500px]">
                <h3 className="text-lg font-semibold text-white mb-4">Sector Rotation</h3>
                <div className="h-[420px] flex items-center justify-center">
                    <div className="text-gray-400">No sector data available</div>
                </div>
            </div>
        );
    }

    // Sort sectors by change for ranking
    const sortedSectors = [...sectors].sort((a, b) => b.change - a.change);
    const topSector = sortedSectors[0];
    const bottomSector = sortedSectors[sortedSectors.length - 1];

    // Transform data for treemap
    const treemapData = sectors.map((sector) => ({
        name: sector.shortName,
        shortName: sector.shortName,
        sector: sector.sector,
        size: sector.marketCap,
        change: sector.change,
        topStock: sector.topStock,
        topStockChange: sector.topStockChange,
        marketCap: sector.marketCap,
    }));

    // Rotation signal
    const growthSectors = ["Tech", "Consumer", "Comm"];
    const defensiveSectors = ["Utilities", "Staples", "Health"];

    const growthAvg =
        sectors
            .filter((s) => growthSectors.includes(s.shortName))
            .reduce((sum, s) => sum + s.change, 0) / 3;
    const defensiveAvg =
        sectors
            .filter((s) => defensiveSectors.includes(s.shortName))
            .reduce((sum, s) => sum + s.change, 0) / 3;

    const rotationSignal = growthAvg - defensiveAvg;
    const isRiskOn = rotationSignal > 0.5;
    const isRiskOff = rotationSignal < -0.5;

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {/* Header with rotation signal */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Sector Rotation</h3>
                <div className="flex items-center gap-4">
                    {/* Rotation indicator */}
                    <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isRiskOn
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : isRiskOff
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                    >
                        {isRiskOn ? "Risk-On" : isRiskOff ? "Risk-Off" : "Neutral"}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="text-xs text-gray-400 mb-1">Leading Sector</div>
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{topSector.shortName}</span>
                        <span className="text-green-400 font-bold">
                            +{topSector.change.toFixed(2)}%
                        </span>
                    </div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                    <div className="text-xs text-gray-400 mb-1">Lagging Sector</div>
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{bottomSector.shortName}</span>
                        <span className="text-red-400 font-bold">
                            {bottomSector.change.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Treemap */}
            <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        data={treemapData}
                        dataKey="size"
                        aspectRatio={4 / 3}
                        stroke="#1f2937"
                        content={<CustomizedContent />}
                    >
                        <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                </ResponsiveContainer>
            </div>

            {/* Rotation Analysis */}
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-gray-400">
                    {isRiskOn ? (
                        <span>
                            <strong className="text-green-400">Growth outperforming Defensive</strong>{" "}
                            by {rotationSignal.toFixed(2)}% - Money flowing into risk assets. Tech and
                            Consumer leading.
                        </span>
                    ) : isRiskOff ? (
                        <span>
                            <strong className="text-red-400">Defensive outperforming Growth</strong> by{" "}
                            {Math.abs(rotationSignal).toFixed(2)}% - Flight to safety. Utilities and
                            Staples catching bids.
                        </span>
                    ) : (
                        <span>
                            <strong className="text-gray-300">Balanced rotation</strong> - No clear
                            sector leadership. Market awaiting direction.
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
