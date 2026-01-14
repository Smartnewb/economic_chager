"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import Navigation from "@/components/Navigation";
import CountrySearch from "@/components/country/CountrySearch";
import { AVAILABLE_COUNTRIES } from "@/store/countryStore";

export default function CountrySearchPage() {
    const { t } = useI18n();

    // Group countries by region
    const regionGroups = AVAILABLE_COUNTRIES.reduce(
        (acc, country) => {
            if (!acc[country.region]) acc[country.region] = [];
            acc[country.region].push(country);
            return acc;
        },
        {} as Record<string, typeof AVAILABLE_COUNTRIES>
    );

    const regionEmoji: Record<string, string> = {
        Americas: "🌎",
        Europe: "🌍",
        Asia: "🌏",
        Oceania: "🌊",
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
            {/* Navigation Header */}
            <Navigation />

            {/* Main Content */}
            <main className="pt-24 pb-12 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Page Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-white mb-4">
                            🔬 {t("country.title")}
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            {t("country.subtitle")}
                        </p>
                    </div>

                    {/* Search Box */}
                    <div className="mb-16">
                        <CountrySearch />
                    </div>

                    {/* Featured Countries */}
                    <div className="mb-12">
                        <h2 className="text-xl font-bold text-white mb-4">
                            🌟 {t("country.majorEconomies")}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {["US", "CN", "JP", "DE"].map((code) => {
                                const country = AVAILABLE_COUNTRIES.find((c) => c.code === code);
                                if (!country) return null;
                                return (
                                    <Link
                                        key={code}
                                        href={`/country/${code}`}
                                        className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all group"
                                    >
                                        <div className="text-3xl mb-2">{country.flag}</div>
                                        <div className="font-bold text-white group-hover:text-purple-400 transition-colors">
                                            {country.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {country.currencyCode}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Countries by Region */}
                    {Object.entries(regionGroups).map(([region, countries]) => (
                        <div key={region} className="mb-8">
                            <h3 className="text-lg font-semibold text-white mb-3">
                                {regionEmoji[region]} {t(`country.${region.toLowerCase()}`)}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {countries.map((country) => (
                                    <Link
                                        key={country.code}
                                        href={`/country/${country.code}`}
                                        className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                                    >
                                        <span className="text-xl">{country.flag}</span>
                                        <div>
                                            <div className="text-sm font-medium text-white">
                                                {country.code}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate max-w-[80px]">
                                                {country.name}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* How it works */}
                    <div className="mt-16 p-6 bg-black/30 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">
                            💡 {t("country.howItWorks")}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="p-3 bg-white/5 rounded-lg">
                                <div className="text-purple-400 font-medium mb-1">
                                    1. {t("country.dataAggregation")}
                                </div>
                                <p className="text-gray-400">
                                    {t("country.dataAggregationDesc")}
                                </p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                                <div className="text-purple-400 font-medium mb-1">
                                    2. {t("country.healthScoring")}
                                </div>
                                <p className="text-gray-400">
                                    {t("country.healthScoringDesc")}
                                </p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                                <div className="text-purple-400 font-medium mb-1">
                                    3. {t("country.aiAnalysis")}
                                </div>
                                <p className="text-gray-400">
                                    {t("country.aiAnalysisDesc")}
                                </p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                                <div className="text-purple-400 font-medium mb-1">
                                    4. {t("country.finalGrade")}
                                </div>
                                <p className="text-gray-400">
                                    {t("country.finalGradeDesc")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
