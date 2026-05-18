"use client";

import { useEffect, useRef } from "react";

export default function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Grid configuration
    const gridConfig = {
      rows: 20,
      cols: 40,
      speed: 0.3,
      fov: 400,
      cameraHeight: 100,
      horizonY: 0.45,
    };

    // Particles
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      speed: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];

    const colors = ["#00f0ff", "#ff00a0", "#b026ff", "#0066ff", "#00ff88"];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        size: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    // Floating shapes (geometric)
    const shapes: Array<{
      x: number;
      y: number;
      size: number;
      rotation: number;
      rotationSpeed: number;
      speed: number;
      color: string;
      type: "hex" | "triangle" | "diamond";
      alpha: number;
    }> = [];

    for (let i = 0; i < 8; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 20 + Math.random() * 40,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.005,
        speed: Math.random() * 0.2 + 0.05,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: ["hex", "triangle", "diamond"][Math.floor(Math.random() * 3)] as "hex" | "triangle" | "diamond",
        alpha: 0.1 + Math.random() * 0.15,
      });
    }

    const drawGrid = () => {
      const w = canvas.width;
      const h = canvas.height;
      const horizon = h * gridConfig.horizonY;

      ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
      ctx.lineWidth = 0.5;

      // Vertical lines (perspective)
      for (let i = -gridConfig.cols / 2; i <= gridConfig.cols / 2; i++) {
        const x = w / 2 + i * 30;
        const perspectiveX = w / 2 + (x - w / 2) * 0.15;

        ctx.beginPath();
        ctx.moveTo(perspectiveX, horizon);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Horizontal lines (perspective)
      const offset = (time * gridConfig.speed) % 40;
      for (let i = 0; i < gridConfig.rows; i++) {
        const y = horizon + ((i * 40 + offset) / gridConfig.rows) * (h - horizon);
        if (y < horizon || y > h) continue;

        const perspective = (y - horizon) / (h - horizon);
        const alpha = perspective * 0.12;

        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    };

    const drawParticles = () => {
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        // Glow effect
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, "transparent");

        ctx.globalAlpha = p.alpha * 0.5;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const drawShape = (shape: typeof shapes[0]) => {
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rotation);
      ctx.globalAlpha = shape.alpha;
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = shape.color;
      ctx.shadowBlur = 15;

      ctx.beginPath();
      if (shape.type === "hex") {
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = Math.cos(angle) * shape.size;
          const y = Math.sin(angle) * shape.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else if (shape.type === "triangle") {
        for (let i = 0; i < 3; i++) {
          const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
          const x = Math.cos(angle) * shape.size;
          const y = Math.sin(angle) * shape.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else if (shape.type === "diamond") {
        ctx.moveTo(0, -shape.size);
        ctx.lineTo(shape.size * 0.7, 0);
        ctx.lineTo(0, shape.size);
        ctx.lineTo(-shape.size * 0.7, 0);
        ctx.closePath();
      }
      ctx.stroke();

      // Inner glow
      ctx.globalAlpha = shape.alpha * 0.3;
      ctx.fillStyle = shape.color;
      ctx.fill();

      ctx.restore();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    const drawScanlines = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }
    };

    const drawVignette = () => {
      const w = canvas.width;
      const h = canvas.height;
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Clear with dark background
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, w, h);

      // Animated gradient orbs (behind grid)
      const orbTime = time * 0.5;
      const orbs = [
        { x: w * 0.2, y: h * 0.3, size: 300, color: "rgba(0, 102, 255, 0.15)" },
        { x: w * 0.8, y: h * 0.7, size: 250, color: "rgba(176, 38, 255, 0.12)" },
        { x: w * 0.5 + Math.sin(orbTime) * 100, y: h * 0.2 + Math.cos(orbTime * 0.7) * 50, size: 200, color: "rgba(0, 240, 255, 0.1)" },
      ];

      orbs.forEach((orb) => {
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      });

      drawGrid();
      drawParticles();

      shapes.forEach((shape) => {
        shape.y -= shape.speed;
        shape.rotation += shape.rotationSpeed;
        if (shape.y < -100) {
          shape.y = h + 100;
          shape.x = Math.random() * w;
        }
        drawShape(shape);
      });

      drawScanlines();
      drawVignette();

      time += 0.016;
      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ pointerEvents: "none" }}
    />
  );
}
