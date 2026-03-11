import { useState } from "react";
import { palette } from "../lib/palette";

export default function EmbedCodeModal({ slug, type = "wall", id, onClose }) {
  const [copied, setCopied] = useState(null);
  const [previewTheme, setPreviewTheme] = useState("dark");

  const baseUrl = "https://inthebooth.vercel.app";
  const embedSrc =
    type === "mixtape"
      ? `${baseUrl}/api/embed-mixtape?id=${id}&theme=${previewTheme}`
      : `${baseUrl}/api/embed?slug=${slug}&theme=${previewTheme}`;

  const iframeCode = `<iframe src="${embedSrc}" width="320" height="400" frameborder="0" style="border:none;border-radius:12px;"></iframe>`;

  const scriptCode = `<div id="booth-embed-${type === "mixtape" ? id : slug}"></div>
<script>
(function(){
  var d=document,f=d.createElement('iframe');
  f.src='${embedSrc}';
  f.width='320';f.height='400';f.frameBorder='0';
  f.style.border='none';f.style.borderRadius='12px';
  d.getElementById('booth-embed-${type === "mixtape" ? id : slug}').appendChild(f);
})();
</script>`;

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20,
  };

  const modalStyle = {
    background: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 16,
    padding: 24,
    maxWidth: 480,
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: palette.textMuted,
    fontFamily: "'Space Mono', monospace",
    marginBottom: 8,
    letterSpacing: "0.03em",
  };

  const codeBlockStyle = {
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: 8,
    padding: 12,
    fontSize: 11,
    fontFamily: "'Space Mono', monospace",
    color: palette.text,
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    lineHeight: 1.5,
    position: "relative",
  };

  const copyBtnStyle = (label) => ({
    padding: "6px 14px",
    border: `1px solid ${palette.border}`,
    borderRadius: 8,
    background: copied === label ? palette.accent : "transparent",
    color: copied === label ? "#000" : palette.textMuted,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Space Mono', monospace",
    cursor: "pointer",
    transition: "all 0.2s",
    marginTop: 8,
  });

  const themeBtnStyle = (t) => ({
    padding: "4px 12px",
    border: `1px solid ${previewTheme === t ? palette.accent : palette.border}`,
    borderRadius: 6,
    background: previewTheme === t ? palette.accent + "22" : "transparent",
    color: previewTheme === t ? palette.accent : palette.textMuted,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Space Mono', monospace",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "transparent",
            border: "none",
            color: palette.textMuted,
            fontSize: 20,
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          x
        </button>

        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: "0 0 4px",
            color: palette.text,
          }}
        >
          Embed Your {type === "mixtape" ? "Mixtape" : "Booth"}
        </h2>
        <p
          style={{
            fontSize: 12,
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            margin: "0 0 20px",
          }}
        >
          Add a mini version of your{" "}
          {type === "mixtape" ? "mixtape" : "booth"} to any website.
        </p>

        {/* Theme toggle */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Widget Theme</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setPreviewTheme("dark")}
              style={themeBtnStyle("dark")}
            >
              Dark
            </button>
            <button
              onClick={() => setPreviewTheme("light")}
              style={themeBtnStyle("light")}
            >
              Light
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Preview</label>
          <div
            style={{
              background: previewTheme === "light" ? "#f5f5f5" : "#000",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              justifyContent: "center",
              border: `1px solid ${palette.border}`,
            }}
          >
            <iframe
              src={embedSrc}
              width="320"
              height="400"
              frameBorder="0"
              style={{
                border: "none",
                borderRadius: 12,
              }}
              title="Embed preview"
            />
          </div>
        </div>

        {/* iframe embed code */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>iframe Embed</label>
          <div style={codeBlockStyle}>{iframeCode}</div>
          <button
            onClick={() => handleCopy(iframeCode, "iframe")}
            style={copyBtnStyle("iframe")}
          >
            {copied === "iframe" ? "Copied!" : "Copy iframe code"}
          </button>
        </div>

        {/* Script embed code */}
        <div>
          <label style={labelStyle}>Script Embed</label>
          <div style={codeBlockStyle}>{scriptCode}</div>
          <button
            onClick={() => handleCopy(scriptCode, "script")}
            style={copyBtnStyle("script")}
          >
            {copied === "script" ? "Copied!" : "Copy script code"}
          </button>
        </div>
      </div>
    </div>
  );
}
