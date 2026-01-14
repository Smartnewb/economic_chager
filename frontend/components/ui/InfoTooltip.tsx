"use client";

import { useState, useRef, useEffect } from "react";

interface InfoTooltipProps {
    content: string;
    className?: string;
}

export default function InfoTooltip({ content, className = "" }: InfoTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<"top" | "bottom">("top");
    const tooltipRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isVisible && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // If button is in top half of screen, show tooltip below
            setPosition(rect.top < window.innerHeight / 2 ? "bottom" : "top");
        }
    }, [isVisible]);

    return (
        <div className={`relative inline-flex ${className}`}>
            <button
                ref={buttonRef}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onClick={() => setIsVisible(!isVisible)}
                className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] text-gray-400 hover:text-white transition-all cursor-help"
                aria-label="More information"
            >
                ?
            </button>

            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={`absolute z-50 w-64 p-3 text-xs text-white bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl ${
                        position === "top"
                            ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
                            : "top-full mt-2 left-1/2 -translate-x-1/2"
                    }`}
                >
                    <div className="leading-relaxed">{content}</div>
                    {/* Arrow */}
                    <div
                        className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-white/20 rotate-45 ${
                            position === "top"
                                ? "bottom-[-5px] border-r border-b"
                                : "top-[-5px] border-l border-t"
                        }`}
                    />
                </div>
            )}
        </div>
    );
}
