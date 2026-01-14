"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import Navigation from '@/components/Navigation';
import { AnalysisTriggerButton, AnalysisPanel, AnalysisResult } from '@/components/ui';
import GlobalYieldComparison from '@/components/bonds/GlobalYieldComparison';
import YieldSpreadMatrix from '@/components/bonds/YieldSpreadMatrix';
import GlobalCurveComparison from '@/components/bonds/GlobalCurveComparison';
import SovereignRiskIndicator from '@/components/bonds/SovereignRiskIndicator';

// Dynamic import for heavy chart components
const LineChart = dynamic(
    () => import('recharts').then(mod => mod.LineChart),
    { ssr: false }
);
const Line = dynamic(
    () => import('recharts').then(mod => mod.Line),
    { ssr: false }
);

interface YieldCurveData {
    maturity: string;
    current?: number;
    previous?: number;
}

interface GlobalBondYield {
    country: string;
    country_code: string;
    flag: string;
    yield_10y: number;
    change_24h: number;
    spread_vs_us: number;
    trend: string;
}

interface YieldDataPoint {
    maturity: string;
    yield_value: number;
    date: string;
}

interface BondYieldsResponse {
    current_curve?: {
        date: string;
        data: YieldDataPoint[];
    };
    previous_curve?: {
        date: string;
        data: YieldDataPoint[];
    };
}

interface GlobalBondDataResponse {
    global_bonds?: GlobalBondYield[];
    us_yield_10y?: number;
}

type CompareOption = 'none' | '1m' | '3m' | '1y';
type TabOption = 'us' | 'global' | 'curves' | 'risk';

export default function BondsPage() {
    const [yieldData, setYieldData] = useState<YieldCurveData[]>([]);
    const [globalYields, setGlobalYields] = useState<GlobalBondYield[]>([]);
    const [loading, setLoading] = useState(true);
    const [spreadValue, setSpreadValue] = useState<number | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [showPanel, setShowPanel] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showComparison, setShowComparison] = useState<CompareOption>('1m');
    const [currentDate, setCurrentDate] = useState<string>('');
    const [previousDate, setPreviousDate] = useState<string>('');
    const [currentYield10Y, setCurrentYield10Y] = useState<number>(0);
    const [currentYield2Y, setCurrentYield2Y] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<TabOption>('us');

    useEffect(() => {
        fetchBondData();
    }, []);

    const fetchBondData = async () => {
        try {
            setLoading(true);
            const [yieldsRes, globalRes] = await Promise.all([
                fetch('http://localhost:8000/api/bonds/yields'),
                fetch('http://localhost:8000/api/bonds/global')
            ]);

            const yieldsData: BondYieldsResponse = await yieldsRes.json();
            const globalData: GlobalBondDataResponse = await globalRes.json();

            const currentPoints = yieldsData.current_curve?.data ?? [];
            const previousPoints = yieldsData.previous_curve?.data ?? [];

            setCurrentDate(yieldsData.current_curve?.date || '');
            setPreviousDate(yieldsData.previous_curve?.date || '');

            // Merge current and previous data
            const mergedData: YieldCurveData[] = currentPoints.map((point) => {
                const prevPoint = previousPoints.find(p => p.maturity === point.maturity);
                return {
                    maturity: point.maturity,
                    current: point.yield_value,
                    previous: prevPoint?.yield_value,
                };
            });
            setYieldData(mergedData);

            // Calculate 10Y-2Y spread
            const y10Item = currentPoints.find((d) => d.maturity === "10Y");
            const y2Item = currentPoints.find((d) => d.maturity === "2Y");
            if (y10Item && y2Item) {
                setSpreadValue((y10Item.yield_value - y2Item.yield_value) * 100);
                setCurrentYield10Y(y10Item.yield_value);
                setCurrentYield2Y(y2Item.yield_value);
            } else {
                setSpreadValue(null);
            }

            setGlobalYields(globalData.global_bonds ?? []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch bond data:', err);
            setError('Failed to connect to backend. Please ensure the server is running on port 8000.');
        } finally {
            setLoading(false);
        }
    };

    const getSpreadColor = (spread: number): string => {
        if (spread < 0) return 'text-red-400';
        if (spread < 50) return 'text-amber-400';
        return 'text-green-400';
    };

    const getSpreadBgColor = (spread: number): string => {
        if (spread < 0) return 'bg-red-500';
        if (spread < 50) return 'bg-amber-500';
        return 'bg-green-500';
    };

    const getSpreadStatus = (spread: number): { label: string; icon: string; description: string } => {
        if (spread < 0) {
            return {
                label: 'INVERTED',
                icon: '🚨',
                description: 'Inverted yield curve - historically precedes recessions within 12-18 months'
            };
        }
        if (spread < 50) {
            return {
                label: 'FLATTENING',
                icon: '⚠️',
                description: 'Yield curve flattening - economic slowdown risk increasing'
            };
        }
        return {
            label: 'NORMAL',
            icon: '✅',
            description: 'Normal yield curve - indicates healthy economic expansion'
        };
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setShowPanel(true);
        try {
            // Check cache first
            const cacheRes = await fetch('http://localhost:8000/api/analyze/bonds/cached?language=en');
            const cacheData = await cacheRes.json();
            if (cacheData.cached && cacheData.result) {
                setAnalysisResult(cacheData.result);
                setIsAnalyzing(false);
                return;
            }

            // If no cache, request new analysis
            const response = await fetch('http://localhost:8000/api/analyze/bonds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    yield_2y: currentYield2Y || 4.5,
                    yield_10y: currentYield10Y || 4.2,
                    spread: spreadValue || 0,
                    is_inverted: (spreadValue || 0) < 0,
                    language: 'en'
                })
            });
            const data = await response.json();
            setAnalysisResult(data);
        } catch (error) {
            console.error('Analysis failed:', error);
            setAnalysisResult({
                topic: 'bonds',
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

    if (loading) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-gray-400">Loading bond data...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 mb-4">{error}</div>
                    <button
                        onClick={fetchBondData}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen w-screen bg-[#050505] text-white overflow-x-hidden flex flex-col">
            <Navigation />

            {/* Tab Navigation */}
            <div className="pt-20 px-3 sm:px-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#27272a]">
                    <button
                        onClick={() => setActiveTab('us')}
                        className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-t transition-colors whitespace-nowrap ${
                            activeTab === 'us'
                                ? 'bg-[#111116] text-white border border-[#27272a] border-b-[#111116]'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        US Treasury
                    </button>
                    <button
                        onClick={() => setActiveTab('global')}
                        className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-t transition-colors whitespace-nowrap ${
                            activeTab === 'global'
                                ? 'bg-[#111116] text-white border border-[#27272a] border-b-[#111116]'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Global Yields
                    </button>
                    <button
                        onClick={() => setActiveTab('curves')}
                        className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-t transition-colors whitespace-nowrap ${
                            activeTab === 'curves'
                                ? 'bg-[#111116] text-white border border-[#27272a] border-b-[#111116]'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Curve Comparison
                    </button>
                    <button
                        onClick={() => setActiveTab('risk')}
                        className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-t transition-colors whitespace-nowrap ${
                            activeTab === 'risk'
                                ? 'bg-[#111116] text-white border border-[#27272a] border-b-[#111116]'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Credit Risk
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
                {/* US Treasury Tab */}
                {activeTab === 'us' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Main Yield Curve Chart - Responsive height */}
                <div className="col-span-1 lg:col-span-2 bg-[#111116] border border-[#27272a] rounded p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 sm:mb-4">
                        <div>
                            <h2 className="text-xs sm:text-sm font-bold text-gray-300 flex items-center gap-2">
                                <span>US TREASURY YIELD CURVE</span>
                                <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20">LIVE</span>
                            </h2>
                            <p className="text-[10px] text-gray-500 mt-1">
                                Current: {currentDate} {showComparison !== 'none' && previousDate && `| Compare: ${previousDate}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">Compare:</span>
                            <select
                                value={showComparison}
                                onChange={(e) => setShowComparison(e.target.value as CompareOption)}
                                className="bg-[#0a0a0f] border border-[#27272a] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
                            >
                                <option value="none">None</option>
                                <option value="1m">1 Month Ago</option>
                                <option value="3m">3 Months Ago</option>
                                <option value="1y">1 Year Ago</option>
                            </select>
                        </div>
                    </div>
                    <div className="h-[250px] sm:h-[300px] md:h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={yieldData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis
                                    dataKey="maturity"
                                    stroke="#52525b"
                                    tick={{ fontSize: 10 }}
                                    tickLine={{ stroke: '#27272a' }}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    tick={{ fontSize: 10 }}
                                    domain={['auto', 'auto']}
                                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                                    tickLine={{ stroke: '#27272a' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '12px' }}
                                    itemStyle={{ color: '#e4e4e7' }}
                                    formatter={(value) => typeof value === 'number' ? [`${value.toFixed(2)}%`, ''] : ['', '']}
                                    labelFormatter={(label) => `Maturity: ${label}`}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="current"
                                    name={`Current (${currentDate})`}
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: '#22c55e' }}
                                    activeDot={{ r: 6 }}
                                />
                                {showComparison !== 'none' && (
                                    <Line
                                        type="monotone"
                                        dataKey="previous"
                                        name={`Previous (${previousDate})`}
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        strokeOpacity={0.7}
                                        dot={{ r: 3, fill: '#6366f1' }}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Maturity Labels Legend */}
                    <div className="mt-3 flex flex-wrap gap-2 justify-center text-[9px] text-gray-500">
                        <span className="px-2 py-0.5 bg-[#0a0a0f] rounded">1M = 1 Month</span>
                        <span className="px-2 py-0.5 bg-[#0a0a0f] rounded">3M = 3 Months</span>
                        <span className="px-2 py-0.5 bg-[#0a0a0f] rounded">6M = 6 Months</span>
                        <span className="px-2 py-0.5 bg-[#0a0a0f] rounded">1Y-30Y = Years</span>
                    </div>
                </div>

                {/* Spread Monitor - Enhanced with Color Coding */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-3 sm:p-4">
                    <h2 className="text-xs sm:text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                        US 10Y-2Y SPREAD GAUGE
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                            Recession Indicator
                        </span>
                    </h2>
                    {spreadValue !== null && (
                        <>
                            {/* Main Value Display */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`text-2xl sm:text-3xl font-bold ${getSpreadColor(spreadValue)}`}>
                                    {spreadValue >= 0 ? '+' : ''}{spreadValue.toFixed(0)}
                                    <span className="text-sm font-normal ml-1">bps</span>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    spreadValue < 0 ? 'bg-red-500/20 text-red-400' :
                                    spreadValue < 50 ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-green-500/20 text-green-400'
                                }`}>
                                    {getSpreadStatus(spreadValue).label}
                                </div>
                            </div>

                            {/* Visual Gauge */}
                            <div className="mb-4">
                                <div className="relative h-3 bg-[#0a0a0f] rounded-full overflow-hidden">
                                    {/* Gauge Background Gradient */}
                                    <div className="absolute inset-0 flex">
                                        <div className="flex-1 bg-red-500/30"></div>
                                        <div className="flex-1 bg-amber-500/30"></div>
                                        <div className="flex-1 bg-green-500/30"></div>
                                    </div>
                                    {/* Marker */}
                                    <div
                                        className={`absolute top-0 w-1 h-full ${getSpreadBgColor(spreadValue)} shadow-lg`}
                                        style={{
                                            left: `${Math.min(Math.max((spreadValue + 100) / 3, 0), 100)}%`,
                                            transform: 'translateX(-50%)'
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                                    <span>-100 bps (Inverted)</span>
                                    <span>0 bps</span>
                                    <span>+200 bps (Steep)</span>
                                </div>
                            </div>

                            {/* Yield Details */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="p-2 bg-[#0a0a0f] rounded border border-[#27272a]">
                                    <div className="text-[10px] text-gray-500">10Y Yield</div>
                                    <div className="text-sm font-bold text-emerald-400">{currentYield10Y.toFixed(2)}%</div>
                                </div>
                                <div className="p-2 bg-[#0a0a0f] rounded border border-[#27272a]">
                                    <div className="text-[10px] text-gray-500">2Y Yield</div>
                                    <div className="text-sm font-bold text-blue-400">{currentYield2Y.toFixed(2)}%</div>
                                </div>
                            </div>

                            {/* Status Description */}
                            <div className={`text-[10px] sm:text-xs p-2 sm:p-3 rounded border ${
                                spreadValue < 0 ? 'bg-red-500/5 border-red-500/20 text-red-300' :
                                spreadValue < 50 ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' :
                                'bg-green-500/5 border-green-500/20 text-green-300'
                            }`}>
                                {getSpreadStatus(spreadValue).icon} {getSpreadStatus(spreadValue).description}
                            </div>
                        </>
                    )}
                </div>

                {/* Key Rates Table */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-3 sm:p-4 overflow-auto">
                    <h2 className="text-xs sm:text-sm font-bold text-gray-300 mb-3 sm:mb-4">GLOBAL BENCHMARK RATES</h2>
                    <table className="w-full text-xs text-left">
                        <thead>
                            <tr className="text-gray-500 border-b border-[#27272a]">
                                <th className="py-2">Country</th>
                                <th className="py-2 text-right">10Y Yield</th>
                                <th className="py-2 text-right">Change</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300 font-mono">
                            {globalYields.map((bond, i) => (
                                <tr key={i} className="border-b border-[#27272a]/50 hover:bg-[#27272a]">
                                    <td className="py-2">{bond.country}</td>
                                    <td className="py-2 text-right text-emerald-400">{bond.yield_10y.toFixed(2)}%</td>
                                    <td className={`py-2 text-right ${bond.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {bond.change_24h >= 0 ? '+' : ''}{bond.change_24h.toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* AI Analysis Trigger Button */}
                <div className="col-span-1 lg:col-span-2 flex justify-center py-6">
                    <AnalysisTriggerButton
                        onAnalyze={handleAnalyze}
                        isAnalyzing={isAnalyzing}
                        isDisabled={loading}
                        buttonText="Analyze Bond Market"
                        subText="Get AI insights on yield curves and rate trends"
                    />
                </div>
                </div>
                )}

                {/* Global Yields Tab */}
                {activeTab === 'global' && (
                <div className="space-y-4">
                    <GlobalYieldComparison />
                    <YieldSpreadMatrix />
                </div>
                )}

                {/* Curve Comparison Tab */}
                {activeTab === 'curves' && (
                <div className="space-y-4">
                    <GlobalCurveComparison />
                </div>
                )}

                {/* Credit Risk Tab */}
                {activeTab === 'risk' && (
                <div className="space-y-4">
                    <SovereignRiskIndicator />
                </div>
                )}
            </div>

            {/* Analysis Panel */}
            <AnalysisPanel
                isOpen={showPanel}
                onClose={() => setShowPanel(false)}
                result={analysisResult}
                isLoading={isAnalyzing}
                topic="Bond Market Analysis"
            />
        </main>
    );
}
