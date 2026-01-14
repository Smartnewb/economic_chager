"use client";

import { useEffect, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    subtitle?: string;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    showCloseButton?: boolean;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    footer?: ReactNode;
}

const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[90vw] max-h-[90vh]",
};

export default function Modal({
    isOpen,
    onClose,
    children,
    title,
    subtitle,
    size = "md",
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    footer,
}: ModalProps) {
    // Handle escape key
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && closeOnEscape) {
                onClose();
            }
        },
        [onClose, closeOnEscape]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={closeOnBackdrop ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div
                className={`
                    relative w-full ${sizeClasses[size]}
                    bg-[#0f1117] rounded-2xl border border-white/10
                    shadow-2xl shadow-black/50
                    animate-modal-enter
                `}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "modal-title" : undefined}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-start justify-between p-6 border-b border-white/5">
                        <div>
                            {title && (
                                <h2
                                    id="modal-title"
                                    className="text-xl font-bold text-white"
                                >
                                    {title}
                                </h2>
                            )}
                            {subtitle && (
                                <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
                            )}
                        </div>
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 -mt-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                aria-label="Close modal"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    // Use portal to render at document root
    if (typeof window !== "undefined") {
        return createPortal(modalContent, document.body);
    }
    return null;
}

// Side Panel Component (for analysis panels, etc.)
interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    subtitle?: string;
    position?: "left" | "right";
    width?: "sm" | "md" | "lg" | "xl";
}

const panelWidths = {
    sm: "w-80",
    md: "w-96",
    lg: "w-[480px]",
    xl: "w-[600px]",
};

export function SidePanel({
    isOpen,
    onClose,
    children,
    title,
    subtitle,
    position = "right",
    width = "lg",
}: SidePanelProps) {
    // Handle escape key
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    const panelContent = (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className={`
                    absolute top-0 bottom-0 ${position === "right" ? "right-0" : "left-0"}
                    ${panelWidths[width]}
                    bg-[#0f1117] border-l border-white/10
                    shadow-2xl shadow-black/50
                    flex flex-col
                    ${position === "right" ? "animate-slide-in-right" : "animate-slide-in-left"}
                `}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-white/5 flex-shrink-0">
                    <div>
                        {title && (
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                        )}
                        {subtitle && (
                            <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 -mt-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        aria-label="Close panel"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );

    if (typeof window !== "undefined") {
        return createPortal(panelContent, document.body);
    }
    return null;
}

// Bottom Sheet Component (for mobile)
interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    height?: "auto" | "half" | "full";
}

export function BottomSheet({
    isOpen,
    onClose,
    children,
    title,
    height = "auto",
}: BottomSheetProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const heightClasses = {
        auto: "max-h-[80vh]",
        half: "h-[50vh]",
        full: "h-[90vh]",
    };

    const sheetContent = (
        <div className="fixed inset-0 z-50 flex items-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sheet */}
            <div
                className={`
                    relative w-full ${heightClasses[height]}
                    bg-[#0f1117] rounded-t-3xl border-t border-white/10
                    shadow-2xl
                    animate-slide-up
                `}
                role="dialog"
                aria-modal="true"
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-gray-600 rounded-full" />
                </div>

                {/* Header */}
                {title && (
                    <div className="px-6 pb-4 border-b border-white/5">
                        <h2 className="text-lg font-bold text-white">{title}</h2>
                    </div>
                )}

                {/* Body */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(100% - 80px)" }}>
                    {children}
                </div>
            </div>
        </div>
    );

    if (typeof window !== "undefined") {
        return createPortal(sheetContent, document.body);
    }
    return null;
}
