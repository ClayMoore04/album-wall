let injected = false;

export function injectAnimations() {
  if (injected) return;
  injected = true;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes booth-fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes booth-emojiPop {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.35); }
      100% { transform: scale(1); }
    }
    @keyframes booth-countPulse {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 0.4; }
      50%      { opacity: 0.8; }
    }
    button:active {
      transform: scale(0.97) !important;
    }
  `;
  document.head.appendChild(style);
}
