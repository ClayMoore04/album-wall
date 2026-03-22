import { useState } from "react";
import { supabase } from "../lib/supabase";
import { palette } from "../lib/palette";

export default function OnboardingChecklist({ profile, stats, onDismiss }) {
  const [linkCopied, setLinkCopied] = useState(
    localStorage.getItem("booth_link_shared") === "true"
  );

  const steps = [
    {
      title: "Customize your booth",
      description: "Add a bio or pick a theme to make it yours.",
      complete: !!(profile.bio || (profile.theme && profile.theme !== "default")),
    },
    {
      title: "Share your booth link",
      description: `${window.location.host}/${profile.slug}`,
      complete: linkCopied,
      action: async () => {
        try {
          await navigator.clipboard.writeText(
            `${window.location.origin}/${profile.slug}`
          );
          localStorage.setItem("booth_link_shared", "true");
          setLinkCopied(true);
        } catch {
          // fallback
        }
      },
      actionLabel: linkCopied ? "Copied" : "Copy link",
    },
    {
      title: "Get your first recommendation",
      description: "Share your link and wait for someone to drop an album.",
      complete: stats.total > 0,
    },
  ];

  const completedCount = steps.filter((s) => s.complete).length;

  const handleDismiss = async () => {
    if (supabase) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq("id", profile.id);
    }
    onDismiss?.();
  };

  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #1e1e1e",
        borderLeft: `3px solid ${palette.accent}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            Get started
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#555",
              fontFamily: "'Space Mono', monospace",
              marginTop: 2,
            }}
          >
            {completedCount}/{steps.length} complete
          </div>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            padding: "4px 10px",
            border: "1px solid #1e1e1e",
            borderRadius: 6,
            background: "transparent",
            color: "#555",
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
          }}
        >
          Dismiss
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                border: step.complete
                  ? `2px solid ${palette.accent}`
                  : "2px solid #1e1e1e",
                background: step.complete ? palette.accent : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 12,
                color: step.complete ? "#000" : "transparent",
                fontWeight: 700,
                marginTop: 1,
              }}
            >
              {step.complete ? "\u2713" : ""}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: step.complete ? "#555" : "#e8e6e3",
                  textDecoration: step.complete ? "line-through" : "none",
                }}
              >
                {step.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#333",
                  fontFamily: "'Space Mono', monospace",
                  marginTop: 2,
                }}
              >
                {step.description}
              </div>
              {step.action && !step.complete && (
                <button
                  onClick={step.action}
                  style={{
                    marginTop: 6,
                    padding: "4px 12px",
                    border: `1px solid ${palette.accent}`,
                    borderRadius: 6,
                    background: "rgba(236,72,153,0.1)",
                    color: palette.accent,
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                  }}
                >
                  {step.actionLabel}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
