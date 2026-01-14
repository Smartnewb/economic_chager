/**
 * Unified Design System for Insight Flow
 * Based on professional trading platform aesthetics (QUME, TradeVision, E8 Markets style)
 */

// Color Palette - Dark Theme
export const colors = {
  // Base colors
  background: {
    primary: "#0a0a0f",      // Main background - deep dark
    secondary: "#0f1117",     // Card backgrounds
    tertiary: "#161921",      // Elevated surfaces
    overlay: "rgba(0, 0, 0, 0.8)", // Modal overlays
  },

  // Accent colors
  accent: {
    primary: "#10b981",       // Emerald - primary actions
    secondary: "#06b6d4",     // Cyan - secondary elements
    highlight: "#f59e0b",     // Amber - highlights/warnings
    purple: "#8b5cf6",        // Purple - special features
  },

  // Semantic colors
  status: {
    positive: "#22c55e",      // Green - gains/success
    negative: "#ef4444",      // Red - losses/errors
    warning: "#f59e0b",       // Amber - warnings
    info: "#3b82f6",          // Blue - information
    neutral: "#6b7280",       // Gray - neutral
  },

  // Text colors
  text: {
    primary: "#ffffff",
    secondary: "#9ca3af",
    tertiary: "#6b7280",
    muted: "#4b5563",
  },

  // Border colors
  border: {
    default: "rgba(255, 255, 255, 0.1)",
    hover: "rgba(255, 255, 255, 0.2)",
    active: "rgba(16, 185, 129, 0.5)",
  },
};

// Gradients
export const gradients = {
  primary: "from-emerald-500 to-teal-600",
  secondary: "from-cyan-500 to-blue-600",
  accent: "from-amber-500 to-orange-600",
  purple: "from-purple-500 to-violet-600",
  danger: "from-red-500 to-pink-600",
  dark: "from-gray-900 to-gray-950",
  glow: {
    emerald: "shadow-[0_0_30px_rgba(16,185,129,0.3)]",
    cyan: "shadow-[0_0_30px_rgba(6,182,212,0.3)]",
    red: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
  },
};

// Typography
export const typography = {
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "JetBrains Mono, Fira Code, monospace",
  },
  fontSize: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
  },
};

// Spacing
export const spacing = {
  section: "24px",
  card: "16px",
  element: "12px",
  tight: "8px",
  micro: "4px",
};

// Border Radius
export const borderRadius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  full: "9999px",
};

// Component Styles (Tailwind classes)
export const componentStyles = {
  // Navigation
  nav: {
    container: "fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5",
    inner: "max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between",
    logo: "flex items-center gap-3",
    links: "flex items-center gap-1",
    link: {
      base: "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
      active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      inactive: "text-gray-400 hover:text-white hover:bg-white/5",
    },
  },

  // Cards
  card: {
    base: "bg-[#0f1117] rounded-xl border border-white/5 overflow-hidden",
    hover: "hover:border-white/10 hover:bg-[#161921] transition-all duration-200",
    padding: "p-5",
    header: "flex items-center justify-between pb-4 border-b border-white/5",
    title: "text-sm font-semibold text-white uppercase tracking-wide",
  },

  // Buttons
  button: {
    primary: "px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20",
    secondary: "px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200",
    danger: "px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg border border-red-500/20 transition-all duration-200",
    ghost: "px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200",
    icon: "p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all duration-200",
  },

  // Inputs
  input: {
    base: "w-full px-4 py-2.5 bg-[#0a0a0f] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200",
    select: "appearance-none cursor-pointer",
  },

  // Data Display
  data: {
    label: "text-xs text-gray-500 uppercase tracking-wide mb-1",
    value: "text-lg font-semibold text-white font-mono",
    change: {
      positive: "text-emerald-400",
      negative: "text-red-400",
      neutral: "text-gray-400",
    },
  },

  // Charts
  chart: {
    container: "bg-[#0a0a0f] rounded-xl border border-white/5 p-4",
    grid: "stroke-white/5",
    line: {
      positive: "#22c55e",
      negative: "#ef4444",
      neutral: "#6b7280",
    },
  },

  // Tables
  table: {
    container: "overflow-x-auto",
    header: "text-xs text-gray-500 uppercase tracking-wide text-left py-3 px-4 border-b border-white/5",
    row: "border-b border-white/5 hover:bg-white/5 transition-colors",
    cell: "py-3 px-4 text-sm",
  },

  // Modals
  modal: {
    overlay: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4",
    container: "bg-[#0f1117] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl",
    header: "flex items-center justify-between p-6 border-b border-white/5",
    body: "p-6 overflow-y-auto",
    footer: "flex items-center justify-end gap-3 p-6 border-t border-white/5",
  },

  // Sidebar
  sidebar: {
    container: "fixed right-0 top-0 bottom-0 w-96 bg-[#0f1117] border-l border-white/5 z-40 shadow-2xl",
    header: "flex items-center justify-between p-6 border-b border-white/5",
    body: "p-6 overflow-y-auto h-[calc(100vh-80px)]",
  },

  // Badges
  badge: {
    base: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    neutral: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  },

  // Stats
  stat: {
    container: "flex flex-col gap-1",
    label: "text-xs text-gray-500",
    value: "text-xl font-bold text-white font-mono",
    trend: {
      up: "flex items-center gap-1 text-emerald-400 text-xs",
      down: "flex items-center gap-1 text-red-400 text-xs",
    },
  },
};

// Layout
export const layout = {
  maxWidth: "1920px",
  navHeight: "64px",
  sidebarWidth: "280px",
  panelWidth: "384px",
};

// Z-Index Scale
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
};

// Animation
export const animation = {
  duration: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
  },
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
};

// Main Navigation Items - Consistent across all pages
export const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    labelKo: "대시보드",
    icon: "📊",
    description: "Overview of all markets",
  },
  {
    href: "/globe",
    label: "Globe",
    labelKo: "글로벌",
    icon: "🌐",
    description: "World market map",
  },
  {
    href: "/bonds",
    label: "Bonds",
    labelKo: "채권",
    icon: "📈",
    description: "Bond yields & spreads",
  },
  {
    href: "/stocks",
    label: "Stocks",
    labelKo: "주식",
    icon: "💹",
    description: "Stock market data",
  },
  {
    href: "/whale",
    label: "Whale",
    labelKo: "웨일",
    icon: "🐋",
    description: "Smart money tracking",
  },
  {
    href: "/macro",
    label: "Macro",
    labelKo: "매크로",
    icon: "📈",
    description: "Macro health check",
  },
  {
    href: "/history",
    label: "History",
    labelKo: "히스토리",
    icon: "📜",
    description: "Historical patterns",
  },
  {
    href: "/policy",
    label: "Policy",
    labelKo: "정책",
    icon: "🏛️",
    description: "Central bank policies",
  },
  {
    href: "/country",
    label: "Countries",
    labelKo: "국가",
    icon: "🗺️",
    description: "Country analysis",
  },
  {
    href: "/economy",
    label: "Economy",
    labelKo: "경제",
    icon: "📉",
    description: "Economic indicators",
  },
  {
    href: "/insights",
    label: "Insights",
    labelKo: "인사이트",
    icon: "💡",
    description: "News & analysis",
  },
];

// Helper function to get change color class
export function getChangeColor(value: number): string {
  if (value > 0) return componentStyles.data.change.positive;
  if (value < 0) return componentStyles.data.change.negative;
  return componentStyles.data.change.neutral;
}

// Helper function to format change value
export function formatChange(value: number, showSign = true): string {
  const sign = value > 0 ? "+" : "";
  return showSign ? `${sign}${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
}

// Helper function to get badge style
export function getBadgeStyle(type: "success" | "danger" | "warning" | "info" | "neutral"): string {
  return componentStyles.badge[type];
}
