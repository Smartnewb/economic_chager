"use client";

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';

interface WhaleAlert {
    type: string;
    symbol: string;
    name: string;
    signal_strength: number;
    reason: string;
    price: number;
    details: string;
}

interface RadarBlip {
    symbol: string;
    angle: number;
    distance: number;
    strength: number;
    label: string;
    color: string;
}

interface InsiderTrade {
    symbol: string;
    company_name: string;
    insider_name: string;
    insider_title: string;
    transaction_type: string;
    shares: number;
    price_per_share: number;
    total_value: number;
    transaction_date: string;
    signal: string;
}

interface GuruHolding {
    guru_name: string;
    fund_name: string;
    symbol: string;
    company_name: string;
    shares: number;
    market_value: number;
    portfolio_weight: number;
    change_from_prev_quarter: number;
    filing_date: string;
}

export default function WhalePage() {
    const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
    const [radarData, setRadarData] = useState<RadarBlip[]>([]);
    const [insiderTrades, setInsiderTrades] = useState<InsiderTrade[]>([]);
    const [guruHoldings, setGuruHoldings] = useState<GuruHolding[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<'radar' | 'insider' | 'guru' | 'consensus'>('radar');

    useEffect(() => {
        fetchWhaleData();
    }, []);

    const fetchWhaleData = async () => {
        try {
            setLoading(true);
            const [alertsRes, radarRes, insiderRes, guruRes] = await Promise.all([
                fetch('http://localhost:8000/api/whale/alerts'),
                fetch('http://localhost:8000/api/whale/radar'),
                fetch('http://localhost:8000/api/whale/insider'),
                fetch('http://localhost:8000/api/whale/guru')
            ]);

            const alertsData = await alertsRes.json();
            const radarDataRes = await radarRes.json();
            const insiderData = await insiderRes.json();
            const guruData = await guruRes.json();

            setAlerts(alertsData);
            setRadarData(radarDataRes.blips || []);
            setInsiderTrades(insiderData.insider_trades || []);
            setGuruHoldings(guruData.guru_holdings || []);
        } catch (error) {
            console.error('Failed to fetch whale data:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderRadar = () => {
        const size = 400;
        const center = size / 2;
        const maxRadius = center - 40;

        return (
            <div className="relative flex items-center justify-center">
                <svg width={size} height={size} className="overflow-visible">
                    {/* Background circles */}
                    {[0.25, 0.5, 0.75, 1].map((r) => (
                        <circle
                            key={r}
                            cx={center}
                            cy={center}
                            r={maxRadius * r}
                            fill="none"
                            stroke="#27272a"
                            strokeWidth="1"
                            opacity="0.3"
                        />
                    ))}

                    {/* Grid lines */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                        const rad = (angle * Math.PI) / 180;
                        const x2 = center + maxRadius * Math.cos(rad);
                        const y2 = center + maxRadius * Math.sin(rad);
                        return (
                            <line
                                key={angle}
                                x1={center}
                                y1={center}
                                x2={x2}
                                y2={y2}
                                stroke="#27272a"
                                strokeWidth="1"
                                opacity="0.2"
                            />
                        );
                    })}

                    {/* Blips */}
                    {radarData.map((blip, i) => {
                        const rad = (blip.angle * Math.PI) / 180;
                        const r = blip.distance * maxRadius;
                        const x = center + r * Math.cos(rad);
                        const y = center + r * Math.sin(rad);

                        return (
                            <g key={i}>
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={4 + blip.strength * 4}
                                    fill={blip.color}
                                    opacity="0.8"
                                    className="animate-pulse"
                                />
                                <text
                                    x={x}
                                    y={y - 12}
                                    fontSize="10"
                                    fill="#fff"
                                    textAnchor="middle"
                                    className="font-mono font-bold"
                                >
                                    {blip.symbol}
                                </text>
                            </g>
                        );
                    })}

                    {/* Center dot */}
                    <circle cx={center} cy={center} r="6" fill="#3b82f6" opacity="0.8" />
                </svg>

                {/* Labels */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-mono">
                    STRONG BUY
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-mono">
                    STRONG SELL
                </div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono">
                    HIGH VOL
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono">
                    LOW VOL
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
                        <span className="text-blue-500">🐋 WHALE_TRACKER</span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                            SMART MONEY
                        </span>
                    </h1>
                    <p className="text-sm text-gray-400 mt-2">
                        Track insider trades, 13F filings from legendary investors, and institutional positioning
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-[#27272a]">
                    {(['radar', 'insider', 'guru', 'consensus'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
                                selectedTab === tab
                                    ? 'text-blue-400 border-b-2 border-blue-400'
                                    : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {tab === 'radar' && '📡 Radar'}
                            {tab === 'insider' && '👔 Insider Trades'}
                            {tab === 'guru' && '🏆 Guru Holdings'}
                            {tab === 'consensus' && '🎯 Consensus'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-gray-400">Loading whale data...</div>
                    </div>
                ) : (
                    <>
                        {/* Alerts Bar */}
                        <div className="mb-6 p-4 bg-[#111116] border border-[#27272a] rounded-lg">
                            <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
                                🚨 Active Alerts
                            </div>
                            <div className="space-y-2">
                                {alerts.slice(0, 3).map((alert, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-blue-400">{alert.symbol}</span>
                                            <span className="text-gray-400">{alert.name}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                                                {alert.type}
                                            </span>
                                        </div>
                                        <div className="text-gray-500 text-[10px]">{alert.reason}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        {selectedTab === 'radar' && (
                            <div className="bg-[#111116] border border-[#27272a] rounded-lg p-6">
                                <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
                                    Whale Radar - Smart Money Positioning
                                </h2>
                                {renderRadar()}
                                <div className="mt-4 text-[10px] text-gray-500 text-center">
                                    Distance from center = Signal strength • Color = Sentiment
                                </div>
                            </div>
                        )}

                        {selectedTab === 'insider' && (
                            <div className="bg-[#111116] border border-[#27272a] rounded-lg p-6">
                                <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
                                    Recent Insider Transactions
                                </h2>
                                <div className="space-y-2">
                                    {insiderTrades.map((trade, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 bg-[#18181b] rounded border border-[#27272a] hover:border-blue-500/30 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono font-bold text-blue-400">
                                                        {trade.symbol}
                                                    </span>
                                                    <span className="text-xs text-gray-300">{trade.company_name}</span>
                                                </div>
                                                <div className="text-[10px] text-gray-500">
                                                    {trade.insider_name} • {trade.insider_title}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div
                                                    className={`text-sm font-bold ${
                                                        trade.transaction_type === 'Buy' ? 'text-green-400' : 'text-red-400'
                                                    }`}
                                                >
                                                    {trade.transaction_type} {trade.shares.toLocaleString()} shares
                                                </div>
                                                <div className="text-[10px] text-gray-500">
                                                    ${trade.total_value.toLocaleString()} • {trade.transaction_date}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedTab === 'guru' && (
                            <div className="bg-[#111116] border border-[#27272a] rounded-lg p-6">
                                <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
                                    Legendary Investor Holdings (13F Filings)
                                </h2>
                                <div className="space-y-2">
                                    {guruHoldings.map((holding, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 bg-[#18181b] rounded border border-[#27272a] hover:border-purple-500/30 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono font-bold text-purple-400">
                                                        {holding.symbol}
                                                    </span>
                                                    <span className="text-xs text-gray-300">{holding.company_name}</span>
                                                </div>
                                                <div className="text-[10px] text-gray-500">
                                                    {holding.guru_name} • {holding.fund_name}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-gray-300">
                                                    ${(holding.market_value / 1e6).toFixed(1)}M
                                                </div>
                                                <div className="text-[10px] text-gray-500">
                                                    {holding.portfolio_weight.toFixed(2)}% of portfolio
                                                </div>
                                                <div
                                                    className={`text-[10px] ${
                                                        holding.change_from_prev_quarter > 0
                                                            ? 'text-green-400'
                                                            : 'text-red-400'
                                                    }`}
                                                >
                                                    {holding.change_from_prev_quarter > 0 ? '▲' : '▼'}{' '}
                                                    {Math.abs(holding.change_from_prev_quarter).toFixed(1)}% QoQ
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedTab === 'consensus' && (
                            <div className="bg-[#111116] border border-[#27272a] rounded-lg p-6">
                                <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
                                    Consensus Picks - Multiple Gurus Buying Same Stock
                                </h2>
                                <div className="text-gray-500 text-center py-12">
                                    Loading consensus data... (API: /api/whale/consensus)
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
