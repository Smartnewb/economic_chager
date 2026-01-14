"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import InvestorLevel from "./gamification/InvestorLevel";
import AchievementsPanel from "./gamification/AchievementsPanel";
import { navigationItems } from "@/lib/designSystem";

interface NavigationProps {
    statusIndicator?: React.ReactNode;
    variant?: "default" | "minimal" | "transparent";
    showBack?: boolean;
    backHref?: string;
    title?: string;
}

export default function Navigation({
    statusIndicator,
    variant = "default",
    showBack = false,
    backHref = "/",
    title
}: NavigationProps) {
    const pathname = usePathname();
    const { t, language } = useI18n();
    const [showAchievements, setShowAchievements] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Track scroll for nav styling
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Determine active link
    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    // Get navigation label based on language
    const getNavLabel = (item: typeof navigationItems[0]) => {
        if (language === "ko") return item.labelKo;
        return item.label;
    };

    // Build i18n key for nav item
    const getTranslatedLabel = (item: typeof navigationItems[0]) => {
        const key = `nav.${item.label.toLowerCase()}`;
        const translated = t(key);
        // Fall back to design system label if translation not found
        if (translated === key) {
            return getNavLabel(item);
        }
        return translated;
    };

    return (
        <>
            <nav
                className={`
                    fixed top-0 left-0 right-0 z-50
                    transition-all duration-300
                    ${variant === "transparent" && !scrolled
                        ? "bg-transparent"
                        : "bg-[#0a0a0f]/95 backdrop-blur-xl"
                    }
                    ${scrolled ? "border-b border-white/10 shadow-lg shadow-black/20" : "border-b border-white/5"}
                `}
            >
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
                    <div className="h-16 flex items-center justify-between">
                        {/* Left Section: Logo & Back Button */}
                        <div className="flex items-center gap-4">
                            {showBack ? (
                                <Link
                                    href={backHref}
                                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span className="text-sm font-medium hidden sm:inline">
                                        {language === "ko" ? "뒤로" : "Back"}
                                    </span>
                                </Link>
                            ) : null}

                            {/* Logo */}
                            <Link href="/dashboard" className="flex items-center gap-3 group">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <span className="text-white font-bold text-sm">IF</span>
                                </div>
                                <div className="hidden sm:block">
                                    <span className="text-white font-semibold text-base group-hover:text-emerald-400 transition-colors">
                                        Insight Flow
                                    </span>
                                    {title && (
                                        <span className="text-gray-500 mx-2">/</span>
                                    )}
                                    {title && (
                                        <span className="text-gray-400 text-sm">{title}</span>
                                    )}
                                </div>
                            </Link>
                        </div>

                        {/* Center Section: Navigation Links */}
                        {variant !== "minimal" && (
                            <div className="hidden lg:flex items-center gap-1">
                                {navigationItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`
                                            px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                            ${isActive(item.href)
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                            }
                                        `}
                                        title={item.description}
                                    >
                                        <span className="mr-1.5">{item.icon}</span>
                                        {getTranslatedLabel(item)}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Right Section: User Level + Language + Status */}
                        <div className="flex items-center gap-3">
                            {/* Investor Level Badge */}
                            <button
                                onClick={() => setShowAchievements(true)}
                                className="focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl"
                                aria-label="View achievements and level progress"
                            >
                                <InvestorLevel variant="compact" />
                            </button>

                            {/* Divider */}
                            <div className="w-px h-8 bg-white/10 hidden sm:block" />

                            {/* Language Switcher */}
                            <LanguageSwitcher />

                            {/* Status Indicator */}
                            {statusIndicator && (
                                <>
                                    <div className="w-px h-8 bg-white/10 hidden sm:block" />
                                    {statusIndicator}
                                </>
                            )}

                            {/* Mobile Menu Button */}
                            <MobileMenuButton navigationItems={navigationItems} isActive={isActive} getNavLabel={getNavLabel} />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Achievements Panel */}
            <AchievementsPanel
                isOpen={showAchievements}
                onClose={() => setShowAchievements(false)}
            />
        </>
    );
}

// Mobile Menu Component
function MobileMenuButton({
    navigationItems,
    isActive,
    getNavLabel
}: {
    navigationItems: typeof import("@/lib/designSystem").navigationItems;
    isActive: (href: string) => boolean;
    getNavLabel: (item: typeof navigationItems[0]) => string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="lg:hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                aria-label="Toggle menu"
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute top-full right-0 mt-2 w-64 bg-[#0f1117] rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                        <div className="py-2">
                            {navigationItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 transition-colors
                                        ${isActive(item.href)
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }
                                    `}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <div>
                                        <div className="font-medium">{getNavLabel(item)}</div>
                                        <div className="text-xs text-gray-500">{item.description}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Export a simple status indicator component for consistency
export function StatusIndicator({
    status,
    label
}: {
    status: "live" | "loading" | "error" | "offline";
    label?: string;
}) {
    const statusConfig = {
        live: { color: "bg-emerald-500", pulse: true, text: "Live" },
        loading: { color: "bg-amber-500", pulse: true, text: "Loading" },
        error: { color: "bg-red-500", pulse: false, text: "Error" },
        offline: { color: "bg-gray-500", pulse: false, text: "Offline" },
    };

    const config = statusConfig[status];

    return (
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? "animate-pulse" : ""}`} />
            <span className="text-sm text-gray-400">{label || config.text}</span>
        </div>
    );
}
