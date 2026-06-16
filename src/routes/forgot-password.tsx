import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader2,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Logo } from "@/components/jambo/Logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP } from "@/components/ui/input-otp";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Forgot Password — Jambo PMS" }],
  }),
  component: ForgotPasswordPage,
});

const STEPS = ["Email", "Verify", "Reset"];

function MailIllo() {
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-full" fill="none">
      <defs>
        <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="20" y="38" width="120" height="68" rx="12" className="fill-indigo-50 stroke-indigo-200" strokeWidth="2.5" />
      <path d="M20 38 L80 80 L140 38" className="stroke-indigo-300" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="55" y="10" width="50" height="38" rx="6" className="fill-white stroke-indigo-300" strokeWidth="2" />
      <line x1="65" y1="24" x2="95" y2="24" className="stroke-indigo-200" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="65" y1="34" x2="85" y2="34" className="stroke-indigo-200" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="28" cy="22" r="4" fill="#fbbf24" />
      <circle cx="132" cy="25" r="3.5" fill="#fbbf24" />
      <circle cx="80" cy="4" r="3" fill="#a78bfa" />
      <path d="M12 95 L18 90 L15 98" fill="#fbbf24" />
      <path d="M148 88 L142 85 L146 93" fill="#a78bfa" />
    </svg>
  );
}

function OtpIllo() {
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-full" fill="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M80 8 L145 36 L145 74 C145 102 80 118 80 118 C80 118 15 102 15 74 L15 36 Z"
        className="fill-indigo-50 stroke-indigo-200"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="80" cy="58" r="16" className="fill-white stroke-indigo-300" strokeWidth="2" />
      <circle cx="80" cy="58" r="8" className="fill-indigo-100 stroke-indigo-300" strokeWidth="2" />
      <rect x="76" y="68" width="8" height="16" rx="3" className="fill-indigo-100 stroke-indigo-300" strokeWidth="2" />
      <circle cx="32" cy="84" r="5" fill="#a78bfa" />
      <circle cx="52" cy="96" r="4" className="fill-indigo-300" />
      <circle cx="108" cy="96" r="4" className="fill-indigo-300" />
      <circle cx="128" cy="84" r="5" fill="#a78bfa" />
      <circle cx="80" cy="4" r="3" fill="#fbbf24" />
      <path d="M8 78 L14 75 L11 83" fill="#fbbf24" />
      <path d="M152 78 L146 75 L149 83" fill="#fbbf24" />
    </svg>
  );
}

function SuccessIllo() {
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-full" fill="none">
      <circle cx="80" cy="60" r="45" className="fill-emerald-50 stroke-emerald-300" strokeWidth="3" />
      <circle cx="80" cy="60" r="32" className="fill-emerald-100 stroke-emerald-300" strokeWidth="2" />
      <path d="M62 60 L75 73 L98 48" className="stroke-emerald-500" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="40" r="4" fill="#fbbf24" />
      <circle cx="120" cy="35" r="3.5" fill="#a78bfa" />
      <circle cx="130" cy="75" r="4" fill="#fbbf24" />
      <circle cx="30" cy="80" r="3" fill="#a78bfa" />
      <circle cx="80" cy="18" r="3" fill="#f472b6" />
      <circle cx="100" cy="105" r="2.5" fill="#fbbf24" />
      <path d="M50 105 L56 100 L54 108" fill="#a78bfa" />
      <path d="M118 100 L112 96 L115 104" fill="#f472b6" />
    </svg>
  );
}

function ForgotPasswordPage() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notif, setNotif] = useState<string | null>(null);

  useEffect(() => {
    if (notif) {
      const t = setTimeout(() => setNotif(null), 6000);
      return () => clearTimeout(t);
    }
  }, [notif]);

  const handleSendCode = () => {
    setLoading(true);
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setTimeout(() => {
      setLoading(false);
      setOtp(code);
      setStep(1);
      setNotif(code);
    }, 1000);
  };

  const handleVerifyOtp = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); }, 1000);
  };

  const handleReset = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1000);
  };

  if (submitted) {
    return (
      <div className="relative min-h-screen w-full bg-background">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] opacity-60"
          style={{ background: "radial-gradient(ellipse at top, oklch(0.49 0.18 264 / 0.10), transparent 60%)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, oklch(0.49 0.18 264 / 0.08) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
          <div className="mb-6 flex justify-center">
            <Logo size="md" />
          </div>
          <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <SuccessIllo />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Password reset successful!</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Your password has been updated. You can now sign in with your new credentials.
              </p>
              <Button asChild className="mt-6 w-full">
                <Link to="/">Back to Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] opacity-60"
        style={{ background: "radial-gradient(ellipse at top, oklch(0.49 0.18 264 / 0.10), transparent 60%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, oklch(0.49 0.18 264 / 0.08) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
      <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg transition-all duration-500",
            notif
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-4 scale-95 opacity-0",
          )}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10">
            <Mail className="h-4 w-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Code: <span className="tracking-widest text-primary">{notif}</span>
            </p>
            <p className="text-xs text-muted-foreground">Use this code to reset your password</p>
          </div>
          <button
            type="button"
            onClick={() => setNotif(null)}
            className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            <span className="text-xs">✕</span>
          </button>
        </div>
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
        <div className="mb-6 flex justify-center">
          <Logo size="md" />
        </div>

        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6">
            <ProgressStepper current={step} />
          </div>

          <div>
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-2">
                    <MailIllo />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">Forgot your password?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter your email address and we&apos;ll send you a code to reset it.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">Email address</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSendCode}
                  disabled={!email.includes("@") || loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? "Sending…" : "Send Reset Code"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-2">
                    <OtpIllo />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">Your verification code</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sent to{" "}
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-6 py-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Code</span>
                    <span className="tracking-[0.3em] text-2xl font-bold text-primary">{otp}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={otp}
                      onChange={setOtp}
                      render={({ slots }) => (
                        <div className="flex gap-2">
                          {slots.map((slot, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-lg border-2 text-lg font-bold transition-all duration-150",
                                slot.isActive
                                  ? "border-primary bg-primary/5 text-foreground shadow-sm"
                                  : "border-input bg-background text-foreground",
                              )}
                            >
                              {slot.char}
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <RefreshCw className="h-3 w-3" />
                    <span>Didn&apos;t receive the code? </span>
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => { setOtp(""); handleSendCode(); }}
                    >
                      Resend
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 4 || loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {loading ? "Verifying…" : "Verify Code"}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-2 grid h-20 w-20 place-items-center rounded-full bg-indigo-50">
                    <KeyRound className="h-10 w-10 text-indigo-500" />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">Set new password</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose a strong password you haven&apos;t used before.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type={showPwd ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPwd ? "Hide password" : "Show password"}
                      >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirm ? "Hide confirm" : "Show confirm"}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={cn("h-1.5 w-1.5 rounded-full", password.length >= 8 ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                    <span className="text-muted-foreground">At least 8 characters</span>
                    <div className={cn("h-1.5 w-1.5 rounded-full", password === confirmPassword && password.length > 0 ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                    <span className="text-muted-foreground">Passwords match</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleReset}
                  disabled={password.length < 8 || password !== confirmPassword || loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {loading ? "Resetting…" : "Reset Password"}
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressStepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-colors",
                i < current && "bg-emerald-500 text-white",
                i === current && "bg-primary text-primary-foreground",
                i > current && "bg-muted text-muted-foreground",
              )}
            >
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium transition-colors",
                i === current && "text-foreground",
                i < current && "text-emerald-600",
                i > current && "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "mx-2 h-px w-10 sm:w-14 transition-colors",
                i < current ? "bg-emerald-400" : "bg-border",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
