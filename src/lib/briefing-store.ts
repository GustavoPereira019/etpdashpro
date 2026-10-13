import { create } from "zustand";

export type Resolucao = "padrao" | "expandido" | "longo";
export type MenuPosicao = "topo" | "lateral_direita";
export type FiltroEstilo = "ocultos" | "exibidos";
export type VisualTipo =
  | "Linha" | "Barra" | "Colunas" | "Barra_Clusterizada" | "Barra_Empilhada" | "Linha_Barra"
  | "Rosca" | "Tabela" | "Dispersao" | "Mapa" | "Indicadores" | "Custom_HTML" | "Outro";
export type GridPreset = "2x2" | "1+2" | "2col" | "custom";
export type CantoEstilo = "reto" | "medio" | "arredondado";

export interface Visual {
  id: string;
  tipo: VisualTipo;
  titulo: string;
  descricao: string;
  customHtml: string;
  outroTipo: string;
  alternancia: boolean;
}

export interface Pagina {
  id: string;
  nome: string;
  posicaoCards: "topo" | "lateral";
  kpis: string[];
  gridPreset: GridPreset;
  visuais: Visual[];
}

export interface Contato {
  nome: string;
  email: string;
  empresa: string;
  telefone: string;
  fontes: string[];
  volume: string;
  objetivo: string;
  outraFonte: string;
  arquivoExemplo: File | null;
}

export interface Aparencia {
  tema: "claro" | "escuro";
  primaria: string;
  secundaria: string;
  fundo: string;
  cantos: CantoEstilo;
  borda: boolean;
  logo: string | null;
}

export const RESOLUCOES: Record<Resolucao, { label: string; w: number; h: number; hint: string; maxKpis: number; maxVisuais: number }> = {
  padrao: { label: "Padrão 16:9", w: 1280, h: 720, hint: "1280×720", maxKpis: 4, maxVisuais: 6 },
  expandido: { label: "Expandido", w: 1500, h: 1000, hint: "1500×1000", maxKpis: 5, maxVisuais: 9 },
  longo: { label: "Longo / Scroll", w: 3200, h: 3000, hint: "3200×3000", maxKpis: 6, maxVisuais: 12 },
};

export const MAX_PAGINAS = 10;

export interface Filtros {
  quais: string;
  quantidade: number;
  estilo: FiltroEstilo;
}

export const VISUAL_LABELS: Record<VisualTipo, string> = {
  Linha: "Linhas / Área",
  Barra: "Barras",
  Colunas: "Colunas",
  Barra_Clusterizada: "Barra Clusterizada",
  Barra_Empilhada: "Barra Empilhada",
  Linha_Barra: "Linha com Barra",
  Rosca: "Rosca / Pizza",
  Tabela: "Tabela / Matriz",
  Dispersao: "Dispersão / Treemap",
  Mapa: "Mapa",
  Indicadores: "Indicadores",
  Custom_HTML: "Personalizado HTML / Deneb / D3",
  Outro: "Outro",
};

export const PRESET_SLOTS: Record<Exclude<GridPreset, "custom">, number> = { "2x2": 4, "1+2": 3, "2col": 2 };

const DEFAULT_TIPOS: VisualTipo[] = ["Linha", "Barra", "Rosca", "Tabela"];

let counter = 0;
export const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const novoVisual = (i: number): Visual => ({
  id: uid(),
  tipo: DEFAULT_TIPOS[i % DEFAULT_TIPOS.length] ?? "Linha",
  titulo: "",
  descricao: "",
  customHtml: "",
  outroTipo: "",
  alternancia: false,
});

export const novaPagina = (nome: string): Pagina => ({
  id: uid(),
  nome,
  posicaoCards: "topo",
  kpis: ["Faturamento Total", "Margem Líquida", "Ticket Médio", "Clientes Ativos"],
  gridPreset: "1+2",
  visuais: [0, 1, 2].map(novoVisual),
});

interface State {
  etapa: 1 | 2;
  contato: Contato;
  resolucao: Resolucao;
  aparencia: Aparencia;
  paginas: Pagina[];
  paginaAtiva: string;
  observacoes: string;
  menuPosicao: MenuPosicao;
  filtros: Filtros;
  applyTemplate: (id: TemplateId) => void;
  setMenuPosicao: (m: MenuPosicao) => void;
  setFiltros: (f: Partial<Filtros>) => void;
  setEtapa: (e: 1 | 2) => void;
  setContato: (p: Partial<Contato>) => void;
  setResolucao: (r: Resolucao) => void;
  setAparencia: (p: Partial<Aparencia>) => void;
  setObservacoes: (s: string) => void;
  addPagina: (nome: string) => void;
  removePagina: (id: string) => void;
  setPaginaAtiva: (id: string) => void;
  updatePagina: (id: string, p: Partial<Pagina>) => void;
  setQtdKpis: (id: string, n: number) => void;
  setKpi: (id: string, i: number, v: string) => void;
  setPreset: (id: string, preset: GridPreset) => void;
  addVisual: (id: string) => void;
  removeVisual: (id: string, vid: string) => void;
  updateVisual: (id: string, vid: string, p: Partial<Visual>) => void;
  reset: () => void;
}

const contatoInicial: Contato = { nome: "", email: "", empresa: "", telefone: "", fontes: [], volume: "", objetivo: "", outraFonte: "", arquivoExemplo: null };
const aparenciaInicial: Aparencia = {
  tema: "escuro",
  primaria: "#B4F04A",
  secundaria: "#38BDF8",
  fundo: "#0F141B",
  cantos: "medio",
  borda: true,
  logo: null,
};

const inicial = () => {
  const p = novaPagina("Visão Geral");
  return { etapa: 1 as const, contato: { ...contatoInicial, fontes: [] }, aparencia: { ...aparenciaInicial }, resolucao: "padrao" as Resolucao, paginas: [p], paginaAtiva: p.id, observacoes: "", menuPosicao: "topo" as MenuPosicao, filtros: { quais: "", quantidade: 0, estilo: "exibidos" as FiltroEstilo } };
};

const mapPagina = (paginas: Pagina[], id: string, fn: (p: Pagina) => Pagina) => paginas.map((p) => (p.id === id ? fn(p) : p));

export type TemplateId = "executivo" | "logistico" | "comercial" | "geografico" | "longo";
interface TemplatePagina {
  nome: string;
  kpis: string[];
  posicaoCards: Pagina["posicaoCards"];
  gridPreset: GridPreset;
  visuais: { tipo: VisualTipo; titulo: string }[];
}
interface BriefingTemplate {
  id: TemplateId;
  nome: string;
  resolucao: Resolucao;
  paginas: TemplatePagina[];
}

export const BRIEFING_TEMPLATES: BriefingTemplate[] = [
  { id: "executivo", nome: "Visão Executiva", resolucao: "padrao", paginas: [
    { nome: "Visão Executiva", kpis: ["Receita Total", "Margem Líquida", "Resultado Operacional", "Crescimento"], posicaoCards: "topo", gridPreset: "1+2", visuais: [
      { tipo: "Linha_Barra", titulo: "Receita e resultado por mês" }, { tipo: "Rosca", titulo: "Receita por unidade" }, { tipo: "Barra", titulo: "Realizado vs. meta" },
    ] },
  ] },
  { id: "logistico", nome: "Operacional Logístico", resolucao: "expandido", paginas: [
    { nome: "Operação Logística", kpis: ["Entregas no Prazo", "Custo por Entrega", "Pedidos em Aberto", "Tempo Médio", "Ocupação da Frota"], posicaoCards: "lateral", gridPreset: "2x2", visuais: [
      { tipo: "Barra_Empilhada", titulo: "Status das entregas por centro" }, { tipo: "Linha", titulo: "Prazo médio de entrega" }, { tipo: "Barra_Clusterizada", titulo: "Capacidade vs. demanda" }, { tipo: "Tabela", titulo: "Pedidos prioritários" },
    ] },
  ] },
  { id: "comercial", nome: "Comercial / Vendas", resolucao: "padrao", paginas: [
    { nome: "Vendas", kpis: ["Faturamento", "Conversão", "Ticket Médio", "Novos Clientes"], posicaoCards: "topo", gridPreset: "2x2", visuais: [
      { tipo: "Colunas", titulo: "Vendas por mês" }, { tipo: "Barra", titulo: "Ranking de vendedores" }, { tipo: "Rosca", titulo: "Participação por canal" }, { tipo: "Linha", titulo: "Evolução da conversão" },
    ] },
    { nome: "Produtos", kpis: ["Produtos Vendidos", "Margem por Produto"], posicaoCards: "topo", gridPreset: "2col", visuais: [
      { tipo: "Barra_Clusterizada", titulo: "Vendas vs. meta por categoria" }, { tipo: "Tabela", titulo: "Desempenho dos produtos" },
    ] },
  ] },
  { id: "geografico", nome: "Análise Geográfica", resolucao: "expandido", paginas: [
    { nome: "Análise Geográfica", kpis: ["Receita por Região", "Clientes Ativos", "Cobertura", "Crescimento Regional"], posicaoCards: "topo", gridPreset: "1+2", visuais: [
      { tipo: "Mapa", titulo: "Distribuição de clientes e receita" }, { tipo: "Barra", titulo: "Receita por estado" }, { tipo: "Dispersao", titulo: "Potencial vs. presença regional" },
    ] },
  ] },
  { id: "longo", nome: "Dashboard Longo", resolucao: "longo", paginas: [
    { nome: "Panorama Completo", kpis: ["Receita Total", "Margem", "Pedidos", "Clientes", "Ticket Médio", "Satisfação"], posicaoCards: "topo", gridPreset: "custom", visuais: [
      { tipo: "Linha_Barra", titulo: "Receita e margem mensal" }, { tipo: "Colunas", titulo: "Pedidos por mês" }, { tipo: "Rosca", titulo: "Receita por canal" },
      { tipo: "Mapa", titulo: "Cobertura geográfica" }, { tipo: "Barra_Clusterizada", titulo: "Realizado vs. orçamento" }, { tipo: "Barra_Empilhada", titulo: "Mix de produtos por região" },
      { tipo: "Linha", titulo: "Retenção de clientes" }, { tipo: "Dispersao", titulo: "Volume vs. rentabilidade" }, { tipo: "Indicadores", titulo: "Atingimento das metas" },
      { tipo: "Tabela", titulo: "Detalhamento por unidade" }, { tipo: "Barra", titulo: "Ranking de produtos" }, { tipo: "Colunas", titulo: "Satisfação por período" },
    ] },
  ] },
];

export const useBriefing = create<State>((set) => ({
  ...inicial(),
  applyTemplate: (id) => set(() => {
    const template = BRIEFING_TEMPLATES.find((t) => t.id === id);
    if (!template) return {};
    const paginas: Pagina[] = template.paginas.map((p) => ({
      ...p, id: uid(), kpis: [...p.kpis],
      visuais: p.visuais.map((v, i) => ({ ...novoVisual(i), ...v })),
    }));
    const first = paginas[0];
    if (!first) return {};
    return { resolucao: template.resolucao, paginas, paginaAtiva: first.id };
  }),
  setEtapa: (etapa) => set({ etapa }),
  setContato: (c) => set((s) => ({ contato: { ...s.contato, ...c } })),
  setMenuPosicao: (menuPosicao) => set({ menuPosicao }),
  setFiltros: (f) => set((s) => ({ filtros: { ...s.filtros, ...f } })),
  setResolucao: (resolucao) =>
    set((s) => {
      const lim = RESOLUCOES[resolucao];
      return {
        resolucao,
        paginas: s.paginas.map((p) => ({
          ...p,
          kpis: p.kpis.slice(0, lim.maxKpis),
          visuais: p.visuais.slice(0, lim.maxVisuais),
          posicaoCards: resolucao === "longo" ? "topo" : p.posicaoCards,
        })),
      };
    }),
  setAparencia: (a) => set((s) => ({ aparencia: { ...s.aparencia, ...a } })),
  setObservacoes: (observacoes) => set({ observacoes }),
  addPagina: (nome) =>
    set((s) => {
      if (s.paginas.length >= MAX_PAGINAS) return s;
      const p = novaPagina(nome);
      p.kpis = p.kpis.slice(0, RESOLUCOES[s.resolucao].maxKpis);
      return { paginas: [...s.paginas, p], paginaAtiva: p.id };
    }),
  removePagina: (id) =>
    set((s) => {
      if (s.paginas.length <= 1) return s;
      const paginas = s.paginas.filter((p) => p.id !== id);
      return { paginas, paginaAtiva: s.paginaAtiva === id ? (paginas[0]?.id ?? s.paginaAtiva) : s.paginaAtiva };
    }),
  setPaginaAtiva: (paginaAtiva) => set({ paginaAtiva }),
  updatePagina: (id, patch) => set((s) => ({ paginas: mapPagina(s.paginas, id, (p) => ({ ...p, ...patch })) })),
  setQtdKpis: (id, n) =>
    set((s) => ({
      paginas: mapPagina(s.paginas, id, (p) => {
        const qtd = Math.max(0, Math.min(RESOLUCOES[s.resolucao].maxKpis, n));
        const kpis = p.kpis.slice(0, qtd);
        while (kpis.length < qtd) kpis.push(`KPI ${kpis.length + 1}`);
        return { ...p, kpis };
      }),
    })),
  setKpi: (id, i, v) =>
    set((s) => ({ paginas: mapPagina(s.paginas, id, (p) => ({ ...p, kpis: p.kpis.map((k, j) => (j === i ? v : k)) })) })),
  setPreset: (id, preset) =>
    set((s) => ({
      paginas: mapPagina(s.paginas, id, (p) => {
        if (preset === "custom") return { ...p, gridPreset: preset };
        const n = PRESET_SLOTS[preset];
        const visuais = p.visuais.slice(0, n);
        while (visuais.length < n) visuais.push(novoVisual(visuais.length));
        return { ...p, gridPreset: preset, visuais };
      }),
    })),
  addVisual: (id) =>
    set((s) => ({
      paginas: mapPagina(s.paginas, id, (p) =>
        p.visuais.length >= RESOLUCOES[s.resolucao].maxVisuais ? p : { ...p, gridPreset: "custom", visuais: [...p.visuais, novoVisual(p.visuais.length)] },
      ),
    })),
  removeVisual: (id, vid) =>
    set((s) => ({
      paginas: mapPagina(s.paginas, id, (p) =>
        p.visuais.length <= 1 ? p : { ...p, gridPreset: "custom", visuais: p.visuais.filter((v) => v.id !== vid) },
      ),
    })),
  updateVisual: (id, vid, patch) =>
    set((s) => ({
      paginas: mapPagina(s.paginas, id, (p) => ({ ...p, visuais: p.visuais.map((v) => (v.id === vid ? { ...v, ...patch } : v)) })),
    })),
  reset: () => set(inicial()),
}));
