import { useRef, useEffect, useCallback } from "react";

const statusConfig = {
  listening: {
    color: "#3b82f6",
    gradient: ["#3b82f6", "#60a5fa"],
    glow: "#93c5fd",
  },
  speaking: {
    color: "#22c55e",
    gradient: ["#22c55e", "#4ade80"],
    glow: "#86efac",
  },
  assistant_speaking: {
    color: "#a855f7",
    gradient: ["#a855f7", "#c084fc"],
    glow: "#d8b4fe",
  },
  processing: {
    color: "#f59e0b",
    gradient: ["#f59e0b", "#fbbf24"],
    glow: "#fcd34d",
  },
  idle: {
    color: "#6b7280",
    gradient: ["#6b7280", "#9ca3af"],
    glow: "#d1d5db",
  },
  error: {
    color: "#ef4444",
    gradient: ["#ef4444", "#f87171"],
    glow: "#fca5a5",
  },
};

export default function AudioOrb({
  status,
  audioLevel,
  isUserSpeaking,
  isAssistantSpeaking,
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const targetLevelRef = useRef(0);
  const currentLevelRef = useRef(0);

  const getStatusType = useCallback(
    (status) => {
      // Priority order: user speaking > assistant speaking > processing > listening > error > idle
      if (isUserSpeaking) return "speaking";
      if (isAssistantSpeaking) return "assistant_speaking";
      if (
        status.includes("Thinking") ||
        status.includes("Sending") ||
        status.includes("Generating")
      ) {
        return "processing";
      }
      if (status.includes("Listening")) return "listening";
      if (status.includes("Error")) return "error";
      return "idle";
    },
    [isUserSpeaking, isAssistantSpeaking]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const canvasSize = 300;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
    ctx.scale(dpr, dpr);

    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const baseRadius = 60;

    const animate = () => {
      timeRef.current += 0.016;

      targetLevelRef.current = audioLevel;
      currentLevelRef.current +=
        (targetLevelRef.current - currentLevelRef.current) * 0.1;

      ctx.clearRect(0, 0, canvasSize, canvasSize);
      const statusType = getStatusType(status);
      const config = statusConfig[statusType];

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        baseRadius + 40
      );
      gradient.addColorStop(0, config.gradient[0]);
      gradient.addColorStop(1, config.gradient[1]);

      ctx.shadowBlur = 30;
      ctx.shadowColor = config.glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + 20, 0, Math.PI * 2);
      ctx.fillStyle = config.glow + "30";
      ctx.fill();

      ctx.shadowBlur = 20;
      ctx.shadowColor = config.color;
      ctx.beginPath();
      const points = 100;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;

        const wave1 = Math.sin(angle * 3 + timeRef.current * 2) * 3;
        const wave2 = Math.sin(angle * 5 - timeRef.current * 3) * 2;
        const wave3 = Math.cos(angle * 7 + timeRef.current * 4) * 1.5;

        const audioEffect =
          currentLevelRef.current *
          15 *
          Math.sin(angle * 4 + timeRef.current * 5);

        const intensity =
          statusType === "processing"
            ? 1.5
            : statusType === "speaking"
            ? 1.2
            : statusType === "assistant_speaking"
            ? 1.3
            : statusType === "listening"
            ? 0.8
            : 0.5;

        const radius =
          baseRadius + (wave1 + wave2 + wave3 + audioEffect) * intensity;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      const pulseScale =
        1 + Math.sin(timeRef.current * 3) * 0.1 + currentLevelRef.current * 0.3;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20 * pulseScale, 0, Math.PI * 2);
      const coreGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        20 * pulseScale
      );
      coreGradient.addColorStop(0, "#ffffff");
      coreGradient.addColorStop(1, config.color);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      if (statusType === "processing") {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ffffff";
        for (let i = 0; i < 8; i++) {
          const particleAngle = (i / 8) * Math.PI * 2 + timeRef.current * 2;
          const particleRadius =
            baseRadius + 30 + Math.sin(timeRef.current * 3 + i) * 10;
          const px = centerX + Math.cos(particleAngle) * particleRadius;
          const py = centerY + Math.sin(particleAngle) * particleRadius;

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        }
      }

      if (statusType === "assistant_speaking") {
        ctx.shadowBlur = 10;
        ctx.shadowColor = config.color;
        const waveCount = 3;
        for (let w = 0; w < waveCount; w++) {
          ctx.beginPath();
          const waveRadius = baseRadius + 35 + w * 15;
          const opacity = (1 - w / waveCount) * 0.6;
          const wavePoints = 50;
          for (let i = 0; i <= wavePoints; i++) {
            const angle = (i / wavePoints) * Math.PI * 2;
            const waveOffset =
              Math.sin(angle * 4 - timeRef.current * 4 + w) * 5;
            const r = waveRadius + waveOffset;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.strokeStyle =
            config.color +
            Math.floor(opacity * 255)
              .toString(16)
              .padStart(2, "0");
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, audioLevel, isUserSpeaking, isAssistantSpeaking, getStatusType]);

  return (
    <div className="flex justify-center items-center mb-6">
      <canvas ref={canvasRef} className="rounded-full" />
    </div>
  );
}
