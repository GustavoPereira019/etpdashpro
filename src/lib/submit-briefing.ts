import { supabase } from "@/integrations/supabase/client";
import type { Aparencia, Contato, Filtros, MenuPosicao, Pagina, Resolucao } from "./briefing-store";

export interface BriefingPayload {
  contato: Contato;
  resolucao: Resolucao;
  aparencia: Aparencia;
  paginas: Pagina[];
  observacoes: string;
  menuPosicao: MenuPosicao;
  filtros: Filtros;
}

export function buildSpec(p: BriefingPayload) {
  const { logo, ...aparencia } = p.aparencia;
  return {
    versao: 1,
    gerado_em: new Date().toISOString(),
    solicitante: (({ arquivoExemplo, ...c }) => ({ ...c, arquivo_exemplo: arquivoExemplo?.name ?? null }))(p.contato),
    menu_posicao: p.menuPosicao,
    filtros: p.filtros,
    resolucao: p.resolucao,
    aparencia: { ...aparencia, possui_logo: !!logo },
    paginas: p.paginas.map((pg, i) => ({
      ordem: i,
      nome: pg.nome,
      posicao_cards: pg.posicaoCards,
      kpis: pg.kpis,
      grid: pg.gridPreset,
      visuais: pg.visuais.map((v) => ({ tipo: v.tipo, titulo: v.titulo, descricao: v.descricao, detalhes_custom: v.tipo === "Custom_HTML" ? v.customHtml : undefined, outro_tipo: v.tipo === "Outro" ? v.outroTipo : undefined, alternancia: v.alternancia, largura: v.w, altura: v.h })),
    })),
    observacoes: p.observacoes,
  };
}

/** Saves the request. Returns "cloud" when persisted, "local" when the backend was unreachable (mock fallback). */
export async function submitBriefing(p: BriefingPayload): Promise<"cloud" | "local"> {
  const id = crypto.randomUUID();
  const spec = buildSpec(p) as ReturnType<typeof buildSpec> & { arquivo_path?: string | null };
  try {
    const f = p.contato.arquivoExemplo;
    if (f) {
      const path = `${id}/${f.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: up } = await supabase.storage.from("exemplos").upload(path, f);
      spec.arquivo_path = up ? null : path;
    }
    const { error } = await supabase.from("solicitacoes_orcamento").insert({
      id,
      cliente_nome: p.contato.nome,
      cliente_email: p.contato.email,
      cliente_telefone: p.contato.telefone,
      empresa: p.contato.empresa,
      fonte_dados: p.contato.fontes.join(", "),
      volume_dados: p.contato.volume,
      objetivo: p.contato.objetivo,
      resolucao_painel: p.resolucao,
      tema: p.aparencia.tema,
      observacoes_tecnicas: p.observacoes,
      configuracao: spec as never,
    });
    if (error) throw error;

    const telas = p.paginas.map((pg, i) => ({
      id: crypto.randomUUID(),
      solicitacao_id: id,
      nome_tela: pg.nome,
      ordem: i,
      posicao_cards: pg.posicaoCards,
      qtd_cards: pg.kpis.length,
    }));
    const { error: e2 } = await supabase.from("solicitacao_telas").insert(telas);
    if (e2) throw e2;

    const elementos = p.paginas.flatMap((pg, i) => [
      ...pg.kpis.map((k, j) => ({ tela_id: telas[i]!.id, tipo_elemento: "KPI", posicao_index: j, titulo: k, descricao_informacoes: null, detalhes_custom_html: null })),
      ...pg.visuais.map((v, j) => ({
        tela_id: telas[i]!.id,
        tipo_elemento: v.tipo,
        posicao_index: j,
        titulo: v.titulo,
        descricao_informacoes: v.descricao,
        detalhes_custom_html: v.tipo === "Custom_HTML" ? v.customHtml : v.tipo === "Outro" ? v.outroTipo : null,
      })),
    ]);
    if (elementos.length) {
      const { error: e3 } = await supabase.from("solicitacao_elementos").insert(elementos);
      if (e3) throw e3;
    }
    return "cloud";
  } catch (err) {
    console.error("Falha ao enviar, salvando localmente", err);
    const list = JSON.parse(localStorage.getItem("briefings_offline") || "[]");
    list.push({ id, ...spec });
    localStorage.setItem("briefings_offline", JSON.stringify(list));
    return "local";
  }
}
