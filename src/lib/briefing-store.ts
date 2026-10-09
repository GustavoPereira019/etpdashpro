import { create } from "zustand";

export type Resolucao = "padrao" | "expandido" | "scroll";
export type VisualTipo = "Linha" | "Barra" | "Rosca" | "Tabela" | "Dispersao" | "Custom_HTML";
export type GridPreset = "2x2" | "1+2" | "2col" | "custom";
export type CantoEstilo = "reto" | "medio" | "arredondado";

export interface Visual {
  id: string;
  tipo: VisualTipo;
  titulo: string;
  descricao: string;
  customHtml: string;
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

export const RESOLUCOES: Record<Resolucao, { label: string; w: number; h: number; hint: string }> = {
  padrao: { label: "Padrão 16:9", w: 1280, h: 720, hint: "1280×720" },
  expandido: { label: "Expandido", w: 1366, h: 900, hint: "1366×900" },
  scroll: { label: "Longo / Scroll", w: 1280, h: 1800, hint: "1280×1800+" },
};

export const VISUAL_LABELS: Record<VisualTipo, string> = {
  Linha: "Linhas / Área",
  Barra: "Barras / Colunas",
  Rosca: "Rosca / Pizza",
  Tabela: "Tabela / Matriz",
  Dispersao: "Dispersão / Treemap",
  Custom_HTML: "Personalizado HTML / Deneb / D3",
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

const contatoInicial: Contato = { nome: "", email: "", empresa: "", telefone: "", fontes: [], volume: "", objetivo: "" };
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
  return { etapa: 1 as const, contato: contatoInicial, resolucao: "padrao" as Resolucao, aparencia: aparenciaInicial, paginas: [p], paginaAtiva: p.id, observacoes: "" };
};

const mapPagina = (paginas: Pagina[], id: string, fn: (p: Pagina) => Pagina) => paginas.map((p) => (p.id === id ? fn(p) : p));

export const useBriefing = create<State>((set) => ({
  ...inicial(),
  setEtapa: (etapa) => set({ etapa }),
  setContato: (c) => set((s) => ({ contato: { ...s.contato, ...c } })),
  setResolucao: (resolucao) => set({ resolucao }),
  setAparencia: (a) => set((s) => ({ aparencia: { ...s.aparencia, ...a } })),
  setObservacoes: (observacoes) => set({ observacoes }),
  addPagina: (nome) =>
    set((s) => {
      const p = novaPagina(nome);
      return { paginas: [...s.paginas, p], paginaAtiva: p.id };
    }),
  removePagina: (id) =>
    set((s) => {
      if (s.paginas.length <= 1) return s;
      const paginas = s.paginas.filter((p) => p.id !== id);
      return { paginas, paginaAtiva: s.paginaAtiva === id ? paginas[0]!.id : s.paginaAtiva };
    }),
  setPaginaAtiva: (paginaAtiva) => set({ paginaAtiva }),
  updatePagina: (id, patch) => set((s) => ({ paginas: mapPagina(s.paginas, id, (p) => ({ ...p, ...patch })) })),
  setQtdKpis: (id, n) =>
    set((s) => ({
      paginas: mapPagina(s.paginas, id, (p) => {
        const qtd = Math.max(0, Math.min(5, n));
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
        p.visuais.length >= 8 ? p : { ...p, gridPreset: "custom", visuais: [...p.visuais, novoVisual(p.visuais.length)] },
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
