import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Origem — Gestão de Cafés Especiais" },
      { name: "description", content: "Estoque, torrefação, pedidos e financeiro de cafés especiais em um só lugar." },
      { property: "og:title", content: "Origem — Gestão de Cafés Especiais" },
      { property: "og:description", content: "Estoque, torrefação, pedidos e financeiro de cafés especiais em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      title="Origem — Gestão de Cafés Especiais"
      src="/origem/index.html"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0, display: "block", background: "#f6f7f3" }}
    />
  );
}

