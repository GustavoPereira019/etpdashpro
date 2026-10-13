import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  ArrowLeft, CheckCircle2, Code2, Filter, ImageDown, Menu, LayoutGrid, Monitor, Palette, Plus, Send, Trash2, Upload, X, Gauge, PanelsTopLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { BRIEFING_TEMPLATES, MAX_PAGINAS, RESOLUCOES, VISUAL_LABELS, useBriefing, type GridPreset, type Resolucao, type VisualTipo } from "@/lib/briefing-store";
import { submitBriefing } from "@/lib/submit-briefing";
import { DashboardCanvas } from "./DashboardCanvas";

const PRESETS: { id: GridPreset; label: string }[] = [
  { id: "2x2", label: "2×2" },
  { id: "1+2", label: "1 + 2" },
  { id: "2col", label: "2 colunas" },
  { id: "custom", label: "Livre" },
];

export function Configurator() {
  const s = useBriefing();
  const pagina = s.paginas.find((p) => p.id === s.paginaAtiva) ?? s.paginas[0];
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [novaPag, setNovaPag] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<null | "cloud" | "local">(null);
  const dim = RESOLUCOES[s.resolucao];

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, (el.clientWidth - 48) / dim.w)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [dim.w]);

  const exportPng = async () => {
    if (!canvasRef.current) return;
    try {
      const url = await toPng(canvasRef.current, { pixelRatio: 2, cacheBust: true });
      download(url, `layout-${slug(pagina?.nome ?? "painel")}.png`);
    } catch {
      toast.error("Não foi possível gerar a imagem.");
    }
  };
  const lim = RESOLUCOES[s.resolucao];
  const obsOk = s.observacoes.trim().length >= 10;
  const outrosOk = s.paginas.every((p) => p.visuais.every((v) => v.tipo !== "Outro" || v.outroTipo.trim().length > 0));

  const enviar = async () => {
    if (!obsOk || !outrosOk) return;
    setEnviando(true);
    const r = await submitBriefing(s);
    setEnviando(false);
    setEnviado(r);
  };

  const onLogo = (f?: File) => {
    if (!f) return;
    if (f.size > 1_500_000) { toast.error("Logo deve ter até 1,5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => s.setAparencia({ logo: reader.result as string });
    reader.readAsDataURL(f);
  };

  if (!pagina) return null;

  return (
    <div className="grid min-h-[calc(100vh-57px)] lg:grid-cols-[380px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="border-r border-border bg-sidebar lg:h-[calc(100vh-57px)] lg:overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Button variant="ghost" size="sm" onClick={() => s.setEtapa(1)}><ArrowLeft /> Dados</Button>
          <span className="font-mono text-xs text-muted-foreground">Etapa 2 de 2</span>
        </div>

        <Accordion type="multiple" defaultValue={["templates", "res", "pag", "menu", "fil", "kpi", "vis"]} className="px-5">
          <Section value="templates" icon={PanelsTopLeft} title="Exemplos Prontos (Templates)">
            <div className="space-y-2">
              {BRIEFING_TEMPLATES.map((template, i) => (
                <Button key={template.id} variant="outline" className="h-auto w-full justify-start gap-3 whitespace-normal rounded-lg px-3 py-3 text-left" onClick={() => {
                  s.applyTemplate(template.id);
                  setNovaPag("");
                  toast.success(`${template.nome} aplicado.`);
                }}>
                  <span className="font-mono text-xs text-primary">0{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{template.nome}</span>
                    <span className="block text-xs font-normal text-muted-foreground">{RESOLUCOES[template.resolucao].label} · {template.paginas.length} {template.paginas.length === 1 ? "página" : "páginas"}</span>
                  </span>
                </Button>
              ))}
            </div>
          </Section>
          <Section value="res" icon={Monitor} title="Dimensão do painel">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(RESOLUCOES) as Resolucao[]).map((r) => (
                <Chip key={r} active={s.resolucao === r} onClick={() => s.setResolucao(r)}>
                  <span className="block text-xs font-semibold">{RESOLUCOES[r].label}</span>
                  <span className="block font-mono text-[10px] opacity-70">{RESOLUCOES[r].hint}</span>
                </Chip>
              ))}
            </div>
          </Section>

          <Section value="pag" icon={LayoutGrid} title="Páginas">
            <div className="space-y-2">
              {s.paginas.map((p) => (
                <div key={p.id} className={cn("flex items-center gap-2 rounded-lg border px-2 py-1", p.id === pagina.id ? "border-primary bg-accent" : "border-border")}>
                  <Input
                    value={p.nome}
                    onFocus={() => s.setPaginaAtiva(p.id)}
                    onChange={(e) => s.updatePagina(p.id, { nome: e.target.value })}
                    className="h-8 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" disabled={s.paginas.length <= 1} onClick={() => s.removePagina(p.id)} aria-label="Remover página">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (s.paginas.length >= MAX_PAGINAS) return;
                  s.addPagina(novaPag.trim() || `Página ${s.paginas.length + 1}`);
                  setNovaPag("");
                }}
              >
                <Input value={novaPag} maxLength={40} onChange={(e) => setNovaPag(e.target.value)} placeholder="Ex.: Financeiro" className="h-9" />
                <Button type="submit" size="sm" variant="secondary" disabled={s.paginas.length >= MAX_PAGINAS}><Plus /> Adicionar</Button>
              </form>
              <p className="text-xs text-muted-foreground">{s.paginas.length} de {MAX_PAGINAS} páginas</p>
            </div>
          </Section>

          <Section value="menu" icon={Menu} title="Menu de páginas">
            <div className="grid grid-cols-2 gap-2">
              <Chip active={s.menuPosicao === "topo"} onClick={() => s.setMenuPosicao("topo")}>Topo</Chip>
              <Chip active={s.menuPosicao === "lateral_direita"} onClick={() => s.setMenuPosicao("lateral_direita")}>Lateral direita</Chip>
            </div>
          </Section>

          <Section value="fil" icon={Filter} title="Filtros">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="block text-xs text-muted-foreground">Quais filtros deseja?</Label>
                <Textarea rows={2} maxLength={300} value={s.filtros.quais} onChange={(e) => s.setFiltros({ quais: e.target.value })} placeholder="Ex.: Período, Região, Vendedor, Produto" className="text-sm" />
              </div>
              <div>
                <Label className="mb-2 block text-xs text-muted-foreground">Quantidade de filtros</Label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <Chip key={n} active={s.filtros.quantidade === n} onClick={() => s.setFiltros({ quantidade: n })}>{n === 5 ? "5+" : n}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-xs text-muted-foreground">Estilo dos filtros</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Chip active={s.filtros.estilo === "ocultos"} onClick={() => s.setFiltros({ estilo: "ocultos" })}>Ocultos num ícone</Chip>
                  <Chip active={s.filtros.estilo === "exibidos"} onClick={() => s.setFiltros({ estilo: "exibidos" })}>Exibidos na tela</Chip>
                </div>
              </div>
            </div>
          </Section>

          <Section value="kpi" icon={Gauge} title={`Cards de KPI · ${pagina.nome}`}>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-xs text-muted-foreground">Quantidade</Label>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: lim.maxKpis + 1 }, (_, n) => n).map((n) => (
                    <Chip key={n} active={pagina.kpis.length === n} onClick={() => s.setQtdKpis(pagina.id, n)}>{n}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-xs text-muted-foreground">Posição</Label>
                <div className={cn("grid gap-2", s.resolucao === "longo" ? "grid-cols-1" : "grid-cols-2")}>
                  <Chip active={pagina.posicaoCards === "topo"} onClick={() => s.updatePagina(pagina.id, { posicaoCards: "topo" })}>Topo</Chip>
                  {s.resolucao !== "longo" && (
                    <Chip active={pagina.posicaoCards === "lateral"} onClick={() => s.updatePagina(pagina.id, { posicaoCards: "lateral" })}>Lateral</Chip>
                  )}
                </div>
              </div>
              {pagina.kpis.map((k, i) => (
                <Input key={i} value={k} onChange={(e) => s.setKpi(pagina.id, i, e.target.value)} placeholder={`Métrica ${i + 1}`} className="h-9" />
              ))}
            </div>
          </Section>

          <Section value="vis" icon={LayoutGrid} title="Visuais e gráficos">
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-1.5">
                {PRESETS.map((p) => (
                  <Chip key={p.id} active={pagina.gridPreset === p.id} onClick={() => s.setPreset(pagina.id, p.id)}>{p.label}</Chip>
                ))}
              </div>
              {pagina.visuais.map((v, i) => (
                <div key={v.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                    <Select value={v.tipo} onValueChange={(t) => s.updateVisual(pagina.id, v.id, { tipo: t as VisualTipo })}>
                      <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(VISUAL_LABELS) as VisualTipo[]).map((t) => <SelectItem key={t} value={t}>{VISUAL_LABELS[t]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" disabled={pagina.visuais.length <= 1} onClick={() => s.removeVisual(pagina.id, v.id)} aria-label="Remover visual">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Input value={v.titulo} onChange={(e) => s.updateVisual(pagina.id, v.id, { titulo: e.target.value })} placeholder="Título (ex.: Vendas por mês)" className="h-8" />
                  <Textarea rows={2} value={v.descricao} onChange={(e) => s.updateVisual(pagina.id, v.id, { descricao: e.target.value })} placeholder="Explique o que deve apresentar no gráfico" className="text-sm" />
                  {v.tipo === "Outro" && (
                    <Input value={v.outroTipo} maxLength={100} onChange={(e) => s.updateVisual(pagina.id, v.id, { outroTipo: e.target.value })} placeholder="Qual gráfico deseja? (obrigatório)" className="h-8" />
                  )}
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-xs">
                    <span>Deseja botões de alternância (clicar para trocar de gráfico no mesmo espaço)?</span>
                    <Switch checked={v.alternancia} onCheckedChange={(b) => s.updateVisual(pagina.id, v.id, { alternancia: b })} />
                  </label>
                  {v.tipo === "Custom_HTML" && (
                    <div className="space-y-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
                      <p className="flex gap-2 text-xs text-warning"><Code2 className="h-4 w-4 shrink-0" />Visual customizado sob medida: descreva detalhadamente a lógica desejada. Este item será alinhado e refinado em reunião técnica.</p>
                      <Textarea rows={3} value={v.customHtml} onChange={(e) => s.updateVisual(pagina.id, v.id, { customHtml: e.target.value })} placeholder="Descreva interações, cálculos, referências visuais…" className="text-sm" />
                    </div>
                  )}
                </div>
              ))}
              <Button variant="secondary" size="sm" className="w-full" disabled={pagina.visuais.length >= lim.maxVisuais} onClick={() => s.addVisual(pagina.id)}><Plus /> Adicionar visual ({pagina.visuais.length}/{lim.maxVisuais})</Button>
            </div>
          </Section>

          <Section value="apa" icon={Palette} title="Identidade visual">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Chip active={s.aparencia.tema === "claro"} onClick={() => s.setAparencia({ tema: "claro", fundo: "#F4F6F9" })}>Claro</Chip>
                <Chip active={s.aparencia.tema === "escuro"} onClick={() => s.setAparencia({ tema: "escuro", fundo: "#0F141B" })}>Escuro</Chip>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([["primaria", "Primária"], ["secundaria", "Secundária"], ["fundo", "Fundo"]] as const).map(([k, l]) => (
                  <label key={k} className="space-y-1">
                    <span className="text-xs text-muted-foreground">{l}</span>
                    <div className="flex items-center gap-1.5 rounded-lg border border-border p-1">
                      <input type="color" value={s.aparencia[k]} onChange={(e) => s.setAparencia({ [k]: e.target.value.toUpperCase() })} className="h-7 w-7 shrink-0 cursor-pointer rounded border-0 bg-transparent" />
                      <input value={s.aparencia[k]} onChange={(e) => s.setAparencia({ [k]: e.target.value })} className="w-full min-w-0 bg-transparent font-mono text-[11px] outline-none" />
                    </div>
                  </label>
                ))}
              </div>
              <div>
                <Label className="mb-2 block text-xs text-muted-foreground">Cantos dos cards</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["reto", "medio", "arredondado"] as const).map((c) => (
                    <Chip key={c} active={s.aparencia.cantos === c} onClick={() => s.setAparencia({ cantos: c })}>{c === "medio" ? "Médio" : c.charAt(0).toUpperCase() + c.slice(1)}</Chip>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm">Cards com borda</span>
                <Switch checked={s.aparencia.borda} onCheckedChange={(b) => s.setAparencia({ borda: b })} />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground hover:border-primary">
                  <Upload className="h-4 w-4" /> {s.aparencia.logo ? "Trocar logotipo" : "Enviar logotipo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
                </label>
                {s.aparencia.logo && <Button variant="ghost" size="icon" onClick={() => s.setAparencia({ logo: null })} aria-label="Remover logo"><Trash2 /></Button>}
              </div>
            </div>
          </Section>
        </Accordion>

        <div className="space-y-3 border-t border-border p-5">
          <Label>Observações técnicas *</Label>
          <Textarea rows={3} maxLength={500} value={s.observacoes} onChange={(e) => s.setObservacoes(e.target.value)} placeholder="Faltou alguma coisa? Deixe suas observações aqui..." />
          <Button size="lg" className="w-full shadow-glow" disabled={enviando || !obsOk || !outrosOk} onClick={enviar}>
            <Send /> {enviando ? "Enviando…" : "Enviar para análise"}
          </Button>
        </div>
      </aside>

      {/* Canvas */}
      <section className="flex min-w-0 flex-col bg-surface bg-dots">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background/80 px-5 py-3 backdrop-blur">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {s.paginas.map((p) => (
              <Button variant="ghost" size="sm"
                key={p.id}
                onClick={() => s.setPaginaAtiva(p.id)}
                className={cn("shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors", p.id === pagina.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
              >
                {p.nome}
              </Button>
            ))}
          </div>
          <span className="hidden font-mono text-xs text-muted-foreground md:inline">{dim.w}×{dim.h} · {Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={exportPng}><ImageDown /> PNG</Button>
        </div>
        <div ref={wrapRef} className={cn("flex-1 p-6", s.resolucao === "longo" ? "max-h-[calc(100vh-110px)] overflow-y-auto" : "overflow-hidden")}>
          <div className="mx-auto overflow-hidden rounded-lg shadow-2xl ring-1 ring-border" style={{ width: dim.w * scale, height: dim.h * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: dim.w }}>
              <DashboardCanvas ref={canvasRef} pagina={pagina} paginas={s.paginas} aparencia={s.aparencia} resolucao={s.resolucao} empresa={s.contato.empresa} />
            </div>
          </div>
        </div>
      </section>

      <Dialog open={!!enviado} onOpenChange={(o) => !o && setEnviado(null)}>
        <DialogContent>
          <DialogHeader>
            <CheckCircle2 className="mb-2 h-10 w-10 text-primary" />
            <DialogTitle>Solicitação recebida!</DialogTitle>
            <DialogDescription>
              {enviado === "cloud"
                ? `Obrigado, ${s.contato.nome.split(" ")[0] || ""}. Nossa equipe vai analisar seu layout e enviar a proposta para ${s.contato.email}.`
                : "Não conseguimos conectar ao servidor agora; sua solicitação foi salva neste navegador. Tente enviar novamente em instantes."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={exportPng}><ImageDown /> Baixar PNG</Button>
            <Button className="flex-1" onClick={() => { setEnviado(null); s.reset(); }}>Novo briefing</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ value, icon: Icon, title, children }: { value: string; icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-sm hover:no-underline">
        <span className="flex min-w-0 items-center gap-2"><Icon className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{title}</span></span>
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant="outline"
      type="button"
      onClick={onClick}
      className={cn(
        "h-auto whitespace-normal rounded-lg border px-2 py-2 text-center text-sm transition-colors",
        active ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </Button>
  );
}

function download(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^\w]+/g, "-");
