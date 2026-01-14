"use client";

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';

interface Commodity {
    name: string;
    symbol: string;
    price: number;
    change_pct: number;
    unit: string;
}

interface PMIData {
    country: string;
    manufacturing: number;
    services: number;
}

interface EconomyData {
    commodities: Commodity[];
    pmi_data: PMIData[];
    upcoming_events: any[];
}

export default function EconomyPage() {
    const [economyData, setEconomyData] = useState<EconomyData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEconomyData();
    }, []);

    const fetchEconomyData = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/economy/data');
            const data = await response.json();
            setEconomyData(data);
        } catch (error) {
            console.error('Failed to fetch economy data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-gray-400">Loading economy data...</div>
            </main>
        );
    }

    return (
        <main className="h-screen w-screen bg-[#050505] text-white overflow-hidden flex flex-col">
            <Navigation />

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-end border-b border-[#27272a] pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">REAL ECONOMY INDICATORS</h1>
                        <p className="text-sm text-gray-500">Commodities, PMI, and Economic Data</p>
                    </div>
                </div>

                {/* Commodities Grid */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-4">
                    <h2 className="text-sm font-bold text-gray-300 mb-4">COMMODITY PRICES</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {economyData?.commodities.map((commodity) => (
                            <div key={commodity.symbol} className="p-4 bg-[#0a0a0f] rounded border border-[#27272a] hover:border-amber-500/30 transition-colors">
                                <div className="text-xs text-gray-500 mb-1">{commodity.name}</div>
                                <div className="text-xl font-mono text-white font-bold">
                                    ${commodity.price.toFixed(2)}
                                </div>
                                <div className="text-[10px] text-gray-500 mb-2">{commodity.unit}</div>
                                <div className={`text-sm font-bold ${commodity.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {commodity.change_pct >= 0 ? '▲' : '▼'} {Math.abs(commodity.change_pct).toFixed(2)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PMI Data */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-4">
                    <h2 className="text-sm font-bold text-gray-300 mb-4">PURCHASING MANAGERS INDEX (PMI)</h2>
                    <div className="text-xs text-gray-400 mb-3">Above 50 = Expansion, Below 50 = Contraction</div>
                    <div className="space-y-3">
                        {economyData?.pmi_data.map((pmi) => (
                            <div key={pmi.country} className="p-4 bg-[#0a0a0f] rounded border border-[#27272a]">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-bold text-white">{pmi.country}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase mb-1">Manufacturing</div>
                                        <div className="flex items-center gap-2">
                                            <div className={`text-2xl font-mono font-bold ${pmi.manufacturing >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                                {pmi.manufacturing.toFixed(1)}
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${pmi.manufacturing >= 50 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {pmi.manufacturing >= 50 ? '📈 Expansion' : '📉 Contraction'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase mb-1">Services</div>
                                        <div className="flex items-center gap-2">
                                            <div className={`text-2xl font-mono font-bold ${pmi.services >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                                {pmi.services.toFixed(1)}
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${pmi.services >= 50 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {pmi.services >= 50 ? '📈 Expansion' : '📉 Contraction'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Economic Calendar */}
                {economyData?.upcoming_events && economyData.upcoming_events.length > 0 && (
                    <div className="bg-[#111116] border border-[#27272a] rounded p-4">
                        <h2 className="text-sm font-bold text-gray-300 mb-4">UPCOMING ECONOMIC EVENTS</h2>
                        <div className="space-y-2">
                            {economyData.upcoming_events.slice(0, 5).map((event, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                                    <div>
                                        <div className="text-sm text-white font-medium">{event.event}</div>
                                        <div className="text-xs text-gray-500">{event.country}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400">{event.date}</div>
                                        <div className={`text-xs px-2 py-1 rounded ${
                                            event.importance === 'high' ? 'bg-red-500/10 text-red-400' :
                                            event.importance === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                            'bg-gray-500/10 text-gray-400'
                                        }`}>
                                            {event.importance}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Commodity Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">Energy Complex</div>
                        <div className="text-xl font-bold text-amber-400">
                            {economyData?.commodities
                                .filter(c => c.name.includes('Oil') || c.name.includes('Gas'))
                                .reduce((sum, c) => sum + c.change_pct, 0)
                                .toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Average Change</div>
                    </div>
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">Precious Metals</div>
                        <div className="text-xl font-bold text-yellow-400">
                            {economyData?.commodities
                                .filter(c => c.name.includes('Gold') || c.name.includes('Silver'))
                                .reduce((sum, c) => sum + c.change_pct, 0)
                                .toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Average Change</div>
                    </div>
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">Industrial Metals</div>
                        <div className="text-xl font-bold text-blue-400">
                            {economyData?.commodities
                                .filter(c => c.name.includes('Copper'))
                                .reduce((sum, c) => sum + c.change_pct, 0)
                                .toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Average Change</div>
                    </div>
                </div>
            </div>
        </main>
    );
}
