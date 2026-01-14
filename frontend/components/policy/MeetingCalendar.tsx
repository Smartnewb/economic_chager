"use client";

import { usePolicyStore, UpcomingMeeting } from "@/store/policyStore";

// Get urgency color based on days until meeting
const getUrgencyColor = (days: number): string => {
    if (days <= 3) return "#ef4444"; // Red - imminent
    if (days <= 7) return "#f59e0b"; // Orange - this week
    if (days <= 14) return "#eab308"; // Yellow - soon
    return "#22c55e"; // Green - not urgent
};

// Get expected action styling
const getActionStyle = (
    action: string
): { bg: string; text: string; icon: string } => {
    switch (action) {
        case "hike":
            return {
                bg: "bg-red-500/20",
                text: "text-red-400",
                icon: "📈",
            };
        case "cut":
            return {
                bg: "bg-blue-500/20",
                text: "text-blue-400",
                icon: "📉",
            };
        case "hold":
            return {
                bg: "bg-gray-500/20",
                text: "text-gray-400",
                icon: "⏸️",
            };
        default:
            return {
                bg: "bg-yellow-500/20",
                text: "text-yellow-400",
                icon: "❓",
            };
    }
};

// Meeting card component
const MeetingCard = ({
    meeting,
    isHighlighted,
}: {
    meeting: UpcomingMeeting;
    isHighlighted: boolean;
}) => {
    const urgencyColor = getUrgencyColor(meeting.daysUntil);
    const actionStyle = getActionStyle(meeting.expectedAction);

    return (
        <div
            className={`relative p-4 rounded-xl border transition-all duration-300 ${
                isHighlighted
                    ? "bg-white/10 border-purple-500/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
        >
            {/* Urgency indicator */}
            <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                style={{ backgroundColor: urgencyColor }}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-3 pl-2">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{meeting.flag}</span>
                    <div>
                        <div className="font-bold text-white">{meeting.country}</div>
                        <div className="text-xs text-gray-400">{meeting.bank}</div>
                    </div>
                </div>
                {/* D-Day countdown */}
                <div className="text-right">
                    <div
                        className="text-2xl font-bold"
                        style={{ color: urgencyColor }}
                    >
                        D-{meeting.daysUntil}
                    </div>
                    <div className="text-xs text-gray-400">{meeting.date}</div>
                </div>
            </div>

            {/* Expected action */}
            <div className="flex items-center justify-between pl-2">
                <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${actionStyle.bg}`}
                >
                    <span>{actionStyle.icon}</span>
                    <span className={`text-sm font-medium capitalize ${actionStyle.text}`}>
                        Expected: {meeting.expectedAction}
                    </span>
                </div>
                {/* Market probability */}
                <div className="text-right">
                    <div className="text-sm text-gray-400">Market Probability</div>
                    <div className="text-lg font-bold text-white">
                        {meeting.marketProbability}%
                    </div>
                </div>
            </div>
        </div>
    );
};

// Compact timeline view
const TimelineView = ({ meetings }: { meetings: UpcomingMeeting[] }) => {
    const maxDays = Math.max(...meetings.map((m) => m.daysUntil), 60);

    return (
        <div className="relative mt-6 pt-4">
            {/* Timeline bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-white/10 rounded-full">
                {/* Today marker */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                {/* Meeting markers */}
                {meetings.map((meeting) => {
                    const position = (meeting.daysUntil / maxDays) * 100;
                    const urgencyColor = getUrgencyColor(meeting.daysUntil);
                    return (
                        <div
                            key={`${meeting.country}-${meeting.date}`}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                            style={{ left: `${Math.min(position, 98)}%` }}
                        >
                            <div
                                className="w-4 h-4 rounded-full border-2 border-gray-900 cursor-pointer transition-transform hover:scale-125"
                                style={{ backgroundColor: urgencyColor }}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span>{meeting.flag}</span> {meeting.country} - D-
                                {meeting.daysUntil}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Timeline labels */}
            <div className="flex justify-between text-xs text-gray-500 mt-4">
                <span>Today</span>
                <span>1 Week</span>
                <span>2 Weeks</span>
                <span>1 Month</span>
                <span>2 Months</span>
            </div>
        </div>
    );
};

export default function MeetingCalendar() {
    const { upcomingMeetings, isLoadingData, selectedCountry } = usePolicyStore();

    if (isLoadingData) {
        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Meeting Calendar
                </h3>
                <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">
                        Loading calendar...
                    </div>
                </div>
            </div>
        );
    }

    // Next 3 meetings
    const nextMeetings = upcomingMeetings.slice(0, 6);
    const nextMeeting = nextMeetings[0];

    return (
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        📅 Meeting Calendar
                    </h3>
                    <p className="text-sm text-gray-400">
                        Central bank decision dates
                    </p>
                </div>
                {nextMeeting && (
                    <div className="text-right">
                        <div className="text-xs text-gray-400">Next Decision</div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{nextMeeting.flag}</span>
                            <span
                                className="text-xl font-bold"
                                style={{
                                    color: getUrgencyColor(nextMeeting.daysUntil),
                                }}
                            >
                                D-{nextMeeting.daysUntil}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Featured next meeting */}
            {nextMeeting && (
                <div
                    className="mb-6 p-4 rounded-xl border-2"
                    style={{
                        borderColor: getUrgencyColor(nextMeeting.daysUntil),
                        backgroundColor: `${getUrgencyColor(nextMeeting.daysUntil)}10`,
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">{nextMeeting.flag}</span>
                            <div>
                                <div className="text-xl font-bold text-white">
                                    {nextMeeting.country}
                                </div>
                                <div className="text-sm text-gray-400">
                                    {nextMeeting.bank}
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <div
                                className="text-4xl font-bold"
                                style={{
                                    color: getUrgencyColor(nextMeeting.daysUntil),
                                }}
                            >
                                {nextMeeting.daysUntil}
                            </div>
                            <div className="text-sm text-gray-400">days until</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400">
                                {nextMeeting.date}
                            </div>
                            <div
                                className={`text-lg font-bold capitalize ${
                                    getActionStyle(nextMeeting.expectedAction).text
                                }`}
                            >
                                {getActionStyle(nextMeeting.expectedAction).icon}{" "}
                                {nextMeeting.expectedAction}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <TimelineView meetings={upcomingMeetings} />

            {/* Upcoming meetings list */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {nextMeetings.slice(1).map((meeting) => (
                    <MeetingCard
                        key={`${meeting.country}-${meeting.date}`}
                        meeting={meeting}
                        isHighlighted={selectedCountry === meeting.country}
                    />
                ))}
            </div>

            {/* Volatility warning */}
            {nextMeeting && nextMeeting.daysUntil <= 7 && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-400">⚠️</span>
                        <span className="text-sm text-yellow-400">
                            <strong>{nextMeeting.country}</strong> decision in{" "}
                            {nextMeeting.daysUntil} days. Expect increased market
                            volatility.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
