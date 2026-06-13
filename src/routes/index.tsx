import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { Logo } from "@/components/jambo/Logo";
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
    <div className="relative min-h-screen w-full bg-background">
      {/* subtle decorative gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at top, oklch(0.49 0.18 264 / 0.10), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, oklch(0.49 0.18 264 / 0.08) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
        <div className="mb-6 flex justify-center">
          <Logo size="md" />
        </div>

        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold tracking-tight">Sign in to Jambo PMS</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hospitality property management — Phase 1
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              id="email"
              label="Email"
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
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Sign in as role (demo)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="h-3.5 w-3.5 accent-primary" defaultChecked />
                Remember me
              </label>
              <a href="#" className="font-medium text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Demo credentials:</span>{" "}
            admin@jambo.com / admin123
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Jambo Sphere Ltd · Kampala, Uganda
        </p>
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
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative flex items-center rounded-lg border border-border bg-background transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
        {icon && <span className="pl-3 text-muted-foreground">{icon}</span>}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        {trailing && <span className="pr-3">{trailing}</span>}
      </div>
    </div>
  );
}
