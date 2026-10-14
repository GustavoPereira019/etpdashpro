import { forwardRef, useRef, useCallback } from "react";
import { RESOLUCOES, type Aparencia, type Pagina, type Resolucao, type Visual, useBriefing, MAX_VISUAL_W, MAX_VISUAL_H, MIN_VISUAL_W, MIN_VISUAL_H } from "@/lib/briefing-store";

// NOTE: the canvas mirrors the CLIENT's chosen palette (user data), so inline styles
// from their hex values are intentional — this is a mockup, not app chrome.

interface Props {
  pagina: Pagina;
  paginas: Pagina[];
  aparencia: Aparencia;
  resolucao: Resolucao;
  empresa: string;
}

const radiusPx = { reto: 0, medio: 8, arredondado: 18 } as const;
const ROW_BASE = 130; // grid-auto-rows base height in px

function mix(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export const DashboardCanvas = forwardRef<HTMLDivElement, Props>(function DashboardCanvas(
  { pagina, paginas, aparencia, resolucao, empresa },
  ref,
) {
  const dim = RESOLUCOES[resolucao];
  const dark = aparencia.tema === "escuro";
  const text = dark ? "#E7ECF3" : "#1B2330";
  const sub = dark ? "rgba(231,236,243,0.55)" : "rgba(27,35,48,0.55)";
  const cardBg = dark ? "rgba(255,255,255,0.04)" : "#FFFFFF";
  const line = dark ? "rgba(255,255,255,0.09)" : "rgba(15,20,27,0.09)";
  const r = radiusPx[aparencia.cantos];
  const card: React.CSSProperties = {
    background: cardBg,
    borderRadius: r,
    border: aparencia.borda ? `1px solid ${line}` : "1px solid transparent",
    boxShadow: !aparencia.borda && !dark ? "0 2px 10px rgba(15,20,27,0.06)" : undefined,
  };
  const lateral = pagina.posicaoCards === "lateral" && pagina.kpis.length > 0;

  return (
    <div
      ref={ref}
      style={{ width: dim.w, minHeight: dim.h, height: dim.h, background: aparencia.fundo, color: text, fontFamily: "Manrope, sans-serif" }}
      className={`flex flex-col ${resolucao === "longo" ? "overflow-y-auto" : "overflow-hidden"}`}
      data-dashboard-canvas
    >
      {/* header */}
      <div style={{ height: 64, borderBottom: `1px solid ${line}`, padding: "0 28px" }} className="flex shrink-0 items-center gap-6">
        <div className="flex min-w-0 items-center gap-3">
          {aparencia.logo ? (
            <img src={aparencia.logo} alt="Logo" style={{ height: 34, maxWidth: 140, objectFit: "contain" }} />
          ) : (
            <div style={{ width: 34, height: 34, borderRadius: Math.min(r, 10), background: aparencia.primaria }} />
          )}
          <span style={{ fontWeight: 700, fontSize: 18, fontFamily: "Sora, sans-serif" }}>{empresa || "Sua Empresa"}</span>
        </div>
        <div className="flex gap-1">
          {paginas.map((p) => (
            <span
              key={p.id}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                borderRadius: Math.min(r, 999),
                background: p.id === pagina.id ? mix(aparencia.primaria, 0.16) : "transparent",
                color: p.id === pagina.id ? aparencia.primaria : sub,
                fontWeight: 600,
              }}
            >
              {p.nome}
            </span>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {["Período", "Região"].map((f) => (
            <span key={f} style={{ ...card, padding: "6px 14px", fontSize: 12, color: sub }}>
              {f} ▾
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: 24, gap: 20 }} className={`flex shrink-0 items-start ${lateral ? "flex-row" : "flex-col"}`}>
        {pagina.kpis.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: lateral ? "240px" : `repeat(${pagina.kpis.length}, minmax(0,240px))`,
              gridAutoRows: "116px",
              width: lateral ? 240 : "100%",
              flexShrink: 0,
            }}
          >
            {pagina.kpis.map((k, i) => (
              <div key={i} data-dashboard-kpi style={{ ...card, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: i % 2 ? aparencia.secundaria : aparencia.primaria }} />
                <div style={{ fontSize: 12, color: sub, fontWeight: 600, textTransform: "uppercase", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }} title={k}>{k || "KPI"}</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "Sora, sans-serif", marginTop: 6 }}>{["R$ 4,2M", "32,8%", "R$ 1.290", "12.480", "98,1%", "94,6%"][i % 6]}</div>
                <div style={{ fontSize: 12, color: i % 3 === 1 ? "#F87171" : "#4ADE80", marginTop: 4 }}>{i % 3 === 1 ? "▼ 1,2%" : "▲ 8,4%"} vs mês ant.</div>
              </div>
            ))}
          </div>
        )}
        <VisualGrid pagina={pagina} card={card} aparencia={aparencia} sub={sub} line={line} resolucao={resolucao} lateral={lateral} />
      </div>
    </div>
  );
});

function VisualGrid({ pagina, card, aparencia, sub, line, resolucao, lateral }: { pagina: Pagina; card: React.CSSProperties; aparencia: Aparencia; sub: string; line: string; resolucao: Resolucao; lateral: boolean }) {
  // Fluid 12-column CSS Grid. grid-auto-rows gives each row a base height;
  // each visual spans w columns and h rows via inline grid styles.
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gridAutoRows: `${ROW_BASE}px`,
        gap: 20,
        width: "100%",
        minWidth: 0,
        alignContent: "start",
      }}
    >
      {pagina.visuais.map((v, i) => (
        <VisualCard
          key={v.id}
          v={v}
          index={i}
          paginaId={pagina.id}
          card={card}
          aparencia={aparencia}
          sub={sub}
          line={line}
        />
      ))}
    </div>
  );
}

function VisualCard({ v, index, paginaId, card, aparencia, sub, line }: {
  v: Visual;
  index: number;
  paginaId: string;
  card: React.CSSProperties;
  aparencia: Aparencia;
  sub: string;
  line: string;
}) {
  const resizeVisual = useBriefing((s) => s.resizeVisual);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startW: v.w, startH: v.h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [v.w, v.h]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const COL_W = 90;
    const ROW_H = ROW_BASE + 20;
    const dw = Math.round((e.clientX - d.startX) / COL_W);
    const dh = Math.round((e.clientY - d.startY) / ROW_H);
    resizeVisual(paginaId, v.id, d.startW + dw, d.startH + dh);
  }, [paginaId, v.id, resizeVisual]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  // Discrete +/- controls as an alternative/complement to the drag handle
  const adjustW = (delta: number) => resizeVisual(paginaId, v.id, v.w + delta, v.h);
  const adjustH = (delta: number) => resizeVisual(paginaId, v.id, v.w, v.h + delta);

  return (
    <div
      ref={cardRef}
      data-dashboard-visual
      style={{
        ...card,
        gridColumn: `span ${Math.min(MAX_VISUAL_W, Math.max(MIN_VISUAL_W, v.w))}`,
        gridRow: `span ${Math.min(MAX_VISUAL_H, Math.max(MIN_VISUAL_H, v.h))}`,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        minWidth: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header with resize controls */}
      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1 }} title={v.titulo}>
          {v.titulo || `Visual ${index + 1}`}
        </div>
        {/* Discrete width / height steppers */}
        <div className="flex items-center gap-1" style={{ opacity: 0.6 }}>
          <Stepper label="L" value={v.w} min={MIN_VISUAL_W} max={MAX_VISUAL_W} onDec={() => adjustW(-1)} onInc={() => adjustW(1)} />
          <Stepper label="A" value={v.h} min={MIN_VISUAL_H} max={MAX_VISUAL_H} onDec={() => adjustH(-1)} onInc={() => adjustH(1)} />
        </div>
      </div>
      {v.descricao && <div style={{ fontSize: 11, color: sub, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0 }}>{v.descricao}</div>}

      {/* Chart area: 100% w/h to adapt to new card size */}
      <div style={{ flex: 1, minHeight: 0, marginTop: 12 }}>
        <ChartMock v={v} p={aparencia.primaria} s={aparencia.secundaria} line={line} sub={sub} />
      </div>

      {/* Drag resize handle (bottom-right) */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 20,
          height: 20,
          cursor: "nwse-resize",
          touchAction: "none",
          zIndex: 10,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" style={{ opacity: 0.4 }}>
          <path d="M14 18 L18 14 M10 18 L18 10 M6 18 L18 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}

function Stepper({ label, value, min, max, onDec, onInc }: { label: string; value: number; min: number; max: number; onDec: () => void; onInc: () => void }) {
  return (
    <div className="flex items-center gap-0.5" style={{ fontSize: 10 }}>
      <span style={{ fontWeight: 700, opacity: 0.5 }}>{label}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDec(); }}
        disabled={value <= min}
        style={{
          width: 18, height: 18, borderRadius: 4, border: "1px solid rgba(128,128,128,0.2)", background: "transparent",
          color: "inherit", cursor: value <= min ? "not-allowed" : "pointer", opacity: value <= min ? 0.3 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, lineHeight: 1, padding: 0,
        }}
      >−</button>
      <span style={{ minWidth: 14, textAlign: "center", fontWeight: 600 }}>{value}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onInc(); }}
        disabled={value >= max}
        style={{
          width: 18, height: 18, borderRadius: 4, border: "1px solid rgba(128,128,128,0.2)", background: "transparent",
          color: "inherit", cursor: value >= max ? "not-allowed" : "pointer", opacity: value >= max ? 0.3 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, lineHeight: 1, padding: 0,
        }}
      >+</button>
    </div>
  );
}

function ChartMock({ v, p, s, line, sub }: { v: Visual; p: string; s: string; line: string; sub: string }) {
  const svg = { width: "100%", height: "100%", preserveAspectRatio: "xMidYMid meet" as const, viewBox: "0 0 300 150", role: "img", "aria-label": v.tipo.replace(/_/g, " ") };
  switch (v.tipo) {
    case "Linha":
      return (
        <svg {...svg}>
          {[30, 70, 110].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke={line} />)}
          <path d="M0,120 C40,100 60,110 90,80 S150,60 180,70 S240,30 300,25 L300,150 L0,150Z" fill={mix(p, 0.18)} />
          <path d="M0,120 C40,100 60,110 90,80 S150,60 180,70 S240,30 300,25" fill="none" stroke={p} strokeWidth="2.5" />
          <path d="M0,130 C50,125 80,115 120,110 S200,95 300,80" fill="none" stroke={s} strokeWidth="2" strokeDasharray="5 4" />
        </svg>
      );
    case "Barra":
      return (
        <svg {...svg}>
          {[220, 175, 245, 140, 190].map((w, i) => (
            <g key={i}><line x1="0" x2="300" y1={i * 29 + 26} y2={i * 29 + 26} stroke={line} /><rect x="0" y={i * 29 + 3} width={w} height="17" rx="3" fill={i % 2 ? s : p} /></g>
          ))}
        </svg>
      );
    case "Colunas":
      return (
        <svg {...svg}>
          {[80, 120, 60, 135, 100, 90, 115, 70].map((h, i) => (
            <rect key={i} x={i * 37 + 6} y={150 - h} width="24" height={h} rx="3" fill={i === 3 ? p : mix(i % 2 ? s : p, 0.55)} />
          ))}
        </svg>
      );
    case "Barra_Clusterizada":
      return (
        <svg {...svg}>
          {[180, 235, 150, 205].map((w, i) => (
            <g key={i}><rect x="0" y={i * 37 + 2} width={w} height="12" rx="2" fill={p} /><rect x="0" y={i * 37 + 16} width={w * 0.76} height="12" rx="2" fill={s} /></g>
          ))}
        </svg>
      );
    case "Barra_Empilhada":
      return (
        <svg {...svg}>
          {[110, 150, 90, 130, 105].map((w, i) => (
            <g key={i}><rect x="0" y={i * 29 + 3} width={w} height="18" fill={p} /><rect x={w} y={i * 29 + 3} width={60 + i * 8} height="18" fill={s} /><rect x={w + 60 + i * 8} y={i * 29 + 3} width="30" height="18" fill={mix(p, 0.35)} /></g>
          ))}
        </svg>
      );
    case "Linha_Barra":
      return (
        <svg {...svg}>
          {[30, 70, 110].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke={line} />)}
          {[65, 85, 70, 105, 95, 120].map((h, i) => <rect key={i} x={i * 50 + 8} y={150 - h} width="28" height={h} rx="3" fill={mix(p, 0.6)} />)}
          <path d="M22 90 L72 72 L122 84 L172 43 L222 56 L272 20" fill="none" stroke={s} strokeWidth="3" />
          {[[22, 90], [72, 72], [122, 84], [172, 43], [222, 56], [272, 20]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill={s} />)}
        </svg>
      );
    case "Mapa":
      return (
        <svg {...svg}>
          <g transform="translate(75,0)">
            <path d="M30 12 L80 5 L105 22 L144 27 L153 55 L133 83 L110 93 L100 116 L80 145 L62 119 L59 93 L40 72 L18 60 L6 34 Z" fill={mix(p, 0.12)} stroke={p} strokeWidth="1.5" />
            <path d="M6 34 L60 40 L80 5 M60 40 L59 93 M60 40 L105 22 M60 40 L133 83 M59 93 L110 93 M62 119 L100 116" fill="none" stroke={line} strokeWidth="1.5" />
            {[[40, 35, 6], [95, 48, 10], [120, 70, 7], [76, 92, 12], [82, 120, 5]].map(([x, y, r], i) => <g key={i}><circle cx={x} cy={y} r={(r ?? 5) + 4} fill={mix(i % 2 ? s : p, 0.15)} /><circle cx={x} cy={y} r={r} fill={mix(i % 2 ? s : p, 0.75)} /></g>)}
          </g>
        </svg>
      );
    case "Indicadores":
      return (
        <svg {...svg}>
          {[0.84, 0.66, 0.92].map((value, i) => <g key={i} transform={`translate(${i * 100 + 50},72)`}>
            <circle r="35" fill="none" stroke={line} strokeWidth="8" />
            <circle r="35" fill="none" stroke={i % 2 ? s : p} strokeWidth="8" strokeDasharray={`${value * 220} 220`} transform="rotate(-90)" strokeLinecap="round" />
            <text textAnchor="middle" y="5" fill={sub} fontSize="17" fontWeight="700">{Math.round(value * 100)}%</text>
          </g>)}
        </svg>
      );
    case "Rosca":
      return (
        <svg width="100%" height="100%" viewBox="0 0 300 150">
          <g transform="translate(90,75)">
            <circle r="52" fill="none" stroke={line} strokeWidth="20" />
            <circle r="52" fill="none" stroke={p} strokeWidth="20" strokeDasharray="160 327" transform="rotate(-90)" />
            <circle r="52" fill="none" stroke={s} strokeWidth="20" strokeDasharray="90 327" strokeDashoffset="-160" transform="rotate(-90)" />
          </g>
          {[p, s, line].map((c, i) => (
            <g key={i} transform={`translate(180,${50 + i * 22})`}>
              <rect width="10" height="10" rx="2" fill={c} />
              <rect x="18" y="2" width={70 - i * 12} height="6" rx="3" fill={sub} opacity="0.5" />
            </g>
          ))}
        </svg>
      );
    case "Tabela":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%", overflow: "hidden" }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${line}` }}>
              {[40, 22, 18, 20].map((w, j) => (
                <div key={j} style={{ width: `${w}%`, height: 7, borderRadius: 4, background: i === 0 ? mix(p, 0.6) : j === 3 ? mix(s, 0.5) : line }} />
              ))}
            </div>
          ))}
        </div>
      );
    case "Dispersao":
      return (
        <svg {...svg}>
          {Array.from({ length: 26 }).map((_, i) => {
            const x = (i * 53) % 290 + 5, y = 140 - ((i * 37) % 120) - x * 0.1;
            return <circle key={i} cx={x} cy={Math.max(8, y)} r={3 + (i % 4) * 2} fill={mix(i % 3 ? p : s, 0.6)} />;
          })}
        </svg>
      );
    case "Custom_HTML":
      return (
        <div style={{ height: "100%", border: `1.5px dashed ${p}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4, background: mix(p, 0.06) }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18, color: p }}>{"</>"}</span>
          <span style={{ fontSize: 11, color: sub }}>Visual sob medida · HTML / Deneb / D3</span>
        </div>
      );
    default:
      return (
        <div style={{ height: "100%", border: `1.5px dashed ${line}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: sub }}>
          {v.tipo.replace(/_/g, " ")}
        </div>
      );
  }
}
