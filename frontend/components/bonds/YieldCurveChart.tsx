"use client";

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
        <div className="w-full bg-black/30 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">US Treasury Yield Curve</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Current vs 30 days ago
                    </p>
                </div>
                {isInverted && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg animate-pulse">
                        <span className="text-red-400 text-lg">⚠️</span>
                        <span className="text-red-400 font-semibold">YIELD CURVE INVERTED</span>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
                        <Legend
                            formatter={(value) =>
                                value === "current" ? "Today" : "30 Days Ago"
                            }
                            wrapperStyle={{ paddingTop: 20 }}
                        />

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

                        {/* Previous Month Curve */}
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

            {/* Key Metrics Footer */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                <div className="text-center">
                    <p className="text-gray-400 text-sm">2-Year Yield</p>
                    <p className="text-2xl font-bold text-blue-400">
                        {metrics?.yield2Y.toFixed(2)}%
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-gray-400 text-sm">10-Year Yield</p>
                    <p className="text-2xl font-bold text-cyan-400">
                        {metrics?.yield10Y.toFixed(2)}%
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-gray-400 text-sm">10Y-2Y Spread</p>
                    <p
                        className={`text-2xl font-bold ${
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
