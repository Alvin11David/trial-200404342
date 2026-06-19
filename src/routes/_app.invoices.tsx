import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search, Filter, FileText, Download, Printer, ChevronRight,
  ArrowLeft, CheckCircle2, AlertTriangle, Clock, XCircle, Receipt,
  CreditCard, Smartphone, Mail, Eye, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fmtUGX,
  useStore,
  searchInvoices,
  invoiceLineItemsFor,
  invoicesForFolio,
  submitToEFRIS,
  type Invoice,
  type InvoiceLineItem,
  type EFRISStatus,
  type InvoiceStatus,
} from "@/lib/pms-store";
import { ROLE_META, useRole, type Role } from "@/lib/role";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/invoices")({
  head: () => ({ meta: [{ title: "Invoices — Jambo ERP" }] }),
  component: InvoicesPage,
});

const EFRIS_BADGE: Record<EFRISStatus, { label: string; class: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pending", class: "bg-warning/15 text-warning border-warning/30", icon: Clock },
  submitted: { label: "Submitted", class: "bg-sky-500/15 text-sky-600 border-sky-500/30 dark:text-sky-400", icon: ExternalLink },
  failed: { label: "Failed", class: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
  confirmed: { label: "Confirmed", class: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
};

const STATUS_BADGE: Record<InvoiceStatus, { label: string; class: string }> = {
  paid: { label: "Paid in Full", class: "bg-success/15 text-success border-success/30" },
  partial: { label: "Partially Settled", class: "bg-warning/15 text-warning border-warning/30" },
  unpaid: { label: "Unpaid", class: "bg-destructive/15 text-destructive border-destructive/30" },
};

function InvoicesPage() {
  const invoices = useStore((s) => s.invoices);
  const { role } = useRole();
  const actor = ROLE_META[role]?.person ?? role;
  const actorRole = role;
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [efrisFilter, setEfrisFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let list = searchInvoices({
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

  const creditNotes = useMemo(
    () => invoices.filter((i) => i.isCreditNote),
    [invoices],
  );

  const handleSubmitEFRIS = async (inv: Invoice) => {
    if (inv.eFRISStatus === "confirmed") { toast.info("Already submitted to EFRIS"); return; }
    const result = await submitToEFRIS(inv.id, actor, role);
    if (result) toast.success("EFRIS submission confirmed");
    else toast.error("EFRIS submission failed — will retry automatically");
  };

  const handlePrint = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) { window.print(); return; }
    const content = document.getElementById("invoice-print-content");
    if (!content) return;
    printWin.document.write(`
      <html><head><title>Invoice ${selectedInvoice?.invoiceNo}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 40px; color: #000; }
        .header { text-align: center; margin-bottom: 24px; }
        .header h1 { font-size: 18px; margin: 0; }
        .header p { margin: 2px 0; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 11px; }
        th { background: #f5f5f5; }
        .right { text-align: right; }
        .summary { margin-top: 16px; text-align: right; }
        .summary p { margin: 2px 0; }
        .footer { margin-top: 24px; font-size: 10px; text-align: center; color: #666; border-top: 1px solid #ccc; padding-top: 12px; }
        .badge { display: inline-block; padding: 2px 8px; border: 1px solid #000; font-size: 10px; }
        .qr { margin-top: 12px; text-align: center; }
        .qr img { width: 80px; height: 80px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    printWin.document.close();
    printWin.print();
  };

  if (selectedInvoice) {
    return (
      <div className="flex h-full flex-col gap-4 p-6" ref={printRef}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedInvoice(null)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold tracking-tight">{selectedInvoice.invoiceNo}</h1>
            <p className="text-xs text-muted-foreground">{selectedInvoice.guestName} · {selectedInvoice.issuedAt.slice(0, 10)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs font-medium hover:bg-muted/50">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              onClick={() => handleSubmitEFRIS(selectedInvoice)}
              disabled={selectedInvoice.eFRISStatus === "confirmed"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Submit to EFRIS
            </button>
          </div>
        </div>

        <div id="invoice-print-content" className="mx-auto w-full max-w-3xl rounded-xl border border-border/60 bg-card p-8">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight">TAX INVOICE</h1>
            <p className="mt-1 text-xs text-muted-foreground">Original — Fiscal Document</p>
            {selectedInvoice.isCreditNote && (
              <p className="mt-1 text-xs font-semibold text-destructive">CREDIT NOTE — Reverses {selectedInvoice.creditNoteFor}</p>
            )}
          </div>

          <div className="mt-6 flex justify-between border-b border-border pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hotel</p>
              <p className="text-sm font-medium">Jambo Sphere Hotel</p>
              <p className="text-xs text-muted-foreground">Plot 24, Kampala Road, Kampala, Uganda</p>
              <p className="text-xs text-muted-foreground">TIN: 1000123456</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice No.</p>
              <p className="text-sm font-mono font-bold">{selectedInvoice.invoiceNo}</p>
              <p className="text-xs text-muted-foreground">Issued: {new Date(selectedInvoice.issuedAt).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              {selectedInvoice.eFRISFiscalNo && (
                <p className="text-xs text-muted-foreground">EFRIS: {selectedInvoice.eFRISFiscalNo}</p>
              )}
            </div>
          </div>

          <div className="mt-4 border-b border-border pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guest</p>
            <p className="text-sm font-medium">{selectedInvoice.guestName}</p>
            <p className="text-xs text-muted-foreground">{selectedInvoice.guestEmail}</p>
            <p className="text-xs text-muted-foreground">{selectedInvoice.guestPhone}</p>
            {selectedInvoice.companyName && (
              <>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</p>
                <p className="text-sm">{selectedInvoice.companyName}</p>
                {selectedInvoice.companyTin && <p className="text-xs text-muted-foreground">TIN: {selectedInvoice.companyTin}</p>}
              </>
            )}
          </div>

          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Amount (UGX)</th>
                <th className="pb-2 text-right">VAT Treatment</th>
                <th className="pb-2 text-right">Taxable</th>
                <th className="pb-2 text-right">VAT</th>
              </tr>
            </thead>
            <tbody>
              {selectedLines.map((li) => (
                <tr key={li.id} className="border-b border-border/50">
                  <td className="py-2 text-sm">{li.description}</td>
                  <td className="py-2 text-right font-mono text-sm">{fmtUGX(li.amount)}</td>
                  <td className="py-2 text-right text-xs text-muted-foreground">
                    {li.vatTreatment === "inclusive" ? "VAT Inc." : li.vatTreatment === "exclusive" ? "VAT Exc." : "Exempt"}
                  </td>
                  <td className="py-2 text-right font-mono text-sm">{li.vatTreatment === "exempt" ? "—" : fmtUGX(li.taxableAmount)}</td>
                  <td className="py-2 text-right font-mono text-sm">{li.vatTreatment === "exempt" ? "—" : fmtUGX(li.vatAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 space-y-1 border-t border-border pt-3 text-right">
            <p className="text-sm text-muted-foreground">Total Taxable: <span className="font-mono font-medium text-foreground">{fmtUGX(selectedInvoice.totalTaxable)}</span></p>
            <p className="text-sm text-muted-foreground">VAT (18%): <span className="font-mono font-medium text-foreground">{fmtUGX(selectedInvoice.totalVat)}</span></p>
            <p className="text-lg font-bold">Total: {fmtUGX(selectedInvoice.totalAmount)}</p>
            <div className="mt-2 border-t border-border pt-2">
              <p className="text-sm text-muted-foreground">Paid: <span className="font-mono font-medium text-success">{fmtUGX(selectedInvoice.paidAmount)}</span></p>
              {selectedInvoice.outstandingAmount > 0 && (
                <p className="text-sm text-muted-foreground">Outstanding: <span className="font-mono font-medium text-destructive">{fmtUGX(selectedInvoice.outstandingAmount)}</span></p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold", STATUS_BADGE[selectedInvoice.status].class)}>
                {STATUS_BADGE[selectedInvoice.status].label}
              </span>
              {!selectedInvoice.isCreditNote && (
                <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold", EFRIS_BADGE[selectedInvoice.eFRISStatus].class)}>
                  EFRIS: {EFRIS_BADGE[selectedInvoice.eFRISStatus].label}
                </span>
              )}
            </div>
            {selectedInvoice.eFRISQRCode && (
              <div className="text-right">
                <p className="text-[9px] text-muted-foreground">EFRIS QR</p>
                <p className="font-mono text-[9px] break-all max-w-[200px]">{selectedInvoice.eFRISQRCode}</p>
              </div>
            )}
          </div>

          {selectedInvoice.isCreditNote && selectedInvoice.creditNoteReason && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
              <p className="font-semibold text-destructive">Credit Note Reason</p>
              <p className="mt-1 text-muted-foreground">{selectedInvoice.creditNoteReason}</p>
              <p className="mt-1 text-muted-foreground">Original Invoice: {selectedInvoice.creditNoteFor}</p>
            </div>
          )}
        </div>

        <div className="text-center text-[10px] text-muted-foreground">
          This is a fiscal document. Retain for tax purposes.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">Invoices</h1>
          <p className="text-xs text-muted-foreground">Search, view, and manage fiscal invoices</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground hover:border-primary/40"
        >
          <Filter className="h-3.5 w-3.5" /> {showFilters ? "Less" : "More"} filters
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Search</label>
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
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs outline-none focus:border-primary/50 focus:ring-0 shadow-none">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid in Full</SelectItem>
                <SelectItem value="partial">Partially Settled</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">EFRIS</label>
            <Select value={efrisFilter} onValueChange={setEfrisFilter}>
              <SelectTrigger className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs outline-none focus:border-primary/50 focus:ring-0 shadow-none">
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guest</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">EFRIS</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const EF = EFRIS_BADGE[inv.eFRISStatus];
                const ST = STATUS_BADGE[inv.status];
                return (
                  <tr key={inv.id} className="border-b border-border/30 transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold">{inv.invoiceNo}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{inv.guestName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inv.issuedAt.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-medium">{fmtUGX(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold", ST.class)}>{ST.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold", EF.class)}>
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
        <div className="mt-2">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credit Notes ({creditNotes.length})</h3>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credit Note</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">EFRIS</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {creditNotes.map((cnote) => {
                  const EF = EFRIS_BADGE[cnote.eFRISStatus];
                  return (
                    <tr key={cnote.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-sm font-semibold">{cnote.invoiceNo}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{cnote.creditNoteFor}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{cnote.creditNoteReason}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium text-destructive">{fmtUGX(cnote.totalAmount)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold", EF.class)}>
                          <EF.icon className="h-3 w-3" />
                          {EF.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelectedInvoice(cnote)} className="text-xs text-primary hover:underline">View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-center text-[10px] text-muted-foreground">
        {filtered.length} invoice(s) · {invoices.filter((i) => !i.isCreditNote && i.eFRISStatus === "pending").length} pending EFRIS
      </div>
    </div>
  );
}
