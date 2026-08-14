import { useParams, useNavigate, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, LogIn, LogOut, Pencil, Clock, UserX, Printer, Info, AlertTriangle, AlertCircle, MoveRight, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useStore,
  reservationById,
  roomById,
  roomTypeById,
  fmtUGX,
  checkOut,
  transferFolio,
  folioBalance,
  folioById,
  isWithinNoShowWindow,
  getMealPlanPrice,
  getMealPlanLabel,
} from "@/lib/pms-store";
import type { Reservation } from "@/lib/pms-store";
import {
  EditDialog,
  CancelDialog,
  NoShowDialog,
  ChangeRoomDialog,
} from "@/features/reservations/reservation-dialogs";
import CheckoutConfirmationDialog from "@/features/frontdesk/CheckoutConfirmationDialog";
import RecordPaymentDialog from "@/features/frontdesk/RecordPaymentDialog";

const statusBadge: Record<string, string> = {
  open: "bg-info/15 text-info border-info/30",
  confirmed: "bg-info/15 text-info border-info/30",
  checked_in: "bg-success/15 text-success border-success/30",
  checked_out: "bg-muted/40 text-muted-foreground border-border/40",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  no_show: "bg-warning/15 text-warning border-warning/30",
};

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const audits = useStore((s) => s.audit);
  const folios = useStore((s) => s.folios);

  const [openEdit, setOpenEdit] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [openNoShow, setOpenNoShow] = useState(false);
  const [openChangeRoom, setOpenChangeRoom] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<Reservation | null>(null);

  const res = useMemo(() => reservationById(id ?? ""), [id, reservations]);
  const room = useMemo(() => (res?.roomId ? roomById(res.roomId) : null), [res?.roomId, rooms]);
  const rt = useMemo(() => (res ? roomTypeById(res.roomTypeId) : null), [res?.roomTypeId, roomTypes]);

  const auditEntries = useMemo(
    () => audits.filter((a) => a.recordId === id).sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()),
    [audits, id],
  );

  if (!res) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <h2 className="text-2xl font-bold">Reservation not found</h2>
        <p className="mt-2 text-muted-foreground">No reservation matches ID "{id}".</p>
        <Link to="/reservations" className="mt-4 inline-block text-sm text-primary underline">
          Back to reservations
        </Link>
      </div>
    );
  }

  const nights = Math.max(
    1,
    Math.round((new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / 86_400_000),
  );
  const mealPrice = getMealPlanPrice(res.mealPlan);
  const subtotal = res.ratePerNight * nights;
  const mealTotal = mealPrice * nights;
  const vatRate = res.vatRate ?? 0.18;
  const tax = Math.round((subtotal + mealTotal) * vatRate);
  const total = subtotal + mealTotal + tax;
  const deposit = res.deposit ?? 0;
  const balanceDue = Math.max(0, total - deposit);

  const folio = res.folioId ? folioById(res.folioId) : null;
  const actualBalance = res.folioId ? folioBalance(res.folioId) : 0;

  const showToast = (t: { tone: "ok" | "err"; msg: string }) => {
    if (t.tone === "ok") toast.success(t.msg);
    else toast.error(t.msg);
  };

  const handleCheckIn = () => {
    navigate(`/check-in/${res.id}`);
  };

  const handleCheckOut = () => {
    setCheckoutTarget(res);
  };

  const handleConfirmCheckout = (transferToDebtors: boolean) => {
    setCheckoutTarget(null);
    if (transferToDebtors) {
      const sourceFolio = folios.find((f) => f.reservationId === res.id);
      if (sourceFolio?.corporateAccountId) {
        const targetFolio = folios.find(
          (f) =>
            f.id !== sourceFolio.id &&
            f.corporateAccountId === sourceFolio.corporateAccountId &&
            f.status === "open",
        );
        if (targetFolio) transferFolio(sourceFolio.id, targetFolio.id, "Front Desk", "Front Desk");
      }
    }
    const r = checkOut(res.id);
    if (!r.ok) {
      showToast({ tone: "err", msg: r.error });
      return;
    }
    if (r.postStay) {
      toast.warning(
        transferToDebtors
          ? "Guest checked out. Balance transferred to Debtors Account — Finance to follow up."
          : `Guest checked out. Outstanding balance of ${fmtUGX(r.balance ?? 0)} remains. Collect payment from guest.`,
      );
    } else {
      showToast({ tone: "ok", msg: "Guest checked out." });
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          button, .btn { display: none !important; }
          a { text-decoration: none; color: inherit; }
          @page { margin: 1.5cm; size: A4 portrait; }
        }
      `}</style>
      <div id="print-area" className="mx-auto max-w-4xl space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/reservations"
            className="no-print grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold tracking-tight">{res.guestName}</h1>
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                  statusBadge[res.status],
                )}
              >
                {res.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {res.id} &middot; {res.confirmationNumber}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          {(res.status === "confirmed" || res.status === "open") && (
            <>
              <button
                onClick={() => setOpenEdit(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => setOpenCancel(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/20"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </button>
              {isWithinNoShowWindow(res.checkIn, res.checkOut) && (
                <button
                  onClick={() => setOpenNoShow(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning hover:bg-warning/20"
                >
                  <UserX className="h-3.5 w-3.5" /> No-Show
                </button>
              )}
              <button
                onClick={handleCheckIn}
                className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-2 text-xs font-semibold text-white hover:bg-success/90"
              >
                <LogIn className="h-3.5 w-3.5" /> Check In
              </button>
            </>
          )}
          {res.status === "checked_in" && (
            <>
              <button
                onClick={() => setOpenChangeRoom(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                <MoveRight className="h-3.5 w-3.5" /> Change Room
              </button>
              {actualBalance > 0 && (
                <button
                  onClick={() => setShowRecordPayment(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-emerald-500/90 hover:to-green-600/90 hover:shadow-md"
                >
                  <CreditCard className="h-3.5 w-3.5" /> Record Payment
                </button>
              )}
              <button
                onClick={handleCheckOut}
                className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3 py-2 text-xs font-semibold text-white hover:bg-warning/90"
              >
                <LogOut className="h-3.5 w-3.5" /> Check Out
              </button>
            </>
          )}
        </div>
      </div>

      {/* Guest Information */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guest Information</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Full name" value={res.guestName} />
          <DetailItem label="Email" value={res.guestEmail} />
          <DetailItem label="Phone" value={res.guestPhone} />
          <DetailItem label="Nationality" value={res.nationality ?? "—"} />
          <DetailItem label="Client type" value={res.clientType ?? "—"} />
          <DetailItem label="ID type" value={res.idType ?? "—"} />
          <DetailItem label="ID number" value={res.idNumber ?? "—"} />
        </div>
      </div>

      {/* Stay Details */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stay Details</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Room" value={room ? `Room ${room.roomNumber}` : "—"} />
          <DetailItem label="Room type" value={rt?.name ?? res.roomTypeId} />
          <DetailItem label="Check-in" value={res.checkIn} />
          <DetailItem label="Check-out" value={res.checkOut} />
          <DetailItem label="Nights" value={String(nights)} />
          <DetailItem label="Adults" value={String(res.adults)} />
          <DetailItem label="Children" value={String(res.children)} />
          <DetailItem label="Meal plan" value={getMealPlanLabel(res.mealPlan)} />
          <DetailItem label="Arrival time" value={res.arrivalTime ?? "—"} />
          <DetailItem label="Extra beds" value={res.extraBeds ? String(res.extraBeds) : "—"} />
          <DetailItem label="Purpose" value={res.purpose ?? "—"} />
          <DetailItem label="Car registration" value={res.carReg ?? "—"} />
        </div>
      </div>

      {/* Financial Summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financial Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rate per night</span>
            <span>{fmtUGX(res.ratePerNight)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Room total ({nights} night{nights !== 1 && "s"})</span>
            <span>{fmtUGX(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Meal plan ({getMealPlanLabel(res.mealPlan)})</span>
            <span>{fmtUGX(mealTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax ({(vatRate * 100).toFixed(0)}%)</span>
            <span>{fmtUGX(tax)}</span>
          </div>
          <div className="border-t border-border pt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{fmtUGX(total)}</span>
            </div>
          </div>
          {deposit > 0 && (
            <div className="flex justify-between text-success">
              <span>Deposit paid</span>
              <span>{fmtUGX(deposit)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>Balance due</span>
            <span>{fmtUGX(balanceDue)}</span>
          </div>
        </div>
      </div>

      {res.folioId && actualBalance > 0.5 && (
        <div className="rounded-xl border border-amber-200/40 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-5">
          <div className="flex items-start gap-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Outstanding balance</h3>
              <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-400/80">
                This folio has an outstanding balance of {fmtUGX(actualBalance)}. Record a payment or settle via the Billing page.
              </p>
              <button
                onClick={() => setShowRecordPayment(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                <CreditCard className="h-4 w-4" /> Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Special Requests */}
      {res.specialRequests && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Special Requests</h2>
          <p className="text-sm">{res.specialRequests}</p>
        </div>
      )}

      {/* Audit Timeline */}
      {auditEntries.length > 0 && (
        <div className="no-print rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h2>
            <span className="text-[11px] text-muted-foreground">{auditEntries.length} event{auditEntries.length !== 1 && "s"}</span>
          </div>
          <div className="space-y-0">
            {auditEntries.map((entry) => {
              const severityColor =
                entry.severity === "critical"
                  ? "border-destructive bg-destructive/20"
                  : entry.severity === "warn"
                    ? "border-warning bg-warning/20"
                    : "border-primary/40 bg-primary/10";
              const SevIcon =
                entry.severity === "critical"
                  ? AlertCircle
                  : entry.severity === "warn"
                    ? AlertTriangle
                    : Info;
              return (
                <div key={entry.id} className="relative flex gap-3 pb-4 pl-6 last:pb-0">
                  <div
                    className={cn(
                      "absolute left-0 top-1.5 grid h-2.5 w-2.5 place-items-center rounded-full border-2 bg-background",
                      severityColor,
                    )}
                  >
                    <SevIcon className="h-3 w-3" style={{ display: "none" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span className="font-semibold text-foreground">{entry.actor}</span>
                      <span className="text-muted-foreground/60">{entry.role}</span>
                      <span className="text-muted-foreground/40">&middot;</span>
                      <span className="text-muted-foreground" title={new Date(entry.ts).toLocaleString("en-GB")}>
                        {new Date(entry.ts).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-foreground">{entry.action}</p>
                    {entry.oldValue && entry.newValue && (
                      <div className="mt-1.5 space-y-1 rounded-lg bg-muted/30 p-2.5 font-mono text-[11px] leading-relaxed">
                        {(() => {
                          const oldPairs = entry.oldValue!.split("; ").map((s) => {
                            const idx = s.indexOf(": ");
                            return idx > 0 ? { field: s.slice(0, idx), val: s.slice(idx + 2) } : null;
                          }).filter(Boolean);
                          const newPairs = entry.newValue!.split("; ").map((s) => {
                            const idx = s.indexOf(": ");
                            return idx > 0 ? { field: s.slice(0, idx), val: s.slice(idx + 2) } : null;
                          }).filter(Boolean);
                          return newPairs.map((np, i) => {
                            const op = oldPairs[i];
                            return (
                              <div key={np!.field} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                <span className="truncate text-muted-foreground">
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{np!.field}</span>
                                  <br />
                                  <span className="line-through text-destructive/60">{op?.val ?? "—"}</span>
                                </span>
                                <span className="text-muted-foreground/40">&rarr;</span>
                                <span className="font-medium text-foreground">{np!.val}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking metadata */}
      <div className="no-print rounded-xl border border-border bg-card p-5 text-xs text-muted-foreground">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <span className="font-medium text-foreground">Booking source: </span>
            {res.bookingSource}
          </div>
          <div>
            <span className="font-medium text-foreground">Created: </span>
            {new Date(res.createdAt).toLocaleString("en-GB")}
          </div>
          <div>
            <span className="font-medium text-foreground">Updated: </span>
            {new Date(res.updatedAt).toLocaleString("en-GB")}
          </div>
          {res.cancellationReason && (
            <div>
              <span className="font-medium text-destructive">Cancelled: </span>
              {res.cancellationReason}
            </div>
          )}
        </div>
      </div>

      {/* Signature section */}
      <div className="mt-8 space-y-5">
        <div className="flex flex-col items-center">
          <span className="block w-[70%] border-b border-foreground h-9" />
          <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Guest Signature</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="block w-[70%] border-b border-foreground h-9" />
          <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Front Desk / Authorized Signature</span>
        </div>
      </div>

      {/* Dialogs */}
      {openEdit && (
        <EditDialog
          reservationId={res.id}
          onClose={(msg) => {
            setOpenEdit(false);
            if (msg) showToast(msg);
          }}
        />
      )}
      {openCancel && (
        <CancelDialog
          reservationId={res.id}
          onClose={(msg) => {
            setOpenCancel(false);
            if (msg) showToast(msg);
          }}
        />
      )}
      {openNoShow && (
        <NoShowDialog
          reservationId={res.id}
          onClose={(msg) => {
            setOpenNoShow(false);
            if (msg) showToast(msg);
          }}
        />
      )}
      {openChangeRoom && (
        <ChangeRoomDialog
          reservationId={res.id}
          onClose={(msg) => {
            setOpenChangeRoom(false);
            if (msg) showToast(msg);
          }}
        />
      )}

      {showRecordPayment && res.folioId && (
        <RecordPaymentDialog
          reservationId={res.id}
          folioId={res.folioId}
          actor="Front Desk"
          onClose={() => setShowRecordPayment(false)}
        />
      )}

      {checkoutTarget && (
        <CheckoutConfirmationDialog
          reservation={checkoutTarget}
          onConfirm={handleConfirmCheckout}
          onClose={() => setCheckoutTarget(null)}
        />
      )}
    </div>
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}
