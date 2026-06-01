"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface TerrorMeterProps {
  titleId: string;
  initialScore: number | null;
  disabled?: boolean;
}

// Canvas geometry — matches reference HTML exactly
const GW = 320, GH = 175, CX = 160, CY = 165, R = 130, IR = 65;

const ZONES = [
  { from: 0,     to: 14.28, color: "#cc0000" },
  { from: 14.28, to: 28.57, color: "#dd3300" },
  { from: 28.57, to: 42.85, color: "#d4a017" },
  { from: 42.85, to: 57.14, color: "#ccaa00" },
  { from: 57.14, to: 71.42, color: "#88cc00" },
  { from: 71.42, to: 85.71, color: "#44cc22" },
  { from: 85.71, to: 100,   color: "#22c55e" },
];

const VERDICTS = [
  { min: 0,  max: 14,  label: "TERRIBLE",   color: "#cc0000" },
  { min: 15, max: 29,  label: "AWFUL",       color: "#dd3300" },
  { min: 30, max: 44,  label: "KINDA BAD",   color: "#d4a017" },
  { min: 45, max: 59,  label: "MEH-DIOCRE",  color: "#ccaa00" },
  { min: 60, max: 74,  label: "CREEPY",      color: "#88cc00" },
  { min: 75, max: 89,  label: "SCARY",       color: "#44cc22" },
  { min: 90, max: 100, label: "TERRIFYING",  color: "#22c55e" },
];

function getVerdict(val: number) {
  return VERDICTS.find((v) => val >= v.min && val <= v.max) ?? VERDICTS[3];
}

function getBtnColor(val: number): string {
  if (val <= 29) return "#cc0000";
  if (val <= 59) return "#d4a017";
  return "#22c55e";
}

function drawGauge(canvas: HTMLCanvasElement, val: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, GW, GH);

  // Dark donut background
  ctx.beginPath();
  ctx.arc(CX, CY, R + 5, Math.PI, 0, false);
  ctx.arc(CX, CY, IR - 5, 0, Math.PI, true);
  ctx.closePath();
  ctx.fillStyle = "#1a1a1a";
  ctx.fill();

  // Colour zones
  ZONES.forEach((z) => {
    const sa = Math.PI + (z.from / 100) * Math.PI;
    const ea = Math.PI + (z.to / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(CX, CY, R, sa, ea, false);
    ctx.arc(CX, CY, IR, ea, sa, true);
    ctx.closePath();
    ctx.fillStyle = z.color;
    ctx.fill();
  });

  // Outer border
  ctx.beginPath();
  ctx.arc(CX, CY, R + 5, Math.PI, 0, false);
  ctx.arc(CX, CY, IR - 5, 0, Math.PI, true);
  ctx.closePath();
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tick marks
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(CX + Math.cos(a) * (R - 6), CY + Math.sin(a) * (R - 6));
    ctx.lineTo(CX + Math.cos(a) * (R + 4), CY + Math.sin(a) * (R + 4));
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Needle
  const na = Math.PI + (val / 100) * Math.PI;
  const nl = R - 16;
  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(na);
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.lineTo(nl - 12, -3.5);
  ctx.lineTo(nl, 0);
  ctx.lineTo(nl - 12, 3.5);
  ctx.closePath();
  ctx.fillStyle = "#e8e8e8";
  ctx.fill();
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();

  // Centre pivot
  ctx.beginPath(); ctx.arc(CX, CY, 9, 0, Math.PI * 2); ctx.fillStyle = "#444"; ctx.fill();
  ctx.beginPath(); ctx.arc(CX, CY, 6, 0, Math.PI * 2); ctx.fillStyle = "#777"; ctx.fill();
  ctx.beginPath(); ctx.arc(CX, CY, 3, 0, Math.PI * 2); ctx.fillStyle = "#bbb"; ctx.fill();
}

const SCREWS: React.CSSProperties[] = [
  { top: 8, left: 8 },
  { top: 8, right: 8 },
  { bottom: 8, left: 8 },
  { bottom: 8, right: 8 },
];

const LIGHTS = [
  { onBg: "#cc0000", onBorder: "#ff6666" },
  { onBg: "#d4a017", onBorder: "#ffcc44" },
  { onBg: "#22c55e", onBorder: "#66ffaa" },
];

export function TerrorMeter({ titleId, initialScore, disabled = false }: TerrorMeterProps) {
  const [score, setScore] = useState(initialScore ?? 45);
  const [submitted, setSubmitted] = useState(initialScore !== null);
  const [interacted, setInteracted] = useState(false);
  const [displayCount, setDisplayCount] = useState(initialScore ?? 0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const submittedScoreRef = useRef(initialScore ?? 0);

  // Indicator lights (thresholds match reference)
  const lightsOn = [score <= 44, score >= 30 && score <= 74, score >= 60];

  // LCD content — empty until user interacts; verdict label while choosing; score after submit
  const activeScore = submitted ? submittedScoreRef.current : score;
  const verdict = getVerdict(activeScore);
  const lcdText = submitted
    ? `${displayCount}/100`
    : interacted
    ? verdict.label
    : "";
  const lcdColor = submitted || interacted ? verdict.color : "#33cc33";
  const lcdShadow = `0 0 ${submitted ? "10" : "8"}px ${lcdColor}88`;

  // Redraw gauge when score or submit state changes
  useEffect(() => {
    if (canvasRef.current) {
      drawGauge(canvasRef.current, submitted ? submittedScoreRef.current : score);
    }
  }, [score, submitted, submissionCount]);

  // Count-up animation after submit
  useEffect(() => {
    if (submissionCount === 0) return;
    const val = submittedScoreRef.current;
    setDisplayCount(0);
    let c = 0;
    const iv = setInterval(() => {
      c = Math.min(c + Math.ceil(val / 20), val);
      setDisplayCount(c);
      if (c >= val) clearInterval(iv);
    }, 40);
    return () => clearInterval(iv);
  }, [submissionCount]);

  function handleSubmit() {
    setSubmitError(null);
    startTransition(async () => {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ titleId, score }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body.error ?? "Failed to save — please try again.");
        return;
      }
      submittedScoreRef.current = score;
      setSubmitted(true);
      setSubmissionCount((c) => c + 1);
      router.refresh();
    });
  }

  function handleReset() {
    setSubmitted(false);
    setInteracted(false);
  }

  const btnDisabled = submitted || isPending;
  const btnBg = btnDisabled ? "#333" : getBtnColor(score);
  const btnColor = btnDisabled ? "#666" : "#fff";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 440, margin: "0 auto" }}>

      {/* Title */}
      <div style={{ fontFamily: "var(--font-label, 'Oswald', sans-serif)", fontSize: 11, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: "#888", textAlign: "center" }}>
        Rate this title
      </div>
      <div style={{ fontFamily: "var(--font-creepster, 'Creepster', cursive)", fontSize: 40, color: "#ffffff", letterSpacing: 3, lineHeight: 1, textAlign: "center", marginTop: -8 }}>
        TERRORMETER
      </div>

      {/* Metal panel */}
      <div style={{ width: "100%", background: "linear-gradient(180deg,#3a3a3a 0%,#2a2a2a 40%,#1e1e1e 60%,#2a2a2a 100%)", border: "2px solid #555", borderRadius: 8, padding: "14px 20px 32px", position: "relative", display: "flex", flexDirection: "column" }}>

        {/* Corner screws */}
        {SCREWS.map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos, width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #666, #333)", border: "1px solid #222" }} />
        ))}

        {/* Indicator lights */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 14 }}>
          {LIGHTS.map((l, i) => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: "50%",
              background: lightsOn[i] ? l.onBg : "#111",
              border: `1.5px solid ${lightsOn[i] ? l.onBorder : "#333"}`,
              transition: "background 0.15s, border-color 0.15s",
            }} />
          ))}
        </div>

        {/* Gauge canvas */}
        <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: -4 }}>
          <canvas ref={canvasRef} width={GW} height={GH} style={{ width: "100%", maxWidth: GW, height: "auto" }} />
        </div>

        {/* LCD display — VHSGothic font only here */}
        <div className="tm-lcd-wrap">
          <div className="tm-lcd-text" style={{ color: lcdColor, textShadow: lcdShadow }}>
            {lcdText}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: "#333", marginTop: 16 }} />

        {/* Slider and button */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, paddingTop: 16 }}>
          <div className="tm-slider" style={{ width: "90%", height: 32, display: "flex", alignItems: "center" }}>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={score}
              disabled={submitted || disabled}
              onChange={(e) => {
                if (!submitted && !disabled) {
                  setInteracted(true);
                  setScore(Number(e.target.value));
                }
              }}
            />
          </div>

          {submitError && (
            <p style={{ fontSize: 11, color: "#cc0000", textAlign: "center", margin: 0 }}>
              {submitError}
            </p>
          )}

          {!disabled && (
            <button
              onClick={handleSubmit}
              disabled={btnDisabled}
              style={{
                fontFamily: "var(--font-label, 'Oswald', sans-serif)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                padding: "9px 28px",
                color: btnColor,
                border: "none",
                cursor: btnDisabled ? "default" : "pointer",
                borderRadius: 2,
                background: btnBg,
                transition: "background 0.3s",
              }}
            >
              {submitted ? "Verdict Submitted" : isPending ? "Saving…" : "Submit Verdict"}
            </button>
          )}
        </div>
      </div>

      {/* Change verdict — always rendered; fades in after submit */}
      <button
        onClick={handleReset}
        disabled={!submitted}
        style={{
          fontFamily: "var(--font-label, 'Oswald', sans-serif)",
          fontSize: 11,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#ccc",
          textDecoration: "underline",
          opacity: submitted ? 0.8 : 0,
          pointerEvents: submitted ? "auto" : "none",
          background: "none",
          border: "none",
          cursor: submitted ? "pointer" : "default",
          transition: "opacity 0.4s ease",
        }}
        onMouseEnter={(e) => { if (submitted) e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { if (submitted) e.currentTarget.style.opacity = "0.8"; }}
      >
        Changed your mind? Update your verdict
      </button>
    </div>
  );
}
