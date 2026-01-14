"use client";

import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Navigation from '@/components/Navigation';

interface YieldCurveData {
    maturity: string;
    us?: number;
    de?: number;
    jp?: number;
    gb?: number;
}

interface GlobalBondYield {
    country: string;
    yield_10y: number;
    change_1d: number;
    trend: string;
}

export default function BondsPage() {
    const [yieldData, setYieldData] = useState<YieldCurveData[]>([]);
    const [globalYields, setGlobalYields] = useState<GlobalBondYield[]>([]);
    const [loading, setLoading] = useState(true);
    const [spreadValue, setSpreadValue] = useState<number | null>(null);

    useEffect(() => {
        fetchBondData();
    }, []);

    const fetchBondData = async () => {
        try {
            setLoading(true);
            const [yieldsRes, globalRes] = await Promise.all([
                fetch('http://localhost:8000/api/bonds/yields'),
                fetch('http://localhost:8000/api/bonds/global')
            ]);

            const yieldsData = await yieldsRes.json();
            const globalData = await globalRes.json();

            // Transform yield curve data from new format
            if (yieldsData.current_curve && yieldsData.current_curve.data) {
                const transformed: YieldCurveData[] = yieldsData.current_curve.data.map((item: any) => ({
                    maturity: item.maturity,
                    us: item.yield_value
                }));
                setYieldData(transformed);

                // Calculate 10Y-2Y spread
                const y10Item = yieldsData.current_curve.data.find((d: any) => d.maturity === '10Y');
                const y2Item = yieldsData.current_curve.data.find((d: any) => d.maturity === '2Y');
                if (y10Item && y2Item) {
                    setSpreadValue((y10Item.yield_value - y2Item.yield_value) * 100);
                }
            }

            setGlobalYields(globalData.global_yields || []);
        } catch (error) {
            console.error('Failed to fetch bond data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-gray-400">Loading bond data...</div>
            </main>
        );
    }

    return (
        <main className="h-screen w-screen bg-[#050505] text-white overflow-hidden flex flex-col">
            <Navigation />

            <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Main Yield Curve Chart */}
                <div className="col-span-1 lg:col-span-2 bg-[#111116] border border-[#27272a] rounded p-4 h-[400px]">
                    <h2 className="text-sm font-bold text-gray-300 mb-4 flex justify-between">
                        <span>US TREASURY YIELD CURVE</span>
                        <span className="text-[10px] text-gray-500">LIVE RATES</span>
                    </h2>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={yieldData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="maturity" stroke="#52525b" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#52525b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '12px' }}
                                itemStyle={{ color: '#e4e4e7' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="us" name="US Treasury" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Spread Monitor */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-4">
                    <h2 className="text-sm font-bold text-gray-300 mb-2">US 10Y-2Y SPREAD</h2>
                    {spreadValue !== null && (
                        <>
                            <div className={`text-xl font-bold mb-4 ${spreadValue < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {spreadValue.toFixed(0)}bps
                                <span className="text-xs text-gray-500 font-normal ml-2">
                                    {spreadValue < 0 ? 'INVERTED' : 'NORMAL'}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400 p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                                {spreadValue < 0
                                    ? '⚠️ Inverted yield curve often signals recession risk'
                                    : '✅ Normal yield curve suggests economic expansion'}
                            </div>
                        </>
                    )}
                </div>

                {/* Key Rates Table */}
                <div className="bg-[#111116] border border-[#27272a] rounded p-4 overflow-auto">
                    <h2 className="text-sm font-bold text-gray-300 mb-4">GLOBAL BENCHMARK RATES</h2>
                    <table className="w-full text-xs text-left">
                        <thead>
                            <tr className="text-gray-500 border-b border-[#27272a]">
                                <th className="py-2">Country</th>
                                <th className="py-2 text-right">10Y Yield</th>
                                <th className="py-2 text-right">Change</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300 font-mono">
                            {globalYields.map((bond, i) => (
                                <tr key={i} className="border-b border-[#27272a]/50 hover:bg-[#27272a]">
                                    <td className="py-2">{bond.country}</td>
                                    <td className="py-2 text-right text-emerald-400">{bond.yield_10y.toFixed(2)}%</td>
                                    <td className={`py-2 text-right ${bond.change_1d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {bond.change_1d >= 0 ? '+' : ''}{bond.change_1d.toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
