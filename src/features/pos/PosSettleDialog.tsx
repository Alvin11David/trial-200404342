import { useState } from "react";
import { X, Search, User, CreditCard, Banknote, BedDouble, Smartphone, Utensils, Check, AlertCircle, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  settlePosTab,
  splitPosTab,
  lookupRoomChargeTarget,
  checkRoomChargeLimit,
  PAYMENT_METHOD_LABEL,
  ALL_PAYMENT_METHODS,
  type PaymentMethod,
  type PosTabItem,
} from "@/lib/pms-store";

type SettleMode = "pay" | "room_charge" | "split";

interface Props {
  tabId: string;
  outletId: string;
  items: PosTabItem[];
  itemNames: Record<string, string>;
  subtotal: number;
  serviceChargeAmount: number;
  vatAmount: number;
  discount: number;
  total: number;
  cashierName: string;
  onClose: () => void;
  onSettled: () => void;
}

export default function PosSettleDialog({
  tabId,
  outletId,
  items,
  itemNames,
  subtotal,
  serviceChargeAmount,
  vatAmount,
  discount,
  total,
  cashierName,
  onClose,
  onSettled,
}: Props) {
  const [mode, setMode] = useState<SettleMode>("pay");

  /* Pay state */
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tendered, setTendered] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");

  /* Room charge state */
  const [searchQuery, setSearchQuery] = useState("");
  const [guestSignature, setGuestSignature] = useState("");
  const target = searchQuery.trim() ? lookupRoomChargeTarget(searchQuery) : undefined;
  const limitCheck = target ? checkRoomChargeLimit(target.guestProfileId, total) : undefined;

  /* Split state */
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [splitWays, setSplitWays] = useState(2);

  const payAmount = total;
  const tenderedAmount = Number(tendered) || 0;
  const changeDue = method === "cash" && tenderedAmount > payAmount ? tenderedAmount - payAmount : 0;
  const insufficientTender = method === "cash" && tenderedAmount > 0 && tenderedAmount < payAmount;

  function handlePay() {
    const shortages = settlePosTab(tabId, {
      settlementMethod: "direct_payment",
      settledBy: cashierName,
      paymentMethod: method,
      folioId: `POS-${tabId}`,
    });
    shortages.forEach((s) => toast.warning(s));
    toast.success(`Payment received: ${PAYMENT_METHOD_LABEL[method]}`);
    onSettled();
  }

  function handleRoomCharge() {
    if (!target) {
      toast.error("No open folio found");
      return;
    }
    if (!guestSignature.trim()) {
      toast.error("Guest signature / confirmation is required to post to the room");
      return;
    }
    if (limitCheck && !limitCheck.allowed) {
      toast.error(limitCheck.reason ?? "Charge limit exceeded");
      return;
    }
    const shortages = settlePosTab(tabId, {
      settlementMethod: "room_charge",
      settledBy: cashierName,
      folioId: target.folio.id,
      roomChargeSignedBy: guestSignature.trim(),
    });
    shortages.forEach((s) => toast.warning(s));
    toast.success(`Charged UGX ${total.toLocaleString()} to ${target.guestName}'s folio (${target.folio.id})`);
    onSettled();
  }

  function handleSplit() {
    if (selectedItemIds.size === 0) {
      toast.error("Select items to split");
      return;
    }
    const newTabId = splitPosTab(tabId, Array.from(selectedItemIds), {
      posOutletId: outletId,
      orderType: "dine_in",
      coverCount: splitWays,
    });
    if (newTabId) {
      toast.success(`Split ${selectedItemIds.size} item(s) to new tab`);
      onSettled();
    }
  }

  const payLabel = PAYMENT_METHOD_LABEL[method];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-0 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h3 className="font-display text-lg font-bold">Settle Tab</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 border-b border-border/40 bg-muted/20 px-4 py-2">
          {([
            { id: "pay" as SettleMode, label: "Pay Now", icon: Banknote },
            { id: "room_charge" as SettleMode, label: "Room Charge", icon: BedDouble },
            { id: "split" as SettleMode, label: "Split Bill", icon: Utensils },
          ]).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition",
                  mode === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Summary always visible */}
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-sm space-y-1">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">UGX {subtotal.toLocaleString()}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-primary"><span>Discount</span><span className="tabular-nums">-UGX {discount.toLocaleString()}</span></div>
            )}
            {serviceChargeAmount > 0 && (
              <div className="flex justify-between text-muted-foreground"><span>Service Charge</span><span className="tabular-nums">UGX {serviceChargeAmount.toLocaleString()}</span></div>
            )}
            <div className="flex justify-between text-muted-foreground"><span>VAT (18%)</span><span className="tabular-nums">UGX {vatAmount.toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-border/40 pt-1.5 font-bold"><span>Total</span><span className="text-gradient-primary tabular-nums">UGX {total.toLocaleString()}</span></div>
          </div>

          {/* === PAY MODE === */}
          {mode === "pay" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PAYMENT_METHODS.map((pm) => {
                    const Icon = pm === "cash" ? Banknote : pm === "card" ? CreditCard : pm === "mtn_momo" || pm === "airtel_money" ? Smartphone : CreditCard;
                    return (
                      <button
                        key={pm}
                        onClick={() => setMethod(pm)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition",
                          method === pm
                            ? "border-primary/50 bg-primary/15 text-primary"
                            : "border-border/50 bg-background/30 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{PAYMENT_METHOD_LABEL[pm]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash: tendered + change */}
              {method === "cash" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Amount Tendered (UGX)</label>
                  <input
                    type="number"
                    value={tendered}
                    onChange={(e) => setTendered(e.target.value === "" ? "" : Number(e.target.value))}
                    min={0}
                    placeholder="Enter amount received"
                    className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                    autoFocus
                  />
                  {tenderedAmount > 0 && !insufficientTender && (
                    <p className="mt-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-xs text-success">
                      Change due: <strong>UGX {changeDue.toLocaleString()}</strong>
                    </p>
                  )}
                  {insufficientTender && (
                    <p className="mt-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      Insufficient — UGX {(payAmount - tenderedAmount).toLocaleString()} still due
                    </p>
                  )}
                </div>
              )}

              {/* Mobile money: phone */}
              {(method === "mtn_momo" || method === "airtel_money") && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone Number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+256 7XX XXX XXX"
                    className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                  />
                </div>
              )}

              {method === "card" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Reference / Last 4 digits</label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. Card ref or auth code"
                    className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                  />
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={method === "cash" && payAmount > 0 && (tenderedAmount === 0 || insufficientTender)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Charge {payLabel} — UGX {total.toLocaleString()}
              </button>
            </div>
          )}

          {/* === ROOM CHARGE MODE === */}
          {mode === "room_charge" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Search Room / Guest</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Room number, guest name, email, or phone..."
                    className="w-full rounded-xl border border-border/50 bg-background/40 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
                    autoFocus
                  />
                </div>
              </div>

              {searchQuery.trim() && (
                <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-sm">
                  {target ? (
                    <div className="space-y-3">
                      {/* Guest + Room info */}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium">{target.guestName}</span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Open</span>
                      </div>
                      {target.roomNumber && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <BedDouble className="h-3.5 w-3.5" />
                          Room <strong>{target.roomNumber}</strong>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Folio: <span className="font-mono">{target.folio.id}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Current balance: <strong>UGX {target.currentBalance.toLocaleString()}</strong>
                      </p>
                      {target.creditLimit !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Credit limit: <strong>UGX {target.creditLimit.toLocaleString()}</strong>
                          {limitCheck && (
                            <span className="ml-2">
                              (available: UGX {(limitCheck.availableCredit ?? 0).toLocaleString()})
                            </span>
                          )}
                        </p>
                      )}

                      {/* Credit limit warning */}
                      {limitCheck && !limitCheck.allowed && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{limitCheck.reason}</span>
                        </div>
                      )}

                      {/* Charge remaining indicator */}
                      {limitCheck && limitCheck.allowed && total > (limitCheck.availableCredit ?? Infinity) * 0.8 && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            This charge will use {(total / (target.creditLimit ?? 1) * 100).toFixed(0)}%
                            of available credit (UGX {(limitCheck.availableCredit ?? 0).toLocaleString()} remaining)
                          </span>
                        </div>
                      )}

                      {/* Guest signature / confirmation (delivery sign-off) */}
                      <div>
                        <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <PenLine className="h-3.5 w-3.5" />
                          Guest signature / confirmation
                        </label>
                        <input
                          value={guestSignature}
                          onChange={(e) => setGuestSignature(e.target.value)}
                          placeholder="Guest signs or confirms receipt of the order"
                          className="w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                        />
                      </div>

                      <button
                        onClick={handleRoomCharge}
                        disabled={!guestSignature.trim() || (limitCheck !== undefined && !limitCheck.allowed)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <BedDouble className="h-4 w-4" />
                        Charge UGX {total.toLocaleString()} to Room
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">No open folio found for "{searchQuery.trim()}"</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* === SPLIT MODE === */}
          {mode === "split" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Select items to split off</label>
                <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-border/40 bg-background/20 p-2">
                  {items.filter((i) => !i.isVoided).map((item) => {
                    const checked = selectedItemIds.has(item.id);
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                          checked ? "bg-primary/10 text-primary" : "hover:bg-muted/30",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = new Set(selectedItemIds);
                              if (checked) next.delete(item.id); else next.add(item.id);
                              setSelectedItemIds(next);
                            }}
                            className="h-4 w-4 rounded border-border accent-primary"
                          />
                          <span>{itemNames[item.menuItemId] ?? item.menuItemId} ×{item.quantity}</span>
                        </div>
                        <span className="tabular-nums text-xs text-muted-foreground">
                          UGX {(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Split into</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={splitWays}
                    onChange={(e) => setSplitWays(Math.max(2, Number(e.target.value)))}
                    min={2}
                    className="w-20 rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm text-center outline-none focus:border-primary/50"
                  />
                  <span className="text-xs text-muted-foreground">ways</span>
                  {selectedItemIds.size > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({selectedItemIds.size} item{selectedItemIds.size !== 1 ? "s" : ""} · UGX {items.filter((i) => selectedItemIds.has(i.id)).reduce((s, i) => s + i.unitPrice * i.quantity, 0).toLocaleString()})
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleSplit}
                disabled={selectedItemIds.size === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:shadow-amber-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Utensils className="h-4 w-4" />
                Split {selectedItemIds.size} item{selectedItemIds.size !== 1 ? "s" : ""} into New Tab
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
