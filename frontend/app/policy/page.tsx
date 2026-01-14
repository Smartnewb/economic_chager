"use client";

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';

interface CentralBank {
    name: string;
    country: string;
    current_rate: number;
    next_meeting: string;
    bias: string;
    recent_action: string;
}

export default function PolicyPage() {
    const [banks, setBanks] = useState<CentralBank[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPolicyData();
    }, []);

    const fetchPolicyData = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/policy/global');
            const data = await response.json();
            setBanks(data.central_banks || []);
        } catch (error) {
            console.error('Failed to fetch policy data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBiasColor = (bias: string) => {
        if (bias.toLowerCase().includes('hawk')) return 'bg-red-900/30 text-red-400';
        if (bias.toLowerCase().includes('dove')) return 'bg-blue-900/30 text-blue-400';
        return 'bg-gray-700/30 text-gray-300';
    };

    if (loading) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-gray-400">Loading policy data...</div>
            </main>
        );
    }

    return (
        <main className="h-screen w-screen bg-[#050505] text-white overflow-hidden flex flex-col">
            <Navigation />

            <div className="flex-1 p-6 overflow-y-auto">
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-3xl">🏛️</span> GLOBAL MONETARY POLICY
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banks.map((bank) => (
                        <div key={bank.name} className="bg-[#111116] border border-[#27272a] rounded-lg p-6 relative overflow-hidden group hover:border-blue-500/50 transition-all">
                            <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl select-none group-hover:scale-110 transition-transform">
                                🏛️
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1">{bank.name}</h3>
                            <div className="text-xs text-gray-500 mb-6">
                                {bank.country} • NEXT: {bank.next_meeting}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase">Current Rate</div>
                                    <div className="text-2xl font-mono text-emerald-400 font-bold">
                                        {bank.current_rate.toFixed(2)}%
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase">Policy Bias</div>
                                    <div className={`text-sm font-bold mt-1 px-2 py-1 rounded inline-block ${getBiasColor(bank.bias)}`}>
                                        {bank.bias}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#27272a]">
                                <div className="text-[10px] text-gray-500 uppercase mb-1">Recent Action</div>
                                <div className="text-xs text-gray-300">{bank.recent_action}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Policy Summary */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">Hawkish Banks</div>
                        <div className="text-3xl font-bold text-red-400">
                            {banks.filter(b => b.bias.toLowerCase().includes('hawk')).length}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Tightening bias</div>
                    </div>
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">Dovish Banks</div>
                        <div className="text-3xl font-bold text-blue-400">
                            {banks.filter(b => b.bias.toLowerCase().includes('dove')).length}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Easing bias</div>
                    </div>
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">Average Rate</div>
                        <div className="text-3xl font-bold text-emerald-400">
                            {(banks.reduce((sum, b) => sum + b.current_rate, 0) / banks.length).toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Global average</div>
                    </div>
                </div>

                {/* Rate Comparison */}
                <div className="mt-6 bg-[#111116] border border-[#27272a] rounded p-4">
                    <h2 className="text-sm font-bold text-gray-300 mb-4">POLICY RATE COMPARISON</h2>
                    <div className="space-y-3">
                        {banks
                            .sort((a, b) => b.current_rate - a.current_rate)
                            .map((bank) => (
                                <div key={bank.name} className="flex items-center gap-3">
                                    <div className="w-32 text-sm text-gray-300 truncate">{bank.country}</div>
                                    <div className="flex-1 h-8 bg-[#27272a] rounded-full overflow-hidden relative">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-end pr-2"
                                            style={{ width: `${Math.min((bank.current_rate / 6) * 100, 100)}%` }}
                                        >
                                            <span className="text-xs font-mono font-bold text-white">
                                                {bank.current_rate.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
