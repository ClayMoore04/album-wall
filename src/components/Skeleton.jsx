import { useEffect, useRef } from "react";
import { palette } from "../lib/palette";

let styleInjected = false;

export default function Skeleton({ width, height, borderRadius = 6 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (styleInjected) return;
    styleInjected = true;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes skeleton-pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width,
        height,
        borderRadius,
        background: palette.surface,
        border: `1px solid ${palette.border}`,
        animation: "skeleton-pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

export function DiscoverCardSkeleton() {
  return (
    <div
      style={{
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height={16} borderRadius={4} />
          <div style={{ marginTop: 6 }}>
            <Skeleton width="40%" height={12} borderRadius={4} />
          </div>
        </div>
      </div>
      <Skeleton width="80%" height={12} borderRadius={4} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Skeleton width={80} height={14} borderRadius={4} />
        <Skeleton width={60} height={28} borderRadius={8} />
      </div>
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div
      style={{
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 12,
        padding: 20,
      }}
    >
      <Skeleton width="30%" height={14} borderRadius={4} />
      <div style={{ marginTop: 12 }}>
        <Skeleton width="50%" height={16} borderRadius={4} />
      </div>
      <div style={{ marginTop: 10 }}>
        <Skeleton width="35%" height={12} borderRadius={4} />
      </div>
    </div>
  );
}

export function WallCardSkeleton() {
  return (
    <div
      style={{
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 14,
        padding: 16,
        display: "flex",
        gap: 14,
      }}
    >
      <Skeleton width={80} height={80} borderRadius={8} />
      <div style={{ flex: 1 }}>
        <Skeleton width="70%" height={16} borderRadius={4} />
        <div style={{ marginTop: 8 }}>
          <Skeleton width="50%" height={12} borderRadius={4} />
        </div>
        <div style={{ marginTop: 8 }}>
          <Skeleton width="90%" height={12} borderRadius={4} />
        </div>
      </div>
    </div>
  );
}

export function MixtapeRowSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 20px",
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 12,
      }}
    >
      <Skeleton width={56} height={56} borderRadius={8} />
      <div style={{ flex: 1 }}>
        <Skeleton width="55%" height={16} borderRadius={4} />
        <div style={{ marginTop: 8 }}>
          <Skeleton width="35%" height={12} borderRadius={4} />
        </div>
      </div>
    </div>
  );
}
