import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  CalendarDays,
  CheckCircle2,
  BedDouble,
  LogIn,
  X,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  FileText,
  Receipt,
  Printer,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  groupBlockById,
  reservationById,
  roomById,
  roomTypeById,
  checkIn,
  fmtUGX,
  upsertGroupBlock,
  deleteGroupBlock,
  updateReservation,
  effectiveStatus,
  folioById,
  folioBalance,
  generateInvoice,
  invoicesForFolio,
  invoiceLineItemsFor,
  CHARGE_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  type GroupBlock,
  type Reservation,
  type FolioCharge,
  type Payment,
  type Property,
} from "@/lib/pms-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const groupBlocks = useStore((s) => s.groupBlocks);
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checkingIn, setCheckingIn] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddRes, setShowAddRes] = useState(false);
  const [invoiceFolioId, setInvoiceFolioId] = useState<string | null>(null);
  const [showGroupFolio, setShowGroupFolio] = useState(false);

  const block = useMemo(() => groupBlockById(id ?? ""), [id, groupBlocks]);
  const blockReservations = useMemo(
    () =>
      reservations
        .filter((r) => r.groupBlockId === id)
        .sort((a, b) => a.guestName.localeCompare(b.guestName)),
    [reservations, id]
  );

  const totalBlocked = block?.totalRoomsBlocked ?? 0;
  const totalPickedUp = blockReservations.filter(
    (r) => r.status === "checked_in" || r.status === "checked_out"
  ).length;
  const totalCancelled = blockReservations.filter(
    (r) => r.status === "cancelled"
  ).length;
  const totalConfirmed = blockReservations.filter(
    (r) => r.status === "confirmed" || r.status === "open"
  ).length;
  const pickupPct = totalBlocked > 0 ? Math.round((totalPickedUp / totalBlocked) * 100) : 0;

  if (!block) {
    return (
      <div className="mx-auto max-w-5xl py-20 text-center">
        <p className="text-sm text-muted-foreground">Group block not found.</p>
        <Link to="/groups" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to groups
        </Link>
      </div>
    );
  }

  const toggleReservation = (resId: string) => {
    const next = new Set(selected);
    if (next.has(resId)) next.delete(resId);
    else next.add(resId);
    setSelected(next);
  };

  const toggleAll = () => {
    const checkable = blockReservations.filter(
      (r) => r.status === "confirmed" || r.status === "open"
    );
    if (selected.size === checkable.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(checkable.map((r) => r.id)));
    }
  };

  const handleBulkCheckIn = async () => {
    setCheckingIn(true);
    let success = 0;
    let fail = 0;
    for (const resId of selected) {
      const r = checkIn(resId, { roomId: undefined });
      if (r.ok) success++;
      else fail++;
      await new Promise((r) => setTimeout(r, 50));
    }
    setCheckingIn(false);
    setSelected(new Set());
    if (success > 0) toast.success(`${success} guest${success > 1 ? "s" : ""} checked in.`);
    if (fail > 0) toast.error(`${fail} check-in${fail > 1 ? "s" : ""} failed.`);
  };

  const canCheckIn = selected.size > 0 && !checkingIn;

  const statusColor: Record<string, string> = {
    confirmed: "bg-info/15 text-info border-info/30",
    active: "bg-success/15 text-success border-success/30",
    closed: "bg-muted/40 text-muted-foreground border-border/40",
    open: "bg-muted/40 text-muted-foreground border-border/40",
    checked_in: "bg-success/15 text-success border-success/30",
    checked_out: "bg-muted/40 text-muted-foreground border-border/40",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
    no_show: "bg-warning/15 text-warning border-warning/30",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/groups"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to groups
        </Link>
          <div className="flex items-center gap-2">
            <Link
              to={`/check-in/new?groupBlockId=${block.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-success/90"
            >
              <LogIn className="h-3.5 w-3.5" /> Check In
            </Link>
            <Link
              to={`/reservations/new?groupBlockId=${block.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> New Reservation
            </Link>
            <button
              onClick={() => setShowEdit(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete group block?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{block.groupName}". Reservations linked to this block will not be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deleteGroupBlock(block.id);
                    toast.success("Group block deleted.");
                    navigate("/groups");
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {showEdit && (
        <EditGroupBlockDialog block={block} onClose={() => setShowEdit(false)} />
      )}

      {/* Block info */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.03] to-transparent" />
        <div className="relative p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">Group Block</span>
                <div className="h-3 w-px bg-border" />
                <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", statusColor[effectiveStatus(block)])}>
                  {effectiveStatus(block)}
                </span>
                <span className={cn(
                  "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  block.billingArrangement === "city_ledger"
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-600"
                    : block.billingArrangement === "agent_ledger"
                      ? "border-teal-500/30 bg-teal-500/10 text-teal-600"
                      : "border-border/60 bg-muted/40 text-muted-foreground",
                )}>
                  {block.billingArrangement === "city_ledger"
                    ? "Organisation"
                    : block.billingArrangement === "agent_ledger"
                      ? "Agent"
                      : "Ad-hoc"}
                </span>
                {block.billingArrangement === "pay_at_checkout" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                    <AlertTriangle className="h-3 w-3" /> Pay at Check-out
                  </span>
                )}
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight">{block.groupName}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {block.startDate} → {block.endDate}
                </span>
                {block.organiserName && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {block.organiserName}
                  </span>
                )}
                <span className="font-medium">
                  UGX {fmtUGX(block.groupRate)}/night
                </span>
              </div>
            </div>
          </div>

          {/* Pickup bar */}
          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Rooms blocked</p>
              <p className="mt-1 text-xl font-bold">{totalBlocked}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Picked up</p>
              <p className="mt-1 text-xl font-bold text-success">{totalPickedUp}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="mt-1 text-xl font-bold text-warning">{totalBlocked - totalPickedUp}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Pickup rate</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="rounded-full bg-green-500 transition-all"
                    style={{ width: `${Math.min(100, pickupPct)}%` }}
                  />
                </div>
                <span className="text-sm font-bold">{pickupPct}%</span>
              </div>
            </div>
          </div>

          {block.cutoffDate && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Cutoff date: {block.cutoffDate}
            </p>
          )}
        </div>
      </div>

      {/* Rooming list */}
      <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">Rooming list</h3>
            <p className="text-[11px] text-muted-foreground/60">
              {blockReservations.length} reservation{blockReservations.length !== 1 ? "s" : ""} ·
              {totalConfirmed} ready for check-in
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGroupFolio(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
            >
              <Receipt className="h-3 w-3" /> Group Folio
            </button>
            <button
              onClick={() => setShowAddRes(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
            <button
              onClick={toggleAll}
              className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
            >
              {selected.size > 0 && selected.size === blockReservations.filter(r => r.status === "confirmed" || r.status === "open").length
                ? "Deselect all"
                : "Select all"}
            </button>
            {totalConfirmed > 0 && (
              <button
                onClick={handleBulkCheckIn}
                disabled={!canCheckIn}
                className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-success/90 disabled:opacity-50"
              >
                {checkingIn ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <LogIn className="h-3 w-3" />
                )}
                Check in ({selected.size})
              </button>
            )}
          </div>
        </div>

        {showAddRes && (
          <AddReservationDialog blockId={block.id} onClose={() => setShowAddRes(false)} />
        )}

        {blockReservations.length === 0 ? (
          <div className="px-5 py-14 text-center text-xs text-muted-foreground/50">
            <BedDouble className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
            No reservations linked to this block yet.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {blockReservations.map((res) => {
              const rt = roomTypeById(res.roomTypeId);
              const room = roomById(res.roomId ?? "");
              const isCheckable = res.status === "confirmed" || res.status === "open";
              return (
                <div
                  key={res.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20",
                    selected.has(res.id) && "bg-primary/[0.02]"
                  )}
                >
                  {isCheckable && (
                    <input
                      type="checkbox"
                      checked={selected.has(res.id)}
                      onChange={() => toggleReservation(res.id)}
                      className="h-4 w-4 rounded border-border text-primary"
                    />
                  )}
                  {!isCheckable && <div className="w-4" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/reservations/${res.id}`}
                        className="text-sm font-medium hover:text-primary"
                      >
                        {res.guestName}
                      </Link>
                      <span className={cn("inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold", statusColor[res.status])}>
                        {res.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/60">
                      <span>{res.id}</span>
                      <span>{rt?.name ?? res.roomTypeId}</span>
                      {room && <span>Room {room.id}</span>}
                      <span>{res.checkIn} → {res.checkOut}</span>
                      <span>{res.adults + res.children} guest{(res.adults + res.children) !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs tabular-nums">
                    <div className="font-medium">{fmtUGX(res.ratePerNight)}</div>
                    <div className="text-muted-foreground/60">/night</div>
                  </div>
                  {res.folioId && (
                    <>
                      <button
                        onClick={() => navigate(`/billing?folio=${res.folioId}`)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border/50 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Receipt className="h-3 w-3" /> Folio
                      </button>
                      <button
                        onClick={() => setInvoiceFolioId(res.folioId!)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border/50 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <FileText className="h-3 w-3" /> Invoice
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {invoiceFolioId && (
        <InvoiceDialog folioId={invoiceFolioId} onClose={() => setInvoiceFolioId(null)} />
      )}

      {showGroupFolio && block && (
        <GroupFolioDialog
          block={block}
          blockReservations={blockReservations}
          onClose={() => setShowGroupFolio(false)}
        />
      )}
    </div>
  );
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: "success" | "warning" }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", bold && "font-semibold", tone === "success" && "text-success", tone === "warning" && "text-warning")}>{value}</span>
    </div>
  );
}

function InvoiceDialog({ folioId, onClose }: { folioId: string; onClose: () => void }) {
  const folios = useStore((s) => s.folios);
  const invoices = useStore((s) => s.invoices);
  const charges = useStore((s) => s.charges);
  const payments = useStore((s) => s.payments);
  const tenant = useStore((s) => s.tenant);
  const folio = folios.find((f) => f.id === folioId);
  if (!folio) return null;

  let inv = invoices.find((i) => i.folioId === folioId && !i.isProforma && !i.isCreditNote);
  if (!inv && folio.status === "settled") {
    inv = generateInvoice(folioId) ?? undefined;
  }

  const res = reservationById(folio.reservationId);
  const lineItems = inv ? invoiceLineItemsFor(inv.id) : [];
  const folioCharges = charges.filter((c) => c.folioId === folio.id && !c.voided);
  const folioPayments = payments.filter((p) => p.folioId === folio.id && p.status === "confirmed");
  const effectiveVatRate = res?.vatRate ?? 0.18;
  const isInclusive = res?.vatTreatment !== "exclusive";

  const invoiceNo = inv?.invoiceNo ?? folio.id.replace("F-", "INV-");
  const issuedAt = inv?.issuedAt ?? new Date().toISOString();
  const totalTaxable = inv?.totalTaxable ?? folioCharges.reduce((s, c) => s + (c.vatAmount != null ? c.amount - c.vatAmount : c.amount), 0);
  const totalVat = inv?.totalVat ?? folioCharges.reduce((s, c) => s + (c.vatAmount ?? 0), 0);
  const totalAmount = inv?.totalAmount ?? folioCharges.reduce((s, c) => s + c.amount, 0);
  const paidAmount = inv?.paidAmount ?? folioPayments.reduce((s, p) => s + p.amount, 0);
  const outstanding = inv?.outstandingAmount ?? totalAmount - paidAmount;

  const guestPhone = res?.guestPhone || "";

  const handleShareSms = () => {
    const text = `Invoice ${invoiceNo} from ${tenant.name}\nTotal: UGX ${totalAmount.toLocaleString()}\nPaid: UGX ${paidAmount.toLocaleString()}\nBalance: UGX ${Math.max(0, outstanding).toLocaleString()}\nThank you for staying with us.`;
    const url = `https://wa.me/${guestPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl print:max-w-none max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle>Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-start justify-between border-b border-border/50 pb-6">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight">{tenant.name}</h1>
              <p className="text-xs text-muted-foreground/70">{tenant.address}</p>
              <p className="text-xs text-muted-foreground/70">{tenant.phone} · {tenant.email}</p>
              <p className="text-xs text-muted-foreground/60">TIN: {tenant.tin}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex rounded-xl bg-gradient-to-br from-primary/[0.08] to-transparent px-4 py-2 ring-1 ring-primary/10">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Tax Invoice</p>
                  <p className="font-display text-xl font-bold">{invoiceNo}</p>
                  <p className="text-[10px] text-muted-foreground/60">Issued: {issuedAt.slice(0, 10)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Bill to</p>
              <p className="mt-1 text-sm font-semibold">{res?.guestName}</p>
              <p className="text-xs text-muted-foreground/70">{res?.guestEmail}</p>
              <p className="text-xs text-muted-foreground/70">{res?.guestPhone}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Stay</p>
              <p className="mt-1 text-sm font-semibold">{res?.checkIn} → {res?.checkOut}</p>
              <p className="text-xs text-muted-foreground/70">Room {res?.roomId ?? "—"} · Reservation {res?.id}</p>
              {res?.vatTreatment && (
                <p className="mt-1 text-[10px] text-muted-foreground/50">Prices are VAT {isInclusive ? "inclusive" : "exclusive"}</p>
              )}
            </div>
          </div>

          {lineItems.length > 0 ? (
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
                {lineItems.map((li) => (
                  <tr key={li.id} className="transition-colors hover:bg-muted/20">
                    <td className="py-2.5 text-sm">{li.description}</td>
                    <td className="py-2.5 text-right tabular-nums">{fmtUGX(li.taxableAmount)}</td>
                    <td className="py-2.5 text-right tabular-nums">{fmtUGX(li.vatAmount)}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{fmtUGX(li.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="space-y-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Charges</p>
              <div className="divide-y divide-border/30 text-sm">
                {folioCharges.map((c) => (
                  <div key={c.id} className="flex justify-between py-2">
                    <span>{c.description}</span>
                    <span className="tabular-nums font-medium">{fmtUGX(c.amount)}</span>
                  </div>
                ))}
                {folioCharges.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">No charges recorded.</p>
                )}
              </div>
            </div>
          )}

          <div className="ml-auto w-full max-w-xs space-y-2">
            <Row label="Subtotal (net)" value={fmtUGX(totalTaxable)} />
            <Row label={`VAT (${(effectiveVatRate * 100).toFixed(0)}%)`} value={fmtUGX(totalVat)} />
            <div className="border-t border-border/50 pt-2">
              <Row label="Total" value={fmtUGX(totalAmount)} bold />
            </div>
            {paidAmount > 0 && <Row label="Paid" value={"−" + fmtUGX(paidAmount)} tone="success" />}
            <div className="border-t border-border/50 pt-2">
              <Row label="Balance due" value={fmtUGX(Math.max(0, outstanding))} bold tone={outstanding > 0 ? "warning" : "success"} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 print:hidden">
            {guestPhone && (
              <button
                onClick={handleShareSms}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted"
              >
                <Smartphone className="h-3.5 w-3.5" /> Share via WhatsApp
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
          </div>

          {/* Signature section */}
          <div className="mt-6 space-y-5 print:block hidden">
            <div className="flex flex-col items-center">
              <span className="block w-[70%] border-b border-foreground h-9" />
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Customer Signature</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="block w-[70%] border-b border-foreground h-9" />
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Cashier / Authorized Signature</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/50">Thank you for staying with {tenant.name}.</p>
        </div>
        <style>{`@media print { body { background: white; } header, aside, nav, .print\\:hidden { display: none !important; } [data-state="open"] { position: static !important; background: none !important; backdrop-filter: none !important; } [data-radix-popper-content-wrapper] { display: none !important; } .fixed { position: static !important; } main { padding: 0 !important; } }`}</style>
      </DialogContent>
    </Dialog>
  );
}

function GroupFolioDialog({
  block,
  blockReservations,
  onClose,
}: {
  block: GroupBlock;
  blockReservations: Reservation[];
  onClose: () => void;
}) {
  const folios = useStore((s) => s.folios);
  const allCharges = useStore((s) => s.charges);
  const allPayments = useStore((s) => s.payments);
  const tenant = useStore((s) => s.tenant);
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const [showInvoice, setShowInvoice] = useState(false);

  const folioIds = useMemo(
    () => blockReservations.filter((r) => r.folioId).map((r) => r.folioId!),
    [blockReservations],
  );

  const guestEntries = useMemo(
    () =>
      blockReservations
        .filter((r) => r.folioId)
        .map((r) => {
          const folio = folios.find((f) => f.id === r.folioId);
          const charges = allCharges.filter((c) => c.folioId === r.folioId && !c.voided);
          const payments = allPayments.filter((p) => p.folioId === r.folioId && p.status === "confirmed");
          const totalCharged = charges.reduce((s, c) => s + c.amount, 0);
          const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
          const balance = totalCharged - totalPaid;
          const rt = roomTypeById(r.roomTypeId);
          const room = roomById(r.roomId ?? "");
          return { reservation: r, folio, charges, payments, totalCharged, totalPaid, balance, rt, room };
        }),
    [blockReservations, folios, allCharges, allPayments],
  );

  const totalCharged = guestEntries.reduce((s, e) => s + e.totalCharged, 0);
  const totalPaid = guestEntries.reduce((s, e) => s + e.totalPaid, 0);
  const totalBalance = totalCharged - totalPaid;

  if (showInvoice) {
    return (
      <GroupInvoiceView
        block={block}
        guestEntries={guestEntries}
        tenant={tenant}
        onBack={() => setShowInvoice(false)}
        onClose={onClose}
      />
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle>Group Folio — {block.groupName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
                {block.startDate} &rarr; {block.endDate}
              </p>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-bold">{block.groupName}</h2>
                <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  block.status === "active" ? "bg-success/15 text-success border-success/30" :
                  block.status === "confirmed" ? "bg-info/15 text-info border-info/30" :
                  "bg-muted/40 text-muted-foreground border-border/40"
                )}>
                  {effectiveStatus(block)}
                </span>
              </div>
              {block.organiserName && (
                <p className="text-xs text-muted-foreground">Organiser: {block.organiserName}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{folioIds.length} folio{folioIds.length !== 1 ? "s" : ""}</p>
              <p className="text-2xl font-bold tabular-nums">
                {totalBalance >= 0 ? fmtUGX(totalBalance) : `-${fmtUGX(Math.abs(totalBalance))}`}
              </p>
              <p className={cn("text-xs", totalBalance > 0 ? "text-destructive" : totalBalance < 0 ? "text-success" : "text-muted-foreground")}>
                {totalBalance > 0 ? "Outstanding" : totalBalance < 0 ? "In credit" : "Settled"}
              </p>
            </div>
          </div>

          {guestEntries.map((entry) => (
            <div key={entry.reservation.id} className="rounded-xl border border-border/50 bg-muted/20">
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <div>
                  <span className="text-sm font-semibold">{entry.reservation.guestName}</span>
                  <span className={cn("ml-2 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                    entry.reservation.status === "checked_in" ? "bg-success/15 text-success border-success/30" :
                    entry.reservation.status === "checked_out" ? "bg-muted/40 text-muted-foreground border-border/40" :
                    "bg-muted/20 text-muted-foreground border-border/40"
                  )}>
                    {entry.reservation.status.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.reservation.id} &middot; {entry.rt?.name ?? entry.reservation.roomTypeId}
                  {entry.room && <> &middot; Room {entry.room.id}</>}
                </div>
              </div>

              <div className="p-4 space-y-4">
                {entry.charges.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-2">Charges</p>
                    <div className="divide-y divide-border/30 text-sm">
                      {entry.charges.map((c) => (
                        <div key={c.id} className="flex justify-between py-1.5">
                          <span className="text-xs">{c.description} <span className="text-muted-foreground/60">({CHARGE_TYPE_LABEL[c.type]})</span></span>
                          <span className="text-xs font-medium tabular-nums">{fmtUGX(c.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.payments.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 mb-2">Payments</p>
                    <div className="divide-y divide-border/30 text-sm">
                      {entry.payments.map((p) => (
                        <div key={p.id} className="flex justify-between py-1.5">
                          <span className="text-xs">{PAYMENT_METHOD_LABEL[p.method]} {p.reference && <span className="text-muted-foreground/60">({p.reference})</span>}</span>
                          <span className="text-xs font-medium tabular-nums text-success">&minus;{fmtUGX(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.charges.length === 0 && entry.payments.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 text-center py-2">No transactions recorded.</p>
                )}

                <div className="flex justify-between border-t border-border/50 pt-2 text-xs font-semibold">
                  <span className="text-muted-foreground">Balance</span>
                  <span className={cn("tabular-nums", entry.balance > 0 ? "text-destructive" : entry.balance < 0 ? "text-success" : "")}>
                    {entry.balance >= 0 ? fmtUGX(entry.balance) : `-${fmtUGX(Math.abs(entry.balance))}`}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total charges</span>
                <span className="font-medium tabular-nums">{fmtUGX(totalCharged)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total payments</span>
                <span className="font-medium tabular-nums text-success">&minus;{fmtUGX(totalPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-2 text-base font-bold">
                <span>Balance</span>
                <span className={cn("tabular-nums", totalBalance > 0 ? "text-destructive" : totalBalance < 0 ? "text-success" : "")}>
                  {totalBalance >= 0 ? fmtUGX(totalBalance) : `-${fmtUGX(Math.abs(totalBalance))}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 print:hidden">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Close
            </button>
            <button
              onClick={() => setShowInvoice(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <FileText className="h-4 w-4" /> View Consolidated Invoice
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupInvoiceView({
  block,
  guestEntries,
  tenant,
  onBack,
  onClose,
}: {
  block: GroupBlock;
  guestEntries: Array<{
    reservation: Reservation;
    charges: FolioCharge[];
    payments: Payment[];
    totalCharged: number;
    totalPaid: number;
    balance: number;
  }>;
  tenant: Property;
  onBack: () => void;
  onClose: () => void;
}) {
  const totalCharged = guestEntries.reduce((s, e) => s + e.totalCharged, 0);
  const totalPaid = guestEntries.reduce((s, e) => s + e.totalPaid, 0);
  const outstanding = totalCharged - totalPaid;
  const invoiceNo = `GRP-INV-${block.id.replace("GB-", "")}`;
  const guestPhone = block.organiserEmail || guestEntries[0]?.reservation.guestPhone || "";

  const allCharges = guestEntries.flatMap((e) => e.charges);
  const allPayments = guestEntries.flatMap((e) => e.payments);
  const totalTaxable = allCharges.reduce((s, c) => s + (c.vatAmount != null ? c.amount - c.vatAmount : c.amount), 0);
  const totalVat = allCharges.reduce((s, c) => s + (c.vatAmount ?? 0), 0);
  const nights = guestEntries.length > 0
    ? Math.max(1, ...guestEntries.map((e) => Math.ceil((new Date(e.reservation.checkOut).getTime() - new Date(e.reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24))))
    : 1;

  const handleShareSms = () => {
    const text = `Invoice ${invoiceNo} from ${tenant.name}\nGroup: ${block.groupName}\nTotal: UGX ${totalCharged.toLocaleString()}\nPaid: UGX ${totalPaid.toLocaleString()}\nBalance: UGX ${Math.max(0, outstanding).toLocaleString()}\nThank you for choosing ${tenant.name}.`;
    const url = `https://wa.me/${guestPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl print:max-w-none max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle>Consolidated Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-start justify-between border-b border-border/50 pb-6">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight">{tenant.name}</h1>
              <p className="text-xs text-muted-foreground/70">{tenant.address}</p>
              <p className="text-xs text-muted-foreground/70">{tenant.phone} · {tenant.email}</p>
              <p className="text-xs text-muted-foreground/60">TIN: {tenant.tin}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex rounded-xl bg-gradient-to-br from-primary/[0.08] to-transparent px-4 py-2 ring-1 ring-primary/10">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Consolidated Invoice</p>
                  <p className="font-display text-xl font-bold">{invoiceNo}</p>
                  <p className="text-[10px] text-muted-foreground/60">Issued: {new Date().toISOString().slice(0, 10)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Bill to</p>
              <p className="mt-1 text-sm font-semibold">{block.groupName}</p>
              {block.organiserName && <p className="text-xs text-muted-foreground/70">Organiser: {block.organiserName}</p>}
              {block.organiserEmail && <p className="text-xs text-muted-foreground/70">{block.organiserEmail}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Stay</p>
              <p className="mt-1 text-sm font-semibold">{block.startDate} &rarr; {block.endDate}</p>
              <p className="text-xs text-muted-foreground/70">{guestEntries.length} guest{guestEntries.length !== 1 ? "s" : ""} · {nights} night{nights > 1 ? "s" : ""}</p>
            </div>
          </div>

          {guestEntries.length > 0 && (
            <div className="space-y-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Guest Breakdown</p>
              <div className="overflow-hidden rounded-xl border border-border/50">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/20 text-left text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                      <th className="px-4 py-2">Guest</th>
                      <th className="px-4 py-2">Nights</th>
                      <th className="px-4 py-2">Check-in</th>
                      <th className="px-4 py-2">Check-out</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {guestEntries.map((entry) => {
                      const ci = entry.reservation.checkIn;
                      const co = entry.reservation.checkOut;
                      const nights = Math.max(0, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));
                      return (
                        <tr key={entry.reservation.id} className="transition-colors hover:bg-muted/20">
                          <td className="px-4 py-2 font-medium">{entry.reservation.guestName}</td>
                          <td className="px-4 py-2 text-muted-foreground">{nights}</td>
                          <td className="px-4 py-2 text-muted-foreground">{ci}</td>
                          <td className="px-4 py-2 text-muted-foreground">{co}</td>
                          <td className="px-4 py-2 text-right font-semibold tabular-nums">{fmtUGX(entry.totalCharged)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border/40 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                <th className="py-2.5 text-left">Description</th>
                <th className="py-2.5 text-right">Guest</th>
                <th className="py-2.5 text-right">Taxable</th>
                <th className="py-2.5 text-right">VAT</th>
                <th className="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {allCharges.map((c) => {
                const entry = guestEntries.find((e) => e.charges.some((ec) => ec.id === c.id));
                return (
                  <tr key={c.id} className="transition-colors hover:bg-muted/20">
                    <td className="py-2 text-sm">{c.description}</td>
                    <td className="py-2 text-right text-xs text-muted-foreground/70">{entry?.reservation.guestName ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums">{fmtUGX(c.vatAmount != null ? c.amount - c.vatAmount : c.amount)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtUGX(c.vatAmount ?? 0)}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{fmtUGX(c.amount)}</td>
                  </tr>
                );
              })}
              {allCharges.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">No charges recorded.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="ml-auto w-full max-w-xs space-y-2">
            <Row label="Subtotal (net)" value={fmtUGX(totalTaxable)} />
            <Row label="VAT (18%)" value={fmtUGX(totalVat)} />
            <div className="border-t border-border/50 pt-2">
              <Row label="Total" value={fmtUGX(totalCharged)} bold />
            </div>
            {totalPaid > 0 && <Row label="Paid" value={"−" + fmtUGX(totalPaid)} tone="success" />}
            <div className="border-t border-border/50 pt-2">
              <Row label="Balance due" value={fmtUGX(Math.max(0, outstanding))} bold tone={outstanding > 0 ? "warning" : "success"} />
            </div>
          </div>

          {/* Signature section */}
          <div className="mt-6 space-y-5 print:block hidden">
            <div className="flex flex-col items-center">
              <span className="block w-[70%] border-b border-foreground h-9" />
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Customer Signature</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="block w-[70%] border-b border-foreground h-9" />
              <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Cashier / Authorized Signature</span>
            </div>
          </div>

          <div className="flex items-center justify-between print:hidden">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              ← Back to Folio
            </button>
            <div className="flex items-center gap-2">
              {guestPhone && (
                <button
                  onClick={handleShareSms}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted"
                >
                  <Smartphone className="h-3.5 w-3.5" /> Share via WhatsApp
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/50">Thank you for choosing {tenant.name}.</p>
        </div>
        <style>{`@media print { body { background: white; } header, aside, nav, .print\\:hidden { display: none !important; } [data-state="open"] { position: static !important; background: none !important; backdrop-filter: none !important; } [data-radix-popper-content-wrapper] { display: none !important; } .fixed { position: static !important; } main { padding: 0 !important; } }`}</style>
      </DialogContent>
    </Dialog>
  );
}

function EditGroupBlockDialog({ block, onClose }: { block: any; onClose: () => void }) {
  const [groupName, setGroupName] = useState(block.groupName);
  const [organiserName, setOrganiserName] = useState(block.organiserName ?? "");
  const [organiserEmail, setOrganiserEmail] = useState(block.organiserEmail ?? "");
  const [startDate, setStartDate] = useState(block.startDate);
  const [endDate, setEndDate] = useState(block.endDate);
  const [totalRoomsBlocked, setTotalRoomsBlocked] = useState(block.totalRoomsBlocked);
  const [groupRate, setGroupRate] = useState(block.groupRate);
  const [cutoffDate, setCutoffDate] = useState(block.cutoffDate ?? "");
  const [status, setStatus] = useState(block.status);
  const [billingArrangement, setBillingArrangement] = useState<"city_ledger" | "pay_at_checkout" | "agent_ledger">(block.billingArrangement ?? "city_ledger");

  const handleSubmit = () => {
    if (!groupName || !startDate || !endDate) {
      toast.error("Group name, start date, and end date are required.");
      return;
    }
    upsertGroupBlock({
      ...block,
      groupName,
      organiserName: organiserName || undefined,
      organiserEmail: organiserEmail || undefined,
      startDate,
      endDate,
      totalRoomsBlocked,
      groupRate,
      cutoffDate: cutoffDate || undefined,
      billingArrangement,
      status,
    });
    toast.success("Group block updated.");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Group Block</DialogTitle>
          <DialogDescription>Update group block details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Group name *</label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Start date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">End date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Organiser name</label>
              <input
                value={organiserName}
                onChange={(e) => setOrganiserName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Organiser email</label>
              <input
                type="email"
                value={organiserEmail}
                onChange={(e) => setOrganiserEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Rooms blocked</label>
              <input
                type="number"
                min={1}
                value={totalRoomsBlocked}
                onChange={(e) => setTotalRoomsBlocked(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Rate (UGX) / night</label>
              <input
                type="number"
                min={0}
                value={groupRate}
                onChange={(e) => setGroupRate(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cutoff date</label>
              <input
                type="date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              >
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Group type</label>
            <select
              value={billingArrangement}
              onChange={(e) => setBillingArrangement(e.target.value as "city_ledger" | "pay_at_checkout" | "agent_ledger")}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
            >
              <option value="city_ledger">Organisation (City Ledger)</option>
              <option value="pay_at_checkout">Ad-hoc (Pay at Check-out)</option>
              <option value="agent_ledger">Travel Agent (Agent Ledger)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddReservationDialog({ blockId, onClose }: { blockId: string; onClose: () => void }) {
  const reservations = useStore((s) => s.reservations);
  const roomTypes = useStore((s) => s.roomTypes);
  const groupBlocks = useStore((s) => s.groupBlocks);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"confirmed" | "checked_in" | "all">("all");

  const statusColor: Record<string, string> = {
    confirmed: "bg-info/15 text-info border-info/30",
    checked_in: "bg-success/15 text-success border-success/30",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
    checked_out: "bg-muted/40 text-muted-foreground border-border/40",
    no_show: "bg-warning/15 text-warning border-warning/30",
  };

  const block = useMemo(() => groupBlockById(blockId), [blockId, groupBlocks]);

  const unlinked = useMemo(
    () =>
      reservations
        .filter((r) => (r.status === "confirmed" || r.status === "checked_in") && !r.groupBlockId)
        .sort((a, b) => a.guestName.localeCompare(b.guestName)),
    [reservations],
  );

  const filtered = useMemo(
    () =>
      unlinked
        .filter((r) => statusTab === "all" || r.status === statusTab)
        .filter(
          (r) =>
            !search ||
            r.guestName.toLowerCase().includes(search.toLowerCase()) ||
            r.guestEmail.toLowerCase().includes(search.toLowerCase()) ||
            r.guestPhone.toLowerCase().includes(search.toLowerCase()) ||
            r.id.toLowerCase().includes(search.toLowerCase()),
        ),
    [unlinked, search, statusTab],
  );

  const linkReservation = (resId: string) => {
    updateReservation(resId, {
      groupBlockId: blockId,
      ratePerNight: block?.groupRate ?? 0,
    } as any);
    toast.success("Reservation linked to this block with group rate.");
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Reservation to Block</DialogTitle>
          <DialogDescription>
            Select an existing reservation to link to this group block.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-0.5 bg-muted/30 mb-3">
          {(["all", "confirmed", "checked_in"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={cn(
                "flex-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition",
                statusTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "all" ? "All" : tab === "confirmed" ? "Confirmed" : "Checked In"}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone or ID..."
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground/60">
              {search ? "No reservations match your search." : "No unlinked reservations available."}
            </p>
          ) : (
            filtered.map((res) => {
              const rt = roomTypes.find((t) => t.id === res.roomTypeId);
              return (
                <div
                  key={res.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5 hover:bg-muted/20 cursor-pointer transition"
                  onClick={() => linkReservation(res.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{res.guestName}</span>
                      <span className={cn("inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold", statusColor[res.status])}>
                        {res.status === "checked_in" ? "checked in" : res.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground/60">
                      {res.id} · {rt?.name ?? res.roomTypeId} · {res.checkIn} → {res.checkOut}
                    </div>
                    <div className="text-[11px] text-muted-foreground/40">
                      {res.guestEmail} · {res.guestPhone}
                    </div>
                  </div>
                  <div className="text-xs font-medium tabular-nums">{fmtUGX(res.ratePerNight)}/night</div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
