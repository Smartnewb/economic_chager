"use client";

import { EconomicEvent, CPIData } from "@/store/economyStore";

// Get impact color
const getImpactColor = (impact: "high" | "medium" | "low") => {
    switch (impact) {
        case "high":
            return { bg: "bg-red-500/20", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-500" };
        case "medium":
            return { bg: "bg-yellow-500/20", border: "border-yellow-500/30", text: "text-yellow-400", dot: "bg-yellow-500" };
        default:
            return { bg: "bg-green-500/20", border: "border-green-500/30", text: "text-green-400", dot: "bg-green-500" };
    }
};

// Get category icon
const getCategoryIcon = (category: string) => {
    switch (category) {
        case "inflation":
            return "📊";
        case "employment":
            return "👷";
        case "growth":
            return "📈";
        case "manufacturing":
            return "🏭";
        case "trade":
            return "🚢";
        case "policy":
            return "🏛️";
        default:
            return "📋";
    }
};

// Calculate days until event
const getDaysUntil = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Format date
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", weekday: "short" };
    return date.toLocaleDateString("en-US", options);
};

// Single event row
const EventRow = ({ event }: { event: EconomicEvent }) => {
    const impactColor = getImpactColor(event.impact);
    const daysUntil = getDaysUntil(event.date);
    const icon = getCategoryIcon(event.category);

    const isToday = daysUntil === 0;
    const isTomorrow = daysUntil === 1;
    const isUpcoming = daysUntil <= 3;

    return (
        <div
            className={`p-4 rounded-xl border transition-all ${
                isToday
                    ? "bg-purple-500/10 border-purple-500/30"
                    : isUpcoming
                    ? "bg-white/5 border-white/20"
                    : "bg-black/30 border-white/10"
            }`}
        >
            <div className="flex items-start justify-between gap-4">
                {/* Left: Event info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{event.flag}</span>
                        <span className="text-lg">{icon}</span>
                        <h4 className="font-bold text-white">{event.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">{event.country}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">{event.time}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${impactColor.bg} ${impactColor.text} border ${impactColor.border}`}>
                            {event.impact.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Center: Forecast vs Previous */}
                <div className="flex gap-4 text-sm">
                    {event.forecast !== undefined && (
                        <div className="text-center">
                            <div className="text-xs text-gray-500">Forecast</div>
                            <div className="text-white font-medium">{event.forecast}{event.unit}</div>
                        </div>
                    )}
                    {event.previous !== undefined && (
                        <div className="text-center">
                            <div className="text-xs text-gray-500">Previous</div>
                            <div className="text-gray-400">{event.previous}{event.unit}</div>
                        </div>
                    )}
                    {event.actual !== undefined && (
                        <div className="text-center">
                            <div className="text-xs text-gray-500">Actual</div>
                            <div className={`font-bold ${
                                event.actual > (event.forecast || event.previous || 0) ? "text-green-400" : "text-red-400"
                            }`}>
                                {event.actual}{event.unit}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Date/countdown */}
                <div className="text-right min-w-[80px]">
                    <div className={`text-lg font-bold ${
                        isToday ? "text-purple-400" :
                        isTomorrow ? "text-yellow-400" :
                        isUpcoming ? "text-blue-400" : "text-gray-400"
                    }`}>
                        {isToday ? "TODAY" : isTomorrow ? "TOMORROW" : `D-${daysUntil}`}
                    </div>
                    <div className="text-xs text-gray-500">{formatDate(event.date)}</div>
                </div>
            </div>
        </div>
    );
};

// CPI Card with target comparison
const CPICard = ({ data }: { data: CPIData }) => {
    const deviation = data.value - data.targetRate;
    const isAbove = deviation > 0;

    return (
        <div className={`p-4 rounded-xl border ${
            isAbove ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"
        }`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{data.flag}</span>
                    <div>
                        <h4 className="font-bold text-white text-sm">{data.country}</h4>
                        <p className="text-xs text-gray-500">CPI (YoY)</p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                    isAbove ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                }`}>
                    {isAbove ? "🔥 Above Target" : "✅ At/Below Target"}
                </div>
            </div>

            {/* Value and target visualization */}
            <div className="mb-3">
                <div className="flex items-end gap-2">
                    <span className={`text-3xl font-black ${isAbove ? "text-red-400" : "text-green-400"}`}>
                        {data.value}%
                    </span>
                    <span className="text-sm text-gray-500 mb-1">
                        vs {data.targetRate}% target
                    </span>
                </div>

                {/* Visual bar */}
                <div className="mt-2 relative h-3 bg-white/10 rounded-full overflow-hidden">
                    {/* Target marker */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                        style={{ left: `${Math.min(100, (data.targetRate / 6) * 100)}%` }}
                    />
                    {/* Value bar */}
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isAbove ? "bg-red-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(100, (data.value / 6) * 100)}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>Target: {data.targetRate}%</span>
                    <span>6%+</span>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-black/30 rounded">
                    <div className="text-gray-500">Previous</div>
                    <div className="text-white font-medium">{data.previousValue}%</div>
                </div>
                <div className="text-center p-2 bg-black/30 rounded">
                    <div className="text-gray-500">Change</div>
                    <div className={data.change >= 0 ? "text-red-400" : "text-green-400"}>
                        {data.change > 0 ? "+" : ""}{data.change}%
                    </div>
                </div>
                <div className="text-center p-2 bg-black/30 rounded">
                    <div className="text-gray-500">Surprise</div>
                    <div className={data.surprise < 0 ? "text-green-400" : "text-red-400"}>
                        {data.surprise > 0 ? "+" : ""}{data.surprise}%
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main component
interface EconomicCalendarProps {
    events: EconomicEvent[];
    cpiData: CPIData[];
}

export default function EconomicCalendar({ events, cpiData }: EconomicCalendarProps) {
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date));

    // Filter high impact events
    const highImpactEvents = sortedEvents.filter((e) => e.impact === "high");

    return (
        <div className="space-y-6">
            {/* CPI Overview */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    📊 글로벌 인플레이션 현황 (CPI)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cpiData.map((cpi) => (
                        <CPICard key={cpi.countryCode} data={cpi} />
                    ))}
                </div>
            </div>

            {/* High Impact Events */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    🔥 주요 경제 지표 발표 일정
                    <span className="text-sm font-normal text-gray-400">
                        ({highImpactEvents.length} High Impact)
                    </span>
                </h3>

                {/* Event List */}
                <div className="space-y-3">
                    {sortedEvents.map((event) => (
                        <EventRow key={event.id} event={event} />
                    ))}
                </div>
            </div>

            {/* Impact Legend */}
            <div className="flex justify-center gap-6 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-gray-400">High Impact</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-gray-400">Medium Impact</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-gray-400">Low Impact</span>
                </div>
            </div>
        </div>
    );
}
