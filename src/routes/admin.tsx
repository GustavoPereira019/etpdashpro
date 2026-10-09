import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertTriangle, Code2, Database, LogOut, Mail, Phone, RefreshCw } from "lucide-react";
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
import { MOCK_SOLICITACOES, STATUS, type Solicitacao } from "@/lib/mock-solicitacoes";

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

const statusLabel = (s: string) => ({ "Em Analise": "Em análise", "Orcamento Enviado": "Orçamento enviado" })[s] ?? s;
const temCustom = (s: Solicitacao) => s.solicitacao_telas.some((t) => t.solicitacao_elementos.some((e) => e.tipo_elemento === "Custom_HTML"));

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  if (demo) return <Painel modo="demo" onSair={() => setDemo(false)} />;
  if (!session) return <Login onDemo={() => setDemo(true)} />;
  return <Painel modo="cloud" onSair={() => supabase.auth.signOut()} />;
}

function Login({ onDemo }: { onDemo: () => void }) {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } =
      modo === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (modo === "criar") toast.success("Conta criada. Confirme pelo link enviado ao seu e-mail.");
  };

  return (
    <div className="bg-glow flex min-h-[calc(100vh-57px)] items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-bold">Acesso administrativo</h1>
        <div className="space-y-2"><Label>E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-2"><Label>Senha</Label><Input type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
        <Button className="w-full" disabled={loading}>{modo === "entrar" ? "Entrar" : "Criar conta"}</Button>
        <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}>
          {modo === "entrar" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
        </button>
        <Button type="button" variant="outline" className="w-full" onClick={onDemo}>Ver demonstração com dados fictícios</Button>
      </form>
    </div>
  );
}

function Painel({ modo, onSair }: { modo: "cloud" | "demo"; onSair: () => void }) {
  const [rows, setRows] = useState<Solicitacao[]>(modo === "demo" ? MOCK_SOLICITACOES : []);
  const [loading, setLoading] = useState(modo === "cloud");
  const [semAcesso, setSemAcesso] = useState(false);
  const [sel, setSel] = useState<Solicitacao | null>(null);

  const carregar = useCallback(async () => {
    if (modo === "demo") return;
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user?.id ?? "");
    if (!roles?.some((r) => r.role === "admin")) {
      setSemAcesso(true);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("solicitacoes_orcamento")
      .select("*, solicitacao_telas(*, solicitacao_elementos(*))")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error("Erro ao carregar solicitações."); return; }
    setRows((data ?? []) as unknown as Solicitacao[]);
  }, [modo]);

  useEffect(() => { carregar(); }, [carregar]);

  const mudarStatus = async (id: string, status: string) => {
    if (modo === "cloud") {
      const { error } = await supabase.from("solicitacoes_orcamento").update({ status }).eq("id", id);
      if (error) { toast.error("Não foi possível atualizar."); return; }
    }
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    setSel((s) => (s && s.id === id ? { ...s, status } : s));
    toast.success(`Status: ${statusLabel(status)}`);
  };

  if (semAcesso)
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-xl font-bold">Sem permissão de administrador</h1>
        <p className="mt-2 text-sm text-muted-foreground">Esta conta não tem acesso ao painel.</p>
        <Button variant="outline" className="mt-6" onClick={onSair}><LogOut /> Sair</Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold">Solicitações</h1>
          <p className="text-sm text-muted-foreground">{modo === "demo" ? "Modo demonstração · dados fictícios" : `${rows.length} recebidas`}</p>
        </div>
        <div className="flex gap-2">
          {modo === "cloud" && <Button variant="outline" size="sm" onClick={carregar}><RefreshCw /> Atualizar</Button>}
          <Button variant="ghost" size="sm" onClick={onSair}><LogOut /> Sair</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-5 mb-6">
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
              <TableHead>Cliente</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="hidden md:table-cell">Fontes</TableHead>
              <TableHead className="hidden md:table-cell">Telas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>}
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nenhuma solicitação ainda.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => setSel(r)}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    {r.cliente_nome}
                    {temCustom(r) && <Code2 className="h-4 w-4 text-warning" aria-label="Visual personalizado" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.cliente_email}</div>
                </TableCell>
                <TableCell>{r.empresa}</TableCell>
                <TableCell className="hidden max-w-[200px] truncate md:table-cell">{r.fonte_dados}</TableCell>
                <TableCell className="hidden md:table-cell">{r.solicitacao_telas.length}</TableCell>
                <TableCell><StatusBadge s={r.status} /></TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle>{sel.empresa || sel.cliente_nome}</SheetTitle>
                <SheetDescription>Recebido em {new Date(sel.created_at).toLocaleString("pt-BR")}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-8">
                <Select value={sel.status} onValueChange={(v) => mudarStatus(sel.id, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS.map((st) => <SelectItem key={st} value={st}>{statusLabel(st)}</SelectItem>)}</SelectContent>
                </Select>

                {temCustom(sel) && (
                  <div className="flex gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 text-sm">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
                    <div><b className="text-warning">Gráfico personalizado (HTML/Deneb/D3) solicitado.</b><p className="text-muted-foreground">Agendar reunião técnica para refinar escopo.</p></div>
                  </div>
                )}

                <Bloco titulo="Contato">
                  <p className="font-medium">{sel.cliente_nome}</p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" />{sel.cliente_email}</p>
                  {sel.cliente_telefone && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{sel.cliente_telefone}</p>}
                </Bloco>

                <Bloco titulo="Infraestrutura">
                  <p className="flex items-center gap-2 text-sm"><Database className="h-3.5 w-3.5 text-primary" />{sel.fonte_dados || "—"}</p>
                  <p className="text-sm text-muted-foreground">Volume: {sel.volume_dados || "—"}</p>
                  <p className="text-sm text-muted-foreground">Resolução: {sel.resolucao_painel} · Tema: {sel.tema}</p>
                  {sel.objetivo && <p className="text-sm">{sel.objetivo}</p>}
                  {sel.observacoes_tecnicas && <p className="text-sm italic text-muted-foreground">“{sel.observacoes_tecnicas}”</p>}
                </Bloco>

                <Bloco titulo={`Telas (${sel.solicitacao_telas.length})`}>
                  <div className="space-y-3">
                    {[...sel.solicitacao_telas].sort((a, b) => a.ordem - b.ordem).map((t) => {
                      const kpis = t.solicitacao_elementos.filter((e) => e.tipo_elemento === "KPI");
                      const vis = t.solicitacao_elementos.filter((e) => e.tipo_elemento !== "KPI").sort((a, b) => a.posicao_index - b.posicao_index);
                      return (
                        <div key={t.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between"><b>{t.nome_tela}</b><span className="text-xs text-muted-foreground">{t.qtd_cards} KPIs · {t.posicao_cards}</span></div>
                          {kpis.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{kpis.map((k) => <Badge key={k.id} variant="secondary">{k.titulo}</Badge>)}</div>}
                          <ul className="mt-3 space-y-2">
                            {vis.map((v) => (
                              <li key={v.id} className="text-sm">
                                <span className={v.tipo_elemento === "Custom_HTML" ? "text-warning" : "text-primary"}>{VISUAL_LABELS[v.tipo_elemento as VisualTipo] ?? v.tipo_elemento}</span>
                                {" — "}{v.titulo || "Sem título"}
                                {v.descricao_informacoes && <p className="text-xs text-muted-foreground">{v.descricao_informacoes}</p>}
                                {v.detalhes_custom_html && <p className="mt-1 rounded bg-muted p-2 text-xs">{v.detalhes_custom_html}</p>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </Bloco>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <div className="space-y-1"><h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">{titulo}</h3>{children}</div>;
}

function StatusBadge({ s }: { s: string }) {
  const v = s === "Aprovado" ? "default" : s === "Recusado" ? "destructive" : s === "Pendente" ? "outline" : "secondary";
  return <Badge variant={v}>{statusLabel(s)}</Badge>;
}
