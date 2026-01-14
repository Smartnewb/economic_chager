"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCountryStore, AVAILABLE_COUNTRIES } from "@/store/countryStore";
import EconomicRadarChart from "@/components/country/EconomicRadarChart";
import FourPillarCards from "@/components/country/FourPillarCards";
import CountryAnalysisTriggerButton from "@/components/country/CountryAnalysisTriggerButton";
import CountryAnalysisPanel from "@/components/country/CountryAnalysisPanel";
import { GlobalReportCard, IMFOutlookChart, InstitutionalAnalysisPanel } from "@/components/institutional";
import Navigation from "@/components/Navigation";
import { useI18n } from "@/lib/i18n";

export default function CountryDetailPage() {
    const params = useParams();
    const countryCode = params.code as string;
    const { language } = useI18n();

    const {
        countryData,
        isLoadingData,
        fetchCountryData,
    } = useCountryStore();

    // Find country profile
    const countryProfile = AVAILABLE_COUNTRIES.find(
        (c) => c.code.toUpperCase() === countryCode?.toUpperCase()
    );

    useEffect(() => {
        if (countryCode) {
            fetchCountryData(countryCode.toUpperCase());
        }
    }, [countryCode, fetchCountryData]);

    // Country not found
    if (!countryProfile) {
        return (
            <div className="min-h-screen bg-[#0a0a0f]">
                <Navigation showBack backHref="/country" />
                <div className="pt-24 flex items-center justify-center min-h-[80vh]">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {language === "ko" ? "국가를 찾을 수 없습니다" : "Country Not Found"}
                        </h1>
                        <p className="text-gray-400 mb-6">
                            {language === "ko"
                                ? `"${countryCode}" 코드는 아직 지원되지 않습니다.`
                                : `The country code "${countryCode}" is not supported yet.`
                            }
                        </p>
                        <Link
                            href="/country"
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                        >
                            {language === "ko" ? "국가 스캐너로 돌아가기" : "Back to Country Scanner"}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f]">
            {/* Unified Navigation with Back Button */}
            <Navigation
                showBack
                backHref="/country"
                title={countryProfile.name}
            />

            {/* Main Content */}
            <main className="pt-20 pb-12 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Country Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-5xl">{countryProfile.flag}</span>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                    {countryProfile.name}
                                </h1>
                                <p className="text-gray-400 text-sm sm:text-base">
                                    {countryProfile.currency} ({countryProfile.currencyCode}) • {countryProfile.region}
                                </p>
                            </div>
                        </div>

                        {/* Analysis Button */}
                        {countryData && !isLoadingData && (
                            <CountryAnalysisTriggerButton />
                        )}
                    </div>

                    {/* Loading State */}
                    {isLoadingData && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
                            <p className="text-gray-400">
                                {language === "ko"
                                    ? `${countryProfile.name}의 경제 데이터를 불러오는 중...`
                                    : `Loading economic data for ${countryProfile.name}...`
                                }
                            </p>
                        </div>
                    )}

                    {/* Data Display */}
                    {countryData && !isLoadingData && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Radar Chart */}
                            <div>
                                <EconomicRadarChart
                                    metrics={countryData.metrics}
                                    overallScore={countryData.overallScore}
                                    overallGrade={countryData.overallGrade}
                                    countryName={countryData.profile.name}
                                    countryFlag={countryData.profile.flag}
                                />

                                {/* Quick Summary */}
                                <div className="mt-6 p-5 bg-[#0f1117] rounded-xl border border-white/5">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <span>📊</span>
                                        {language === "ko" ? "요약" : "Quick Summary"}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 text-xs">
                                                {language === "ko" ? "통화 추세" : "Currency Trend"}
                                            </span>
                                            <span className={`font-medium ${countryData.fx.change1m < 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                {countryData.fx.change1m < 0
                                                    ? (language === "ko" ? "강세" : "Strengthening")
                                                    : (language === "ko" ? "약세" : "Weakening")
                                                }
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 text-xs">
                                                {language === "ko" ? "수익률 곡선" : "Yield Curve"}
                                            </span>
                                            <span className={`font-medium ${countryData.bond.isInverted ? "text-red-400" : "text-emerald-400"}`}>
                                                {countryData.bond.isInverted
                                                    ? (language === "ko" ? "역전 ⚠️" : "Inverted ⚠️")
                                                    : (language === "ko" ? "정상" : "Normal")
                                                }
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 text-xs">
                                                {language === "ko" ? "시장 심리" : "Market Mood"}
                                            </span>
                                            <span className={`font-medium ${countryData.stock.change3m >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                {countryData.stock.change3m >= 0
                                                    ? (language === "ko" ? "강세" : "Bullish")
                                                    : (language === "ko" ? "약세" : "Bearish")
                                                }
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 text-xs">
                                                {language === "ko" ? "정책 기조" : "Policy Stance"}
                                            </span>
                                            <span className={`font-medium capitalize ${
                                                countryData.policy.status === "hiking" ? "text-red-400" :
                                                countryData.policy.status === "cutting" ? "text-blue-400" :
                                                "text-amber-400"
                                            }`}>
                                                {language === "ko"
                                                    ? (countryData.policy.status === "hiking" ? "인상" : countryData.policy.status === "cutting" ? "인하" : "유지")
                                                    : countryData.policy.status
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - 4 Pillar Cards */}
                            <div>
                                <FourPillarCards
                                    fx={countryData.fx}
                                    bond={countryData.bond}
                                    stock={countryData.stock}
                                    policy={countryData.policy}
                                    currencyCode={countryData.profile.currencyCode}
                                />
                            </div>
                        </div>
                    )}

                    {/* Institutional Intelligence Section */}
                    {countryData && !isLoadingData && (
                        <div className="mt-12 space-y-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span>🏛️</span>
                                {language === "ko" ? "기관 인텔리전스" : "Institutional Intelligence"}
                            </h2>

                            {/* IMF Outlook Chart */}
                            <IMFOutlookChart countryCode={countryCode.toUpperCase()} />

                            {/* Global Report Card */}
                            <GlobalReportCard countryCode={countryCode.toUpperCase()} />

                            {/* Institutional Analysis Panel (Soros & Dalio) */}
                            <InstitutionalAnalysisPanel
                                countryCode={countryCode.toUpperCase()}
                                countryName={countryProfile.name}
                            />
                        </div>
                    )}

                    {/* Related Countries */}
                    {countryData && !isLoadingData && (
                        <div className="mt-12">
                            <h3 className="text-lg font-bold text-white mb-4">
                                🔗 {language === "ko" ? "다른 국가와 비교" : "Compare with Other Countries"}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {AVAILABLE_COUNTRIES.filter(
                                    (c) => c.code !== countryCode.toUpperCase()
                                ).map((country) => (
                                    <Link
                                        key={country.code}
                                        href={`/country/${country.code}`}
                                        className="flex items-center gap-2 p-3 bg-[#0f1117] rounded-lg border border-white/5 hover:bg-[#161921] hover:border-white/10 transition-all"
                                    >
                                        <span className="text-xl">{country.flag}</span>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-white">
                                                {country.code}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {country.name}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Analysis Panel */}
            <CountryAnalysisPanel />
        </div>
    );
}
