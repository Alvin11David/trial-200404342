import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Printer, Receipt, CreditCard, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHARGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  addCharge,
  addPayment,
  fmtUGX,
  folioBalance,
  reservationById,
  roomById,
  roomTypeById,
  useStore,
  type FolioChargeType,
  type PaymentMethod,
} from "@/lib/pms-store";

export const Route = createFileRoute("/_app/billing")({
  head: () => ({ meta: [{ title: "Billing & Folio — Jambo PMS" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    folio: typeof search.folio === "string" ? search.folio : undefined,
    invoice: typeof search.invoice === "string" ? search.invoice : undefined,
  }),
  component: BillingPage,
});

function BillingPage() {
  const { folio, invoice } = useSearch({ from: "/_app/billing" });
  if (invoice) return <InvoiceView folioId={invoice} />;
  if (folio) return <FolioDetail folioId={folio} />;
  return <FolioList />;
}

/* ============================== List ============================== */

function FolioList() {
  const folios = useStore((s) => s.folios);
  const reservations = useStore((s) => s.reservations);
  const navigate = useNavigate();

  const [tab, setTab] = useState<"open" | "settled" | "all">("open");
  const [q, setQ] = useState("");
  const collectedToday = useGetCollectedToday();

  const totals = useMemo(() => {
    const open = folios.filter((f) => f.status === "open");
    const totalOpen = open.reduce((s, f) => s + folioBalance(f.id), 0);
    return { open: totalOpen, count: open.length, settled: folios.filter((f) => f.status === "settled").length, collectedToday };
  }, [folios, collectedToday]);

  const rows = useMemo(() => {
    return folios
      .filter((f) => (tab === "all" ? true : f.status === tab))
      .map((f) => {
        const res = reservations.find((r) => r.id === f.reservationId);
        return {
          folio: f,
          reservation: res,
          balance: folioBalance(f.id),
        };
      })
      .filter((r) =>
        !q || `${r.folio.id} ${r.reservation?.guestName ?? ""} ${r.reservation?.id ?? ""}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
      .sort((a, b) => (a.folio.id < b.folio.id ? 1 : -1));
  }, [folios, reservations, tab, q]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Billing &amp; Folio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Folios, charges, payments and invoices.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Open folios" value={totals.count.toString()} />
        <Stat label="Total outstanding" value={fmtUGX(totals.open)} tone="warning" />
        <Stat label="Collected today" value={fmtUGX(totals.collectedToday)} tone="success" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
          {(["open", "settled", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-1.5 capitalize",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search guest, folio, reservation…"
          className="min-w-[240px] flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Folio</th>
              <th className="px-4 py-2.5 text-left font-semibold">Guest</th>
              <th className="px-4 py-2.5 text-left font-semibold">Room</th>
              <th className="px-4 py-2.5 text-left font-semibold">Reservation</th>
              <th className="px-4 py-2.5 text-left font-semibold">Status</th>
              <th className="px-4 py-2.5 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(({ folio, reservation, balance }) => (
              <tr
                key={folio.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => navigate({ to: "/billing", search: { folio: folio.id } })}
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{folio.id}</td>
                <td className="px-4 py-3 font-medium">{reservation?.guestName ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{reservation?.roomId ? `Room ${reservation.roomId}` : "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{reservation?.id ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase",
                      folio.status === "open"
                        ? "border-warning/30 bg-warning/10 text-warning"
                        : folio.status === "settled"
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {folio.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtUGX(balance)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No folios match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function useGetCollectedToday() {
  const payments = useStore((s) => s.payments);
  const today = new Date().toISOString().slice(0, 10);
  return payments.filter((p) => p.date === today).reduce((s, p) => s + p.amount, 0);
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-bold", tone === "success" && "text-success", tone === "warning" && "text-warning")}>{value}</div>
    </div>
  );
}

/* ============================== Folio Detail ============================== */

function FolioDetail({ folioId }: { folioId: string }) {
  const folios = useStore((s) => s.folios);
  const charges = useStore((s) => s.charges);
  const payments = useStore((s) => s.payments);
  const folio = folios.find((f) => f.id === folioId);
  const folioCharges = charges.filter((c) => c.folioId === folioId);
  const folioPayments = payments.filter((p) => p.folioId === folioId);
  const [showCharge, setShowCharge] = useState(false);
  const [showPay, setShowPay] = useState(false);

  if (!folio) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="text-sm text-muted-foreground">Folio not found.</p>
        <Link to="/billing" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to billing
        </Link>
      </div>
    );
  }
  const res = reservationById(folio.reservationId);
  const room = roomById(res?.roomId);
  const rt = res ? roomTypeById(res.roomTypeId) : undefined;

  const totalCharges = folioCharges.reduce((s, c) => s + c.amount, 0);
  const totalPayments = folioPayments.reduce((s, p) => s + p.amount, 0);
  const balance = totalCharges - totalPayments;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/billing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to folios
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/billing"
            search={{ invoice: folio.id } as never}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-primary/40"
          >
            <Printer className="h-3.5 w-3.5" /> View invoice
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Folio</p>
            <h2 className="font-display text-2xl font-bold">{folio.id}</h2>
            <p className="text-sm text-muted-foreground">
              Reservation {res?.id} · Guest {res?.guestName}
            </p>
            <p className="text-xs text-muted-foreground">
              Room {room?.id ?? "—"} ({rt?.name ?? "—"}) · {res?.checkIn} → {res?.checkOut}
            </p>
          </div>
          <div className="grid gap-2 text-right">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Status</p>
              <span
                className={cn(
                  "mt-1 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase",
                  folio.status === "open"
                    ? "border-warning/30 bg-warning/10 text-warning"
                    : "border-success/30 bg-success/10 text-success",
                )}
              >
                {folio.status}
              </span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Balance</p>
              <p className={cn("text-2xl font-bold", balance > 0 ? "text-warning" : "text-success")}>{fmtUGX(balance)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Charges */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <h3 className="text-sm font-semibold">Charges</h3>
              <p className="text-[11px] text-muted-foreground">{folioCharges.length} line items</p>
            </div>
            {folio.status === "open" && (
              <button
                onClick={() => setShowCharge(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3 w-3" /> Add charge
              </button>
            )}
          </div>
          <ul className="divide-y divide-border">
            {folioCharges.map((c) => (
              <li key={c.id} className="flex items-start justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium">{c.description}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {c.date} · {CHARGE_TYPE_LABEL[c.type]}
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums">{fmtUGX(c.amount)}</div>
              </li>
            ))}
            {folioCharges.length === 0 && (
              <li className="px-5 py-10 text-center text-xs text-muted-foreground">No charges yet.</li>
            )}
          </ul>
          <div className="flex justify-between border-t border-border px-5 py-3 text-sm">
            <span className="font-medium text-muted-foreground">Total charges</span>
            <span className="font-semibold">{fmtUGX(totalCharges)}</span>
          </div>
        </div>

        {/* Payments */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <h3 className="text-sm font-semibold">Payments</h3>
              <p className="text-[11px] text-muted-foreground">{folioPayments.length} transactions</p>
            </div>
            {folio.status === "open" && (
              <button
                onClick={() => setShowPay(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-success px-2.5 py-1.5 text-[11px] font-semibold text-success-foreground hover:opacity-90"
              >
                <CreditCard className="h-3 w-3" /> Record payment
              </button>
            )}
          </div>
          <ul className="divide-y divide-border">
            {folioPayments.map((p) => (
              <li key={p.id} className="flex items-start justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium">{PAYMENT_METHOD_LABEL[p.method]}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.date} {p.phone ? `· ${p.phone}` : ""} {p.reference ? `· ${p.reference}` : ""}
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums text-success">−{fmtUGX(p.amount)}</div>
              </li>
            ))}
            {folioPayments.length === 0 && (
              <li className="px-5 py-10 text-center text-xs text-muted-foreground">No payments yet.</li>
            )}
          </ul>
          <div className="flex justify-between border-t border-border px-5 py-3 text-sm">
            <span className="font-medium text-muted-foreground">Total payments</span>
            <span className="font-semibold text-success">{fmtUGX(totalPayments)}</span>
          </div>
        </div>
      </div>

      {showCharge && <AddChargeDialog folioId={folio.id} onClose={() => setShowCharge(false)} />}
      {showPay && <AddPaymentDialog folioId={folio.id} balance={balance} onClose={() => setShowPay(false)} />}
    </div>
  );
}

function AddChargeDialog({ folioId, onClose }: { folioId: string; onClose: () => void }) {
  const [type, setType] = useState<FolioChargeType>("misc");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");

  const submit = () => {
    if (!description || !amount || amount <= 0) return;
    addCharge(folioId, { type, description, amount: Number(amount) });
    onClose();
  };

  return (
    <Modal title="Add charge" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Type">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FolioChargeType)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            {(Object.entries(CHARGE_TYPE_LABEL) as [FolioChargeType, string][]).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Mini bar — soft drinks"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
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
      </div>
      <DialogFooter onCancel={onClose} onSubmit={submit} submitLabel="Post charge" disabled={!description || !amount} />
    </Modal>
  );
}

function AddPaymentDialog({ folioId, balance, onClose }: { folioId: string; balance: number; onClose: () => void }) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState<number | "">(balance > 0 ? balance : "");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");

  const submit = () => {
    if (!amount || amount <= 0) return;
    addPayment(folioId, {
      method,
      amount: Number(amount),
      phone: method === "mtn_momo" || method === "airtel_money" ? phone : undefined,
      reference: reference || undefined,
    });
    onClose();
  };

  return (
    <Modal title="Record payment" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Method">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            {(Object.entries(PAYMENT_METHOD_LABEL) as [PaymentMethod, string][]).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
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
            Current balance: <strong>{fmtUGX(balance)}</strong>. Folio auto-settles when the balance reaches zero.
          </p>
        )}
      </div>
      <DialogFooter onCancel={onClose} onSubmit={submit} submitLabel="Record payment" disabled={!amount} />
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
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
    <div className="mt-6 flex items-center justify-end gap-2">
      <button onClick={onCancel} className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted">
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  );
}

/* ============================== Invoice (printable) ============================== */

function InvoiceView({ folioId }: { folioId: string }) {
  const folios = useStore((s) => s.folios);
  const charges = useStore((s) => s.charges);
  const payments = useStore((s) => s.payments);
  const tenant = useStore((s) => s.tenant);
  const folio = folios.find((f) => f.id === folioId);
  if (!folio) return <p className="py-20 text-center text-muted-foreground">Folio not found.</p>;
  const res = reservationById(folio.reservationId);
  const folioCharges = charges.filter((c) => c.folioId === folioId);
  const folioPayments = payments.filter((p) => p.folioId === folioId);

  const subtotal = folioCharges.reduce((s, c) => s + c.amount, 0);
  // Use reservation-level vatRate if available (for historical accuracy), fall back to tenant default
  const effectiveVatRate = res?.vatRate ?? tenant.vatRate;
  const vat = subtotal - subtotal / (1 + effectiveVatRate);
  const net = subtotal - vat;
  const paid = folioPayments.reduce((s, p) => s + p.amount, 0);
  const due = subtotal - paid;

  return (
    <div className="mx-auto max-w-3xl print:max-w-none">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to="/billing" search={{ folio: folioId } as never} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to folio
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Printer className="h-3.5 w-3.5" /> Print invoice
        </button>
      </div>
      <div className="rounded-xl border border-border bg-card p-10 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{tenant.name}</h1>
            <p className="text-xs text-muted-foreground">{tenant.address}</p>
            <p className="text-xs text-muted-foreground">{tenant.phone} · {tenant.email}</p>
            <p className="text-xs text-muted-foreground">TIN: {tenant.tin}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tax Invoice</p>
            <p className="font-display text-xl font-bold">{folio.id.replace("F-", "INV-")}</p>
            <p className="text-xs text-muted-foreground">Issued: {new Date().toISOString().slice(0, 10)}</p>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Bill to</p>
            <p className="font-semibold">{res?.guestName}</p>
            <p className="text-xs text-muted-foreground">{res?.guestEmail}</p>
            <p className="text-xs text-muted-foreground">{res?.guestPhone}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Stay</p>
            <p className="text-sm font-semibold">{res?.checkIn} → {res?.checkOut}</p>
            <p className="text-xs text-muted-foreground">Room {res?.roomId ?? "—"} · Reservation {res?.id}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="border-y border-border text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2 text-left font-semibold">Date</th>
              <th className="py-2 text-left font-semibold">Description</th>
              <th className="py-2 text-left font-semibold">Type</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {folioCharges.map((c) => (
              <tr key={c.id}>
                <td className="py-2 text-xs text-muted-foreground">{c.date}</td>
                <td className="py-2">{c.description}</td>
                <td className="py-2 text-xs text-muted-foreground">{CHARGE_TYPE_LABEL[c.type]}</td>
                <td className="py-2 text-right font-medium tabular-nums">{fmtUGX(c.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-6 grid w-full max-w-xs gap-1.5 text-sm">
          <Row label="Subtotal (net)" value={fmtUGX(net)} />
          <Row label={`VAT (${(effectiveVatRate * 100).toFixed(0)}%)`} value={fmtUGX(vat)} />
          <div className="border-t border-border pt-1.5">
            <Row label="Total" value={fmtUGX(subtotal)} bold />
          </div>
          <Row label="Paid" value={"−" + fmtUGX(paid)} tone="success" />
          <div className="border-t border-border pt-1.5">
            <Row label="Balance due" value={fmtUGX(due)} bold tone={due > 0 ? "warning" : "success"} />
          </div>
        </div>

        {folioPayments.length > 0 && (
          <div className="mt-8 border-t border-border pt-4">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Payments received</p>
            <ul className="space-y-1 text-xs">
              {folioPayments.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span className="text-muted-foreground">{p.date} · {PAYMENT_METHOD_LABEL[p.method]}{p.reference ? ` · ${p.reference}` : ""}</span>
                  <span className="font-medium tabular-nums">{fmtUGX(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-10 text-center text-[10px] text-muted-foreground">
          Thank you for staying with {tenant.name}. This is a system-generated tax invoice.
        </p>
      </div>
      <style>{`@media print { body { background: white; } header, aside { display: none !important; } main { padding: 0 !important; } }`}</style>
    </div>
  );
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: "success" | "warning" }) {
  return (
    <div className="flex justify-between">
      <span className={cn("text-muted-foreground", bold && "font-semibold text-foreground")}>{label}</span>
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

/* keep imported icon to avoid unused warnings */
void Receipt;
