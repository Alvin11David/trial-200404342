import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
  Receipt,
  CreditCard,
  AlertTriangle,
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

export const Route = createFileRoute("/_app/check-out")({
  head: () => ({ meta: [{ title: "Check-Out — Jambo PMS" }] }),
  component: CheckOutPage,
});

function CheckOutPage() {
  const reservations = useStore((s) => s.reservations);
  const folios = useStore((s) => s.folios);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const inHouse = useMemo(
    () =>
      reservations
        .filter((r) => r.status === "checked_in")
        .filter((r) => !query || r.guestName.toLowerCase().includes(query.toLowerCase())),
    [reservations, query],
  );

  const showToast = (t: { tone: "ok" | "err"; msg: string } | null) => {
    setToast(t);
    if (t) setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Check-Out</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {inHouse.length} guest{inHouse.length !== 1 ? "s" : ""} currently checked in
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search by guest name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {inHouse.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <LogOut className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-muted-foreground">No check-outs</h3>
          <p className="mt-1 text-sm text-muted-foreground/60">All guests are checked out.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {inHouse.map((res) => {
            const rt = roomTypeById(res.roomTypeId);
            const room = roomById(res.roomId);
            const nights = nightsBetween(res.checkIn, res.checkOut);
            const isOpen = selected === res.id;
            const folio = res.folioId ? folioById(res.folioId) : null;
            const balance = res.folioId ? folioBalance(res.folioId) : 0;
            const folioCharges = folio ? useStore.getState().charges.filter((c) => c.folioId === folio.id && !c.voided) : [];
            const folioPayments = folio ? useStore.getState().payments.filter((p) => p.folioId === folio.id) : [];
            const totalCharges = folioCharges.reduce((s, c) => s + c.amount, 0);
            const totalPayments = folioPayments.reduce((s, p) => s + p.amount, 0);

            return (
              <div
                key={res.id}
                className={cn(
                  "rounded-xl border bg-card transition-all",
                  isOpen ? "border-primary/40 shadow-md" : "border-border shadow-sm hover:border-primary/20 hover:shadow-md",
                )}
              >
                <button
                  onClick={() => setSelected(isOpen ? null : res.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                    <User className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{res.guestName}</span>
                      <span className="rounded-md border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                        In House
                      </span>
                      {balance > 0 && (
                        <span className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                          {fmtUGX(balance)} due
                        </span>
                      )}
                      {balance <= 0 && (
                        <span className="rounded-md border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                          Paid
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>#{res.id}</span>
                      <span>{rt?.name ?? res.roomTypeId}</span>
                      {room && <span>Room {room.id} · Floor {room.floor}</span>}
                    </div>
                  </div>
                  <div className="hidden items-center gap-3 text-right sm:flex">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {res.checkIn}
                      </div>
                      <div className="text-[11px] text-muted-foreground/60">{nights} night{nights > 1 ? "s" : ""}</div>
                    </div>
                    <div className={cn("text-sm font-semibold tabular-nums", balance > 0 ? "text-destructive" : "text-success")}>
                      {fmtUGX(balance)}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border">
                    <div className="grid gap-4 p-5 sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-background">
                        <div className="border-b border-border px-4 py-2.5">
                          <h4 className="text-xs font-semibold text-muted-foreground">Charges</h4>
                        </div>
                        {folioCharges.length === 0 ? (
                          <p className="px-4 py-6 text-center text-xs text-muted-foreground">No charges.</p>
                        ) : (
                          <ul className="divide-y divide-border">
                            {folioCharges.map((c) => (
                              <li key={c.id} className="flex items-center justify-between px-4 py-2">
                                <div>
                                  <p className="text-xs font-medium">{c.description}</p>
                                  <p className="text-[10px] text-muted-foreground">{CHARGE_TYPE_LABEL[c.type]} · {c.date}</p>
                                </div>
                                <span className="text-xs font-semibold tabular-nums">{fmtUGX(c.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex justify-between border-t border-border px-4 py-2.5 text-xs font-semibold">
                          <span className="text-muted-foreground">Total</span>
                          <span>{fmtUGX(totalCharges)}</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-background">
                        <div className="border-b border-border px-4 py-2.5">
                          <h4 className="text-xs font-semibold text-muted-foreground">Payments</h4>
                        </div>
                        {folioPayments.length === 0 ? (
                          <p className="px-4 py-6 text-center text-xs text-muted-foreground">No payments.</p>
                        ) : (
                          <ul className="divide-y divide-border">
                            {folioPayments.map((p) => (
                              <li key={p.id} className="flex items-center justify-between px-4 py-2">
                                <div>
                                  <p className="text-xs font-medium">{PAYMENT_METHOD_LABEL[p.method]}</p>
                                  <p className="text-[10px] text-muted-foreground">{p.reference ?? "—"}</p>
                                </div>
                                <span className="text-xs font-semibold tabular-nums text-success">−{fmtUGX(p.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex justify-between border-t border-border px-4 py-2.5 text-xs font-semibold">
                          <span className="text-muted-foreground">Total</span>
                          <span className="text-success">{fmtUGX(totalPayments)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-lg font-bold", balance > 0 ? "text-destructive" : "text-success")}>
                          {fmtUGX(balance)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {balance > 0 ? "outstanding" : "balance cleared"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {balance > 0 ? (
                          <>
                            <Link
                              to="/billing"
                              search={{ folio: res.folioId }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                            >
                              <CreditCard className="h-4 w-4" /> Settle bill
                            </Link>
                            <span className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
                              <AlertTriangle className="h-4 w-4" /> Cannot check out
                            </span>
                          </>
                        ) : (
                          <CheckOutButton reservationId={res.id} folioId={res.folioId ?? null} onDone={showToast} />
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

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-5 py-3 shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-2",
            toast.tone === "ok"
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {toast.tone === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function CheckOutButton({
  reservationId,
  folioId,
  onDone,
}: {
  reservationId: string;
  folioId: string | null;
  onDone: (toast: { tone: "ok" | "err"; msg: string }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
      >
        <LogOut className="h-4 w-4" /> Check Out
      </button>
    );
  }

  const submit = async () => {
    setLoading(true);
    const r = checkOut(reservationId);
    setLoading(false);
    setConfirm(false);
    onDone(r.ok ? { tone: "ok", msg: `${reservationById(reservationId)?.guestName} checked out successfully.` } : { tone: "err", msg: r.error });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setConfirm(false)}
        className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
      >
        Cancel
      </button>
      <button
        onClick={submit}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-success-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        Confirm Check-Out
      </button>
    </div>
  );
}
