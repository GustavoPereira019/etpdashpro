import { create } from "zustand";

export type Resolucao = "padrao" | "medio" | "grande";
export type MenuPosicao = "topo" | "lateral_direita" | "oculto";
export type FiltroEstilo = "exibidos" | "ocultos" | "mistos";
export type VisualTipo =
  | "Linha" | "Barra" | "Colunas" | "Barra_Clusterizada" | "Barra_Empilhada" | "Linha_Barra"
  | "Rosca" | "Tabela" | "Dispersao" | "Mapa" | "Indicadores" | "Custom_HTML" | "Outro";
export type GridPreset = "2x2" | "1+2" | "2col" | "custom";
export type CantoEstilo = "reto" | "medio" | "arredondado";

export interface VisualOverride {
  enabled: boolean;
  fundo: string;
  primaria: string;
}

export interface Visual {
  id: string;
  tipo: VisualTipo;
  titulo: string;
  descricao: string;
  customHtml: string;
  outroTipo: string;
  alternancia: boolean;
  w: number;
  h: number;
  override: VisualOverride;
  customBgColor?: string;
  customPrimaryColor?: string;
}

export const DEFAULT_VISUAL_W = 4;
export const DEFAULT_VISUAL_H = 2;
export const MIN_VISUAL_W = 1;
export const MAX_VISUAL_W = 12;
export const MIN_VISUAL_H = 1;
export const MAX_VISUAL_H = 6;

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
  padrao: { label: "Padrão", w: 1280, h: 720, hint: "1280×720", maxKpis: 4, maxVisuais: 6 },
  medio: { label: "Médio", w: 1480, h: 920, hint: "1480×920", maxKpis: 5, maxVisuais: 9 },
  grande: { label: "Grande", w: 1280, h: 1280, hint: "1280×1280", maxKpis: 6, maxVisuais: 12 },
};

export const MAX_PAGINAS = 10;

export interface FiltroItem {
  id: string;
  nome: string;
  exibido: boolean;
}

export interface Filtros {
  estilo: FiltroEstilo;
  itens: FiltroItem[];
}

export const FILTRO_LIMITES: Record<FiltroEstilo, { max: number; maxExibidos: number }> = {
  exibidos: { max: 4, maxExibidos: 4 },
  ocultos: { max: 10, maxExibidos: 0 },
  mistos: { max: 10, maxExibidos: 2 },
};

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
  w: DEFAULT_VISUAL_W,
  h: DEFAULT_VISUAL_H,
  override: { enabled: false, fundo: "", primaria: "" },
  customBgColor: undefined,
  customPrimaryColor: undefined,
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
  setFiltroEstilo: (e: FiltroEstilo) => void;
  addFiltro: (nome: string) => void;
  removeFiltro: (id: string) => void;
  updateFiltro: (id: string, patch: Partial<FiltroItem>) => void;
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
  resizeVisual: (paginaId: string, visualId: string, w: number, h: number) => void;
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

const filtrosIniciais = (): Filtros => ({
  estilo: "exibidos",
  itens: [
    { id: uid(), nome: "Período", exibido: true },
    { id: uid(), nome: "Região", exibido: true },
  ],
});

const inicial = () => {
  const p = novaPagina("Visão Geral");
  return { etapa: 1 as const, contato: { ...contatoInicial, fontes: [] }, aparencia: { ...aparenciaInicial }, resolucao: "padrao" as Resolucao, paginas: [p], paginaAtiva: p.id, observacoes: "", menuPosicao: "topo" as MenuPosicao, filtros: filtrosIniciais() };
};

const mapPagina = (paginas: Pagina[], id: string, fn: (p: Pagina) => Pagina) => paginas.map((p) => (p.id === id ? fn(p) : p));

export type TemplateId = "executivo" | "logistico" | "comercial" | "geografico" | "longo";
interface TemplatePagina {
  nome: string;
  kpis: string[];
  posicaoCards: Pagina["posicaoCards"];
  gridPreset: GridPreset;
  visuais: { tipo: VisualTipo; titulo: string; w?: number; h?: number }[];
}
interface BriefingTemplate {
  id: TemplateId;
  nome: string;
  resolucao: Resolucao;
  menuPosicao: MenuPosicao;
  filtros: { estilo: FiltroEstilo; nomes: { nome: string; exibido: boolean }[] };
  paginas: TemplatePagina[];
}

export const BRIEFING_TEMPLATES: BriefingTemplate[] = [
  { id: "executivo", nome: "Visão Executiva", resolucao: "padrao", menuPosicao: "topo", filtros: { estilo: "exibidos", nomes: [{ nome: "Período", exibido: true }, { nome: "Região", exibido: true }] }, paginas: [
    { nome: "Visão Executiva", kpis: ["Receita Total", "Margem Líquida", "Resultado Operacional", "Crescimento"], posicaoCards: "topo", gridPreset: "1+2", visuais: [
      { tipo: "Linha_Barra", titulo: "Receita e resultado por mês", w: 6, h: 2 }, { tipo: "Rosca", titulo: "Receita por unidade", w: 6, h: 2 }, { tipo: "Barra", titulo: "Realizado vs. meta", w: 12, h: 2 },
    ] },
  ] },
  { id: "logistico", nome: "Operacional Logístico", resolucao: "medio", menuPosicao: "lateral_direita", filtros: { estilo: "mistos", nomes: [{ nome: "Período", exibido: true }, { nome: "Centro de Distribuição", exibido: true }, { nome: "Transportadora", exibido: false }, { nome: "Status", exibido: false }, { nome: "Rota", exibido: false }] }, paginas: [
    { nome: "Operação Logística", kpis: ["Entregas no Prazo", "Custo por Entrega", "Pedidos em Aberto", "Tempo Médio", "Ocupação da Frota"], posicaoCards: "lateral", gridPreset: "2x2", visuais: [
      { tipo: "Barra_Empilhada", titulo: "Status das entregas por centro", w: 6, h: 2 }, { tipo: "Linha", titulo: "Prazo médio de entrega", w: 6, h: 2 }, { tipo: "Barra_Clusterizada", titulo: "Capacidade vs. demanda", w: 6, h: 2 }, { tipo: "Tabela", titulo: "Pedidos prioritários", w: 6, h: 2 },
    ] },
  ] },
  { id: "comercial", nome: "Comercial / Vendas", resolucao: "padrao", menuPosicao: "topo", filtros: { estilo: "exibidos", nomes: [{ nome: "Período", exibido: true }, { nome: "Região", exibido: true }, { nome: "Vendedor", exibido: true }] }, paginas: [
    { nome: "Vendas", kpis: ["Faturamento", "Conversão", "Ticket Médio", "Novos Clientes"], posicaoCards: "topo", gridPreset: "2x2", visuais: [
      { tipo: "Colunas", titulo: "Vendas por mês", w: 6, h: 2 }, { tipo: "Barra", titulo: "Ranking de vendedores", w: 6, h: 2 }, { tipo: "Rosca", titulo: "Participação por canal", w: 6, h: 2 }, { tipo: "Linha", titulo: "Evolução da conversão", w: 6, h: 2 },
    ] },
    { nome: "Produtos", kpis: ["Produtos Vendidos", "Margem por Produto"], posicaoCards: "topo", gridPreset: "2col", visuais: [
      { tipo: "Barra_Clusterizada", titulo: "Vendas vs. meta por categoria", w: 6, h: 2 }, { tipo: "Tabela", titulo: "Desempenho dos produtos", w: 6, h: 2 },
    ] },
  ] },
  { id: "geografico", nome: "Análise Geográfica", resolucao: "medio", menuPosicao: "lateral_direita", filtros: { estilo: "mistos", nomes: [{ nome: "Período", exibido: true }, { nome: "Região", exibido: true }, { nome: "Estado", exibido: false }, { nome: "Cidade", exibido: false }] }, paginas: [
    { nome: "Análise Geográfica", kpis: ["Receita por Região", "Clientes Ativos", "Cobertura", "Crescimento Regional"], posicaoCards: "topo", gridPreset: "1+2", visuais: [
      { tipo: "Mapa", titulo: "Distribuição de clientes e receita", w: 6, h: 3 }, { tipo: "Barra", titulo: "Receita por estado", w: 6, h: 2 }, { tipo: "Dispersao", titulo: "Potencial vs. presença regional", w: 6, h: 2 },
    ] },
  ] },
  { id: "longo", nome: "Dashboard Longo", resolucao: "grande", menuPosicao: "oculto", filtros: { estilo: "ocultos", nomes: [{ nome: "Período", exibido: false }, { nome: "Região", exibido: false }, { nome: "Canal", exibido: false }, { nome: "Categoria", exibido: false }, { nome: "Vendedor", exibido: false }] }, paginas: [
    { nome: "Panorama Completo", kpis: ["Receita Total", "Margem", "Pedidos", "Clientes", "Ticket Médio", "Satisfação"], posicaoCards: "topo", gridPreset: "custom", visuais: [
      { tipo: "Linha_Barra", titulo: "Receita e margem mensal", w: 6, h: 2 }, { tipo: "Colunas", titulo: "Pedidos por mês", w: 6, h: 2 }, { tipo: "Rosca", titulo: "Receita por canal", w: 4, h: 2 },
      { tipo: "Mapa", titulo: "Cobertura geográfica", w: 4, h: 2 }, { tipo: "Barra_Clusterizada", titulo: "Realizado vs. orçamento", w: 4, h: 2 }, { tipo: "Barra_Empilhada", titulo: "Mix de produtos por região", w: 6, h: 2 },
      { tipo: "Linha", titulo: "Retenção de clientes", w: 6, h: 2 }, { tipo: "Dispersao", titulo: "Volume vs. rentabilidade", w: 4, h: 2 }, { tipo: "Indicadores", titulo: "Atingimento das metas", w: 4, h: 2 },
      { tipo: "Tabela", titulo: "Detalhamento por unidade", w: 4, h: 2 }, { tipo: "Barra", titulo: "Ranking de produtos", w: 6, h: 2 }, { tipo: "Colunas", titulo: "Satisfação por período", w: 6, h: 2 },
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
      visuais: p.visuais.map((v, i) => ({ ...novoVisual(i), ...v, override: { enabled: false, fundo: "", primaria: "" }, customBgColor: undefined, customPrimaryColor: undefined })),
    }));
    const first = paginas[0];
    if (!first) return {};
    const filtros: Filtros = {
      estilo: template.filtros.estilo,
      itens: template.filtros.nomes.map((n) => ({ id: uid(), nome: n.nome, exibido: n.exibido })),
    };
    return { resolucao: template.resolucao, menuPosicao: template.menuPosicao, filtros, paginas, paginaAtiva: first.id };
  }),
  setEtapa: (etapa) => set({ etapa }),
  setContato: (c) => set((s) => ({ contato: { ...s.contato, ...c } })),
  setMenuPosicao: (menuPosicao) => set({ menuPosicao }),
  setFiltros: (f) => set((s) => ({ filtros: { ...s.filtros, ...f } })),
  setFiltroEstilo: (estilo) =>
    set((s) => {
      const lim = FILTRO_LIMITES[estilo];
      let itens = s.filtros.itens.slice(0, lim.max);
      if (estilo === "ocultos") itens = itens.map((i) => ({ ...i, exibido: false }));
      if (estilo === "exibidos") itens = itens.map((i) => ({ ...i, exibido: true }));
      if (estilo === "mistos") {
        const exibidos = itens.filter((i) => i.exibido);
        if (exibidos.length > lim.maxExibidos) itens = itens.map((i, idx) => ({ ...i, exibido: idx < lim.maxExibidos }));
      }
      return { filtros: { estilo, itens } };
    }),
  addFiltro: (nome) =>
    set((s) => {
      const lim = FILTRO_LIMITES[s.filtros.estilo];
      if (s.filtros.itens.length >= lim.max) return s;
      const exibido = s.filtros.estilo === "ocultos" ? false : s.filtros.estilo === "exibidos" ? true : s.filtros.itens.filter((i) => i.exibido).length < lim.maxExibidos;
      return { filtros: { ...s.filtros, itens: [...s.filtros.itens, { id: uid(), nome, exibido }] } };
    }),
  removeFiltro: (id) =>
    set((s) => ({ filtros: { ...s.filtros, itens: s.filtros.itens.filter((i) => i.id !== id) } })),
  updateFiltro: (id, patch) =>
    set((s) => ({
      filtros: {
        ...s.filtros,
        itens: s.filtros.itens.map((i) => {
          if (i.id !== id) return i;
          if (patch.exibido !== undefined && s.filtros.estilo === "mistos") {
            const exibidosCount = s.filtros.itens.filter((x) => x.exibido && x.id !== id).length;
            if (patch.exibido && exibidosCount >= FILTRO_LIMITES.mistos.maxExibidos) return i;
          }
          return { ...i, ...patch };
        }),
      },
    })),
  setResolucao: (resolucao) =>
    set((s) => {
      const lim = RESOLUCOES[resolucao];
      return {
        resolucao,
        paginas: s.paginas.map((p) => ({
          ...p,
          kpis: p.kpis.slice(0, lim.maxKpis),
          visuais: p.visuais.slice(0, lim.maxVisuais),
          posicaoCards: resolucao === "grande" ? "topo" : p.posicaoCards,
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
  resizeVisual: (paginaId, visualId, w, h) =>
    set((s) => ({
      paginas: mapPagina(s.paginas, paginaId, (p) => ({
        ...p,
        visuais: p.visuais.map((v) =>
          v.id === visualId
            ? { ...v, w: Math.max(MIN_VISUAL_W, Math.min(MAX_VISUAL_W, w)), h: Math.max(MIN_VISUAL_H, Math.min(MAX_VISUAL_H, h)) }
            : v,
        ),
      })),
    })),
  reset: () => set(inicial()),
}));
