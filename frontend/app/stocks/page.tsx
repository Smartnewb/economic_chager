"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ResponsiveContainer, Tooltip } from 'recharts';
import Navigation from '@/components/Navigation';
import { AnalysisTriggerButton, AnalysisPanel, AnalysisResult } from '@/components/ui';

// Dynamic import for heavy Treemap component
const Treemap = dynamic(
    () => import('recharts').then(mod => mod.Treemap),
    { ssr: false }
);

interface StockIndex {
    symbol: string;
    name: string;
    country: string;
    region: string;
    flag: string;
    price: number;
    change: number;
    change_value: number;
    market_cap: number;
}

interface Sector {
    sector: string;
    short_name: string;
    change: number;
    market_cap: number;
    top_stock: string;
    top_stock_change: number;
}

interface VIXData {
    value: number;
    change: number;
    level: string;
    description: string;
}

interface StockData {
    indices: StockIndex[];
    sectors: Sector[];
    vix: VIXData;
}

interface TreemapDataItem {
    name: string;
    size: number;
    change: number;
    fill: string;
}

const getChangeColor = (change: number): string => {
    if (change > 2) return '#22c55e';
    if (change > 1) return '#4ade80';
    if (change > 0) return '#86efac';
    if (change > -1) return '#fca5a5';
    if (change > -2) return '#f87171';
    return '#ef4444';
};

const CustomTreemapContent = (props: {
    root?: { children?: TreemapDataItem[] };
    depth?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    index?: number;
    name?: string;
    size?: number;
    change?: number;
    fill?: string;
}) => {
    const { depth, x = 0, y = 0, width = 0, height = 0, name, change, fill } = props;

    if (depth !== 1 || width < 40 || height < 30) return null;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: fill || '#333',
                    stroke: '#0a0a0f',
                    strokeWidth: 2,
                    strokeOpacity: 1,
                }}
            />
            <text
                x={x + width / 2}
                y={y + height / 2 - 6}
                textAnchor="middle"
                fill="#fff"
                fontSize={width > 80 ? 11 : 9}
                fontWeight="bold"
            >
                {name}
            </text>
            <text
                x={x + width / 2}
                y={y + height / 2 + 10}
                textAnchor="middle"
                fill={change !== undefined && change >= 0 ? '#86efac' : '#fca5a5'}
                fontSize={width > 80 ? 12 : 10}
                fontWeight="bold"
            >
                {change !== undefined ? (change >= 0 ? '+' : '') + change.toFixed(2) + '%' : ''}
            </text>
        </g>
    );
};

export default function StocksPage() {
    const router = useRouter();
    const [stockData, setStockData] = useState<StockData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [showPanel, setShowPanel] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStockClick = (symbol: string) => {
        // Clean up symbol for navigation (remove ^, ., etc.)
        const cleanSymbol = symbol.replace(/[\^\.]/g, '').toUpperCase();
        router.push(`/stocks/${cleanSymbol}`);
    };

    useEffect(() => {
        fetchStockData();
    }, []);

    const fetchStockData = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/stocks/global');
            const data = await response.json();
            setStockData({
                indices: data.global_indices || [],
                sectors: data.sectors || [],
                vix: data.vix || { value: 0, change: 0, level: 'low', description: '' }
            });
            setError(null);
        } catch (err) {
            console.error('Failed to fetch stock data:', err);
            setError('Failed to connect to backend. Please ensure the server is running on port 8000.');
        } finally {
            setLoading(false);
        }
    };

    const treemapData = useMemo(() => {
        if (!stockData?.sectors) return [];
        return stockData.sectors.map(sec => ({
            name: sec.short_name,
            size: Math.abs(sec.market_cap) || 1000,
            change: sec.change,
            fill: getChangeColor(sec.change),
        }));
    }, [stockData?.sectors]);

    const indicesTreemapData = useMemo(() => {
        if (!stockData?.indices) return [];
        return stockData.indices.map(idx => ({
            name: idx.symbol,
            size: Math.abs(idx.market_cap) || 1000,
            change: idx.change,
            fill: getChangeColor(idx.change),
        }));
    }, [stockData?.indices]);

    const getVixColor = (value: number) => {
        if (value > 30) return 'text-red-400';
        if (value > 20) return 'text-amber-400';
        if (value > 15) return 'text-yellow-400';
        return 'text-green-400';
    };

    const getVixBgColor = (value: number) => {
        if (value > 30) return 'bg-red-500';
        if (value > 20) return 'bg-amber-500';
        if (value > 15) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getVixStatus = (value: number): { label: string; icon: string; description: string } => {
        if (value > 30) return { label: 'EXTREME FEAR', icon: '🚨', description: 'Market panic - historically good buying opportunities' };
        if (value > 25) return { label: 'HIGH FEAR', icon: '😰', description: 'Elevated volatility - caution advised' };
        if (value > 20) return { label: 'MODERATE', icon: '⚠️', description: 'Above average volatility - stay alert' };
        if (value > 15) return { label: 'NORMAL', icon: '😐', description: 'Normal market conditions' };
        return { label: 'LOW FEAR', icon: '😌', description: 'Complacency - markets calm, potential for surprises' };
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setShowPanel(true);
        try {
            // Check cache first
            const cacheRes = await fetch('http://localhost:8000/api/analyze/stocks/cached?language=en');
            const cacheData = await cacheRes.json();
            if (cacheData.cached && cacheData.result) {
                setAnalysisResult(cacheData.result);
                setIsAnalyzing(false);
                return;
            }

            // If no cache, request new analysis
            const response = await fetch('http://localhost:8000/api/analyze/stocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vix_value: stockData?.vix?.value || 15,
                    vix_level: stockData?.vix?.level || 'low',
                    market_sentiment: stockData?.vix?.level === 'high' ? 'fearful' : 'neutral',
                    language: 'en'
                })
            });
            const data = await response.json();
            setAnalysisResult(data);
        } catch (error) {
            console.error('Analysis failed:', error);
            setAnalysisResult({
                topic: 'stocks',
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
                <div className="text-gray-400">Loading stock data...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 mb-4">{error}</div>
                    <button
                        onClick={fetchStockData}
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

            {/* Add pt-20 to account for fixed nav */}
            <div className="flex-1 p-3 sm:p-4 pt-20 overflow-y-auto space-y-3 sm:space-y-4">
                {/* Enhanced VIX Fear Gauge */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold mb-1 flex items-center gap-2">
                                    VIX FEAR INDEX
                                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                                        CBOE
                                    </span>
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className={`text-2xl sm:text-3xl font-bold ${getVixColor(stockData?.vix.value || 0)}`}>
                                        {stockData?.vix.value.toFixed(2)}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                        stockData && stockData.vix.value > 30 ? 'bg-red-500/20 text-red-400' :
                                        stockData && stockData.vix.value > 20 ? 'bg-amber-500/20 text-amber-400' :
                                        stockData && stockData.vix.value > 15 ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-green-500/20 text-green-400'
                                    }`}>
                                        {getVixStatus(stockData?.vix.value || 0).label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* VIX Gauge Bar */}
                        <div className="flex-1 max-w-xs">
                            <div className="relative h-3 bg-[#0a0a0f] rounded-full overflow-hidden">
                                <div className="absolute inset-0 flex">
                                    <div className="flex-1 bg-green-500/30"></div>
                                    <div className="flex-1 bg-yellow-500/30"></div>
                                    <div className="flex-1 bg-amber-500/30"></div>
                                    <div className="flex-1 bg-red-500/30"></div>
                                </div>
                                <div
                                    className={`absolute top-0 w-1.5 h-full ${getVixBgColor(stockData?.vix.value || 0)} shadow-lg rounded-full`}
                                    style={{
                                        left: `${Math.min((stockData?.vix.value || 0) / 50 * 100, 100)}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-[8px] text-gray-500 mt-1">
                                <span>0</span>
                                <span>15</span>
                                <span>25</span>
                                <span>35</span>
                                <span>50+</span>
                            </div>
                        </div>

                        <div className="text-[10px] text-gray-400 max-w-[180px]">
                            {getVixStatus(stockData?.vix.value || 0).icon} {getVixStatus(stockData?.vix.value || 0).description}
                        </div>
                    </div>
                </div>

                {/* Global Indices Treemap Heatmap */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xs sm:text-sm font-bold text-gray-300 flex items-center gap-2">
                            GLOBAL INDICES HEATMAP
                            <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">
                                Size = Market Cap
                            </span>
                        </h2>
                        <div className="flex items-center gap-2 text-[9px]">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded"></span> Bull</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded"></span> Bear</span>
                        </div>
                    </div>
                    <div className="h-[180px] sm:h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <Treemap
                                data={indicesTreemapData}
                                dataKey="size"
                                stroke="#0a0a0f"
                                content={<CustomTreemapContent />}
                            >
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload.length) return null;
                                        const data = payload[0].payload as TreemapDataItem;
                                        return (
                                            <div className="bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs">
                                                <div className="font-bold text-white">{data.name}</div>
                                                <div className={data.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                    {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                            </Treemap>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Global Indices Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                    {(stockData?.indices ?? []).map((idx) => (
                        <div
                            key={idx.symbol}
                            onClick={() => handleStockClick(idx.symbol)}
                            className="bg-[#111116] border border-[#27272a] rounded p-2.5 sm:p-4 flex flex-col justify-between hover:border-blue-500/50 transition-colors touch-manipulation active:scale-[0.98] cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] sm:text-xs text-gray-500 font-bold truncate">{idx.flag} {idx.name}</span>
                                <span className="text-[8px] text-gray-600 font-mono">{idx.symbol}</span>
                            </div>
                            <div className="mt-1.5 sm:mt-2">
                                <div className="text-base sm:text-xl font-mono text-white">{idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <div className={`text-[10px] sm:text-xs font-bold ${idx.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sector Treemap Heatmap */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xs sm:text-sm font-bold text-gray-300 flex items-center gap-2">
                            SECTOR ROTATION HEATMAP
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
                                11 GICS Sectors
                            </span>
                        </h2>
                    </div>
                    <div className="h-[200px] sm:h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <Treemap
                                data={treemapData}
                                dataKey="size"
                                stroke="#0a0a0f"
                                content={<CustomTreemapContent />}
                            >
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload.length) return null;
                                        const data = payload[0].payload as TreemapDataItem;
                                        return (
                                            <div className="bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs">
                                                <div className="font-bold text-white">{data.name}</div>
                                                <div className={data.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                    {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                            </Treemap>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sector Performance Grid */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-3 sm:p-4">
                    <h2 className="text-xs sm:text-sm font-bold text-gray-300 mb-3 sm:mb-4">SECTOR PERFORMANCE</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                        {(stockData?.sectors ?? []).map((sec) => (
                            <div
                                key={sec.sector}
                                className={`
                                    p-2 sm:p-3 rounded border transition-all cursor-pointer hover:scale-105 touch-manipulation active:scale-[0.98]
                                    ${sec.change > 0
                                        ? 'bg-emerald-600/10 border-emerald-500/30'
                                        : 'bg-red-600/10 border-red-500/30'
                                    }
                                `}
                            >
                                <div className="text-[10px] sm:text-xs text-gray-400 mb-1 truncate">{sec.short_name}</div>
                                <div className={`text-base sm:text-lg font-mono font-bold ${
                                    sec.change > 0 ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                    {sec.change > 0 ? '+' : ''}{sec.change.toFixed(2)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Market Sentiment Summary */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-3 sm:p-4">
                    <h2 className="text-xs sm:text-sm font-bold text-gray-300 mb-3">MARKET SENTIMENT</h2>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                            <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase mb-1">Advancing</div>
                            <div className="text-lg sm:text-2xl font-bold text-green-400">
                                {(stockData?.sectors ?? []).filter(s => s.change > 0).length}
                            </div>
                        </div>
                        <div className="p-2 sm:p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                            <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase mb-1">Declining</div>
                            <div className="text-lg sm:text-2xl font-bold text-red-400">
                                {(stockData?.sectors ?? []).filter(s => s.change < 0).length}
                            </div>
                        </div>
                        <div className="p-2 sm:p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                            <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase mb-1">Avg Change</div>
                            <div className={`text-lg sm:text-2xl font-bold ${
                                (stockData?.sectors?.length ? (stockData.sectors.reduce((sum, s) => sum + s.change, 0) / stockData.sectors.length) : 0) >= 0
                                    ? 'text-green-400' : 'text-red-400'
                            }`}>
                                {(stockData?.sectors?.length ? (stockData.sectors.reduce((sum, s) => sum + s.change, 0) / stockData.sectors.length) : 0).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Market Breadth */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-3 sm:p-4">
                    <h2 className="text-xs sm:text-sm font-bold text-gray-300 mb-3">MARKET BREADTH</h2>
                    <div className="space-y-2">
                        {(stockData?.indices ?? []).slice(0, 4).map((idx) => (
                            <div key={idx.symbol} className="flex items-center justify-between p-2 bg-[#0a0a0f] rounded gap-2">
                                <span className="text-xs sm:text-sm text-gray-300 truncate flex-shrink-0">{idx.flag} {idx.name}</span>
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
                                    <div className="w-16 sm:w-32 h-1.5 sm:h-2 bg-[#27272a] rounded-full overflow-hidden flex-shrink-0">
                                        <div
                                            className={`h-full ${idx.change >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                            style={{ width: `${Math.min(Math.abs(idx.change) * 20, 100)}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs sm:text-sm font-mono w-14 sm:w-16 text-right ${
                                        idx.change >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Analysis Trigger Button */}
                <div className="flex justify-center py-4 sm:py-6 pb-6 sm:pb-8">
                    <AnalysisTriggerButton
                        onAnalyze={handleAnalyze}
                        isAnalyzing={isAnalyzing}
                        isDisabled={loading || !stockData}
                        buttonText="Analyze Stock Market"
                        subText="Get AI insights on global equities and sector rotation"
                    />
                </div>
            </div>

            {/* Analysis Panel */}
            <AnalysisPanel
                isOpen={showPanel}
                onClose={() => setShowPanel(false)}
                result={analysisResult}
                isLoading={isAnalyzing}
                topic="Stock Market Analysis"
            />
        </main>
    );
}
