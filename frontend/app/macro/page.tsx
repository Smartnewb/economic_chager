"use client";

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { AnalysisTriggerButton, AnalysisPanel, AnalysisResult, HelpTooltip } from '@/components/ui';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    ReferenceLine,
} from 'recharts';

type Period = '1M' | '3M' | '1Y' | '5Y' | '10Y';

interface HistoricalDataPoint {
    date: string;
    value: number;
}

interface HistoricalData {
    [key: string]: HistoricalDataPoint[];
}

interface MacroHealthData {
    timestamp: string;
    data_freshness: string;
    valuation: {
        buffett_indicator: {
            value: number;
            signal: string;
            description: string;
        };
        market_cap_billions: number;
        gdp_billions: number;
    };
    cycles: {
        yield_curve: {
            spread_10y_2y: number;
            signal: string;
            treasury_10y: number;
            treasury_2y: number;
            description: string;
        };
        fed_funds_rate: number;
        unemployment_rate: number;
        debt_to_gdp: number;
    };
    liquidity: {
        m2_growth: {
            yoy_percent: number;
            signal: string;
            description: string;
        };
        credit_spread: {
            value: number;
            signal: string;
            description: string;
        };
    };
    risk: {
        vix: {
            value: number;
            signal: string;
            description: string;
        };
    };
    inflation: {
        cpi_yoy: {
            value: number;
            signal: string;
            description: string;
        };
        real_interest_rate: {
            value: number;
            description: string;
        };
    };
}

export default function MacroPage() {
    const [data, setData] = useState<MacroHealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [showPanel, setShowPanel] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('1Y');
    const [historicalData, setHistoricalData] = useState<HistoricalData>({});
    const [selectedChart, setSelectedChart] = useState<string | null>(null);
    const [chartLoading, setChartLoading] = useState(false);

    useEffect(() => {
        fetchMacroData();
    }, []);

    useEffect(() => {
        fetchHistoricalData(selectedPeriod);
    }, [selectedPeriod]);

    const fetchMacroData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://localhost:8000/api/macro/health-check');
            if (!response.ok) throw new Error('Failed to fetch');
            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error('Failed to fetch macro data:', err);
            setError('Failed to connect to backend. Please ensure the server is running.');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistoricalData = async (period: Period) => {
        try {
            setChartLoading(true);
            const response = await fetch(`http://localhost:8000/api/macro/historical?period=${period}`);
            if (response.ok) {
                const result = await response.json();
                setHistoricalData(result.indicators || {});
            }
        } catch (err) {
            console.error('Failed to fetch historical data:', err);
        } finally {
            setChartLoading(false);
        }
    };

    const fetchDetailedHistory = async (seriesId: string) => {
        if (selectedChart === seriesId) {
            setSelectedChart(null);
            return;
        }

        try {
            setChartLoading(true);
            const response = await fetch(`http://localhost:8000/api/macro/historical/${seriesId}?period=${selectedPeriod}`);
            if (response.ok) {
                const result = await response.json();
                setHistoricalData(prev => ({
                    ...prev,
                    [`${seriesId}_detail`]: result.data || []
                }));
                setSelectedChart(seriesId);
            }
        } catch (err) {
            console.error('Failed to fetch detailed history:', err);
        } finally {
            setChartLoading(false);
        }
    };

    const renderSparkline = (dataKey: string, color: string, height: number = 40) => {
        const sparkData = historicalData[dataKey] || [];
        if (sparkData.length === 0) return null;

        return (
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={sparkData}>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={1.5}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setShowPanel(true);
        try {
            const cacheRes = await fetch('http://localhost:8000/api/analyze/macro/cached?language=en');
            const cacheData = await cacheRes.json();
            if (cacheData.cached && cacheData.result) {
                setAnalysisResult(cacheData.result);
                setIsAnalyzing(false);
                return;
            }

            const response = await fetch('http://localhost:8000/api/analyze/macro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buffett_indicator: data?.valuation.buffett_indicator.value || 180,
                    yield_curve_spread: data?.cycles.yield_curve.spread_10y_2y || -0.3,
                    vix: data?.risk.vix.value || 18,
                    language: 'en'
                })
            });
            const result = await response.json();
            setAnalysisResult(result);
        } catch (err) {
            console.error('Analysis failed:', err);
            setAnalysisResult({
                topic: 'macro',
                timestamp: new Date().toISOString(),
                perspectives: [
                    { persona: 'kostolany', analysis: 'Unable to connect to AI service.' },
                    { persona: 'buffett', analysis: 'Analysis service unavailable.' },
                    { persona: 'munger', analysis: 'Check network and backend.' },
                    { persona: 'dalio', analysis: 'Will retry when available.' }
                ]
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSignalColor = (signal: string) => {
        const s = signal.toLowerCase();
        if (s.includes('overvalued') || s.includes('inverted') || s.includes('contract') || s.includes('elevated') || s.includes('high')) {
            return 'text-red-400 bg-red-500/10 border-red-500/20';
        }
        if (s.includes('normal') || s.includes('low') || s.includes('healthy') || s.includes('fair')) {
            return 'text-green-400 bg-green-500/10 border-green-500/20';
        }
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    };

    const getSignalIcon = (signal: string) => {
        const s = signal.toLowerCase();
        if (s.includes('overvalued') || s.includes('inverted') || s.includes('contract') || s.includes('elevated') || s.includes('high')) {
            return '🚨';
        }
        if (s.includes('normal') || s.includes('low') || s.includes('healthy') || s.includes('fair')) {
            return '✅';
        }
        return '⚠️';
    };

    if (loading) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-gray-400">Loading macro indicators...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 mb-4">{error}</div>
                    <button onClick={fetchMacroData} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
                        Retry
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="h-screen w-screen bg-[#050505] text-white overflow-hidden flex flex-col">
            <Navigation />

            <div className="flex-1 overflow-auto p-4">
                <div className="mb-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-3">
                                <span className="text-purple-500">📈 MACRO_HEALTH_CHECK</span>
                                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
                                    {data?.data_freshness || 'LIVE'}
                                </span>
                            </h1>
                            <p className="text-sm text-gray-400 mt-2">
                                Comprehensive macroeconomic indicators - Valuation, liquidity, risk, and cycle analysis
                            </p>
                        </div>

                        {/* Period Selector */}
                        <div className="flex items-center gap-1 bg-[#111116] border border-[#27272a] rounded-lg p-1">
                            {(['1M', '3M', '1Y', '5Y', '10Y'] as Period[]).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                                        selectedPeriod === period
                                            ? 'bg-purple-500 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {data && (
                    <>
                        {/* Summary Bar */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] text-purple-400 uppercase font-bold tracking-wider mb-1">
                                        Overall Market Health
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        Based on key macro indicators from FRED and market data
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {[
                                        data.valuation.buffett_indicator.signal,
                                        data.cycles.yield_curve.signal,
                                        data.liquidity.m2_growth.signal,
                                        data.risk.vix.signal,
                                        data.liquidity.credit_spread.signal,
                                        data.inflation.cpi_yoy.signal
                                    ].map((signal, i) => {
                                        const colors = getSignalColor(signal);
                                        return (
                                            <div
                                                key={i}
                                                className={`w-3 h-3 rounded-full ${
                                                    colors.includes('green') ? 'bg-green-500' :
                                                    colors.includes('red') ? 'bg-red-500' : 'bg-amber-500'
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Buffett Indicator */}
                            <div className="bg-[#111116] border border-[#27272a] rounded-lg p-6 hover:border-purple-500/30 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">💰</span>
                                        <div>
                                            <HelpTooltip helpKey="buffett_indicator" position="right">
                                                <h3 className="text-sm font-bold text-gray-300 uppercase">Buffett Indicator</h3>
                                            </HelpTooltip>
                                            <div className="text-[10px] text-gray-500 mt-1">{data.valuation.buffett_indicator.description}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded border font-bold ${getSignalColor(data.valuation.buffett_indicator.signal)}`}>
                                        {getSignalIcon(data.valuation.buffett_indicator.signal)} {data.valuation.buffett_indicator.signal.replace('_', ' ').toUpperCase()}
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white font-mono">{data.valuation.buffett_indicator.value.toFixed(1)}%</div>
                                <div className="text-xs text-gray-500 mt-2">Market Cap: ${(data.valuation.market_cap_billions / 1000).toFixed(1)}T / GDP: ${(data.valuation.gdp_billions / 1000).toFixed(1)}T</div>
                            </div>

                            {/* Yield Curve */}
                            <div
                                onClick={() => fetchDetailedHistory('yield_spread')}
                                className={`bg-[#111116] border rounded-lg p-6 transition-colors cursor-pointer ${
                                    selectedChart === 'yield_spread' ? 'border-purple-500' : 'border-[#27272a] hover:border-purple-500/30'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">📉</span>
                                        <div>
                                            <HelpTooltip helpKey="yield_curve" position="right">
                                                <h3 className="text-sm font-bold text-gray-300 uppercase">Yield Curve Spread</h3>
                                            </HelpTooltip>
                                            <div className="text-[10px] text-gray-500 mt-1">{data.cycles.yield_curve.description}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded border font-bold ${getSignalColor(data.cycles.yield_curve.signal)}`}>
                                        {getSignalIcon(data.cycles.yield_curve.signal)} {data.cycles.yield_curve.signal.toUpperCase()}
                                    </div>
                                </div>
                                <div className={`text-3xl font-bold font-mono ${data.cycles.yield_curve.spread_10y_2y < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {data.cycles.yield_curve.spread_10y_2y.toFixed(2)}%
                                </div>
                                <div className="text-xs text-gray-500 mt-2">10Y: {data.cycles.yield_curve.treasury_10y.toFixed(2)}% | 2Y: {data.cycles.yield_curve.treasury_2y.toFixed(2)}%</div>

                                {/* Sparkline */}
                                <div className="mt-3 h-10">
                                    {renderSparkline('yield_spread', data.cycles.yield_curve.spread_10y_2y < 0 ? '#ef4444' : '#22c55e')}
                                </div>
                                <div className="text-[10px] text-gray-600 text-center mt-1">Click for detailed chart</div>
                            </div>

                            {/* M2 Growth */}
                            <div className="bg-[#111116] border border-[#27272a] rounded-lg p-6 hover:border-purple-500/30 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">💵</span>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-300 uppercase">M2 Money Supply</h3>
                                            <div className="text-[10px] text-gray-500 mt-1">{data.liquidity.m2_growth.description}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded border font-bold ${getSignalColor(data.liquidity.m2_growth.signal)}`}>
                                        {getSignalIcon(data.liquidity.m2_growth.signal)} {data.liquidity.m2_growth.signal.toUpperCase()}
                                    </div>
                                </div>
                                <div className={`text-3xl font-bold font-mono ${data.liquidity.m2_growth.yoy_percent < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {data.liquidity.m2_growth.yoy_percent > 0 ? '+' : ''}{data.liquidity.m2_growth.yoy_percent.toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-500 mt-2">Year-over-Year Change</div>
                            </div>

                            {/* VIX */}
                            <div
                                onClick={() => fetchDetailedHistory('vix')}
                                className={`bg-[#111116] border rounded-lg p-6 transition-colors cursor-pointer ${
                                    selectedChart === 'vix' ? 'border-purple-500' : 'border-[#27272a] hover:border-purple-500/30'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">😱</span>
                                        <div>
                                            <HelpTooltip helpKey="vix" position="right">
                                                <h3 className="text-sm font-bold text-gray-300 uppercase">VIX Fear Index</h3>
                                            </HelpTooltip>
                                            <div className="text-[10px] text-gray-500 mt-1">{data.risk.vix.description}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded border font-bold ${getSignalColor(data.risk.vix.signal)}`}>
                                        {getSignalIcon(data.risk.vix.signal)} {data.risk.vix.signal.replace('_', ' ').toUpperCase()}
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white font-mono">{data.risk.vix.value.toFixed(1)}</div>
                                <div className="text-xs text-gray-500 mt-2">&lt;15 Complacency | 15-25 Normal | &gt;30 Fear</div>

                                {/* Sparkline */}
                                <div className="mt-3 h-10">
                                    {renderSparkline('vix', '#f59e0b')}
                                </div>
                                <div className="text-[10px] text-gray-600 text-center mt-1">Click for detailed chart</div>
                            </div>

                            {/* Credit Spread */}
                            <div className="bg-[#111116] border border-[#27272a] rounded-lg p-6 hover:border-purple-500/30 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🏦</span>
                                        <div>
                                            <HelpTooltip helpKey="credit_spread" position="right">
                                                <h3 className="text-sm font-bold text-gray-300 uppercase">Credit Spreads</h3>
                                            </HelpTooltip>
                                            <div className="text-[10px] text-gray-500 mt-1">{data.liquidity.credit_spread.description}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded border font-bold ${getSignalColor(data.liquidity.credit_spread.signal)}`}>
                                        {getSignalIcon(data.liquidity.credit_spread.signal)} {data.liquidity.credit_spread.signal.toUpperCase()}
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white font-mono">{data.liquidity.credit_spread.value.toFixed(2)}%</div>
                                <div className="text-xs text-gray-500 mt-2">Corporate Bond Spread over Treasuries</div>
                            </div>

                            {/* CPI / Inflation */}
                            <div
                                onClick={() => fetchDetailedHistory('cpi')}
                                className={`bg-[#111116] border rounded-lg p-6 transition-colors cursor-pointer ${
                                    selectedChart === 'cpi' ? 'border-purple-500' : 'border-[#27272a] hover:border-purple-500/30'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">📊</span>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-300 uppercase">Inflation (CPI)</h3>
                                            <div className="text-[10px] text-gray-500 mt-1">{data.inflation.cpi_yoy.description}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded border font-bold ${getSignalColor(data.inflation.cpi_yoy.signal)}`}>
                                        {getSignalIcon(data.inflation.cpi_yoy.signal)} {data.inflation.cpi_yoy.signal.toUpperCase()}
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white font-mono">{data.inflation.cpi_yoy.value.toFixed(1)}%</div>
                                <div className="text-xs text-gray-500 mt-2">Real Rate: {data.inflation.real_interest_rate.value.toFixed(1)}% | Debt/GDP: {data.cycles.debt_to_gdp.toFixed(1)}%</div>

                                {/* Sparkline */}
                                <div className="mt-3 h-10">
                                    {renderSparkline('cpi', '#a855f7')}
                                </div>
                                <div className="text-[10px] text-gray-600 text-center mt-1">Click for detailed chart</div>
                            </div>
                        </div>

                        {/* Detailed Chart View */}
                        {selectedChart && (
                            <div className="mt-6 bg-[#111116] border border-purple-500/30 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        📈 {selectedChart === 'yield_spread' ? '10Y-2Y Yield Spread' :
                                            selectedChart === 'vix' ? 'VIX Fear Index' :
                                            selectedChart === 'cpi' ? 'Consumer Price Index' :
                                            selectedChart === 'treasury_10y' ? '10-Year Treasury Yield' :
                                            selectedChart === 'unemployment' ? 'Unemployment Rate' :
                                            selectedChart.toUpperCase()} History
                                        <span className="text-xs font-normal text-gray-400">({selectedPeriod})</span>
                                    </h3>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedChart(null); }}
                                        className="text-gray-400 hover:text-white text-sm px-2 py-1 bg-white/5 rounded"
                                    >
                                        ✕ Close
                                    </button>
                                </div>

                                <div className="h-72">
                                    {chartLoading ? (
                                        <div className="h-full flex items-center justify-center text-gray-500">
                                            Loading chart data...
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={historicalData[`${selectedChart}_detail`] || historicalData[selectedChart] || []}>
                                                <defs>
                                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#52525b"
                                                    tick={{ fontSize: 10 }}
                                                    tickFormatter={(date) => {
                                                        const d = new Date(date);
                                                        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                                                    }}
                                                />
                                                <YAxis
                                                    stroke="#52525b"
                                                    tick={{ fontSize: 10 }}
                                                    domain={['auto', 'auto']}
                                                    tickFormatter={(value) => {
                                                        if (selectedChart === 'cpi') return value.toFixed(0);
                                                        return value.toFixed(2);
                                                    }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#18181b',
                                                        border: '1px solid #27272a',
                                                        borderRadius: '8px',
                                                    }}
                                                    labelStyle={{ color: '#a1a1aa' }}
                                                    formatter={(value: number) => [
                                                        selectedChart === 'cpi' ? value.toFixed(1) : `${value.toFixed(2)}%`,
                                                        selectedChart === 'yield_spread' ? 'Spread' :
                                                        selectedChart === 'vix' ? 'VIX' :
                                                        selectedChart === 'cpi' ? 'CPI Index' : 'Value'
                                                    ]}
                                                />
                                                {selectedChart === 'yield_spread' && (
                                                    <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                                                )}
                                                {selectedChart === 'vix' && (
                                                    <>
                                                        <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Normal', fill: '#f59e0b', fontSize: 10 }} />
                                                        <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Fear', fill: '#ef4444', fontSize: 10 }} />
                                                    </>
                                                )}
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#a855f7"
                                                    strokeWidth={2}
                                                    fill="url(#chartGradient)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>

                                {/* Chart Description */}
                                <div className="mt-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded text-xs text-gray-400">
                                    {selectedChart === 'yield_spread' && (
                                        <span>
                                            <strong className="text-purple-400">10Y-2Y Yield Spread:</strong> When negative (inverted), historically precedes recessions by 6-18 months.
                                            Positive spread indicates normal economic conditions.
                                        </span>
                                    )}
                                    {selectedChart === 'vix' && (
                                        <span>
                                            <strong className="text-purple-400">VIX Fear Index:</strong> Below 15 = complacency, 15-20 = normal, 20-30 = elevated fear, above 30 = panic.
                                            Extreme readings often coincide with market bottoms.
                                        </span>
                                    )}
                                    {selectedChart === 'cpi' && (
                                        <span>
                                            <strong className="text-purple-400">Consumer Price Index:</strong> Measures inflation in consumer goods. Fed targets 2% annual inflation.
                                            Sharp increases may lead to rate hikes; decreases may signal deflation.
                                        </span>
                                    )}
                                    {selectedChart === 'treasury_10y' && (
                                        <span>
                                            <strong className="text-purple-400">10-Year Treasury:</strong> Benchmark for mortgage rates and corporate borrowing.
                                            Rising yields = tighter financial conditions. Falling = flight to safety.
                                        </span>
                                    )}
                                    {selectedChart === 'unemployment' && (
                                        <span>
                                            <strong className="text-purple-400">Unemployment Rate:</strong> Below 4% = tight labor market (inflationary pressure).
                                            Sharp increases often signal recession.
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Extra Info Row */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div
                                onClick={() => fetchDetailedHistory('fed_funds')}
                                className={`p-4 bg-[#111116] border rounded cursor-pointer transition-colors ${
                                    selectedChart === 'fed_funds' ? 'border-purple-500' : 'border-[#27272a] hover:border-purple-500/30'
                                }`}
                            >
                                <div className="text-[10px] text-gray-500 uppercase mb-2">Fed Funds Rate</div>
                                <div className="text-2xl font-bold text-emerald-400">{data.cycles.fed_funds_rate.toFixed(2)}%</div>
                                <div className="mt-2 h-8">
                                    {renderSparkline('treasury_10y', '#10b981', 32)}
                                </div>
                            </div>
                            <div
                                onClick={() => fetchDetailedHistory('unemployment')}
                                className={`p-4 bg-[#111116] border rounded cursor-pointer transition-colors ${
                                    selectedChart === 'unemployment' ? 'border-purple-500' : 'border-[#27272a] hover:border-purple-500/30'
                                }`}
                            >
                                <div className="text-[10px] text-gray-500 uppercase mb-2">Unemployment</div>
                                <div className="text-2xl font-bold text-blue-400">{data.cycles.unemployment_rate.toFixed(1)}%</div>
                                <div className="mt-2 h-8">
                                    {renderSparkline('unemployment', '#3b82f6', 32)}
                                </div>
                            </div>
                            <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                                <div className="text-[10px] text-gray-500 uppercase mb-2">Debt to GDP</div>
                                <div className="text-2xl font-bold text-amber-400">{data.cycles.debt_to_gdp.toFixed(1)}%</div>
                            </div>
                        </div>

                        {/* Analysis Button */}
                        <div className="mt-6 flex justify-center">
                            <AnalysisTriggerButton
                                onAnalyze={handleAnalyze}
                                isAnalyzing={isAnalyzing}
                                buttonText="Analyze Macro Environment"
                                subText="Get AI insights on current market conditions"
                            />
                        </div>

                        {/* Data Source */}
                        <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded text-[10px] text-gray-400">
                            <span className="font-bold text-blue-400">DATA SOURCES:</span> Federal Reserve Economic Data (FRED), Yahoo Finance
                            <span className="ml-4 font-bold text-blue-400">UPDATED:</span> {new Date(data.timestamp).toLocaleString()}
                        </div>
                    </>
                )}
            </div>

            <AnalysisPanel
                isOpen={showPanel}
                onClose={() => setShowPanel(false)}
                result={analysisResult}
                isLoading={isAnalyzing}
                topic="Macro Health Analysis"
            />
        </main>
    );
}
