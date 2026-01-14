"use client";

import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { ArcLayer, ScatterplotLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';

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

    // Create Deck.gl layers
    const layers = [
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

    return (
        <div className="h-full w-full relative bg-[#050505] flex flex-col">
            {/* Page Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none bg-gradient-to-b from-[#050505] to-transparent">
                <h1 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
                    <span className="text-blue-500">GLOBAL_LIQUIDITY_MAP</span>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">LIVE</span>
                </h1>
                <div className="flex gap-4 mt-2 text-[10px] text-gray-400 font-mono">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>JPY Flow Out</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>USD Inflow</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span>GBP Neutral</div>
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
            <div className="absolute bottom-4 left-4 z-10 w-64 bg-[#111116] border border-[#27272a] rounded p-3 shadow-2xl backdrop-blur-sm">
                <div className="text-[10px] font-bold text-gray-500 mb-2 border-b border-[#27272a] pb-1">TOP FLOWS (24H)</div>
                <div className="space-y-1">
                    {FLOWS.slice(0, 5).map((f) => (
                        <div key={`${f.source}-${f.target}`} className="flex justify-between items-center text-xs font-mono">
                            <span className="text-gray-300">{f.source} → {f.target}</span>
                            <span className={f.sentiment === 'risk_off' ? 'text-blue-400' : 'text-amber-400'}>
                                ${f.value}B
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
