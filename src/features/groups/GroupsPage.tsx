import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Users, BedDouble, ChevronRight, CalendarDays, Clock, X, Receipt, FileText, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fmtUGX,
  groupBlockById,
  reservationById,
  useStore,
  upsertGroupBlock,
  effectiveStatus,
  folioBalance,
  folioById,
} from "@/lib/pms-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function GroupsPage() {
  const navigate = useNavigate();
  const groupBlocks = useStore((s) => s.groupBlocks);
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);
  const allCharges = useStore((s) => s.charges);
  const allPayments = useStore((s) => s.payments);
  const tenant = useStore((s) => s.tenant);
  const [showNew, setShowNew] = useState(false);

  const blocksWithStats = useMemo(
    () =>
      [...groupBlocks]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((block) => {
          const blockReservations = reservations.filter(
            (r) => r.groupBlockId === block.id
          );
          const totalReserved = blockReservations.length;
          const totalPickedUp = blockReservations.filter(
            (r) => r.status === "checked_in" || r.status === "checked_out"
          ).length;
          const totalCancelled = blockReservations.filter(
            (r) => r.status === "cancelled"
          ).length;
          const blocked = block.totalRoomsBlocked;
          const availablePct = blocked > 0 ? Math.round((totalPickedUp / blocked) * 100) : 0;
          const folioEntries = blockReservations
            .filter((r) => r.folioId)
            .map((r) => ({
              reservationId: r.id,
              guestName: r.guestName,
              guestPhone: r.guestPhone,
              folioId: r.folioId!,
              balance: folioBalance(r.folioId!),
            }));
          const totalBalance = folioEntries.reduce((s, f) => s + f.balance, 0);
          return { ...block, totalReserved, totalPickedUp, totalCancelled, blocked, availablePct, displayStatus: effectiveStatus(block), folioEntries, totalBalance };
        }),
    [groupBlocks, reservations]
  );

  const totalBlocks = blocksWithStats.length;
  const totalPickedUp = blocksWithStats.reduce((s, b) => s + b.totalPickedUp, 0);
  const totalReserved = blocksWithStats.reduce((s, b) => s + b.totalReserved, 0);
  const totalBlocked = blocksWithStats.reduce((s, b) => s + b.blocked, 0);

  const statusBadge: Record<string, string> = {
    active: "bg-success/15 text-success border-success/30",
    confirmed: "bg-info/15 text-info border-info/30",
    closed: "bg-muted/40 text-muted-foreground border-border/40",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  };

  const handleShareInvoice = (folioId: string, guestPhone: string, guestName: string) => {
    const folio = folioById(folioId);
    if (!folio) return;
    const charges = allCharges.filter((c) => c.folioId === folioId && !c.voided);
    const payments = allPayments.filter((p) => p.folioId === folioId && p.status === "confirmed");
    const totalAmount = charges.reduce((s, c) => s + c.amount, 0);
    const paidAmount = payments.reduce((s, p) => s + p.amount, 0);
    const outstanding = totalAmount - paidAmount;
    const invoiceNo = folioId.replace("F-", "INV-");
    const text = `Invoice ${invoiceNo} from ${tenant.name}\nGuest: ${guestName}\nTotal: UGX ${totalAmount.toLocaleString()}\nPaid: UGX ${paidAmount.toLocaleString()}\nBalance: UGX ${Math.max(0, outstanding).toLocaleString()}\nThank you for staying with us.`;
    const url = `https://wa.me/${guestPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-purple-400/20 to-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Groups &amp; Blocks</h1>
              <p className="text-sm text-muted-foreground">
                {totalBlocks} group{totalBlocks !== 1 ? "s" : ""} · {totalReserved} reservations
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          New Group Block
        </button>
      </div>

      {showNew && (
        <NewGroupBlockDialog onClose={() => setShowNew(false)} />
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Group blocks"
          value={totalBlocks.toString()}
          icon={Users}
          gradient="from-purple-400 to-purple-600"
        />
        <StatCard
          label="Rooms blocked"
          value={totalBlocked.toString()}
          icon={BedDouble}
          gradient="from-blue-400 to-blue-600"
        />
        <StatCard
          label="Picked up"
          value={`${totalPickedUp} (${totalBlocked > 0 ? Math.round(totalPickedUp / totalBlocked * 100) : 0}%)`}
          icon={BedDouble}
          gradient="from-green-400 to-green-600"
        />
        <StatCard
          label="Total reservations"
          value={totalReserved.toString()}
          icon={BedDouble}
          gradient="from-violet-400 to-violet-600"
        />
      </div>

      {blocksWithStats.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30 py-24">
          <Users className="mb-3 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm font-medium text-muted-foreground">No group blocks found</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Group and convention bookings appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocksWithStats.map((block) => (
            <div
              key={block.id}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-lg cursor-pointer"
              onClick={() => navigate(`/groups/${block.id}`)}
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-purple-400 to-purple-600" />
              <div className="p-5 pl-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">{block.groupName}</span>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          statusBadge[block.displayStatus]
                        )}
                      >
                        {block.displayStatus}
                      </span>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          block.billingArrangement === "city_ledger"
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-600"
                            : block.billingArrangement === "agent_ledger"
                              ? "border-teal-500/30 bg-teal-500/10 text-teal-600"
                              : "border-border/60 bg-muted/40 text-muted-foreground",
                        )}
                      >
                        {block.billingArrangement === "city_ledger"
                          ? "Organisation"
                          : block.billingArrangement === "agent_ledger"
                            ? "Agent"
                            : "Ad-hoc"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {block.startDate} → {block.endDate}
                      </span>
                      {block.organiserName && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {block.organiserName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        UGX {fmtUGX(block.groupRate)}/night
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Pickup:</span>
                        <div className="flex h-2 w-28 overflow-hidden rounded-full bg-muted">
                          <div
                            className="rounded-full bg-green-500 transition-all"
                            style={{
                              width: `${Math.min(100, block.availablePct)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold tabular-nums">
                          {block.totalPickedUp}/{block.blocked}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {block.blocked - block.totalPickedUp} remaining
                      </span>
                      {block.totalCancelled > 0 && (
                        <span className="text-xs text-destructive">
                          {block.totalCancelled} cancelled
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground">Reservations</div>
                      <div className="text-lg font-bold tabular-nums">{block.totalReserved}</div>
                    </div>
                    <div className="grid h-9 w-9 place-items-center rounded-xl border border-border/50 bg-card/40 text-muted-foreground/30 transition-all group-hover:border-primary/30 group-hover:text-primary">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {block.folioEntries.length > 0 && (
                <div className="mt-4 border-t border-border/50 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">Billing</span>
                    <span className="text-xs font-semibold tabular-nums">
                      {block.folioEntries.length} folio{block.folioEntries.length > 1 ? "s" : ""}
                      {block.totalBalance !== 0 && (
                        <span className={cn("ml-2", block.totalBalance > 0 ? "text-destructive" : "text-success")}>
                          &middot; {fmtUGX(block.totalBalance)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {block.folioEntries.map((entry) => (
                      <div
                        key={entry.folioId}
                        className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="min-w-0 flex-1 text-sm font-medium text-foreground truncate">
                          {entry.guestName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`/billing?folio=${entry.folioId}`}
                            onClick={(e) => { e.stopPropagation(); navigate(`/billing?folio=${entry.folioId}`); }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-card px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                          >
                            <Receipt className="h-3.5 w-3.5" /> Folio
                          </a>
                          <a
                            href={`/billing?invoice=${entry.folioId}`}
                            onClick={(e) => { e.stopPropagation(); navigate(`/billing?invoice=${entry.folioId}`); }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-card px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                          >
                            <FileText className="h-3.5 w-3.5" /> Invoice
                          </a>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShareInvoice(entry.folioId, entry.guestPhone, entry.guestName); }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-card px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                          >
                            <Smartphone className="h-3.5 w-3.5" /> Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewGroupBlockDialog({ onClose }: { onClose: () => void }) {
  const [groupName, setGroupName] = useState("");
  const [organiserName, setOrganiserName] = useState("");
  const [organiserEmail, setOrganiserEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [cutoffDate, setCutoffDate] = useState("");
  const [status, setStatus] = useState<"active" | "confirmed">("confirmed");
  const [billingArrangement, setBillingArrangement] = useState<"city_ledger" | "pay_at_checkout">("city_ledger");

  const handleSubmit = () => {
    if (!groupName || !startDate || !endDate) {
      toast.error("Group name, start date, and end date are required.");
      return;
    }
    const now = new Date().toISOString();
    upsertGroupBlock({
      id: `GB-${Date.now()}`,
      propertyId: "T001",
      groupName,
      organiserName: organiserName || undefined,
      organiserEmail: organiserEmail || undefined,
      startDate,
      endDate,
      totalRoomsBlocked: numberOfGuests,
      totalPax: numberOfGuests,
      groupRate: 0,
      cutoffDate: cutoffDate || undefined,
      billingArrangement,
      status,
      createdAt: now,
      updatedAt: now,
    });
    toast.success(`Group block "${groupName}" created.`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Group Block</DialogTitle>
          <DialogDescription>Create a new group or convention block.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Group name *</label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Kampala Business Summit"
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
                placeholder="e.g. John Doe"
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Organiser email</label>
              <input
                type="email"
                value={organiserEmail}
                onChange={(e) => setOrganiserEmail(e.target.value)}
                placeholder="john@example.com"
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Number of guests</label>
              <input
                type="number"
                min={1}
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(Number(e.target.value))}
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
                onChange={(e) => setStatus(e.target.value as "active" | "confirmed")}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              >
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Group type</label>
              <select
                value={billingArrangement}
                onChange={(e) => setBillingArrangement(e.target.value as "city_ledger" | "pay_at_checkout")}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              >
                <option value="city_ledger">Organisation (City Ledger)</option>
                <option value="pay_at_checkout">Ad-hoc (Pay at Check-out)</option>
              </select>
            </div>
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
              Create Block
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="relative z-10 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div
            className={cn(
              "grid h-7 w-7 place-items-center rounded-xl text-white ring-1 ring-white/20",
              `bg-gradient-to-br ${gradient}`
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      </div>
      <div
        className={cn(
          "absolute right-0 top-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.04]",
          `bg-gradient-to-br ${gradient}`
        )}
      />
    </div>
  );
}
