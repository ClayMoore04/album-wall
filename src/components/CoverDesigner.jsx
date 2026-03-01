import { useState, useEffect, useRef, useCallback } from "react";
import * as fabric from "fabric";
import { supabase } from "../lib/supabase";
import { palette } from "../lib/palette";
import { STICKERS, MARKER_COLORS, BACKGROUND_COLORS } from "../lib/coverDesignerStickers";

const CD_SIZE = 600;
const CASSETTE_WIDTH = 600;
const CASSETTE_HEIGHT = 420;
const CENTER_HOLE_RADIUS = 45;
const MAX_UNDO = 30;

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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

  // Save undo snapshot
  const pushUndo = useCallback(() => {
    if (isLoadingRef.current || !fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
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

    const canvas = new fabric.Canvas(el, {
      width: w,
      height: h,
      backgroundColor: bgColor,
      isDrawingMode: true,
    });

    // CD clip path
    if (shape === "cd") {
      canvas.clipPath = new fabric.Circle({
        radius: CD_SIZE / 2,
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

    // Listen for changes
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
      // Add CD center hole
      if (shape === "cd") {
        addCenterHole(canvas);
      }
      pushUndo();
    }

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [shape]); // eslint-disable-line react-hooks/exhaustive-deps

  function addCenterHole(canvas) {
    const hole = new fabric.Circle({
      radius: CENTER_HOLE_RADIUS,
      left: CD_SIZE / 2,
      top: CD_SIZE / 2,
      originX: "center",
      originY: "center",
      fill: palette.bg,
      stroke: "#ccc",
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: false,
    });
    hole.customType = "centerHole";
    canvas.add(hole);
    canvas.bringObjectToFront(hole);
  }

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

  // Text tool — click to place
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

  // Undo
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

  // Redo
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

  // Clear all
  const handleClear = () => {
    const canvas = fabricRef.current;
    if (!canvas || !window.confirm("Clear the entire canvas?")) return;
    canvas.clear();
    canvas.backgroundColor = bgColor;
    if (shape === "cd") {
      canvas.clipPath = new fabric.Circle({
        radius: CD_SIZE / 2,
        left: CD_SIZE / 2,
        top: CD_SIZE / 2,
        originX: "center",
        originY: "center",
        absolutePositioned: true,
      });
      addCenterHole(canvas);
    }
    canvas.renderAll();
    pushUndo();
  };

  // Add sticker
  const handleAddSticker = (emoji) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Render emoji to an offscreen canvas
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

  // Background color change
  const handleBgChange = (color) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setBgColor(color);
    canvas.backgroundColor = color;
    canvas.renderAll();
    pushUndo();
    setShowBgPicker(false);
  };

  // Shape switch
  const handleShapeSwitch = (newShape) => {
    if (newShape === shape) return;
    if (!window.confirm("Switching shape will clear your design. Continue?")) return;
    setShape(newShape);
  };

  // Delete selected object
  const handleDeleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active && active.customType !== "centerHole") {
      canvas.remove(active);
      canvas.renderAll();
      pushUndo();
    }
  };

  // Save
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

      const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
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
      const jsonData = canvas.toJSON();

      await onSave(url, jsonData, shape);
      onClose();
    } catch (e) {
      console.error("Save error:", e);
      alert("Failed to save cover. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Scale factor for display
  const maxDisplayWidth = Math.min(window.innerWidth * 0.88, 500);
  const canvasW = getCanvasWidth();
  const canvasH = getCanvasHeight();
  const scale = Math.min(maxDisplayWidth / canvasW, (window.innerHeight * 0.5) / canvasH);

  const toolBtnStyle = (isActive) => ({
    padding: "6px 10px",
    borderRadius: 6,
    border: `1px solid ${isActive ? palette.accent : palette.border}`,
    background: isActive ? palette.accent + "20" : palette.surface,
    color: isActive ? palette.accent : palette.text,
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
        background: "rgba(0,0,0,0.9)",
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
          borderBottom: `1px solid ${palette.border}`,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: palette.textMuted,
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
            color: palette.text,
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
            background: saving ? palette.border : palette.accent,
            color: saving ? palette.textDim : "#000",
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
          padding: "8px 0",
          minHeight: 0,
        }}
      >
        <div
          style={{
            width: canvasW * scale,
            height: canvasH * scale,
            borderRadius: shape === "cd" ? "50%" : 12,
            overflow: "hidden",
            boxShadow: "0 4px 40px rgba(0,0,0,0.5)",
            border: `2px solid ${palette.border}`,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: canvasW * scale,
              height: canvasH * scale,
              display: "block",
            }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          width: "100%",
          background: palette.surface,
          borderTop: `1px solid ${palette.border}`,
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

          {/* Separator */}
          <div style={{ width: 1, height: 20, background: palette.border, margin: "0 4px" }} />

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
                  background: penSize === s ? palette.accent : palette.text,
                  display: "block",
                }}
              />
            </button>
          ))}

          <div style={{ width: 1, height: 20, background: palette.border, margin: "0 4px" }} />

          {/* Undo/Redo */}
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

          {/* Delete selected */}
          <button onClick={handleDeleteSelected} style={toolBtnStyle(false)}>
            Delete
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            style={{
              ...toolBtnStyle(false),
              color: palette.coral,
              borderColor: palette.coral + "40",
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
              borderTop: `1px solid ${palette.border}`,
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
                  border: `1px solid ${palette.border}`,
                  background: palette.bg,
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
              borderTop: `1px solid ${palette.border}`,
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
                  border: `2px solid ${bgColor === c ? palette.accent : palette.border}`,
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
            borderTop: `1px solid ${palette.border}`,
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
