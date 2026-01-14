"use client";

import { useEffect, useRef, useMemo } from "react";
import { useWeatherStore, EconomicWeather } from "@/store/weatherStore";

// Economic zone data with real coordinates
const ZONES = [
    { id: "usa", name: "USD", fullName: "United States", coordinates: [-98.5, 39.8], color: [30, 144, 255], flag: "US" },
    { id: "eu", name: "EUR", fullName: "Eurozone", coordinates: [10.0, 51.0], color: [255, 215, 0], flag: "EU" },
    { id: "japan", name: "JPY", fullName: "Japan", coordinates: [138.2, 36.2], color: [255, 99, 71], flag: "JP" },
    { id: "china", name: "CNY", fullName: "China", coordinates: [104.1, 35.8], color: [255, 69, 0], flag: "CN" },
    { id: "uk", name: "GBP", fullName: "United Kingdom", coordinates: [-1.5, 52.0], color: [147, 112, 219], flag: "GB" },
    { id: "korea", name: "KRW", fullName: "South Korea", coordinates: [127.7, 35.9], color: [50, 205, 50], flag: "KR" },
    { id: "brazil", name: "BRL", fullName: "Brazil", coordinates: [-51.9, -14.2], color: [34, 139, 34], flag: "BR" },
    { id: "india", name: "INR", fullName: "India", coordinates: [78.9, 20.5], color: [255, 165, 0], flag: "IN" },
];

// Dynamic flow data based on weather
function generateFlows(weather: EconomicWeather | null) {
    if (!weather) {
        return [
            { source: "japan", target: "usa", volume: 0.5, type: "neutral" as const },
            { source: "eu", target: "usa", volume: 0.4, type: "neutral" as const },
        ];
    }

    const flows: { source: string; target: string; volume: number; type: "risk-on" | "risk-off" | "neutral" }[] = [];

    if (weather.globalSentiment === "risk_off") {
        // Money flows TO safe havens (USD, JPY, Gold proxies)
        flows.push(
            { source: "korea", target: "usa", volume: 0.9, type: "risk-off" },
            { source: "brazil", target: "usa", volume: 0.8, type: "risk-off" },
            { source: "india", target: "usa", volume: 0.7, type: "risk-off" },
            { source: "china", target: "japan", volume: 0.5, type: "risk-off" },
            { source: "eu", target: "usa", volume: 0.6, type: "risk-off" }
        );
    } else if (weather.globalSentiment === "risk_on") {
        // Money flows TO emerging markets and risk assets
        flows.push(
            { source: "usa", target: "korea", volume: 0.7, type: "risk-on" },
            { source: "usa", target: "brazil", volume: 0.8, type: "risk-on" },
            { source: "usa", target: "india", volume: 0.6, type: "risk-on" },
            { source: "japan", target: "china", volume: 0.5, type: "risk-on" },
            { source: "eu", target: "brazil", volume: 0.4, type: "risk-on" }
        );
    } else {
        // Balanced flows
        flows.push(
            { source: "usa", target: "eu", volume: 0.3, type: "neutral" },
            { source: "japan", target: "korea", volume: 0.3, type: "neutral" },
            { source: "china", target: "india", volume: 0.3, type: "neutral" }
        );
    }

    return flows;
}

function getZoneById(id: string) {
    return ZONES.find((z) => z.id === id);
}

interface WeatherGlobeProps {
    className?: string;
    interactive?: boolean;
}

export default function WeatherGlobe({ className = "", interactive = false }: WeatherGlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const rotationRef = useRef(0);
    const { weather } = useWeatherStore();

    const flows = useMemo(() => generateFlows(weather), [weather]);

    // Get color based on weather sentiment
    const getSentimentColors = () => {
        if (!weather) return { primary: "59, 130, 246", secondary: "147, 197, 253" };

        switch (weather.globalSentiment) {
            case "risk_off":
                return { primary: "59, 130, 246", secondary: "96, 165, 250" }; // Blue (cold/safe)
            case "risk_on":
                return { primary: "251, 191, 36", secondary: "252, 211, 77" }; // Yellow/Gold (hot/risk)
            default:
                return { primary: "156, 163, 175", secondary: "209, 213, 219" }; // Gray (neutral)
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };
        resize();
        window.addEventListener("resize", resize);

        const colors = getSentimentColors();

        const animate = () => {
            if (!ctx || !canvas) return;

            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            ctx.clearRect(0, 0, width, height);

            // Background with sentiment-based gradient
            const bgGradient = ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.max(width, height) / 2
            );
            bgGradient.addColorStop(0, `rgba(${colors.primary}, 0.05)`);
            bgGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)");
            bgGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) * 0.35;

            // Draw outer glow ring based on sentiment
            const glowIntensity = weather?.globalSentiment === "risk_off" ? 0.3 :
                                  weather?.globalSentiment === "risk_on" ? 0.4 : 0.2;

            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = `rgba(${colors.primary}, ${glowIntensity - i * 0.1})`;
                ctx.lineWidth = 3 - i;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius + 10 + i * 5, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw globe circle
            const globeGradient = ctx.createRadialGradient(
                centerX - radius * 0.3, centerY - radius * 0.3, 0,
                centerX, centerY, radius
            );
            globeGradient.addColorStop(0, "rgba(30, 41, 59, 0.8)");
            globeGradient.addColorStop(1, "rgba(15, 23, 42, 0.9)");
            ctx.fillStyle = globeGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Grid lines
            ctx.strokeStyle = `rgba(${colors.secondary}, 0.1)`;
            ctx.lineWidth = 0.5;

            // Latitude lines
            for (let lat = -60; lat <= 60; lat += 30) {
                const y = centerY + (lat / 90) * radius;
                const latRadius = Math.cos((lat * Math.PI) / 180) * radius;
                ctx.beginPath();
                ctx.ellipse(centerX, y, latRadius, latRadius * 0.15, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Longitude lines (rotating)
            for (let lon = 0; lon < 180; lon += 30) {
                const angle = (lon * Math.PI) / 180 + rotationRef.current;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, Math.abs(Math.sin(angle)) * radius, radius, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Calculate zone positions
            const zonePositions: Map<string, { x: number; y: number; visible: boolean }> = new Map();

            ZONES.forEach((zone, index) => {
                const baseAngle = (index / ZONES.length) * Math.PI * 2;
                const angle = baseAngle + rotationRef.current;
                const depth = Math.cos(angle);
                const visible = depth > -0.3;

                const x = centerX + Math.sin(angle) * radius * 0.8;
                const y = centerY + Math.cos(baseAngle) * radius * 0.35;

                zonePositions.set(zone.id, { x, y, visible });
            });

            // Draw flow arcs (behind nodes)
            flows.forEach((flow) => {
                const sourcePos = zonePositions.get(flow.source);
                const targetPos = zonePositions.get(flow.target);
                if (!sourcePos || !targetPos) return;

                const midX = (sourcePos.x + targetPos.x) / 2;
                const midY = Math.min(sourcePos.y, targetPos.y) - 60 * flow.volume;

                // Arc gradient based on flow type
                const arcGradient = ctx.createLinearGradient(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y);
                if (flow.type === "risk-on") {
                    arcGradient.addColorStop(0, "rgba(251, 191, 36, 0.6)");
                    arcGradient.addColorStop(0.5, "rgba(245, 158, 11, 0.8)");
                    arcGradient.addColorStop(1, "rgba(217, 119, 6, 0.6)");
                } else if (flow.type === "risk-off") {
                    arcGradient.addColorStop(0, "rgba(59, 130, 246, 0.6)");
                    arcGradient.addColorStop(0.5, "rgba(96, 165, 250, 0.8)");
                    arcGradient.addColorStop(1, "rgba(147, 197, 253, 0.6)");
                } else {
                    arcGradient.addColorStop(0, "rgba(156, 163, 175, 0.4)");
                    arcGradient.addColorStop(1, "rgba(209, 213, 219, 0.4)");
                }

                ctx.strokeStyle = arcGradient;
                ctx.lineWidth = flow.volume * 4;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(sourcePos.x, sourcePos.y);
                ctx.quadraticCurveTo(midX, midY, targetPos.x, targetPos.y);
                ctx.stroke();

                // Animated particles along the arc
                const particleCount = Math.ceil(flow.volume * 3);
                for (let p = 0; p < particleCount; p++) {
                    const offset = p / particleCount;
                    const t = ((Date.now() / (2000 - flow.volume * 500) + offset) % 1);
                    const px = (1 - t) * (1 - t) * sourcePos.x + 2 * (1 - t) * t * midX + t * t * targetPos.x;
                    const py = (1 - t) * (1 - t) * sourcePos.y + 2 * (1 - t) * t * midY + t * t * targetPos.y;

                    const particleGlow = ctx.createRadialGradient(px, py, 0, px, py, 8);
                    if (flow.type === "risk-on") {
                        particleGlow.addColorStop(0, "rgba(251, 191, 36, 1)");
                        particleGlow.addColorStop(1, "rgba(251, 191, 36, 0)");
                    } else if (flow.type === "risk-off") {
                        particleGlow.addColorStop(0, "rgba(96, 165, 250, 1)");
                        particleGlow.addColorStop(1, "rgba(96, 165, 250, 0)");
                    } else {
                        particleGlow.addColorStop(0, "rgba(156, 163, 175, 0.8)");
                        particleGlow.addColorStop(1, "rgba(156, 163, 175, 0)");
                    }

                    ctx.fillStyle = particleGlow;
                    ctx.beginPath();
                    ctx.arc(px, py, 6 * flow.volume, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Draw zone nodes
            ZONES.forEach((zone) => {
                const pos = zonePositions.get(zone.id);
                if (!pos) return;

                const zoneColor = `rgb(${zone.color.join(",")})`;

                // Glow effect
                const glowGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 25);
                glowGradient.addColorStop(0, `rgba(${zone.color.join(",")}, 0.8)`);
                glowGradient.addColorStop(0.5, `rgba(${zone.color.join(",")}, 0.3)`);
                glowGradient.addColorStop(1, `rgba(${zone.color.join(",")}, 0)`);
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
                ctx.fill();

                // Node circle
                const nodeGradient = ctx.createRadialGradient(
                    pos.x - 3, pos.y - 3, 0,
                    pos.x, pos.y, 12
                );
                nodeGradient.addColorStop(0, `rgba(${zone.color.join(",")}, 1)`);
                nodeGradient.addColorStop(1, `rgba(${zone.color.map(c => c * 0.7).join(",")}, 1)`);
                ctx.fillStyle = nodeGradient;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
                ctx.fill();

                // Border
                ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
                ctx.lineWidth = 1;
                ctx.stroke();

                // Label
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                ctx.font = "bold 11px Inter, system-ui, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(zone.name, pos.x, pos.y + 22);
            });

            // Slow rotation
            rotationRef.current += 0.001;
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationRef.current);
        };
    }, [weather, flows]);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full ${className}`}
            style={{
                pointerEvents: interactive ? "auto" : "none",
                touchAction: interactive ? "none" : "auto"
            }}
        />
    );
}
