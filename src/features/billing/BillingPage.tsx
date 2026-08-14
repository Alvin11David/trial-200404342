import { useNavigate, useSearchParams, Link } from "react-router-dom";

import { useMemo, useState } from "react";
import {
  Building2,
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
  Split,
  Percent,
  ArrowRight,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Mail,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHARGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  ALL_PAYMENT_METHODS,
  addCharge,
  addDiscount,
  addPayment,
  confirmPayment,
  failPayment,
  simulateGatewayConfirm,
  processRefund,
  voidCharge,
  transferCharge,
  transferFolio,
  splitFolio,
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
  createApprovalRequest,
  approveRequest,
  rejectRequest,
  pendingApprovals,
  type FolioCharge,
  type FolioChargeType,
  type FolioChargeSource,
  type Payment,
  type PaymentMethod,
  type PaymentStatus,
  type FolioStatus,
  type ApprovalRequest,
  generateInvoice,
  invoiceLineItemsFor,
  type MiscChargeItem,
  type GroupBlock,
  type Invoice,
  type Reservation,
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
import RecordPaymentDialog from "@/features/frontdesk/RecordPaymentDialog";

export default function BillingPage() {
  const [searchParams] = useSearchParams();
  const folio = searchParams.get("folio") || undefined;
  const invoice = searchParams.get("invoice") || undefined;
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
function useCanDiscount(): boolean {
  const { role } = useRole();
  return role === "Front Desk" || role === "Accountant" || role === "Owner / GM" || role === "POS / Cashier";
}
function useCanSplit(): boolean {
  const { role } = useRole();
  return role === "Front Desk" || role === "Accountant" || role === "Owner / GM";
}
function useCanTransfer(): boolean {
  const { role } = useRole();
  return role === "Front Desk" || role === "Accountant" || role === "Owner / GM";
}

function FolioList() {
  const folios = useStore((s) => s.folios);
  const reservations = useStore((s) => s.reservations);
  const charges = useStore((s) => s.charges);
  const payments = useStore((s) => s.payments);
  const navigate = useNavigate();

  const { role } = useRole();
  const isOwnerOrGM = role === "Owner / GM";
  type FolioTab = "active" | "pending" | "settled" | "all" | "approvals" | "post-stay";
  const [tab, setTab] = useState<FolioTab>("active");
  const [q, setQ] = useState("");
  const [payFolio, setPayFolio] = useState<{ reservationId: string; folioId: string } | null>(null);

  const totals = useMemo(() => {
    const open = folios.filter(
      (f) => f.status === "open",
    );
    const totalOpen = open.reduce((s, f) => s + folioBalance(f.id), 0);
    return {
      open: totalOpen,
      count: open.length,
      settled: folios.filter((f) => f.status === "settled").length,
      postStay: folios.filter((f) => f.status === "post_stay").length,
      collectedToday: paymentsToday(),
      totalOutstanding: totalOutstanding(),
    };
  }, [folios]);

  const rows = useMemo(() => {
    const filterStatuses: FolioStatus[] =
      tab === "active"
        ? ["open"]
        : tab === "pending"
          ? ["transferred_to_ledger", "transferred_to_agent"]
          : tab === "settled"
            ? ["settled", "void"]
            : tab === "post-stay"
              ? ["post_stay"]
              : ["post_stay", "settled", "void", "transferred_to_ledger", "transferred_to_agent"];
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

  const postStayFolios = useMemo(
    () =>
      folios
        .filter((f) => f.status === "post_stay")
        .map((f) => {
          const res = reservations.find((r) => r.id === f.reservationId);
          const totalCharges = charges
            .filter((c) => c.folioId === f.id && !c.voided)
            .reduce((s, c) => s + c.amount, 0);
          const totalPayments = payments
            .filter((p) => p.folioId === f.id && p.status === "confirmed")
            .reduce((s, p) => s + p.amount, 0);
          return { folio: f, reservation: res, balance: folioBalance(f.id), totalCharges, totalPayments };
        })
        .sort((a, b) => (a.reservation?.checkOut ?? "").localeCompare(b.reservation?.checkOut ?? "")),
    [folios, reservations, charges, payments],
  );

  const balanceColor = (bal: number) =>
    bal <= 0 ? "text-success" : bal > 0 && bal <= 500_000 ? "text-warning" : "text-destructive";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Billing &amp; Folios</h1>
              <p className="text-sm text-muted-foreground">
                Open Folios · City Ledger · Private Ledger — folios, charges, payments and invoices
              </p>
            </div>
          </div>
        </div>
        <Link
          to="/billing/master"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:text-primary hover:shadow-md"
        >
          <Building2 className="h-4 w-4" /> Master Billing
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Active folios" value={totals.count.toString()} kind="active" />
        <Stat label="Total outstanding" value={fmtUGX(totals.open)} tone="warning" kind="outstanding" />
        <Stat label="All outstanding" value={fmtUGX(totals.totalOutstanding)} tone="warning" kind="all" />
        <Stat label="Collected today" value={fmtUGX(totals.collectedToday)} tone="success" kind="collected" />
      </div>

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
            {(["active", "post-stay", "settled", "pending", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  tab === t
                    ? t === "post-stay"
                      ? "bg-warning text-warning-foreground shadow-sm"
                      : "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-background/50",
                )}
              >
                {t === "active"
                  ? "Open Folios"
                  : t === "post-stay"
                    ? "City Ledger"
                    : t === "settled"
                      ? "Private Ledger"
                      : t === "pending"
                        ? "Transferred"
                        : "All Closed"}
                {t === "post-stay" && totals.postStay > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-warning/20 px-1 text-[10px] font-bold text-warning">
                    {totals.postStay}
                  </span>
                )}
              </button>
            ))}
            {isOwnerOrGM && (
              <button
                onClick={() => setTab("approvals")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  tab === "approvals"
                    ? "bg-amber text-amber-foreground shadow-sm"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-background/50",
                )}
              >
                Approvals
              </button>
            )}
          </div>
        </div>
      </div>

      {tab === "all" && (
        <p className="text-xs text-muted-foreground">
          All checked-out folios — City Ledger, Private Ledger, and Transferred. Use search to find a
          specific guest or folio.
        </p>
      )}
      {tab === "settled" && (
        <p className="text-xs text-muted-foreground">
          Fully settled guest folios — payment received in full at the desk.
        </p>
      )}

      {tab === "approvals" ? (
        <ApprovalsPanel />
      ) : tab === "post-stay" ? (
        postStayFolios.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30 py-24">
            <Wallet className="mb-3 h-12 w-12 text-muted-foreground/20" />
            <p className="text-sm font-medium text-muted-foreground">
              No City Ledger folios. All checked-out guests have settled their accounts.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {postStayFolios.map(({ folio, reservation, balance, totalCharges, totalPayments }) => (
              <div
                key={folio.id}
                className="relative overflow-hidden rounded-2xl border border-amber-200/40 bg-card shadow-sm dark:border-amber-900/20"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-400 to-orange-500" />
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 pl-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-500 ring-1 ring-amber-500/20">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold">{reservation?.guestName ?? "—"}</span>
                        <FolioStatusBadge status={folio.status} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/60">
                        {reservation?.roomId && (
                          <span className="inline-flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            Room {roomById(reservation.roomId)?.roomNumber ?? reservation.roomId}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Checked out {reservation?.checkOut ?? "—"}
                        </span>
                        <span className="font-mono">{folio.id}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                        <span className="text-muted-foreground">
                          Charges <span className="font-semibold text-foreground">{fmtUGX(totalCharges)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Paid <span className="font-semibold text-success">{fmtUGX(totalPayments)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Balance{" "}
                          <span className={cn("font-bold", balance > 0.5 ? "text-destructive" : "text-success")}>
                            {fmtUGX(balance)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => setPayFolio({ reservationId: folio.reservationId, folioId: folio.id })}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-emerald-500/90 hover:to-green-600/90"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Record Payment
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : rows.length === 0 ? (
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
                navigate(`/billing?folio=${folio.id}`)
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

      {payFolio && (
        <RecordPaymentDialog
          reservationId={payFolio.reservationId}
          folioId={payFolio.folioId}
          onClose={() => setPayFolio(null)}
        />
      )}
    </div>
  );
}

function ApprovalsPanel() {
  const approvalRequests = useStore((s) => s.approvalRequests);
  const folios = useStore((s) => s.folios);
  const navigate = useNavigate();
  const actor = useActorName();
  const actorRole = useActorRole();
  const { role } = useRole();
  const isGM = role === "Owner / GM";
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pending = approvalRequests.filter((r) => r.status === "pending");
  const history = approvalRequests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      {pending.length === 0 && history.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30 py-24">
          <ShieldCheck className="mb-3 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm font-medium text-muted-foreground">No approval requests</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="rounded-2xl border border-amber-200/50 bg-amber-50/30 shadow-sm dark:border-amber-900/20 dark:bg-amber-950/10">
              <div className="flex items-center gap-2 border-b border-amber-200/50 px-5 py-3 dark:border-amber-900/20">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold">Pending Approvals</h3>
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {pending.length}
                </span>
              </div>
              <div className="divide-y divide-amber-100/50 dark:divide-amber-900/10">
                {pending.map((req) => {
                  const folio = folios.find((f) => f.id === req.folioId);
                  return (
                    <div key={req.id} className="flex items-start justify-between px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium capitalize">{req.action.replace(/_/g, " ")}</span>
                          <span className="rounded-full bg-amber-100/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                            Pending
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Folio {req.folioId}{folio ? ` — ${folio.reservationId}` : ""} &middot; by {req.requestedBy} ({req.requestedByRole}) &middot;{" "}
                          {new Date(req.requestedAt).toLocaleString()}
                        </p>
                      </div>
                      {isGM && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              approveRequest(req.id, actor, actorRole);
                              toast.success(`${req.action.replace(/_/g, " ")} approved`);
                            }}
                            className="rounded-lg bg-success/10 p-1.5 text-success transition-colors hover:bg-success/20"
                            title="Approve"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          {rejectingId === req.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason..."
                                className="w-28 rounded border border-border px-1.5 py-1 text-[10px] outline-none"
                              />
                              <button
                                onClick={() => {
                                  if (rejectReason.trim()) {
                                    rejectRequest(req.id, actor, rejectReason.trim());
                                    toast.success("Request rejected");
                                    setRejectingId(null);
                                    setRejectReason("");
                                  }
                                }}
                                className="rounded-lg bg-destructive/10 p-1.5 text-destructive transition-colors hover:bg-destructive/20"
                                title="Confirm reject"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRejectingId(req.id)}
                              className="rounded-lg bg-destructive/10 p-1.5 text-destructive transition-colors hover:bg-destructive/20"
                              title="Reject"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="border-b border-border/50 px-5 py-3">
                <h3 className="text-sm font-semibold">Approval History</h3>
              </div>
              <div className="divide-y divide-border/40">
                {history.map((req) => (
                  <div key={req.id} className="flex items-start justify-between px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{req.action.replace(/_/g, " ")}</span>
                        <span className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                          req.status === "approved"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive",
                        )}>
                          {req.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Folio {req.folioId} &middot; by {req.requestedBy} ({req.requestedByRole})
                        {req.approvedBy && ` &middot; ${req.status === "approved" ? "approved" : "rejected"} by ${req.approvedBy}`}
                        {req.rejectionReason && <span className="text-destructive"> &middot; Reason: {req.rejectionReason}</span>}
                        &middot; {new Date(req.requestedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/billing?folio=${req.folioId}`)}
                      className="rounded-lg p-1.5 text-muted-foreground/40 hover:text-primary"
                      title="View folio"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const statusDot: Record<FolioStatus, string> = {
  open: "bg-blue-500",
  post_stay: "bg-amber-500",
  settled: "bg-emerald-500",
  transferred_to_ledger: "bg-purple-500",
  transferred_to_agent: "bg-purple-500",
  void: "bg-destructive",
};

const statusBadge: Record<FolioStatus, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  post_stay: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  settled: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  transferred_to_ledger: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800",
  transferred_to_agent: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800",
  void: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
};

const folioStatusLabel: Record<FolioStatus, string> = {
  ...FOLIO_STATUS_LABEL,
  post_stay: "City Ledger",
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
      {folioStatusLabel[status]}
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
  const [showSplit, setShowSplit] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showTransfer, setShowTransfer] = useState<string | null>(null);
  const [showTransferFolio, setShowTransferFolio] = useState(false);

  const canPost = useCanPostCharge();
  const canVoid = useCanVoid();
  const canSettle = useCanSettle();
  const canAudit = useCanNightAudit();
  const canRefund = useCanRefund();
  const canDiscount = useCanDiscount();
  const canSplit = useCanSplit();
  const canTransfer = useCanTransfer();
  const actor = useActorName();
  const actorRole = useActorRole();

  const folio = folios.find((f) => f.id === folioId);
  const allApprovalRequests = useStore((s) => s.approvalRequests);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  if (!folio) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="text-sm text-muted-foreground">Folio not found.</p>
        <Link
          to="/billing"
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

  const folioRequests = allApprovalRequests.filter((r) => r.folioId === folioId);

  const folioCharges = charges.filter((c) => c.folioId === folioId);
  const folioPayments = payments.filter((p) => p.folioId === folioId);
  const totalCharges = folioCharges.filter((c) => !c.voided).reduce((s, c) => s + c.amount, 0);
  const voidedAmount = folioCharges.filter((c) => c.voided).reduce((s, c) => s + c.amount, 0);
  const confirmedPayments = folioPayments
    .filter((p) => p.status === "confirmed")
    .reduce((s, p) => s + p.amount, 0);
  const totalPayments = confirmedPayments;
  const balance = totalCharges - totalPayments;

  const isOpen = folio.status === "open";
  const canReceivePayment = isOpen || folio.status === "post_stay" || folio.status === "transferred_to_ledger" || folio.status === "transferred_to_agent";

  const balanceColor =
    balance <= 0
      ? "text-success"
      : balance > 0 && balance <= 500_000
        ? "text-warning"
        : "text-destructive";

  const isFrontDesk = actorRole === "Front Desk";

  const handleVoidCharge = (chargeId: string, reason: string) => {
    if (isFrontDesk) {
      createApprovalRequest("void_charge", folioId, { chargeId, reason }, actor, actorRole);
      setShowVoid(null);
      toast.success("Void request sent for approval");
    } else {
      voidCharge(folioId, chargeId, reason, actor, actorRole);
      setShowVoid(null);
    }
  };

  const handleCompCharge = (chargeId: string) => {
    if (isFrontDesk) {
      createApprovalRequest("complimentary", folioId, { chargeId }, actor, actorRole);
      toast.success("Complimentary request sent for approval");
    } else {
      voidCharge(folioId, chargeId, "Complimentary", actor, actorRole);
      toast.success("Charge marked as complimentary");
    }
  };

  const handleTransferCharge = (chargeId: string, targetFolioId: string) => {
    if (isFrontDesk) {
      createApprovalRequest("transfer_charge", folioId, { chargeId, targetFolioId }, actor, actorRole);
      setShowTransfer(null);
      toast.success("Transfer request sent for approval");
    } else {
      transferCharge(chargeId, targetFolioId, actor, actorRole);
      setShowTransfer(null);
      toast.success("Charge transferred");
    }
  };

  const handleSplitFolio = (chargeIdsToMove: string[]) => {
    if (isFrontDesk) {
      createApprovalRequest("split_folio", folioId, { chargeIdsToMove }, actor, actorRole);
      setShowSplit(false);
      toast.success("Split request sent for approval");
    } else {
      const newFolioId = splitFolio(folioId, chargeIdsToMove, actor, actorRole);
      setShowSplit(false);
      if (newFolioId) {
        toast.success(`Split created: ${newFolioId}`);
      }
    }
  };

  const handleAddDiscount = (description: string, amount: number, isPercentage: boolean) => {
    if (isFrontDesk) {
      createApprovalRequest("discount", folioId, { description, amount, isPercentage }, actor, actorRole);
      setShowDiscount(false);
      toast.success("Discount request sent for approval");
    } else {
      addDiscount(folioId, { description, amount, isPercentage, postedBy: actor });
      setShowDiscount(false);
      toast.success("Discount applied");
    }
  };

  const handleTransferFolio = (targetFolioId: string) => {
    if (isFrontDesk) {
      createApprovalRequest("transfer_folio", folioId, { targetFolioId }, actor, actorRole);
      setShowTransferFolio(false);
      toast.success("Transfer folio request sent for approval");
    } else {
      transferFolio(folioId, targetFolioId, actor, actorRole);
      setShowTransferFolio(false);
      toast.success("Folio transferred");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/billing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to folios
        </Link>
        <div className="flex items-center gap-2">
          {canSplit && isOpen && (
            <button
              onClick={() => setShowSplit(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-primary/40"
            >
              <Split className="h-3.5 w-3.5" /> Split folio
            </button>
          )}
          {canTransfer && isOpen && (
            <button
              onClick={() => setShowTransferFolio(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-primary/40"
            >
              <ArrowRight className="h-3.5 w-3.5" /> Transfer folio
            </button>
          )}
          {canDiscount && isOpen && (
            <button
              onClick={() => setShowDiscount(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-primary/40"
            >
              <Percent className="h-3.5 w-3.5" /> Discount
            </button>
          )}
          {canAudit && isOpen && (
            <button
              onClick={() => setShowNightAudit(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-primary/40"
            >
              <Moon className="h-3.5 w-3.5" /> Night audit
            </button>
          )}
          <Link
            to={`/billing?invoice=${folio.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-primary/40"
          >
            <Printer className="h-3.5 w-3.5" /> View invoice
          </Link>
        </div>
      </div>

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
                    <Link to={`/reservations/${res.id}`} className="text-primary hover:underline">
                      {res.id}
                    </Link>
                  ) : "—"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground/60">
                  <Clock className="h-3.5 w-3.5" />
                  {res?.checkIn} → {res?.checkOut}
                </span>
              </div>
              {(folio.settledAt ?? folio.closedAt) && (
                <span className="text-[10px] text-muted-foreground/50">
                  Settled {new Date(folio.settledAt ?? folio.closedAt!).toLocaleDateString()}
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

      {folioRequests.length > 0 && (actorRole === "Owner / GM" || isFrontDesk) && (
        <div className="rounded-2xl border border-amber-200/50 bg-amber-50/30 shadow-sm dark:border-amber-900/20 dark:bg-amber-950/10">
          <div className="flex items-center gap-2 border-b border-amber-200/50 px-5 py-3 dark:border-amber-900/20">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold">Approval Requests</h3>
            <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {folioRequests.filter((r) => r.status === "pending").length} pending
            </span>
          </div>
          <div className="divide-y divide-amber-100/50 dark:divide-amber-900/10">
            {folioRequests.map((req) => (
              <div key={req.id} className="flex items-start justify-between px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{req.action.replace(/_/g, " ")}</span>
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                      req.status === "pending"
                        ? "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                        : req.status === "approved"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive",
                    )}>
                      {req.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    by {req.requestedBy} ({req.requestedByRole}) &middot;{" "}
                    {new Date(req.requestedAt).toLocaleString()}
                    {req.approvedBy && req.status === "approved" && <> &middot; approved by {req.approvedBy}</>}
                    {req.rejectionReason && (
                      <span className="text-destructive"> &middot; rejected: {req.rejectionReason}</span>
                    )}
                  </p>
                </div>
                {actorRole === "Owner / GM" && req.status === "pending" && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => { approveRequest(req.id, actor, actorRole); toast.success(`${req.action.replace(/_/g, " ")} approved`); }}
                      className="rounded-lg bg-success/10 p-1.5 text-success transition-colors hover:bg-success/20"
                      title="Approve"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    {rejectingId === req.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason..."
                          className="w-28 rounded border border-border px-1.5 py-1 text-[10px] outline-none"
                        />
                        <button
                          onClick={() => {
                            if (rejectReason.trim()) {
                              rejectRequest(req.id, actor, rejectReason.trim());
                              toast.success("Request rejected");
                              setRejectingId(null);
                              setRejectReason("");
                            }
                          }}
                          className="rounded-lg bg-destructive/10 p-1.5 text-destructive transition-colors hover:bg-destructive/20"
                          title="Confirm reject"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRejectingId(req.id)}
                        className="rounded-lg bg-destructive/10 p-1.5 text-destructive transition-colors hover:bg-destructive/20"
                        title="Reject"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isFrontDesk ? (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border/50 px-5 py-4">
            <h3 className="text-sm font-semibold">Folio Summary</h3>
          </div>
          <div className="space-y-3 px-5 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total charges</span>
              <span className="font-semibold">{fmtUGX(totalCharges)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total payments</span>
              <span className="font-semibold text-success">{fmtUGX(totalPayments)}</span>
            </div>
            <div className="flex justify-between border-t border-border/40 pt-3 text-base">
              <span className="font-bold">Balance</span>
              <span className={cn("font-bold", balanceColor)}>{fmtUGX(balance)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
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
                    {!c.voided && isOpen && canTransfer && (
                      <button
                        onClick={() => setShowTransfer(c.id)}
                        className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-primary/10 hover:text-primary"
                        title="Transfer to another folio"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
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

          <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold">Payments</h3>
                <p className="text-[11px] text-muted-foreground/60">
                  {folioPayments.length} transactions
                </p>
              </div>
              {canReceivePayment && (
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
                      {isOpen && p.status === "confirmed" && !p.refundOf && canRefund && (
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
      )}

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

      {balance > 0 && !isOpen && (folio.status === "transferred_to_ledger" || folio.status === "transferred_to_agent") && (
        <div className="rounded-2xl border border-blue-200/30 bg-gradient-to-br from-blue-500/[0.04] to-transparent p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-blue-500" />
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Transferred to ledger — <strong>{fmtUGX(balance)}</strong> outstanding
          </p>
          <p className="mt-0.5 text-[11px] text-blue-500/60">
            Record a payment below to reduce the corporate account balance.
          </p>
        </div>
      )}

      {canSettle && isOpen && balance > 0 && (
        <div className="rounded-2xl border border-amber-200/30 bg-gradient-to-br from-amber-500/[0.04] to-transparent p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-500" />
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Outstanding balance of <strong>{fmtUGX(balance)}</strong> remaining. Record a payment to clear before the guest departs.
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
          actorRole={actorRole}
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
          folioId={folio.id}
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
      {showSplit && (
        <SplitFolioDialog
          folioId={folio.id}
          charges={folioCharges.filter((c) => !c.voided)}
          onConfirm={handleSplitFolio}
          onClose={() => setShowSplit(false)}
        />
      )}
      {showDiscount && (
        <AddDiscountDialog
          totalCharges={totalCharges}
          onConfirm={handleAddDiscount}
          onClose={() => setShowDiscount(false)}
        />
      )}
      {showTransfer && (
        <TransferChargeDialog
          chargeId={showTransfer}
          charge={folioCharges.find((c) => c.id === showTransfer)!}
          currentFolioId={folio.id}
          onConfirm={handleTransferCharge}
          onClose={() => setShowTransfer(null)}
        />
      )}

      {showTransferFolio && (
        <TransferFolioDialog
          sourceFolioId={folio.id}
          sourceGuestName={res?.guestName ?? ""}
          onConfirm={handleTransferFolio}
          onClose={() => setShowTransferFolio(false)}
        />
      )}
    </div>
  );
}

function FolioStatusBadgeMini({ status }: { status: FolioStatus }) {
  const dotColor: Record<FolioStatus, string> = {
    open: "bg-blue-500",
    post_stay: "bg-amber-500",
    settled: "bg-emerald-500",
    transferred_to_ledger: "bg-purple-500",
    transferred_to_agent: "bg-purple-500",
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
  const { role } = useRole();
  const isFrontDesk = role === "Front Desk";
  const miscChargeItems = useStore((s) => s.miscChargeItems.filter((m) => m.isActive));
  const folios = useStore((s) => s.folios);
  const [type, setType] = useState<FolioChargeType>("misc");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);

  const isMiscLocked = type === "misc" && !customMode;
  const isFolioOpen = folios.find((f) => f.id === folioId)?.status === "open";

  const selectMiscItem = (item: MiscChargeItem) => {
    setSelectedItemId(item.id);
    setDescription(item.name);
    setAmount(item.defaultPrice);
    setCustomMode(false);
  };

  const enableCustom = () => {
    setSelectedItemId(null);
    setCustomMode(true);
    setDescription("");
    setAmount("");
  };

  const canSubmit = (): boolean => {
    if (!description || !amount || Number(amount) <= 0) return false;
    if (type === "misc" && !selectedItemId && !customMode) return false;
    return true;
  };

  const submit = () => {
    if (!canSubmit()) return;
    if (!isFolioOpen) { toast.error("Cannot add charges to a closed folio."); return; }
    addCharge(folioId, { type, description, amount: Number(amount), postedBy: actor });
    onClose();
  };

  const handleTypeChange = (v: string) => {
    setType(v as FolioChargeType);
    if (v !== "misc") {
      setSelectedItemId(null);
      setCustomMode(false);
    }
  };

  const groupedMiscItems = useMemo(() => {
    const grouped: Record<string, MiscChargeItem[]> = {};
    for (const item of miscChargeItems) {
      const key = item.departmentCode ?? "";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }
    return grouped;
  }, [miscChargeItems]);

  return (
    <Modal title="Add charge" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Type">
          <Select value={type} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(CHARGE_TYPE_LABEL) as [FolioChargeType, string][]).filter(([k]) => k !== "discount").map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {type === "misc" && miscChargeItems.length > 0 && !customMode && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Select a service
            </label>
            <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {["POOL", "KPOOL", "REC", "BIZ", "CONF", "HC", "SPA", "REST", "BAR", "MISC", ""].filter((k) => groupedMiscItems[k]).map((dept) => {
                const deptLabel: Record<string, string> = {
                  POOL: "Pool", KPOOL: "Kids Pool", REC: "Recreation",
                  BIZ: "Business Center", CONF: "Conference",
                  HC: "Health Club", SPA: "Spa", REST: "Restaurant", BAR: "Bar", MISC: "Misc",
                };
                return (
                  <div key={dept}>
                    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1">
                      {deptLabel[dept] ?? "Other"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {groupedMiscItems[dept].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectMiscItem(item)}
                          className={cn(
                            "rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:bg-muted",
                            selectedItemId === item.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          {item.name} — {fmtUGX(item.defaultPrice)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Field label="Description">
          {isMiscLocked ? (
            <div className="flex h-10 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm font-medium text-foreground">
              {description}
            </div>
          ) : (
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Airport pickup"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          )}
        </Field>
        <Field label="Amount (UGX)">
          {isMiscLocked ? (
            <div className="flex h-10 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm font-medium text-foreground">
              {fmtUGX(Number(amount))}
            </div>
          ) : (
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              min={0}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          )}
        </Field>

        {type === "misc" && !customMode && !isFrontDesk && (
          <div className="text-center">
            <button
              type="button"
              onClick={enableCustom}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Service not listed? Add custom charge
            </button>
          </div>
        )}
      </div>
      <DialogFooter
        onCancel={onClose}
        onSubmit={submit}
        submitLabel="Post charge"
        disabled={!canSubmit()}
      />
    </Modal>
  );
}

const FRONT_DESK_METHODS: PaymentMethod[] = ["cash", "card", "charge_to_room"];

function AddPaymentDialog({
  folioId,
  balance,
  actor,
  actorRole,
  onClose,
}: {
  folioId: string;
  balance: number;
  actor: string;
  actorRole: string;
  onClose: () => void;
}) {
  const folios = useStore((s) => s.folios);
  const isFrontDesk = actorRole === "Front Desk";
  const availableMethods = isFrontDesk ? FRONT_DESK_METHODS : ALL_PAYMENT_METHODS;
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
  const folioStatus = folios.find((f) => f.id === folioId)?.status;
  const canPay = folioStatus === "open" || folioStatus === "transferred_to_ledger" || folioStatus === "transferred_to_agent";

  const resetTendered = () => {
    setTendered("");
  };

  const submit = () => {
    if (!amount || amount <= 0) return;
    if (insufficientTender) return;
    if (!canPay) { toast.error("Cannot record payments on a closed folio."); return; }
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
            <SelectTrigger className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {availableMethods.map((k) => (
                <SelectItem key={k} value={k} className="rounded-lg">
                  {PAYMENT_METHOD_LABEL[k]}
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
        {method === "charge_to_room" && (
          <p className="rounded-md border border-info/20 bg-info/10 px-3 py-2 text-[11px] text-info">
            Amount will be charged to the guest's room folio as a deferred payment.
          </p>
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

function SplitFolioDialog({
  folioId,
  charges,
  onConfirm,
  onClose,
}: {
  folioId: string;
  charges: FolioCharge[];
  onConfirm: (chargeIdsToMove: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const totalToMove = charges
    .filter((c) => selected.has(c.id))
    .reduce((s, c) => s + c.amount, 0);
  const totalRemaining = charges
    .filter((c) => !selected.has(c.id))
    .reduce((s, c) => s + c.amount, 0);

  return (
    <Modal title="Split folio" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-muted/30 p-3 text-sm">
          <p className="text-xs text-muted-foreground">
            Select charges to move to a <strong>new folio</strong>. Charges not selected stay on{" "}
            <strong>{folioId}</strong>.
          </p>
        </div>
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {charges.map((c) => (
            <li key={c.id}>
              <label
                htmlFor={`split-${c.id}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/30"
              >
                <input
                  id={`split-${c.id}`}
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{c.description}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {CHARGE_TYPE_LABEL[c.type]}
                  </span>
                </div>
                <span className="text-sm font-semibold tabular-nums">{fmtUGX(c.amount)}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs">
          <div>
            <p className="text-muted-foreground">
              Moving: <strong className="text-foreground">{selected.size} charges</strong> (
              {fmtUGX(totalToMove)})
            </p>
            <p className="text-muted-foreground">
              Staying: <strong className="text-foreground">{charges.length - selected.size} charges</strong> (
              {fmtUGX(totalRemaining)})
            </p>
          </div>
        </div>
      </div>
      <DialogFooter
        onCancel={onClose}
        onSubmit={() => onConfirm(Array.from(selected))}
        submitLabel={`Split ${selected.size} charge${selected.size !== 1 ? "s" : ""} → new folio`}
        disabled={selected.size === 0}
      />
    </Modal>
  );
}

function AddDiscountDialog({
  totalCharges,
  onConfirm,
  onClose,
}: {
  totalCharges: number;
  onConfirm: (description: string, amount: number, isPercentage: boolean) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<"fixed" | "percentage">("fixed");
  const [value, setValue] = useState<number | "">("");
  const [description, setDescription] = useState("");

  const discountAmount =
    type === "percentage" && value
      ? Math.round((totalCharges * Number(value)) / 100)
      : Number(value) || 0;

  return (
    <Modal title="Apply discount" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Discount type">
          <div className="flex gap-2">
            <button
              onClick={() => setType("fixed")}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                type === "fixed"
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-background text-muted-foreground",
              )}
            >
              Fixed amount
            </button>
            <button
              onClick={() => setType("percentage")}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                type === "percentage"
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-background text-muted-foreground",
              )}
            >
              Percentage
            </button>
          </div>
        </Field>
        <Field label={type === "fixed" ? "Discount amount (UGX)" : "Percentage (%)"}>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
            min={0}
            max={type === "percentage" ? 100 : undefined}
            placeholder={type === "fixed" ? "e.g. 50000" : "e.g. 10"}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </Field>
        {discountAmount > 0 && (
          <p className="rounded-md border border-info/20 bg-info/10 px-3 py-2 text-[11px] text-info">
            {type === "percentage"
              ? `${value}% of ${fmtUGX(totalCharges)} = ${fmtUGX(discountAmount)}`
              : `Discount of ${fmtUGX(discountAmount)}`}
          </p>
        )}
        {discountAmount > totalCharges && (
          <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
            Discount cannot exceed total charges ({fmtUGX(totalCharges)})
          </p>
        )}
        <Field label="Reason / description">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Loyalty discount, Early booking"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </Field>
      </div>
      <DialogFooter
        onCancel={onClose}
        onSubmit={() =>
          onConfirm(description || `Discount (${type === "percentage" ? `${value}%` : fmtUGX(discountAmount)})`, discountAmount, type === "percentage")
        }
        submitLabel="Apply discount"
        disabled={!value || Number(value) <= 0 || discountAmount > totalCharges}
      />
    </Modal>
  );
}

function TransferChargeDialog({
  chargeId,
  charge,
  currentFolioId,
  onConfirm,
  onClose,
}: {
  chargeId: string;
  charge: FolioCharge;
  currentFolioId: string;
  onConfirm: (chargeId: string, targetFolioId: string) => void;
  onClose: () => void;
}) {
  const folios = useStore((s) => s.folios);
  const reservations = useStore((s) => s.reservations);
  const [target, setTarget] = useState("");

  const openFolios = folios.filter(
    (f) => f.id !== currentFolioId && f.status === "open",
  );

  return (
    <Modal title="Transfer charge" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-muted/30 p-3 text-sm">
          <div className="font-medium">{charge.description}</div>
          <div className="text-muted-foreground">
            {fmtUGX(charge.amount)} · {CHARGE_TYPE_LABEL[charge.type]} · {charge.date}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Transfer this charge from <strong>{currentFolioId}</strong> to another open folio.
          </p>
        </div>
        <Field label="Target folio">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            <option value="">Select a folio…</option>
            {openFolios.map((f) => {
              const res = reservations.find((r) => r.id === f.reservationId);
              return (
                <option key={f.id} value={f.id}>
                  {f.id} — {res?.guestName ?? "—"} (Room {res?.roomId ?? "—"})
                </option>
              );
            })}
          </select>
        </Field>
        {openFolios.length === 0 && (
          <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
            No other open folios available to transfer to.
          </p>
        )}
      </div>
      <DialogFooter
        onCancel={onClose}
        onSubmit={() => onConfirm(chargeId, target)}
        submitLabel="Transfer charge"
        disabled={!target}
      />
    </Modal>
  );
}

function TransferFolioDialog({
  sourceFolioId,
  sourceGuestName,
  onConfirm,
  onClose,
}: {
  sourceFolioId: string;
  sourceGuestName: string;
  onConfirm: (targetFolioId: string) => void;
  onClose: () => void;
}) {
  const folios = useStore((s) => s.folios);
  const reservations = useStore((s) => s.reservations);
  const charges = useStore((s) => s.charges);
  const [target, setTarget] = useState("");

  const openFolios = folios.filter(
    (f) => f.id !== sourceFolioId && f.status === "open",
  );

  const sourceCharges = charges.filter(
    (c) => c.folioId === sourceFolioId && !c.voided,
  );
  const totalToTransfer = sourceCharges.reduce((s, c) => s + c.amount, 0);

  return (
    <Modal title="Transfer entire folio" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-muted/30 p-3 text-sm">
          <div className="font-medium">{sourceGuestName}</div>
          <div className="text-muted-foreground">
            {sourceFolioId} · {sourceCharges.length} charge{sourceCharges.length !== 1 ? "s" : ""} · {fmtUGX(totalToTransfer)}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Transfer all charges from <strong>{sourceFolioId}</strong> to another open folio. The source folio will be closed.
          </p>
        </div>
        <Field label="Target folio">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            <option value="">Select a folio…</option>
            {openFolios.map((f) => {
              const res = reservations.find((r) => r.id === f.reservationId);
              return (
                <option key={f.id} value={f.id}>
                  {f.id} — {res?.guestName ?? "—"} (Room {res?.roomId ?? "—"})
                </option>
              );
            })}
          </select>
        </Field>
        {sourceCharges.length === 0 && (
          <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
            This folio has no charges to transfer.
          </p>
        )}
        {openFolios.length === 0 && sourceCharges.length > 0 && (
          <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
            No other open folios available to transfer to.
          </p>
        )}
      </div>
      <DialogFooter
        onCancel={onClose}
        onSubmit={() => onConfirm(target)}
        submitLabel="Transfer folio"
        disabled={!target || sourceCharges.length === 0}
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
  folioId,
  payment,
  actor,
  actorRole,
  onClose,
}: {
  folioId: string;
  payment: Payment;
  actor: string;
  actorRole: string;
  onClose: () => void;
}) {
  const folios = useStore((s) => s.folios);
  const [refundAmount, setRefundAmount] = useState(payment.amount);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleRefund = () => {
    const isFolioOpen = folios.find((f) => f.id === folioId)?.status === "open";
    if (!isFolioOpen) { toast.error("Cannot process refunds on a closed folio."); return; }
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
    if (actorRole === "Owner / GM") {
      processRefund(payment.id, refundAmount, reason.trim(), actor, actorRole);
      toast.success("Refund processed.");
    } else {
      createApprovalRequest("refund", folioId, { paymentId: payment.id, refundAmount, reason: reason.trim() }, actor, actorRole);
      toast.success("Refund request sent for Owner approval.");
    }
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
        {actorRole !== "Owner / GM" && (
          <p className="rounded-md border border-amber-200/50 bg-amber-50/30 px-3 py-2 text-[11px] text-amber-700 dark:border-amber-900/20 dark:bg-amber-950/10 dark:text-amber-400">
            This refund will require Owner / GM approval.
          </p>
        )}
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
        submitLabel={actorRole === "Owner / GM" ? "Process refund" : "Submit for approval"}
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
          <div className="border-b border-border pb-3 text-center">
            <p className="font-display text-lg font-bold">{tenant.name}</p>
            <p className="text-[11px] text-muted-foreground">{tenant.address}</p>
            <p className="text-[11px] text-muted-foreground">
              {tenant.phone} · {tenant.email}
            </p>
            <p className="text-[11px] text-muted-foreground">TIN: {tenant.tin}</p>
          </div>

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

          {/* Signature section — visible on print */}
          <div className="mt-6 space-y-5 print:block hidden">
            <div className="flex flex-col items-center">
              <span className="block w-[70%] border-b border-foreground h-9" />
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Customer Signature</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="block w-[70%] border-b border-foreground h-9" />
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Cashier / Authorized Signature</span>
            </div>
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
      <style>{`@media print { body { background: white; } header, aside, nav, .print\\:hidden { display: none !important; } .fixed.inset-0 { position: static !important; background: none !important; backdrop-filter: none !important; } .fixed.inset-0 > div { max-width: none !important; box-shadow: none !important; border: none !important; } .fixed.inset-0 button { display: none !important; } main { padding: 0 !important; } }`}</style>
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

  const activeFolios = folios.filter((f) => f.status === "open");
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
  const invoices = useStore((s) => s.invoices);
  const reservations = useStore((s) => s.reservations);
  const tenant = useStore((s) => s.tenant);
  const groupBlocks = useStore((s) => s.groupBlocks);
  const charges = useStore((s) => s.charges);
  const [invoiceFormat, setInvoiceFormat] = useState<"summarised" | "detailed">("summarised");

  const isGroupInvoice = folioId.startsWith("GROUP-");

  if (isGroupInvoice) {
    const groupBlockId = folioId.replace("GROUP-", "");
    const group = groupBlocks.find((g) => g.id === groupBlockId);
    const inv = invoices.find((i) => i.folioId === folioId && !i.isProforma && !i.isCreditNote);
    if (!inv) return <p className="py-20 text-center text-muted-foreground">Group invoice not found. Generate it from Master Billing.</p>;

    const lineItems = invoiceLineItemsFor(inv.id);
    const groupReservations = reservations.filter((r) => r.groupBlockId === groupBlockId);
    const invoiceNo = inv.invoiceNo;
    const issuedAt = inv.issuedAt;

    return (
      <GroupInvoiceView
        inv={inv}
        lineItems={lineItems}
        group={group}
        groupReservations={groupReservations}
        tenant={tenant}
        invoiceNo={invoiceNo}
        issuedAt={issuedAt}
      />
    );
  }

  const folio = folios.find((f) => f.id === folioId);
  if (!folio) return <p className="py-20 text-center text-muted-foreground">Folio not found.</p>;

  let inv = invoices.find((i) => i.folioId === folioId && !i.isProforma && !i.isCreditNote);
  if (!inv && (folio.status === "settled" || folio.status === "transferred_to_ledger" || folio.status === "transferred_to_agent")) {
    inv = generateInvoice(folioId) ?? undefined;
  }

  const res = reservationById(folio.reservationId);
  const lineItems = inv ? invoiceLineItemsFor(inv.id) : [];
  const effectiveVatRate = res?.vatRate ?? 0.18;
  const isInclusive = res?.vatTreatment !== "exclusive";

  const invoiceNo = inv?.invoiceNo ?? folio.id.replace("F-", "INV-");
  const issuedAt = inv?.issuedAt ?? new Date().toISOString();
  const totalTaxable = inv?.totalTaxable ?? 0;
  const totalVat = inv?.totalVat ?? 0;
  const totalAmount = inv?.totalAmount ?? 0;
  const paidAmount = inv?.paidAmount ?? 0;
  const outstanding = inv?.outstandingAmount ?? totalAmount;

  const sourceLabel = (source: string): string => {
    const labels: Record<string, string> = {
      room_auto: "Room Accommodation",
      pos_charge: "Restaurant & Bar",
      minibar_auto: "Minibar",
      manual: "Other Charges",
      service_request: "Service Charges",
      adjustment: "Adjustments",
    };
    if (labels[source]) return labels[source];
    return source
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const folioCharges = charges.filter((c) => c.folioId === folioId && !c.voided);
  const groupedBySource = folioCharges.reduce<Partial<Record<FolioChargeSource, FolioCharge[]>>>((acc, c) => {
    const key = c.chargeSource ?? "manual";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});
  const roomNights =
    res?.checkIn && res?.checkOut
      ? Math.max(0, Math.round((new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / 86400000))
      : (groupedBySource.room_auto?.length ?? 0);
  const roomAutoCharges = groupedBySource.room_auto ?? [];
  const roomAutoTotal = roomAutoCharges.reduce((s, c) => s + (c.grossAmount ?? c.amount), 0);
  const roomAutoRate =
    roomAutoCharges[0]?.unitAmount ?? (roomNights > 0 ? roomAutoTotal / roomNights : undefined);
  const roomNumber = res?.roomId ? roomById(res.roomId)?.roomNumber ?? res.roomId : "—";
  const summarisedRows: { description: string; qty: string; rate: string; amount: number }[] = [];
  for (const [source, items] of Object.entries(groupedBySource)) {
    const total = items.reduce((s, c) => s + (c.grossAmount ?? c.amount), 0);
    if (total <= 0) continue;
    if (source === "room_auto") {
      summarisedRows.push({
        description: `Room Accommodation (Room ${roomNumber})`,
        qty: roomNights > 0 ? String(roomNights) : "—",
        rate: roomAutoRate !== undefined ? fmtUGX(roomAutoRate) : "—",
        amount: roomAutoTotal,
      });
    } else {
      summarisedRows.push({ description: sourceLabel(source), qty: "—", rate: "—", amount: total });
    }
  }
  const summarisedVatLabel = vatTreatmentLabel(folio.vatTreatment ?? res?.vatTreatment);

  return (
    <div className="mx-auto max-w-3xl print:max-w-none">
      <div className="print-format-label">
        {invoiceFormat === "summarised" ? "SUMMARISED INVOICE" : "DETAILED INVOICE"}
      </div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          to={`/billing?folio=${folioId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to folio
        </Link>
        <div className="flex items-center gap-2">
          {res?.guestPhone && (
            <button
              onClick={() => {
                const text = `Invoice ${invoiceNo} from ${tenant.name}\nTotal: UGX ${totalAmount.toLocaleString()}\nPaid: UGX ${paidAmount.toLocaleString()}\nBalance: UGX ${Math.max(0, outstanding).toLocaleString()}\nThank you for staying with us.`;
                window.open(`https://wa.me/${res.guestPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Smartphone className="h-3.5 w-3.5" /> WhatsApp
            </button>
          )}
          {res?.guestEmail && (
            <a
              href={`mailto:${res.guestEmail}?subject=Invoice ${invoiceNo} from ${tenant.name}&body=Dear ${res.guestName},%0A%0APlease find your invoice ${invoiceNo} attached.%0A%0ATotal: UGX ${totalAmount.toLocaleString()}%0APaid: UGX ${paidAmount.toLocaleString()}%0ABalance: UGX ${Math.max(0, outstanding).toLocaleString()}%0A%0AThank you for staying with ${tenant.name}.`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </a>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/70 hover:shadow-md"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>
      <div className="mb-4 flex items-center justify-end print:hidden">
        <div className="flex items-center gap-1 rounded-xl border border-border/40 bg-background/30 p-1">
          {(["summarised", "detailed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setInvoiceFormat(f)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-medium transition-all",
                invoiceFormat === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground/70 hover:bg-background/50 hover:text-foreground",
              )}
            >
              {f === "summarised" ? "Summarised" : "Detailed"}
            </button>
          ))}
        </div>
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
                  <p className="font-display text-xl font-bold">{invoiceNo}</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Issued: {issuedAt.slice(0, 10)}
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

          {invoiceFormat === "detailed" ? (
            <>
              {res?.guests && res.guests.length > 0 && (
                <div className="mb-4 rounded-lg border border-border/50 bg-muted/20 p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 mb-2">
                    Guest Summary
                  </p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/30 text-left text-muted-foreground/60">
                        <th className="pb-1.5 font-medium">Guest</th>
                        <th className="pb-1.5 font-medium">Nights</th>
                        <th className="pb-1.5 font-medium">Check-in</th>
                        <th className="pb-1.5 font-medium">Check-out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {res.guests.map((g, i) => {
                        const ci = g.checkIn ?? res.checkIn;
                        const co = g.checkOut ?? res.checkOut;
                        const nights = Math.max(0, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));
                        return (
                          <tr key={i} className="border-b border-border/20 last:border-0">
                            <td className="py-1.5 font-medium">{g.name}</td>
                            <td className="py-1.5">{nights}</td>
                            <td className="py-1.5">{ci}</td>
                            <td className="py-1.5">{co}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                    <th className="py-2.5 text-left">Description</th>
                    <th className="py-2.5 text-right">Taxable</th>
                    <th className="py-2.5 text-right">VAT</th>
                    <th className="py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {lineItems.length > 0 ? lineItems.map((li) => (
                    <tr key={li.id} className="transition-colors hover:bg-muted/20">
                      <td className="py-2.5 text-sm">{li.description}</td>
                      <td className="py-2.5 text-right tabular-nums">{fmtUGX(li.taxableAmount)}</td>
                      <td className="py-2.5 text-right tabular-nums">{fmtUGX(li.vatAmount)}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{fmtUGX(li.totalAmount)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                        No line items available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="ml-auto mt-6 w-full max-w-xs space-y-2">
                <Row label="Subtotal (net)" value={fmtUGX(totalTaxable)} />
                <Row label={`VAT (${(effectiveVatRate * 100).toFixed(0)}%)`} value={fmtUGX(totalVat)} />
                <div className="border-t border-border/50 pt-2">
                  <Row label="Total" value={fmtUGX(totalAmount)} bold />
                </div>
                {paidAmount > 0 && <Row label="Paid" value={"−" + fmtUGX(paidAmount)} tone="success" />}
                <div className="border-t border-border/50 pt-2">
                  <Row
                    label="Balance due"
                    value={fmtUGX(Math.max(0, outstanding))}
                    bold
                    tone={outstanding > 0 ? "warning" : "success"}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                    <th className="py-2.5 text-left">Description</th>
                    <th className="py-2.5 text-right">Qty</th>
                    <th className="py-2.5 text-right">Rate (UGX)</th>
                    <th className="py-2.5 text-right">Amount (UGX)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {summarisedRows.length > 0 ? summarisedRows.map((row, i) => (
                    <tr key={i} className="transition-colors hover:bg-muted/20">
                      <td className="py-2.5 text-sm">{row.description}</td>
                      <td className="py-2.5 text-right tabular-nums">{row.qty}</td>
                      <td className="py-2.5 text-right tabular-nums">{row.rate}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{fmtUGX(row.amount)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                        No charges available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="ml-auto mt-6 w-full max-w-xs space-y-2">
                <Row label="Subtotal" value={fmtUGX(totalTaxable)} />
                <Row label={summarisedVatLabel} value={fmtUGX(totalVat)} />
                <div className="border-t border-border/50 pt-2">
                  <Row label="Total" value={fmtUGX(totalAmount)} bold />
                </div>
                {paidAmount > 0 && <Row label="Amount Paid" value={"−" + fmtUGX(paidAmount)} tone="success" />}
                <div className="border-t border-border/50 pt-2">
                  <Row
                    label="Outstanding Balance"
                    value={fmtUGX(Math.max(0, outstanding))}
                    bold
                    tone={outstanding > 0 ? "warning" : "success"}
                  />
                </div>
              </div>
            </>
          )}

          {/* Signature section — visible on print */}
          <div className="mt-8 space-y-5 print:block hidden">
            <div className="flex flex-col items-center">
              <span className="block w-[70%] border-b border-foreground h-9" />
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Customer Signature</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="block w-[70%] border-b border-foreground h-9" />
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Cashier / Authorized Signature</span>
            </div>
          </div>

          {invoiceFormat === "detailed" && (
            <p className="mt-10 text-center text-[10px] text-muted-foreground/50">
              Thank you for staying with {tenant.name}. This is a system-generated tax invoice.
            </p>
          )}
        </div>
      </div>
      <style>{`.print-format-label { display: none; } @media print { body { background: white; } header, aside, nav { display: none !important; } main { padding: 0 !important; } .print-format-label { display: block; position: fixed; top: 0; right: 0; margin: 16px; font-size: 9px; font-weight: 700; letter-spacing: 0.15em; color: #6b7280; } }`}</style>
    </div>
  );
}

function GroupInvoiceView({
  inv,
  lineItems,
  group,
  groupReservations,
  tenant,
  invoiceNo,
  issuedAt,
}: {
  inv: Invoice;
  lineItems: { id: string; description: string; taxableAmount: number; vatAmount: number; totalAmount: number }[];
  group: GroupBlock | undefined;
  groupReservations: Reservation[];
  tenant: { name: string; address?: string; phone?: string; email?: string; tin?: string };
  invoiceNo: string;
  issuedAt: string;
}) {
  const totalCharges = inv.totalAmount;
  const paidAmount = inv.paidAmount;
  const outstanding = inv.outstandingAmount;
  const folios = useStore((s) => s.folios);
  const allCharges = useStore((s) => s.charges);
  const [invoiceFormat, setInvoiceFormat] = useState<"summarised" | "detailed">("summarised");

  const roomRows: { description: string; qty: string; rate: string; amount: number }[] = [];
  const roomsMap = new Map<string, Reservation[]>();
  for (const r of groupReservations) {
    const key = r.roomId ?? "UNASSIGNED";
    if (!roomsMap.has(key)) roomsMap.set(key, []);
    roomsMap.get(key)!.push(r);
  }
  for (const [roomKey, reservationsInRoom] of roomsMap) {
    const nights = reservationsInRoom.reduce((s, r) => {
      if (!r.checkIn || !r.checkOut) return s;
      return s + Math.max(0, Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000));
    }, 0);
    const folioIds = reservationsInRoom
      .map((r) => folios.find((f) => f.reservationId === r.id)?.id)
      .filter((x): x is string => Boolean(x));
    const total = allCharges
      .filter((c) => folioIds.includes(c.folioId) && !c.voided)
      .reduce((s, c) => s + (c.grossAmount ?? c.amount), 0);
    const roomNumber = roomKey === "UNASSIGNED" ? "Unassigned" : roomById(roomKey)?.roomNumber ?? roomKey;
    const rate = reservationsInRoom[0]?.ratePerNight ?? group?.groupRate;
    roomRows.push({
      description: `Room ${roomNumber}`,
      qty: nights > 0 ? String(nights) : "—",
      rate: rate !== undefined ? fmtUGX(rate) : "—",
      amount: total,
    });
  }
  const groupVatTreatment = groupReservations.find((r) => r.vatTreatment)?.vatTreatment;
  const summarisedVatLabel = vatTreatmentLabel(groupVatTreatment);

  return (
    <div className="mx-auto max-w-3xl print:max-w-none">
      <div className="print-format-label">
        {invoiceFormat === "summarised" ? "SUMMARISED INVOICE" : "DETAILED INVOICE"}
      </div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          to="/billing/master"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Master Billing
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/70 hover:shadow-md"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>
      <div className="mb-4 flex items-center justify-end print:hidden">
        <div className="flex items-center gap-1 rounded-xl border border-border/40 bg-background/30 p-1">
          {(["summarised", "detailed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setInvoiceFormat(f)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-medium transition-all",
                invoiceFormat === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground/70 hover:bg-background/50 hover:text-foreground",
              )}
            >
              {f === "summarised" ? "Summarised" : "Detailed"}
            </button>
          ))}
        </div>
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
              <div className="inline-flex rounded-xl bg-gradient-to-br from-indigo-500/[0.08] to-transparent px-4 py-2 ring-1 ring-indigo-500/10">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
                    Group Consolidated Invoice
                  </p>
                  <p className="font-display text-xl font-bold">{invoiceNo}</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Issued: {issuedAt.slice(0, 10)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Bill to</p>
              <p className="mt-1 text-sm font-semibold">{inv.guestName}</p>
              {inv.guestEmail && <p className="text-xs text-muted-foreground/70">{inv.guestEmail}</p>}
              {group && (
                <p className="mt-0.5 text-xs text-muted-foreground/60">
                  {group.startDate} → {group.endDate}
                </p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Booking</p>
              <p className="mt-1 text-sm font-semibold">{groupReservations.length} reservation{groupReservations.length !== 1 ? "s" : ""}</p>
              {group?.organiserName && (
                <p className="text-xs text-muted-foreground/70">Organiser: {group.organiserName}</p>
              )}
            </div>
          </div>

          {invoiceFormat === "detailed" ? (
            <>
              {groupReservations.length > 0 && (
                <div className="mb-4 rounded-lg border border-border/50 bg-muted/20 p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 mb-2">
                    Guests
                  </p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/30 text-left text-muted-foreground/60">
                        <th className="pb-1.5 font-medium">Guest</th>
                        <th className="pb-1.5 font-medium">Room</th>
                        <th className="pb-1.5 font-medium">Check-in</th>
                        <th className="pb-1.5 font-medium">Check-out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupReservations.map((r, i) => {
                        const room = roomById(r.roomId ?? "");
                        return (
                          <tr key={r.id} className="border-b border-border/20 last:border-0">
                            <td className="py-1.5 font-medium">{r.guestName}</td>
                            <td className="py-1.5">{room?.roomNumber ?? r.roomId ?? "—"}</td>
                            <td className="py-1.5">{r.checkIn}</td>
                            <td className="py-1.5">{r.checkOut}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                    <th className="py-2.5 text-left">Description</th>
                    <th className="py-2.5 text-right">Taxable</th>
                    <th className="py-2.5 text-right">VAT</th>
                    <th className="py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {lineItems.length > 0 ? lineItems.map((li) => (
                    <tr key={li.id} className="transition-colors hover:bg-muted/20">
                      <td className="py-2.5 text-sm">{li.description}</td>
                      <td className="py-2.5 text-right tabular-nums">{fmtUGX(li.taxableAmount)}</td>
                      <td className="py-2.5 text-right tabular-nums">{fmtUGX(li.vatAmount)}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{fmtUGX(li.totalAmount)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                        No line items available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="ml-auto mt-6 w-full max-w-xs space-y-2">
                <Row label="Subtotal (net)" value={fmtUGX(inv.totalTaxable)} />
                <Row label={`VAT (18%)`} value={fmtUGX(inv.totalVat)} />
                <div className="border-t border-border/50 pt-2">
                  <Row label="Total" value={fmtUGX(totalCharges)} bold />
                </div>
                {paidAmount > 0 && <Row label="Paid" value={"−" + fmtUGX(paidAmount)} tone="success" />}
                <div className="border-t border-border/50 pt-2">
                  <Row
                    label="Balance due"
                    value={fmtUGX(Math.max(0, outstanding))}
                    bold
                    tone={outstanding > 0 ? "warning" : "success"}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                    <th className="py-2.5 text-left">Description</th>
                    <th className="py-2.5 text-right">Qty</th>
                    <th className="py-2.5 text-right">Rate (UGX)</th>
                    <th className="py-2.5 text-right">Amount (UGX)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {roomRows.length > 0 ? roomRows.map((row, i) => (
                    <tr key={i} className="transition-colors hover:bg-muted/20">
                      <td className="py-2.5 text-sm">{row.description}</td>
                      <td className="py-2.5 text-right tabular-nums">{row.qty}</td>
                      <td className="py-2.5 text-right tabular-nums">{row.rate}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{fmtUGX(row.amount)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                        No rooms available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="ml-auto mt-6 w-full max-w-xs space-y-2">
                <Row label="Subtotal" value={fmtUGX(inv.totalTaxable)} />
                <Row label={summarisedVatLabel} value={fmtUGX(inv.totalVat)} />
                <div className="border-t border-border/50 pt-2">
                  <Row label="Total" value={fmtUGX(totalCharges)} bold />
                </div>
                {paidAmount > 0 && <Row label="Amount Paid" value={"−" + fmtUGX(paidAmount)} tone="success" />}
                <div className="border-t border-border/50 pt-2">
                  <Row
                    label="Outstanding Balance"
                    value={fmtUGX(Math.max(0, outstanding))}
                    bold
                    tone={outstanding > 0 ? "warning" : "success"}
                  />
                </div>
              </div>
            </>
          )}

          <div className="mt-8 space-y-5 print:block hidden">
            <div className="flex flex-col items-center">
              <span className="block w-[70%] border-b border-foreground h-9" />
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Customer Signature</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="block w-[70%] border-b border-foreground h-9" />
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Cashier / Authorized Signature</span>
            </div>
          </div>

          {invoiceFormat === "detailed" && (
            <p className="mt-10 text-center text-[10px] text-muted-foreground/50">
              Thank you for choosing {tenant.name}. This is a system-generated group consolidated invoice.
            </p>
          )}
        </div>
      </div>
      <style>{`.print-format-label { display: none; } @media print { body { background: white; } header, aside, nav { display: none !important; } main { padding: 0 !important; } .print-format-label { display: block; position: fixed; top: 0; right: 0; margin: 16px; font-size: 9px; font-weight: 700; letter-spacing: 0.15em; color: #6b7280; } }`}</style>
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

function vatTreatmentLabel(vt?: string): string {
  if (vt === "exclusive") return "VAT Exclusive";
  if (vt === "exempt" || vt === "not_applicable") return "VAT Not Applicable";
  return "VAT Inclusive";
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
