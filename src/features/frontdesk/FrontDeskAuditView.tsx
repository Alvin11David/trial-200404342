import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  LogOut,
  CalendarPlus,
  CreditCard,
  X,
  CheckCircle2,
  Users,
  AlertTriangle,
  Ban,
} from "lucide-react";
import {
  useStore,
  checkOut,
  transferFolio,
  extendStay,
  requestVoidCheckIn,
  reservationById,
  groupBlockById,
  roomTypeById,
  roomById,
  folioBalance,
  fmtUGX,
  setAuditStatus,
} from "@/lib/pms-store";
import type { Reservation } from "@/lib/pms-store";
import RecordPaymentDialog from "./RecordPaymentDialog";
import CheckoutConfirmationDialog from "./CheckoutConfirmationDialog";
import { cn } from "@/lib/utils";

type Phase = "due_outs" | "next_day" | "extend" | "void_reason";

export default function FrontDeskAuditView() {
  const reservations = useStore((s) => s.reservations);
  const businessDate = useStore((s) => s.businessDate);
  const users = useStore((s) => s.users);
  const folios = useStore((s) => s.folios);

  const actor = users.find((u) => u.isActive && u.department === "Front Desk")?.fullName ?? "Front Desk";
  const actorRole = "Front Desk";

  const nextDate = (() => {
    const d = new Date(businessDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const dueToday = useMemo(
    () =>
      reservations.filter(
        (r) => r.status === "checked_in" && r.checkOut === businessDate,
      ),
    [reservations, businessDate],
  );

  const dueTomorrow = useMemo(
    () =>
      reservations.filter(
        (r) => r.status === "checked_in" && r.checkOut === nextDate,
      ),
    [reservations, nextDate],
  );

  const [extending, setExtending] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState(1);
  const [voiding, setVoiding] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [recordPayment, setRecordPayment] = useState<{ reservationId: string; folioId: string } | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<string | null>(null);

  const checkoutRes = checkoutTarget ? reservationById(checkoutTarget) : undefined;

  const handleCheckOut = (resId: string) => {
    const res = reservationById(resId);
    if (!res) {
      toast.error("Reservation not found.");
      return;
    }
    setCheckoutTarget(resId);
  };

  const handleConfirmCheckout = (transferToDebtors: boolean) => {
    const resId = checkoutTarget;
    setCheckoutTarget(null);
    if (!resId) return;
    if (transferToDebtors) {
      const sourceFolio = folios.find((f) => f.reservationId === resId);
      if (sourceFolio?.corporateAccountId) {
        const targetFolio = folios.find(
          (f) =>
            f.id !== sourceFolio.id &&
            f.corporateAccountId === sourceFolio.corporateAccountId &&
            f.status === "open",
        );
        if (targetFolio) transferFolio(sourceFolio.id, targetFolio.id, actor, actorRole);
      }
    }
    const result = checkOut(resId);
    if (result.ok) {
      if (result.postStay) {
        toast.warning(
          transferToDebtors
            ? "Guest checked out. Balance transferred to Debtors Account — Finance to follow up."
            : `Guest checked out. Outstanding balance of ${fmtUGX(result.balance ?? 0)} remains. Collect payment from guest.`,
        );
      } else {
        toast.success("Guest checked out successfully.");
      }
    } else {
      toast.error(result.error ?? "Checkout failed.");
    }
  };

  const handleExtend = (resId: string) => {
    const r = extendStay(resId, extendDays);
    if (r.ok) {
      const res = reservationById(resId);
      toast.success(`${res?.guestName ?? "Guest"} extended by ${extendDays} day(s).`);
      setExtending(null);
      setExtendDays(1);
    } else {
      toast.error(r.error);
    }
  };

  const handleVoidRequest = (resId: string) => {
    if (!voidReason.trim()) return;
    const r = requestVoidCheckIn(resId, voidReason, actor, actorRole);
    if (r.ok) {
      toast.success("Void check-in request sent to GM for approval.");
      setVoiding(null);
      setVoidReason("");
    } else {
      toast.error(r.error);
    }
  };

  const allDueResolved = dueToday.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm pt-12 pb-8">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-xl mx-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">End-of-Day Audit — Front Desk</h2>
            <p className="text-sm text-muted-foreground">
              Business date: <span className="font-medium text-foreground">{businessDate}</span>
              {!allDueResolved && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {dueToday.length} guest{dueToday.length > 1 ? "s" : ""} to resolve
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Due Today */}
        <section className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600">
            <LogOut className="h-4 w-4" /> Due Out Today
          </h3>
          {dueToday.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              All due-out guests have been resolved.
            </div>
          ) : (
            <div className="space-y-3">
              {dueToday.map((res) => (
                <DueOutCard
                  key={res.id}
                  res={res}
                  balance={folioBalance(res.folioId ?? "")}
                  extending={extending === res.id}
                  extendDays={extendDays}
                  voiding={voiding === res.id}
                  voidReason={voidReason}
                  onCheckOut={() => handleCheckOut(res.id)}
                  onRecordPayment={() => setRecordPayment({ reservationId: res.id, folioId: res.folioId ?? "" })}
                  onStartExtend={() => { setExtending(res.id); setExtendDays(1); }}
                  onSetExtendDays={setExtendDays}
                  onExtend={() => handleExtend(res.id)}
                  onCancelExtend={() => setExtending(null)}
                  onStartVoid={() => { setVoiding(res.id); setVoidReason(""); }}
                  onSetVoidReason={setVoidReason}
                  onVoid={() => handleVoidRequest(res.id)}
                  onCancelVoid={() => setVoiding(null)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Due Tomorrow */}
        <section className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <CalendarPlus className="h-4 w-4" /> Due Out Tomorrow ({nextDate})
          </h3>
          {dueTomorrow.length === 0 ? (
            <p className="text-sm text-muted-foreground">No guests due out tomorrow.</p>
          ) : (
            <div className="space-y-2">
              {dueTomorrow.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{res.guestName}</span>
                    <span className="text-xs text-muted-foreground">#{res.id}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {roomTypeById(res.roomTypeId)?.name ?? res.roomTypeId}
                    {res.roomId && ` · Room ${roomById(res.roomId)?.id ?? res.roomId}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Done button */}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          {!allDueResolved && (
            <p className="mr-auto text-xs text-amber-600">
              Resolve all due-out guests before proceeding to POS audit.
            </p>
          )}
          <button
            onClick={() => setAuditStatus("pos")}
            disabled={!allDueResolved}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Proceed to POS Audit
          </button>
        </div>
      </div>

      {recordPayment && (
        <RecordPaymentDialog
          reservationId={recordPayment.reservationId}
          folioId={recordPayment.folioId}
          actor={actor}
          onClose={() => setRecordPayment(null)}
        />
      )}

      {checkoutRes && (
        <CheckoutConfirmationDialog
          reservation={checkoutRes}
          onConfirm={handleConfirmCheckout}
          onClose={() => setCheckoutTarget(null)}
        />
      )}
    </div>
  );
}

function DueOutCard({
  res,
  balance,
  extending,
  extendDays,
  voiding,
  voidReason,
  onCheckOut,
  onRecordPayment,
  onStartExtend,
  onSetExtendDays,
  onExtend,
  onCancelExtend,
  onStartVoid,
  onSetVoidReason,
  onVoid,
  onCancelVoid,
}: {
  res: Reservation;
  balance: number;
  extending: boolean;
  extendDays: number;
  voiding: boolean;
  voidReason: string;
  onCheckOut: () => void;
  onRecordPayment: () => void;
  onStartExtend: () => void;
  onSetExtendDays: (n: number) => void;
  onExtend: () => void;
  onCancelExtend: () => void;
  onStartVoid: () => void;
  onSetVoidReason: (s: string) => void;
  onVoid: () => void;
  onCancelVoid: () => void;
}) {
  const block = res.groupBlockId ? groupBlockById(res.groupBlockId) : undefined;
  const rt = roomTypeById(res.roomTypeId);
  const room = res.roomId ? roomById(res.roomId) : undefined;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{res.guestName}</span>
            {block && (
              <span className="inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                <Users className="h-2.5 w-2.5" />
                {block.groupName}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>#{res.id}</span>
            <span>{rt?.name ?? res.roomTypeId}</span>
            {room && <span>Room {room.id}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {extending ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={30}
                value={extendDays}
                onChange={(e) => onSetExtendDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center outline-none focus:border-primary/60"
              />
              <span className="text-xs text-muted-foreground">day(s)</span>
              <button
                onClick={onExtend}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <CalendarPlus className="h-3 w-3" />
                Save
              </button>
              <button
                onClick={onCancelExtend}
                className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : voiding ? (
            <div className="flex items-center gap-2">
              <input
                value={voidReason}
                onChange={(e) => onSetVoidReason(e.target.value)}
                placeholder="Reason for void..."
                className="w-44 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary/60"
              />
              <button
                onClick={onVoid}
                disabled={!voidReason.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                <Ban className="h-3 w-3" />
                Request Void
              </button>
              <button
                onClick={onCancelVoid}
                className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <>
              {balance > 0 && (
                <button
                  onClick={onRecordPayment}
                  className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-emerald-500/90 hover:to-green-600/90"
                >
                  <CreditCard className="h-3 w-3" />
                  Record Payment
                </button>
              )}
              <button
                onClick={onCheckOut}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <LogOut className="h-3 w-3" />
                Check Out
              </button>
              <button
                onClick={onStartExtend}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <CalendarPlus className="h-3 w-3" />
                Extend
              </button>
              <button
                onClick={onStartVoid}
                className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5"
              >
                <Ban className="h-3 w-3" />
                Void
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
