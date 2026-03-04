import { useEffect, useState } from "react";
import { palette } from "../lib/palette";

const COLORS = [palette.accent, palette.coral, "#f5c518", "#9b59b6", "#3498db", "#e67e22"];

function randomBetween(a, b) {
  return Math.random() * (b - a) + a;
}

export default function Celebration() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dots = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: randomBetween(10, 90),
    color: COLORS[i % COLORS.length],
    delay: randomBetween(0, 0.5),
    duration: randomBetween(1.5, 2.5),
    size: randomBetween(6, 12),
  }));

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {dots.map((dot) => (
        <div
          key={dot.id}
          style={{
            position: "absolute",
            left: `${dot.left}%`,
            top: -20,
            width: dot.size,
            height: dot.size,
            borderRadius: "50%",
            background: dot.color,
            animation: `confetti-fall ${dot.duration}s ease-in ${dot.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
