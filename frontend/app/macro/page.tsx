"use client";

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';

interface MacroMetrics {
    buffett_indicator: {
        value: number;
        signal: string;
        description: string;
    };
    yield_curve_spread: {
        value: number;
        signal: string;
        description: string;
    };
    m2_growth: {
        value: number;
        signal: string;
        description: string;
    };
    vix: {
        value: number;
        signal: string;
        description: string;
    };
    credit_spreads: {
        value: number;
        signal: string;
        description: string;
    };
    debt_to_gdp: {
        value: number;
        signal: string;
        description: string;
    };
}

export default function MacroPage() {
    const [metrics, setMetrics] = useState<MacroMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMacroData();
    }, []);

    const fetchMacroData = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/macro/health-check');
            const data = await response.json();
            setMetrics(data);
        } catch (error) {
            console.error('Failed to fetch macro data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSignalColor = (signal: string) => {
        switch (signal.toLowerCase()) {
            case 'bullish':
            case 'healthy':
            case 'low':
                return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'bearish':
            case 'recession_warning':
            case 'extreme':
            case 'high':
                return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'neutral':
            case 'normal':
            case 'elevated':
                return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            default:
                return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getSignalIcon = (signal: string) => {
        switch (signal.toLowerCase()) {
            case 'bullish':
            case 'healthy':
            case 'low':
                return '✅';
            case 'bearish':
            case 'recession_warning':
            case 'extreme':
            case 'high':
                return '🚨';
            case 'neutral':
            case 'normal':
            case 'elevated':
                return '⚠️';
            default:
                return '📊';
        }
    };

    const renderMetricCard = (title: string, data: any, icon: string) => {
        if (!data) return null;

        return (
            <div className="bg-[#111116] border border-[#27272a] rounded-lg p-6 hover:border-blue-500/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{icon}</span>
                        <div>
                            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">{title}</h3>
                            <div className="text-[10px] text-gray-500 mt-1">{data.description}</div>
                        </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded border font-bold ${getSignalColor(data.signal)}`}>
                        {getSignalIcon(data.signal)} {data.signal.toUpperCase()}
                    </div>
                </div>

                <div className="mt-4">
                    <div className="text-3xl font-bold text-white font-mono">
                        {typeof data.value === 'number' ? data.value.toFixed(2) : data.value}
                        {title.includes('Growth') || title.includes('Spread') || title.includes('Ratio') ? '%' : ''}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="h-screen w-screen bg-[#050505] text-white overflow-hidden flex flex-col">
            <Navigation />

            <div className="flex-1 overflow-auto p-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-3">
                        <span className="text-purple-500">📈 MACRO_HEALTH_CHECK</span>
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
                            REAL-TIME
                        </span>
                    </h1>
                    <p className="text-sm text-gray-400 mt-2">
                        Comprehensive macroeconomic indicators - Valuation, liquidity, risk, and cycle analysis
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-gray-400">Loading macro indicators...</div>
                    </div>
                ) : metrics ? (
                    <>
                        {/* Summary Bar */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] text-purple-400 uppercase font-bold tracking-wider mb-1">
                                        Overall Market Health
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        Based on 6 key macro indicators from FRED and market data
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {[
                                        metrics.buffett_indicator,
                                        metrics.yield_curve_spread,
                                        metrics.m2_growth,
                                        metrics.vix,
                                        metrics.credit_spreads,
                                        metrics.debt_to_gdp
                                    ].map((metric, i) => {
                                        const colors = getSignalColor(metric?.signal || 'neutral');
                                        return (
                                            <div
                                                key={i}
                                                className={`w-3 h-3 rounded-full ${
                                                    colors.includes('green')
                                                        ? 'bg-green-500'
                                                        : colors.includes('red')
                                                        ? 'bg-red-500'
                                                        : 'bg-yellow-500'
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {renderMetricCard(
                                'Buffett Indicator',
                                metrics.buffett_indicator,
                                '💰'
                            )}
                            {renderMetricCard(
                                'Yield Curve Spread',
                                metrics.yield_curve_spread,
                                '📉'
                            )}
                            {renderMetricCard(
                                'M2 Money Supply Growth',
                                metrics.m2_growth,
                                '💵'
                            )}
                            {renderMetricCard(
                                'VIX Fear Index',
                                metrics.vix,
                                '😱'
                            )}
                            {renderMetricCard(
                                'Credit Spreads',
                                metrics.credit_spreads,
                                '🏦'
                            )}
                            {renderMetricCard(
                                'Debt to GDP Ratio',
                                metrics.debt_to_gdp,
                                '📊'
                            )}
                        </div>

                        {/* Detailed Explanations */}
                        <div className="mt-6 bg-[#111116] border border-[#27272a] rounded-lg p-6">
                            <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-blue-500 rounded-sm"></span>
                                Indicator Guide
                            </h2>

                            <div className="space-y-3 text-xs text-gray-300">
                                <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                                    <div className="font-bold text-white mb-1">💰 Buffett Indicator</div>
                                    <div>Total stock market capitalization divided by GDP. Values &gt;150% suggest overvaluation.</div>
                                </div>

                                <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                                    <div className="font-bold text-white mb-1">📉 Yield Curve Spread</div>
                                    <div>10Y - 2Y Treasury spread. Negative values (inversion) historically precede recessions.</div>
                                </div>

                                <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                                    <div className="font-bold text-white mb-1">💵 M2 Money Supply Growth</div>
                                    <div>Year-over-year change in M2. Rapid growth can indicate inflation, contraction suggests liquidity stress.</div>
                                </div>

                                <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                                    <div className="font-bold text-white mb-1">😱 VIX Fear Index</div>
                                    <div>Market volatility expectations. &gt;30 = high fear, &lt;15 = complacency.</div>
                                </div>

                                <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                                    <div className="font-bold text-white mb-1">🏦 Credit Spreads</div>
                                    <div>Corporate bond yields minus Treasuries. Widening spreads indicate credit stress.</div>
                                </div>

                                <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                                    <div className="font-bold text-white mb-1">📊 Debt to GDP Ratio</div>
                                    <div>Government debt as % of GDP. Rising levels suggest fiscal constraints and potential monetary policy pressure.</div>
                                </div>
                            </div>
                        </div>

                        {/* Data Sources */}
                        <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded text-[10px] text-gray-400">
                            <span className="font-bold text-blue-400">DATA SOURCES:</span> Federal Reserve Economic Data (FRED), Yahoo Finance, Bloomberg
                            <span className="ml-4 font-bold text-blue-400">UPDATE FREQUENCY:</span> Daily market data, Monthly economic data
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-500 py-12">
                        Failed to load macro indicators. Please check API connection.
                    </div>
                )}
            </div>
        </main>
    );
}
