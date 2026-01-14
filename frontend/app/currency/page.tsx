"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AnalysisTriggerButton, AnalysisPanel, AnalysisResult } from '@/components/ui';

// Dynamic imports for heavy map components - reduces initial bundle
const Map = dynamic(() => import('react-map-gl/maplibre').then(mod => mod.default), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#0a0a0f] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
    ),
});

const DeckGL = dynamic(() => import('@deck.gl/react').then(mod => mod.default), {
    ssr: false,
});

// Money Flow Notifications for real-time updates
const FLOW_NOTIFICATIONS = [
    { amount: '$2.4T', from: 'Korea', to: 'US Treasury', type: 'Safe Haven', icon: '🛡️' },
    { amount: '$890B', from: 'Japan', to: 'US Equities', type: 'Risk On', icon: '📈' },
    { amount: '$1.2T', from: 'EU', to: 'Emerging Markets', type: 'Risk On', icon: '🌍' },
    { amount: '$560B', from: 'China', to: 'Gold', type: 'Hedge', icon: '🥇' },
    { amount: '$3.1T', from: 'US Tech', to: 'US Bonds', type: 'Rotation', icon: '🔄' },
    { amount: '$780B', from: 'EM', to: 'USD Cash', type: 'Flight', icon: '✈️' },
];

// ----------------------------------------------------------------------
// TYPES & DATA
// ----------------------------------------------------------------------

interface CurrencyNode {
    id: string;
    name: string;
    code: string;
    coordinates: [number, number]; // [lon, lat]
    importance: number; // 1-10 scale size
    type: 'fiat' | 'crypto';
    color: [number, number, number];
}

interface CurrencyFlow {
    source: string;
    target: string;
    value: number; // Billions
    sentiment: 'risk_on' | 'risk_off' | 'neutral';
}

// Major Global Financial Centers / Currencies - 태평양 중심, 대한민국 기준
const NODES: CurrencyNode[] = [
    { id: 'KRW', name: '대한민국', code: 'KRW', coordinates: [126.978, 37.566], importance: 10, type: 'fiat', color: [50, 205, 50] }, // 서울 중심
    { id: 'USD', name: '미국', code: 'USD', coordinates: [-74.006, 40.712], importance: 10, type: 'fiat', color: [34, 197, 94] }, // NY
    { id: 'JPY', name: '일본', code: 'JPY', coordinates: [139.691, 35.689], importance: 9, type: 'fiat', color: [239, 68, 68] }, // Tokyo
    { id: 'CNY', name: '중국', code: 'CNY', coordinates: [121.473, 31.23], importance: 9, type: 'fiat', color: [234, 179, 8] }, // Shanghai
    { id: 'EUR', name: '유럽', code: 'EUR', coordinates: [8.682, 50.11], importance: 9, type: 'fiat', color: [59, 130, 246] }, // Frankfurt
    { id: 'GBP', name: '영국', code: 'GBP', coordinates: [-0.127, 51.507], importance: 8, type: 'fiat', color: [168, 85, 247] }, // London
    { id: 'AUD', name: '호주', code: 'AUD', coordinates: [151.209, -33.868], importance: 7, type: 'fiat', color: [249, 115, 22] }, // Sydney
    { id: 'CAD', name: '캐나다', code: 'CAD', coordinates: [-79.383, 43.653], importance: 7, type: 'fiat', color: [20, 184, 166] }, // Toronto
    { id: 'HKD', name: '홍콩', code: 'HKD', coordinates: [114.169, 22.319], importance: 7, type: 'fiat', color: [236, 72, 153] }, // Hong Kong
    { id: 'SGD', name: '싱가포르', code: 'SGD', coordinates: [103.819, 1.352], importance: 7, type: 'fiat', color: [99, 102, 241] }, // Singapore
];

// Capital Flows - 대한민국에서 다른 국가로
const FLOWS: CurrencyFlow[] = [
    { source: 'KRW', target: 'USD', value: 80, sentiment: 'risk_off' }, // 안전자산 선호
    { source: 'KRW', target: 'JPY', value: 60, sentiment: 'neutral' }, // 무역 결제
    { source: 'KRW', target: 'CNY', value: 70, sentiment: 'risk_on' }, // 투자 확대
    { source: 'KRW', target: 'EUR', value: 50, sentiment: 'risk_off' }, // 유럽 투자
    { source: 'KRW', target: 'GBP', value: 30, sentiment: 'neutral' }, // 영국 투자
    { source: 'KRW', target: 'AUD', value: 40, sentiment: 'risk_on' }, // 자원국 투자
    { source: 'KRW', target: 'CAD', value: 25, sentiment: 'risk_on' }, // 북미 투자
    { source: 'KRW', target: 'HKD', value: 35, sentiment: 'neutral' }, // 아시아 금융
    { source: 'KRW', target: 'SGD', value: 45, sentiment: 'risk_on' }, // 동남아 투자
];


export default function CurrencyMapPage() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [showPanel, setShowPanel] = useState(false);
    const [currentNotification, setCurrentNotification] = useState(0);
    const [arcOffset, setArcOffset] = useState(0);
    const [layerClasses, setLayerClasses] = useState<{
        ArcLayer: typeof import('@deck.gl/layers').ArcLayer | null;
        ScatterplotLayer: typeof import('@deck.gl/layers').ScatterplotLayer | null;
    }>({ ArcLayer: null, ScatterplotLayer: null });

    // Dynamically import deck.gl layers (code splitting)
    useEffect(() => {
        import('@deck.gl/layers').then(({ ArcLayer, ScatterplotLayer }) => {
            setLayerClasses({ ArcLayer, ScatterplotLayer });
        });
    }, []);

    // Rotate notifications
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentNotification((prev) => (prev + 1) % FLOW_NOTIFICATIONS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Animate arc offset for "flow" effect
    useEffect(() => {
        const interval = setInterval(() => {
            setArcOffset((prev) => (prev + 0.02) % 1);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const notification = FLOW_NOTIFICATIONS[currentNotification];

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setShowPanel(true);
        try {
            // Check cache first
            const cacheRes = await fetch('http://localhost:8000/api/analyze/fx/cached?language=en&selected_pair=USD/KRW');
            const cacheData = await cacheRes.json();
            if (cacheData.cached && cacheData.result) {
                setAnalysisResult(cacheData.result);
                setIsAnalyzing(false);
                return;
            }

            // If no cache, request new analysis
            const response = await fetch('http://localhost:8000/api/analyze/fx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dollar_index: 104.5,
                    dollar_trend: 'strengthening',
                    selected_pair: 'USD/KRW',
                    risk_sentiment: 'neutral',
                    language: 'en'
                })
            });
            const data = await response.json();
            setAnalysisResult(data);
        } catch (error) {
            console.error('Analysis failed:', error);
            setAnalysisResult({
                topic: 'fx',
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

    // Create Deck.gl layers (memoized, only when layer classes are loaded)
    const layers = useMemo(() => {
        const { ArcLayer, ScatterplotLayer } = layerClasses;
        if (!ArcLayer || !ScatterplotLayer) return [];

        return [
            // 1. Connection Arcs (Flows)
            new ArcLayer<CurrencyFlow>({
                id: 'currency-arcs',
                data: FLOWS,
                getSourcePosition: d => {
                    const node = NODES.find(n => n.id === d.source);
                    return node ? node.coordinates : [0, 0];
                },
                getTargetPosition: d => {
                    const node = NODES.find(n => n.id === d.target);
                    return node ? node.coordinates : [0, 0];
                },
                getSourceColor: d => {
                    const node = NODES.find(n => n.id === d.source);
                    return node ? [...node.color, 180] : [255, 255, 255, 100];
                },
                getTargetColor: d => {
                    const node = NODES.find(n => n.id === d.target);
                    return node ? [...node.color, 255] : [255, 255, 255, 200];
                },
                getWidth: d => Math.max(1, d.value / 10), // Width based on volume
                getHeight: 0.5, // 2D flat looking, lower arcs
            }),

            // 2. Nodes (Financial Centers)
            new ScatterplotLayer<CurrencyNode>({
                id: 'financial-centers',
                data: NODES,
                getPosition: d => d.coordinates,
                getRadius: d => d.importance * 30000, // Scale by importance
                getFillColor: d => [...d.color, 200],
                getLineColor: [0, 0, 0],
                getLineWidth: 2000,
                stroked: true,
                pickable: true,
                autoHighlight: true,
            })
        ];
    }, [layerClasses]);

    return (
        <div className="h-full w-full relative bg-[#050505] flex flex-col">
            {/* Page Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none bg-gradient-to-b from-[#050505] via-[#050505]/80 to-transparent">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
                            <span className="text-blue-500">GLOBAL_LIQUIDITY_MAP</span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">LIVE</span>
                        </h1>
                        <p className="text-[10px] text-gray-500 mt-1">
                            "Money flows to higher rates and safer havens"
                        </p>
                        <div className="flex gap-4 mt-2 text-[10px] text-gray-400 font-mono">
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>Risk Off</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>Risk On</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-500"></span>Neutral</div>
                        </div>
                    </div>

                    {/* Live Capital Flow Notification */}
                    <div className="pointer-events-auto">
                        <div className="px-4 py-3 bg-black/60 backdrop-blur-xl border border-amber-500/30 rounded-xl shadow-lg shadow-amber-500/10 animate-pulse min-w-[240px]">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase">Live Capital Flow</p>
                                    <p className="text-sm text-white font-medium">
                                        <span className="text-amber-400 font-bold">{notification.amount}</span>
                                        {' '}{notification.from} → {notification.to}
                                    </p>
                                    <p className="text-[9px] text-gray-500 mt-0.5">
                                        {notification.icon} {notification.type}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                <DeckGL
                    initialViewState={{
                        longitude: 127, // 대한민국 중심 (태평양)
                        latitude: 35,
                        zoom: 2,
                        pitch: 0,
                        bearing: 0
                    }}
                    controller={true}
                    layers={layers}
                    style={{ background: '#050505' }}
                >
                    <Map
                        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json"
                        reuseMaps
                        attributionControl={false}
                    />
                </DeckGL>
            </div>

            {/* Overlay Stats Panel */}
            <div className="absolute bottom-4 left-4 z-10 w-72 bg-[#111116]/95 border border-[#27272a] rounded-lg p-3 shadow-2xl backdrop-blur-sm">
                <div className="text-[10px] font-bold text-gray-500 mb-2 border-b border-[#27272a] pb-1 flex items-center justify-between">
                    <span>TOP FLOWS (24H)</span>
                    <span className="text-[9px] text-blue-400">Korea-centric view</span>
                </div>
                <div className="space-y-1.5">
                    {FLOWS.slice(0, 5).map((f) => (
                        <div key={`${f.source}-${f.target}`} className="flex justify-between items-center text-xs font-mono p-1.5 rounded hover:bg-[#27272a]/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    f.sentiment === 'risk_off' ? 'bg-blue-500' :
                                    f.sentiment === 'risk_on' ? 'bg-amber-500' : 'bg-gray-500'
                                }`}></span>
                                <span className="text-gray-300">{f.source} → {f.target}</span>
                            </div>
                            <span className={f.sentiment === 'risk_off' ? 'text-blue-400' : f.sentiment === 'risk_on' ? 'text-amber-400' : 'text-gray-400'}>
                                ${f.value}B
                            </span>
                        </div>
                    ))}
                </div>

                {/* Money Flow Insight */}
                <div className="mt-3 pt-3 border-t border-[#27272a]">
                    <div className="text-[10px] font-bold text-amber-500 mb-2 flex items-center gap-1">
                        <span>💡</span> INSIGHT
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        Capital flows from Korea to US intensifying. Risk-off sentiment dominates as investors seek safety in US Treasuries. JPY carry trade unwinding signals broader EM stress.
                    </p>
                </div>

                {/* Legend */}
                <div className="mt-3 pt-3 border-t border-[#27272a]">
                    <div className="text-[9px] text-gray-500 flex flex-wrap gap-3">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Risk Off
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Risk On
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-gray-500"></span> Neutral
                        </span>
                    </div>
                </div>
            </div>

            {/* AI Analysis Trigger Button */}
            <div className="absolute bottom-4 right-4 z-10">
                <AnalysisTriggerButton
                    onAnalyze={handleAnalyze}
                    isAnalyzing={isAnalyzing}
                    buttonText="Analyze FX Flows"
                    subText="Get AI insights on global currency movements"
                />
            </div>

            {/* Analysis Panel */}
            <AnalysisPanel
                isOpen={showPanel}
                onClose={() => setShowPanel(false)}
                result={analysisResult}
                isLoading={isAnalyzing}
                topic="Currency Flow Analysis"
            />
        </div>
    );
}
