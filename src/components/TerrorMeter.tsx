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

const VERDICTS = [
  { min: 0,  max: 14,  label: "Truly Terrible",   color: "#cc0000" },
  { min: 15, max: 29,  label: "Pretty Awful",      color: "#dd3300" },
  { min: 30, max: 44,  label: "Kinda Bad",         color: "#d4a017" },
  { min: 45, max: 59,  label: "Meh-diocre",        color: "#ccaa00" },
  { min: 60, max: 74,  label: "Kinda Creepy",      color: "#88cc00" },
  { min: 75, max: 89,  label: "Pretty Scary",      color: "#44cc22" },
  { min: 90, max: 100, label: "Truly Terrifying",  color: "#22c55e" },
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

  // Single gradient arc — left (#cc0000) to right (#22c55e), no segment lines
  const gr = ctx.createLinearGradient(CX - R, CY, CX + R, CY);
  gr.addColorStop(0,    "#cc0000");
  gr.addColorStop(0.35, "#d4a017");
  gr.addColorStop(0.65, "#88cc00");
  gr.addColorStop(1,    "#22c55e");
  ctx.beginPath();
  ctx.arc(CX, CY, R,  Math.PI, 0,       false);
  ctx.arc(CX, CY, IR, 0,       Math.PI, true);
  ctx.closePath();
  ctx.fillStyle = gr;
  ctx.fill();

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
  ctx.moveTo(0, 0);
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
  const [fontReady, setFontReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desktopCanvasRef = useRef<HTMLCanvasElement>(null);
  const submittedScoreRef = useRef(initialScore ?? 0);

  // Indicator lights (thresholds match reference)
  const lightsOn = [score <= 44, score >= 30 && score <= 74, score >= 60];

  // LCD content — hidden until VHS Gothic confirms loaded, then:
  // empty until first interaction, verdict label while choosing, score after submit.
  const activeScore = submitted ? submittedScoreRef.current : score;
  const verdict = getVerdict(activeScore);
  const lcdText = !fontReady
    ? ""
    : submitted
    ? `${displayCount}/100`
    : interacted
    ? verdict.label
    : "";
  const lcdColor = submitted || interacted ? verdict.color : "#33cc33";
  const lcdShadow = `0 0 ${submitted ? "10" : "8"}px ${lcdColor}88`;

  // Confirm VHS Gothic is loaded before showing any LCD text — prevents
  // the fallback-font flash that occurs with font-display: swap.
  useEffect(() => {
    document.fonts.load('14px "VHSGothic"')
      .then(() => setFontReady(true))
      .catch(() => setFontReady(true));
  }, []);

  // Redraw both canvases (mobile + desktop) when score or submit state changes
  useEffect(() => {
    const val = submitted ? submittedScoreRef.current : score;
    if (canvasRef.current) drawGauge(canvasRef.current, val);
    if (desktopCanvasRef.current) drawGauge(desktopCanvasRef.current, val);
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

  const sliderEl = (
    <div className="tm-slider" style={{ width: "70%", height: 32, display: "flex", alignItems: "center" }}>
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
  );

  const lightsEl = (gap: number) => (
    <div style={{ display: "flex", justifyContent: "center", gap }}>
      {LIGHTS.map((l, i) => (
        <div key={i} className={lightsOn[i] ? `tm-light-pulse-${i}` : ""} style={{
          width: 12, height: 12, borderRadius: "50%",
          background: lightsOn[i] ? l.onBg : "#111",
          border: `1.5px solid ${lightsOn[i] ? l.onBorder : "#333"}`,
          transition: "background 0.15s, border-color 0.15s",
        }} />
      ))}
    </div>
  );

  const lcdEl = (
    <div className="tm-lcd-wrap">
      <div className="tm-lcd-text" style={{ color: lcdColor, textShadow: lcdShadow }}>
        {lcdText}
      </div>
    </div>
  );

  return (
    <div className="tm-outer" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 440, margin: "0 auto" }}>

      {/* Title */}
      <div style={{ fontFamily: "var(--font-label, 'Oswald', sans-serif)", fontSize: 11, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: "#888", textAlign: "center" }}>
        Rate this title
      </div>
      <div style={{ fontFamily: "var(--font-creepster, 'Creepster', cursive)", fontSize: 40, color: "#ffffff", letterSpacing: 3, lineHeight: 1, textAlign: "center", marginTop: -8 }}>
        TERRORMETER
      </div>

      {/* Metal panel */}
      <div className="tm-panel-desktop" style={{ width: "100%", background: "linear-gradient(180deg,#3a3a3a 0%,#2a2a2a 40%,#1e1e1e 60%,#2a2a2a 100%)", border: "2px solid #555", borderRadius: 8, padding: "14px 20px 32px", position: "relative", display: "flex", flexDirection: "column", animation: "tm-border-glow 3s ease-in-out infinite" }}>

        {/* Corner screws */}
        {SCREWS.map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos, width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #666, #333)", border: "1px solid #222" }} />
        ))}

        {/* ── MOBILE LAYOUT (hidden ≥ 768px) ── */}
        <div className="tm-mobile-inner">
          {/* Indicator lights */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 14 }}>
            {LIGHTS.map((l, i) => (
              <div key={i} className={lightsOn[i] ? `tm-light-pulse-${i}` : ""} style={{
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

          {/* LCD display */}
          {lcdEl}

          {/* Divider */}
          <div style={{ width: "100%", height: 1, background: "#333", marginTop: 16 }} />

          {/* Slider and button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, paddingTop: 16, width: "100%" }}>
            {sliderEl}

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
                  fontSize: 12, fontWeight: 600, letterSpacing: 2,
                  textTransform: "uppercase",
                  padding: "9px 28px",
                  color: btnColor, border: "none",
                  cursor: btnDisabled ? "default" : "pointer",
                  borderRadius: 2, background: btnBg, transition: "background 0.3s",
                }}
              >
                {submitted ? "Submitted" : isPending ? "Saving…" : "Submit"}
              </button>
            )}
          </div>
        </div>

        {/* ── DESKTOP LAYOUT (hidden < 768px) ── */}
        <div className="tm-desktop-inner">

          {/* Left column: gauge + slider */}
          <div className="tm-left-col">
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <canvas ref={desktopCanvasRef} width={GW} height={GH} style={{ width: "100%", maxWidth: GW, height: "auto" }} />
            </div>
            {sliderEl}
          </div>

          {/* Vertical divider */}
          <div className="tm-vdivider" />

          {/* Right column: lights + LCD + submit */}
          <div className="tm-right-col">
            {lightsEl(14)}
            {lcdEl}
            <div style={{ width: "100%" }}>
              {submitError && (
                <p style={{ fontSize: 11, color: "#cc0000", textAlign: "center", margin: "0 0 4px" }}>
                  {submitError}
                </p>
              )}
              {!disabled && (
                <button
                  onClick={handleSubmit}
                  disabled={btnDisabled}
                  style={{
                    fontFamily: "var(--font-label, 'Oswald', sans-serif)",
                    fontSize: 12, fontWeight: 600, letterSpacing: 2,
                    textTransform: "uppercase",
                    padding: "9px 14px",
                    color: btnColor, border: "none",
                    cursor: btnDisabled ? "default" : "pointer",
                    borderRadius: 2, background: btnBg, transition: "background 0.3s",
                    width: "100%",
                  }}
                >
                  {submitted ? "Submitted" : isPending ? "Saving…" : "Submit"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change verdict — always rendered; fades in after submit */}
      <button
        onClick={handleReset}
        disabled={!submitted}
        style={{
          fontFamily: "var(--font-label, 'Oswald', sans-serif)",
          fontSize: 11, letterSpacing: 1,
          textTransform: "uppercase",
          color: "#ccc", textDecoration: "underline",
          opacity: submitted ? 0.8 : 0,
          pointerEvents: submitted ? "auto" : "none",
          background: "none", border: "none",
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
