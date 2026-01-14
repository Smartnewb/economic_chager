"use client";

import { useState, useEffect } from "react";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // Clock ticker
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <html lang="en">
      <body className="bg-[#050505] text-[#e0e0e0] font-mono h-screen w-screen overflow-hidden flex flex-col">
        <I18nProvider>
          {/* TOP BAR: Ticker & Status */}
          <header className="h-8 bg-[#111116] border-b border-[#27272a] flex items-center justify-between px-4 text-[10px] uppercase tracking-wider shrink-0 z-50">
            <div className="flex items-center gap-4">
              <span className="font-bold text-blue-400">INSIGHT FLOW TERMINAL</span>
              <div className="w-px h-3 bg-[#27272a]"></div>
              <div className="flex gap-4 overflow-hidden mask-fade-right">
                {/* Mock Ticker */}
                <span className="text-emerald-500">SPX 6,240.50 ▲ +0.45%</span>
                <span className="text-red-500">DXY 103.40 ▼ -0.12%</span>
                <span className="text-emerald-500">BTC 105,200 ▲ +1.20%</span>
                <span className="text-gray-400">US10Y 4.45% ▬ 0.00%</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-gray-500">
              <span className="text-yellow-500/80">● LIVE CONNECTION</span>
              <span>{currentTime}</span>
            </div>
          </header>

          {/* MAIN BODY: Content Only */}
          <div className="flex-1 relative overflow-hidden bg-[#050505]">
            {children}
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
