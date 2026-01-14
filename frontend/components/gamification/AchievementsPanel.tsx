"use client";

import { useState, useEffect } from "react";
import { useUserProgressStore, ACHIEVEMENTS, LEVEL_CONFIG } from "@/store/userProgressStore";
import { useI18n } from "@/lib/i18n";
import { LevelRing } from "./InvestorLevel";

interface AchievementsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AchievementsPanel({ isOpen, onClose }: AchievementsPanelProps) {
    const { language } = useI18n();
    const {
        totalXP,
        level,
        currentStreak,
        longestStreak,
        unlockedAchievements,
        visitedModules,
        getCurrentLevelInfo,
        getProgressToNextLevel
    } = useUserProgressStore();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const levelInfo = getCurrentLevelInfo();
    const progress = getProgressToNextLevel();
    const lang = language === "ko" ? "ko" : "en";

    // Calculate stats
    const totalAchievements = ACHIEVEMENTS.length;
    const earnedAchievements = unlockedAchievements.length;
    const achievementPercentage = Math.round((earnedAchievements / totalAchievements) * 100);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed inset-x-4 top-20 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[80vh] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl z-50 overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <LevelRing size={60} />
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {lang === "ko" ? "나의 투자 IQ" : "My Investor IQ"}
                            </h2>
                            <p className="text-sm text-gray-400">
                                {levelInfo.name[lang]} • {totalXP.toLocaleString()} XP
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 p-6 bg-white/5 border-b border-white/10">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <span className="text-lg">🔥</span>
                            <span className="text-2xl font-bold text-white">{currentStreak}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            {lang === "ko" ? "현재 연속" : "Current Streak"}
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <span className="text-lg">🏆</span>
                            <span className="text-2xl font-bold text-white">{longestStreak}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            {lang === "ko" ? "최장 연속" : "Best Streak"}
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <span className="text-lg">🎯</span>
                            <span className="text-2xl font-bold text-white">{achievementPercentage}%</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            {lang === "ko" ? "달성률" : "Completion"}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Level Progress */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-white">
                                {lang === "ko" ? "레벨 진행도" : "Level Progress"}
                            </span>
                            {level !== "whale" && (
                                <span className="text-xs text-gray-400">
                                    {progress.current} / {progress.required} XP
                                </span>
                            )}
                        </div>

                        {/* Level Track */}
                        <div className="relative">
                            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${levelInfo.gradient} transition-all duration-500`}
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>

                            {/* Level Markers */}
                            <div className="flex justify-between mt-2">
                                {(["ant", "smartNewbie", "sage", "whale"] as const).map((lvl, idx) => {
                                    const lvlConfig = LEVEL_CONFIG[lvl];
                                    const isActive = lvl === level;
                                    const isPast = LEVEL_CONFIG[level].minXP >= lvlConfig.minXP;

                                    return (
                                        <div key={lvl} className="flex flex-col items-center">
                                            <span className={`text-xl ${isActive ? "animate-bounce" : ""} ${isPast ? "" : "opacity-40"}`}>
                                                {lvlConfig.icon}
                                            </span>
                                            <span className={`text-[10px] mt-1 ${isActive ? "text-white font-bold" : "text-gray-500"}`}>
                                                {lvlConfig.name[lang]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Achievements */}
                    <div>
                        <h3 className="text-sm font-medium text-white mb-3">
                            {lang === "ko" ? "업적" : "Achievements"} ({earnedAchievements}/{totalAchievements})
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ACHIEVEMENTS.map((achievement) => {
                                const isUnlocked = unlockedAchievements.includes(achievement.id);

                                return (
                                    <div
                                        key={achievement.id}
                                        className={`
                                            p-4 rounded-xl border transition-all
                                            ${isUnlocked
                                                ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30"
                                                : "bg-white/5 border-white/10 opacity-60"
                                            }
                                        `}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className={`text-2xl ${isUnlocked ? "" : "grayscale"}`}>
                                                {achievement.icon}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`text-sm font-bold ${isUnlocked ? "text-white" : "text-gray-400"}`}>
                                                        {achievement.name[lang]}
                                                    </h4>
                                                    {isUnlocked && (
                                                        <span className="text-xs text-green-400">✓</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {achievement.description[lang]}
                                                </p>
                                                <p className="text-xs text-amber-400 mt-1">
                                                    +{achievement.xpReward} XP
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* XP Guide */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-sm font-medium text-white mb-3">
                            {lang === "ko" ? "경험치 획득 방법" : "How to Earn XP"}
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">
                                    {lang === "ko" ? "일일 접속" : "Daily Login"}
                                </span>
                                <span className="text-amber-400">+10 XP</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">
                                    {lang === "ko" ? "모듈 조회" : "View Module"}
                                </span>
                                <span className="text-amber-400">+5 XP</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">
                                    {lang === "ko" ? "리포트 읽기" : "Read Report"}
                                </span>
                                <span className="text-amber-400">+15 XP</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">
                                    {lang === "ko" ? "Council 이용" : "Use Council"}
                                </span>
                                <span className="text-amber-400">+20 XP</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">
                                    {lang === "ko" ? "7일 연속 보너스" : "7-Day Streak Bonus"}
                                </span>
                                <span className="text-amber-400">+50 XP</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 bg-white/5">
                    <p className="text-xs text-gray-500 text-center">
                        {lang === "ko"
                            ? "매일 접속하고 다양한 기능을 이용해 레벨을 올려보세요!"
                            : "Visit daily and use various features to level up!"}
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out forwards;
                }
                @media (max-width: 768px) {
                    @keyframes scale-in {
                        from {
                            opacity: 0;
                            transform: scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                }
            `}</style>
        </>
    );
}
