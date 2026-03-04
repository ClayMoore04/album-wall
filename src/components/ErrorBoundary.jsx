import { Component } from "react";
import { palette } from "../lib/palette";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p
            style={{
              color: palette.textMuted,
              fontFamily: "'Space Mono', monospace",
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            An unexpected error occurred. Try refreshing or head home.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
              background: palette.accent,
              color: "#000",
            }}
          >
            Go Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
