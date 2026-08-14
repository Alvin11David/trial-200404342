import { useMemo, useState } from "react";
import {
  useStore,
  supplierInvoiceLinesFor,
  supplierInvoiceMatchStatus,
  supplierPaymentsForInvoice,
  upsertSupplierInvoice,
  cancelSupplierInvoice,
  deleteSupplierInvoice,
  recordSupplierPayment,
  supplierById,
  purchaseOrderById,
  purchaseOrderItemsByPo,
  goodsReceiptsForPo,
  goodsReceiptItemsFor,
  stockItemById,
  fmtUGX,
  type SupplierInvoice,
} from "@/lib/pms-store";
import { ROLE_META, useRole } from "@/lib/role";
import { Plus, X, Eye, Trash2, Ban, Wallet, CheckCircle2, AlertTriangle, Printer } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";

const matchBadge = (s: string) => {
  const map: Record<string, string> = {
    matched: "bg-success/15 text-success",
    unmatched: "bg-destructive/15 text-destructive",
    paid: "bg-primary/15 text-primary",
    cancelled: "bg-muted text-muted-foreground",
  };
  return `px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? "bg-muted text-muted-foreground"}`;
};

export default function SupplierInvoicesPage() {
  const invoices = useStore((s) => s.supplierInvoices);
  const [newOpen, setNewOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const statuses = useMemo(() => {
    const map = new Map<string, { status: string; mismatches: string[] }>();
    for (const inv of invoices) {
      const m = supplierInvoiceMatchStatus(inv.id);
      map.set(inv.id, { status: m.status, mismatches: m.mismatches });
    }
    return map;
  }, [invoices]);

  const unpaid = invoices.filter((i) => (i.paidAmount ?? 0) < i.amount && i.status !== "cancelled");
  const outstandingTotal = unpaid.reduce((s, i) => s + (i.amount - (i.paidAmount ?? 0)), 0);
  const matchedCount = invoices.filter((i) => statuses.get(i.id)?.status === "matched").length;
  const unmatchedCount = invoices.filter((i) => statuses.get(i.id)?.status === "unmatched").length;

  const detail = detailId ? invoices.find((i) => i.id === detailId) : undefined;

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Supplier Invoices</h1>
            <p className="text-sm text-muted-foreground">Register supplier invoices against POs — 3-way match (PO / GRN / Invoice) must pass before payment</p>
          </div>
          <button onClick={() => setNewOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
            <Plus size={16} /> New Invoice
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Matched</p>
            <p className="mt-1 text-2xl font-bold text-success">{matchedCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unmatched</p>
            <p className="mt-1 text-2xl font-bold text-destructive">{unmatchedCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unpaid</p>
            <p className="mt-1 text-2xl font-bold">{unpaid.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{fmtUGX(outstandingTotal)}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">PO</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3">3-Way Match</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const ms = statuses.get(inv.id);
                const paid = inv.paidAmount ?? 0;
                return (
                  <tr key={inv.id} className="border-t border-border/40">
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNo}</td>
                    <td className="px-4 py-3">{supplierById(inv.supplierId)?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{purchaseOrderById(inv.poId)?.orderNumber ?? inv.poId}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtUGX(inv.amount)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-success">{fmtUGX(paid)}</td>
                    <td className="px-4 py-3">
                      <span className={matchBadge(ms?.status ?? "unmatched")}>{ms?.status ?? "unmatched"}</span>
                    </td>
                    <td className="px-4 py-3"><span className={matchBadge(inv.status)}>{inv.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDetailId(inv.id)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="View">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground/70">No supplier invoices yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {newOpen && <NewInvoiceModal onClose={() => setNewOpen(false)} />}

      {detail && <InvoiceDetail invoice={detail} onClose={() => setDetailId(null)} />}
    </>
  );
}

function NewInvoiceModal({ onClose }: { onClose: () => void }) {
  const pos = useStore((s) => s.purchaseOrders);
  const invoices = useStore((s) => s.supplierInvoices);
  const { role } = useRole();
  const actor = ROLE_META[role].person;
  const receivable = pos.filter((p) => p.status === "received" || p.status === "partially_received");
  const [poId, setPoId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [taxAmount, setTaxAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<{ stockItemId: string; quantity: number; unitCost: number }[]>([]);

  function loadPo(id: string) {
    setPoId(id);
    const grns = goodsReceiptsForPo(id);
    const grnItems = grns.flatMap((g) => goodsReceiptItemsFor(g.id));
    const totals = new Map<string, { qty: number; cost: number }>();
    for (const g of grnItems) {
      const cur = totals.get(g.stockItemId) ?? { qty: 0, cost: g.unitCost };
      cur.qty += g.quantityReceived;
      totals.set(g.stockItemId, cur);
    }
    setLines([...totals.entries()].map(([stockItemId, v]) => ({ stockItemId, quantity: v.qty, unitCost: v.cost })));
    if (!invoiceNo) setInvoiceNo(`INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, "0")}`);
  }

  function save() {
    const po = pos.find((p) => p.id === poId);
    if (!po) { toast.error("Select a purchase order"); return; }
    if (!invoiceNo.trim()) { toast.error("Enter the supplier invoice number"); return; }
    if (lines.length === 0) { toast.error("Add at least one line"); return; }
    const res = upsertSupplierInvoice({
      supplierId: po.supplierId!,
      poId,
      invoiceNo: invoiceNo.trim(),
      invoiceDate: new Date(invoiceDate).toISOString(),
      taxAmount: parseInt(taxAmount, 10) || 0,
      notes: notes.trim() || undefined,
      createdBy: actor,
      lines: lines.filter((l) => l.quantity > 0),
    });
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Invoice ${invoiceNo} registered — awaiting 3-way match`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">New Supplier Invoice</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Purchase Order (received)</label>
            <select value={poId} onChange={(e) => loadPo(e.target.value)} className={cn(inputCls, "mt-1 w-full")}>
              <option value="">Select PO</option>
              {receivable.map((p) => (
                <option key={p.id} value={p.id}>{p.orderNumber} · {supplierById(p.supplierId)?.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Supplier Invoice #</label>
            <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className={cn(inputCls, "mt-1 w-full")} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Invoice Date</label>
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={cn(inputCls, "mt-1 w-full")} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tax / Other (UGX)</label>
            <input type="number" min={0} value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} className={cn(inputCls, "mt-1 w-full")} />
          </div>
        </div>
        {poId && (
          <>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                  <th className="py-2 text-left">Item</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit Cost</th>
                  <th className="py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {lines.map((l, i) => {
                  const si = stockItemById(l.stockItemId);
                  return (
                    <tr key={l.stockItemId}>
                      <td className="py-2">{si?.name ?? l.stockItemId}</td>
                      <td className="py-2 text-right">
                        <input type="number" min={0} value={l.quantity} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, quantity: Math.max(0, Number(e.target.value)) } : x))} className={cn(inputCls, "w-24 text-right")} />
                      </td>
                      <td className="py-2 text-right">
                        <input type="number" min={0} value={l.unitCost} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, unitCost: Math.max(0, Number(e.target.value)) } : x))} className={cn(inputCls, "w-24 text-right")} />
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums">{fmtUGX(l.quantity * l.unitCost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-right text-sm font-bold tabular-nums">
              Total: {fmtUGX(lines.reduce((s, l) => s + l.quantity * l.unitCost, 0) + (parseInt(taxAmount, 10) || 0))}
            </p>
          </>
        )}
        <div className="mt-3">
          <label className="text-xs font-medium text-muted-foreground">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(inputCls, "mt-1 w-full")} rows={2} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-muted">Cancel</button>
          <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">Register Invoice</button>
        </div>
      </div>
    </div>
  );
}

function InvoiceDetail({ invoice, onClose }: { invoice: SupplierInvoice; onClose: () => void }) {
  const { role } = useRole();
  const actor = ROLE_META[role].person;
  const canPay = role === "Accountant" || role === "Owner / GM";
  const match = supplierInvoiceMatchStatus(invoice.id);
  const tenant = useStore((s) => s.tenant);
  const supplier = supplierById(invoice.supplierId);
  const po = purchaseOrderById(invoice.poId);
  const poItems = purchaseOrderItemsByPo(invoice.poId);
  const lines = supplierInvoiceLinesFor(invoice.id);
  const payments = supplierPaymentsForInvoice(invoice.id);
  const paid = invoice.paidAmount ?? 0;
  const outstanding = invoice.amount - paid;
  const [payOpen, setPayOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div id="print-area" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-1">
          <div>
            <h2 className="text-lg font-bold">Supplier Invoice {invoice.invoiceNo}</h2>
            <p className="text-sm text-muted-foreground">
              {supplier?.name} · {po?.orderNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Printer size={14} /> Print
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>
        </div>

        <div className="hidden print:block">
          <div className="flex items-start justify-between border-b border-foreground/20 pb-4">
            <div>
              <h1 className="text-xl font-bold">{tenant.name}</h1>
              <p className="text-xs">{tenant.address}</p>
              <p className="text-xs">{tenant.phone} · {tenant.email}</p>
              <p className="text-xs">TIN: {tenant.tin}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Supplier Invoice</p>
              <p className="text-lg font-bold">{invoice.invoiceNo}</p>
              <p className="text-xs">Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
              <p className="text-xs">PO: {po?.orderNumber ?? invoice.poId}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Supplier</p>
              <p className="mt-0.5 font-semibold">{supplier?.name ?? "—"}</p>
              {supplier?.contactPerson && <p>{supplier.contactPerson}</p>}
              {supplier?.address && <p>{supplier.address}</p>}
              {supplier?.phone && <p>{supplier.phone}</p>}
              {supplier?.email && <p>{supplier.email}</p>}
              {supplier?.taxId && <p>TIN: {supplier.taxId}</p>}
            </div>
            <div className="text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Payment Status</p>
              <p className="mt-0.5 font-semibold capitalize">{invoice.status}</p>
              <p>3-way match: {match.status}</p>
            </div>
          </div>
        </div>

        <div className="no-print mt-3 flex flex-wrap items-center gap-2">
          <span className={matchBadge(invoice.status)}>{invoice.status}</span>
          <span className={matchBadge(match.status)}>3-way match: {match.status}</span>
        </div>

        {match.status === "unmatched" && (
          <div className="no-print mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Payment is blocked until these mismatches are resolved</p>
              <ul className="mt-1 list-inside list-disc">{match.mismatches.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          </div>
        )}

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
              <th className="py-2 text-left">Item</th>
              <th className="py-2 text-right">Ordered</th>
              <th className="py-2 text-right">Received</th>
              <th className="py-2 text-right">Invoiced</th>
              <th className="py-2 text-right">Unit Cost</th>
              <th className="py-2 text-right">Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {match.lines.map((l) => (
              <tr key={l.stockItemId} className={cn(!l.ok && "bg-destructive/5")}>
                <td className="py-2">{stockItemById(l.stockItemId)?.name ?? l.stockItemId}</td>
                <td className="py-2 text-right tabular-nums">{l.ordered}</td>
                <td className="py-2 text-right tabular-nums">{l.received}</td>
                <td className="py-2 text-right tabular-nums">{l.invoiced}</td>
                <td className="py-2 text-right tabular-nums">{fmtUGX(l.invoicedUnitCost)}</td>
                <td className="py-2 text-right">
                  {l.ok ? <CheckCircle2 size={16} className="ml-auto text-success" /> : <AlertTriangle size={16} className="ml-auto text-destructive" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Amount {fmtUGX(invoice.amount)} · Paid <span className="text-success">{fmtUGX(paid)}</span> · Outstanding <strong>{fmtUGX(outstanding)}</strong>
          </p>
          <div className="no-print flex gap-2">
            {invoice.status === "unmatched" && (
              <button onClick={() => { if (window.confirm("Delete this unmatched invoice?")) { deleteSupplierInvoice(invoice.id); toast.success("Invoice deleted"); onClose(); } }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                <Trash2 size={13} /> Delete
              </button>
            )}
            {(invoice.status === "unmatched" || invoice.status === "matched") && (
              <button onClick={() => { if (window.confirm(`Cancel invoice ${invoice.invoiceNo}?`)) { cancelSupplierInvoice(invoice.id); toast.success("Invoice cancelled"); } }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                <Ban size={13} /> Cancel
              </button>
            )}
            {canPay && outstanding > 0 && invoice.status !== "cancelled" && (
              <button
                onClick={() => {
                  if (match.status !== "matched") { toast.error("3-way match required — resolve PO/GRN/Invoice mismatches first"); return; }
                  setPayOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Wallet size={13} /> Record Payment
              </button>
            )}
          </div>
        </div>

        {payments.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment History</p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border/30">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-1.5 text-xs text-muted-foreground">{new Date(p.paidAt).toLocaleString()}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">{fmtUGX(p.amount)}</td>
                    <td className="py-1.5 text-right text-xs text-muted-foreground">{p.method}{p.reference ? ` · ${p.reference}` : ""} · {p.paidBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {poItems.length > 0 && <p className="no-print mt-3 text-xs text-muted-foreground/70">{poItems.length} PO line(s) · {lines.length} invoice line(s)</p>}

        <div className="no-print mt-5 flex justify-end">
          <button onClick={onClose} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">Close</button>
        </div>

        <style>{`@media print { body > * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; max-height: none !important; overflow: visible !important; box-shadow: none !important; border: none !important; } .no-print { display: none !important; } @page { margin: 1.5cm; size: A4 portrait; } }`}</style>
      </div>

      {payOpen && (
        <PaymentModal
          invoice={invoice}
          outstanding={outstanding}
          paidBy={actor}
          onClose={() => setPayOpen(false)}
          onPaid={() => setPayOpen(false)}
        />
      )}
    </div>
  );
}

function PaymentModal({ invoice, outstanding, paidBy, onClose, onPaid }: { invoice: SupplierInvoice; outstanding: number; paidBy: string; onClose: () => void; onPaid: () => void }) {
  const [amount, setAmount] = useState(String(outstanding));
  const [method, setMethod] = useState<"bank_transfer" | "cash" | "mtn_momo" | "airtel_money" | "card">("bank_transfer");
  const [reference, setReference] = useState("");
  const payMethods = ["bank_transfer", "cash", "mtn_momo", "airtel_money", "card"] as const;

  function submit() {
    const amt = parseInt(amount, 10);
    const res = recordSupplierPayment({ supplierInvoiceId: invoice.id, amount: amt, method, reference: reference.trim() || undefined, paidBy });
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Payment recorded — invoice settled");
    onPaid();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Record Payment — {invoice.invoiceNo}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount (outstanding {fmtUGX(outstanding)})</label>
            <input type="number" min={1} max={outstanding} value={amount} onChange={(e) => setAmount(e.target.value)} className={cn(inputCls, "mt-1 w-full")} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className={cn(inputCls, "mt-1 w-full")}>
              {payMethods.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Reference (optional)</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} className={cn(inputCls, "mt-1 w-full")} placeholder="e.g. RTGS ref, MTN ref" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-muted">Cancel</button>
            <button onClick={submit} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
              <Wallet size={15} /> Pay {fmtUGX(parseInt(amount, 10) || 0)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
