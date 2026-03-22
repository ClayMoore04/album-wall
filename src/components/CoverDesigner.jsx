import { useState, useEffect, useRef, useCallback } from "react";
import * as fabric from "fabric";
import { supabase } from "../lib/supabase";
import { palette } from "../lib/palette";
import { STICKERS, MARKER_COLORS, BACKGROUND_COLORS } from "../lib/coverDesignerStickers";

// CD: 600x600 — realistic disc proportions
const CD_SIZE = 600;
const CD_OUTER_RING = 290; // outer edge radius
const CD_INNER_RING = 58;  // center hole radius (proportional to real CD)
const CD_LABEL_RADIUS = 170; // label area radius

// Cassette: 600x380 — realistic J-card proportions (roughly 4" x 2.5")
const CASSETTE_WIDTH = 600;
const CASSETTE_HEIGHT = 380;

const MAX_UNDO = 30;

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Draw the CD template (non-selectable background objects)
function drawCDTemplate(canvas, bgColor) {
  const cx = CD_SIZE / 2;
  const cy = CD_SIZE / 2;

  // Outer disc fill
  const disc = new fabric.Circle({
    radius: CD_OUTER_RING,
    left: cx,
    top: cy,
    originX: "center",
    originY: "center",
    fill: bgColor,
    stroke: "#bbb",
    strokeWidth: 2,
    selectable: false,
    evented: false,
  });
  disc.customType = "template";
  canvas.add(disc);

  // Subtle concentric grooves
  [240, 210, 185].forEach((r) => {
    const groove = new fabric.Circle({
      radius: r,
      left: cx,
      top: cy,
      originX: "center",
      originY: "center",
      fill: "transparent",
      stroke: "rgba(0,0,0,0.06)",
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
    });
    groove.customType = "template";
    canvas.add(groove);
  });

  // Label area boundary ring
  const labelRing = new fabric.Circle({
    radius: CD_LABEL_RADIUS,
    left: cx,
    top: cy,
    originX: "center",
    originY: "center",
    fill: "transparent",
    stroke: "rgba(0,0,0,0.12)",
    strokeWidth: 1,
    selectable: false,
    evented: false,
  });
  labelRing.customType = "template";
  canvas.add(labelRing);

  // Center hole
  const hole = new fabric.Circle({
    radius: CD_INNER_RING,
    left: cx,
    top: cy,
    originX: "center",
    originY: "center",
    fill: "#0a0a0a",
    stroke: "#999",
    strokeWidth: 1.5,
    selectable: false,
    evented: false,
  });
  hole.customType = "centerHole";
  canvas.add(hole);

  // Center hub ring (the little raised ring around the hole)
  const hub = new fabric.Circle({
    radius: CD_INNER_RING + 8,
    left: cx,
    top: cy,
    originX: "center",
    originY: "center",
    fill: "transparent",
    stroke: "rgba(0,0,0,0.15)",
    strokeWidth: 1,
    selectable: false,
    evented: false,
  });
  hub.customType = "template";
  canvas.add(hub);
}

// Draw the cassette J-card template
function drawCassetteTemplate(canvas, bgColor) {
  const w = CASSETTE_WIDTH;
  const h = CASSETTE_HEIGHT;
  const pad = 16;

  // Card background
  const card = new fabric.Rect({
    left: 0,
    top: 0,
    width: w,
    height: h,
    fill: bgColor,
    selectable: false,
    evented: false,
  });
  card.customType = "template";
  canvas.add(card);

  // Outer border (cassette shell outline)
  const border = new fabric.Rect({
    left: pad,
    top: pad,
    width: w - pad * 2,
    height: h - pad * 2,
    fill: "transparent",
    stroke: "rgba(0,0,0,0.12)",
    strokeWidth: 1.5,
    rx: 10,
    ry: 10,
    selectable: false,
    evented: false,
  });
  border.customType = "template";
  canvas.add(border);

  // Tape window (the rectangular window showing the tape reels)
  const winW = 260;
  const winH = 90;
  const winX = (w - winW) / 2;
  const winY = h - pad - winH - 30;

  const tapeWindow = new fabric.Rect({
    left: winX,
    top: winY,
    width: winW,
    height: winH,
    fill: "rgba(0,0,0,0.05)",
    stroke: "rgba(0,0,0,0.15)",
    strokeWidth: 1,
    rx: 6,
    ry: 6,
    selectable: false,
    evented: false,
  });
  tapeWindow.customType = "template";
  canvas.add(tapeWindow);

  // Left spool
  const spoolR = 28;
  const spoolY = winY + winH / 2;
  const leftSpool = new fabric.Circle({
    radius: spoolR,
    left: winX + 55,
    top: spoolY,
    originX: "center",
    originY: "center",
    fill: "rgba(0,0,0,0.08)",
    stroke: "rgba(0,0,0,0.15)",
    strokeWidth: 1,
    selectable: false,
    evented: false,
  });
  leftSpool.customType = "template";
  canvas.add(leftSpool);

  // Left spool hub
  const leftHub = new fabric.Circle({
    radius: 8,
    left: winX + 55,
    top: spoolY,
    originX: "center",
    originY: "center",
    fill: "rgba(0,0,0,0.12)",
    selectable: false,
    evented: false,
  });
  leftHub.customType = "template";
  canvas.add(leftHub);

  // Right spool
  const rightSpool = new fabric.Circle({
    radius: spoolR,
    left: winX + winW - 55,
    top: spoolY,
    originX: "center",
    originY: "center",
    fill: "rgba(0,0,0,0.08)",
    stroke: "rgba(0,0,0,0.15)",
    strokeWidth: 1,
    selectable: false,
    evented: false,
  });
  rightSpool.customType = "template";
  canvas.add(rightSpool);

  // Right spool hub
  const rightHub = new fabric.Circle({
    radius: 8,
    left: winX + winW - 55,
    top: spoolY,
    originX: "center",
    originY: "center",
    fill: "rgba(0,0,0,0.12)",
    selectable: false,
    evented: false,
  });
  rightHub.customType = "template";
  canvas.add(rightHub);

  // Tape between spools
  const tapeLine = new fabric.Rect({
    left: winX + 55,
    top: spoolY - 4,
    width: winW - 110,
    height: 8,
    fill: "rgba(0,0,0,0.04)",
    selectable: false,
    evented: false,
  });
  tapeLine.customType = "template";
  canvas.add(tapeLine);

  // Screw holes (top corners of the shell)
  [pad + 28, w - pad - 28].forEach((x) => {
    const screw = new fabric.Circle({
      radius: 5,
      left: x,
      top: pad + 28,
      originX: "center",
      originY: "center",
      fill: "rgba(0,0,0,0.08)",
      stroke: "rgba(0,0,0,0.12)",
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
    });
    screw.customType = "template";
    canvas.add(screw);
  });

  // Label area hint text (very faint)
  const hint = new fabric.IText("", {
    left: w / 2,
    top: pad + 50,
    originX: "center",
    originY: "center",
    fontSize: 11,
    fontFamily: "'Space Mono', monospace",
    fill: "rgba(0,0,0,0.08)",
    selectable: false,
    evented: false,
  });
  hint.customType = "template";
  canvas.add(hint);

  // Lines for writing (like a label)
  for (let i = 0; i < 5; i++) {
    const lineY = pad + 65 + i * 32;
    if (lineY > winY - 15) break;
    const line = new fabric.Line(
      [pad + 40, lineY, w - pad - 40, lineY],
      {
        stroke: "rgba(0,0,0,0.06)",
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      }
    );
    line.customType = "template";
    canvas.add(line);
  }
}

export default function CoverDesigner({
  mixtapeId,
  userId,
  initialShape,
  initialData,
  onSave,
  onClose,
}) {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const isLoadingRef = useRef(false);

  const [shape, setShape] = useState(initialShape || "cd");
  const [activeTool, setActiveTool] = useState("pen");
  const [penSize, setPenSize] = useState(5);
  const [activeColor, setActiveColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [saving, setSaving] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const getCanvasWidth = () => (shape === "cd" ? CD_SIZE : CASSETTE_WIDTH);
  const getCanvasHeight = () => (shape === "cd" ? CD_SIZE : CASSETTE_HEIGHT);

  const pushUndo = useCallback(() => {
    if (isLoadingRef.current || !fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON(["customType"]));
    undoStackRef.current.push(json);
    if (undoStackRef.current.length > MAX_UNDO) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  // Initialize canvas
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const w = getCanvasWidth();
    const h = getCanvasHeight();

    // Calculate display size to fit viewport
    const maxW = Math.min(window.innerWidth * 0.85, 400);
    const maxH = window.innerHeight * 0.4;
    const fitScale = Math.min(maxW / w, maxH / h);

    const canvas = new fabric.Canvas(el, {
      width: w * fitScale,
      height: h * fitScale,
      backgroundColor: "transparent",
      isDrawingMode: true,
    });

    // Zoom so internal coordinates stay at logical size (e.g. 600x600)
    // but rendering fits the smaller display area
    canvas.setZoom(fitScale);

    // CD clip path — clip to circle
    if (shape === "cd") {
      canvas.clipPath = new fabric.Circle({
        radius: CD_OUTER_RING,
        left: CD_SIZE / 2,
        top: CD_SIZE / 2,
        originX: "center",
        originY: "center",
        absolutePositioned: true,
      });
    }

    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = penSize;
    canvas.freeDrawingBrush.color = activeColor;

    canvas.on("path:created", () => pushUndo());
    canvas.on("object:modified", () => pushUndo());

    fabricRef.current = canvas;

    // Load initial data if re-editing
    if (initialData && initialShape === shape) {
      isLoadingRef.current = true;
      canvas.loadFromJSON(initialData).then(() => {
        canvas.renderAll();
        isLoadingRef.current = false;
        pushUndo();
      });
    } else {
      // Draw the template
      if (shape === "cd") {
        drawCDTemplate(canvas, bgColor);
      } else {
        drawCassetteTemplate(canvas, bgColor);
      }
      canvas.renderAll();
      pushUndo();
    }

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [shape]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update brush when tool/color/size changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (activeTool === "pen" || activeTool === "marker" || activeTool === "eraser") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);

      if (activeTool === "marker") {
        canvas.freeDrawingBrush.width = penSize * 3;
        canvas.freeDrawingBrush.color = hexToRgba(activeColor, 0.35);
      } else if (activeTool === "eraser") {
        canvas.freeDrawingBrush.width = penSize * 4;
        canvas.freeDrawingBrush.color = bgColor;
      } else {
        canvas.freeDrawingBrush.width = penSize;
        canvas.freeDrawingBrush.color = activeColor;
      }
    } else {
      canvas.isDrawingMode = false;
    }
  }, [activeTool, activeColor, penSize, bgColor]);

  // Text tool
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || activeTool !== "text") return;

    const handleClick = (opt) => {
      const pointer = canvas.getScenePoint(opt.e);
      const text = new fabric.IText("Type here", {
        left: pointer.x,
        top: pointer.y,
        fontFamily: "'Syne', sans-serif",
        fontSize: 28,
        fill: activeColor,
        fontWeight: 700,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      pushUndo();
    };

    canvas.on("mouse:down", handleClick);
    return () => canvas.off("mouse:down", handleClick);
  }, [activeTool, activeColor, pushUndo]);

  const handleUndo = () => {
    const canvas = fabricRef.current;
    if (!canvas || undoStackRef.current.length <= 1) return;

    const current = undoStackRef.current.pop();
    redoStackRef.current.push(current);

    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    isLoadingRef.current = true;
    canvas.loadFromJSON(prev).then(() => {
      canvas.renderAll();
      isLoadingRef.current = false;
      setCanUndo(undoStackRef.current.length > 1);
      setCanRedo(true);
    });
  };

  const handleRedo = () => {
    const canvas = fabricRef.current;
    if (!canvas || redoStackRef.current.length === 0) return;

    const next = redoStackRef.current.pop();
    undoStackRef.current.push(next);

    isLoadingRef.current = true;
    canvas.loadFromJSON(next).then(() => {
      canvas.renderAll();
      isLoadingRef.current = false;
      setCanUndo(true);
      setCanRedo(redoStackRef.current.length > 0);
    });
  };

  const handleClear = () => {
    const canvas = fabricRef.current;
    if (!canvas || !window.confirm("Clear the entire canvas?")) return;
    canvas.clear();
    canvas.backgroundColor = "transparent";
    if (shape === "cd") {
      canvas.clipPath = new fabric.Circle({
        radius: CD_OUTER_RING,
        left: CD_SIZE / 2,
        top: CD_SIZE / 2,
        originX: "center",
        originY: "center",
        absolutePositioned: true,
      });
      drawCDTemplate(canvas, bgColor);
    } else {
      drawCassetteTemplate(canvas, bgColor);
    }
    canvas.renderAll();
    pushUndo();
  };

  const handleAddSticker = (emoji) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const offscreen = document.createElement("canvas");
    offscreen.width = 120;
    offscreen.height = 120;
    const ctx = offscreen.getContext("2d");
    ctx.font = "80px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, 60, 65);

    const dataUrl = offscreen.toDataURL();
    fabric.FabricImage.fromURL(dataUrl).then((img) => {
      img.set({
        left: getCanvasWidth() / 2,
        top: getCanvasHeight() / 2,
        originX: "center",
        originY: "center",
        scaleX: 0.8,
        scaleY: 0.8,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      pushUndo();
    });

    setShowStickers(false);
    setActiveTool("select");
  };

  const handleBgChange = (color) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setBgColor(color);

    // Update the template background objects
    canvas.getObjects().forEach((obj) => {
      if (obj.customType === "template" && obj.type === "circle" && obj.fill !== "transparent" && obj.fill !== "rgba(0,0,0,0.08)") {
        obj.set("fill", color);
      }
      if (obj.customType === "template" && obj.type === "rect" && obj.width === CASSETTE_WIDTH) {
        obj.set("fill", color);
      }
    });
    canvas.renderAll();
    pushUndo();
    setShowBgPicker(false);
  };

  const handleShapeSwitch = (newShape) => {
    if (newShape === shape) return;
    if (!window.confirm("Switching shape will clear your design. Continue?")) return;
    setShape(newShape);
  };

  const handleDeleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active && active.customType !== "centerHole" && active.customType !== "template") {
      canvas.remove(active);
      canvas.renderAll();
      pushUndo();
    }
  };

  const handleSave = async () => {
    const canvas = fabricRef.current;
    if (!canvas || !supabase) return;
    setSaving(true);

    try {
      // Bring center hole to front before export
      if (shape === "cd") {
        const hole = canvas.getObjects().find((o) => o.customType === "centerHole");
        if (hole) canvas.bringObjectToFront(hole);
      }

      // Reset zoom to export at full resolution
      const currentZoom = canvas.getZoom();
      canvas.setZoom(1);
      canvas.setDimensions({ width: getCanvasWidth(), height: getCanvasHeight() });
      const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
      // Restore zoom
      canvas.setZoom(currentZoom);
      canvas.setDimensions({ width: getCanvasWidth() * currentZoom, height: getCanvasHeight() * currentZoom });
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const path = `${userId}/${mixtapeId}.png`;
      const { error } = await supabase.storage
        .from("mixtape-covers")
        .upload(path, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (error) {
        console.error("Upload error:", error);
        alert("Failed to upload cover. Please try again.");
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("mixtape-covers")
        .getPublicUrl(path);

      const url = `${urlData.publicUrl}?v=${Date.now()}`;
      const jsonData = canvas.toJSON(["customType"]);

      await onSave(url, jsonData, shape);
      onClose();
    } catch (e) {
      console.error("Save error:", e);
      alert("Failed to save cover. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Display scaling — fit the canvas into the viewport
  const canvasW = getCanvasWidth();
  const canvasH = getCanvasHeight();
  const maxDisplayWidth = Math.min(window.innerWidth * 0.85, 400);
  const maxDisplayHeight = window.innerHeight * 0.4;
  const displayScale = Math.min(maxDisplayWidth / canvasW, maxDisplayHeight / canvasH);
  const displayW = Math.round(canvasW * displayScale);
  const displayH = Math.round(canvasH * displayScale);

  const toolBtnStyle = (isActive) => ({
    padding: "6px 10px",
    borderRadius: 6,
    border: `1px solid ${isActive ? palette.accent : "#1e1e1e"}`,
    background: isActive ? palette.accent + "20" : "#111",
    color: isActive ? palette.accent : "#e8e6e3",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Space Mono', monospace",
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 300,
        overflow: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          width: "100%",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #1e1e1e",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#555",
            fontSize: 13,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            color: "#e8e6e3",
            letterSpacing: 1,
          }}
        >
          DESIGN COVER
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "6px 16px",
            border: "none",
            borderRadius: 8,
            background: saving ? "#1e1e1e" : palette.accent,
            color: saving ? "#333" : "#000",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Shape selector */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 0",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => handleShapeSwitch("cd")}
          style={toolBtnStyle(shape === "cd")}
        >
          CD
        </button>
        <button
          onClick={() => handleShapeSwitch("cassette")}
          style={toolBtnStyle(shape === "cassette")}
        >
          Cassette
        </button>
      </div>

      {/* Canvas area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 16px",
          minHeight: 0,
        }}
      >
        <div
          style={{
            width: displayW,
            height: displayH,
            borderRadius: shape === "cd" ? "50%" : 10,
            overflow: "hidden",
            boxShadow: "0 4px 40px rgba(0,0,0,0.5)",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: "block",
            }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          width: "100%",
          background: "#111",
          borderTop: "1px solid #1e1e1e",
          padding: "10px 12px",
          flexShrink: 0,
        }}
      >
        {/* Tool buttons row */}
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 8,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button onClick={() => setActiveTool("pen")} style={toolBtnStyle(activeTool === "pen")}>
            Pen
          </button>
          <button onClick={() => setActiveTool("marker")} style={toolBtnStyle(activeTool === "marker")}>
            Marker
          </button>
          <button onClick={() => setActiveTool("text")} style={toolBtnStyle(activeTool === "text")}>
            Text
          </button>
          <button
            onClick={() => {
              setActiveTool("sticker");
              setShowStickers(!showStickers);
            }}
            style={toolBtnStyle(activeTool === "sticker")}
          >
            Stickers
          </button>
          <button onClick={() => setActiveTool("eraser")} style={toolBtnStyle(activeTool === "eraser")}>
            Eraser
          </button>
          <button
            onClick={() => setShowBgPicker(!showBgPicker)}
            style={{
              ...toolBtnStyle(showBgPicker),
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: bgColor,
                border: "1px solid #666",
                display: "inline-block",
              }}
            />
            Fill
          </button>
          <button
            onClick={() => {
              setActiveTool("select");
              const canvas = fabricRef.current;
              if (canvas) canvas.isDrawingMode = false;
            }}
            style={toolBtnStyle(activeTool === "select")}
          >
            Select
          </button>

          <div style={{ width: 1, height: 20, background: "#1e1e1e", margin: "0 4px" }} />

          {/* Pen sizes */}
          {[2, 5, 10].map((s) => (
            <button
              key={s}
              onClick={() => setPenSize(s)}
              style={{
                ...toolBtnStyle(penSize === s),
                padding: "6px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  width: s + 4,
                  height: s + 4,
                  borderRadius: "50%",
                  background: penSize === s ? palette.accent : "#e8e6e3",
                  display: "block",
                }}
              />
            </button>
          ))}

          <div style={{ width: 1, height: 20, background: "#1e1e1e", margin: "0 4px" }} />

          <button
            onClick={handleUndo}
            disabled={!canUndo}
            style={{
              ...toolBtnStyle(false),
              opacity: canUndo ? 1 : 0.3,
              cursor: canUndo ? "pointer" : "default",
            }}
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            style={{
              ...toolBtnStyle(false),
              opacity: canRedo ? 1 : 0.3,
              cursor: canRedo ? "pointer" : "default",
            }}
          >
            Redo
          </button>

          <button onClick={handleDeleteSelected} style={toolBtnStyle(false)}>
            Delete
          </button>

          <button
            onClick={handleClear}
            style={{
              ...toolBtnStyle(false),
              color: "#ef4444",
              borderColor: "#ef4444" + "40",
            }}
          >
            Clear
          </button>
        </div>

        {/* Sticker picker */}
        {showStickers && (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "center",
              padding: "8px 0",
              borderTop: "1px solid #1e1e1e",
            }}
          >
            {STICKERS.map((s) => (
              <button
                key={s.name}
                onClick={() => handleAddSticker(s.emoji)}
                title={s.label}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid #1e1e1e",
                  background: "#0a0a0a",
                  fontSize: 22,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        )}

        {/* Background color picker */}
        {showBgPicker && (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "center",
              padding: "8px 0",
              borderTop: "1px solid #1e1e1e",
            }}
          >
            {BACKGROUND_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => handleBgChange(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: `2px solid ${bgColor === c ? palette.accent : "#1e1e1e"}`,
                  background: c,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        )}

        {/* Color picker row */}
        <div
          style={{
            display: "flex",
            gap: 4,
            justifyContent: "center",
            paddingTop: 8,
            borderTop: "1px solid #1e1e1e",
            flexWrap: "wrap",
          }}
        >
          {MARKER_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setActiveColor(c)}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: `2px solid ${activeColor === c ? palette.accent : "transparent"}`,
                background: c,
                cursor: "pointer",
                boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px #ccc" : "none",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
