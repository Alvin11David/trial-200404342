import { useState } from "react";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  fmtUGX,
  addPayment,
  folioBalance,
  reservationById,
  roomById,
  roomTypeById,
  PAYMENT_METHOD_LABEL,
  ALL_PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/pms-store";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RecordPaymentDialog({
  reservationId,
  folioId,
  onClose,
  actor = "Front Desk",
}: {
  reservationId: string;
  folioId: string;
  onClose: () => void;
  actor?: string;
}) {
  useStore((s) => s.folios);
  useStore((s) => s.charges);
  useStore((s) => s.payments);

  const balance = folioBalance(folioId);
  const reservation = reservationById(reservationId);
  const room = reservation?.roomId ? roomById(reservation.roomId) : undefined;
  const rt = reservation?.roomTypeId ? roomTypeById(reservation.roomTypeId) : undefined;

  const methods = ALL_PAYMENT_METHODS.filter((m) => m !== "charge_to_room");

  const [mode, setMode] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState<number | "">(balance > 0 ? balance : "");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  const payAmount = mode === "full" ? balance : Number(amount) || 0;
  const remainingAfter = Math.max(0, balance - payAmount);
  const overpay = payAmount > balance;

  const canSubmit = payAmount > 0;

  const handleModeChange = (next: "full" | "partial") => {
    setMode(next);
    if (next === "full") setAmount(balance > 0 ? balance : "");
    else setAmount("");
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setLoading(true);
    addPayment(folioId, {
      method,
      amount: payAmount,
      tendered: method === "cash" ? payAmount : undefined,
      phone: method === "mtn_momo" || method === "airtel_money" ? phone : undefined,
      reference: reference || undefined,
      receivedBy: actor,
    });
    setLoading(false);
    toast.success("Payment recorded.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm pt-8 pb-8">
      <div className="mx-auto w-full max-w-lg animate-in zoom-in-95 fade-in rounded-2xl border border-border/50 bg-card p-6 shadow-2xl shadow-black/10 duration-200">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight">Record Payment</h3>
            <p className="text-xs text-muted-foreground">
              {reservation?.guestName ?? "—"}
              {rt ? ` &middot; ${rt.name}` : ""}
              {room ? ` &middot; Room ${room.id}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Outstanding balance */}
        <div className="mb-6 rounded-xl border border-border/60 bg-muted/20 p-5 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Outstanding Balance
          </p>
          <p className="mt-1 font-display text-3xl font-bold tracking-tight">{fmtUGX(balance)}</p>
        </div>

        {/* Full / Partial toggle */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Payment Type
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleModeChange("full")}
              disabled={loading}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                mode === "full"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60 hover:border-border hover:bg-muted/30",
              )}
            >
              <p className="text-sm font-semibold">Full Payment</p>
              <p className="text-[11px] text-muted-foreground">
                Pays the exact outstanding balance
              </p>
            </button>
            <button
              onClick={() => handleModeChange("partial")}
              disabled={loading}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                mode === "partial"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60 hover:border-border hover:bg-muted/30",
              )}
            >
              <p className="text-sm font-semibold">Partial Payment</p>
              <p className="text-[11px] text-muted-foreground">
                Enter any amount against the balance
              </p>
            </button>
          </div>
        </div>

        {/* Amount received */}
        <div className="mb-6 space-y-2">
          <label className="block space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Amount Tendered (UGX)
            </span>
            <input
              type="number"
              value={mode === "full" ? balance : amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={mode === "full" || loading}
              min={0}
              placeholder="Enter amount received"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 disabled:bg-muted/30 disabled:text-muted-foreground"
            />
          </label>
          {mode === "full" && balance > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Full payment — records the entire outstanding balance.
            </p>
          )}
          {mode === "partial" && payAmount > 0 && (
            <p
              className={cn(
                "rounded-md border px-3 py-2 text-[11px]",
                overpay
                  ? "border-info/20 bg-info/10 text-info"
                  : "border-success/20 bg-success/10 text-success",
              )}
            >
              Remaining balance after this payment: <strong>{fmtUGX(remainingAfter)}</strong>
              {overpay && " (overpayment will create a credit)"}
            </p>
          )}
          {mode === "full" && balance <= 0 && (
            <p className="rounded-md border border-info/20 bg-info/10 px-3 py-2 text-[11px] text-info">
              Folio has no outstanding balance.
            </p>
          )}
        </div>

        {/* Method */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Payment Method
          </p>
          <div className="mt-2 space-y-2">
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
              disabled={loading}
            >
              <SelectTrigger className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {methods.map((k) => (
                  <SelectItem key={k} value={k} className="rounded-lg">
                    {PAYMENT_METHOD_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {method === "mtn_momo" || method === "airtel_money" ? (
              <div className="rounded-xl border border-border/60 p-4">
                <label className="block space-y-1.5">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Mobile Money Phone
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    placeholder="+256 7XX XXX XXX"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                </label>
              </div>
            ) : null}

            <label className="block space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Reference (optional)
              </span>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={loading}
                placeholder="Txn ID / receipt #"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-border/60 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-emerald-500/90 hover:to-green-600/90 hover:shadow-md disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Record Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
