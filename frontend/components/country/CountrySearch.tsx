"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCountryStore, AVAILABLE_COUNTRIES } from "@/store/countryStore";

export default function CountrySearch() {
    const router = useRouter();
    const { searchQuery, setSearchQuery, recentCountries, selectCountry } = useCountryStore();
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter countries based on search query
    const filteredCountries = searchQuery.trim()
        ? AVAILABLE_COUNTRIES.filter(
              (c) =>
                  c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.currencyCode.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : AVAILABLE_COUNTRIES;

    // Get recent country profiles
    const recentProfiles = recentCountries
        .map((code) => AVAILABLE_COUNTRIES.find((c) => c.code === code))
        .filter(Boolean);

    // Handle country selection
    const handleSelectCountry = async (code: string) => {
        await selectCountry(code);
        router.push(`/country/${code}`);
        setIsOpen(false);
        setSearchQuery("");
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "Enter") {
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredCountries.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                break;
            case "Enter":
                e.preventDefault();
                if (filteredCountries[highlightedIndex]) {
                    handleSelectCountry(filteredCountries[highlightedIndex].code);
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset highlighted index when search changes
    useEffect(() => {
        setHighlightedIndex(0);
    }, [searchQuery]);

    return (
        <div className="relative w-full max-w-xl mx-auto">
            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search country (e.g., Japan, KR, EUR...)"
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            inputRef.current?.focus();
                        }}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                    {/* Recent Countries */}
                    {!searchQuery && recentProfiles.length > 0 && (
                        <div className="p-3 border-b border-white/10">
                            <div className="text-xs text-gray-500 mb-2">Recent</div>
                            <div className="flex gap-2">
                                {recentProfiles.map((country) => (
                                    <button
                                        key={country!.code}
                                        onClick={() => handleSelectCountry(country!.code)}
                                        className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        <span>{country!.flag}</span>
                                        <span className="text-sm text-white">{country!.code}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Country List */}
                    <div className="max-h-80 overflow-y-auto">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country, index) => (
                                <button
                                    key={country.code}
                                    onClick={() => handleSelectCountry(country.code)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                        index === highlightedIndex
                                            ? "bg-purple-600/30"
                                            : "hover:bg-white/10"
                                    }`}
                                >
                                    <span className="text-2xl">{country.flag}</span>
                                    <div className="flex-1 text-left">
                                        <div className="text-white font-medium">{country.name}</div>
                                        <div className="text-xs text-gray-400">
                                            {country.code} • {country.currency} ({country.currencyCode})
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">{country.region}</div>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-400">
                                No countries found for &quot;{searchQuery}&quot;
                            </div>
                        )}
                    </div>

                    {/* Keyboard hints */}
                    <div className="p-2 border-t border-white/10 flex gap-4 justify-center text-xs text-gray-500">
                        <span>↑↓ Navigate</span>
                        <span>↵ Select</span>
                        <span>Esc Close</span>
                    </div>
                </div>
            )}
        </div>
    );
}
