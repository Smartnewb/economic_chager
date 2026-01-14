"use client";

import { useEffect, useRef, useState } from "react";

// Economic zone coordinates - 태평양 중심, 대한민국 기준
const ZONES = [
    { id: "korea", name: "대한민국", coordinates: [127.7, 37.5], color: [50, 205, 50] }, // 서울 중심
    { id: "usa", name: "미국", coordinates: [-98.5, 39.8], color: [30, 144, 255] },
    { id: "japan", name: "일본", coordinates: [138.2, 36.2], color: [255, 99, 71] },
    { id: "china", name: "중국", coordinates: [104.1, 35.8], color: [255, 215, 0] },
    { id: "eu", name: "유럽", coordinates: [10, 51], color: [100, 149, 237] },
    { id: "australia", name: "호주", coordinates: [151.2, -33.9], color: [255, 140, 0] },
    { id: "uk", name: "영국", coordinates: [-0.1, 51.5], color: [138, 43, 226] },
    { id: "canada", name: "캐나다", coordinates: [-106.3, 56.1], color: [220, 20, 60] },
];

// Capital flow data - 대한민국에서 다른 국가로 연결
const FLOWS = [
    { source: "korea", target: "usa", volume: 0.8, type: "risk-off" },
    { source: "korea", target: "japan", volume: 0.6, type: "neutral" },
    { source: "korea", target: "china", volume: 0.7, type: "risk-on" },
    { source: "korea", target: "eu", volume: 0.5, type: "risk-off" },
    { source: "korea", target: "australia", volume: 0.4, type: "risk-on" },
    { source: "korea", target: "uk", volume: 0.3, type: "neutral" },
    { source: "korea", target: "canada", volume: 0.2, type: "risk-on" },
];

function getZoneById(id: string) {
    return ZONES.find((z) => z.id === id);
}

export default function Globe() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };
        resize();
        window.addEventListener("resize", resize);

        // Animation loop
        const animate = () => {
            if (!ctx || !canvas) return;

            // Clear canvas
            ctx.fillStyle = "transparent";
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background gradient
            const gradient = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                0,
                canvas.width / 2,
                canvas.height / 2,
                canvas.width / 2
            );
            gradient.addColorStop(0, "#0f172a");
            gradient.addColorStop(0.5, "#020617");
            gradient.addColorStop(1, "#000000");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw globe circle outline
            ctx.strokeStyle = "rgba(59, 130, 246, 0.2)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 200, 0, Math.PI * 2);
            ctx.stroke();

            // Draw latitude lines
            ctx.strokeStyle = "rgba(59, 130, 246, 0.1)";
            ctx.lineWidth = 1;
            for (let i = -60; i <= 60; i += 30) {
                const y = canvas.height / 2 + (i / 90) * 200;
                const width = Math.cos((i * Math.PI) / 180) * 200;
                ctx.beginPath();
                ctx.ellipse(canvas.width / 2, y, width, 20, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Calculate positions for zones (3D projection)
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 180;

            // 태평양 중심 회전 오프셋 (대한민국이 정면에 오도록)
            const pacificCenterOffset = -Math.PI * 0.7; // 태평양 중심으로 회전

            // Draw zones as dots (3D globe projection)
            ZONES.forEach((zone) => {
                // 경도/위도를 라디안으로 변환
                const lon = (zone.coordinates[0] * Math.PI) / 180;
                const lat = (zone.coordinates[1] * Math.PI) / 180;

                // 회전 적용
                const rotatedLon = lon + rotation + pacificCenterOffset;

                // 3D 구 좌표를 2D 투영
                const x = centerX + radius * Math.cos(lat) * Math.sin(rotatedLon);
                const y = centerY - radius * Math.sin(lat);
                const z = radius * Math.cos(lat) * Math.cos(rotatedLon);

                // 뒷면에 있는 노드는 투명하게
                if (z < -radius * 0.3) return;

                // Glow effect
                const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
                glowGradient.addColorStop(0, `rgba(${zone.color.join(",")}, 0.8)`);
                glowGradient.addColorStop(1, `rgba(${zone.color.join(",")}, 0)`);
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(x, y, 20, 0, Math.PI * 2);
                ctx.fill();

                // Node - 크기를 z값에 따라 조정 (가까울수록 크게)
                const nodeSize = 6 + (z / radius) * 4;
                const opacity = 0.5 + (z / radius) * 0.5;

                ctx.fillStyle = `rgba(${zone.color.join(",")}, ${opacity})`;
                ctx.beginPath();
                ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
                ctx.fill();

                // Label - 대한민국은 강조
                ctx.fillStyle = zone.id === "korea"
                    ? "rgba(50, 255, 50, 0.9)"
                    : `rgba(255, 255, 255, ${opacity * 0.7})`;
                ctx.font = zone.id === "korea" ? "bold 14px Inter, sans-serif" : "11px Inter, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(zone.name, x, y + 25);
            });

            // Draw flow arcs (대한민국에서 다른 국가로)
            FLOWS.forEach((flow) => {
                const sourceZone = getZoneById(flow.source);
                const targetZone = getZoneById(flow.target);
                if (!sourceZone || !targetZone) return;

                // 소스와 타겟 좌표 계산
                const sourceLon = (sourceZone.coordinates[0] * Math.PI) / 180;
                const sourceLat = (sourceZone.coordinates[1] * Math.PI) / 180;
                const targetLon = (targetZone.coordinates[0] * Math.PI) / 180;
                const targetLat = (targetZone.coordinates[1] * Math.PI) / 180;

                const sourceRotatedLon = sourceLon + rotation + pacificCenterOffset;
                const targetRotatedLon = targetLon + rotation + pacificCenterOffset;

                const sourceX = centerX + radius * Math.cos(sourceLat) * Math.sin(sourceRotatedLon);
                const sourceY = centerY - radius * Math.sin(sourceLat);
                const sourceZ = radius * Math.cos(sourceLat) * Math.cos(sourceRotatedLon);

                const targetX = centerX + radius * Math.cos(targetLat) * Math.sin(targetRotatedLon);
                const targetY = centerY - radius * Math.sin(targetLat);
                const targetZ = radius * Math.cos(targetLat) * Math.cos(targetRotatedLon);

                // 뒷면 연결선은 그리지 않음
                if (sourceZ < -radius * 0.3 || targetZ < -radius * 0.3) return;

                // Control point for curve
                const midX = (sourceX + targetX) / 2;
                const midY = (sourceY + targetY) / 2 - 80;

                // Draw arc - 대한민국(초록)에서 출발
                const arcGradient = ctx.createLinearGradient(sourceX, sourceY, targetX, targetY);
                if (flow.type === "risk-on") {
                    arcGradient.addColorStop(0, "rgba(50, 205, 50, 0.7)"); // 대한민국 초록
                    arcGradient.addColorStop(1, "rgba(255, 215, 0, 0.6)"); // 골드
                } else if (flow.type === "risk-off") {
                    arcGradient.addColorStop(0, "rgba(50, 205, 50, 0.7)");
                    arcGradient.addColorStop(1, "rgba(30, 144, 255, 0.6)"); // 블루
                } else {
                    arcGradient.addColorStop(0, "rgba(50, 205, 50, 0.7)");
                    arcGradient.addColorStop(1, "rgba(169, 169, 169, 0.6)"); // 그레이
                }

                ctx.strokeStyle = arcGradient;
                ctx.lineWidth = flow.volume * 3;
                ctx.beginPath();
                ctx.moveTo(sourceX, sourceY);
                ctx.quadraticCurveTo(midX, midY, targetX, targetY);
                ctx.stroke();

                // Animated particle - 대한민국에서 출발
                const t = ((Date.now() / 2000 + FLOWS.indexOf(flow) * 0.2) % 1);
                const px = (1 - t) * (1 - t) * sourceX + 2 * (1 - t) * t * midX + t * t * targetX;
                const py = (1 - t) * (1 - t) * sourceY + 2 * (1 - t) * t * midY + t * t * targetY;

                const targetColor = getZoneById(flow.target)?.color || [255, 255, 255];
                ctx.fillStyle = `rgba(${targetColor.join(",")}, 0.9)`;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            setRotation((r) => r + 0.002);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 0, pointerEvents: "none" }}
        />
    );
}
