"use client";

import { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { useBondStore } from "@/store/bondStore";

interface ChartDataPoint {
    maturity: string;
    current: number;
    previous: number;
    order: number;
}

const maturityOrder: Record<string, number> = {
    "1M": 1,
    "3M": 3,
    "6M": 6,
    "1Y": 12,
    "2Y": 24,
    "3Y": 36,
    "5Y": 60,
    "7Y": 84,
    "10Y": 120,
    "20Y": 240,
    "30Y": 360,
};

export default function YieldCurveChart() {
    const { currentCurve, previousCurve, isLoadingData, metrics } = useBondStore();
    const [showComparison, setShowComparison] = useState(true);

    if (isLoadingData) {
        return (
            <div className="w-full h-[400px] flex items-center justify-center bg-black/30 rounded-2xl border border-white/10">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400">Loading yield data...</span>
                </div>
            </div>
        );
    }

    if (!currentCurve) {
        return (
            <div className="w-full h-[400px] flex items-center justify-center bg-black/30 rounded-2xl border border-white/10">
                <span className="text-gray-400">No yield curve data available</span>
            </div>
        );
    }

    // Transform data for Recharts
    const chartData: ChartDataPoint[] = currentCurve.data
        .map((point) => ({
            maturity: point.maturity,
            current: point.yield,
            previous: previousCurve?.data.find((p) => p.maturity === point.maturity)?.yield || 0,
            order: maturityOrder[point.maturity] || 0,
        }))
        .sort((a, b) => a.order - b.order);

    // Calculate min and max for Y axis
    const allYields = chartData.flatMap((d) => [d.current, d.previous].filter(Boolean));
    const minYield = Math.floor(Math.min(...allYields) * 10) / 10 - 0.2;
    const maxYield = Math.ceil(Math.max(...allYields) * 10) / 10 + 0.2;

    // Check for inversion (2Y > 10Y)
    const isInverted = metrics?.isInverted || false;

    return (
        <div className="w-full bg-black/30 rounded-2xl border border-white/10 p-4 sm:p-6 backdrop-blur-sm">
            {/* Header - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">US Treasury Yield Curve</h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        {showComparison ? "Current vs 30 days ago" : "Current yield curve"}
                    </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {/* Historical Comparison Toggle */}
                    <button
                        onClick={() => setShowComparison(!showComparison)}
                        className={`
                            flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border transition-all duration-200 touch-manipulation
                            ${showComparison
                                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                                : "bg-white/5 border-white/20 text-gray-400 hover:bg-white/10"
                            }
                        `}
                    >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs sm:text-sm font-medium">30D Compare</span>
                    </button>

                    {isInverted && (
                        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-red-500/20 border border-red-500/50 rounded-lg animate-pulse">
                            <span className="text-red-400 text-base sm:text-lg">⚠️</span>
                            <span className="text-red-400 font-semibold text-xs sm:text-sm">INVERTED</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Chart - Responsive Height */}
            <div className="w-full h-[250px] sm:h-[300px] md:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.1)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="maturity"
                            tick={{ fill: "#9CA3AF", fontSize: 12 }}
                            axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                            tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                        />
                        <YAxis
                            domain={[minYield, maxYield]}
                            tick={{ fill: "#9CA3AF", fontSize: 12 }}
                            axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                            tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                            tickFormatter={(value) => `${value.toFixed(1)}%`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(0, 0, 0, 0.9)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                borderRadius: "8px",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                            }}
                            labelStyle={{ color: "#fff", fontWeight: "bold" }}
                            formatter={(value, name) => {
                                const numValue = typeof value === "number" ? value : 0;
                                return [
                                    `${numValue.toFixed(2)}%`,
                                    name === "current" ? "Today" : "30 Days Ago",
                                ];
                            }}
                        />
                        {showComparison && (
                            <Legend
                                formatter={(value) =>
                                    value === "current" ? "Today" : "30 Days Ago"
                                }
                                wrapperStyle={{ paddingTop: 20 }}
                            />
                        )}

                        {/* Reference line at 2Y-10Y spread area */}
                        <ReferenceLine
                            y={chartData.find((d) => d.maturity === "2Y")?.current}
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeDasharray="5 5"
                            label={{
                                value: "2Y",
                                fill: "#9CA3AF",
                                fontSize: 10,
                                position: "right",
                            }}
                        />

                        {/* Previous Month Curve - conditionally rendered */}
                        {showComparison && (
                            <Line
                                type="monotone"
                                dataKey="previous"
                                stroke="#6B7280"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: "#6B7280", strokeWidth: 0, r: 3 }}
                                activeDot={{ r: 5, fill: "#6B7280" }}
                                name="previous"
                            />
                        )}

                        {/* Current Curve */}
                        <Line
                            type="monotone"
                            dataKey="current"
                            stroke={isInverted ? "#EF4444" : "#22D3EE"}
                            strokeWidth={3}
                            dot={{
                                fill: isInverted ? "#EF4444" : "#22D3EE",
                                strokeWidth: 0,
                                r: 4,
                            }}
                            activeDot={{
                                r: 6,
                                fill: isInverted ? "#EF4444" : "#22D3EE",
                                stroke: "#fff",
                                strokeWidth: 2,
                            }}
                            name="current"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Key Metrics Footer - Responsive */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                <div className="text-center">
                    <p className="text-gray-400 text-[10px] sm:text-sm">2-Year Yield</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-400">
                        {metrics?.yield2Y.toFixed(2)}%
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-gray-400 text-[10px] sm:text-sm">10-Year Yield</p>
                    <p className="text-lg sm:text-2xl font-bold text-cyan-400">
                        {metrics?.yield10Y.toFixed(2)}%
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-gray-400 text-[10px] sm:text-sm">10Y-2Y Spread</p>
                    <p
                        className={`text-lg sm:text-2xl font-bold ${
                            (metrics?.spread || 0) < 0 ? "text-red-400" : "text-green-400"
                        }`}
                    >
                        {(metrics?.spread || 0) >= 0 ? "+" : ""}
                        {metrics?.spread.toFixed(2)}%
                    </p>
                </div>
            </div>
        </div>
    );
}
