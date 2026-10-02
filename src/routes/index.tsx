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
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { fetch('/api/public/origem/access', { cache: 'no-store' }).then(r => setAuthorized(r.ok)).catch(() => setAuthorized(false)).finally(() => setLoading(false)); }, []);
  async function enter(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setAccessError('');
    try { const r = await fetch('/api/public/origem/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code.trim() }) }); if (!r.ok) throw Error(); setCode(''); setAuthorized(true); }
    catch { setAccessError('Código inválido ou acesso indisponível.'); } finally { setSubmitting(false); }
  }
  async function exit() { await fetch('/api/public/origem/access', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' }); setAuthorized(false); }
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
      {loading ? <div className="flex min-h-screen items-center justify-center">Carregando…</div> : authorized ? <><iframe
        title="Origem — Gestão de Cafés Especiais"
        src="/origem/painel"
        className="fixed inset-0 block h-full w-full border-0 bg-background"
      /><Button className="fixed bottom-4 right-4 z-40" variant="secondary" onClick={exit}>Sair</Button></> : <main className="flex min-h-screen items-center justify-center bg-background px-5"><form onSubmit={enter} className="w-full max-w-sm space-y-5"><h1 className="text-3xl font-bold text-primary">origem</h1><label className="block text-sm font-medium">Código de acesso<input value={code} onChange={e => setCode(e.target.value)} required autoComplete="off" className="mt-2 flex h-11 w-full border border-input bg-background px-3" placeholder="Cole seu código" /></label><Button disabled={submitting} className="w-full">Entrar</Button>{accessError && <p role="alert" className="text-sm text-destructive">{accessError}</p>}</form></main>}
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

