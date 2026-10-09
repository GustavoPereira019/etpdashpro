import { ArrowRight, Database } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBriefing } from "@/lib/briefing-store";
import { cn } from "@/lib/utils";

const FONTES = ["CSV", "Excel", "SQL Server", "PostgreSQL", "MySQL", "API REST", "Google Sheets", "SharePoint", "ERP / CRM", "Outro"];
const VOLUMES = ["Até 100 mil linhas", "100 mil – 1 milhão", "1 – 10 milhões", "Mais de 10 milhões", "Não sei informar"];

export function StepContact() {
  const { contato, setContato, setEtapa } = useBriefing();
  const [erro, setErro] = useState("");

  const toggleFonte = (f: string) =>
    setContato({ fontes: contato.fontes.includes(f) ? contato.fontes.filter((x) => x !== f) : [...contato.fontes, f] });

  const avancar = () => {
    if (!contato.nome.trim() || !/^\S+@\S+\.\S+$/.test(contato.email) || !contato.empresa.trim()) {
      setErro("Preencha nome, e-mail válido e empresa.");
      return;
    }
    if (contato.fontes.length === 0) {
      setErro("Selecione ao menos uma fonte de dados.");
      return;
    }
    setErro("");
    setEtapa(2);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Etapa 1 de 2
        </span>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          Desenhe seu dashboard.<br />
          <span className="text-primary">Nós cuidamos do resto.</span>
        </h1>
        <p className="max-w-md text-muted-foreground">
          Conte sobre seu contexto e dados. Na próxima etapa você monta o layout visualmente — páginas, KPIs, gráficos e identidade — e envia para nossa análise técnica.
        </p>
        <ul className="space-y-3 text-sm text-muted-foreground">
          {["Sem compromisso: você recebe uma proposta personalizada", "Exporte o layout em PNG ou especificação JSON", "Visuais sob medida alinhados em reunião técnica"].map((t) => (
            <li key={t} className="flex gap-3"><span className="mt-2 h-1 w-4 shrink-0 bg-primary" />{t}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome *"><Input value={contato.nome} onChange={(e) => setContato({ nome: e.target.value })} placeholder="Seu nome" /></Field>
          <Field label="E-mail *"><Input type="email" value={contato.email} onChange={(e) => setContato({ email: e.target.value })} placeholder="voce@empresa.com" /></Field>
          <Field label="Empresa *"><Input value={contato.empresa} onChange={(e) => setContato({ empresa: e.target.value })} placeholder="Nome da empresa" /></Field>
          <Field label="WhatsApp"><Input value={contato.telefone} onChange={(e) => setContato({ telefone: e.target.value })} placeholder="(11) 99999-9999" /></Field>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Fontes de dados *</Label>
          <div className="flex flex-wrap gap-2">
            {FONTES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFonte(f)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  contato.fontes.includes(f) ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Volume médio estimado</Label>
          <div className="flex flex-wrap gap-2">
            {VOLUMES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setContato({ volume: v })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  contato.volume === v ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <Field label="Objetivo do dashboard">
          <Textarea rows={3} value={contato.objetivo} onChange={(e) => setContato({ objetivo: e.target.value })} placeholder="Ex.: acompanhar vendas por região e margem por produto, para a diretoria comercial." />
        </Field>

        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <Button size="lg" className="w-full shadow-glow" onClick={avancar}>
          Montar layout <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
