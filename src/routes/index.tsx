import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { Logo } from "@/components/jambo/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Jambo ERP" },
      { name: "description", content: "Sign in to the Jambo ERP Hospitality Management Suite." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/dashboard" });
    }, 900);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden mesh-bg">
      {/* Animated floating orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-32 top-20 h-96 w-96 rounded-full opacity-60 blur-3xl animate-float-slow"
          style={{ background: "radial-gradient(circle, oklch(0.68 0.18 258 / 0.6), transparent 70%)" }}
        />
        <div
          className="absolute right-[-6rem] top-[40%] h-[28rem] w-[28rem] rounded-full opacity-50 blur-3xl animate-float-slower"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.16 162 / 0.55), transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full opacity-40 blur-3xl animate-float-slow"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.2 295 / 0.55), transparent 70%)" }}
        />
      </div>

      {/* Geometric particles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute block rounded-full bg-primary/40 animate-pulse-glow"
            style={{
              width: `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              top: `${(i * 53) % 100}%`,
              left: `${(i * 37) % 100}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="hidden flex-col justify-between p-12 lg:flex">
          <Logo size="md" />
          <div className="max-w-md">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
              Hospitality Platform · Uganda · East Africa
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
              Run your hotel like the{" "}
              <span className="text-gradient-primary animate-gradient">future</span> just checked in.
            </h1>
            <p className="mt-5 text-base text-muted-foreground">
              The all-in-one Property Management System trusted by forward-thinking
              hospitality teams across the region — reservations, front desk,
              housekeeping, and revenue in a single beautiful workspace.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { k: "120+", v: "Properties" },
                { k: "98.4%", v: "Uptime" },
                { k: "24/7", v: "Local support" },
              ].map((m) => (
                <div key={m.v} className="glass rounded-2xl p-4">
                  <div className="text-2xl font-bold text-gradient-primary">{m.k}</div>
                  <div className="text-xs text-muted-foreground">{m.v}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Jambo Sphere Ltd · Kampala, Uganda
          </p>
        </div>

        {/* Right login card */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <Logo size="md" />
            </div>

            <div className="glass-strong rounded-3xl p-8 sm:p-10">
              <div className="mb-8">
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign in to your Jambo workspace to continue.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <FloatingField
                  id="email"
                  type="email"
                  label="Work email"
                  icon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  required
                />
                <FloatingField
                  id="password"
                  type={showPwd ? "text" : "password"}
                  label="Password"
                  icon={<Lock className="h-4 w-4" />}
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                  required
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="text-muted-foreground transition hover:text-foreground"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />

                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    Remember me
                  </label>
                  <Link to="/" className="text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-xl py-6 text-sm font-semibold",
                    "bg-gradient-to-r from-[oklch(0.7_0.18_258)] via-[oklch(0.65_0.2_240)] to-[oklch(0.72_0.16_180)]",
                    "text-primary-foreground shadow-lg shadow-primary/30 transition-all",
                    "hover:shadow-xl hover:shadow-primary/40 hover:brightness-110",
                  )}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing you in…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Sign in
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-x-0 top-1/2 h-px bg-border/60" />
                  <div className="relative mx-auto w-fit bg-card/60 px-3 text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur">
                    or
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full rounded-xl border border-border/70 bg-card/30 py-3 text-sm font-medium text-foreground/90 backdrop-blur transition hover:border-primary/50 hover:bg-card/60"
                >
                  Continue with Single Sign-On
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Don't have an account?{" "}
              <a href="#" className="text-primary hover:underline">
                Request access
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingField(props: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  autoComplete?: string;
  required?: boolean;
}) {
  const { id, label, type, value, onChange, icon, trailing, autoComplete, required } = props;
  return (
    <div className="group relative">
      <div className="relative rounded-xl border border-border/70 bg-card/30 backdrop-blur transition-all focus-within:border-primary/70 focus-within:bg-card/50 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-primary">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          placeholder=" "
          className={cn(
            "peer block w-full bg-transparent px-11 pb-2.5 pt-6 text-sm text-foreground outline-none placeholder-transparent",
            trailing && "pr-11",
          )}
        />
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute left-11 top-4 text-sm text-muted-foreground transition-all",
            "peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-primary",
            "peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[11px]",
          )}
        >
          {label}
        </label>
        {trailing && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
      </div>
    </div>
  );
}
