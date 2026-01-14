"use client";

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';

interface CrisisEvent {
    year: number;
    name: string;
    cape_shiller: number;
    interest_rate: number;
    inflation: number;
    unemployment: number;
    forward_1y_return: number;
    forward_3y_return: number;
    characteristics: string[];
}

interface ParallelMatch {
    period: string;
    similarity_score: number;
    cape_shiller: number;
    interest_rate: number;
    inflation: number;
    unemployment: number;
    forward_1y_return: number;
    forward_3y_return: number;
    explanation: string;
}

export default function HistoryPage() {
    const [crises, setCrises] = useState<CrisisEvent[]>([]);
    const [parallels, setParallels] = useState<ParallelMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCrisis, setSelectedCrisis] = useState<CrisisEvent | null>(null);

    useEffect(() => {
        fetchHistoricalData();
    }, []);

    const fetchHistoricalData = async () => {
        try {
            setLoading(true);
            const [crisesRes, parallelsRes] = await Promise.all([
                fetch('http://localhost:8000/api/history/crises'),
                fetch('http://localhost:8000/api/history/parallel')
            ]);

            const crisesData = await crisesRes.json();
            const parallelsData = await parallelsRes.json();

            setCrises(crisesData.historical_crises || []);
            setParallels(parallelsData.parallel_matches || []);
        } catch (error) {
            console.error('Failed to fetch historical data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (returns: number) => {
        if (returns > 10) return 'text-green-400';
        if (returns > 0) return 'text-blue-400';
        if (returns > -10) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <main className="h-screen w-screen bg-[#050505] text-white overflow-hidden flex flex-col">
            <Navigation />

            <div className="flex-1 overflow-auto p-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-3">
                        <span className="text-amber-500">📜 HISTORICAL_PATTERNS</span>
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                            100+ YEARS DATA
                        </span>
                    </h1>
                    <p className="text-sm text-gray-400 mt-2">
                        Learn from market history - Find periods similar to today and understand forward returns
                    </p>
                </div>

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
                                Major Historical Crises
                            </h2>

                            <div className="space-y-3">
                                {crises.map((crisis, i) => (
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
                                            <div>
                                                <div className="font-bold text-white text-base">{crisis.name}</div>
                                                <div className="text-[10px] text-gray-500 font-mono">{crisis.year}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-sm font-bold ${getSentimentColor(crisis.forward_1y_return)}`}>
                                                    {crisis.forward_1y_return > 0 ? '+' : ''}
                                                    {crisis.forward_1y_return.toFixed(1)}%
                                                </div>
                                                <div className="text-[10px] text-gray-500">1Y Forward</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 text-[10px] mt-3">
                                            <div>
                                                <div className="text-gray-500">CAPE</div>
                                                <div className="text-white font-mono">{crisis.cape_shiller.toFixed(1)}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Rate</div>
                                                <div className="text-white font-mono">{crisis.interest_rate.toFixed(1)}%</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Inflation</div>
                                                <div className="text-white font-mono">{crisis.inflation.toFixed(1)}%</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Unemp</div>
                                                <div className="text-white font-mono">{crisis.unemployment.toFixed(1)}%</div>
                                            </div>
                                        </div>

                                        {selectedCrisis?.year === crisis.year && (
                                            <div className="mt-3 pt-3 border-t border-[#27272a]">
                                                <div className="text-[10px] text-gray-400 mb-2">Key Characteristics:</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {crisis.characteristics.map((char, j) => (
                                                        <span
                                                            key={j}
                                                            className="text-[9px] px-2 py-1 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20"
                                                        >
                                                            {char}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                                                    <div>
                                                        <div className="text-gray-500">3Y Forward Return</div>
                                                        <div className={`font-bold ${getSentimentColor(crisis.forward_3y_return)}`}>
                                                            {crisis.forward_3y_return > 0 ? '+' : ''}
                                                            {crisis.forward_3y_return.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
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

                            <div className="space-y-3">
                                {parallels.map((match, i) => (
                                    <div
                                        key={i}
                                        className="p-4 bg-[#0a0a0f] border border-[#27272a] rounded hover:border-blue-500/30 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="font-bold text-white">{match.period}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="text-[10px] text-blue-400 font-mono">
                                                        {(match.similarity_score * 100).toFixed(0)}% Match
                                                    </div>
                                                    <div className="w-20 h-1 bg-[#27272a] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500"
                                                            style={{ width: `${match.similarity_score * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-sm font-bold ${getSentimentColor(match.forward_1y_return)}`}>
                                                    {match.forward_1y_return > 0 ? '+' : ''}
                                                    {match.forward_1y_return.toFixed(1)}%
                                                </div>
                                                <div className="text-[10px] text-gray-500">1Y After</div>
                                            </div>
                                        </div>

                                        <div className="text-xs text-gray-400 mb-3">{match.explanation}</div>

                                        <div className="grid grid-cols-4 gap-2 text-[10px]">
                                            <div>
                                                <div className="text-gray-500">CAPE</div>
                                                <div className="text-white font-mono">{match.cape_shiller.toFixed(1)}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Rate</div>
                                                <div className="text-white font-mono">{match.interest_rate.toFixed(1)}%</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Inflation</div>
                                                <div className="text-white font-mono">{match.inflation.toFixed(1)}%</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Unemp</div>
                                                <div className="text-white font-mono">{match.unemployment.toFixed(1)}%</div>
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-[#27272a] text-[10px]">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">3Y Forward Return</span>
                                                <span className={`font-bold ${getSentimentColor(match.forward_3y_return)}`}>
                                                    {match.forward_3y_return > 0 ? '+' : ''}
                                                    {match.forward_3y_return.toFixed(1)}%
                                                </span>
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

                {/* Bottom Timeline Visualization */}
                <div className="mt-6 bg-[#111116] border border-[#27272a] rounded-lg p-6">
                    <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
                        Crisis Timeline (1900-2025)
                    </h2>
                    <div className="relative h-20">
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-[#27272a]"></div>
                        {crises.map((crisis, i) => {
                            const position = ((crisis.year - 1900) / 125) * 100;
                            return (
                                <div
                                    key={i}
                                    className="absolute top-0 transform -translate-x-1/2 cursor-pointer group"
                                    style={{ left: `${position}%` }}
                                    onClick={() => setSelectedCrisis(crisis)}
                                >
                                    <div
                                        className={`w-3 h-3 rounded-full ${
                                            crisis.forward_1y_return < 0 ? 'bg-red-500' : 'bg-green-500'
                                        } border-2 border-[#050505] group-hover:scale-150 transition-transform`}
                                    ></div>
                                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-[8px] text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                        {crisis.year}
                                    </div>
                                </div>
                            );
                        })}
                        <div className="absolute -bottom-6 left-0 text-[10px] text-gray-600">1900</div>
                        <div className="absolute -bottom-6 right-0 text-[10px] text-gray-600">2025</div>
                    </div>
                </div>
            </div>
        </main>
    );
}
