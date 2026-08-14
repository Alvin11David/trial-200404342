import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  X,
  CreditCard,
  Ban,
  Loader2,
  Users,
  ShoppingCart,
} from "lucide-react";
import {
  useStore,
  fmtUGX,
  settlePosTab,
  createApprovalRequest,
  getUserRoleNames,
  setAuditStatus,
} from "@/lib/pms-store";
import type { PaymentMethod } from "@/lib/pms-store";

export default function POSAuditView() {
  const openTabs = useStore((s) => s.posTabs.filter((t) => t.status === "open"));
  const allItems = useStore((s) => s.posTabItems);
  const users = useStore((s) => s.users);
  const folios = useStore((s) => s.folios);
  const reservations = useStore((s) => s.reservations);

  const actor = users.find((u) => u.isActive && getUserRoleNames(u.id).includes("POS / Cashier"))?.fullName ?? "POS Cashier";
  const actorRole = "POS / Cashier";

  const [paying, setPaying] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [folioId, setFolioId] = useState("");
  const [voidingTab, setVoidingTab] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const allResolved = openTabs.length === 0;

  const handleConfirmPaid = (tabId: string) => {
    setSettlingId(tabId);
    const shortages = settlePosTab(tabId, {
      settlementMethod: "direct_payment",
      settledBy: actor,
      paymentMethod: payMethod,
    });
    setSettlingId(null);
    shortages.forEach((s) => toast.warning(s));
    toast.success(`Tab settled via ${payMethod.replace(/_/g, " ")}.`);
    setPaying(null);
  };

  const handleChargeToFolio = (tabId: string) => {
    if (!folioId) return;
    setSettlingId(tabId);
    const shortages = settlePosTab(tabId, {
      settlementMethod: "room_charge",
      settledBy: actor,
      folioId,
    });
    setSettlingId(null);
    shortages.forEach((s) => toast.warning(s));
    toast.success("Charged to guest folio.");
    setPaying(null);
    setFolioId("");
  };

  const handleVoidTab = (tabId: string) => {
    if (!voidReason.trim()) return;
    createApprovalRequest(
      "void_charge",
      "",
      { tabId, reason: voidReason },
      actor,
      actorRole,
    );
    toast.success("Void request sent to GM for approval.");
    setVoidingTab(null);
    setVoidReason("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm pt-12 pb-8">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-xl mx-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">End-of-Day Audit — POS</h2>
            <p className="text-sm text-muted-foreground">
              {openTabs.length} open tab{openTabs.length !== 1 ? "s" : ""} to resolve
            </p>
          </div>
        </div>

        {allResolved ? (
          <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            All open POS tabs have been resolved.
          </div>
        ) : (
          <div className="space-y-3">
            {openTabs.map((tab) => {
              const items = allItems.filter((i) => i.posTabId === tab.id && !i.isVoided);
              return (
                <div
                  key={tab.id}
                  className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Tab #{tab.id}</span>
                        <span className="text-xs text-muted-foreground">
                          {tab.orderType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {items.slice(0, 5).map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{item.quantity}x</span>
                            <span>{item.menuItemId}</span>
                            <span className="ml-auto">{fmtUGX(item.unitPrice * item.quantity)}</span>
                          </div>
                        ))}
                        {items.length > 5 && (
                          <p className="text-xs text-muted-foreground">...and {items.length - 5} more</p>
                        )}
                      </div>
                      <div className="mt-2 text-sm font-semibold">{fmtUGX(tab.totalAmount)}</div>
                    </div>

                    <div className="flex items-start gap-2 shrink-0">
                      {paying === tab.id ? (
                        <div className="flex flex-col gap-2">
                          <select
                            value={payMethod}
                            onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none"
                          >
                            {(["cash", "card", "mtn_momo", "airtel_money", "bank_transfer"] as const).map((m) => (
                              <option key={m} value={m}>
                                {m === "cash" ? "Cash" : m === "card" ? "Card" : m === "mtn_momo" ? "MTN Mobile Money" : m === "airtel_money" ? "Airtel Money" : "Bank Transfer"}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleConfirmPaid(tab.id)}
                            disabled={settlingId === tab.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            {settlingId === tab.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CreditCard className="h-3 w-3" />
                            )}
                            Confirm Paid
                          </button>
                          <div className="flex items-center gap-1">
                            <input
                              value={folioId}
                              onChange={(e) => setFolioId(e.target.value)}
                              placeholder="Folio ID..."
                              className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none"
                            />
                            <button
                              onClick={() => handleChargeToFolio(tab.id)}
                              disabled={settlingId === tab.id || !folioId}
                              className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
                            >
                              Charge
                            </button>
                          </div>
                          <button
                            onClick={() => { setPaying(null); setFolioId(""); }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : voidingTab === tab.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            value={voidReason}
                            onChange={(e) => setVoidReason(e.target.value)}
                            placeholder="Reason..."
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none"
                          />
                          <button
                            onClick={() => handleVoidTab(tab.id)}
                            disabled={!voidReason.trim()}
                            className="inline-flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                          >
                            <Ban className="h-3 w-3" />
                            Request Void
                          </button>
                          <button
                            onClick={() => { setVoidingTab(null); setVoidReason(""); }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => { setPaying(tab.id); setVoidingTab(null); }}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                          >
                            <CreditCard className="h-3 w-3" />
                            Pay / Charge
                          </button>
                          <button
                            onClick={() => { setVoidingTab(tab.id); setPaying(null); }}
                            className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5"
                          >
                            <Ban className="h-3 w-3" />
                            Void
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          {!allResolved && (
            <p className="mr-auto text-xs text-amber-600">
              Resolve all open tabs before completing the audit.
            </p>
          )}
          <button
            onClick={() => setAuditStatus("calculating")}
            disabled={!allResolved}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Calculate & Close Day
          </button>
        </div>
      </div>
    </div>
  );
}
