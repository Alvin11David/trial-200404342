import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search,
  User,
  CalendarDays,
  BedDouble,
  CheckCircle2,
  X,
  LogOut,
  ChevronDown,
  ChevronUp,
  CreditCard,
  AlertTriangle,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  checkOut,
  CHARGE_TYPE_LABEL,
  fmtUGX,
  folioBalance,
  folioById,
  nightsBetween,
  PAYMENT_METHOD_LABEL,
  reservationById,
  roomById,
  roomTypeById,
  useStore,
} from "@/lib/pms-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/check-out")({
  head: () => ({ meta: [{ title: "Check-Out \u2014 Jambo PMS" }] }),
  component: CheckOutPage,
});

function CheckOutPage() {
  const reservations = useStore((s) => s.reservations);
  const allCharges = useStore((s) => s.charges);
  const allPayments = useStore((s) => s.payments);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const inHouse = useMemo(
    () =>
      reservations
        .filter((r) => r.status === "checked_in")
        .filter((r) => !query || r.guestName.toLowerCase().includes(query.toLowerCase())),
    [reservations, query],
  );

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="mx-auto max-w-5xl min-h-screen py-1 relative mesh-bg" role="main" aria-label="Check-Out">
      {/* Header */}
      <header className="group/header relative mb-6 flex flex-wrap items-end justify-between gap-3 overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card/85 via-card/65 to-card/40 px-6 py-5 shadow-sm before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-500 group-hover/header:before:opacity-100 before:bg-gradient-to-r before:from-primary/[0.03] before:via-transparent before:to-primary/[0.02]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-destructive/[0.07] to-transparent blur-3xl transition-all duration-700 group-hover/header:scale-110 group-hover/header:from-destructive/[0.12]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-gradient-to-tr from-warning/[0.05] to-transparent blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-1/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-destructive/20 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-1 rounded-full bg-destructive animate-accent-slide" />
            <p className="text-xs font-semibold uppercase tracking-widest text-destructive">Front Desk</p>
            <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-breathe" />
            <span className="h-1.5 w-px bg-border/60" />
            <span className="text-[10px] tabular-nums text-muted-foreground/60 font-medium">{dateStr}</span>
          </div>
          <h1 className="mt-2.5 font-display text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Check-Out
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground/80 leading-relaxed">Process guest departures and settle folios</p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1.5 relative z-10">
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="live-dot" />
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
              {inHouse.length} in-house
            </span>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="relative mb-6 animate-fade-in" role="search">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <input
          placeholder="Search by guest name\u2026"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-border/60 bg-card/70 py-3 pl-10 pr-10 text-sm outline-none backdrop-blur-xl transition-all duration-200 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/15 search-glow placeholder:text-muted-foreground/40"
          aria-label="Search guests by name"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground/50 transition-colors hover:text-foreground hover:bg-muted/50"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Empty state */}
      {inHouse.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30 py-24 text-center backdrop-blur-sm transition-all hover:border-border/70">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 ring-1 ring-border/60">
            <LogOut className="h-7 w-7 text-muted-foreground/30" />
          </span>
          <h3 className="text-lg font-semibold text-muted-foreground/80">No check-outs</h3>
          <p className="mt-1 text-sm text-muted-foreground/50 max-w-xs">
            {query ? "No checked-in guests match your search." : "All guests are settled and checked out."}
          </p>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="mt-6 dashboard-cta inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"
            >
              <X className="h-3.5 w-3.5" /> Clear search
            </button>
          )}
        </div>
      ) : (
        /* Guest list */
        <div className="grid gap-3 animate-fade-in" role="list" aria-label="In-house guests list">
          {inHouse.map((res, idx) => {
            const rt = roomTypeById(res.roomTypeId);
            const room = roomById(res.roomId);
            const nights = nightsBetween(res.checkIn, res.checkOut);
            const isOpen = selected === res.id;
            const folio = res.folioId ? folioById(res.folioId) : null;
            const balance = res.folioId ? folioBalance(res.folioId) : 0;
            const folioCharges = folio ? allCharges.filter((c) => c.folioId === folio.id && !c.voided) : [];
            const folioPayments = folio ? allPayments.filter((p) => p.folioId === folio.id) : [];
            const totalCharges = folioCharges.reduce((s: number, c) => s + c.amount, 0);
            const totalPayments = folioPayments.filter((p) => p.status === "confirmed").reduce((s: number, p) => s + p.amount, 0);

            return (
              <div
                key={res.id}
                className={cn(
                  "dashboard-card rounded-2xl border bg-card/70 backdrop-blur-xl transition-all duration-300",
                  isOpen
                    ? "border-primary/30 shadow-lg shadow-primary/5"
                    : "border-border/60 shadow-sm hover:border-primary/20 hover:shadow-md",
                )}
                role="listitem"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <button
                  onClick={() => setSelected(isOpen ? null : res.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`checkout-details-${res.id}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary ring-1 ring-primary/20">
                    {res.guestName.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{res.guestName}</span>
                      <StatusBadge label="In House" variant="success" />
                      {balance > 0 ? (
                        <StatusBadge label={`${fmtUGX(balance)} due`} variant="destructive" />
                      ) : (
                        <StatusBadge label="Paid" variant="success" />
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground/70">
                      <span className="font-mono">#{res.id}</span>
                      <span className="h-3 w-px bg-border/60" />
                      <span>{rt?.name ?? res.roomTypeId}</span>
                      {room && (
                        <>
                          <span className="h-3 w-px bg-border/60" />
                          <span>Room {room.id} &middot; Floor {room.floor}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="hidden items-center gap-4 text-right sm:flex">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{res.checkIn}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground/50">{nights} night{nights > 1 ? "s" : ""}</div>
                    </div>
                    <div className="min-w-[80px]">
                      <div className={cn("text-right text-sm font-bold tabular-nums", balance > 0 ? "text-destructive" : "text-success")}>
                        {fmtUGX(balance)}
                      </div>
                      <div className="text-[10px] text-muted-foreground/50">{balance > 0 ? "outstanding" : "cleared"}</div>
                    </div>
                  </div>
                  <div className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-200",
                    isOpen ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground/50"
                  )}>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`checkout-details-${res.id}`}
                    className="animate-slide-up-fade border-t border-border/60"
                  >
                    {/* Charges & Payments */}
                    <div className="grid gap-4 p-5 sm:grid-cols-2">
                      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
                          <Receipt className="h-3.5 w-3.5 text-primary" />
                          <h4 className="text-xs font-semibold text-foreground">Charges</h4>
                          <span className="ml-auto text-[10px] font-medium text-muted-foreground/60">{folioCharges.length} items</span>
                        </div>
                        {folioCharges.length === 0 ? (
                          <p className="px-4 py-8 text-center text-xs text-muted-foreground/50">No charges on this folio.</p>
                        ) : (
                          <ul className="divide-y divide-border/40">
                            {folioCharges.map((c) => (
                              <li key={c.id} className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/20">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">{c.description}</p>
                                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{CHARGE_TYPE_LABEL[c.type]} &middot; {c.date}</p>
                                </div>
                                <span className="text-xs font-semibold tabular-nums ml-3">{fmtUGX(c.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                          <span className="text-xs font-medium text-muted-foreground">Total charges</span>
                          <span className="text-sm font-bold tabular-nums">{fmtUGX(totalCharges)}</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
                          <CreditCard className="h-3.5 w-3.5 text-success" />
                          <h4 className="text-xs font-semibold text-foreground">Payments</h4>
                          <span className="ml-auto text-[10px] font-medium text-muted-foreground/60">{folioPayments.length} entries</span>
                        </div>
                        {folioPayments.length === 0 ? (
                          <p className="px-4 py-8 text-center text-xs text-muted-foreground/50">No payments recorded yet.</p>
                        ) : (
                          <ul className="divide-y divide-border/40">
                            {folioPayments.map((p) => (
                              <li key={p.id} className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/20">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium">{PAYMENT_METHOD_LABEL[p.method]}</p>
                                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{p.reference ?? "\u2014"}</p>
                                </div>
                                <span className="text-xs font-semibold tabular-nums text-success ml-3">&minus;{fmtUGX(p.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                          <span className="text-xs font-medium text-muted-foreground">Total payments</span>
                          <span className="text-sm font-bold tabular-nums text-success">{fmtUGX(totalPayments)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/10 px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className={cn("text-xl font-bold tabular-nums", balance > 0 ? "text-destructive" : "text-success")}>
                          {fmtUGX(balance)}
                        </span>
                        <span className="text-xs text-muted-foreground/70">
                          {balance > 0 ? "outstanding balance" : "balance cleared"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {balance > 0 ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive">
                              <AlertTriangle className="h-3.5 w-3.5" /> Cannot check out
                            </span>
                            <Link
                              to="/billing"
                              search={{ folio: res.folioId, invoice: undefined }}
                              className="dashboard-cta inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                            >
                              <CreditCard className="h-3.5 w-3.5" /> Settle {fmtUGX(balance)}
                            </Link>
                          </>
                        ) : (
                          <CheckOutButton reservationId={res.id} />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ label, variant }: { label: string; variant: "success" | "destructive" | "warning" | "info" }) {
  const styles: Record<string, string> = {
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  };
  const dots: Record<string, string> = {
    success: "bg-success",
    destructive: "bg-destructive",
    warning: "bg-warning",
    info: "bg-info",
  };
  return (
    <span className={"inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold " + styles[variant]}>
      <span className={"h-1 w-1 rounded-full " + dots[variant]} />
      {label}
    </span>
  );
}

function CheckOutButton({ reservationId }: { reservationId: string }) {
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setLoading(true);
    const r = checkOut(reservationId);
    setLoading(false);
    if (r.ok) {
      toast.success(`${reservationById(reservationId)?.guestName} checked out successfully.`);
    } else {
      toast.error(r.error);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="dashboard-cta inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5">
          <LogOut className="h-3.5 w-3.5" /> Check Out <ArrowRight className="h-3 w-3" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm check-out</AlertDialogTitle>
          <AlertDialogDescription>
            This will check out the guest, mark the room as dirty, and close the folio. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg border-border/60 text-sm">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={submit}
            disabled={loading}
            className="rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirm Check-Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
