import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type InstallCtx = {
  canInstall: boolean;
  install: () => void;
};

const Ctx = createContext<InstallCtx>({ canInstall: false, install: () => {} });

export function InstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => {
    // Check if the event already fired and was stored globally
    return (window as any).__deferredPrompt ?? null;
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = () => {
    const prompt = deferredPrompt;
    if (!prompt) return;
    prompt.prompt();
    prompt.userChoice
      .then((result: { outcome: string }) => {
        if (result.outcome === "accepted") {
          console.log("App installed");
        }
        setDeferredPrompt(null);
      })
      .catch(() => setDeferredPrompt(null));
  };

  return (
    <Ctx.Provider value={{ canInstall: !!deferredPrompt, install }}>
      {children}
    </Ctx.Provider>
  );
}

export function useInstallPrompt() {
  return useContext(Ctx);
}
