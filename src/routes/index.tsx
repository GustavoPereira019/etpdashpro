import { createFileRoute } from "@tanstack/react-router";
import { StepContact } from "@/components/briefing/StepContact";
import { Configurator } from "@/components/briefing/Configurator";
import { useBriefing } from "@/lib/briefing-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Briefing de Dashboard · Monte seu layout de BI" },
      { name: "description", content: "Configure visualmente páginas, KPIs, gráficos e identidade do seu dashboard e solicite um orçamento personalizado." },
      { property: "og:title", content: "Briefing de Dashboard · Monte seu layout de BI" },
      { property: "og:description", content: "Monte o layout do seu dashboard e envie para análise comercial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const etapa = useBriefing((s) => s.etapa);
  return etapa === 1 ? <div className="bg-glow min-h-[calc(100vh-57px)]"><StepContact /></div> : <Configurator />;
}
