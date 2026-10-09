import { forwardRef } from "react";
import { RESOLUCOES, type Aparencia, type Pagina, type Resolucao, type Visual } from "@/lib/briefing-store";

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
      className="flex flex-col"
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

      <div style={{ padding: 24, gap: 20 }} className={`flex min-h-0 flex-1 ${lateral ? "flex-row" : "flex-col"}`}>
        {pagina.kpis.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: lateral ? "1fr" : `repeat(${pagina.kpis.length}, minmax(0,1fr))`,
              gridAutoRows: lateral ? "minmax(0,1fr)" : undefined,
              width: lateral ? 240 : "100%",
              flexShrink: 0,
              maxHeight: lateral && resolucao !== "scroll" ? "100%" : undefined,
            }}
          >
            {pagina.kpis.map((k, i) => (
              <div key={i} style={{ ...card, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: i % 2 ? aparencia.secundaria : aparencia.primaria }} />
                <div style={{ fontSize: 12, color: sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>{k || "KPI"}</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "Sora, sans-serif", marginTop: 6 }}>{["R$ 4,2M", "32,8%", "R$ 1.290", "12.480", "98,1%"][i]}</div>
                <div style={{ fontSize: 12, color: i % 3 === 1 ? "#F87171" : "#4ADE80", marginTop: 4 }}>{i % 3 === 1 ? "▼ 1,2%" : "▲ 8,4%"} vs mês ant.</div>
              </div>
            ))}
          </div>
        )}
        <VisualGrid pagina={pagina} card={card} aparencia={aparencia} sub={sub} line={line} />
      </div>
    </div>
  );
});

function gridStyle(p: Pagina): React.CSSProperties {
  const n = p.visuais.length;
  switch (p.gridPreset) {
    case "2x2":
      return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" };
    case "1+2":
      return { gridTemplateColumns: "1.6fr 1fr", gridTemplateRows: "1fr 1fr" };
    case "2col":
      return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr" };
    default: {
      const cols = n <= 2 ? n : n <= 4 ? 2 : 3;
      return { gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridTemplateRows: `repeat(${Math.ceil(n / cols)}, minmax(0,1fr))` };
    }
  }
}

function VisualGrid({ pagina, card, aparencia, sub, line }: { pagina: Pagina; card: React.CSSProperties; aparencia: Aparencia; sub: string; line: string }) {
  return (
    <div style={{ display: "grid", gap: 20, flex: 1, minHeight: 0, minWidth: 0, ...gridStyle(pagina) }}>
      {pagina.visuais.map((v, i) => (
        <div
          key={v.id}
          style={{ ...card, padding: 18, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0, gridRow: pagina.gridPreset === "1+2" && i === 0 ? "span 2" : undefined }}
        >
          <div style={{ fontWeight: 700, fontSize: 14 }}>{v.titulo || `Visual ${i + 1}`}</div>
          {v.descricao && <div style={{ fontSize: 11, color: sub, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.descricao}</div>}
          <div style={{ flex: 1, minHeight: 0, marginTop: 12 }}>
            <ChartMock v={v} p={aparencia.primaria} s={aparencia.secundaria} line={line} sub={sub} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartMock({ v, p, s, line, sub }: { v: Visual; p: string; s: string; line: string; sub: string }) {
  const svg = { width: "100%", height: "100%", preserveAspectRatio: "none" as const, viewBox: "0 0 300 150" };
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
          {[80, 120, 60, 135, 100, 90, 115, 70].map((h, i) => (
            <rect key={i} x={i * 37 + 6} y={150 - h} width="24" height={h} rx="3" fill={i === 3 ? p : mix(i % 2 ? s : p, 0.55)} />
          ))}
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
  }
}
