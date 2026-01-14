"use client";

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { AnalysisTriggerButton, AnalysisPanel, AnalysisResult } from '@/components/ui';

interface CentralBank {
    country: string;
    code: string;
    flag: string;
    bank: string;
    current_rate: number;
    previous_rate: number;
    inflation_rate: number;
    real_rate: number;
    status: string;
    cycle_position: number;
    last_change: string;
    last_meeting_date: string;
    next_meeting_date: string;
}

interface UpcomingMeeting {
    country: string;
    flag: string;
    bank: string;
    date: string;
    days_until: number;
    expected_action: string;
    market_probability: number;
}

export default function PolicyPage() {
    const [banks, setBanks] = useState<CentralBank[]>([]);
    const [meetings, setMeetings] = useState<UpcomingMeeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [showPanel, setShowPanel] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPolicyData();
    }, []);

    const fetchPolicyData = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/policy/global');
            const data = await response.json();
            setBanks(data.central_banks || []);
            setMeetings(data.upcoming_meetings || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch policy data:', err);
            setError('Failed to connect to backend. Please ensure the server is running on port 8000.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'hiking') return 'bg-red-900/30 text-red-400';
        if (status === 'cutting') return 'bg-blue-900/30 text-blue-400';
        if (status === 'paused') return 'bg-amber-900/30 text-amber-400';
        return 'bg-gray-700/30 text-gray-300';
    };

    const getStatusLabel = (status: string) => {
        if (status === 'hiking') return '🔺 Hiking';
        if (status === 'cutting') return '🔻 Cutting';
        if (status === 'paused') return '⏸️ Paused';
        return status;
    };

    // Calculate cycle position based on status (0-100)
    const getCyclePosition = (bank: CentralBank): number => {
        // cycle_position from API if available, otherwise derive from status
        if (bank.cycle_position !== undefined && bank.cycle_position !== null) {
            return bank.cycle_position;
        }
        switch (bank.status) {
            case 'hiking': return 25;  // Early hiking phase
            case 'paused': return 50;  // Peak
            case 'cutting': return 75; // Cutting phase
            default: return 50;
        }
    };

    // Generate sine wave path for the rate cycle
    const generateCyclePath = () => {
        const points: string[] = [];
        const width = 800;
        const height = 150;
        const amplitude = 50;
        const centerY = height / 2;

        for (let x = 0; x <= width; x += 2) {
            const progress = x / width;
            const y = centerY - amplitude * Math.sin(progress * Math.PI * 2);
            points.push(`${x},${y}`);
        }
        return `M ${points.join(' L ')}`;
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setShowPanel(true);
        try {
            // Check cache first
            const cacheRes = await fetch('http://localhost:8000/api/analyze/policy/cached?language=en');
            const cacheData = await cacheRes.json();
            if (cacheData.cached && cacheData.result) {
                setAnalysisResult(cacheData.result);
                setIsAnalyzing(false);
                return;
            }

            // If no cache, request new analysis
            const fedBank = banks.find(b => b.country === 'US');
            const response = await fetch('http://localhost:8000/api/analyze/policy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fed_rate: fedBank?.current_rate || 5.25,
                    fed_bias: fedBank?.status || 'neutral',
                    policy_phase: 'peak',
                    language: 'en'
                })
            });
            const data = await response.json();
            setAnalysisResult(data);
        } catch (error) {
            console.error('Analysis failed:', error);
            setAnalysisResult({
                topic: 'policy',
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

    if (loading) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-gray-400">Loading policy data...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="h-screen w-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 mb-4">{error}</div>
                    <button
                        onClick={fetchPolicyData}
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

            <div className="flex-1 p-6 overflow-y-auto">
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-3xl">🏛️</span> GLOBAL MONETARY POLICY
                </h1>

                {/* Rate Cycle Clock */}
                <div className="mb-6 bg-[#111116] border border-[#27272a] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            🔄 RATE CYCLE CLOCK
                            <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">
                                Global Monetary Cycle
                            </span>
                        </h2>
                        <div className="flex items-center gap-4 text-[10px] text-gray-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Hiking</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> Peak/Paused</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Cutting</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Low/Trough</span>
                        </div>
                    </div>

                    {/* Sine Wave Cycle Visualization */}
                    <div className="relative h-[180px] w-full">
                        <svg viewBox="0 0 800 150" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                            {/* Background Grid */}
                            <defs>
                                <linearGradient id="cycleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                                    <stop offset="25%" stopColor="#ef4444" stopOpacity="0.3" />
                                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
                                    <stop offset="75%" stopColor="#3b82f6" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
                                </linearGradient>
                            </defs>

                            {/* Cycle Phase Labels */}
                            <text x="50" y="20" fill="#71717a" fontSize="10" textAnchor="middle">LOW</text>
                            <text x="200" y="20" fill="#ef4444" fontSize="10" textAnchor="middle">HIKING</text>
                            <text x="400" y="20" fill="#f59e0b" fontSize="10" textAnchor="middle">PEAK</text>
                            <text x="600" y="20" fill="#3b82f6" fontSize="10" textAnchor="middle">CUTTING</text>
                            <text x="750" y="20" fill="#22c55e" fontSize="10" textAnchor="middle">TROUGH</text>

                            {/* Center Line */}
                            <line x1="0" y1="75" x2="800" y2="75" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />

                            {/* Sine Wave Path */}
                            <path
                                d={generateCyclePath()}
                                fill="none"
                                stroke="url(#cycleGradient)"
                                strokeWidth="3"
                            />

                            {/* Country Flags on the Cycle */}
                            {banks.slice(0, 8).map((bank, index) => {
                                const position = getCyclePosition(bank);
                                const x = (position / 100) * 800;
                                const progress = position / 100;
                                const y = 75 - 50 * Math.sin(progress * Math.PI * 2);
                                const statusColor = bank.status === 'hiking' ? '#ef4444' :
                                    bank.status === 'cutting' ? '#3b82f6' : '#f59e0b';

                                return (
                                    <g key={bank.code}>
                                        {/* Vertical line from point to label */}
                                        <line
                                            x1={x}
                                            y1={y}
                                            x2={x}
                                            y2={y + (index % 2 === 0 ? 25 : -25)}
                                            stroke={statusColor}
                                            strokeWidth="1"
                                            strokeDasharray="2 2"
                                            opacity="0.5"
                                        />
                                        {/* Dot on the curve */}
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="8"
                                            fill={statusColor}
                                            stroke="#0a0a0f"
                                            strokeWidth="2"
                                        />
                                        {/* Flag/Country label */}
                                        <text
                                            x={x}
                                            y={y + (index % 2 === 0 ? 40 : -12)}
                                            fill="#e4e4e7"
                                            fontSize="11"
                                            textAnchor="middle"
                                            fontWeight="bold"
                                        >
                                            {bank.flag} {bank.code}
                                        </text>
                                        <text
                                            x={x}
                                            y={y + (index % 2 === 0 ? 52 : -24)}
                                            fill="#a1a1aa"
                                            fontSize="9"
                                            textAnchor="middle"
                                        >
                                            {bank.current_rate.toFixed(2)}%
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    {/* Cycle Description */}
                    <div className="mt-2 p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                        <p className="text-[11px] text-gray-400">
                            <span className="text-amber-400 font-bold">Cycle Insight:</span>{' '}
                            {banks.filter(b => b.status === 'paused').length > banks.filter(b => b.status === 'hiking').length
                                ? "Most central banks at or near peak rates. Watch for pivot signals."
                                : banks.filter(b => b.status === 'cutting').length > 0
                                ? "Cutting cycle beginning. Easing conditions ahead."
                                : "Hiking cycle continues. Tight monetary policy dominant."
                            }
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banks.map((bank) => (
                        <div key={bank.code} className="bg-[#111116] border border-[#27272a] rounded-lg p-6 relative overflow-hidden group hover:border-blue-500/50 transition-all">
                            <div className="absolute top-0 right-0 p-2 opacity-30 text-5xl select-none group-hover:scale-110 transition-transform">
                                {bank.flag}
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1">{bank.bank}</h3>
                            <div className="text-xs text-gray-500 mb-4">
                                {bank.country} • NEXT: {bank.next_meeting_date}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase">Current Rate</div>
                                    <div className="text-2xl font-mono text-emerald-400 font-bold">
                                        {bank.current_rate.toFixed(2)}%
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase">Status</div>
                                    <div className={`text-sm font-bold mt-1 px-2 py-1 rounded inline-block ${getStatusColor(bank.status)}`}>
                                        {getStatusLabel(bank.status)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase">Inflation</div>
                                    <div className="text-sm font-mono text-amber-400">
                                        {bank.inflation_rate.toFixed(2)}%
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase">Real Rate</div>
                                    <div className={`text-sm font-mono ${bank.real_rate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {bank.real_rate >= 0 ? '+' : ''}{bank.real_rate.toFixed(2)}%
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#27272a]">
                                <div className="text-[10px] text-gray-500 uppercase mb-1">Last Change</div>
                                <div className="text-xs text-gray-300">{bank.last_change} on {bank.last_meeting_date}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Policy Summary */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">🔺 Hiking</div>
                        <div className="text-3xl font-bold text-red-400">
                            {banks.filter(b => b.status === 'hiking').length}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Tightening cycle</div>
                    </div>
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">⏸️ Paused</div>
                        <div className="text-3xl font-bold text-amber-400">
                            {banks.filter(b => b.status === 'paused').length}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Holding rates</div>
                    </div>
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">🔻 Cutting</div>
                        <div className="text-3xl font-bold text-blue-400">
                            {banks.filter(b => b.status === 'cutting').length}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Easing cycle</div>
                    </div>
                    <div className="p-4 bg-[#111116] border border-[#27272a] rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-2">Average Rate</div>
                        <div className="text-3xl font-bold text-emerald-400">
                            {banks.length > 0 ? (banks.reduce((sum, b) => sum + b.current_rate, 0) / banks.length).toFixed(2) : '0.00'}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Global average</div>
                    </div>
                </div>

                {/* Upcoming Meetings */}
                <div className="mt-6 bg-[#111116] border border-[#27272a] rounded p-4">
                    <h2 className="text-sm font-bold text-gray-300 mb-4">📅 UPCOMING CENTRAL BANK MEETINGS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {meetings.slice(0, 6).map((meeting) => (
                            <div key={`${meeting.bank}-${meeting.date}`} className="flex items-center gap-3 p-3 bg-[#0a0a0f] rounded border border-[#27272a]">
                                <span className="text-2xl">{meeting.flag}</span>
                                <div className="flex-1">
                                    <div className="text-sm text-white font-medium">{meeting.country}</div>
                                    <div className="text-xs text-gray-500">{meeting.date}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xs font-bold ${
                                        meeting.expected_action === 'hike' ? 'text-red-400' :
                                        meeting.expected_action === 'cut' ? 'text-blue-400' :
                                        meeting.expected_action === 'hold' ? 'text-amber-400' :
                                        'text-gray-400'
                                    }`}>
                                        {meeting.expected_action.toUpperCase()}
                                    </div>
                                    <div className="text-[10px] text-gray-500">D-{meeting.days_until}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rate Comparison */}
                <div className="mt-6 bg-[#111116] border border-[#27272a] rounded p-4">
                    <h2 className="text-sm font-bold text-gray-300 mb-4">POLICY RATE COMPARISON</h2>
                    <div className="space-y-3">
                        {banks
                            .sort((a, b) => b.current_rate - a.current_rate)
                            .map((bank) => (
                                <div key={bank.code} className="flex items-center gap-3">
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

                {/* AI Analysis Trigger Button */}
                <div className="mt-6 flex justify-center">
                    <AnalysisTriggerButton
                        onAnalyze={handleAnalyze}
                        isAnalyzing={isAnalyzing}
                        isDisabled={loading || banks.length === 0}
                        buttonText="Analyze Central Bank Policy"
                        subText="Get AI insights on monetary policy and rate decisions"
                    />
                </div>
            </div>

            {/* Analysis Panel */}
            <AnalysisPanel
                isOpen={showPanel}
                onClose={() => setShowPanel(false)}
                result={analysisResult}
                isLoading={isAnalyzing}
                topic="Central Bank Policy Analysis"
            />
        </main>
    );
}
