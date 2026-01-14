"use client";

import { useState } from "react";

const DEFAULT_SCENARIO = `## Market Situation: Strong Dollar (Jan 2026)

**Data Points:**
- USD/JPY: 158.00 (+0.45%)
- US10Y: 4.802% (+2.1bps)
- BTC/USD: $105,240
- S&P 500: 6,200 (ATH)

**Analysis Request:**
Capital flowing from Asia -> US assets. Sustainable trend or reversal imminent? Portfolio allocation strategy?`;

interface ScenarioInputProps {
    onSubmit: (scenario: string) => void;
    isLoading: boolean;
}

export default function ScenarioInput({ onSubmit, isLoading }: ScenarioInputProps) {
    const [scenario, setScenario] = useState(DEFAULT_SCENARIO);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (scenario.trim()) onSubmit(scenario);
    };

    return (
        <div className="w-full max-w-xl mx-auto trading-panel p-1">
            {/* Header Bar */}
            <div className="px-4 py-3 border-b border-[#27272a] flex justify-between items-center bg-[#18181b] rounded-t-md">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">System Ready</span>
                </div>
                <div className="text-xs text-gray-500 font-mono">INSIGHT_FLOW_V1.0</div>
            </div>

            <div className="p-5">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-white mb-1">Macro Scenario Input</h2>
                    <p className="text-xs text-gray-400">Enter market parameters for multi-agent board analysis.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Quick Actions */}
                    <div className="flex gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => setScenario(DEFAULT_SCENARIO)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-[#27272a] hover:bg-[#3f3f46] rounded border border-transparent hover:border-gray-500 transition-all"
                        >
                            Load Default
                        </button>
                        <button
                            type="button"
                            onClick={() => setScenario("")}
                            className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-[#27272a] hover:bg-[#3f3f46] rounded border border-transparent hover:border-gray-500 transition-all"
                        >
                            Clear
                        </button>
                    </div>

                    {/* Editor Area */}
                    <div className="relative group">
                        <textarea
                            value={scenario}
                            onChange={(e) => setScenario(e.target.value)}
                            className="w-full h-48 trading-input rounded-md p-4 text-sm font-mono text-gray-200 resize-none focus:ring-1 focus:ring-blue-500/50"
                            placeholder="// Enter scenario data here..."
                            disabled={isLoading}
                        />
                        <div className="absolute bottom-3 right-3 text-[10px] text-gray-600 font-mono">
                            {scenario.length} chars
                        </div>
                    </div>

                    {/* Submit Action */}
                    <button
                        type="submit"
                        disabled={isLoading || !scenario.trim()}
                        className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-sm font-semibold rounded-md transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                <span>PROCESSING...</span>
                            </>
                        ) : (
                            <>
                                <span>EXECUTE ANALYSIS</span>
                                <span className="text-xs opacity-70">⏎</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Board Status */}
                <div className="mt-5 pt-4 border-t border-[#27272a]">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">Board Status</span>
                        <span className="text-[10px] text-emerald-500 font-mono">ONLINE</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                        {[
                            { n: "Musk", r: "Ready", c: "bg-orange-500" },
                            { n: "Buffett", r: "Ready", c: "bg-blue-500" },
                            { n: "Thiel", r: "Ready", c: "bg-purple-500" }
                        ].map((agent) => (
                            <div key={agent.n} className="flex-1 bg-[#18181b] rounded p-2 border border-[#27272a] flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${agent.c}`}></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-300 font-bold">{agent.n}</span>
                                    <span className="text-[9px] text-gray-600">{agent.r}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
