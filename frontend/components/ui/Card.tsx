"use client";

import { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: "default" | "elevated" | "bordered" | "gradient";
    padding?: "none" | "sm" | "md" | "lg";
    hover?: boolean;
    onClick?: () => void;
}

const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
};

const variantClasses = {
    default: "bg-[#0f1117] border border-white/5",
    elevated: "bg-[#0f1117] border border-white/5 shadow-xl shadow-black/20",
    bordered: "bg-transparent border border-white/10",
    gradient: "bg-gradient-to-br from-[#0f1117] to-[#161921] border border-white/5",
};

export default function Card({
    children,
    className = "",
    variant = "default",
    padding = "md",
    hover = false,
    onClick,
}: CardProps) {
    return (
        <div
            className={`
                rounded-xl overflow-hidden
                ${variantClasses[variant]}
                ${paddingClasses[padding]}
                ${hover ? "hover:border-white/20 hover:bg-[#161921] transition-all cursor-pointer" : ""}
                ${onClick ? "cursor-pointer" : ""}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

// Card Header Component
interface CardHeaderProps {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    action?: ReactNode;
}

export function CardHeader({ title, subtitle, icon, action }: CardHeaderProps) {
    return (
        <div className="flex items-start justify-between pb-4 border-b border-white/5 mb-4">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="text-2xl">{icon}</div>
                )}
                <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
            {action && (
                <div>{action}</div>
            )}
        </div>
    );
}

// Stat Card Component
interface StatCardProps {
    label: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: ReactNode;
    variant?: "default" | "positive" | "negative" | "warning";
}

export function StatCard({
    label,
    value,
    change,
    changeLabel,
    icon,
    variant = "default",
}: StatCardProps) {
    const getChangeColor = () => {
        if (change === undefined) return "";
        if (change > 0) return "text-emerald-400";
        if (change < 0) return "text-red-400";
        return "text-gray-400";
    };

    const getVariantBg = () => {
        switch (variant) {
            case "positive":
                return "bg-emerald-500/5 border-emerald-500/20";
            case "negative":
                return "bg-red-500/5 border-red-500/20";
            case "warning":
                return "bg-amber-500/5 border-amber-500/20";
            default:
                return "bg-[#0f1117] border-white/5";
        }
    };

    return (
        <div className={`p-4 rounded-xl border ${getVariantBg()}`}>
            <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
                {icon && <div className="text-lg">{icon}</div>}
            </div>
            <div className="text-2xl font-bold text-white font-mono">{value}</div>
            {change !== undefined && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${getChangeColor()}`}>
                    {change > 0 ? "↑" : change < 0 ? "↓" : "→"}
                    <span>{change > 0 ? "+" : ""}{change.toFixed(2)}%</span>
                    {changeLabel && <span className="text-gray-500">{changeLabel}</span>}
                </div>
            )}
        </div>
    );
}

// Data Row Component
interface DataRowProps {
    label: string;
    value: string | number;
    subValue?: string;
    trend?: "up" | "down" | "neutral";
    highlight?: boolean;
}

export function DataRow({ label, value, subValue, trend, highlight }: DataRowProps) {
    const getTrendIcon = () => {
        switch (trend) {
            case "up":
                return <span className="text-emerald-400">↑</span>;
            case "down":
                return <span className="text-red-400">↓</span>;
            default:
                return null;
        }
    };

    return (
        <div className={`flex items-center justify-between py-3 border-b border-white/5 last:border-0 ${highlight ? "bg-white/5 -mx-4 px-4" : ""}`}>
            <span className="text-sm text-gray-400">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white font-mono">{value}</span>
                {subValue && <span className="text-xs text-gray-500">{subValue}</span>}
                {getTrendIcon()}
            </div>
        </div>
    );
}

// Price Display Component
interface PriceDisplayProps {
    price: number;
    change: number;
    changePercent: number;
    currency?: string;
    size?: "sm" | "md" | "lg";
}

export function PriceDisplay({
    price,
    change,
    changePercent,
    currency = "$",
    size = "md",
}: PriceDisplayProps) {
    const isPositive = change >= 0;
    const sizeClasses = {
        sm: "text-lg",
        md: "text-2xl",
        lg: "text-4xl",
    };

    return (
        <div>
            <div className={`font-bold text-white font-mono ${sizeClasses[size]}`}>
                {currency}{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center gap-2 mt-1 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                <span className="text-sm">
                    {isPositive ? "+" : ""}{change.toFixed(2)}
                </span>
                <span className="text-sm">
                    ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
                </span>
            </div>
        </div>
    );
}

// Section Container
interface SectionProps {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    action?: ReactNode;
    className?: string;
}

export function Section({ title, subtitle, children, action, className = "" }: SectionProps) {
    return (
        <section className={`mb-8 ${className}`}>
            {(title || action) && (
                <div className="flex items-end justify-between mb-4">
                    <div>
                        {title && (
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                        )}
                        {subtitle && (
                            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
                        )}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}
