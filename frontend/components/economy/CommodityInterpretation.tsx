"use client";

import { useState } from 'react';

interface CommodityGuide {
    symbol: string;
    name: string;
    icon: string;
    description: string;
    rising: {
        signal: string;
        impacts: string[];
        sectors: { positive: string[]; negative: string[] };
        historical: string;
    };
    falling: {
        signal: string;
        impacts: string[];
        sectors: { positive: string[]; negative: string[] };
        historical: string;
    };
    watchPoints: string[];
    correlations: string[];
}

const COMMODITY_GUIDES: Record<string, CommodityGuide> = {
    "CL=F": {
        symbol: "CL=F",
        name: "Crude Oil (WTI)",
        icon: "🛢️",
        description: "The world's most traded commodity. Oil prices affect transportation, manufacturing, and consumer spending globally.",
        rising: {
            signal: "INFLATIONARY / RISK-ON",
            impacts: [
                "Higher energy costs pass through to consumer prices",
                "Transportation and logistics costs increase",
                "Consumer discretionary spending pressured",
                "Energy exporting nations benefit (Russia, Saudi Arabia, Norway)",
            ],
            sectors: {
                positive: ["Energy", "Oil Services", "Renewables"],
                negative: ["Airlines", "Transportation", "Consumer Discretionary"],
            },
            historical: "2008: Oil hit $147, preceded GFC. 2022: Russia-Ukraine war pushed oil above $120.",
        },
        falling: {
            signal: "DEFLATIONARY / RECESSION RISK",
            impacts: [
                "Lower input costs benefit manufacturers",
                "Consumer purchasing power increases",
                "May signal weak global demand (recession)",
                "Energy sector earnings compressed",
            ],
            sectors: {
                positive: ["Airlines", "Consumer Discretionary", "Transportation"],
                negative: ["Energy", "Oil Services", "MLPs"],
            },
            historical: "2020: COVID crash sent oil negative briefly. 2014: Shale revolution caused 70% drop.",
        },
        watchPoints: [
            "OPEC+ production decisions",
            "US Strategic Petroleum Reserve levels",
            "China demand recovery",
            "Geopolitical tensions in Middle East",
        ],
        correlations: [
            "Usually inverse to USD",
            "Positive with inflation expectations",
            "Leads CPI by 3-6 months",
        ],
    },
    "GC=F": {
        symbol: "GC=F",
        name: "Gold",
        icon: "🥇",
        description: "The ultimate safe haven. Gold is a hedge against inflation, currency debasement, and geopolitical risk.",
        rising: {
            signal: "RISK-OFF / INFLATION FEAR",
            impacts: [
                "Investors seeking safety from uncertainty",
                "Inflation expectations rising",
                "Faith in fiat currencies declining",
                "Central bank buying accelerating",
            ],
            sectors: {
                positive: ["Gold Miners", "Precious Metals", "Defensive"],
                negative: ["Banks (relative)", "Growth Stocks", "USD"],
            },
            historical: "2011: Hit $1,920 during European debt crisis. 2020: New ATH as Fed went all-in on QE.",
        },
        falling: {
            signal: "RISK-ON / REAL RATES RISING",
            impacts: [
                "Opportunity cost of holding gold increases",
                "Confidence in economy improving",
                "Fed hawkishness strengthening dollar",
                "Crypto potentially taking safe-haven bid",
            ],
            sectors: {
                positive: ["Banks", "Growth Tech", "Cyclicals"],
                negative: ["Gold Miners", "Precious Metals ETFs"],
            },
            historical: "2013: 'Taper Tantrum' caused 28% drop. 2022: Fed hikes pushed gold from $2,000 to $1,600.",
        },
        watchPoints: [
            "Real interest rates (nominal - inflation)",
            "Central bank gold purchases",
            "US Dollar strength",
            "Geopolitical risk events",
        ],
        correlations: [
            "Inverse to real interest rates",
            "Usually inverse to USD",
            "Positive with VIX in crisis",
        ],
    },
    "HG=F": {
        symbol: "HG=F",
        name: "Copper (Dr. Copper)",
        icon: "🔶",
        description: "Known as 'Dr. Copper' for its PhD in economics. Copper demand reflects global industrial activity and growth.",
        rising: {
            signal: "ECONOMIC EXPANSION",
            impacts: [
                "Global manufacturing accelerating",
                "Infrastructure spending increasing",
                "China construction activity strong",
                "EV adoption driving new demand",
            ],
            sectors: {
                positive: ["Mining", "Industrials", "Construction", "EV/Battery"],
                negative: ["Utilities (relative)", "Defensive"],
            },
            historical: "2021: Hit record $5.00/lb on reopening + EV demand. 2011: China stimulus drove supercycle.",
        },
        falling: {
            signal: "ECONOMIC SLOWDOWN",
            impacts: [
                "Manufacturing activity declining",
                "China property sector weakness",
                "Global PMIs contracting",
                "Inventory destocking underway",
            ],
            sectors: {
                positive: ["Defensives", "Utilities", "Consumer Staples"],
                negative: ["Mining", "Industrials", "Materials"],
            },
            historical: "2015: China slowdown fears cut copper 50%. 2008: GFC saw copper crash 66%.",
        },
        watchPoints: [
            "China PMI and property data",
            "Global manufacturing PMIs",
            "Inventory levels (LME, COMEX)",
            "EV production forecasts",
        ],
        correlations: [
            "Strong positive with global GDP",
            "Leads S&P 500 cyclical earnings",
            "Positive with CNY strength",
        ],
    },
};

interface Props {
    commoditySymbol?: string;
    currentPrice?: number;
    priceChange?: number;
}

export default function CommodityInterpretation({ commoditySymbol, currentPrice, priceChange }: Props) {
    const [selectedCommodity, setSelectedCommodity] = useState<string>(commoditySymbol || "CL=F");

    const guide = COMMODITY_GUIDES[selectedCommodity];

    if (!guide) {
        return (
            <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
                <div className="text-gray-400 text-center py-4">
                    No guide available for this commodity
                </div>
            </div>
        );
    }

    const isRising = priceChange !== undefined ? priceChange > 0 : true;
    const currentScenario = isRising ? guide.rising : guide.falling;

    return (
        <div className="bg-[#111116] border border-[#27272a] rounded-lg p-4">
            {/* Header with commodity selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                    <span>{guide.icon}</span>
                    COMMODITY INTERPRETATION GUIDE
                </h3>

                <div className="flex gap-1 bg-[#0a0a0f] rounded-lg p-1">
                    {Object.values(COMMODITY_GUIDES).map((g) => (
                        <button
                            key={g.symbol}
                            onClick={() => setSelectedCommodity(g.symbol)}
                            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                                selectedCommodity === g.symbol
                                    ? 'bg-amber-500 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {g.icon} {g.name.split(' ')[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div className="text-xs text-gray-400 mb-4 p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                {guide.description}
            </div>

            {/* Current Signal */}
            {priceChange !== undefined && (
                <div className={`mb-4 p-3 rounded border ${
                    isRising
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-green-500/10 border-green-500/30'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`text-lg ${isRising ? 'text-red-400' : 'text-green-400'}`}>
                                {isRising ? '📈' : '📉'}
                            </span>
                            <span className="text-xs text-gray-300">
                                Current Trend: <strong className={isRising ? 'text-red-400' : 'text-green-400'}>
                                    {isRising ? 'RISING' : 'FALLING'}
                                </strong>
                            </span>
                        </div>
                        <span className={`text-sm font-bold ${isRising ? 'text-red-400' : 'text-green-400'}`}>
                            {currentScenario.signal}
                        </span>
                    </div>
                </div>
            )}

            {/* Two-column layout: Rising vs Falling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Rising Scenario */}
                <div className={`p-3 rounded border ${
                    isRising ? 'bg-red-500/5 border-red-500/30' : 'bg-[#0a0a0f] border-[#27272a]'
                }`}>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-red-400">📈</span>
                        <span className="text-xs font-bold text-red-400">WHEN {guide.name.toUpperCase()} RISES</span>
                    </div>

                    <div className="mb-3">
                        <div className="text-[10px] text-gray-500 uppercase mb-1">Signal</div>
                        <div className="text-xs text-red-300 font-mono">{guide.rising.signal}</div>
                    </div>

                    <div className="mb-3">
                        <div className="text-[10px] text-gray-500 uppercase mb-1">Impacts</div>
                        <ul className="text-[10px] text-gray-400 space-y-1">
                            {guide.rising.impacts.slice(0, 3).map((impact, i) => (
                                <li key={i}>• {impact}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                            <div className="text-green-400 mb-1">✓ Winners</div>
                            {guide.rising.sectors.positive.slice(0, 2).map((s, i) => (
                                <div key={i} className="text-gray-400">{s}</div>
                            ))}
                        </div>
                        <div>
                            <div className="text-red-400 mb-1">✗ Losers</div>
                            {guide.rising.sectors.negative.slice(0, 2).map((s, i) => (
                                <div key={i} className="text-gray-400">{s}</div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Falling Scenario */}
                <div className={`p-3 rounded border ${
                    !isRising ? 'bg-green-500/5 border-green-500/30' : 'bg-[#0a0a0f] border-[#27272a]'
                }`}>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-green-400">📉</span>
                        <span className="text-xs font-bold text-green-400">WHEN {guide.name.toUpperCase()} FALLS</span>
                    </div>

                    <div className="mb-3">
                        <div className="text-[10px] text-gray-500 uppercase mb-1">Signal</div>
                        <div className="text-xs text-green-300 font-mono">{guide.falling.signal}</div>
                    </div>

                    <div className="mb-3">
                        <div className="text-[10px] text-gray-500 uppercase mb-1">Impacts</div>
                        <ul className="text-[10px] text-gray-400 space-y-1">
                            {guide.falling.impacts.slice(0, 3).map((impact, i) => (
                                <li key={i}>• {impact}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                            <div className="text-green-400 mb-1">✓ Winners</div>
                            {guide.falling.sectors.positive.slice(0, 2).map((s, i) => (
                                <div key={i} className="text-gray-400">{s}</div>
                            ))}
                        </div>
                        <div>
                            <div className="text-red-400 mb-1">✗ Losers</div>
                            {guide.falling.sectors.negative.slice(0, 2).map((s, i) => (
                                <div key={i} className="text-gray-400">{s}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Watch Points & Correlations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                    <div className="text-[10px] text-gray-500 uppercase mb-2 flex items-center gap-1">
                        👁️ Key Watch Points
                    </div>
                    <ul className="text-[10px] text-gray-400 space-y-1">
                        {guide.watchPoints.map((point, i) => (
                            <li key={i}>• {point}</li>
                        ))}
                    </ul>
                </div>

                <div className="p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                    <div className="text-[10px] text-gray-500 uppercase mb-2 flex items-center gap-1">
                        🔗 Correlations
                    </div>
                    <ul className="text-[10px] text-gray-400 space-y-1">
                        {guide.correlations.map((corr, i) => (
                            <li key={i}>• {corr}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Historical Context */}
            <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded">
                <div className="text-[10px] text-amber-400 uppercase mb-2">📚 Historical Examples</div>
                <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-400">
                    <div>
                        <div className="text-red-400 mb-1">Rising Scenario</div>
                        <div>{guide.rising.historical}</div>
                    </div>
                    <div>
                        <div className="text-green-400 mb-1">Falling Scenario</div>
                        <div>{guide.falling.historical}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
