import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, WifiOff } from "lucide-react";
import { Logo } from "@/components/jambo/Logo";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/role";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useStore, hashPassword, getUserRoleNames } from "@/lib/pms-store";

const SESSION_KEY = "jambo-auth";
const LOCKOUT_STORE_KEY = "jambo-login-attempts";

type AttemptRecord = { attempts: number; lockedUntil: number | null };

function loadAttempts(): Record<string, AttemptRecord> {
  try {
    const raw = localStorage.getItem(LOCKOUT_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAttempts(records: Record<string, AttemptRecord>) {
  try {
    localStorage.setItem(LOCKOUT_STORE_KEY, JSON.stringify(records));
  } catch {
    /* ignore */
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setRole } = useRole();
  const { online } = useOnlineStatus();
  const storeUsers = useStore((s) => s.users);
  const lockoutSettings = useStore((s) => s.lockoutSettings);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);

  /* Preconnect to Spline CDN for faster iframe load */
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = "https://my.spline.design";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem(SESSION_KEY);
    if (cached) {
      try {
        const session = JSON.parse(cached);
        if (session.authenticated && session.role) {
          setRole(session.role);
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch {}
    }
  }, [navigate, setRole]);

  useEffect(() => {
    if (!lockoutSettings.enabled) {
      setLockoutEnd(null);
      return;
    }
    const checkLockout = () => {
      const records = loadAttempts();
      const rec = records[email];
      if (rec?.lockedUntil && Date.now() < rec.lockedUntil) {
        setLockoutEnd(rec.lockedUntil);
      } else {
        setLockoutEnd(null);
      }
    };
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [email, lockoutSettings.enabled]);

  const authenticate = (credential: string, password: string): { ok: true; fullName: string; role: string } | { ok: false; error: string } => {
    const val = credential.toLowerCase().trim();
    const user = storeUsers.find(
      (u) => u.isActive && (u.email.toLowerCase() === val || u.employeeId?.toLowerCase() === val),
    );
    if (!user) return { ok: false, error: "Invalid credentials." };
    const hashed = hashPassword(password);
    if (user.passwordHash && user.passwordHash !== hashed) return { ok: false, error: "Invalid credentials." };
    const roles = getUserRoleNames(user.id);
    if (roles.length === 0) return { ok: false, error: "No role assigned. Contact System Administrator." };
    return { ok: true, fullName: user.fullName, role: roles[0] };
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (lockoutEnd && Date.now() < lockoutEnd) {
      const remainingMin = Math.ceil((lockoutEnd - Date.now()) / 60000);
      setError(`Account locked. Try again in ${remainingMin} minute${remainingMin !== 1 ? "s" : ""}.`);
      return;
    }

    const result = authenticate(email, password);
    if (result.ok) {
      const records = loadAttempts();
      delete records[email];
      saveAttempts(records);
      setLockoutEnd(null);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ authenticated: true, email, fullName: result.fullName, role: result.role }));
      setRole(result.role as any);
      navigate("/dashboard", { replace: true });
    } else {
      if (lockoutSettings.enabled) {
        const records = loadAttempts();
        const rec = records[email] || { attempts: 0, lockedUntil: null };
        rec.attempts += 1;
        if (rec.attempts >= lockoutSettings.maxAttempts) {
          rec.lockedUntil = Date.now() + lockoutSettings.lockoutMinutes * 60 * 1000;
          setLockoutEnd(rec.lockedUntil);
          setError(`Too many failed attempts. Account locked for ${lockoutSettings.lockoutMinutes} minute${lockoutSettings.lockoutMinutes !== 1 ? "s" : ""}.`);
        } else {
          const remaining = lockoutSettings.maxAttempts - rec.attempts;
          setError(`Invalid credentials. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining before lockout.`);
        }
        records[email] = rec;
        saveAttempts(records);
      } else {
        setError(result.error);
      }
    }
  };

  const lockoutMessage = lockoutSettings.enabled && lockoutEnd && Date.now() < lockoutEnd ? (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive shadow-sm">
      Account locked until {new Date(lockoutEnd).toLocaleTimeString()}.
    </div>
  ) : null;

  return (
    <>
      <style>{`
        @keyframes iconFloat { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-3px) scale(1.08); } }
        @keyframes iconColorPulse { 0%,100% { opacity:0.7; } 50% { opacity:1; } }
        .icon-animate { animation: iconFloat 3s ease-in-out infinite, iconColorPulse 2s ease-in-out infinite; }
      `}</style>
    <div className="flex min-h-screen w-full">
      {/* ===== Left Panel — Brand / Hero ===== */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-indigo-950/70" />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-slate-900/20 transition-opacity duration-700",
            !splineLoaded ? "opacity-100" : "opacity-0",
          )}
        />
        <iframe
          src="https://my.spline.design/windherocopycopy-tJP1FfQ2bWKX3AtcCM1DnVNv-Uiu/"
          onLoad={() => setSplineLoaded(true)}
          className={cn(
            "absolute left-1/2 top-1/2 h-[125%] w-[125%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700",
            splineLoaded ? "opacity-100" : "opacity-0",
          )}
          style={{ border: 'none', pointerEvents: 'none', background: 'transparent' }}
          allow="autoplay; fullscreen"
          title="3D Hotel Scene"
        />
        <div className="pointer-events-none absolute -top-4 left-1/4 z-30 h-12 w-56 rounded-2xl border border-white/20 bg-white shadow-lg" />
        <div className="pointer-events-none absolute -right-8 top-40 z-30 h-36 w-20 rounded-2xl border border-white/20 bg-white shadow-2xl" />
        <div className="pointer-events-none absolute -bottom-4 right-1/4 z-30 h-12 w-40 rounded-2xl border border-white/20 bg-white shadow-lg" />

        <div className="relative z-10 px-12 pt-12">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Logo className="[&_span]:text-white [&_span]:text-white" />
            </div>
          </div>
        </div>

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
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 animate-pulse rounded-full bg-indigo-100/60 blur-3xl dark:bg-indigo-950/20" style={{ animationDelay: "3s" }} />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 animate-pulse rounded-full bg-violet-100/40 blur-3xl dark:bg-violet-950/20" style={{ animationDelay: "5s" }} />
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="md" />
          </div>

          <div className="relative">
            <div className="absolute -top-px left-8 right-8 h-[2px] rounded-full bg-gradient-to-r from-indigo-400 via-primary to-violet-400" />

            <div className="rounded-2xl border border-border bg-card px-8 pb-8 pt-10 shadow-lg shadow-black/[0.02]">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Enter your email and password to continue.
                </p>
              </div>

              {!online && !localStorage.getItem(SESSION_KEY) && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive shadow-sm">
                  <WifiOff className="h-4 w-4 shrink-0" />
                  You're offline. First-time login requires an internet connection.
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-5">
                <Field
                  id="email"
                  label="Email or Employee ID"
                  type="text"
                  value={email}
                  onChange={setEmail}
                  icon={<Mail className="h-5 w-5 icon-animate" style={{ animationDelay: "0.5s" }} />}
                  placeholder="email@example.com or EMP001"
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
                  placeholder="Enter your password"
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

                {lockoutMessage}

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
              </form>
            </div>
          </div>

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
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const { id, label, type, value, onChange, icon, placeholder, trailing, autoComplete, required } = props;
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
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground/50"
        />
        {trailing && <span className="pr-3.5">{trailing}</span>}
      </div>
    </div>
  );
}
