import { cn } from "@/lib/utils";
import jamboLogo from "../../../assets/images/Jambo-logo.webp";

type LogoProps = {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
};

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const dim = size === "sm" ? 24 : size === "lg" ? 48 : 34;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="relative grid place-items-center overflow-hidden bg-transparent"
        style={{
          width: dim,
          height: dim,
        }}
      >
        <img src={jamboLogo} alt="Jambo ERP Logo" className="h-full w-full rounded-lg object-contain" />
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
