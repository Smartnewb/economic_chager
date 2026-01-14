"use client";

import { usePolicyStore, CentralBankData, PolicyStatus } from "@/store/policyStore";
import { useState } from "react";

// Zone definitions on the cycle (0-100)
const ZONES = {
    low: { start: 0, end: 25, label: "🌱 Low/Neutral", color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.1)" },
    hiking: { start: 25, end: 50, label: "🔥 Hiking", color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)" },
    peak: { start: 50, end: 75, label: "⛰️ Peak & Pause", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.1)" },
    cutting: { start: 75, end: 100, label: "💧 Cutting", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" },
};

// Get zone from position
const getZone = (position: number): keyof typeof ZONES => {
    if (position < 25) return "low";
    if (position < 50) return "hiking";
    if (position < 75) return "peak";
    return "cutting";
};

// Convert position to SVG coordinates on sine wave
const positionToCoords = (
    position: number,
    width: number,
    height: number,
    amplitude: number
): { x: number; y: number } => {
    const x = (position / 100) * width;
    // Sine wave: starts at center, goes up (hiking), peaks (pause), comes down (cutting)
    const normalizedPos = (position / 100) * Math.PI * 2;
    const y = height / 2 - Math.sin(normalizedPos - Math.PI / 2) * amplitude;
    return { x, y };
};

// Generate sine wave path
const generateSineWavePath = (
    width: number,
    height: number,
    amplitude: number
): string => {
    const points: string[] = [];
    for (let i = 0; i <= 100; i++) {
        const { x, y } = positionToCoords(i, width, height, amplitude);
        points.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
    }
    return points.join(" ");
};

// Country marker component
const CountryMarker = ({
    bank,
    x,
    y,
    isSelected,
    onSelect,
}: {
    bank: CentralBankData;
    x: number;
    y: number;
    isSelected: boolean;
    onSelect: () => void;
}) => {
    const zone = getZone(bank.cyclePosition);
    const zoneColor = ZONES[zone].color;

    return (
        <g
            className="cursor-pointer transition-all duration-300"
            onClick={onSelect}
            style={{ transform: `translate(${x}px, ${y}px)` }}
        >
            {/* Glow effect when selected */}
            {isSelected && (
                <circle
                    cx={0}
                    cy={0}
                    r={28}
                    fill="none"
                    stroke={zoneColor}
                    strokeWidth={2}
                    className="animate-pulse"
                    opacity={0.5}
                />
            )}
            {/* Background circle */}
            <circle
                cx={0}
                cy={0}
                r={isSelected ? 24 : 20}
                fill="#1f2937"
                stroke={zoneColor}
                strokeWidth={isSelected ? 3 : 2}
                className="transition-all duration-200"
            />
            {/* Flag emoji */}
            <text
                x={0}
                y={5}
                textAnchor="middle"
                fontSize={isSelected ? 18 : 14}
                className="select-none"
            >
                {bank.flag}
            </text>
        </g>
    );
};

// Tooltip component
const CountryTooltip = ({ bank }: { bank: CentralBankData }) => {
    const zone = getZone(bank.cyclePosition);
    const zoneInfo = ZONES[zone];

    return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-xl min-w-[280px]">
            <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{bank.flag}</span>
                <div>
                    <h4 className="font-bold text-white">{bank.country}</h4>
                    <p className="text-xs text-gray-400">{bank.bank}</p>
                </div>
            </div>

            {/* Status badge */}
            <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4"
                style={{ backgroundColor: zoneInfo.bgColor, color: zoneInfo.color }}
            >
                {zoneInfo.label}
            </div>

            {/* Rate details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-gray-400 text-xs">Policy Rate</div>
                    <div className="text-white font-bold text-lg">
                        {bank.currentRate.toFixed(2)}%
                    </div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-gray-400 text-xs">Inflation</div>
                    <div className="text-white font-bold text-lg">
                        {bank.inflationRate.toFixed(1)}%
                    </div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-gray-400 text-xs">Real Rate</div>
                    <div
                        className={`font-bold text-lg ${bank.realRate >= 0 ? "text-purple-400" : "text-green-400"}`}
                    >
                        {bank.realRate >= 0 ? "+" : ""}
                        {bank.realRate.toFixed(2)}%
                    </div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-gray-400 text-xs">Last Change</div>
                    <div
                        className={`font-bold text-lg ${
                            bank.lastChange.startsWith("+")
                                ? "text-red-400"
                                : bank.lastChange.startsWith("-")
                                  ? "text-blue-400"
                                  : "text-gray-400"
                        }`}
                    >
                        {bank.lastChange}
                    </div>
                </div>
            </div>

            {/* Next meeting */}
            <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-xs text-gray-400">Next Meeting</div>
                <div className="text-white font-medium">{bank.nextMeetingDate}</div>
            </div>
        </div>
    );
};

export default function RateCycleClock() {
    const { centralBanks, isLoadingData, selectedCountry, setSelectedCountry } =
        usePolicyStore();
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

    // SVG dimensions
    const width = 800;
    const height = 300;
    const amplitude = 100;
    const padding = 40;

    if (isLoadingData) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Policy Cycle Clock
                </h3>
                <div className="h-[350px] flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">
                        Loading policy data...
                    </div>
                </div>
            </div>
        );
    }

    const selectedBank =
        centralBanks.find((b) => b.code === (hoveredCountry || selectedCountry)) ||
        null;

    // Generate wave path
    const wavePath = generateSineWavePath(width - padding * 2, height, amplitude);

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        Policy Cycle Clock
                    </h3>
                    <p className="text-sm text-gray-400">
                        Where is each central bank in the rate cycle?
                    </p>
                </div>
                <div className="flex gap-2">
                    {Object.entries(ZONES).map(([key, zone]) => (
                        <div
                            key={key}
                            className="flex items-center gap-1 text-xs"
                            style={{ color: zone.color }}
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: zone.color }}
                            />
                            {zone.label.split(" ")[1]}
                        </div>
                    ))}
                </div>
            </div>

            {/* SVG Clock */}
            <div className="relative">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full"
                    style={{ height: "350px" }}
                >
                    {/* Background zones */}
                    <defs>
                        <linearGradient id="zoneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={ZONES.low.color} stopOpacity={0.1} />
                            <stop offset="25%" stopColor={ZONES.hiking.color} stopOpacity={0.1} />
                            <stop offset="50%" stopColor={ZONES.peak.color} stopOpacity={0.1} />
                            <stop offset="75%" stopColor={ZONES.cutting.color} stopOpacity={0.1} />
                            <stop offset="100%" stopColor={ZONES.low.color} stopOpacity={0.1} />
                        </linearGradient>
                    </defs>

                    {/* Zone background */}
                    <rect
                        x={padding}
                        y={20}
                        width={width - padding * 2}
                        height={height - 40}
                        fill="url(#zoneGradient)"
                        rx={12}
                    />

                    {/* Zone labels */}
                    {Object.entries(ZONES).map(([key, zone], index) => {
                        const zoneWidth = (width - padding * 2) / 4;
                        const x = padding + index * zoneWidth + zoneWidth / 2;
                        return (
                            <g key={key}>
                                <text
                                    x={x}
                                    y={35}
                                    textAnchor="middle"
                                    fill={zone.color}
                                    fontSize={12}
                                    fontWeight="bold"
                                >
                                    {zone.label}
                                </text>
                                {/* Zone divider */}
                                {index < 3 && (
                                    <line
                                        x1={padding + (index + 1) * zoneWidth}
                                        y1={45}
                                        x2={padding + (index + 1) * zoneWidth}
                                        y2={height - 20}
                                        stroke="white"
                                        strokeOpacity={0.1}
                                        strokeDasharray="4 4"
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* Sine wave path */}
                    <g transform={`translate(${padding}, 0)`}>
                        {/* Shadow */}
                        <path
                            d={wavePath}
                            fill="none"
                            stroke="white"
                            strokeWidth={6}
                            strokeOpacity={0.1}
                            strokeLinecap="round"
                        />
                        {/* Main wave */}
                        <path
                            d={wavePath}
                            fill="none"
                            stroke="white"
                            strokeWidth={3}
                            strokeOpacity={0.3}
                            strokeLinecap="round"
                        />

                        {/* Country markers */}
                        {centralBanks.map((bank) => {
                            const { x, y } = positionToCoords(
                                bank.cyclePosition,
                                width - padding * 2,
                                height,
                                amplitude
                            );
                            return (
                                <CountryMarker
                                    key={bank.code}
                                    bank={bank}
                                    x={x}
                                    y={y}
                                    isSelected={
                                        selectedCountry === bank.code ||
                                        hoveredCountry === bank.code
                                    }
                                    onSelect={() => {
                                        setSelectedCountry(
                                            selectedCountry === bank.code ? null : bank.code
                                        );
                                    }}
                                />
                            );
                        })}
                    </g>

                    {/* Cycle direction arrow */}
                    <g transform={`translate(${width - 60}, ${height - 30})`}>
                        <text fill="white" fillOpacity={0.5} fontSize={10}>
                            Cycle Direction →
                        </text>
                    </g>
                </svg>

                {/* Tooltip overlay */}
                {selectedBank && (
                    <div
                        className="absolute z-10 pointer-events-none"
                        style={{
                            left: `${(selectedBank.cyclePosition / 100) * 100}%`,
                            top: "50%",
                            transform: "translate(-50%, -120%)",
                        }}
                    >
                        <CountryTooltip bank={selectedBank} />
                    </div>
                )}
            </div>

            {/* Country list (compact) */}
            <div className="mt-4 flex flex-wrap gap-2">
                {centralBanks.map((bank) => {
                    const zone = getZone(bank.cyclePosition);
                    const isActive = selectedCountry === bank.code;
                    return (
                        <button
                            key={bank.code}
                            onClick={() =>
                                setSelectedCountry(isActive ? null : bank.code)
                            }
                            onMouseEnter={() => setHoveredCountry(bank.code)}
                            onMouseLeave={() => setHoveredCountry(null)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                                isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                            <span>{bank.flag}</span>
                            <span>{bank.code}</span>
                            <span
                                className="text-xs font-medium"
                                style={{ color: ZONES[zone].color }}
                            >
                                {bank.currentRate.toFixed(1)}%
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
