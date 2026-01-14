"use client";

import { useState, useRef, useEffect } from 'react';
import { getHelpContent, HelpItem } from '@/lib/helpContent';

interface HelpTooltipProps {
    helpKey: string;
    children?: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    showIcon?: boolean;
    className?: string;
}

export default function HelpTooltip({
    helpKey,
    children,
    position = 'top',
    showIcon = true,
    className = '',
}: HelpTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const helpItem = getHelpContent(helpKey);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                tooltipRef.current &&
                !tooltipRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setShowFullDescription(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!helpItem) {
        return children ? <>{children}</> : null;
    }

    const getPositionClasses = () => {
        switch (position) {
            case 'top':
                return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
            case 'bottom':
                return 'top-full left-1/2 -translate-x-1/2 mt-2';
            case 'left':
                return 'right-full top-1/2 -translate-y-1/2 mr-2';
            case 'right':
                return 'left-full top-1/2 -translate-y-1/2 ml-2';
            default:
                return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
        }
    };

    return (
        <div className={`relative inline-flex items-center gap-1 ${className}`}>
            {children}
            {showIcon && (
                <div
                    ref={triggerRef}
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    className="cursor-pointer text-gray-500 hover:text-blue-400 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            )}

            {/* Tooltip Panel */}
            {isOpen && (
                <div
                    ref={tooltipRef}
                    className={`absolute z-50 ${getPositionClasses()} w-72 bg-[#18181b] border border-[#27272a] rounded-lg shadow-xl`}
                >
                    {/* Arrow */}
                    <div
                        className={`absolute w-2 h-2 bg-[#18181b] border-[#27272a] transform rotate-45 ${
                            position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b' :
                            position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t' :
                            position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-r border-t' :
                            'left-[-5px] top-1/2 -translate-y-1/2 border-l border-b'
                        }`}
                    />

                    <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-white text-sm">{helpItem.title}</h4>
                            <button
                                onClick={() => { setIsOpen(false); setShowFullDescription(false); }}
                                className="text-gray-500 hover:text-white text-xs"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Short Description */}
                        <p className="text-xs text-gray-300 mb-3">
                            {showFullDescription ? helpItem.fullDescription : helpItem.shortDescription}
                        </p>

                        {/* Toggle Full Description */}
                        {!showFullDescription && helpItem.fullDescription !== helpItem.shortDescription && (
                            <button
                                onClick={() => setShowFullDescription(true)}
                                className="text-[10px] text-blue-400 hover:text-blue-300 mb-3"
                            >
                                Show more...
                            </button>
                        )}

                        {/* Interpretation */}
                        {helpItem.interpretation && (
                            <div className="mb-3 space-y-1">
                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Interpretation</div>
                                <div className="text-[10px] text-green-400">
                                    <span className="font-bold">Bullish:</span> {helpItem.interpretation.bullish}
                                </div>
                                <div className="text-[10px] text-red-400">
                                    <span className="font-bold">Bearish:</span> {helpItem.interpretation.bearish}
                                </div>
                                {helpItem.interpretation.neutral && (
                                    <div className="text-[10px] text-gray-400">
                                        <span className="font-bold">Neutral:</span> {helpItem.interpretation.neutral}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Learn More Link */}
                        {helpItem.learnMoreUrl && (
                            <a
                                href={helpItem.learnMoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <span>Learn More</span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                                </svg>
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
