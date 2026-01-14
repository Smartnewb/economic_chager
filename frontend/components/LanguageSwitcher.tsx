"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n, Language, languageNames, languageFlags } from "@/lib/i18n";

export default function LanguageSwitcher() {
    const { language, setLanguage } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const languages: Language[] = ["en", "ko", "zh", "ja"];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Current Language Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10"
            >
                <span className="text-lg">{languageFlags[language]}</span>
                <span className="text-sm text-white font-medium hidden sm:inline">
                    {languageNames[language]}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-900/95 backdrop-blur-lg rounded-xl border border-white/10 shadow-xl overflow-hidden z-50">
                    {languages.map((lang) => (
                        <button
                            key={lang}
                            onClick={() => {
                                setLanguage(lang);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                                language === lang
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "text-white hover:bg-white/10"
                            }`}
                        >
                            <span className="text-lg">{languageFlags[lang]}</span>
                            <span className="text-sm font-medium">{languageNames[lang]}</span>
                            {language === lang && (
                                <svg
                                    className="w-4 h-4 ml-auto text-purple-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
