import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertTriangle, Code2, Database, Download, LogOut, Mail, Phone, RefreshCw, Building2, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VISUAL_LABELS, type VisualTipo } from "@/lib/briefing-store";

const ADMIN_EMAIL = "gustavopereiraaxcursos@gmail.com";
const STATUS = ["Pendente", "Em Analise", "Orcamento Enviado", "Aprovado", "Recusado"] as const;

interface Elemento { id: string; tipo_elemento: string; posicao_index: number; titulo: string | null; descricao_informacoes: string | null; detalhes_custom_html: string | null }
interface Tela { id: string; nome_tela: string; ordem: number; posicao_cards: string; qtd_cards: number; solicitacao_elementos: Elemento[] }
interface FiltroItemSpec { nome: string; exibido: boolean }
interface VisualSpec { tipo: string; titulo: string; descricao: string; alternancia?: boolean; override?: { fundo: string; primaria: string } | null; largura?: number; altura?: number }
interface Config {
  menu_posicao?: string;
  filtros?: { estilo?: string; itens?: FiltroItemSpec[]; quais?: string; quantidade?: number; estilo_legacy?: string };
  solicitante?: { arquivo_exemplo?: string | null; nome?: string; email?: string; empresa?: string; telefone?: string; fontes?: string[]; volume?: string; objetivo?: string; outra_fonte?: string };
  arquivo_path?: string | null;
  resolucao?: string;
  aparencia?: { tema?: string; primaria?: string; secundaria?: string; fundo?: string; cantos?: string; borda?: boolean; possui_logo?: boolean };
  paginas?: { nome?: string; posicao_cards?: string; kpis?: string[]; grid?: string; visuais?: VisualSpec[] }[];
}
interface Solicitacao {
  id: string; cliente_nome: string; cliente_email: string; cliente_telefone: string | null; empresa: string | null;
  fonte_dados: string | null; volume_dados: string | null; objetivo: string | null; resolucao_painel: string; tema: string;
  status: string; observacoes_tecnicas: string | null; created_at: string; configuracao: Config | null; solicitacao_telas: Tela[];
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel de Solicitações · Admin" },
      { name: "description", content: "Gerencie solicitações de orçamento de dashboards." },
      { property: "og:title", content: "Painel de Solicitações · Admin" },
      { property: "og:description", content: "Gerencie solicitações de orçamento de dashboards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const statusLabel = (s: string) => ({ "Em Analise": "Em análise", "Orcado Enviado": "Orçamento enviado", "Orcamento Enviado": "Orçamento enviado" })[s] ?? s;
const visuais = (s: Solicitacao) => s.solicitacao_telas.flatMap((t) => t.solicitacao_elementos.filter((e) => e.tipo_elemento !== "KPI"));

const CUSTOM_TYPES = ["Custom_HTML", "Outro"];

function temCustom(s: Solicitacao) {
  const vs = visuais(s);
  if (vs.some((e) => CUSTOM_TYPES.includes(e.tipo_elemento))) return true;
  const cfgVs = s.configuracao?.paginas?.flatMap((p) => p.visuais ?? []) ?? [];
  return cfgVs.some((v) => CUSTOM_TYPES.includes(v.tipo));
}

function temAlternancia(s: Solicitacao) {
  const cfgVs = s.configuracao?.paginas?.flatMap((p) => p.visuais ?? []) ?? [];
  return cfgVs.some((v) => v.alternancia);
}

/** Sugestão algorítmica de preço. */
function sugerirPreco(s: Solicitacao) {
  const vs = visuais(s);
  const nCustom = vs.filter((e) => CUSTOM_TYPES.includes(e.tipo_elemento)).length;
  const nSimples = vs.length - nCustom;
  return 500 + 100 * s.solicitacao_telas.length + 50 * nSimples + 200 * nCustom + (temAlternancia(s) ? 100 : 0);
}

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const menuLabel = (m?: string) => m === "lateral_direita" ? "Lateral direita" : m === "oculto" ? "Oculto (Hambúrguer)" : m === "topo" ? "Topo" : "—";

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  if (!session) return <Login />;
  if (session.user.email?.toLowerCase() !== ADMIN_EMAIL) return <SemPermissao />;
  return <Painel />;
}

function SemPermissao() {
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-xl font-bold">Sem permissão de administrador</h1>
      <p className="mt-2 text-sm text-muted-foreground">Esta conta não tem acesso ao painel administrativo.</p>
      <Button variant="outline" className="mt-6" onClick={() => supabase.auth.signOut()}><LogOut /> Sair</Button>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) toast.error("E-mail ou senha inválidos.");
  };

  return (
    <div className="bg-glow flex min-h-[calc(100vh-57px)] items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-bold">Acesso administrativo</h1>
        <div className="space-y-2"><Label>E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-2"><Label>Senha</Label><Input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
        <Button className="w-full" disabled={loading}>Entrar</Button>
      </form>
    </div>
  );
}

function Painel() {
  const [rows, setRows] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Solicitacao | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("solicitacoes_orcamento")
      .select("*, solicitacao_telas(*, solicitacao_elementos(*))")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error("Erro ao carregar solicitações."); return; }
    setRows((data ?? []) as unknown as Solicitacao[]);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const mudarStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("solicitacoes_orcamento").update({ status }).eq("id", id);
    if (error) { toast.error("Não foi possível atualizar."); return; }
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    setSel((s) => (s && s.id === id ? { ...s, status } : s));
    toast.success(`Status: ${statusLabel(status)}`);
  };

  const baixar = async (path: string) => {
    const { data, error } = await supabase.storage.from("exemplos").createSignedUrl(path, 300, { download: true });
    if (error || !data) { toast.error("Arquivo indisponível."); return; }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0"><h1 className="truncate text-3xl font-bold">Solicitações</h1><p className="text-sm text-muted-foreground">{rows.length} recebidas</p></div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={carregar}><RefreshCw /> Atualizar</Button><Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}><LogOut /> Sair</Button></div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-5">
        {STATUS.map((st) => (
          <div key={st} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{statusLabel(st)}</div>
            <div className="font-display text-2xl font-bold">{rows.filter((r) => r.status === st).length}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead><TableHead>Empresa</TableHead>
              <TableHead className="hidden md:table-cell">Telas</TableHead>
              <TableHead className="hidden md:table-cell">Sugestão</TableHead>
              <TableHead>Status</TableHead><TableHead className="hidden sm:table-cell">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nenhuma solicitação ainda.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => setSel(r)}>
                <TableCell><div className="flex items-center gap-2 font-medium">{r.cliente_nome}{temCustom(r) && <Code2 className="h-4 w-4 text-warning" />}</div><div className="text-xs text-muted-foreground">{r.cliente_email}</div></TableCell>
                <TableCell>{r.empresa}</TableCell>
                <TableCell className="hidden md:table-cell">{r.solicitacao_telas.length}</TableCell>
                <TableCell className="hidden font-medium text-success md:table-cell">{brl(sugerirPreco(r))}</TableCell>
                <TableCell><StatusBadge s={r.status} /></TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {sel && <Detalhe s={sel} onStatus={mudarStatus} onBaixar={baixar} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Detalhe({ s, onStatus, onBaixar }: { s: Solicitacao; onStatus: (id: string, v: string) => void; onBaixar: (p: string) => void }) {
  const cfg = s.configuracao ?? {};
  const f = cfg.filtros ?? {};
  const vs = visuais(s);
  const nCustom = vs.filter((e) => CUSTOM_TYPES.includes(e.tipo_elemento)).length;
  const nSimples = vs.length - nCustom;
  const whats = (s.cliente_telefone ?? "").replace(/\D/g, "");

  const filtroEstiloLabel = f.estilo ? ({ exibidos: "Exibidos", ocultos: "Ocultos", mistos: "Mistos" } as Record<string, string>)[f.estilo] ?? f.estilo : "—";
  const filtroItens = f.itens ?? [];
  const cfgPaginas = cfg.paginas ?? [];

  return (
    <>
      <SheetHeader>
        <SheetTitle>{s.empresa || s.cliente_nome}</SheetTitle>
        <SheetDescription>Recebido em {new Date(s.created_at).toLocaleString("pt-BR")}</SheetDescription>
      </SheetHeader>
      <div className="space-y-6 px-4 pb-8">
        {/* Price suggestion */}
        <div className="rounded-xl border border-success/50 bg-success/10 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-success"><Sparkles className="h-3.5 w-3.5" /> Sugestão algorítmica</div>
          <div className="mt-1 font-display text-3xl font-bold text-success">Sugestão de Preço Base: {brl(sugerirPreco(s))}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Base R$ 500 + {s.solicitacao_telas.length} página(s) × R$ 100 + {nSimples} gráfico(s) × R$ 50{nCustom > 0 ? ` + ${nCustom} personalizado(s) × R$ 200` : ""}{temAlternancia(s) ? " + R$ 100 (alternância)" : ""}.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Cálculo algorítmico interno. Envie o orçamento oficial ao cliente diretamente.</p>
        </div>

        <Select value={s.status} onValueChange={(v) => onStatus(s.id, v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{STATUS.map((st) => <SelectItem key={st} value={st}>{statusLabel(st)}</SelectItem>)}</SelectContent>
        </Select>

        {temCustom(s) && (
          <div className="flex gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
            <div><b className="text-warning">Gráfico personalizado ou "Outro" solicitado.</b><p className="text-muted-foreground">Agendar reunião técnica para refinar escopo.</p></div>
          </div>
        )}

        {/* Lead / contact */}
        <Bloco titulo="Dados de Contato">
          <p className="font-medium">{s.cliente_nome}</p>
          {s.empresa && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{s.empresa}</p>}
          <a href={`mailto:${s.cliente_email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Mail className="h-3.5 w-3.5" />{s.cliente_email}</a>
          {whats && <a href={`https://wa.me/55${whats}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Phone className="h-3.5 w-3.5" />{s.cliente_telefone} (WhatsApp)</a>}
        </Bloco>

        {/* Arquivo de exemplo */}
        <Bloco titulo="Arquivo de Exemplo">
          {cfg.arquivo_path ? (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-primary" />{cfg.solicitante?.arquivo_exemplo ?? "arquivo anexado"}</p>
              <p className="text-xs text-muted-foreground">Arquivo enviado e anexado à solicitação.</p>
              <Button variant="outline" size="sm" onClick={() => onBaixar(cfg.arquivo_path!)}><Download /> Baixar arquivo</Button>
            </div>
          ) : <p className="text-sm text-muted-foreground">{cfg.solicitante?.arquivo_exemplo ? `${cfg.solicitante.arquivo_exemplo} (não foi possível enviar o arquivo)` : "Nenhum arquivo enviado."}</p>}
        </Bloco>

        {/* Infraestrutura */}
        <Bloco titulo="Infraestrutura e Dados">
          <p className="flex items-center gap-2 text-sm"><Database className="h-3.5 w-3.5 text-primary" />{s.fonte_dados || "—"}</p>
          <p className="text-sm text-muted-foreground">Volume: {s.volume_dados || "—"}</p>
          {s.objetivo && <p className="whitespace-pre-wrap text-sm">{s.objetivo}</p>}
        </Bloco>

        {/* Configurações UX */}
        <Bloco titulo="Configurações de UX">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <Item k="Resolução" v={s.resolucao_painel} />
            <Item k="Tema" v={s.tema} />
            <Item k="Menu de páginas" v={menuLabel(cfg.menu_posicao)} />
            <Item k="Estilo de filtros" v={filtroEstiloLabel} />
            <Item k="Qtd. filtros" v={String(filtroItens.length)} />
            <Item k="Alternância de gráficos" v={temAlternancia(s) ? "Sim" : "Não"} />
          </dl>
          {filtroItens.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-muted-foreground">Filtros configurados:</p>
              <div className="flex flex-wrap gap-1">
                {filtroItens.map((fi, i) => (
                  <Badge key={i} variant={fi.exibido ? "default" : "secondary"}>{fi.nome} {fi.exibido ? "(exibido)" : "(oculto)"}</Badge>
                ))}
              </div>
            </div>
          )}
        </Bloco>

        {/* Aparência */}
        {cfg.aparencia && (
          <Bloco titulo="Identidade Visual">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Item k="Cor primária" v={cfg.aparencia.primaria ?? "—"} />
              <Item k="Cor secundária" v={cfg.aparencia.secundaria ?? "—"} />
              <Item k="Cor de fundo" v={cfg.aparencia.fundo ?? "—"} />
              <Item k="Cantos" v={cfg.aparencia.cantos ?? "—"} />
              <Item k="Borda nos cards" v={cfg.aparencia.borda ? "Sim" : "Não"} />
              <Item k="Logotipo" v={cfg.aparencia.possui_logo ? "Sim" : "Não"} />
            </dl>
          </Bloco>
        )}

        {/* Páginas detalhadas */}
        <Bloco titulo={`Páginas (${s.solicitacao_telas.length})`}>
          <div className="space-y-3">
            {[...s.solicitacao_telas].sort((a, b) => a.ordem - b.ordem).map((t, i) => {
              const kpis = t.solicitacao_elementos.filter((e) => e.tipo_elemento === "KPI").sort((a, b) => a.posicao_index - b.posicao_index);
              const vis = t.solicitacao_elementos.filter((e) => e.tipo_elemento !== "KPI").sort((a, b) => a.posicao_index - b.posicao_index);
              const cfgPag = cfgPaginas[i];
              return (
                <div key={t.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2"><b>{i + 1}. {t.nome_tela}</b><span className="text-xs text-muted-foreground">{t.qtd_cards} KPIs · {vis.length} gráficos · {t.posicao_cards}</span></div>
                  {kpis.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{kpis.map((k) => <Badge key={k.id} variant="secondary">{k.titulo}</Badge>)}</div>}
                  <ol className="mt-3 space-y-3">
                    {vis.map((v, j) => {
                      const cfgV = cfgPag?.visuais?.[j];
                      const isCustom = v.tipo_elemento === "Custom_HTML" || v.tipo_elemento === "Outro";
                      return (
                        <li key={v.id} className="border-l-2 border-border pl-3 text-sm">
                          <span className={isCustom ? "text-warning" : "text-primary"}>{j + 1}. {VISUAL_LABELS[v.tipo_elemento as VisualTipo] ?? v.tipo_elemento}</span>
                          {" — "}<b>{v.titulo || "Sem título"}</b>
                          {cfgV?.largura != null && <span className="ml-2 text-xs text-muted-foreground">({cfgV.largura}×{cfgV.altura} cols)</span>}
                          <p className="whitespace-pre-wrap text-xs text-muted-foreground">{v.descricao_informacoes || "Sem descrição."}</p>
                          {v.detalhes_custom_html && <p className="mt-1 whitespace-pre-wrap rounded bg-muted p-2 text-xs">{v.detalhes_custom_html}</p>}
                          {cfgV?.alternancia && <p className="mt-1 text-xs text-primary">Botões de alternância solicitados.</p>}
                          {cfgV?.override && <p className="mt-1 text-xs text-muted-foreground">Estilo sobrescrito: fundo {cfgV.override.fundo}, primária {cfgV.override.primaria}</p>}
                          {isCustom && <p className="mt-1 text-xs text-warning">Tipo personalizado — requer reunião técnica.</p>}
                        </li>
                      );
                    })}
                    {vis.length === 0 && <li className="text-xs text-muted-foreground">Nenhum gráfico.</li>}
                  </ol>
                </div>
              );
            })}
          </div>
        </Bloco>

        {/* Observação técnica */}
        <Bloco titulo="Observação Técnica">
          <p className="whitespace-pre-wrap text-sm">{s.observacoes_tecnicas || "—"}</p>
        </Bloco>
      </div>
    </>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return <div className="rounded-md bg-muted/50 p-2"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>;
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <div className="space-y-1"><h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">{titulo}</h3>{children}</div>;
}

function StatusBadge({ s }: { s: string }) {
  const v = s === "Aprovado" ? "default" : s === "Recusado" ? "destructive" : s === "Pendente" ? "outline" : "secondary";
  return <Badge variant={v}>{statusLabel(s)}</Badge>;
}
