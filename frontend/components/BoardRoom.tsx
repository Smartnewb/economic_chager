"use client";

import { useDebateStore } from "@/store/debateStore";
import { useEffect, useRef } from "react";

const AGENTS = [
    { key: "musk", name: "ELON_MUSK", role: "Innovator", color: "text-orange-500", border: "border-orange-500/50" },
    { key: "buffett", name: "WARREN_BUFFETT", role: "Value", color: "text-blue-500", border: "border-blue-500/50" },
    { key: "thiel", name: "PETER_THIEL", role: "Contrarian", color: "text-purple-500", border: "border-purple-500/50" },
];

interface BoardRoomProps {
    onNewScenario: () => void;
}

export default function BoardRoom({ onNewScenario }: BoardRoomProps) {
    const { result, isLoading, currentAgent } = useDebateStore();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [result, currentAgent]);

    return (
        <div className="trading-panel h-full flex flex-col overflow-hidden font-mono text-sm">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#18181b] border-b border-[#27272a]">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400">BOARD_ROOM_LOGS</span>
                    {isLoading && <span className="text-emerald-500 animate-pulse">● REC</span>}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onNewScenario}
                        className="px-2 py-1 text-xs bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 rounded transition-colors"
                    >
                        + NEW SESSION
                    </button>
                </div>
            </div>

            {/* Log Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#050505]">

                {/* Waiting State */}
                {isLoading && !result && (
                    <div className="space-y-2 opacity-70">
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <span>{new Date().toLocaleTimeString()}</span>
                            <span className="text-blue-500">SYSTEM</span>
                            <span>Initializing Multi-Agent Protocol...</span>
                        </div>
                        {currentAgent && (
                            <div className="flex items-center gap-2 text-gray-300 animate-pulse">
                                <span className="text-xs">»</span>
                                <span>Awaiting analysis from {AGENTS.find(a => a.key === currentAgent)?.name}...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Results Stream */}
                {result && (
                    <div className="space-y-6">
                        {/* Original Query */}
                        <div className="border-l-2 border-gray-700 pl-3 py-1">
                            <div className="text-[10px] text-gray-500 mb-1">INPUT SCENARIO</div>
                            <div className="text-gray-400 text-xs line-clamp-2 italic">
                                {/* We might need to store the scenario string in result to show it fully, 
                       for now just showing a static indicator or using store if available */}
                                {/* Assuming result might have scenario text or we just reference 'Current Market Data' */}
                                Analysis on: Macro Market Data
                            </div>
                        </div>

                        {/* Agent Outputs */}
                        {AGENTS.map((agent) => {
                            const response = result[`${agent.key}_response` as keyof typeof result];
                            if (!response) return null;

                            return (
                                <div key={agent.key} className={`relative pl-4 border-l ${agent.border} animate-slide-in`}>
                                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-[#050505] border border-gray-700"></div>
                                    <div className="flex items-baseline justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${agent.color}`}>{agent.name}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181b] text-gray-500 uppercase">{agent.role}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-600 font-mono">200ms</span>
                                    </div>
                                    <div className="text-gray-300 leading-relaxed text-xs">
                                        {response}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Synthesis Output */}
                        {result.synthesis && (
                            <div className="mt-6 bg-[#111116] border border-yellow-500/20 rounded p-4 animate-slide-in">
                                <div className="flex items-center gap-2 mb-2 text-yellow-500 text-xs font-bold uppercase tracking-wider">
                                    <span className="animate-pulse">⚡</span> Consensus Synthesis
                                </div>
                                <div className="text-gray-300 text-xs leading-relaxed prose prose-invert prose-sm max-w-none">
                                    {result.synthesis}
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <div className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded">RISK DETECTED</div>
                                    <div className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">OPPORTUNITY: HIGH</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
