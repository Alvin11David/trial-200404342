import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Printer,
  Receipt,
  CreditCard,
  X,
  ArrowLeft,
  Ban,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Loader2,
  Search,
  User,
  Home,
  FileText,
  Wallet,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHARGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  addCharge,
  addPayment,
  confirmPayment,
  failPayment,
  simulateGatewayConfirm,
  processRefund,
  voidCharge,
  settleFolio,
  runNightAudit,
  totalOutstanding,
  paymentsToday,
  fmtUGX,
  folioBalance,
  reservationById,
  roomById,
  roomTypeById,
  useStore,
  FOLIO_STATUS_LABEL,
  type FolioCharge,
  type FolioChargeType,
  type Payment,
  type PaymentMethod,
  type PaymentStatus,
  type FolioStatus,
} from "@/lib/pms-store";
import { ROLE_META, useRole, type Role } from "@/lib/role";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/billing")({
  head: () => ({ meta: [{ title: "Billing & Folio — Jambo PMS" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    folio: typeof search.folio === "string" ? search.folio : undefined,
    invoice: typeof search.invoice === "string" ? search.invoice : undefined,
  }),
  component: BillingPage,
});

function BillingPage() {
  const { folio, invoice } = useSearch({ from: "/_app/billing" });
  if (invoice) return <InvoiceView folioId={invoice} />;
  if (folio) return <FolioDetail folioId={folio} />;
  return <FolioList />;
}

function useCanSettle(): boolean {
  const { role } = useRole();
  return role === "Front Desk" || role === "Accountant" || role === "Owner / GM";
}
function useCanPostCharge(): boolean {
  const { role } = useRole();
  return (
    role === "Front Desk" ||
    role === "Accountant" ||
    role === "Owner / GM" ||
    role === "POS / Cashier"
  );
}
function useCanVoid(): boolean {
  const { role } = useRole();
  return role === "Accountant" || role === "Owner / GM" || role === "Front Desk";
}
function useCanNightAudit(): boolean {
  const { role } = useRole();
  return role === "Accountant" || role === "Owner / GM";
}
function useCanRefund(): boolean {
  const { role } = useRole();
  return role === "Accountant" || role === "Owner / GM" || role === "System Administrator";
}
function useActorName(): string {
  const { role } = useRole();
  return ROLE_META[role]?.person ?? role;
}
function useActorRole(): Role {
  const { role } = useRole();
  return role;
}

function FolioList() {
  const folios = useStore((s) => s.folios);
  const reservations = useStore((s) => s.reservations);
  const navigate = useNavigate();

  const [tab, setTab] = useState<"active" | "pending" | "settled" | "all">("active");
  const [q, setQ] = useState("");

  const totals = useMemo(() => {
    const open = folios.filter(
      (f) => f.status === "open" || f.status === "active" || f.status === "pending_settlement",
    );
    const totalOpen = open.reduce((s, f) => s + folioBalance(f.id), 0);
    return {
      open: totalOpen,
      count: open.length,
      settled: folios.filter((f) => f.status === "settled" || f.status === "closed").length,
      collectedToday: paymentsToday(),
      totalOutstanding: totalOutstanding(),
    };
  }, [folios]);

  const rows = useMemo(() => {
    const filterStatuses: FolioStatus[] =
      tab === "active"
        ? ["open", "active", "pending_settlement"]
        : tab === "pending"
          ? ["pending_settlement"]
          : tab === "settled"
            ? ["settled", "closed", "void"]
            : ["open", "active", "pending_settlement", "settled", "closed", "void"];
    return folios
      .filter((f) => filterStatuses.includes(f.status))
      .map((f) => {
        const res = reservations.find((r) => r.id === f.reservationId);
        return { folio: f, reservation: res, balance: folioBalance(f.id) };
      })
      .filter(
        (r) =>
          !q ||
          `${r.folio.id} ${r.reservation?.guestName ?? ""} ${r.reservation?.id ?? ""}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      )
      .sort((a, b) => (a.folio.id < b.folio.id ? 1 : -1));
  }, [folios, reservations, tab, q]);

  const balanceColor = (bal: number) =>
    bal <= 0 ? "text-success" : bal > 0 && bal <= 500_000 ? "text-warning" : "text-destructive";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Billing &amp; Folios</h1>
              <p className="text-sm text-muted-foreground">
                Folios, charges, payments and invoices
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Active folios" value={totals.count.toString()} kind="active" />
        <Stat label="Total outstanding" value={fmtUGX(totals.open)} tone="warning" kind="outstanding" />
        <Stat label="All outstanding" value={fmtUGX(totals.totalOutstanding)} tone="warning" kind="all" />
        <Stat label="Collected today" value={fmtUGX(totals.collectedToday)} tone="success" kind="collected" />
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-border/50 bg-card/50 p-1 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search guest, folio, reservation…"
              className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 pl-10 pr-3 text-sm outline-none ring-0 transition-all placeholder:text-muted-foreground/40 focus:border-primary/60 focus:bg-background/80 focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-border/40 bg-background/30 p-1">
            {(["active", "pending", "settled", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  tab === t
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-background/50",
                )}
              >
                {t === "active" ? "Active" : t === "pending" ? "Pending" : t === "settled" ? "Settled" : "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Folio cards */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30 py-24">
          <Wallet className="mb-3 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm font-medium text-muted-foreground">No folios match your criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ folio, reservation, balance }) => (
            <div
              key={folio.id}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-lg cursor-pointer"
              onClick={() =>
                navigate({ to: "/billing", search: { folio: folio.id, invoice: undefined } })
              }
            >
              <div className={cn(
                "absolute left-0 top-0 h-full w-1 bg-gradient-to-b",
                balance <= 0 ? "from-emerald-400 to-green-500" : "from-amber-400 to-orange-500",
              )} />
              <div className="p-5 pl-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground/60">
                      {folio.id}
                    </span>
                    <FolioStatusBadge status={folio.status} />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
                    <Clock className="h-3 w-3" />
                    Opened {new Date(folio.openedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-4 flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {reservation?.guestName ?? "—"}
                      </span>
                      {reservation?.roomId && (
                        <span className="inline-flex items-center gap-1.5">
                          <Home className="h-3.5 w-3.5" />
                          Room {reservation.roomId}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        {reservation?.id ?? "—"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground/50">Balance</div>
                      <div className={cn("text-lg font-bold tracking-tight", balanceColor(balance))}>
                        {fmtUGX(balance)}
                      </div>
                    </div>
                    <div className="grid h-9 w-9 place-items-center rounded-xl border border-border/50 bg-card/40 text-muted-foreground/30 shadow-sm transition-all group-hover:border-primary/30 group-hover:text-primary group-hover:shadow-md">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.02] to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const statusDot: Record<FolioStatus, string> = {
  open: "bg-blue-500",
  active: "bg-blue-500",
  pending_settlement: "bg-amber-500",
  settled: "bg-emerald-500",
  closed: "bg-emerald-500",
  void: "bg-destructive",
};

const statusBadge: Record<FolioStatus, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  active: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  pending_settlement: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  settled: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  closed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  void: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
};

function FolioStatusBadge({ status }: { status: FolioStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        statusBadge[status],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[status])} />
      {FOLIO_STATUS_LABEL[status]}
    </span>
  );
}

function FolioDetail({ folioId }: { folioId: string }) {
  const folios = useStore((s) => s.folios);
  const charges = useStore((s) => s.charges);
  const payments = useStore((s) => s.payments);
  const tenant = useStore((s) => s.tenant);
  const [showCharge, setShowCharge] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showVoid, setShowVoid] = useState<string | null>(null);
  const [showSettle, setShowSettle] = useState(false);
  const [showNightAudit, setShowNightAudit] = useState(false);
  const [showRefund, setShowRefund] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState<string | null>(null);
  const [showSmsReceipt, setShowSmsReceipt] = useState<string | null>(null);

  const canPost = useCanPostCharge();
  const canVoid = useCanVoid();
  const canSettle = useCanSettle();
  const canAudit = useCanNightAudit();
  const canRefund = useCanRefund();
  const actor = useActorName();
  const actorRole = useActorRole();

  const folio = folios.find((f) => f.id === folioId);
  if (!folio) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="text-sm text-muted-foreground">Folio not found.</p>
        <Link
          to="/billing"
          search={{ folio: undefined, invoice: undefined }}
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          ← Back to billing
        </Link>
      </div>
    );
  }
  const res = reservationById(folio.reservationId);
  const room = roomById(res?.roomId);
  const rt = res ? roomTypeById(res.roomTypeId) : undefined;

  const folioCharges = charges.filter((c) => c.folioId === folioId);
  const folioPayments = payments.filter((p) => p.folioId === folioId);
  const totalCharges = folioCharges.filter((c) => !c.voided).reduce((s, c) => s + c.amount, 0);
  const voidedAmount = folioCharges.filter((c) => c.voided).reduce((s, c) => s + c.amount, 0);
  const confirmedPayments = folioPayments
    .filter((p) => p.status === "confirmed")
    .reduce((s, p) => s + p.amount, 0);
  const totalPayments = confirmedPayments;
  const balance = totalCharges - totalPayments;

  const isOpen =
    folio.status === "open" || folio.status === "active" || folio.status === "pending_settlement";

  const balanceColor =
    balance <= 0
      ? "text-success"
      : balance > 0 && balance <= 500_000
        ? "text-warning"
        : "text-destructive";

  const handleVoidCharge = (chargeId: string, reason: string) => {
    voidCharge(folioId, chargeId, reason, actor, actorRole);
    setShowVoid(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/billing"
          search={{ folio: undefined, invoice: undefined }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to folios
        </Link>
        <div className="flex items-center gap-2">
          {canAudit && isOpen && (
            <button
              onClick={() => setShowNightAudit(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-primary/40"
            >
              <Moon className="h-3.5 w-3.5" /> Night audit
            </button>
          )}
          <Link
            to="/billing"
            search={{ invoice: folio.id } as never}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-primary/40"
          >
            <Printer className="h-3.5 w-3.5" /> View invoice
          </Link>
        </div>
      </div>

      {/* Folio header card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent" />
        <div className="relative p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">Folio</span>
                <div className="h-3 w-px bg-border" />
                <FolioStatusBadge status={folio.status} />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight">{folio.id}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {res?.guestName ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  Room {room?.id ?? "—"} ({rt?.name ?? "—"})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {res ? (
                    <Link to="/reservations" search={{ q: res.id } as never} className="text-primary hover:underline">
                      {res.id}
                    </Link>
                  ) : "—"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground/60">
                  <Clock className="h-3.5 w-3.5" />
                  {res?.checkIn} → {res?.checkOut}
                </span>
              </div>
              {folio.closedAt && (
                <span className="text-[10px] text-muted-foreground/50">
                  Closed {new Date(folio.closedAt).toLocaleDateString()}
                </span>
              )}
              {res?.vatTreatment && (
                <span className="text-[10px] text-muted-foreground/50">
                  VAT {res.vatTreatment} · Rate {(res.vatRate ?? 0) * 100}%
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="inline-flex items-center rounded-xl bg-card/50 px-5 py-3 ring-1 ring-border/50">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Outstanding balance
                  </p>
                  <p className={cn("text-2xl font-bold tracking-tight", balanceColor)}>{fmtUGX(balance)}</p>
                  {balance > 0 && (
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-warning">
                      <AlertTriangle className="h-3 w-3" /> Amount due
                    </p>
                  )}
                  {balance <= 0 && (
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-success">
                      <CheckCircle2 className="h-3 w-3" /> In credit / settled
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charges & Payments */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Charges */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold">Charges</h3>
              <p className="text-[11px] text-muted-foreground/60">
                {folioCharges.filter((c) => !c.voided).length} line items
                {voidedAmount > 0 && ` · ${folioCharges.filter((c) => c.voided).length} voided`}
              </p>
            </div>
            {isOpen && canPost && (
              <button
                onClick={() => setShowCharge(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-3 py-2 text-[11px] font-semibold text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/70 hover:shadow-md"
              >
                <Plus className="h-3.5 w-3.5" /> Add charge
              </button>
            )}
          </div>
          <ul className="divide-y divide-border/40">
            {folioCharges.length === 0 && (
              <li className="px-5 py-14 text-center text-xs text-muted-foreground/50">
                <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
                No charges yet
              </li>
            )}
            {folioCharges.map((c) => (
              <li
                key={c.id}
                className={cn(
                  "flex items-start justify-between px-5 py-3.5 transition-colors hover:bg-muted/20",
                  c.voided && "opacity-40",
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium", c.voided && "line-through")}>
                      {c.description}
                    </span>
                    {c.voided && (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-destructive">
                        Voided
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/60">
                    <span>{c.date}</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      {CHARGE_TYPE_LABEL[c.type]}
                    </span>
                    {c.postedBy && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        {c.postedBy}
                      </span>
                    )}
                    {c.voided && c.voidReason && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        voided: {c.voidReason}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn("text-sm font-semibold tabular-nums", c.voided && "line-through text-muted-foreground")}
                  >
                    {fmtUGX(c.amount)}
                  </span>
                  {!c.voided && isOpen && canVoid && (
                    <button
                      onClick={() => setShowVoid(c.id)}
                      className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Void charge"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-5 py-3.5">
            <span className="text-xs font-medium text-muted-foreground">Total charges</span>
            <span className="text-sm font-bold">{fmtUGX(totalCharges)}</span>
          </div>
          {voidedAmount > 0 && (
            <div className="flex items-center justify-between border-t border-border/40 px-5 py-2 text-[11px]">
              <span className="text-muted-foreground/60">Voided</span>
              <span className="text-destructive">−{fmtUGX(voidedAmount)}</span>
            </div>
          )}
        </div>

        {/* Payments */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold">Payments</h3>
              <p className="text-[11px] text-muted-foreground/60">
                {folioPayments.length} transactions
              </p>
            </div>
            {isOpen && (
              <button
                onClick={() => setShowPay(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-all hover:from-emerald-500/90 hover:to-emerald-600/90 hover:shadow-md"
              >
                <CreditCard className="h-3.5 w-3.5" /> Record payment
              </button>
            )}
          </div>
          <ul className="divide-y divide-border/40">
            {folioPayments.length === 0 && (
              <li className="px-5 py-14 text-center text-xs text-muted-foreground/50">
                <CreditCard className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
                No payments yet
              </li>
            )}
            {folioPayments.map((p) => (
              <li key={p.id} className="flex items-start justify-between px-5 py-3.5 transition-colors hover:bg-muted/20">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {p.refundOf
                        ? "Refund (" + PAYMENT_METHOD_LABEL[p.method] + ")"
                        : PAYMENT_METHOD_LABEL[p.method]}
                    </span>
                    {p.status === "pending" && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                        Pending
                      </span>
                    )}
                    {p.status === "failed" && (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400 ring-1 ring-red-500/20">
                        Failed
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/60">
                    <span>{p.date}</span>
                    {p.phone && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        {p.phone}
                      </span>
                    )}
                    {p.reference && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        {p.reference}
                      </span>
                    )}
                    {p.providerRef && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        {p.providerRef}
                      </span>
                    )}
                    {p.failureReason && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        {p.failureReason}
                      </span>
                    )}
                    {p.refundReason && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        Refund: {p.refundReason}
                      </span>
                    )}
                    {p.refundedBy && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        by {p.refundedBy}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.status === "pending" && (
                      <>
                        <button
                          disabled={confirmingId === p.id}
                          onClick={async () => {
                            setConfirmingId(p.id);
                            const res = await simulateGatewayConfirm(p.id, actor, actorRole);
                            setConfirmingId(null);
                            if (res.ok) toast.success(res.message);
                            else toast.error(res.message);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          {confirmingId === p.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : null}
                          {confirmingId === p.id ? "Confirming…" : "Confirm"}
                        </button>
                        <button
                          onClick={() => {
                            const r = prompt("Failure reason:");
                            if (r) failPayment(p.id, r, actor, actorRole);
                          }}
                          className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-600 dark:text-red-400 ring-1 ring-red-500/20 transition-colors hover:bg-red-500/20"
                        >
                          Fail
                        </button>
                      </>
                    )}
                    {p.status === "confirmed" && !p.refundOf && canRefund && (
                      <button
                        onClick={() => setShowRefund(p.id)}
                        className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-600 dark:text-red-400 ring-1 ring-red-500/20 transition-colors hover:bg-red-500/20"
                      >
                        Refund
                      </button>
                    )}
                    {p.status === "confirmed" && (
                      <button
                        onClick={() => setShowReceipt(p.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary ring-1 ring-primary/20 transition-colors hover:bg-primary/20"
                      >
                        <Receipt className="h-3 w-3" />
                        Receipt
                      </button>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums shrink-0 ml-2",
                    p.refundOf ? "text-destructive" : "text-success",
                  )}
                >
                  {p.refundOf ? "" : "−"}
                  {fmtUGX(p.amount)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-5 py-3.5">
            <span className="text-xs font-medium text-muted-foreground">Total payments</span>
            <span className="text-sm font-bold text-success">{fmtUGX(totalPayments)}</span>
          </div>
        </div>
      </div>

      {/* Balance warning / settle */}
      {canSettle && isOpen && balance <= 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowSettle(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-emerald-500/90 hover:to-green-600/90 hover:shadow-md"
          >
            <CheckCircle2 className="h-4 w-4" /> Settle & close folio
          </button>
        </div>
      )}

      {canSettle && isOpen && balance > 0 && (
        <div className="rounded-2xl border border-amber-200/30 bg-gradient-to-br from-amber-500/[0.04] to-transparent p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-500" />
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Outstanding balance of <strong>{fmtUGX(balance)}</strong> must be cleared before checkout.
          </p>
          <p className="mt-0.5 text-[11px] text-amber-500/60">
            Record a payment above to reduce the balance.
          </p>
        </div>
      )}

      {showCharge && (
        <AddChargeDialog folioId={folio.id} actor={actor} onClose={() => setShowCharge(false)} />
      )}
      {showPay && (
        <AddPaymentDialog
          folioId={folio.id}
          balance={balance}
          actor={actor}
          onClose={() => setShowPay(false)}
        />
      )}
      {showVoid && (
        <VoidChargeDialog
          chargeId={showVoid}
          charge={folioCharges.find((c) => c.id === showVoid)!}
          onConfirm={handleVoidCharge}
          onClose={() => setShowVoid(null)}
        />
      )}
      {showSettle && (
        <SettlementDialog
          folioId={folio.id}
          folioBalance={balance}
          actor={actor}
          actorRole={actorRole}
          onClose={() => setShowSettle(false)}
        />
      )}
      {showNightAudit && (
        <NightAuditDialog
          actor={actor}
          actorRole={actorRole}
          onClose={() => setShowNightAudit(false)}
        />
      )}
      {showRefund && (
        <RefundDialog
          payment={folioPayments.find((p) => p.id === showRefund)!}
          actor={actor}
          actorRole={actorRole}
          onClose={() => setShowRefund(null)}
        />
      )}
      {showReceipt && (
        <ReceiptDialog
          payment={folioPayments.find((p) => p.id === showReceipt)!}
          folio={folio}
          tenant={tenant}
          onClose={() => setShowReceipt(null)}
          onSms={() => {
            setShowSmsReceipt(showReceipt);
            setShowReceipt(null);
          }}
        />
      )}
      {showSmsReceipt && (
        <SmsDialog
          payment={folioPayments.find((p) => p.id === showSmsReceipt)!}
          folio={folio}
          tenant={tenant}
          onClose={() => setShowSmsReceipt(null)}
        />
      )}
    </div>
  );
}

function FolioStatusBadgeMini({ status }: { status: FolioStatus }) {
  const dotColor: Record<FolioStatus, string> = {
    open: "bg-blue-500",
    active: "bg-blue-500",
    pending_settlement: "bg-amber-500",
    settled: "bg-emerald-500",
    closed: "bg-emerald-500",
    void: "bg-destructive",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[status])} />
      {FOLIO_STATUS_LABEL[status]}
    </span>
  );
}

/* ============================== Dialogs ============================== */

function AddChargeDialog({
  folioId,
  actor,
  onClose,
}: {
  folioId: string;
  actor: string;
  onClose: () => void;
}) {
  const [type, setType] = useState<FolioChargeType>("misc");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");

  const submit = () => {
    if (!description || !amount || amount <= 0) return;
    addCharge(folioId, { type, description, amount: Number(amount), postedBy: actor });
    onClose();
  };

  return (
    <Modal title="Add charge" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Type">
          <Select value={type} onValueChange={(v) => setType(v as FolioChargeType)}>
            <SelectTrigger className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(CHARGE_TYPE_LABEL) as [FolioChargeType, string][]).map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Description">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Mini bar — soft drinks"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </Field>
        <Field label="Amount (UGX)">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            min={0}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </Field>
      </div>
      <DialogFooter
        onCancel={onClose}
        onSubmit={submit}
        submitLabel="Post charge"
        disabled={!description || !amount}
      />
    </Modal>
  );
}

function AddPaymentDialog({
  folioId,
  balance,
  actor,
  onClose,
}: {
  folioId: string;
  balance: number;
  actor: string;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState<number | "">(balance > 0 ? balance : "");
  const [tendered, setTendered] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");

  const payAmount = Number(amount) || 0;
  const tenderedAmount = Number(tendered) || 0;
  const changeDue =
    method === "cash" && tenderedAmount > payAmount ? tenderedAmount - payAmount : 0;
  const insufficientTender = method === "cash" && tenderedAmount > 0 && tenderedAmount < payAmount;

  const resetTendered = () => {
    setTendered("");
  };

  const submit = () => {
    if (!amount || amount <= 0) return;
    if (insufficientTender) return;
    addPayment(folioId, {
      method,
      amount: payAmount,
      tendered: method === "cash" ? tenderedAmount : undefined,
      change: method === "cash" ? changeDue : undefined,
      phone: method === "mtn_momo" || method === "airtel_money" ? phone : undefined,
      reference: reference || undefined,
      receivedBy: actor,
    });
    onClose();
  };

  return (
    <Modal title="Record payment" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Method">
          <Select
            value={method}
            onValueChange={(v) => {
              setMethod(v as PaymentMethod);
              resetTendered();
            }}
          >
            <SelectTrigger className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(PAYMENT_METHOD_LABEL) as [PaymentMethod, string][]).map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Amount (UGX)">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            min={0}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </Field>
        {method === "cash" && (
          <>
            <Field label="Amount tendered (UGX)">
              <input
                type="number"
                value={tendered}
                onChange={(e) => setTendered(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </Field>
            {tenderedAmount > 0 && !insufficientTender && (
              <p className="rounded-md border border-success/20 bg-success/10 px-3 py-2 text-[11px] text-success">
                Change due: <strong>{fmtUGX(changeDue)}</strong>
              </p>
            )}
            {insufficientTender && (
              <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                Amount tendered (UGX {tenderedAmount.toLocaleString()}) is less than the payment
                amount (UGX {payAmount.toLocaleString()})
              </p>
            )}
          </>
        )}
        {(method === "mtn_momo" || method === "airtel_money") && (
          <Field label="Mobile money phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 7XX XXX XXX"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </Field>
        )}
        <Field label="Reference (optional)">
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Txn ID / receipt #"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </Field>
        {balance > 0 && (
          <p className="rounded-md border border-info/20 bg-info/10 px-3 py-2 text-[11px] text-info">
            Current balance: <strong>{fmtUGX(balance)}</strong>. Folio auto-settles when the balance
            reaches zero.
          </p>
        )}
        {balance <= 0 && (
          <p className="rounded-md border border-info/20 bg-info/10 px-3 py-2 text-[11px] text-info">
            Folio is in credit. This payment will increase the credit balance.
          </p>
        )}
      </div>
      <DialogFooter
        onCancel={onClose}
        onSubmit={submit}
        submitLabel="Record payment"
        disabled={!amount || insufficientTender}
      />
    </Modal>
  );
}

function VoidChargeDialog({
  chargeId,
  charge,
  onConfirm,
  onClose,
}: {
  chargeId: string;
  charge: FolioCharge;
  onConfirm: (chargeId: string, reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Modal title="Void charge" onClose={onClose}>
      <div className="space-y-3">
        <div className="rounded-lg bg-muted/30 p-3 text-sm">
          <div className="font-medium">{charge.description}</div>
          <div className="text-muted-foreground">
            {fmtUGX(charge.amount)} · {CHARGE_TYPE_LABEL[charge.type]} · {charge.date}
          </div>
        </div>
        <Field label="Void reason (required)">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Guest disputed charge, incorrect amount"
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </Field>
        <p className="text-[11px] text-muted-foreground">
          Voiding does not delete the charge. A balancing void entry is recorded on the folio for
          audit trail purposes.
        </p>
      </div>
      <DialogFooter
        onCancel={onClose}
        onSubmit={() => onConfirm(chargeId, reason)}
        submitLabel="Void charge"
        disabled={!reason.trim()}
      />
    </Modal>
  );
}

function SettlementDialog({
  folioId,
  folioBalance: balance,
  actor,
  actorRole,
  onClose,
}: {
  folioId: string;
  folioBalance: number;
  actor: string;
  actorRole: string;
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState(false);

  const handleSettle = () => {
    settleFolio(folioId, actor, actorRole);
    onClose();
  };

  return (
    <Modal title="Settle & close folio" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-success/20 bg-success/5 p-4 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
          <p className="mt-2 text-sm font-medium">
            Folio balance is <strong>{fmtUGX(balance)}</strong>
          </p>
          <p className="text-[11px] text-muted-foreground">
            The balance is fully settled. Closing this folio will generate an invoice.
          </p>
        </div>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-xs text-muted-foreground">
            I confirm that I have reviewed the folio with the guest and all charges are correct.
          </span>
        </label>
      </div>
      <DialogFooter
        onCancel={onClose}
        onSubmit={handleSettle}
        submitLabel="Close folio"
        disabled={!confirm}
      />
    </Modal>
  );
}

function RefundDialog({
  payment,
  actor,
  actorRole,
  onClose,
}: {
  payment: Payment;
  actor: string;
  actorRole: string;
  onClose: () => void;
}) {
  const [refundAmount, setRefundAmount] = useState(payment.amount);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleRefund = () => {
    if (refundAmount <= 0) {
      setError("Refund amount must be positive.");
      return;
    }
    if (refundAmount > payment.amount) {
      setError("Refund amount cannot exceed the original payment.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for the refund.");
      return;
    }
    processRefund(payment.id, refundAmount, reason.trim(), actor, actorRole);
    onClose();
  };

  return (
    <Modal title="Process refund" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
          <p className="font-medium">{PAYMENT_METHOD_LABEL[payment.method]}</p>
          <p className="text-muted-foreground">
            Original: {fmtUGX(payment.amount)} · {payment.date}
          </p>
        </div>
        <Field label="Refund amount (UGX)">
          <input
            type="number"
            value={refundAmount}
            onChange={(e) => {
              setRefundAmount(Number(e.target.value));
              setError("");
            }}
            min={1}
            max={payment.amount}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </Field>
        <Field label="Reason for refund">
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
            placeholder="e.g. Guest overpaid, duplicate charge, service not rendered"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            rows={3}
          />
        </Field>
        {error && (
          <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
            {error}
          </p>
        )}
      </div>
      <DialogFooter
        onCancel={onClose}
        onSubmit={handleRefund}
        submitLabel="Process refund"
        disabled={!reason.trim() || refundAmount <= 0}
      />
    </Modal>
  );
}

function ReceiptDialog({
  payment,
  folio,
  tenant,
  onClose,
  onSms,
}: {
  payment: Payment;
  folio: { id: string; reservationId: string; status: FolioStatus };
  tenant: { name: string; address?: string; phone?: string; email?: string; tin?: string };
  onClose: () => void;
  onSms?: () => void;
}) {
  const charges = useStore((s) => s.charges);
  const res = reservationById(folio.reservationId);
  const folioCharges = charges.filter((c) => c.folioId === folio.id && !c.voided);
  const totalCharged = folioCharges.reduce((s, c) => s + c.amount, 0);

  const guestPhone = payment.phone || res?.guestPhone || "";
  const label = payment.refundOf
    ? "Refund (" + PAYMENT_METHOD_LABEL[payment.method] + ")"
    : PAYMENT_METHOD_LABEL[payment.method];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-display text-lg font-bold">Payment Receipt</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-lg border border-border p-4 text-sm">
          {/* Hotel info */}
          <div className="border-b border-border pb-3 text-center">
            <p className="font-display text-lg font-bold">{tenant.name}</p>
            <p className="text-[11px] text-muted-foreground">{tenant.address}</p>
            <p className="text-[11px] text-muted-foreground">
              {tenant.phone} · {tenant.email}
            </p>
            <p className="text-[11px] text-muted-foreground">TIN: {tenant.tin}</p>
          </div>

          {/* Receipt info */}
          <div className="mt-3 flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Receipt</p>
              <p className="font-mono text-xs font-semibold">{payment.receiptId ?? payment.id}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Date</p>
              <p className="text-xs">{payment.date}</p>
            </div>
          </div>

          {/* Guest info */}
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Guest</p>
            <p className="text-sm font-medium">{res?.guestName ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              {res?.guestEmail}
              {guestPhone ? ` · ${guestPhone}` : ""}
            </p>
            {res && (
              <p className="text-xs text-muted-foreground">
                {res.checkIn} → {res.checkOut} · {res.roomId ? `Room ${res.roomId}` : "—"}
              </p>
            )}
          </div>

          {/* Payment details */}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment</p>
              <p className="text-sm font-medium">{label}</p>
              {payment.reference && (
                <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
              )}
              {payment.providerRef && (
                <p className="text-xs text-muted-foreground">Provider: {payment.providerRef}</p>
              )}
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-lg font-bold tabular-nums",
                  payment.refundOf ? "text-destructive" : "text-success",
                )}
              >
                {payment.refundOf ? "" : "−"}
                {fmtUGX(Math.abs(payment.amount))}
              </p>
              {payment.refundOf && payment.refundReason && (
                <p className="text-[10px] text-destructive">{payment.refundReason}</p>
              )}
            </div>
          </div>

          {/* Folio summary */}
          <div className="mt-3 border-t border-border pt-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Charges total</span>
              <span>{fmtUGX(totalCharged)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Folio</span>
              <span className="font-mono">{folio.id}</span>
            </div>
            {res?.id && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Reservation</span>
                <span className="font-mono">{res.id}</span>
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-[10px] text-muted-foreground">
            Thank you for choosing {tenant.name}. This is a system-generated receipt.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          {guestPhone && (
            <button
              onClick={onSms}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted"
            >
              <Smartphone className="h-3.5 w-3.5" /> Send via SMS
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>
      <style>{`@media print { body { background: white; } .fixed.inset-0.z-50 { position: static !important; background: none !important; backdrop-filter: none !important; } .fixed.inset-0.z-50 > div { max-width: none !important; box-shadow: none !important; border: none !important; } header, aside, button:not(.fixed.inset-0.z-50 button) { display: none !important; } }`}</style>
    </div>
  );
}

function SmsDialog({
  payment,
  folio,
  tenant,
  onClose,
}: {
  payment: Payment;
  folio: { id: string; reservationId: string };
  tenant: { name: string };
  onClose: () => void;
}) {
  const res = reservationById(folio.reservationId);
  const guestPhone = payment.phone || res?.guestPhone || "";

  const handleSend = () => {
    toast.success(`Receipt sent to ${guestPhone}`);
    onClose();
  };

  return (
    <Modal title="Send receipt via SMS" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <Field label="Recipient phone">
            <input
              value={guestPhone}
              readOnly
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">Message preview</p>
          <p className="mt-1 text-xs">
            Dear guest, thank you for your payment of {fmtUGX(Math.abs(payment.amount))} via{" "}
            {PAYMENT_METHOD_LABEL[payment.method]}. Receipt: {payment.receiptId ?? payment.id}. —{" "}
            {tenant.name}
          </p>
        </div>
        <DialogFooter onCancel={onClose} onSubmit={handleSend} submitLabel="Send SMS" />
      </div>
    </Modal>
  );
}

function NightAuditDialog({
  actor,
  actorRole,
  onClose,
}: {
  actor: string;
  actorRole: string;
  onClose: () => void;
}) {
  const folios = useStore((s) => s.folios);
  const reservations = useStore((s) => s.reservations);
  const charges = useStore((s) => s.charges);
  const today = new Date().toISOString().slice(0, 10);

  const activeFolios = folios.filter((f) => f.status === "open" || f.status === "active");
  const toCharge = activeFolios.filter((f) => {
    const res = reservations.find((r) => r.id === f.reservationId);
    if (!res || !res.roomId) return false;
    return !charges.some((c) => c.folioId === f.id && c.date === today && c.type === "room");
  });

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<string[]>([]);

  const handleRun = () => {
    setRunning(true);
    // Small delay to show progress
    setTimeout(() => {
      const posted = runNightAudit(actor, actorRole);
      setResult(posted);
      setRunning(false);
      setDone(true);
    }, 600);
  };

  return (
    <Modal title="Night audit" onClose={onClose}>
      {!done ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/30 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-primary" />
              <span className="font-medium">End of day — {today}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {toCharge.length} of {activeFolios.length} active folios will receive tonight's room
              charge.
            </p>
            {toCharge.length === 0 && activeFolios.length > 0 && (
              <p className="mt-1 text-[11px] text-success">
                All folios already charged for tonight.
              </p>
            )}
          </div>
          {toCharge.length > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
              {toCharge.map((f) => {
                const res = reservations.find((r) => r.id === f.reservationId);
                return (
                  <li
                    key={f.id}
                    className="flex justify-between rounded px-2 py-1 hover:bg-muted/30"
                  >
                    <span>
                      {f.id} — {res?.guestName ?? "—"}
                    </span>
                    <span className="font-medium tabular-nums">
                      {res ? fmtUGX(res.ratePerNight) : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-[11px] text-muted-foreground">
            Once a business day is closed via Night Audit it cannot be reopened. Only adjustments
            can be posted.
          </p>
          {running && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Posting charges…
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-success/20 bg-success/5 p-4 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
            <p className="mt-1 text-sm font-medium">Night audit completed</p>
            <p className="text-xs text-muted-foreground">
              {result.length} folios charged for {today}
            </p>
          </div>
        </div>
      )}
      <DialogFooter
        onCancel={onClose}
        onSubmit={done ? onClose : handleRun}
        submitLabel={done ? "Close" : "Run night audit"}
        disabled={running}
      />
    </Modal>
  );
}

/* ============================== Invoice ============================== */

function InvoiceView({ folioId }: { folioId: string }) {
  const folios = useStore((s) => s.folios);
  const charges = useStore((s) => s.charges);
  const payments = useStore((s) => s.payments);
  const tenant = useStore((s) => s.tenant);
  const folio = folios.find((f) => f.id === folioId);
  if (!folio) return <p className="py-20 text-center text-muted-foreground">Folio not found.</p>;
  const res = reservationById(folio.reservationId);
  const folioCharges = charges.filter((c) => c.folioId === folioId && !c.voided);
  const folioPayments = payments.filter((p) => p.folioId === folioId);

  const subtotal = folioCharges.reduce((s, c) => s + c.amount, 0);
  const effectiveVatRate = res?.vatRate ?? 0.18;
  const isInclusive = res?.vatTreatment !== "exclusive";
  const vat = isInclusive
    ? subtotal - subtotal / (1 + effectiveVatRate)
    : Math.round(subtotal * effectiveVatRate);
  const net = isInclusive ? subtotal - vat : subtotal;
  const gross = isInclusive ? subtotal : subtotal + vat;
  const paid = folioPayments
    .filter((p) => p.status === "confirmed")
    .reduce((s, p) => s + p.amount, 0);
  const due = gross - paid;

  return (
    <div className="mx-auto max-w-3xl print:max-w-none">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          to="/billing"
          search={{ folio: folioId } as never}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to folio
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/70 hover:shadow-md"
        >
          <Printer className="h-3.5 w-3.5" /> Print invoice
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm print:border-0 print:shadow-none">
        <div className="p-8 sm:p-10">
          <div className="flex items-start justify-between border-b border-border/50 pb-6">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight">{tenant.name}</h1>
              <p className="text-xs text-muted-foreground/70">{tenant.address}</p>
              <p className="text-xs text-muted-foreground/70">
                {tenant.phone} · {tenant.email}
              </p>
              <p className="text-xs text-muted-foreground/60">TIN: {tenant.tin}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex rounded-xl bg-gradient-to-br from-primary/[0.08] to-transparent px-4 py-2 ring-1 ring-primary/10">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
                    Tax Invoice
                  </p>
                  <p className="font-display text-xl font-bold">{folio.id.replace("F-", "INV-")}</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Issued: {new Date().toISOString().slice(0, 10)}
                  </p>
                  <div className="mt-1">
                    <FolioStatusBadgeMini status={folio.status} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Bill to</p>
              <p className="mt-1 text-sm font-semibold">{res?.guestName}</p>
              <p className="text-xs text-muted-foreground/70">{res?.guestEmail}</p>
              <p className="text-xs text-muted-foreground/70">{res?.guestPhone}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Stay</p>
              <p className="mt-1 text-sm font-semibold">
                {res?.checkIn} → {res?.checkOut}
              </p>
              <p className="text-xs text-muted-foreground/70">
                Room {res?.roomId ?? "—"} · Reservation {res?.id}
              </p>
              {res?.vatTreatment && (
                <p className="mt-1 text-[10px] text-muted-foreground/50">
                  Prices are VAT {isInclusive ? "inclusive" : "exclusive"}
                </p>
              )}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                <th className="py-2.5 text-left">Date</th>
                <th className="py-2.5 text-left">Description</th>
                <th className="py-2.5 text-left">Type</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {folioCharges.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-muted/20">
                  <td className="py-2.5 text-xs text-muted-foreground/70">{c.date}</td>
                  <td className="py-2.5 text-sm">{c.description}</td>
                  <td className="py-2.5 text-xs text-muted-foreground/70">{CHARGE_TYPE_LABEL[c.type]}</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums">{fmtUGX(c.amount)}</td>
                </tr>
              ))}
              {folioPayments.map((p) => (
                <tr key={p.id} className="text-emerald-600 dark:text-emerald-400 transition-colors hover:bg-muted/20">
                  <td className="py-2.5 text-xs text-muted-foreground/70">{p.date}</td>
                  <td className="py-2.5 text-sm">{PAYMENT_METHOD_LABEL[p.method]} payment</td>
                  <td className="py-2.5 text-xs text-muted-foreground/70">Payment</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums">−{fmtUGX(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto mt-6 w-full max-w-xs space-y-2">
            <Row label="Subtotal (net)" value={fmtUGX(net)} />
            <Row label={`VAT (${(effectiveVatRate * 100).toFixed(0)}%)`} value={fmtUGX(vat)} />
            <div className="border-t border-border/50 pt-2">
              <Row label="Total" value={fmtUGX(gross)} bold />
            </div>
            {paid > 0 && <Row label="Paid" value={"−" + fmtUGX(paid)} tone="success" />}
            <div className="border-t border-border/50 pt-2">
              <Row
                label="Balance due"
                value={fmtUGX(Math.max(0, due))}
                bold
                tone={due > 0 ? "warning" : "success"}
              />
            </div>
          </div>

          <p className="mt-10 text-center text-[10px] text-muted-foreground/50">
            Thank you for staying with {tenant.name}. This is a system-generated tax invoice.
          </p>
        </div>
      </div>
      <style>{`@media print { body { background: white; } header, aside { display: none !important; } main { padding: 0 !important; } }`}</style>
    </div>
  );
}

/* ============================== Shared helpers ============================== */

const statGradients: Record<string, { gradient: string; icon: React.ComponentType<{ className?: string }> }> = {
  active: {
    gradient: "from-sky-400 to-blue-600",
    icon: CreditCard,
  },
  outstanding: {
    gradient: "from-amber-400 to-orange-600",
    icon: AlertTriangle,
  },
  collected: {
    gradient: "from-emerald-400 to-green-600",
    icon: CheckCircle2,
  },
  all: {
    gradient: "from-violet-400 to-purple-600",
    icon: Receipt,
  },
};

function Stat({
  label,
  value,
  tone,
  kind,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
  kind?: string;
}) {
  const cfg = kind ? statGradients[kind] : null;
  const Icon = cfg?.icon;
  const barColor =
    tone === "success"
      ? "var(--color-success)"
      : tone === "warning"
        ? "var(--color-warning)"
        : "var(--color-primary)";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 opacity-[0.06] transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.1]">
        <div className={`h-full w-full rounded-full bg-gradient-to-br ${cfg?.gradient || "from-primary to-primary/50"}`} />
      </div>
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</span>
          {Icon && (
            <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${cfg?.gradient || "from-primary to-primary/50"} text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <Icon className="h-[18px] w-[18px]" />
            </div>
          )}
        </div>
        <div className={cn(
          "mt-2 text-2xl font-bold tracking-tight",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          !tone && cfg && `bg-gradient-to-br ${cfg.gradient} bg-clip-text text-transparent`,
        )}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md animate-in zoom-in-95 fade-in rounded-2xl border border-border/50 bg-card p-6 shadow-2xl shadow-black/10 duration-200">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</span>
      {children}
    </label>
  );
}

function DialogFooter({
  onCancel,
  onSubmit,
  submitLabel,
  disabled,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-end gap-3">
      <button
        onClick={onCancel}
        className="rounded-xl border border-border/60 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="rounded-xl bg-gradient-to-r from-primary to-primary/80 px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/70 hover:shadow-md disabled:opacity-50 disabled:shadow-none"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "success" | "warning";
}) {
  return (
    <div className="flex justify-between">
      <span className={cn("text-muted-foreground", bold && "font-semibold text-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          bold && "font-semibold",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* keep imported icons to avoid unused warnings */
void Ban;
void Moon;
void CheckCircle2;
void AlertTriangle;
void Receipt;
void Smartphone;
void Loader2;
void Search;
void User;
void Home;
void FileText;
void Wallet;
void ChevronRight;
void Clock;
