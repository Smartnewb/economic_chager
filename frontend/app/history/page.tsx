"use client";

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { AnalysisTriggerButton, AnalysisPanel, AnalysisResult } from '@/components/ui';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ReferenceArea,
} from 'recharts';

interface CrisisScenario {
    year: string;
    era: string;
    name: string;
    description: string;
    lesson?: string;
    forward_return_12m: number | null;
    forward_return_24m: number | null;
    peak_cape: number | null;
    peak_inflation: number | null;
    peak_drawdown?: number;
    recovery_months?: number;
}

interface EraInfo {
    key: string;
    name: string;
    count: number;
}

type EraFilter = 'all' | 'ancient' | 'medieval' | 'early_modern' | 'modern';

interface SP500DataPoint {
    date: string;
    year: number;
    value: number;
}

interface ParallelMatch {
    year: number;
    date: string;
    period_name: string;
    similarity: number;
    cape: number;
    interest_rate: number;
    inflation: number;
    forward_return_1y: number | null;
    forward_return_3y: number | null;
    forward_return_5y: number | null;
    description: string;
}

interface CurrentConditions {
    cape: number;
    interest_rate: number;
    inflation: number;
    unemployment: number;
    yield_spread: number;
}

// Simulated S&P 500 long-term data (normalized, 1920-2024)
const generateSP500Data = (): SP500DataPoint[] => {
    const data: SP500DataPoint[] = [];
    let value = 10; // Starting value (normalized)

    // Key market events with their approximate impact
    const events: Record<number, number> = {
        1929: -0.4,  // Great Depression start
        1930: -0.3,
        1931: -0.4,
        1932: -0.2,
        1933: 0.5,   // Recovery
        1937: -0.3,  // Recession
        1942: 0.2,   // WWII recovery
        1962: -0.1,  // Cuban Missile Crisis
        1973: -0.3,  // Oil Crisis
        1974: -0.2,
        1987: -0.2,  // Black Monday
        2000: -0.1,  // Dot-com bubble
        2001: -0.15,
        2002: -0.2,
        2008: -0.35, // Financial Crisis
        2009: 0.25,  // Recovery
        2020: -0.2,  // COVID crash
        2021: 0.25,  // Recovery
        2022: -0.15, // Rate hike
    };

    for (let year = 1920; year <= 2024; year++) {
        const eventImpact = events[year] || 0;
        const baseGrowth = 0.07 + (Math.random() - 0.5) * 0.1;
        const growthRate = eventImpact !== 0 ? eventImpact : baseGrowth;
        value = value * (1 + growthRate);
        value = Math.max(5, value); // Floor

        data.push({
            date: `${year}-01-01`,
            year,
            value: Math.round(value * 10) / 10
        });
    }

    return data;
};

export default function HistoryPage() {
    const [crises, setCrises] = useState<CrisisScenario[]>([]);
    const [eras, setEras] = useState<EraInfo[]>([]);
    const [selectedEra, setSelectedEra] = useState<EraFilter>('all');
    const [parallels, setParallels] = useState<ParallelMatch[]>([]);
    const [currentConditions, setCurrentConditions] = useState<CurrentConditions | null>(null);
    const [historicalContext, setHistoricalContext] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCrisis, setSelectedCrisis] = useState<CrisisScenario | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [showPanel, setShowPanel] = useState(false);
    const [sp500Data] = useState<SP500DataPoint[]>(generateSP500Data);
    const [showFactorComparison, setShowFactorComparison] = useState(false);

    useEffect(() => {
        fetchEras();
        fetchHistoricalData(selectedEra);
    }, []);

    useEffect(() => {
        fetchHistoricalData(selectedEra);
    }, [selectedEra]);

    const fetchEras = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/history/eras');
            const data = await res.json();
            setEras(data.eras || []);
        } catch (err) {
            console.error('Failed to fetch eras:', err);
        }
    };

    const fetchHistoricalData = async (era: EraFilter) => {
        try {
            setLoading(true);
            setError(null);
            const [crisesRes, parallelsRes] = await Promise.all([
                fetch(`http://localhost:8000/api/history/crises?era=${era}`),
                fetch('http://localhost:8000/api/history/parallel')
            ]);

            const crisesData = await crisesRes.json();
            const parallelsData = await parallelsRes.json();

            setCrises(crisesData.scenarios || []);
            setParallels(parallelsData.matches || []);
            setCurrentConditions(parallelsData.current_conditions || null);
            setHistoricalContext(parallelsData.historical_context || '');
        } catch (err) {
            console.error('Failed to fetch historical data:', err);
            setError('Failed to connect to backend. Please ensure the server is running.');
        } finally {
            setLoading(false);
        }
    };

    const getEraColor = (era: string): string => {
        switch (era) {
            case 'ancient': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
            case 'medieval': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            case 'early_modern': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
            case 'modern': return 'text-green-400 bg-green-500/10 border-green-500/30';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
        }
    };

    const getEraLabel = (era: string): string => {
        switch (era) {
            case 'ancient': return '🏛️ Ancient';
            case 'medieval': return '⚔️ Medieval';
            case 'early_modern': return '⛵ Early Modern';
            case 'modern': return '🏭 Modern';
            default: return era;
        }
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setShowPanel(true);
        try {
            const cacheRes = await fetch('http://localhost:8000/api/analyze/history/cached?language=en');
            const cacheData = await cacheRes.json();
            if (cacheData.cached && cacheData.result) {
                setAnalysisResult(cacheData.result);
                setIsAnalyzing(false);
                return;
            }

            const topMatch = parallels[0];
            const response = await fetch('http://localhost:8000/api/analyze/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_cape: currentConditions?.cape || 30,
                    top_parallel_year: topMatch?.year || 1929,
                    similarity_score: topMatch?.similarity || 90,
                    forward_return_estimate: topMatch?.forward_return_1y || -10,
                    language: 'en'
                })
            });
            const data = await response.json();
            setAnalysisResult(data);
        } catch (error) {
            console.error('Analysis failed:', error);
            setAnalysisResult({
                topic: 'history',
                timestamp: new Date().toISOString(),
                perspectives: [
                    { persona: 'kostolany', analysis: 'Unable to connect to AI service. Please try again.' },
                    { persona: 'buffett', analysis: 'Analysis service is currently unavailable.' },
                    { persona: 'munger', analysis: 'Check your network connection and backend status.' },
                    { persona: 'dalio', analysis: 'The system will retry automatically when available.' }
                ]
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSentimentColor = (returns: number) => {
        if (returns > 10) return 'text-green-400';
        if (returns > 0) return 'text-blue-400';
        if (returns > -10) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getForwardReturn = (crisis: CrisisScenario) => {
        return crisis.forward_return_12m ?? crisis.forward_return_24m ?? null;
    };

    if (error) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 mb-4">{error}</div>
                    <button
                        onClick={fetchHistoricalData}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
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
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-3">
                                <span className="text-amber-500">📜 HISTORICAL_PATTERNS</span>
                                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                                    2500+ YEARS
                                </span>
                            </h1>
                            <p className="text-sm text-gray-400 mt-2">
                                Learn from market history - From ancient Rome to modern Wall Street
                            </p>
                        </div>

                        {/* Era Selector */}
                        <div className="flex items-center gap-1 bg-[#111116] border border-[#27272a] rounded-lg p-1">
                            <button
                                onClick={() => setSelectedEra('all')}
                                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                                    selectedEra === 'all'
                                        ? 'bg-amber-500 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                All Eras
                            </button>
                            {(['ancient', 'medieval', 'early_modern', 'modern'] as const).map((era) => {
                                const eraInfo = eras.find(e => e.key === era);
                                return (
                                    <button
                                        key={era}
                                        onClick={() => setSelectedEra(era)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1 ${
                                            selectedEra === era
                                                ? 'bg-amber-500 text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {getEraLabel(era).split(' ')[0]}
                                        {eraInfo && (
                                            <span className="text-[10px] opacity-70">({eraInfo.count})</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Current Conditions Summary */}
                {currentConditions && (
                    <div className="mb-6 grid grid-cols-5 gap-3">
                        <div className="bg-[#111116] border border-[#27272a] rounded p-3">
                            <div className="text-[10px] text-gray-500 uppercase">Current CAPE</div>
                            <div className="text-xl font-bold text-amber-400">{currentConditions.cape.toFixed(1)}</div>
                        </div>
                        <div className="bg-[#111116] border border-[#27272a] rounded p-3">
                            <div className="text-[10px] text-gray-500 uppercase">Interest Rate</div>
                            <div className="text-xl font-bold text-blue-400">{currentConditions.interest_rate.toFixed(2)}%</div>
                        </div>
                        <div className="bg-[#111116] border border-[#27272a] rounded p-3">
                            <div className="text-[10px] text-gray-500 uppercase">Inflation</div>
                            <div className="text-xl font-bold text-red-400">{currentConditions.inflation.toFixed(1)}%</div>
                        </div>
                        <div className="bg-[#111116] border border-[#27272a] rounded p-3">
                            <div className="text-[10px] text-gray-500 uppercase">Unemployment</div>
                            <div className="text-xl font-bold text-green-400">{currentConditions.unemployment.toFixed(1)}%</div>
                        </div>
                        <div className="bg-[#111116] border border-[#27272a] rounded p-3">
                            <div className="text-[10px] text-gray-500 uppercase">Yield Spread</div>
                            <div className={`text-xl font-bold ${currentConditions.yield_spread >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {currentConditions.yield_spread >= 0 ? '+' : ''}{currentConditions.yield_spread.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-gray-400">Loading historical data...</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left: Historical Crises Database */}
                        <div className="bg-[#111116] border border-[#27272a] rounded-lg p-6">
                            <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-red-500 rounded-sm"></span>
                                Major Historical Crises ({crises.length})
                            </h2>

                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {crises.map((crisis, i) => {
                                    const forwardReturn = getForwardReturn(crisis);
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedCrisis(crisis)}
                                            className={`p-4 rounded border cursor-pointer transition-all ${
                                                selectedCrisis?.year === crisis.year
                                                    ? 'bg-[#18181b] border-amber-500/50'
                                                    : 'bg-[#0a0a0f] border-[#27272a] hover:border-amber-500/30'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="font-bold text-white text-base">{crisis.name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-gray-500 font-mono">{crisis.year}</span>
                                                        {crisis.era && (
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getEraColor(crisis.era)}`}>
                                                                {getEraLabel(crisis.era)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {forwardReturn !== null && (
                                                    <div className="text-right">
                                                        <div className={`text-sm font-bold ${getSentimentColor(forwardReturn)}`}>
                                                            {forwardReturn > 0 ? '+' : ''}
                                                            {forwardReturn.toFixed(1)}%
                                                        </div>
                                                        <div className="text-[10px] text-gray-500">
                                                            {crisis.forward_return_12m !== null ? '12M' : '24M'} Return
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-xs text-gray-400 mb-2">{crisis.description}</div>

                                            {/* Lesson from history */}
                                            {crisis.lesson && (
                                                <div className="text-[10px] text-amber-400 italic bg-amber-500/5 px-2 py-1 rounded border border-amber-500/20 mb-3">
                                                    💡 {crisis.lesson}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                {crisis.peak_cape !== null && (
                                                    <div>
                                                        <div className="text-gray-500">Peak CAPE</div>
                                                        <div className="text-white font-mono">{crisis.peak_cape.toFixed(1)}</div>
                                                    </div>
                                                )}
                                                {crisis.peak_inflation !== null && (
                                                    <div>
                                                        <div className="text-gray-500">Peak Inflation</div>
                                                        <div className="text-white font-mono">{crisis.peak_inflation.toFixed(1)}%</div>
                                                    </div>
                                                )}
                                            </div>

                                            {selectedCrisis?.year === crisis.year && (
                                                <div className="mt-3 pt-3 border-t border-[#27272a]">
                                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                        {crisis.forward_return_12m !== null && (
                                                            <div>
                                                                <div className="text-gray-500">12M Forward Return</div>
                                                                <div className={`font-bold ${getSentimentColor(crisis.forward_return_12m)}`}>
                                                                    {crisis.forward_return_12m > 0 ? '+' : ''}
                                                                    {crisis.forward_return_12m.toFixed(1)}%
                                                                </div>
                                                            </div>
                                                        )}
                                                        {crisis.forward_return_24m !== null && (
                                                            <div>
                                                                <div className="text-gray-500">24M Forward Return</div>
                                                                <div className={`font-bold ${getSentimentColor(crisis.forward_return_24m)}`}>
                                                                    {crisis.forward_return_24m > 0 ? '+' : ''}
                                                                    {crisis.forward_return_24m.toFixed(1)}%
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right: Current Parallels */}
                        <div className="bg-[#111116] border border-[#27272a] rounded-lg p-6">
                            <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-blue-500 rounded-sm"></span>
                                Current Market Parallels
                            </h2>

                            <div className="mb-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded">
                                <div className="text-[10px] text-blue-400 mb-1 uppercase font-bold">Algorithm</div>
                                <div className="text-xs text-gray-300">
                                    Finds historical periods most similar to today based on CAPE, rates, inflation, and unemployment
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {parallels.map((match, i) => (
                                    <div
                                        key={i}
                                        className="p-4 bg-[#0a0a0f] border border-[#27272a] rounded hover:border-blue-500/30 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="font-bold text-white">{match.period_name}</div>
                                                <div className="text-[10px] text-gray-500">{match.date}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="text-[10px] text-blue-400 font-mono">
                                                        {match.similarity.toFixed(1)}% Match
                                                    </div>
                                                    <div className="w-20 h-1 bg-[#27272a] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500"
                                                            style={{ width: `${match.similarity}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {match.forward_return_3y !== null && (
                                                <div className="text-right">
                                                    <div className={`text-sm font-bold ${getSentimentColor(match.forward_return_3y)}`}>
                                                        {match.forward_return_3y > 0 ? '+' : ''}
                                                        {match.forward_return_3y.toFixed(1)}%
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">3Y After</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-xs text-gray-400 mb-3">{match.description}</div>

                                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                                            <div>
                                                <div className="text-gray-500">CAPE</div>
                                                <div className="text-white font-mono">{match.cape.toFixed(1)}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Rate</div>
                                                <div className="text-white font-mono">{match.interest_rate.toFixed(1)}%</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Inflation</div>
                                                <div className="text-white font-mono">{match.inflation.toFixed(1)}%</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {parallels.length === 0 && (
                                <div className="text-center text-gray-500 py-12">
                                    No close historical parallels found for current conditions
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* S&P 500 Chart with Crisis Overlay */}
                <div className="mt-6 bg-[#111116] border border-[#27272a] rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-4 bg-amber-500 rounded-sm"></span>
                            S&P 500 Historical Chart with Crisis Events
                        </h2>
                        <div className="flex items-center gap-4 text-[10px]">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-red-500/30 border border-red-500"></span>
                                <span className="text-gray-400">Crisis Periods</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-0.5 bg-amber-500"></span>
                                <span className="text-gray-400">S&P 500 Index</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sp500Data}>
                                <defs>
                                    <linearGradient id="sp500Gradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="year"
                                    stroke="#52525b"
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(year) => year.toString()}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    tick={{ fontSize: 10 }}
                                    scale="log"
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: '1px solid #27272a',
                                        borderRadius: '8px',
                                    }}
                                    labelStyle={{ color: '#a1a1aa' }}
                                    formatter={(value: number) => [value.toFixed(1), 'S&P 500']}
                                    labelFormatter={(year) => `Year: ${year}`}
                                />

                                {/* Crisis Reference Areas */}
                                {crises.map((crisis, i) => {
                                    const year = parseInt(crisis.year);
                                    // Mark crisis period (2-year window)
                                    return (
                                        <ReferenceArea
                                            key={i}
                                            x1={year}
                                            x2={year + 2}
                                            fill="#ef4444"
                                            fillOpacity={0.15}
                                            stroke="#ef4444"
                                            strokeOpacity={0.3}
                                        />
                                    );
                                })}

                                {/* Crisis Labels with Drawdown */}
                                {crises.slice(0, 8).map((crisis, i) => {
                                    const year = parseInt(crisis.year);
                                    const drawdown = crisis.peak_drawdown || (crisis.forward_return_12m && crisis.forward_return_12m < 0 ? Math.abs(crisis.forward_return_12m) : 30);
                                    return (
                                        <ReferenceLine
                                            key={`line-${i}`}
                                            x={year}
                                            stroke="#ef4444"
                                            strokeDasharray="3 3"
                                            label={{
                                                value: `${crisis.name.split(' ')[0]} -${drawdown.toFixed(0)}%`,
                                                position: 'top',
                                                fill: '#ef4444',
                                                fontSize: 9,
                                            }}
                                        />
                                    );
                                })}

                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    fill="url(#sp500Gradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Crisis Quick Stats */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {crises.slice(0, 4).map((crisis, i) => {
                            const drawdown = crisis.peak_drawdown || (crisis.forward_return_12m && crisis.forward_return_12m < 0 ? Math.abs(crisis.forward_return_12m) : 30);
                            const recovery = crisis.recovery_months || Math.round(drawdown * 1.5);
                            return (
                                <div
                                    key={i}
                                    onClick={() => { setSelectedCrisis(crisis); setShowFactorComparison(true); }}
                                    className="p-3 bg-[#0a0a0f] border border-[#27272a] rounded cursor-pointer hover:border-amber-500/30 transition-colors"
                                >
                                    <div className="text-xs font-bold text-white truncate">{crisis.name}</div>
                                    <div className="text-[10px] text-gray-500">{crisis.year}</div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div>
                                            <div className="text-[10px] text-gray-500">Drawdown</div>
                                            <div className="text-sm font-bold text-red-400">-{drawdown.toFixed(0)}%</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500">Recovery</div>
                                            <div className="text-sm font-bold text-green-400">{recovery}mo</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Factor-by-Factor Comparison Modal */}
                {showFactorComparison && selectedCrisis && currentConditions && (
                    <div className="mt-6 bg-[#111116] border border-amber-500/30 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                📊 Factor Comparison: {selectedCrisis.name} vs Today
                            </h3>
                            <button
                                onClick={() => setShowFactorComparison(false)}
                                className="text-gray-400 hover:text-white text-sm px-2 py-1 bg-white/5 rounded"
                            >
                                ✕ Close
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {/* CAPE Comparison */}
                            <div className="p-4 bg-[#0a0a0f] border border-[#27272a] rounded">
                                <div className="text-[10px] text-gray-500 uppercase mb-2">CAPE Ratio</div>
                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <div className="text-[10px] text-amber-400">Then</div>
                                        <div className="text-lg font-bold text-amber-400">
                                            {selectedCrisis.peak_cape?.toFixed(1) || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="text-gray-600">vs</div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-blue-400">Now</div>
                                        <div className="text-lg font-bold text-blue-400">
                                            {currentConditions.cape.toFixed(1)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Inflation Comparison */}
                            <div className="p-4 bg-[#0a0a0f] border border-[#27272a] rounded">
                                <div className="text-[10px] text-gray-500 uppercase mb-2">Inflation</div>
                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <div className="text-[10px] text-amber-400">Then</div>
                                        <div className="text-lg font-bold text-amber-400">
                                            {selectedCrisis.peak_inflation?.toFixed(1) || 'N/A'}%
                                        </div>
                                    </div>
                                    <div className="text-gray-600">vs</div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-blue-400">Now</div>
                                        <div className="text-lg font-bold text-blue-400">
                                            {currentConditions.inflation.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Interest Rate */}
                            <div className="p-4 bg-[#0a0a0f] border border-[#27272a] rounded">
                                <div className="text-[10px] text-gray-500 uppercase mb-2">Interest Rate</div>
                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <div className="text-[10px] text-amber-400">Then</div>
                                        <div className="text-lg font-bold text-amber-400">
                                            {parallels.find(p => p.year === parseInt(selectedCrisis.year))?.interest_rate.toFixed(1) || '?'}%
                                        </div>
                                    </div>
                                    <div className="text-gray-600">vs</div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-blue-400">Now</div>
                                        <div className="text-lg font-bold text-blue-400">
                                            {currentConditions.interest_rate.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Unemployment */}
                            <div className="p-4 bg-[#0a0a0f] border border-[#27272a] rounded">
                                <div className="text-[10px] text-gray-500 uppercase mb-2">Unemployment</div>
                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <div className="text-[10px] text-amber-400">Peak</div>
                                        <div className="text-lg font-bold text-amber-400">
                                            {parseInt(selectedCrisis.year) < 1950 ? '25%' : parseInt(selectedCrisis.year) < 2000 ? '10%' : '14%'}
                                        </div>
                                    </div>
                                    <div className="text-gray-600">vs</div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-blue-400">Now</div>
                                        <div className="text-lg font-bold text-blue-400">
                                            {currentConditions.unemployment.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Yield Spread */}
                            <div className="p-4 bg-[#0a0a0f] border border-[#27272a] rounded">
                                <div className="text-[10px] text-gray-500 uppercase mb-2">Yield Curve</div>
                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <div className="text-[10px] text-amber-400">Then</div>
                                        <div className="text-lg font-bold text-amber-400">
                                            {parseInt(selectedCrisis.year) > 1970 ? 'Inverted' : 'Normal'}
                                        </div>
                                    </div>
                                    <div className="text-gray-600">vs</div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-blue-400">Now</div>
                                        <div className={`text-lg font-bold ${currentConditions.yield_spread < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                            {currentConditions.yield_spread < 0 ? 'Inverted' : 'Normal'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Similarity Explanation */}
                        <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded">
                            <div className="text-xs text-gray-300">
                                <strong className="text-amber-400">Similarity Analysis:</strong>{' '}
                                {(() => {
                                    const match = parallels.find(p => p.period_name.includes(selectedCrisis.year) || p.year === parseInt(selectedCrisis.year));
                                    if (match) {
                                        return `${match.similarity.toFixed(1)}% match based on CAPE, rates, inflation, and employment. ${match.description}`;
                                    }
                                    return `This crisis period shares structural similarities with current conditions in terms of valuation (CAPE), monetary policy stance, and inflation dynamics.`;
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Analysis Trigger Button */}
                <div className="mt-6 flex justify-center">
                    <AnalysisTriggerButton
                        onAnalyze={handleAnalyze}
                        isAnalyzing={isAnalyzing}
                        isDisabled={loading || crises.length === 0}
                        buttonText="Analyze Historical Patterns"
                        subText="Get AI insights on historical market parallels"
                    />
                </div>

                {/* Data Sources Disclosure */}
                <div className="mt-8 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <h4 className="text-sm font-semibold text-blue-400 mb-2">📊 Data Sources</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                        <li>• <strong>Historical crisis events:</strong> Robert Shiller (Yale), NBER recession dating, Federal Reserve archives</li>
                        <li>• <strong>Forward returns:</strong> Curated from historical market records (S&P 500)</li>
                        <li>• <strong>Similarity matching:</strong> Real-time calculation using current market metrics</li>
                        <li>• <strong>Metrics used:</strong> CAPE ratio, interest rates, inflation, unemployment, yield spread</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2 italic">
                        Note: This is reference data for educational purposes. Past performance does not guarantee future results.
                    </p>
                </div>
            </div>

            {/* Analysis Panel */}
            <AnalysisPanel
                isOpen={showPanel}
                onClose={() => setShowPanel(false)}
                result={analysisResult}
                isLoading={isAnalyzing}
                topic="Historical Pattern Analysis"
            />
        </main>
    );
}
