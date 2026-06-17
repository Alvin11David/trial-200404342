import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, ChevronDown } from "lucide-react";
import { Logo } from "@/components/jambo/Logo";
import { cn } from "@/lib/utils";
import { ROLES, useRole, type Role } from "@/lib/role";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Jambo PMS" },
      { name: "description", content: "Sign in to Jambo Property Management System." },
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
    <div className="flex min-h-screen w-full">
      {/* ===== Left Panel — Brand / Hero ===== */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-12 text-white lg:flex">
        {/* Inverted rounded rectangle notch at top-right */}
        <div className="pointer-events-none absolute -right-6 top-24 z-20 h-28 w-14 rounded-l-2xl border-r-0 border-white/20 bg-white shadow-2xl" />

        {/* Animated gradient overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 animate-pulse rounded-full bg-violet-500/20 blur-3xl" style={{ animationDelay: "2s" }} />
          <div className="absolute left-1/2 top-1/3 h-64 w-64 animate-pulse rounded-full bg-blue-500/15 blur-3xl" style={{ animationDelay: "4s" }} />
        </div>

        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top: Logo + tagline */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Logo className="[&_span]:text-white [&_span]:text-white" />
          </div>
          {/*<span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium tracking-wider text-white/60">
            Phase 1 · MVP
          </span>*/}
        </div>

        {/* Middle: Cartoon animations */}
        <div className="relative z-10 flex flex-1 items-center justify-center -mt-16">
          <HotelCartoon />
        </div>

        {/* Bottom: Brand stat */}
        <div className="relative z-10 flex items-center gap-8 text-xs text-indigo-200/40">
          <span>© {new Date().getFullYear()} Jambo Sphere Ltd</span>
          <span className="h-3 w-px bg-white/10" />
          <span>Kampala, Uganda</span>
          <span className="h-3 w-px bg-white/10" />
          <span>v1.0.0</span>
        </div>
      </div>

      {/* ===== Right Panel — Sign-in Form ===== */}
      <div className="flex w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6 dark:from-background dark:to-muted/30 lg:w-[58%]">
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
                <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
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
                  icon={<Mail className="h-4 w-4" />}
                  autoComplete="email"
                  required
                />
                <Field
                  id="password"
                  label="Password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  icon={<Lock className="h-4 w-4" />}
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

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    Sign in as role
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">Demo</span>
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setOpen((o) => !o)}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    >
                      <span>{role}</span>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition duration-200", open && "rotate-180")} />
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
                    <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" defaultChecked />
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                    </>
                  ) : (
                    <>
                      Sign in <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
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
  );
}

/* ─── Hotel & POS cartoon animation ─────────────────────────────── */
function HotelCartoon() {
  return (
    <div className="relative w-full max-w-lg">
      <style>{`
        @keyframes drift { 0%,100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-6px) translateX(4px); }
          50% { transform: translateY(-2px) translateX(-2px); }
          75% { transform: translateY(-8px) translateX(3px); } }
        @keyframes floatCoin { 0%,100% { transform: translateY(0) rotate(0); opacity:1; }
          50% { transform: translateY(-20px) rotate(180deg); opacity:0.4; } }
        @keyframes slideIn { 0% { transform: translateX(-60px); opacity:0; }
          60% { transform: translateX(6px); opacity:1; }
          100% { transform: translateX(0); opacity:1; } }
        @keyframes blink { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(0.15); } }
        @keyframes receiptPrint { 0% { transform: scaleY(0); opacity:0; }
          60% { transform: scaleY(1); opacity:1; }
          100% { transform: scaleY(1); opacity:1; } }
        @keyframes walk { 0%,100% { transform: translateX(0); }
          50% { transform: translateX(12px); } }
        @keyframes glowPulse { 0%,100% { opacity:0.3; } 50% { opacity:0.9; } }
        @keyframes popIn { 0% { transform: scale(0); opacity:0; }
          70% { transform: scale(1.15); opacity:1; }
          100% { transform: scale(1); opacity:1; } }
        .anim-drift { animation: drift 4s ease-in-out infinite; }
        .anim-floatCoin { animation: floatCoin 2.5s ease-in-out infinite; }
        .anim-slideIn { animation: slideIn 0.8s ease-out forwards; }
        .anim-blink { animation: blink 3s ease-in-out infinite; }
        .anim-receipt { animation: receiptPrint 1.2s ease-out forwards; transform-origin: top center; }
        .anim-walk { animation: walk 3s ease-in-out infinite; }
        .anim-glowPulse { animation: glowPulse 2s ease-in-out infinite; }
        .anim-popIn { animation: popIn 0.6s ease-out forwards; }
      `}</style>

      {/* Scene container */}
      <svg viewBox="0 0 460 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full drop-shadow-xl">
        {/* === Hotel Building === */}
        <rect x="50" y="60" width="160" height="200" rx="8" fill="#1e293b" />
        <rect x="56" y="66" width="148" height="188" rx="6" fill="#334155" />

        {/* Hotel roof */}
        <rect x="40" y="52" width="180" height="12" rx="4" fill="#475569" />
        <rect x="110" y="40" width="40" height="14" rx="3" fill="#475569" />

        {/* Hotel windows row 1 */}
        {[70, 100, 130, 160].map((x, i) => (
          <g key={`w1-${i}`}>
            <rect x={x} y="80" width="20" height="24" rx="3" fill="#0f172a" />
            <rect x={x + 2} y="82" width="16" height="20" rx="2" fill="#fbbf24" opacity={i % 2 === 0 ? 0.6 : 0.3}>
              <animate attributeName="opacity" values={i % 2 === 0 ? "0.6;0.3;0.6" : "0.3;0.6;0.3"} dur={i % 2 === 0 ? "3s" : "4s"} repeatCount="indefinite" />
            </rect>
          </g>
        ))}

        {/* Hotel windows row 2 */}
        {[70, 100, 130, 160].map((x, i) => (
          <g key={`w2-${i}`}>
            <rect x={x} y="120" width="20" height="24" rx="3" fill="#0f172a" />
            <rect x={x + 2} y="122" width="16" height="20" rx="2" fill="#fbbf24" opacity={0.5}>
              <animate attributeName="opacity" values="0.5;0.2;0.5" dur={i % 3 === 0 ? "5s" : "3.5s"} repeatCount="indefinite" />
            </rect>
          </g>
        ))}

        {/* Hotel entrance */}
        <rect x="100" y="190" width="50" height="64" rx="6" fill="#0f172a" />
        <rect x="106" y="196" width="38" height="52" rx="4" fill="#1e293b" />
        <ellipse cx="134" cy="222" rx="1.5" ry="1.5" fill="#fbbf24" className="anim-glowPulse" />

        {/* Hotel name */}
        <text x="130" y="168" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="sans-serif" fontWeight="600" letterSpacing="1">JAMBO</text>
        <text x="130" y="178" textAnchor="middle" fill="#64748b" fontSize="5" fontFamily="sans-serif">HOTEL</text>

        {/* === Front Desk Area === */}
        <rect x="240" y="130" width="80" height="55" rx="6" fill="#1e293b" />
        <rect x="244" y="134" width="72" height="47" rx="4" fill="#2d3a52" />
        <text x="280" y="156" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="sans-serif" fontWeight="600">FRONT DESK</text>

        {/* Desk counter */}
        <rect x="235" y="160" width="90" height="6" rx="3" fill="#475569" />

        {/* Person at front desk */}
        <g className="anim-slideIn" style={{ animationDelay: "0.5s" }}>
          <ellipse cx="264" cy="148" rx="7" ry="7" fill="#fbbf24" />
          <rect x="258" y="154" width="12" height="16" rx="4" fill="#3b82f6" />
          {/* Blinking eye */}
          <rect x="261" y="146" width="2" height="2" rx="1" fill="#1e293b" className="anim-blink" style={{ animationDelay: "2s" }} />
          <rect x="265" y="146" width="2" height="2" rx="1" fill="#1e293b" className="anim-blink" style={{ animationDelay: "2.3s" }} />
        </g>

        {/* Guest walking in */}
        <g className="anim-walk" style={{ animationDelay: "1s" }}>
          <ellipse cx="310" cy="148" rx="7" ry="7" fill="#fbbf24" />
          <rect x="304" y="154" width="12" height="16" rx="4" fill="#10b981" />
          <rect x="307" y="146" width="2" height="2" rx="1" fill="#1e293b" />
          <rect x="311" y="146" width="2" height="2" rx="1" fill="#1e293b" />
          {/* Suitcase */}
          <rect x="318" y="156" width="8" height="10" rx="2" fill="#f59e0b" />
          <rect x="320" y="153" width="4" height="4" rx="1" fill="#f59e0b" />
        </g>

        {/* === POS Counter === */}
        <rect x="350" y="150" width="70" height="50" rx="6" fill="#1e293b" />
        <rect x="354" y="154" width="62" height="42" rx="4" fill="#2d3a52" />
        <text x="385" y="176" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="sans-serif" fontWeight="600">POS</text>

        {/* POS Terminal screen */}
        <rect x="360" y="142" width="18" height="14" rx="3" fill="#0ea5e9" className="anim-glowPulse" style={{ animationDelay: "1s" }}>
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
        </rect>

        {/* Cashier */}
        <g>
          <ellipse cx="380" cy="142" rx="6" ry="6" fill="#fbbf24" />
          <rect x="375" y="148" width="10" height="14" rx="4" fill="#a855f7" />
          <rect x="378" y="140" width="2" height="2" rx="1" fill="#1e293b" className="anim-blink" style={{ animationDelay: "1.5s" }} />
          <rect x="382" y="140" width="2" height="2" rx="1" fill="#1e293b" className="anim-blink" style={{ animationDelay: "1.8s" }} />
        </g>

        {/* Floating coin animation */}
        <g className="anim-floatCoin" style={{ animationDelay: "0.8s" }}>
          <circle cx="410" cy="170" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
          <text x="410" y="174" textAnchor="middle" fill="#d97706" fontSize="8" fontFamily="sans-serif" fontWeight="bold">$</text>
        </g>

        {/* Receipt printing from POS */}
        <g className="anim-receipt" style={{ animationDelay: "1.5s" }}>
          <rect x="392" y="178" width="14" height="20" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
          {[1, 2, 3].map((i) => (
            <line key={i} x1="395" y1={182 + i * 5} x2="403" y2={182 + i * 5} stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
          ))}
        </g>

        {/* Floating stars / sparkles */}
        {[
          { cx: 180, cy: 30, r: 2, delay: "0s" },
          { cx: 340, cy: 50, r: 2.5, delay: "1s" },
          { cx: 280, cy: 25, r: 1.8, delay: "2s" },
          { cx: 400, cy: 35, r: 2, delay: "0.5s" },
          { cx: 70, cy: 25, r: 1.5, delay: "1.5s" },
        ].map(({ cx, cy, r, delay }) => (
          <g key={`star-${cx}`} className="anim-drift" style={{ animationDelay: delay }}>
            <circle cx={cx} cy={cy} r={r} fill="#fbbf24" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur={`${1.5 + Math.random()}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}

        {/* === Bottom footer label === */}
        <text x="230" y="295" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="sans-serif" letterSpacing="1.5">
          PMS  ·  POS  ·  BILLING  ·  HOUSEKEEPING
        </text>
        <line x1="100" y1="302" x2="360" y2="302" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
      </svg>

      {/* Caption row */}
      <div className="mt-3 flex justify-center gap-8 text-[11px] text-indigo-200/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 anim-glowPulse" style={{ animationDelay: "0.5s" }} />
          Check-in / Check-out
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 anim-glowPulse" style={{ animationDelay: "1.5s" }} />
          POS Payments
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-400 anim-glowPulse" style={{ animationDelay: "2.5s" }} />
          Real-time Folio
        </span>
      </div>
    </div>
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
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
          <span className={cn("pl-3.5 transition-colors duration-200", focused ? "text-primary" : "text-muted-foreground")}>
            {icon}
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
         