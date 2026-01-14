"use client";

import { useEffect, useState } from "react";
import { useUserProgressStore, LEVEL_CONFIG, ACHIEVEMENTS, InvestorLevel as ILevel } from "@/store/userProgressStore";
import { useI18n } from "@/lib/i18n";

interface InvestorLevelProps {
    variant?: "compact" | "full" | "badge";
    showProgress?: boolean;
}

export default function InvestorLevel({ variant = "compact", showProgress = true }: InvestorLevelProps) {
    const { language } = useI18n();
    const {
        totalXP,
        level,
        currentStreak,
        getCurrentLevelInfo,
        getProgressToNextLevel,
        checkAndUpdateStreak,
        resetDailyCounts
    } = useUserProgressStore();

    const [mounted, setMounted] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [previousLevel, setPreviousLevel] = useState<ILevel | null>(null);

    useEffect(() => {
        setMounted(true);
        checkAndUpdateStreak();
        resetDailyCounts();
    }, [checkAndUpdateStreak, resetDailyCounts]);

    // Watch for level changes
    useEffect(() => {
        if (previousLevel && previousLevel !== level) {
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 3000);
        }
        setPreviousLevel(level);
    }, [level, previousLevel]);

    if (!mounted) {
        return null;
    }

    const levelInfo = getCurrentLevelInfo();
    const progress = getProgressToNextLevel();
    const lang = language === "ko" ? "ko" : "en";

    // Badge variant - minimal display
    if (variant === "badge") {
        return (
            <div className={`
                inline-flex items-center gap-1.5 px-2 py-1 rounded-full
                bg-gradient-to-r ${levelInfo.gradient} bg-opacity-20
                border border-white/10
            `}>
                <span className="text-sm">{levelInfo.icon}</span>
                <span className="text-xs font-medium text-white">
                    {levelInfo.name[lang]}
                </span>
            </div>
        );
    }

    // Compact variant - for navbar
    if (variant === "compact") {
        return (
            <div className="relative group">
                <div className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-xl
                    bg-gradient-to-r ${levelInfo.gradient} bg-opacity-20
                    border border-white/10 hover:border-white/20
                    transition-all cursor-pointer
                `}>
                    <span className="text-lg">{levelInfo.icon}</span>
                    <div className="text-left">
                        <p className="text-xs font-bold text-white">
                            {levelInfo.name[lang]}
                        </p>
                        <p className="text-[10px] text-gray-400">
                            {totalXP.toLocaleString()} XP
                        </p>
                    </div>
                    {currentStreak > 1 && (
                        <div className="flex items-center gap-0.5 text-orange-400">
                            <span className="text-xs">🔥</span>
                            <span className="text-[10px] font-bold">{currentStreak}</span>
                        </div>
                    )}
                </div>

                {/* Hover tooltip */}
                <div className="absolute right-0 top-full mt-2 w-64 p-4 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                    {showProgress && (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400">
                                    {lang === "ko" ? "다음 레벨까지" : "Next Level"}
                                </span>
                                <span className="text-xs text-white font-medium">
                                    {progress.current} / {progress.required} XP
                                </span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                                <div
                                    className={`h-full bg-gradient-to-r ${levelInfo.gradient} transition-all duration-500`}
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                        </>
                    )}
                    <p className="text-xs text-gray-400 italic">
                        {levelInfo.description[lang]}
                    </p>
                </div>

                {/* Level Up Animation */}
                {showLevelUp && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-xl animate-ping" />
                        <span className="text-2xl animate-bounce">🎉</span>
                    </div>
                )}
            </div>
        );
    }

    // Full variant - for profile or dedicated section
    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-white/10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className={`
                    w-16 h-16 rounded-2xl bg-gradient-to-br ${levelInfo.gradient}
                    flex items-center justify-center text-3xl shadow-lg
                `}>
                    {levelInfo.icon}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">
                            {levelInfo.name[lang]}
                        </h3>
                        {currentStreak > 1 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                                <span>🔥</span>
                                <span className="text-xs font-bold">{currentStreak}</span>
                                <span className="text-xs">
                                    {lang === "ko" ? "일" : " days"}
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-400">
                        {levelInfo.description[lang]}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            {showProgress && level !== "whale" && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">
                            {lang === "ko" ? "다음 레벨까지" : "Progress to next level"}
                        </span>
                        <span className="text-sm text-white font-medium">
                            {progress.current.toLocaleString()} / {progress.required.toLocaleString()} XP
                        </span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${levelInfo.gradient} transition-all duration-500 relative`}
                            style={{ width: `${progress.percentage}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                    </div>
                </div>
            )}

            {/* Total XP */}
            <div className="flex items-center justify-between py-3 border-t border-white/10">
                <span className="text-sm text-gray-400">
                    {lang === "ko" ? "총 경험치" : "Total XP"}
                </span>
                <span className="text-lg font-bold text-white">
                    {totalXP.toLocaleString()} XP
                </span>
            </div>

            {/* Benefits */}
            <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">
                    {lang === "ko" ? "현재 혜택" : "Current Benefits"}
                </p>
                <div className="flex flex-wrap gap-2">
                    {levelInfo.benefits.map((benefit, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-1 text-xs rounded-lg bg-white/5 text-gray-300"
                        >
                            {benefit}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// XP Notification Toast Component
export function XPNotification({
    xpGained,
    actionName,
    onClose
}: {
    xpGained: number;
    actionName: string;
    onClose: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 backdrop-blur-xl shadow-xl">
                <span className="text-2xl">✨</span>
                <div>
                    <p className="text-sm font-bold text-amber-400">
                        +{xpGained} XP
                    </p>
                    <p className="text-xs text-gray-400">
                        {actionName}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Level Progress Ring Component
export function LevelRing({ size = 80 }: { size?: number }) {
    const { level, getCurrentLevelInfo, getProgressToNextLevel } = useUserProgressStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const levelInfo = getCurrentLevelInfo();
    const progress = getProgressToNextLevel();

    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress.percentage / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#levelGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500"
                />
                <defs>
                    <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={level === "whale" ? "#f59e0b" : level === "sage" ? "#a855f7" : level === "smartNewbie" ? "#3b82f6" : "#6b7280"} />
                        <stop offset="100%" stopColor={level === "whale" ? "#ea580c" : level === "sage" ? "#7c3aed" : level === "smartNewbie" ? "#06b6d4" : "#4b5563"} />
                    </linearGradient>
                </defs>
            </svg>
            {/* Icon in center */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span style={{ fontSize: size * 0.4 }}>{levelInfo.icon}</span>
            </div>
        </div>
    );
}
