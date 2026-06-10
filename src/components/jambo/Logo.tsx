import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
};

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const dim = size === "sm" ? 28 : size === "lg" ? 56 : 40;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="relative grid place-items-center rounded-xl glow-primary animate-pulse-glow"
        style={{
          width: dim,
          height: dim,
          background:
            "linear-gradient(135deg, oklch(0.78 0.18 258), oklch(0.6 0.2 220))",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={dim * 0.55}
          height={dim * 0.55}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary-foreground"
        >
          <path d="M3 21V10l9-7 9 7v11" />
          <path d="M9 21v-7h6v7" />
          <circle cx="12" cy="8" r="1.2" fill="currentColor" />
        </svg>
        <span
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            boxShadow:
              "inset 0 1px 0 0 oklch(1 0 0 / 0.4), inset 0 -8px 16px 0 oklch(0 0 0 / 0.25)",
          }}
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              "font-display font-bold tracking-tight text-foreground",
              size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg",
            )}
          >
            Jambo<span className="text-gradient-primary"> ERP</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Hospitality Suite
          </span>
        </div>
      )}
    </div>
  );
}
