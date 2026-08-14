import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  FileText,
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Smartphone,
  Mail,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fmtUGX,
  useStore,
  searchInvoices,
  invoiceLineItemsFor,
  submitToEFRIS,
  type Invoice,
  type InvoiceLineItem,
  type EFRISStatus,
  type InvoiceStatus,
} from "@/lib/pms-store";
import { ROLE_META, useRole } from "@/lib/role";
import { toast } from "sonner";

const EFRIS_BADGE: Record<
  EFRISStatus,
  { label: string; class: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: "Pending", class: "bg-warning/15 text-warning border-warning/30", icon: Clock },
  submitted: {
    label: "Submitted",
    class: "bg-sky-500/15 text-sky-600 border-sky-500/30 dark:text-sky-400",
    icon: ExternalLink,
  },
  failed: {
    label: "Failed",
    class: "bg-destructive/15 text-destructive border-destructive/30",
    icon: AlertTriangle,
  },
  confirmed: {
    label: "Confirmed",
    class: "bg-success/15 text-success border-success/30",
    icon: CheckCircle2,
  },
};

const STATUS_BADGE: Record<InvoiceStatus, { label: string; class: string }> = {
  draft: { label: "Draft", class: "bg-muted/50 text-muted-foreground border-muted-foreground/30" },
  issued: { label: "Issued", class: "bg-warning/15 text-warning border-warning/30" },
  paid: { label: "Paid in Full", class: "bg-success/15 text-success border-success/30" },
  overdue: { label: "Overdue", class: "bg-destructive/15 text-destructive border-destructive/30" },
  cancelled: { label: "Cancelled", class: "bg-muted/50 text-muted-foreground border-muted-foreground/30" },
};

export default function InvoicesPage() {
  const invoices = useStore((s) => s.invoices);
  const tenant = useStore((s) => s.tenant);
  const { role } = useRole();
  const actor = ROLE_META[role]?.person ?? role;

  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [efrisFilter, setEfrisFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const canManage = role === "Accountant" || role === "Owner / GM";

  const filtered = useMemo(() => {
    const list = searchInvoices({
      q: query || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      eFRISStatus: efrisFilter !== "all" ? efrisFilter : undefined,
    });
    list.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    return list;
  }, [invoices, query, dateFrom, dateTo, statusFilter, efrisFilter]);

  const selectedLines = useMemo(
    () => (selectedInvoice ? invoiceLineItemsFor(selectedInvoice.id) : []),
    [selectedInvoice, invoices],
  );

  const creditNotes = useMemo(() => invoices.filter((i) => i.isCreditNote), [invoices]);

  const pendingEfris = useMemo(
    () => invoices.filter((i) => !i.isCreditNote && i.eFRISStatus === "pending").length,
    [invoices],
  );

  const handleSubmitEFRIS = async (inv: Invoice) => {
    if (inv.eFRISStatus === "confirmed") {
      toast.info("Already submitted to EFRIS");
      return;
    }
    const result = await submitToEFRIS(inv.id, actor, role);
    if (result) toast.success("EFRIS submission confirmed");
    else toast.error("EFRIS submission failed — will retry automatically");
  };

  if (selectedInvoice) {
    return (
      <InvoiceDetail
        inv={selectedInvoice}
        lines={selectedLines}
        tenant={tenant}
        canManage={canManage}
        onBack={() => setSelectedInvoice(null)}
        onSubmitEFRIS={handleSubmitEFRIS}
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">Invoices</h1>
          <p className="text-xs text-muted-foreground">Search, view, and manage fiscal invoices</p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/40"
        >
          <Filter className="h-3.5 w-3.5" /> {showFilters ? "Less" : "More"} filters
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Guest name, invoice no, reservation..."
                className="w-full rounded-lg border border-border/60 bg-card py-2 pl-9 pr-3 text-xs outline-none focus:border-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              From
            </label>
            <DatePicker value={dateFrom} onChange={setDateFrom} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              To
            </label>
            <DatePicker value={dateTo} onChange={setDateTo} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs outline-none shadow-none focus:border-primary/50 focus:ring-0">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="paid">Paid in Full</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              EFRIS
            </label>
            <Select value={efrisFilter} onValueChange={setEfrisFilter}>
              <SelectTrigger className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs outline-none shadow-none focus:border-primary/50 focus:ring-0">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Guest
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  EFRIS
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const EF = EFRIS_BADGE[inv.eFRISStatus];
                const ST = STATUS_BADGE[inv.status];
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-border/30 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold">{inv.invoiceNo}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{inv.guestName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {inv.issuedAt.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                      {fmtUGX(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                          ST.class,
                        )}
                      >
                        {ST.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                          EF.class,
                        )}
                      >
                        <EF.icon className="h-3 w-3" />
                        {EF.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        View <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground">
            <FileText className="h-8 w-8 opacity-40" />
            <p>No invoices match your search.</p>
          </div>
        )}
      </div>

      {creditNotes.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Credit Notes ({creditNotes.length})
          </h3>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Credit Note
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Original Invoice
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      EFRIS
                    </th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {creditNotes.map((cnote) => {
                    const EF = EFRIS_BADGE[cnote.eFRISStatus];
                    return (
                      <tr key={cnote.id} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-sm font-semibold">
                          {cnote.invoiceNo}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {cnote.creditNoteFor}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {cnote.creditNoteReason}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-medium text-destructive">
                          {fmtUGX(cnote.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                              EF.class,
                            )}
                          >
                            <EF.icon className="h-3 w-3" />
                            {EF.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedInvoice(cnote)}
                            className="text-xs text-primary hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-[10px] text-muted-foreground">
        {filtered.length} invoice(s) · {pendingEfris} pending EFRIS
      </div>
    </div>
  );
}

function InvoiceDetail({
  inv,
  lines,
  tenant,
  canManage,
  onBack,
  onSubmitEFRIS,
}: {
  inv: Invoice;
  lines: InvoiceLineItem[];
  tenant: { name: string; address?: string; phone?: string; email?: string; tin?: string };
  canManage: boolean;
  onBack: () => void;
  onSubmitEFRIS: (inv: Invoice) => void;
}) {
  const reservations = useStore((s) => s.reservations);
  const res = reservations.find((r) => r.id === inv.reservationId);
  const paid = inv.paidAmount > 0 ? inv.paidAmount : inv.amountPaid ?? 0;
  const outstanding = inv.outstandingAmount;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-6 print:max-w-none print:p-0">
      <div className="mb-1 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </button>
        <div className="flex items-center gap-2">
          {res?.guestPhone && (
            <button
              onClick={() => {
                const text = `Invoice ${inv.invoiceNo} from ${tenant.name}\nTotal: UGX ${inv.totalAmount.toLocaleString()}\nPaid: UGX ${paid.toLocaleString()}\nBalance: UGX ${Math.max(0, outstanding).toLocaleString()}\nThank you for staying with us.`;
                window.open(
                  `https://wa.me/${res.guestPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`,
                  "_blank",
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Smartphone className="h-3.5 w-3.5" /> WhatsApp
            </button>
          )}
          {res?.guestEmail && (
            <a
              href={`mailto:${res.guestEmail}?subject=Invoice ${inv.invoiceNo} from ${tenant.name}&body=Dear ${inv.guestName},%0A%0APlease find your invoice ${inv.invoiceNo} attached.%0A%0ATotal: UGX ${inv.totalAmount.toLocaleString()}%0APaid: UGX ${paid.toLocaleString()}%0ABalance: UGX ${Math.max(0, outstanding).toLocaleString()}%0A%0AThank you for staying with ${tenant.name}.`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </a>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/70 hover:shadow-md"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          {canManage && !inv.isCreditNote && (
            <button
              onClick={() => onSubmitEFRIS(inv)}
              disabled={inv.eFRISStatus === "confirmed"}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Submit to EFRIS
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm print:border-0 print:shadow-none">
        <div className="p-8 sm:p-10">
          <div className="flex items-start justify-between border-b border-border/50 pb-6">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight">{tenant.name}</h1>
              <p className="text-xs text-muted-foreground/70">{tenant.address}</p>
              <p className="text-xs text-muted-foreground/70">
                {tenant.phone} · {tenant.email}
              </p>
              <p className="text-xs text-muted-foreground/60">TIN: {tenant.tin}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex rounded-xl bg-gradient-to-br from-primary/[0.08] to-transparent px-4 py-2 ring-1 ring-primary/10">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
                    {inv.isCreditNote ? "Credit Note" : "Tax Invoice"}
                  </p>
                  <p className="font-display text-xl font-bold">{inv.invoiceNo}</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Issued: {inv.issuedAt.slice(0, 10)}
                  </p>
                  {inv.eFRISFiscalNo && (
                    <p className="text-[10px] text-muted-foreground/60">
                      EFRIS: {inv.eFRISFiscalNo}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {inv.isCreditNote && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
              <p className="font-semibold text-destructive">
                CREDIT NOTE — Reverses {inv.creditNoteFor}
              </p>
              {inv.creditNoteReason && (
                <p className="mt-1 text-muted-foreground">{inv.creditNoteReason}</p>
              )}
            </div>
          )}

          <div className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
                Bill to
              </p>
              <p className="mt-1 text-sm font-semibold">{inv.guestName}</p>
              {inv.guestEmail && (
                <p className="text-xs text-muted-foreground/70">{inv.guestEmail}</p>
              )}
              {inv.guestPhone && (
                <p className="text-xs text-muted-foreground/70">{inv.guestPhone}</p>
              )}
              {inv.companyName && (
                <>
                  <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
                    Company
                  </p>
                  <p className="text-sm">{inv.companyName}</p>
                  {inv.companyTin && (
                    <p className="text-xs text-muted-foreground/70">TIN: {inv.companyTin}</p>
                  )}
                </>
              )}
            </div>
            {res && (
              <div className="sm:text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
                  Stay
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {res.checkIn} → {res.checkOut}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Room {res.roomId ?? "—"} · Reservation {res.id}
                </p>
              </div>
            )}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                <th className="py-2.5 text-left">Description</th>
                <th className="py-2.5 text-right">Taxable</th>
                <th className="py-2.5 text-right">VAT</th>
                <th className="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {lines.length > 0 ? (
                lines.map((li) => (
                  <tr key={li.id} className="transition-colors hover:bg-muted/20">
                    <td className="py-2.5 text-sm">{li.description}</td>
                    <td className="py-2.5 text-right tabular-nums">{fmtUGX(li.taxableAmount)}</td>
                    <td className="py-2.5 text-right tabular-nums">{fmtUGX(li.vatAmount)}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">
                      {fmtUGX(li.totalAmount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                    No line items available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="ml-auto mt-6 w-full max-w-xs space-y-2">
            <InvoiceRow label="Subtotal (net)" value={fmtUGX(inv.totalTaxable)} />
            <InvoiceRow label="VAT (18%)" value={fmtUGX(inv.totalVat)} />
            <div className="border-t border-border/50 pt-2">
              <InvoiceRow label="Total" value={fmtUGX(inv.totalAmount)} bold />
            </div>
            {paid > 0 && <InvoiceRow label="Paid" value={"−" + fmtUGX(paid)} tone="success" />}
            <div className="border-t border-border/50 pt-2">
              <InvoiceRow
                label="Balance due"
                value={fmtUGX(Math.max(0, outstanding))}
                bold
                tone={outstanding > 0 ? "warning" : "success"}
              />
            </div>
          </div>

          <div className="mt-8 space-y-5 print:block hidden">
            <div className="flex flex-col items-center">
              <span className="block h-9 w-[70%] border-b border-foreground" />
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Customer Signature
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="block h-9 w-[70%] border-b border-foreground" />
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Cashier / Authorized Signature
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                  STATUS_BADGE[inv.status].class,
                )}
              >
                {STATUS_BADGE[inv.status].label}
              </span>
              {!inv.isCreditNote && (
                <span
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                    EFRIS_BADGE[inv.eFRISStatus].class,
                  )}
                >
                  EFRIS: {EFRIS_BADGE[inv.eFRISStatus].label}
                </span>
              )}
            </div>
            {inv.eFRISQRCode && (
              <p className="max-w-[200px] break-all font-mono text-[9px]">{inv.eFRISQRCode}</p>
            )}
          </div>

          <p className="mt-8 text-center text-[10px] text-muted-foreground/50">
            {inv.isCreditNote
              ? "This is a fiscal credit note. Retain for tax purposes."
              : `Thank you for staying with ${tenant.name}. This is a system-generated tax invoice.`}
          </p>
        </div>
      </div>
      <style>{`@media print { body { background: white; } header, aside, nav { display: none !important; } main { padding: 0 !important; } }`}</style>
    </div>
  );
}

function InvoiceRow({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "success" | "warning";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn("text-muted-foreground", bold && "font-semibold text-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "font-mono tabular-nums",
          bold && "font-bold text-foreground",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </span>
    </div>
  );
}
