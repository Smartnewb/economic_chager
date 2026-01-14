"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

// Dynamically import the globe
const WeatherGlobe = dynamic(() => import("@/components/weather/WeatherGlobe"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gradient-radial from-blue-900/20 to-transparent" />
});

// Fake real-time capital flow notifications
const FLOW_NOTIFICATIONS = [
    { amount: "2.4T", from: "Korea", to: "US", type: "outflow" },
    { amount: "890B", from: "Japan", to: "US Treasury", type: "safe-haven" },
    { amount: "1.2T", from: "EU", to: "Emerging Markets", type: "risk-on" },
    { amount: "560B", from: "China", to: "Gold", type: "hedge" },
    { amount: "3.1T", from: "US Tech", to: "US Bonds", type: "rotation" },
];

// Live user activity (fake but convincing)
const USER_ACTIVITIES = [
    { action: "analyzing", target: "Fed Rate Decision", count: 1247 },
    { action: "detected", target: "Insider Buying Signal", count: 34 },
    { action: "avoided", target: "Market Crash Warning", count: 89 },
    { action: "reading", target: "AI Council Report", count: 2156 },
];

export default function LandingPage() {
    const { t, language } = useI18n();
    const [currentNotification, setCurrentNotification] = useState(0);
    const [currentActivity, setCurrentActivity] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    // Rotate notifications
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentNotification((prev) => (prev + 1) % FLOW_NOTIFICATIONS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Rotate user activities
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentActivity((prev) => (prev + 1) % USER_ACTIVITIES.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Fade in animation
    useEffect(() => {
        setIsVisible(true);
    }, []);

    const notification = FLOW_NOTIFICATIONS[currentNotification];
    const activity = USER_ACTIVITIES[currentActivity];

    return (
        <main className="relative w-full min-h-screen bg-[#030712] overflow-x-hidden">
            {/* ==================== HERO SECTION ==================== */}
            <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0">
                    {/* Gradient Orbs */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
                </div>

                {/* 3D Globe */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <div className="w-full max-w-3xl aspect-square">
                        <WeatherGlobe />
                    </div>
                </div>

                {/* Live Capital Flow Toast */}
                <div className={`absolute top-24 right-8 transition-all duration-500 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}>
                    <div className="px-4 py-3 bg-black/60 backdrop-blur-xl border border-amber-500/30 rounded-xl shadow-lg shadow-amber-500/10 animate-pulse-slow">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            <div>
                                <p className="text-xs text-gray-400">LIVE CAPITAL FLOW</p>
                                <p className="text-sm text-white font-medium">
                                    <span className="text-amber-400 font-bold">${notification.amount}</span>
                                    {" "}
                                    {notification.from} → {notification.to}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className={`relative z-10 text-center px-6 max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm text-gray-300">
                            {language === "ko" ? "상위 1%가 보는 정보" : "What the Top 1% Sees"}
                        </span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
                        {language === "ko" ? (
                            <>
                                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">돈의 흐름</span>이 보이면,
                                <br />
                                투자는 <span className="text-white">확신</span>이 됩니다.
                            </>
                        ) : (
                            <>
                                When you see the{" "}
                                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">flow of money</span>,
                                <br />
                                investing becomes <span className="text-white">conviction</span>.
                            </>
                        )}
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                        {language === "ko"
                            ? "기관과 세력은 블룸버그 터미널을 봅니다. 당신은 'Insight Flow'를 보세요."
                            : "Institutions watch Bloomberg terminals. You watch Insight Flow."
                        }
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <Link href="/dashboard">
                            <button className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-bold text-lg text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all overflow-hidden">
                                <span className="relative z-10">
                                    {language === "ko" ? "지금 내 자산 지키러 가기" : "Protect My Assets Now"}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </Link>
                        <button className="px-8 py-4 border border-white/20 rounded-xl font-medium text-gray-300 hover:bg-white/5 hover:border-white/30 transition-all">
                            {language === "ko" ? "3분 데모 보기" : "Watch 3-min Demo"}
                        </button>
                    </div>

                    {/* Social Proof */}
                    <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-gray-900" />
                                ))}
                            </div>
                            <span className="text-gray-400">
                                <span className="text-white font-bold">{activity.count.toLocaleString()}</span>명이{" "}
                                {activity.action === "analyzing" && `"${activity.target}" 분석 중`}
                                {activity.action === "detected" && `"${activity.target}" 포착`}
                                {activity.action === "avoided" && `"${activity.target}"로 손실 회피`}
                                {activity.action === "reading" && `"${activity.target}" 열람 중`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                        <span className="text-xs">{language === "ko" ? "스크롤하여 더 보기" : "Scroll to explore"}</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* ==================== BEFORE / AFTER SECTION ==================== */}
            <section className="relative py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            {language === "ko" ? "언제까지 '기도 매매'를 하시겠습니까?" : "How long will you trade on 'hope and prayer'?"}
                        </h2>
                        <p className="text-gray-400 text-lg">
                            {language === "ko"
                                ? "데이터와 역사는 거짓말을 하지 않습니다."
                                : "Data and history don't lie."
                            }
                        </p>
                    </div>

                    {/* Before / After Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* BEFORE (Without Us) */}
                        <div className="relative p-8 rounded-3xl bg-gradient-to-br from-red-950/30 to-gray-900/50 border border-red-500/20">
                            <div className="absolute -top-4 left-8 px-4 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                                <span className="text-sm font-bold text-red-400">WITHOUT US</span>
                            </div>

                            <div className="mt-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <p className="text-gray-300">복잡한 뉴스 기사 스크랩, 해석은 각자</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <p className="text-gray-300">빨간불/파란불에 일희일비하는 차트</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <p className="text-gray-300">"누가 좋다더라" 카더라 통신</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <p className="text-gray-300">세력과 기관에게 당하는 개미</p>
                                </div>
                            </div>

                            {/* Sad Chart */}
                            <div className="mt-8 h-32 relative overflow-hidden rounded-xl bg-black/30">
                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                                    <path
                                        d="M0,40 L20,35 L40,50 L60,45 L80,60 L100,55 L120,65 L140,70 L160,75 L180,72 L200,78"
                                        fill="none"
                                        stroke="rgba(239, 68, 68, 0.5)"
                                        strokeWidth="2"
                                    />
                                </svg>
                                <div className="absolute bottom-4 right-4 text-red-400 text-sm font-mono">-23.4%</div>
                            </div>
                        </div>

                        {/* AFTER (With Us) */}
                        <div className="relative p-8 rounded-3xl bg-gradient-to-br from-green-950/30 to-gray-900/50 border border-green-500/20">
                            <div className="absolute -top-4 left-8 px-4 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                                <span className="text-sm font-bold text-green-400">WITH INSIGHT FLOW</span>
                            </div>

                            <div className="mt-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <p className="text-gray-300">AI 이사회의 명확한 분석과 조언</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <p className="text-gray-300">세력의 움직임을 미리 포착</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <p className="text-gray-300">150년 역사 데이터 기반의 패턴 분석</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <p className="text-gray-300">근거 있는 투자로 확신 있게 행동</p>
                                </div>
                            </div>

                            {/* Happy Chart */}
                            <div className="mt-8 h-32 relative overflow-hidden rounded-xl bg-black/30">
                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
                                            <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d="M0,70 L20,65 L40,55 L60,50 L80,40 L100,35 L120,25 L140,20 L160,15 L180,12 L200,8"
                                        fill="url(#greenGradient)"
                                    />
                                    <path
                                        d="M0,70 L20,65 L40,55 L60,50 L80,40 L100,35 L120,25 L140,20 L160,15 L180,12 L200,8"
                                        fill="none"
                                        stroke="rgba(34, 197, 94, 0.8)"
                                        strokeWidth="2"
                                    />
                                </svg>
                                <div className="absolute bottom-4 right-4 text-green-400 text-sm font-mono">+47.2%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== FEATURES WITH BLUR/LOCK ==================== */}
            <section className="relative py-24 px-6 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
                            <span className="text-amber-400 font-bold text-xs">INSTITUTIONAL GRADE</span>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4">
                            {language === "ko" ? "상위 1%만 보던 정보" : "Information Only the Top 1% Saw"}
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Feature 1: Whale Radar (Blurred) */}
                        <div className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all overflow-hidden">
                            <div className="absolute top-4 right-4">
                                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded">PRO</span>
                            </div>

                            <div className="text-4xl mb-4">🐋</div>
                            <h3 className="text-xl font-bold text-white mb-2">고래 탐지기</h3>
                            <p className="text-gray-400 text-sm mb-4">내부자 거래와 대량 매수/매도를 실시간 포착</p>

                            {/* Blurred Content */}
                            <div className="relative">
                                <div className="p-3 bg-black/30 rounded-lg blur-sm">
                                    <p className="text-green-400 text-sm">🚨 [삼성전자] CEO 자사주 10억 매수 포착</p>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <button className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg text-sm hover:bg-amber-400 transition-colors">
                                        잠금 해제
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2: AI Council (Partially Locked) */}
                        <div className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all">
                            <div className="absolute top-4 right-4">
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">ELITE</span>
                            </div>

                            <div className="text-4xl mb-4">🧠</div>
                            <h3 className="text-xl font-bold text-white mb-2">AI 이사회</h3>
                            <p className="text-gray-400 text-sm mb-4">버핏, 달리오, 소로스의 AI 분석</p>

                            {/* Locked Avatars */}
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-xs font-bold text-white">WB</div>
                                <div className="relative w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                    <span className="text-gray-500">🔒</span>
                                </div>
                                <div className="relative w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                    <span className="text-gray-500">🔒</span>
                                </div>
                                <span className="text-xs text-gray-500 ml-2">+2 locked</span>
                            </div>
                        </div>

                        {/* Feature 3: History Engine */}
                        <div className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all">
                            <div className="absolute top-4 right-4">
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded">UNIQUE</span>
                            </div>

                            <div className="text-4xl mb-4">📜</div>
                            <h3 className="text-xl font-bold text-white mb-2">역사 패턴 엔진</h3>
                            <p className="text-gray-400 text-sm mb-4">현재와 가장 유사한 과거 시점 매칭</p>

                            <div className="p-3 bg-black/30 rounded-lg">
                                <p className="text-purple-400 text-sm">현재 상황은 <span className="font-bold">1999년</span>과 87% 유사</p>
                                <p className="text-gray-500 text-xs mt-1">당시 1년 후 수익률: +21%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== GAMIFICATION SECTION ==================== */}
            <section className="relative py-24 px-6 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
                            <span className="text-purple-400 font-bold text-xs">LEVEL UP SYSTEM</span>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4">
                            {language === "ko" ? "나의 투자 IQ를 올려보세요" : "Level Up Your Investor IQ"}
                        </h2>
                        <p className="text-gray-400">
                            {language === "ko"
                                ? "매일 접속하고, 분석하고, 학습하면 레벨이 올라갑니다."
                                : "Visit daily, analyze, learn - and watch your level rise."
                            }
                        </p>
                    </div>

                    {/* Level Track */}
                    <div className="relative mb-12">
                        <div className="h-2 bg-gray-800 rounded-full">
                            <div className="h-full w-1/4 bg-gradient-to-r from-gray-500 to-blue-500 rounded-full relative">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-4 border-gray-900" />
                            </div>
                        </div>

                        {/* Level Markers */}
                        <div className="flex justify-between mt-6">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-3xl">
                                    🐜
                                </div>
                                <p className="text-white font-bold text-sm">{language === "ko" ? "개미" : "Ant"}</p>
                                <p className="text-gray-500 text-xs">0 XP</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">
                                    🧠
                                </div>
                                <p className="text-blue-400 font-bold text-sm">{language === "ko" ? "스마트 뉴비" : "Smart Newbie"}</p>
                                <p className="text-gray-500 text-xs">100 XP</p>
                            </div>
                            <div className="text-center opacity-60">
                                <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-3xl">
                                    🧙
                                </div>
                                <p className="text-purple-400 font-bold text-sm">{language === "ko" ? "현인" : "Sage"}</p>
                                <p className="text-gray-500 text-xs">500 XP</p>
                            </div>
                            <div className="text-center opacity-40">
                                <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-3xl">
                                    🐋
                                </div>
                                <p className="text-amber-400 font-bold text-sm">{language === "ko" ? "고래" : "Whale"}</p>
                                <p className="text-gray-500 text-xs">2000 XP</p>
                            </div>
                        </div>
                    </div>

                    {/* How to Earn XP */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4">
                                {language === "ko" ? "경험치 획득 방법" : "How to Earn XP"}
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">일일 접속</span>
                                    <span className="text-amber-400 font-bold">+10 XP</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">모듈 조회</span>
                                    <span className="text-amber-400 font-bold">+5 XP</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">AI Council 이용</span>
                                    <span className="text-amber-400 font-bold">+20 XP</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">7일 연속 보너스</span>
                                    <span className="text-amber-400 font-bold">+50 XP</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4">
                                {language === "ko" ? "레벨별 혜택" : "Level Benefits"}
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🐜</span>
                                    <div>
                                        <p className="text-white text-sm font-medium">{language === "ko" ? "개미" : "Ant"}</p>
                                        <p className="text-gray-500 text-xs">기본 시장 개요</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🧠</span>
                                    <div>
                                        <p className="text-blue-400 text-sm font-medium">{language === "ko" ? "스마트 뉴비" : "Smart Newbie"}</p>
                                        <p className="text-gray-500 text-xs">패턴 인식 힌트, 주간 요약</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🧙</span>
                                    <div>
                                        <p className="text-purple-400 text-sm font-medium">{language === "ko" ? "현인" : "Sage"}</p>
                                        <p className="text-gray-500 text-xs">고급 분석, AI Council 접근</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🐋</span>
                                    <div>
                                        <p className="text-amber-400 text-sm font-medium">{language === "ko" ? "고래" : "Whale"}</p>
                                        <p className="text-gray-500 text-xs">모든 기능 잠금 해제, 고래 탐지기</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Achievement Preview */}
                    <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">
                                {language === "ko" ? "업적 시스템" : "Achievements"}
                            </h3>
                            <span className="text-xs text-gray-400">5 {language === "ko" ? "개 달성 가능" : "to unlock"}</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {[
                                { icon: "👣", name: language === "ko" ? "첫 발걸음" : "First Steps", xp: 20 },
                                { icon: "🔥", name: language === "ko" ? "일주일 전사" : "Week Warrior", xp: 100 },
                                { icon: "🏛️", name: language === "ko" ? "거인들의 회의" : "Council Meeting", xp: 50 },
                                { icon: "🎯", name: language === "ko" ? "데이터 사냥꾼" : "Data Hunter", xp: 150 },
                                { icon: "🏆", name: language === "ko" ? "월간 챔피언" : "Monthly Champion", xp: 500 },
                            ].map((achievement, idx) => (
                                <div key={idx} className="flex-shrink-0 w-24 text-center">
                                    <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-black/30 flex items-center justify-center text-2xl">
                                        {achievement.icon}
                                    </div>
                                    <p className="text-white text-xs font-medium truncate">{achievement.name}</p>
                                    <p className="text-amber-400 text-[10px]">+{achievement.xp} XP</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== PRICING SECTION ==================== */}
            <section className="relative py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            {language === "ko" ? "당신의 투자 레벨을 선택하세요" : "Choose Your Investment Level"}
                        </h2>
                        <p className="text-gray-400">
                            {language === "ko"
                                ? "커피 2잔 값으로 상위 1%의 정보를 얻으세요"
                                : "Get top 1% information for the price of 2 coffees"
                            }
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Observer (Free) */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                            <div className="text-gray-400 text-sm font-medium mb-2">OBSERVER</div>
                            <div className="text-3xl font-bold text-white mb-1">무료</div>
                            <p className="text-gray-500 text-sm mb-6">시장의 흐름을 봅니다</p>

                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-gray-300 text-sm">
                                    <span className="text-green-400">✓</span> 실시간 환율 데이터
                                </li>
                                <li className="flex items-center gap-2 text-gray-300 text-sm">
                                    <span className="text-green-400">✓</span> 기본 차트 분석
                                </li>
                                <li className="flex items-center gap-2 text-gray-300 text-sm">
                                    <span className="text-green-400">✓</span> 일일 시장 요약
                                </li>
                                <li className="flex items-center gap-2 text-gray-500 text-sm">
                                    <span className="text-gray-600">✗</span> AI 분석 제한
                                </li>
                            </ul>

                            <button className="w-full py-3 border border-white/20 rounded-xl text-white font-medium hover:bg-white/5 transition-colors">
                                시작하기
                            </button>
                        </div>

                        {/* Navigator (Pro) - Highlighted */}
                        <div className="relative p-8 rounded-2xl bg-gradient-to-b from-amber-500/20 to-transparent border-2 border-amber-500/50 scale-105">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-black font-bold text-xs rounded-full">
                                MOST POPULAR
                            </div>

                            <div className="text-amber-400 text-sm font-medium mb-2">NAVIGATOR</div>
                            <div className="flex items-end gap-2 mb-1">
                                <span className="text-4xl font-bold text-white">₩9,900</span>
                                <span className="text-gray-400 text-sm mb-1">/월</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-6">위험을 피하고 기회를 잡습니다</p>

                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-gray-300 text-sm">
                                    <span className="text-green-400">✓</span> Observer의 모든 기능
                                </li>
                                <li className="flex items-center gap-2 text-gray-300 text-sm">
                                    <span className="text-green-400">✓</span> 무제한 AI 분석
                                </li>
                                <li className="flex items-center gap-2 text-gray-300 text-sm">
                                    <span className="text-green-400">✓</span> 역사 패턴 엔진
                                </li>
                                <li className="flex items-center gap-2 text-gray-300 text-sm">
                                    <span className="text-green-400">✓</span> 위험 경고 알림
                                </li>
                            </ul>

                            <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all">
                                지금 시작하기
                            </button>
                        </div>

                        {/* Insider (Elite) */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                            <div className="text-purple-400 text-sm font-medium mb-2">INSIDER</div>
                            <div className="flex items-end gap-2 mb-1">
                                <span className="text-3xl font-bold text-white">₩29,000</span>
                                <span className="text-gray-400 text-sm mb-1">/월</span>
                            </div>
                            <p className="text-gray-500 text-sm mb-6">세력과 함께 움직입니다</p>

                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-gray-300 text-sm">
                                    <span className="text-green-400">✓</span> Navigator의 모든 기능
                                </li>
                                <li className="flex items-center gap-2 text-gray-300 text-sm">
                                    <span className="text-green-400">✓</span> 고래 탐지기
                                </li>
                                <li className="flex items-center gap-2 text-gray-300 text-sm">
                                    <span className="text-green-400">✓</span> 내부자 거래 알림
                                </li>
                                <li className="flex items-center gap-2 text-gray-300 text-sm">
                                    <span className="text-green-400">✓</span> 전체 AI 이사회 접근
                                </li>
                            </ul>

                            <button className="w-full py-3 border border-purple-500/50 rounded-xl text-purple-400 font-medium hover:bg-purple-500/10 transition-colors">
                                프리미엄 시작
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== FINAL CTA ==================== */}
            <section className="relative py-24 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        {language === "ko"
                            ? "아직도 기도 매매를 하시겠습니까?"
                            : "Still trading on hope?"
                        }
                    </h2>
                    <p className="text-xl text-gray-400 mb-10">
                        {language === "ko"
                            ? "돈의 흐름이 보이는 순간, 투자는 확신이 됩니다."
                            : "The moment you see the flow of money, investing becomes conviction."
                        }
                    </p>

                    <Link href="/dashboard">
                        <button className="group relative px-12 py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-xl text-white shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all">
                            <span className="relative z-10">
                                {language === "ko" ? "상위 1% 정보 잠금 해제" : "Unlock Top 1% Intelligence"}
                            </span>
                        </button>
                    </Link>

                    <p className="mt-6 text-gray-500 text-sm">
                        {language === "ko"
                            ? "신용카드 불필요 • 3분 설정 • 언제든 취소 가능"
                            : "No credit card required • 3-min setup • Cancel anytime"
                        }
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <span className="text-white font-bold">IF</span>
                        </div>
                        <span className="text-white font-semibold">Insight Flow</span>
                    </div>

                    <p className="text-gray-500 text-sm text-center">
                        {language === "ko"
                            ? "투자의 책임은 본인에게 있습니다. 본 서비스는 투자 조언이 아닙니다."
                            : "Investment decisions are your responsibility. This is not financial advice."
                        }
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-white transition-colors">이용약관</a>
                        <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
                    </div>
                </div>
            </footer>

            {/* Styles */}
            <style jsx>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }
            `}</style>
        </main>
    );
}
