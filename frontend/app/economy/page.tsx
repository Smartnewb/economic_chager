"use client";

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { AnalysisTriggerButton, AnalysisPanel, AnalysisResult } from '@/components/ui';
import DrCopperIndicator from '@/components/economy/DrCopperIndicator';
import PMIGauge from '@/components/economy/PMIGauge';
import EconomicSurpriseIndicator from '@/components/economy/EconomicSurpriseIndicator';
import CommodityInterpretation from '@/components/economy/CommodityInterpretation';
import { CommodityData, PMIData } from '@/store/economyStore';

interface Commodity {
    name: string;
    symbol: string;
    price: number;
    change_pct: number;
    unit: string;
}

interface EconomyCommoditiesResponse {
    oil?: {
        symbol: string;
        name: string;
        price: number;
        change_24h: number;
        unit: string;
    };
    gold?: {
        symbol: string;
        name: string;
        price: number;
        change_24h: number;
        unit: string;
    };
    copper?: {
        symbol: string;
        name: string;
        price: number;
        change_24h: number;
        unit: string;
    };
    overall_signal?: string;
    interpretation?: string;
}

interface EconomyDataResponse {
    commodities?: EconomyCommoditiesResponse;
    pmi_data?: PagePMIData[];
    cpi_data?: CPIData[];
    upcoming_events?: EconomyEvent[];
}

interface PagePMIData {
    country: string;
    manufacturing: number;
    services: number;
}

interface EconomyEvent {
    id: string;
    name: string;
    country: string;
    country_code: string;
    flag: string;
    date: string;
    time: string;
    impact: "high" | "medium" | "low";
    forecast: string;
    previous: string;
    unit: string;
    category: string;
}

interface CPIData {
    country: string;
    country_code: string;
    flag: string;
    value: number;
    previous_value: number;
    target_rate: number;
    change: number;
    surprise: number;
    is_above_target: boolean;
}

interface EconomyData {
    commodities: Commodity[];
    pmi_data: PagePMIData[];
    cpi_data: CPIData[];
    upcoming_events: EconomyEvent[];
    commodity_signal: string;
}

function transformCommodityToWidgetFormat(commodity: Commodity, signal: string): CommodityData {
    const signalValue = signal === 'bullish' ? 'bullish' : signal === 'bearish' ? 'bearish' : 'neutral';
    const estimatedHigh = commodity.price * 1.15;
    const estimatedLow = commodity.price * 0.85;
    const percentOfRange = Math.round(((commodity.price - estimatedLow) / (estimatedHigh - estimatedLow)) * 100);

    return {
        symbol: commodity.symbol,
        name: commodity.name,
        shortName: commodity.name.split(' ')[0],
        price: commodity.price,
        change24h: commodity.change_pct,
        change1w: commodity.change_pct * 0.5,
        change1m: commodity.change_pct * 2,
        high52w: estimatedHigh,
        low52w: estimatedLow,
        percentOfRange,
        unit: commodity.unit,
        signal: signalValue,
        interpretation: signalValue === 'bullish'
            ? 'Copper rising signals economic expansion'
            : signalValue === 'bearish'
            ? 'Copper falling signals economic slowdown'
            : 'Copper stable, economy in balance',
    };
}

function transformPMIToWidgetFormat(pmiList: PagePMIData[]): PMIData[] {
    const flagMap: Record<string, string> = {
        'united states': '🇺🇸',
        'china': '🇨🇳',
        'germany': '🇩🇪',
        'japan': '🇯🇵',
        'south korea': '🇰🇷',
        'united kingdom': '🇬🇧',
        'eurozone': '🇪🇺',
    };
    const codeMap: Record<string, string> = {
        'united states': 'US',
        'china': 'CN',
        'germany': 'DE',
        'japan': 'JP',
        'south korea': 'KR',
        'united kingdom': 'GB',
        'eurozone': 'EU',
    };

    return pmiList.map((pmi) => {
        const countryKey = pmi.country?.toLowerCase() ?? '';
        const value = pmi.manufacturing ?? 50;
        const previousValue = pmi.services ?? 50;
        const consensus = ((pmi.manufacturing ?? 50) + (pmi.services ?? 50)) / 2;
        const surprise = Math.round((value - consensus) * 10) / 10;
        const trend = value > previousValue ? 'improving' : value < previousValue ? 'worsening' : 'stable';

        return {
            name: 'Manufacturing PMI',
            shortName: 'PMI',
            country: pmi.country,
            countryCode: codeMap[countryKey] || pmi.country.slice(0, 2).toUpperCase(),
            flag: flagMap[countryKey] || '🏳️',
            value,
            previousValue,
            consensus,
            change: Math.round((value - previousValue) * 10) / 10,
            surprise,
            releaseDate: new Date().toISOString().split('T')[0],
            nextRelease: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            unit: 'index',
            type: 'manufacturing' as const,
            expansionThreshold: 50,
            isExpansion: value > 50,
            trend,
        };
    });
}

export default function EconomyPage() {
    const [economyData, setEconomyData] = useState<EconomyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [showPanel, setShowPanel] = useState(false);

    useEffect(() => {
        fetchEconomyData();
    }, []);

    const fetchEconomyData = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/economy/data');
            const data: EconomyDataResponse = await response.json();

            const commoditiesRaw = data.commodities ?? {};
            const normalizedCommodities: Commodity[] = [commoditiesRaw.oil, commoditiesRaw.gold, commoditiesRaw.copper]
                .filter((c): c is NonNullable<typeof c> => Boolean(c))
                .map((c) => ({
                    name: c.name,
                    symbol: c.symbol,
                    price: c.price,
                    change_pct: c.change_24h,
                    unit: c.unit,
                }));

            setEconomyData({
                commodities: normalizedCommodities,
                pmi_data: data.pmi_data ?? [],
                cpi_data: data.cpi_data ?? [],
                upcoming_events: data.upcoming_events ?? [],
                commodity_signal: commoditiesRaw.overall_signal ?? 'mixed',
            });
            setError(null);
        } catch (err) {
            console.error('Failed to fetch economy data:', err);
            setEconomyData(null);
            setError('Failed to connect to backend. Please ensure the server is running on port 8000.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!economyData) return;

        setIsAnalyzing(true);
        setShowPanel(true);

        try {
            const cacheRes = await fetch('http://localhost:8000/api/analyze/economy/cached?language=en');
            const cacheData = await cacheRes.json();
            if (cacheData.cached && cacheData.result) {
                setAnalysisResult(cacheData.result);
                setIsAnalyzing(false);
                return;
            }

            const oil = economyData.commodities.find((c) => c.symbol === 'CL=F') ?? economyData.commodities[0];
            const gold = economyData.commodities.find((c) => c.symbol === 'GC=F') ?? economyData.commodities[1];
            const copper = economyData.commodities.find((c) => c.symbol === 'HG=F') ?? economyData.commodities[2];

            const usPmi = economyData.pmi_data.find((p) => p.country.toLowerCase().includes('united states'))?.manufacturing ?? 50;
            const usCpi = economyData.cpi_data.find((c) => c.country_code === 'US')?.value ?? 3.0;

            const response = await fetch('http://localhost:8000/api/analyze/economy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oil_price: oil?.price ?? 0,
                    oil_change: oil?.change_pct ?? 0,
                    gold_price: gold?.price ?? 0,
                    gold_change: gold?.change_pct ?? 0,
                    copper_price: copper?.price ?? 0,
                    copper_change: copper?.change_pct ?? 0,
                    commodity_signal: economyData.commodity_signal,
                    us_pmi: usPmi,
                    us_cpi: usCpi,
                    language: 'en',
                }),
            });

            const resultData = await response.json();
            setAnalysisResult(resultData);
        } catch (err) {
            console.error('Analysis failed:', err);
            setAnalysisResult({
                topic: 'economy',
                timestamp: new Date().toISOString(),
                perspectives: [
                    { persona: 'kostolany', analysis: 'Unable to connect to AI service. Please try again.' },
                    { persona: 'buffett', analysis: 'Analysis service is currently unavailable.' },
                    { persona: 'munger', analysis: 'Check your network connection and backend status.' },
                    { persona: 'dalio', analysis: 'The system will retry automatically when available.' },
                ],
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-gray-400">Loading economy data...</div>
            </main>
        );
    }

    if (error || !economyData) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 mb-4">{error || 'No economy data available.'}</div>
                    <button
                        onClick={fetchEconomyData}
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

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                                <div className="flex justify-between items-end border-b border-[#27272a] pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">REAL ECONOMY INDICATORS</h1>
                        <p className="text-sm text-gray-500">Commodities, PMI, and Economic Data</p>
                    </div>
                </div>

                                <div className="bg-[#111116] border border-[#27272a] rounded p-4">
                    <h2 className="text-sm font-bold text-gray-300 mb-4">COMMODITY PRICES</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {economyData.commodities.map((commodity) => (
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

                                <div className="bg-[#111116] border border-[#27272a] rounded p-4">
                    <h2 className="text-sm font-bold text-gray-300 mb-4">PURCHASING MANAGERS INDEX (PMI)</h2>
                    <div className="text-xs text-gray-400 mb-3">Above 50 = Expansion, Below 50 = Contraction</div>
                    <div className="space-y-3">
                        {economyData.pmi_data.map((pmi) => (
                            <div key={pmi.country} className="p-4 bg-[#0a0a0f] rounded border border-[#27272a]">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-bold text-white">{pmi.country}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase mb-1">Manufacturing</div>
                                        <div className="flex items-center gap-2">
                                            <div className={`text-2xl font-mono font-bold ${(pmi.manufacturing ?? 0) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                                {pmi.manufacturing?.toFixed(1) ?? 'N/A'}
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${(pmi.manufacturing ?? 0) >= 50 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {(pmi.manufacturing ?? 0) >= 50 ? '📈 Expansion' : '📉 Contraction'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase mb-1">Services</div>
                                        <div className="flex items-center gap-2">
                                            <div className={`text-2xl font-mono font-bold ${(pmi.services ?? 0) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                                {pmi.services?.toFixed(1) ?? 'N/A'}
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${(pmi.services ?? 0) >= 50 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {(pmi.services ?? 0) >= 50 ? '📈 Expansion' : '📉 Contraction'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {economyData?.upcoming_events && economyData.upcoming_events.length > 0 && (
                    <div className="bg-[#111116] border border-[#27272a] rounded p-4">
                        <h2 className="text-sm font-bold text-gray-300 mb-4">UPCOMING ECONOMIC EVENTS</h2>
                        <div className="space-y-2">
                            {economyData.upcoming_events.slice(0, 5).map((event, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                                    <div>
                                        <div className="text-sm text-white font-medium">{event.name}</div>
                                        <div className="text-xs text-gray-500">{event.flag} {event.country}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400">{event.date}</div>
                                        <div className={`text-xs px-2 py-1 rounded ${
                                            event.impact === 'high' ? 'bg-red-500/10 text-red-400' :
                                            event.impact === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                            'bg-gray-500/10 text-gray-400'
                                        }`}>
                                            {event.impact}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(() => {
                        const copper = economyData.commodities.find((c) => c.symbol === 'HG=F');
                        if (!copper) return null;
                        return (
                            <DrCopperIndicator
                                copper={transformCommodityToWidgetFormat(copper, economyData.commodity_signal)}
                            />
                        );
                    })()}

                    {economyData.pmi_data.length > 0 && (
                        <PMIGauge data={transformPMIToWidgetFormat(economyData.pmi_data)} />
                    )}
                </div>

                {/* Commodity Interpretation Guide */}
                <CommodityInterpretation
                    commoditySymbol={economyData.commodities[0]?.symbol}
                    currentPrice={economyData.commodities[0]?.price}
                    priceChange={economyData.commodities[0]?.change_pct}
                />

                <EconomicSurpriseIndicator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">Energy Complex</div>
                        <div className="text-xl font-bold text-amber-400">
                            {economyData.commodities
                                .filter(c => c.name.includes('Oil') || c.name.includes('Gas'))
                                .reduce((sum, c) => sum + c.change_pct, 0)
                                .toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Average Change</div>
                    </div>
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">Precious Metals</div>
                        <div className="text-xl font-bold text-yellow-400">
                            {economyData.commodities
                                .filter(c => c.name.includes('Gold') || c.name.includes('Silver'))
                                .reduce((sum, c) => sum + c.change_pct, 0)
                                .toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Average Change</div>
                    </div>
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">Industrial Metals</div>
                        <div className="text-xl font-bold text-blue-400">
                            {economyData.commodities
                                .filter(c => c.name.includes('Copper'))
                                .reduce((sum, c) => sum + c.change_pct, 0)
                                .toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Average Change</div>
                    </div>
                </div>

                                <div className="flex justify-center py-6">
                    <AnalysisTriggerButton
                        onAnalyze={handleAnalyze}
                        isAnalyzing={isAnalyzing}
                        isDisabled={loading || economyData.commodities.length === 0}
                        buttonText="Analyze Real Economy"
                        subText="Get AI insights on commodities, PMI, and inflation"
                    />
                </div>
            </div>

                        <AnalysisPanel
                isOpen={showPanel}
                onClose={() => setShowPanel(false)}
                result={analysisResult}
                isLoading={isAnalyzing}
                topic="Real Economy Analysis"
            />
        </main>
    );
}
