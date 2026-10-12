export interface Elemento {
  id: string;
  tipo_elemento: string;
  posicao_index: number;
  titulo: string | null;
  descricao_informacoes: string | null;
  detalhes_custom_html: string | null;
}
export interface Tela {
  id: string;
  nome_tela: string;
  ordem: number;
  posicao_cards: string;
  qtd_cards: number;
  solicitacao_elementos: Elemento[];
}
export interface Solicitacao {
  id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string | null;
  empresa: string | null;
  fonte_dados: string | null;
  volume_dados: string | null;
  objetivo: string | null;
  resolucao_painel: string;
  tema: string;
  status: string;
  observacoes_tecnicas: string | null;
  created_at: string;
  solicitacao_telas: Tela[];
}

export const STATUS = ["Pendente", "Em Analise", "Orcamento Enviado", "Aprovado", "Recusado"] as const;

const el = (id: string, tipo: string, i: number, titulo: string, desc = "", custom: string | null = null): Elemento => ({
  id, tipo_elemento: tipo, posicao_index: i, titulo, descricao_informacoes: desc, detalhes_custom_html: custom,
});

export const MOCK_SOLICITACOES: Solicitacao[] = [
  {
    id: "mock-1", cliente_nome: "Mariana Souza", cliente_email: "mariana@varejoplus.com", cliente_telefone: "(11) 98888-1234",
    empresa: "Varejo Plus", fonte_dados: "SQL Server, Excel", volume_dados: "1 – 10 milhões", objetivo: "Vendas por loja e margem por categoria.",
    resolucao_painel: "padrao", tema: "escuro", status: "Pendente", observacoes_tecnicas: "Atualização diária às 6h.", created_at: "2026-10-08T14:20:00Z",
    solicitacao_telas: [
      { id: "t1", nome_tela: "Visão Geral", ordem: 0, posicao_cards: "topo", qtd_cards: 4, solicitacao_elementos: [
        el("e1", "KPI", 0, "Faturamento"), el("e2", "KPI", 1, "Margem"), el("e3", "Linha", 0, "Vendas por mês", "Mês, valor, meta"),
        el("e4", "Custom_HTML", 1, "Mapa de calor de lojas", "", "Mapa do Brasil com bolhas por loja e tooltip com top 3 produtos."),
      ] },
    ],
  },
  {
    id: "mock-2", cliente_nome: "Rafael Lima", cliente_email: "rafael@logix.io", cliente_telefone: null,
    empresa: "Logix", fonte_dados: "API REST, PostgreSQL", volume_dados: "Mais de 10 milhões", objetivo: "Monitorar SLA de entregas.",
    resolucao_painel: "longo", tema: "claro", status: "Em Analise", observacoes_tecnicas: null, created_at: "2026-10-05T09:02:00Z",
    solicitacao_telas: [
      { id: "t2", nome_tela: "Operação", ordem: 0, posicao_cards: "lateral", qtd_cards: 3, solicitacao_elementos: [
        el("e5", "KPI", 0, "Entregas no prazo"), el("e6", "Barra", 0, "Atrasos por transportadora"), el("e7", "Tabela", 1, "Detalhe de pedidos"),
      ] },
      { id: "t3", nome_tela: "Financeiro", ordem: 1, posicao_cards: "topo", qtd_cards: 2, solicitacao_elementos: [el("e8", "Rosca", 0, "Custo por modal")] },
    ],
  },
];
