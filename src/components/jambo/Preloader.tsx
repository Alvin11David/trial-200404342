import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const STORAGE_KEY = "jambo-preloader-seen";

export function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "fading">("loading");

  useEffect(() => {
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (seen) {
      onDone();
      return;
    }

    const duration = 1800;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        sessionStorage.setItem(STORAGE_KEY, "1");
        setPhase("fading");
        setTimeout(onDone, 500);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  if (phase === "fading" && progress >= 100) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background animate-out fade-out duration-500 fill-mode-forwards">
        <Inner preloader progress={progress} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      <Inner preloader progress={progress} />
    </div>
  );
}

function Inner({ preloader: _p, progress: _pr }: { preloader: boolean; progress: number }) {
  return (
    <div className="flex flex-col items-center gap-8">
      <Logo size="lg" />

      <div className="w-64 space-y-3">
        <div className="relative h-2 overflow-hidden rounded-full bg-border/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-200 ease-out"
            style={{ width: `${_pr}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Loading workspace</span>
          <span className="font-bold tabular-nums text-gradient-primary">
            {_pr}%
          </span>
        </div>
      </div>

      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "1s" }}
          />
        ))}
      </div>
    </div>
  );
}
