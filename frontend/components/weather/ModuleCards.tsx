"use client";

import Link from "next/link";
import { useWeatherStore, ModuleSummary } from "@/store/weatherStore";
import { useI18n } from "@/lib/i18n";

// Module configuration with icons and colors
const moduleConfig: Record<string, {
    icon: React.ReactNode;
    gradient: string;
    hoverGradient: string;
    question: string;
}> = {
    fx: {
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        ),
        gradient: "from-yellow-500/20 to-orange-500/20",
        hoverGradient: "hover:from-yellow-500/30 hover:to-orange-500/30",
        question: "Where is the money going?"
    },
    bonds: {
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" d="M12 8v8m-4-4h8" />
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
            </svg>
        ),
        gradient: "from-blue-500/20 to-cyan-500/20",
        hoverGradient: "hover:from-blue-500/30 hover:to-cyan-500/30",
        question: "Is it safe to invest now?"
    },
    stocks: {
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        ),
        gradient: "from-green-500/20 to-emerald-500/20",
        hoverGradient: "hover:from-green-500/30 hover:to-emerald-500/30",
        question: "Which industries are winning?"
    },
    policy: {
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeWidth="2" d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
                <circle cx="12" cy="12" r="4" strokeWidth="2" />
            </svg>
        ),
        gradient: "from-red-500/20 to-pink-500/20",
        hoverGradient: "hover:from-red-500/30 hover:to-pink-500/30",
        question: "Are they printing or burning money?"
    },
    economy: {
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        gradient: "from-amber-500/20 to-yellow-500/20",
        hoverGradient: "hover:from-amber-500/30 hover:to-yellow-500/30",
        question: "How is the real economy doing?"
    },
    history: {
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2" />
            </svg>
        ),
        gradient: "from-purple-500/20 to-violet-500/20",
        hoverGradient: "hover:from-purple-500/30 hover:to-violet-500/30",
        question: "Have we seen this before?"
    }
};

// Status indicator styles
const statusStyles = {
    bullish: { color: "text-green-400", bg: "bg-green-500", label: "Bullish" },
    bearish: { color: "text-red-400", bg: "bg-red-500", label: "Bearish" },
    neutral: { color: "text-gray-400", bg: "bg-gray-500", label: "Neutral" },
    warning: { color: "text-amber-400", bg: "bg-amber-500", label: "Caution" }
};

interface ModuleCardProps {
    module: ModuleSummary;
}

function ModuleCard({ module }: ModuleCardProps) {
    const config = moduleConfig[module.id] || moduleConfig.fx;
    const status = statusStyles[module.status];

    return (
        <Link href={module.href}>
            <div className={`
                group relative p-6 rounded-2xl
                bg-gradient-to-br ${config.gradient} ${config.hoverGradient}
                border border-white/10 hover:border-white/20
                transition-all duration-300 cursor-pointer
                hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20
            `}>
                {/* Status Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status.bg} animate-pulse`} />
                    <span className={`text-xs font-medium ${status.color}`}>
                        {status.label}
                    </span>
                </div>

                {/* Icon */}
                <div className="mb-4 text-white/80 group-hover:text-white transition-colors">
                    {config.icon}
                </div>

                {/* User-Friendly Name */}
                <h3 className="text-lg font-bold text-white mb-1">
                    {module.userFriendlyName}
                </h3>

                {/* Technical Name (smaller) */}
                <p className="text-xs text-gray-500 mb-3">
                    {module.name}
                </p>

                {/* One-liner Summary */}
                <p className="text-sm text-gray-300 mb-4 min-h-[40px]">
                    {module.oneLiner}
                </p>

                {/* Question it answers */}
                <div className="pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-500 italic">
                        "{config.question}"
                    </p>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}

export default function ModuleCards() {
    const { moduleSummaries, isLoading } = useWeatherStore();
    const { t } = useI18n();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
                        <div className="w-8 h-8 bg-white/10 rounded-lg mb-4" />
                        <div className="h-5 bg-white/10 rounded w-2/3 mb-2" />
                        <div className="h-3 bg-white/10 rounded w-1/3 mb-4" />
                        <div className="h-4 bg-white/10 rounded w-full mb-2" />
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">
                        Explore the Dashboard
                    </h2>
                    <p className="text-sm text-gray-400">
                        Click any card to dive deeper
                    </p>
                </div>

                {/* Quick Legend */}
                <div className="hidden md:flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-400">Bullish</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-gray-400">Bearish</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-gray-400">Caution</span>
                    </div>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moduleSummaries.map((module) => (
                    <ModuleCard key={module.id} module={module} />
                ))}
            </div>
        </div>
    );
}
