import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

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
  const [mobilePlatform, setMobilePlatform] = useState<"android" | "ios" | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/i.test(userAgent)
      || (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    if (isStandalone || (!isIos && !isAndroid)) return;

    setMobilePlatform(isIos ? "ios" : "android");
    setShowInstall(true);

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    return () => window.removeEventListener("beforeinstallprompt", capturePrompt);
  }, []);

  async function installApp() {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setShowInstall(false);
    setInstallPrompt(null);
  }

  return (
    <>
      <iframe
        title="Origem — Gestão de Cafés Especiais"
        src="/origem/index.html"
        className="fixed inset-0 block h-full w-full border-0 bg-background"
      />
      {showInstall && mobilePlatform && (
        <section
          aria-labelledby="install-title"
          className="fixed inset-x-3 bottom-3 z-50 border border-border bg-card p-4 text-card-foreground shadow-xl"
        >
          <div className="flex items-start gap-3">
            <img src="/icons/origem-192.png" alt="" className="h-12 w-12 rounded-lg" />
            <div className="min-w-0 flex-1">
              <h2 id="install-title" className="text-base font-semibold">Instalar Origem</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Adicione o painel à tela inicial para abrir como aplicativo.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar aviso de instalação"
              onClick={() => setShowInstall(false)}
            >
              <span aria-hidden="true" className="text-xl leading-none">×</span>
            </Button>
          </div>

          {mobilePlatform === "ios" || showInstructions ? (
            <p className="mt-4 border-t border-border pt-3 text-sm leading-6">
              {mobilePlatform === "ios"
                ? "No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início."
                : "Abra o menu do navegador e toque em Instalar aplicativo ou Adicionar à tela inicial."}
            </p>
          ) : null}

          {mobilePlatform === "android" && (
            <Button type="button" className="mt-4 w-full" onClick={installApp}>
              {installPrompt ? "Instalar agora" : "Ver como instalar"}
            </Button>
          )}
        </section>
      )}
    </>
  );
}

