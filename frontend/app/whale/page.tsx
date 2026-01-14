"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface WhaleAlertsResponse {
    alerts?: Array<{
        alert_type: string;
        symbol: string;
        headline: string;
        description: string;
        signal: string;
        magnitude: number;
        timestamp: string;
        source: string;
    }>;
}

interface InsiderTradesResponse {
    trades?: Array<{
        symbol: string;
        company_name: string;
        reporter_name: string;
        reporter_title: string;
        transaction_type: string;
        transaction_date: string;
        shares_transacted: number;
        price: number;
        total_value: number;
        is_buy: boolean;
        signal_strength: number;
        market_cap?: number;
        shares_outstanding?: number;
        pct_of_outstanding?: number;
        pct_of_market_cap?: number;
        significance?: string;
    }>;
}

interface GurusListResponse {
    gurus?: Array<{
        id: string;
        name: string;
        manager: string;
        avatar: string;
    }>;
}

interface GuruHoldingsResponse {
    guru?: {
        id: string;
        name: string;
        manager: string;
        avatar: string;
    };
    holdings?: Array<{
        symbol: string;
        company_name: string;
        shares: number;
        value: number;
        weight_percent: number;
        change_percent: number;
        filing_date: string;
        quarter: string;
    }>;
}

interface ConsensusResponse {
    consensus_picks?: Array<{
        symbol: string;
        guru_count: number;
        gurus: string[];
        total_value: number;
    }>;
}


interface WhaleAlert {
    type: string;
    symbol: string;
    name: string;
    signal_strength: number;
    reason: string;
    price: number;
    details: string;
    timestamp: string;
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
    signal_strength: number;
    market_cap?: number;
    shares_outstanding?: number;
    pct_of_outstanding?: number;
    pct_of_market_cap?: number;
    significance?: string;
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

interface ConsensusPick {
    symbol: string;
    guru_count: number;
    gurus: string[];
    total_value: number;
}

interface Guru {
    id: string;
    name: string;
    manager: string;
    avatar: string;
}

export default function WhalePage() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
    const [radarData, setRadarData] = useState<RadarBlip[]>([]);
    const [insiderTrades, setInsiderTrades] = useState<InsiderTrade[]>([]);
    const [guruHoldings, setGuruHoldings] = useState<GuruHolding[]>([]);
    const [allGuruHoldings, setAllGuruHoldings] = useState<Record<string, GuruHolding[]>>({});
    const [consensusPicks, setConsensusPicks] = useState<ConsensusPick[]>([]);
    const [availableGurus, setAvailableGurus] = useState<Guru[]>([]);
    const [selectedGuruId, setSelectedGuruId] = useState<string>('berkshire');
    const [loading, setLoading] = useState(true);
    const [guruLoading, setGuruLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<'radar' | 'insider' | 'guru' | 'consensus'>('radar');
    const [selectedGuruLabel, setSelectedGuruLabel] = useState<string>('');

    const handleStockClick = (symbol: string) => {
        const cleanSymbol = symbol.replace(/[\^\.]/g, '').toUpperCase();
        router.push(`/stocks/${cleanSymbol}`);
    };

    useEffect(() => {
        fetchWhaleData();
    }, []);

    const fetchWhaleData = async () => {
        try {
            setLoading(true);

            const [alertsRes, radarRes, insiderRes, gurusRes, consensusRes] = await Promise.all([
                fetch('http://localhost:8000/api/whale/alerts'),
                fetch('http://localhost:8000/api/whale/radar'),
                fetch('http://localhost:8000/api/whale/insider'),
                fetch('http://localhost:8000/api/whale/guru'),
                fetch('http://localhost:8000/api/whale/consensus?top_n=10'),
            ]);

            const alertsData: WhaleAlertsResponse = await alertsRes.json();
            const radarDataRes = await radarRes.json();
            const insiderData: InsiderTradesResponse = await insiderRes.json();
            const gurusData: GurusListResponse = await gurusRes.json();
            const consensusData: ConsensusResponse = await consensusRes.json();

            const normalizedAlerts: WhaleAlert[] = (alertsData.alerts ?? []).map((a) => ({
                type: a.alert_type,
                symbol: a.symbol,
                name: a.headline,
                signal_strength: a.magnitude,
                reason: a.description,
                price: 0,
                details: `${a.signal} • ${a.source}`,
                timestamp: a.timestamp,
            }));

            setAlerts(normalizedAlerts);
            setRadarData(radarDataRes.blips || []);

            const normalizedInsiderTrades: InsiderTrade[] = (insiderData.trades ?? []).map((t) => ({
                symbol: t.symbol,
                company_name: t.company_name,
                insider_name: t.reporter_name,
                insider_title: t.reporter_title,
                transaction_type: t.is_buy ? 'Buy' : 'Sell',
                shares: t.shares_transacted,
                price_per_share: t.price,
                total_value: t.total_value,
                transaction_date: t.transaction_date,
                signal_strength: t.signal_strength,
                market_cap: t.market_cap,
                shares_outstanding: t.shares_outstanding,
                pct_of_outstanding: t.pct_of_outstanding,
                pct_of_market_cap: t.pct_of_market_cap,
                significance: t.significance,
            }));
            setInsiderTrades(normalizedInsiderTrades);

            const gurusList = gurusData.gurus ?? [];
            setAvailableGurus(gurusList);

            // Fetch all guru holdings in parallel for unified view
            const holdingsPromises = gurusList.map(async (guru) => {
                try {
                    const res = await fetch(`http://localhost:8000/api/whale/guru/${guru.id}?limit=5`);
                    const data: GuruHoldingsResponse = await res.json();
                    return {
                        guruId: guru.id,
                        holdings: (data.holdings ?? []).map((h) => ({
                            guru_name: data.guru?.manager ?? guru.manager,
                            fund_name: data.guru?.name ?? guru.name,
                            symbol: h.symbol,
                            company_name: h.company_name,
                            shares: h.shares,
                            market_value: h.value,
                            portfolio_weight: h.weight_percent,
                            change_from_prev_quarter: h.change_percent,
                            filing_date: h.filing_date,
                        }))
                    };
                } catch {
                    return { guruId: guru.id, holdings: [] };
                }
            });

            const allHoldingsResults = await Promise.all(holdingsPromises);
            const allHoldingsMap: Record<string, GuruHolding[]> = {};
            allHoldingsResults.forEach((result) => {
                allHoldingsMap[result.guruId] = result.holdings;
            });
            setAllGuruHoldings(allHoldingsMap);

            // Also set default guru holdings for backward compatibility
            const defaultGuru = gurusList.find((g) => g.id === 'berkshire') ?? gurusList[0] ?? null;
            if (defaultGuru && allHoldingsMap[defaultGuru.id]) {
                setSelectedGuruId(defaultGuru.id);
                setGuruHoldings(allHoldingsMap[defaultGuru.id]);
                setSelectedGuruLabel(`${defaultGuru.name} (${defaultGuru.manager})`);
            }

            setConsensusPicks(
                (consensusData.consensus_picks ?? []).map((c) => ({
                    symbol: c.symbol,
                    guru_count: c.guru_count,
                    gurus: c.gurus,
                    total_value: c.total_value,
                }))
            );

            setError(null);
        } catch (err) {
            console.error('Failed to fetch whale data:', err);
            setError('Failed to connect to backend. Please ensure the server is running on port 8000.');
        } finally {
            setLoading(false);
        }
    };

    const handleGuruChange = async (guruId: string) => {
        const guru = availableGurus.find((g) => g.id === guruId);
        if (!guru) return;

        setSelectedGuruId(guruId);
        setGuruLoading(true);

        try {
            const holdingsRes = await fetch(`http://localhost:8000/api/whale/guru/${guruId}?limit=20`);
            const holdingsData: GuruHoldingsResponse = await holdingsRes.json();

            const normalizedGuruHoldings: GuruHolding[] = (holdingsData.holdings ?? []).map((h) => ({
                guru_name: holdingsData.guru?.manager ?? guru.manager,
                fund_name: holdingsData.guru?.name ?? guru.name,
                symbol: h.symbol,
                company_name: h.company_name,
                shares: h.shares,
                market_value: h.value,
                portfolio_weight: h.weight_percent,
                change_from_prev_quarter: h.change_percent,
                filing_date: h.filing_date,
            }));

            setGuruHoldings(normalizedGuruHoldings);
            setSelectedGuruLabel(`${guru.name} (${guru.manager})`);
        } catch (err) {
            console.error('Failed to fetch guru holdings:', err);
        } finally {
            setGuruLoading(false);
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

    if (loading) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-gray-400">Loading whale data...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 mb-4">{error}</div>
                    <button
                        onClick={fetchWhaleData}
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

                        {/* Alerts Bar */}
                        <div className="mb-6 p-4 bg-[#111116] border border-[#27272a] rounded-lg">
                            <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
                                🚨 Active Alerts
                            </div>
                            <div className="space-y-2">
                                {alerts.slice(0, 5).map((alert, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-[#27272a] last:border-0">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span
                                                onClick={() => handleStockClick(alert.symbol)}
                                                className="font-mono font-bold text-blue-400 hover:text-blue-300 cursor-pointer hover:underline"
                                            >
                                                {alert.symbol}
                                            </span>
                                            <span className="text-gray-400 truncate">{alert.name}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 whitespace-nowrap">
                                                {alert.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            <span className="text-gray-500 text-[10px] truncate max-w-[150px]">{alert.reason}</span>
                                            <span className="text-gray-600 text-[10px] font-mono whitespace-nowrap">
                                                {alert.timestamp ? new Date(alert.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''}
                                            </span>
                                        </div>
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

                                {/* Radar Explanation Info Box */}
                                <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-400 text-lg">ℹ️</span>
                                        <div className="text-xs text-gray-300">
                                            <p className="font-semibold text-blue-400 mb-2">Radar 해석 가이드</p>
                                            <ul className="space-y-1.5 text-gray-400">
                                                <li className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                                                    <span><strong className="text-emerald-400">녹색</strong> = 매수 신호 (Insider/Guru 매수)</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                                                    <span><strong className="text-red-400">빨간색</strong> = 매도 신호 (Insider/Guru 매도)</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                                                    <span><strong className="text-amber-400">노란색</strong> = 클러스터 활동 (여러 내부자 동시 거래)</span>
                                                </li>
                                                <li className="mt-2 pt-2 border-t border-white/5">
                                                    <span>• <strong className="text-white">중심에 가까울수록</strong> = 거래 규모가 큼</span>
                                                </li>
                                                <li>
                                                    <span>• <strong className="text-white">점 크기</strong> = 신호 강도</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {renderRadar()}

                                <div className="mt-4 flex items-center justify-center gap-6 text-[10px] text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span>매수</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        <span>매도</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span>클러스터</span>
                                    </div>
                                    <div>|</div>
                                    <span>중심에 가까울수록 = 규모 큼</span>
                                </div>
                            </div>
                        )}

                        {selectedTab === 'insider' && (
                            <div className="bg-[#111116] border border-[#27272a] rounded-lg p-6">
                                <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
                                    Recent Insider Transactions
                                </h2>
                                <div className="space-y-3">
                                    {insiderTrades.map((trade, i) => (
                                        <div
                                            key={i}
                                            className="p-4 bg-[#18181b] rounded-lg border border-[#27272a] hover:border-blue-500/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span
                                                            onClick={() => handleStockClick(trade.symbol)}
                                                            className="font-mono font-bold text-blue-400 hover:text-blue-300 cursor-pointer hover:underline"
                                                        >
                                                            {trade.symbol}
                                                        </span>
                                                        <span className="text-xs text-gray-300">{trade.company_name}</span>
                                                        {trade.significance && (
                                                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                                                trade.significance === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                                                                trade.significance === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                                                                trade.significance === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                                                                'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                                {trade.significance}
                                                            </span>
                                                        )}
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

                                            {/* Context Metrics */}
                                            <div className="flex items-center gap-4 pt-3 border-t border-[#27272a] text-[10px]">
                                                {trade.market_cap && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-500">Market Cap:</span>
                                                        <span className="text-gray-300 font-mono">
                                                            ${(trade.market_cap / 1e9).toFixed(0)}B
                                                        </span>
                                                    </div>
                                                )}
                                                {trade.pct_of_outstanding !== undefined && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-500">% of Outstanding:</span>
                                                        <span className={`font-mono ${
                                                            trade.pct_of_outstanding > 0.5 ? 'text-amber-400' :
                                                            trade.pct_of_outstanding > 0.1 ? 'text-blue-400' :
                                                            'text-gray-400'
                                                        }`}>
                                                            {trade.pct_of_outstanding.toFixed(4)}%
                                                        </span>
                                                    </div>
                                                )}
                                                {trade.pct_of_market_cap !== undefined && trade.pct_of_market_cap > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-500">% of Mkt Cap:</span>
                                                        <span className="text-gray-400 font-mono">
                                                            {trade.pct_of_market_cap.toFixed(6)}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedTab === 'guru' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-white">
                                        🏆 Legendary Investor Holdings
                                    </h2>
                                    <span className="text-xs text-gray-500">
                                        Based on latest 13F filings
                                    </span>
                                </div>

                                {/* Guru Grid - All gurus visible at once */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {availableGurus.map((guru) => (
                                        <div
                                            key={guru.id}
                                            className="bg-[#111116] border border-[#27272a] rounded-xl p-5 hover:border-purple-500/30 transition-colors"
                                        >
                                            {/* Guru Header */}
                                            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#27272a]">
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                                                    <span className="text-2xl">{guru.avatar}</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white">{guru.manager}</h3>
                                                    <p className="text-xs text-gray-400">{guru.name}</p>
                                                </div>
                                            </div>

                                            {/* Top Holdings */}
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                    Top Holdings
                                                </h4>
                                                {(allGuruHoldings[guru.id] || []).slice(0, 5).map((holding, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => handleStockClick(holding.symbol)}
                                                        className="flex items-center justify-between p-2 bg-[#18181b] rounded-lg hover:bg-[#1f1f23] transition-colors cursor-pointer"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-mono font-bold text-purple-400 text-sm hover:text-purple-300">
                                                                {holding.symbol}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 truncate">
                                                                {holding.company_name}
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-3">
                                                            <div className="text-xs font-bold text-gray-300">
                                                                ${(holding.market_value / 1e9).toFixed(1)}B
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                {holding.portfolio_weight.toFixed(1)}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {(!allGuruHoldings[guru.id] || allGuruHoldings[guru.id].length === 0) && (
                                                    <div className="text-center py-4 text-gray-500 text-xs">
                                                        No holdings data available
                                                    </div>
                                                )}
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

                                {consensusPicks.length === 0 ? (
                                    <div className="text-gray-500 text-center py-12">
                                        No consensus picks available.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {consensusPicks.map((pick) => (
                                            <div
                                                key={pick.symbol}
                                                onClick={() => handleStockClick(pick.symbol)}
                                                className="flex items-center justify-between p-3 bg-[#18181b] rounded border border-[#27272a] hover:border-emerald-500/30 transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono font-bold text-emerald-400 hover:text-emerald-300">{pick.symbol}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {pick.guru_count} gurus
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-gray-300">
                                                        ${(pick.total_value / 1e6).toFixed(1)}M
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 truncate max-w-[220px]">
                                                        {pick.gurus.join(', ')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
            </div>
        </main>
    );
}
