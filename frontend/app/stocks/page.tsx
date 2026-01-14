"use client";

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';

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

export default function StocksPage() {
    const [stockData, setStockData] = useState<StockData | null>(null);
    const [loading, setLoading] = useState(true);

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
        } catch (error) {
            console.error('Failed to fetch stock data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-gray-400">Loading stock data...</div>
            </main>
        );
    }

    return (
        <main className="h-screen w-screen bg-[#050505] text-white overflow-hidden flex flex-col">
            <Navigation />

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {/* VIX Fear Gauge */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xs text-gray-500 uppercase font-bold mb-1">VIX Fear Index</h2>
                            <div className={`text-2xl font-bold ${
                                stockData && stockData.vix.value > 30 ? 'text-red-400' :
                                stockData && stockData.vix.value > 20 ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                                {stockData?.vix.value.toFixed(2)}
                            </div>
                        </div>
                        <div className="text-xs text-gray-400">
                            {stockData?.vix.description || (stockData && stockData.vix.value > 30 ? '😱 High Fear' :
                             stockData && stockData.vix.value > 20 ? '⚠️ Elevated' : '😌 Low Fear')}
                        </div>
                    </div>
                </div>

                {/* Global Indices Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stockData?.indices.map((idx) => (
                        <div key={idx.symbol} className="bg-[#111116] border border-[#27272a] rounded p-4 flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                            <span className="text-xs text-gray-500 font-bold">{idx.flag} {idx.name}</span>
                            <div className="mt-2">
                                <div className="text-xl font-mono text-white">{idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <div className={`text-xs font-bold ${idx.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sector Performance */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-4">
                    <h2 className="text-sm font-bold text-gray-300 mb-4">SECTOR PERFORMANCE</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {stockData?.sectors.map((sec) => (
                            <div
                                key={sec.sector}
                                className={`
                                    p-3 rounded border transition-all cursor-pointer hover:scale-105
                                    ${sec.change > 0
                                        ? 'bg-emerald-600/10 border-emerald-500/30'
                                        : 'bg-red-600/10 border-red-500/30'
                                    }
                                `}
                            >
                                <div className="text-xs text-gray-400 mb-1">{sec.short_name}</div>
                                <div className={`text-lg font-mono font-bold ${
                                    sec.change > 0 ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                    {sec.change > 0 ? '+' : ''}{sec.change.toFixed(2)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Market Sentiment Summary */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-4">
                    <h2 className="text-sm font-bold text-gray-300 mb-3">MARKET SENTIMENT</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                            <div className="text-[10px] text-gray-500 uppercase mb-1">Advancing Sectors</div>
                            <div className="text-2xl font-bold text-green-400">
                                {stockData?.sectors.filter(s => s.change > 0).length || 0}
                            </div>
                        </div>
                        <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                            <div className="text-[10px] text-gray-500 uppercase mb-1">Declining Sectors</div>
                            <div className="text-2xl font-bold text-red-400">
                                {stockData?.sectors.filter(s => s.change < 0).length || 0}
                            </div>
                        </div>
                        <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                            <div className="text-[10px] text-gray-500 uppercase mb-1">Average Change</div>
                            <div className={`text-2xl font-bold ${
                                stockData && stockData.sectors.reduce((sum, s) => sum + s.change, 0) / stockData.sectors.length >= 0
                                    ? 'text-green-400' : 'text-red-400'
                            }`}>
                                {stockData && (stockData.sectors.reduce((sum, s) => sum + s.change, 0) / stockData.sectors.length).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Market Breadth */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-4">
                    <h2 className="text-sm font-bold text-gray-300 mb-3">MARKET BREADTH</h2>
                    <div className="space-y-2">
                        {stockData?.indices.slice(0, 4).map((idx) => (
                            <div key={idx.symbol} className="flex items-center justify-between p-2 bg-[#0a0a0f] rounded">
                                <span className="text-sm text-gray-300">{idx.flag} {idx.name}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-[#27272a] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${idx.change >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                            style={{ width: `${Math.min(Math.abs(idx.change) * 20, 100)}%` }}
                                        />
                                    </div>
                                    <span className={`text-sm font-mono w-16 text-right ${
                                        idx.change >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
