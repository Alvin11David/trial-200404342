import { useState } from "react";
import { X, LogOut, AlertTriangle, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  fmtUGX,
  folioBalance,
  roomById,
  roomTypeById,
  type Reservation,
  type Guest,
} from "@/lib/pms-store";

export default function CheckoutConfirmationDialog({
  reservation,
  onConfirm,
  onClose,
}: {
  reservation: Reservation;
  onConfirm: (transferToDebtors: boolean) => void;
  onClose: () => void;
}) {
  useStore((s) => s.folios);
  useStore((s) => s.charges);
  useStore((s) => s.payments);

  const guests = useStore((s) => s.guests);
  const [transferToDebtors, setTransferToDebtors] = useState(false);

  const guest: Guest | undefined = guests.find((g) => g.email === reservation.guestEmail);
  const balance = reservation.folioId ? folioBalance(reservation.folioId) : 0;
  const room = reservation.roomId ? roomById(reservation.roomId) : undefined;
  const rt = reservation.roomTypeId ? roomTypeById(reservation.roomTypeId) : undefined;

  const debtorsLabel = guest?.company ?? guest?.fullName ?? reservation.guestName;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm pt-8 pb-8">
      <div className="mx-auto w-full max-w-lg animate-in zoom-in-95 fade-in rounded-2xl border border-border/50 bg-card p-6 shadow-2xl shadow-black/10 duration-200">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight">Confirm Check-Out</h3>
            <p className="text-xs text-muted-foreground">
              {reservation.guestName}
              {rt ? ` · ${rt.name}` : ""}
              {room ? ` · Room ${room.id}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Guest / company */}
        <div className="mb-6 rounded-xl border border-border/60 bg-muted/20 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{guest?.fullName ?? reservation.guestName}</p>
              <p className="truncate text-xs text-muted-foreground">{reservation.guestEmail}</p>
              <p className="truncate text-xs text-muted-foreground">{reservation.guestPhone}</p>
              {guest?.company && (
                <p className="truncate text-xs text-muted-foreground">Company: {guest.company}</p>
              )}
            </div>
          </div>
        </div>

        {balance > 0 && (
          <>
            {/* Outstanding balance alert */}
            <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-semibold text-warning">
                    Outstanding balance of {fmtUGX(balance)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This amount is still owed. You can transfer it to a Debtors Account so Finance can
                    follow up after check-out.
                  </p>
                </div>
              </div>
            </div>

            {/* Transfer to debtors */}
            <div className="mb-6">
              <button
                onClick={() => setTransferToDebtors((v) => !v)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all",
                  transferToDebtors
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/60 hover:border-border hover:bg-muted/30",
                )}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Transfer to Debtors Account</p>
                    <p className="text-[11px] text-muted-foreground">
                      Move the outstanding balance to <strong>{debtorsLabel}</strong> for Finance to
                      collect later.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    readOnly
                    checked={transferToDebtors}
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                </div>
              </button>
            </div>
          </>
        )}

        {/* Note */}
        <div className="mb-6 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-[11px] text-muted-foreground">
          This will mark the room as dirty and send it to the housekeeping queue. This action cannot
          be undone.
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-border/60 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(transferToDebtors)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            <LogOut className="h-3.5 w-3.5" />
            Confirm Check-Out
          </button>
        </div>
      </div>
    </div>
  );
}
