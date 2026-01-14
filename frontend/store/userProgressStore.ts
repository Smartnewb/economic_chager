"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Investor Level Definitions
export type InvestorLevel = "ant" | "smartNewbie" | "sage" | "whale";

export interface LevelInfo {
    id: InvestorLevel;
    name: {
        ko: string;
        en: string;
    };
    icon: string;
    minXP: number;
    maxXP: number;
    color: string;
    gradient: string;
    description: {
        ko: string;
        en: string;
    };
    benefits: string[];
}

export const LEVEL_CONFIG: Record<InvestorLevel, LevelInfo> = {
    ant: {
        id: "ant",
        name: { ko: "개미", en: "Ant" },
        icon: "🐜",
        minXP: 0,
        maxXP: 100,
        color: "text-gray-400",
        gradient: "from-gray-500 to-gray-600",
        description: {
            ko: "투자 여정을 시작한 새내기",
            en: "A beginner starting the investment journey"
        },
        benefits: ["Basic market overview", "Daily headlines"]
    },
    smartNewbie: {
        id: "smartNewbie",
        name: { ko: "스마트 뉴비", en: "Smart Newbie" },
        icon: "🧠",
        minXP: 100,
        maxXP: 500,
        color: "text-blue-400",
        gradient: "from-blue-500 to-cyan-500",
        description: {
            ko: "시장을 이해하기 시작한 학습자",
            en: "A learner starting to understand the market"
        },
        benefits: ["Pattern recognition hints", "Weekly summaries", "Term dictionary"]
    },
    sage: {
        id: "sage",
        name: { ko: "현인", en: "Sage" },
        icon: "🧙",
        minXP: 500,
        maxXP: 2000,
        color: "text-purple-400",
        gradient: "from-purple-500 to-violet-500",
        description: {
            ko: "흐름을 읽는 통찰력 보유자",
            en: "One who reads the flow with insight"
        },
        benefits: ["Advanced analytics", "AI Council access", "Historical patterns"]
    },
    whale: {
        id: "whale",
        name: { ko: "고래", en: "Whale" },
        icon: "🐋",
        minXP: 2000,
        maxXP: Infinity,
        color: "text-amber-400",
        gradient: "from-amber-500 to-orange-500",
        description: {
            ko: "시장을 움직이는 큰 손",
            en: "A big player who moves the market"
        },
        benefits: ["All features unlocked", "Priority alerts", "Whale radar access"]
    }
};

// XP Actions
export interface XPAction {
    id: string;
    name: {
        ko: string;
        en: string;
    };
    xp: number;
    cooldown?: number; // in milliseconds
    maxDaily?: number;
}

export const XP_ACTIONS: Record<string, XPAction> = {
    dailyLogin: {
        id: "dailyLogin",
        name: { ko: "일일 접속", en: "Daily Login" },
        xp: 10,
        cooldown: 24 * 60 * 60 * 1000 // 24 hours
    },
    viewModule: {
        id: "viewModule",
        name: { ko: "모듈 조회", en: "View Module" },
        xp: 5,
        maxDaily: 10
    },
    readReport: {
        id: "readReport",
        name: { ko: "리포트 읽기", en: "Read Report" },
        xp: 15,
        maxDaily: 5
    },
    useCouncil: {
        id: "useCouncil",
        name: { ko: "Council 이용", en: "Use Council" },
        xp: 20,
        maxDaily: 3
    },
    checkTrend: {
        id: "checkTrend",
        name: { ko: "트렌드 확인", en: "Check Trend" },
        xp: 5,
        maxDaily: 20
    },
    shareInsight: {
        id: "shareInsight",
        name: { ko: "인사이트 공유", en: "Share Insight" },
        xp: 25,
        maxDaily: 2
    },
    completeQuiz: {
        id: "completeQuiz",
        name: { ko: "퀴즈 완료", en: "Complete Quiz" },
        xp: 30,
        maxDaily: 1
    },
    streakBonus: {
        id: "streakBonus",
        name: { ko: "연속 접속 보너스", en: "Streak Bonus" },
        xp: 50,
        cooldown: 24 * 60 * 60 * 1000
    }
};

// Achievement definitions
export interface Achievement {
    id: string;
    name: { ko: string; en: string };
    description: { ko: string; en: string };
    icon: string;
    condition: string;
    xpReward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: "firstSteps",
        name: { ko: "첫 발걸음", en: "First Steps" },
        description: { ko: "첫 번째 모듈 조회", en: "View your first module" },
        icon: "👣",
        condition: "viewModule",
        xpReward: 20
    },
    {
        id: "weekStreak",
        name: { ko: "일주일 전사", en: "Week Warrior" },
        description: { ko: "7일 연속 접속", en: "7-day login streak" },
        icon: "🔥",
        condition: "streak7",
        xpReward: 100
    },
    {
        id: "councilMeeting",
        name: { ko: "거인들의 회의", en: "Council Meeting" },
        description: { ko: "Council of Giants 첫 이용", en: "First use of Council of Giants" },
        icon: "🏛️",
        condition: "useCouncil",
        xpReward: 50
    },
    {
        id: "dataHunter",
        name: { ko: "데이터 사냥꾼", en: "Data Hunter" },
        description: { ko: "모든 모듈 1회 이상 조회", en: "View all modules at least once" },
        icon: "🎯",
        condition: "allModules",
        xpReward: 150
    },
    {
        id: "monthStreak",
        name: { ko: "월간 챔피언", en: "Monthly Champion" },
        description: { ko: "30일 연속 접속", en: "30-day login streak" },
        icon: "🏆",
        condition: "streak30",
        xpReward: 500
    }
];

interface ActionLog {
    actionId: string;
    timestamp: number;
}

interface UserProgressState {
    // Core stats
    totalXP: number;
    level: InvestorLevel;

    // Streak tracking
    currentStreak: number;
    longestStreak: number;
    lastLoginDate: string | null;

    // Action tracking
    actionLogs: ActionLog[];
    dailyActionCounts: Record<string, number>;
    lastDailyReset: string;

    // Achievements
    unlockedAchievements: string[];

    // Visited modules
    visitedModules: string[];

    // Actions
    addXP: (actionId: string) => { xpGained: number; levelUp: boolean; newLevel?: InvestorLevel };
    checkAndUpdateStreak: () => void;
    resetDailyCounts: () => void;
    unlockAchievement: (achievementId: string) => void;
    visitModule: (moduleId: string) => void;
    getCurrentLevelInfo: () => LevelInfo;
    getProgressToNextLevel: () => { current: number; required: number; percentage: number };
    canPerformAction: (actionId: string) => boolean;
}

// Helper to get today's date string
const getTodayString = () => new Date().toISOString().split("T")[0];

// Helper to calculate level from XP
const calculateLevel = (xp: number): InvestorLevel => {
    if (xp >= LEVEL_CONFIG.whale.minXP) return "whale";
    if (xp >= LEVEL_CONFIG.sage.minXP) return "sage";
    if (xp >= LEVEL_CONFIG.smartNewbie.minXP) return "smartNewbie";
    return "ant";
};

export const useUserProgressStore = create<UserProgressState>()(
    persist(
        (set, get) => ({
            // Initial state
            totalXP: 0,
            level: "ant",
            currentStreak: 0,
            longestStreak: 0,
            lastLoginDate: null,
            actionLogs: [],
            dailyActionCounts: {},
            lastDailyReset: getTodayString(),
            unlockedAchievements: [],
            visitedModules: [],

            addXP: (actionId: string) => {
                const state = get();
                const action = XP_ACTIONS[actionId];

                if (!action) {
                    return { xpGained: 0, levelUp: false };
                }

                // Check if action can be performed
                if (!state.canPerformAction(actionId)) {
                    return { xpGained: 0, levelUp: false };
                }

                const oldLevel = state.level;
                const newXP = state.totalXP + action.xp;
                const newLevel = calculateLevel(newXP);

                // Update daily counts
                const newDailyCounts = { ...state.dailyActionCounts };
                newDailyCounts[actionId] = (newDailyCounts[actionId] || 0) + 1;

                // Add to action log
                const newLogs = [
                    ...state.actionLogs.slice(-99), // Keep last 100 logs
                    { actionId, timestamp: Date.now() }
                ];

                set({
                    totalXP: newXP,
                    level: newLevel,
                    dailyActionCounts: newDailyCounts,
                    actionLogs: newLogs
                });

                const levelUp = newLevel !== oldLevel;
                return {
                    xpGained: action.xp,
                    levelUp,
                    newLevel: levelUp ? newLevel : undefined
                };
            },

            checkAndUpdateStreak: () => {
                const state = get();
                const today = getTodayString();
                const lastLogin = state.lastLoginDate;

                if (lastLogin === today) {
                    // Already logged in today
                    return;
                }

                let newStreak = 1;

                if (lastLogin) {
                    const lastDate = new Date(lastLogin);
                    const todayDate = new Date(today);
                    const diffDays = Math.floor(
                        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    if (diffDays === 1) {
                        // Consecutive day
                        newStreak = state.currentStreak + 1;
                    }
                    // If diffDays > 1, streak resets to 1
                }

                const newLongest = Math.max(newStreak, state.longestStreak);

                set({
                    currentStreak: newStreak,
                    longestStreak: newLongest,
                    lastLoginDate: today
                });

                // Award streak bonus XP
                if (newStreak > 1 && newStreak % 7 === 0) {
                    // Bonus every 7 days
                    get().addXP("streakBonus");
                }

                // Check streak achievements
                if (newStreak >= 7 && !state.unlockedAchievements.includes("weekStreak")) {
                    get().unlockAchievement("weekStreak");
                }
                if (newStreak >= 30 && !state.unlockedAchievements.includes("monthStreak")) {
                    get().unlockAchievement("monthStreak");
                }
            },

            resetDailyCounts: () => {
                const today = getTodayString();
                const state = get();

                if (state.lastDailyReset !== today) {
                    set({
                        dailyActionCounts: {},
                        lastDailyReset: today
                    });
                }
            },

            unlockAchievement: (achievementId: string) => {
                const state = get();
                if (state.unlockedAchievements.includes(achievementId)) {
                    return;
                }

                const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
                if (achievement) {
                    set({
                        unlockedAchievements: [...state.unlockedAchievements, achievementId],
                        totalXP: state.totalXP + achievement.xpReward
                    });
                }
            },

            visitModule: (moduleId: string) => {
                const state = get();

                // Track visited module
                if (!state.visitedModules.includes(moduleId)) {
                    const newVisited = [...state.visitedModules, moduleId];
                    set({ visitedModules: newVisited });

                    // Check first module achievement
                    if (newVisited.length === 1) {
                        get().unlockAchievement("firstSteps");
                    }

                    // Check all modules achievement
                    const allModuleIds = ["fx", "bonds", "stocks", "policy", "economy", "country"];
                    if (allModuleIds.every(id => newVisited.includes(id))) {
                        get().unlockAchievement("dataHunter");
                    }
                }

                // Add XP for viewing module
                get().addXP("viewModule");
            },

            getCurrentLevelInfo: () => {
                return LEVEL_CONFIG[get().level];
            },

            getProgressToNextLevel: () => {
                const state = get();
                const currentLevelInfo = LEVEL_CONFIG[state.level];

                if (state.level === "whale") {
                    return { current: state.totalXP, required: state.totalXP, percentage: 100 };
                }

                const levels: InvestorLevel[] = ["ant", "smartNewbie", "sage", "whale"];
                const currentIndex = levels.indexOf(state.level);
                const nextLevel = levels[currentIndex + 1];
                const nextLevelInfo = LEVEL_CONFIG[nextLevel];

                const current = state.totalXP - currentLevelInfo.minXP;
                const required = nextLevelInfo.minXP - currentLevelInfo.minXP;
                const percentage = Math.min((current / required) * 100, 100);

                return { current, required, percentage };
            },

            canPerformAction: (actionId: string) => {
                const state = get();
                const action = XP_ACTIONS[actionId];

                if (!action) return false;

                // Check daily limit
                if (action.maxDaily) {
                    const dailyCount = state.dailyActionCounts[actionId] || 0;
                    if (dailyCount >= action.maxDaily) {
                        return false;
                    }
                }

                // Check cooldown
                if (action.cooldown) {
                    const lastAction = state.actionLogs
                        .filter(log => log.actionId === actionId)
                        .pop();

                    if (lastAction) {
                        const timeSince = Date.now() - lastAction.timestamp;
                        if (timeSince < action.cooldown) {
                            return false;
                        }
                    }
                }

                return true;
            }
        }),
        {
            name: "user-progress-storage",
            partialize: (state) => ({
                totalXP: state.totalXP,
                level: state.level,
                currentStreak: state.currentStreak,
                longestStreak: state.longestStreak,
                lastLoginDate: state.lastLoginDate,
                actionLogs: state.actionLogs,
                dailyActionCounts: state.dailyActionCounts,
                lastDailyReset: state.lastDailyReset,
                unlockedAchievements: state.unlockedAchievements,
                visitedModules: state.visitedModules
            })
        }
    )
);
