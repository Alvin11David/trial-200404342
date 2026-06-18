import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, ChevronDown } from "lucide-react";
import { Logo } from "@/components/jambo/Logo";
import { cn } from "@/lib/utils";
import { ROLES, useRole, type Role } from "@/lib/role";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Jambo ERP" },
      { name: "description", content: "Sign in to Jambo Enterprise Resource Planning." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { role, setRole } = useRole();
  const [email, setEmail] = useState("admin@jambo.com");
  const [password, setPassword] = useState("admin123");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (email === "admin@jambo.com" && password === "admin123") {
        navigate({ to: "/dashboard" });
      } else {
        setError("Invalid credentials. Try admin@jambo.com / admin123");
        setLoading(false);
      }
    }, 700);
  };

  return (
    <>
      <style>{`
        @keyframes iconFloat { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-3px) scale(1.08); } }
        @keyframes iconColorPulse { 0%,100% { opacity:0.7; } 50% { opacity:1; } }
        .icon-animate { animation: iconFloat 3s ease-in-out infinite, iconColorPulse 2s ease-in-out infinite; }
      `}</style>
    <div className="flex min-h-screen w-full">
      {/* ===== Left Panel — Brand / Hero ===== */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-slate-950 text-white lg:flex">
        {/* Inverted rounded rectangle notches — stay on top */}
        <div className="pointer-events-none absolute -top-4 left-1/4 z-30 h-12 w-56 rounded-2xl border border-white/20 bg-white shadow-lg" />
        <div className="pointer-events-none absolute -right-8 top-40 z-30 h-36 w-20 rounded-2xl border border-white/20 bg-white shadow-2xl" />
        <div className="pointer-events-none absolute -bottom-4 right-1/4 z-30 h-12 w-40 rounded-2xl border border-white/20 bg-white shadow-lg" />

        {/* Spline 3D scene — fills entire panel, crop letterboxing */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <iframe
            src="https://my.spline.design/windherocopycopy-tJP1FfQ2bWKX3AtcCM1DnVNv-Uiu/"
            className="absolute left-1/2 top-1/2 h-[125%] w-[125%] -translate-x-1/2 -translate-y-1/2"
            style={{ border: 'none', pointerEvents: 'none' }}
            allow="autoplay; fullscreen"
            loading="lazy"
            title="3D Hotel Scene"
          />
        </div>

        {/* Top: Logo + tagline — overlay on top of Spline */}
        <div className="relative z-10 px-12 pt-12">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Logo className="[&_span]:text-white [&_span]:text-white" />
            </div>
          </div>
        </div>

        {/* Center: Bold title — overlay on top of Spline */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold leading-snug tracking-tight text-white drop-shadow-xl">
              One powerful platform for all your hotel operations
            </h1>
          </div>
        </div>


      </div>

      {/* ===== Right Panel — Sign-in Form ===== */}
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 p-6 dark:from-background dark:to-muted/30 lg:w-[58%]">
        {/* Subtle background decoration */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 animate-pulse rounded-full bg-indigo-100/60 blur-3xl dark:bg-indigo-950/20" style={{ animationDelay: "3s" }} />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 animate-pulse rounded-full bg-violet-100/40 blur-3xl dark:bg-violet-950/20" style={{ animationDelay: "5s" }} />
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="md" />
          </div>

          <div className="relative">
            {/* Decorative top accent */}
            <div className="absolute -top-px left-8 right-8 h-[2px] rounded-full bg-gradient-to-r from-indigo-400 via-primary to-violet-400" />

            <div className="rounded-2xl border border-border bg-card px-8 pb-8 pt-10 shadow-lg shadow-black/[0.02]">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Welcome back! Enter your credentials.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <Field
                  id="email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  icon={<Mail className="h-5 w-5 icon-animate" style={{ animationDelay: "0.5s" }} />}
                  autoComplete="email"
                  required
                />
                <Field
                  id="password"
                  label="Password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  icon={<Lock className="h-5 w-5 icon-animate" style={{ animationDelay: "0.8s" }} />}
                  autoComplete="current-password"
                  required
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="text-muted-foreground transition hover:text-foreground"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />

                <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    Sign in as role
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">Demo</span>
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setOpen((o) => !o)}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    >
                      <span>{role}</span>
                      <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition duration-200", open && "rotate-180")} />
                    </button>
                    {open && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg">
                        {ROLES.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => { setRole(r); setOpen(false); }}
                            className={cn(
                              "flex w-full items-center px-3.5 py-2 text-sm transition-colors",
                              role === r ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-muted",
                            )}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground transition hover:text-foreground">
                    <input type="checkbox" className="h-5 w-5 rounded border-border accent-primary" defaultChecked />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="font-medium text-primary underline-offset-2 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive shadow-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Signing in…
                    </>
                  ) : (
                    <>
                      Sign in <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                {/* Demo environment info */}
                <div className="mt-5 rounded-xl border border-indigo-100/50 bg-indigo-50/30 px-4 py-3 text-xs dark:border-indigo-900/10 dark:bg-indigo-950/10">
                 
                  
                </div>
              </form>
            </div>
          </div>

          {/* Mobile footer */}
          <p className="mt-8 text-center text-[11px] text-muted-foreground lg:hidden">
            © {new Date().getFullYear()} Jambo Sphere Ltd · Kampala, Uganda
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

function Field(props: {
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
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div
        className={cn(
          "relative flex items-center rounded-xl border bg-background transition-all duration-200",
          focused
            ? "border-primary/60 ring-2 ring-primary/20 shadow-sm"
            : "border-border hover:border-muted-foreground/30",
        )}
      >
        {icon && (
          <span className={cn("pl-3.5 transition-all duration-200", focused ? "text-primary" : "text-muted-foreground")}>
            <span className={cn(focused && "icon-animate")}>{icon}</span>
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          required={required}
          className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground/50"
        />
        {trailing && <span className="pr-3.5">{trailing}</span>}
      </div>
    </div>
  );
}
