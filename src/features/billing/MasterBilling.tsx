import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Receipt,
  CreditCard,
  ChevronRight,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Landmark,
  User,
  Home,
  FileText,
  FileSpreadsheet,
  Loader2,
  ExternalLink,
  Plus,
  Pencil,
  ShieldOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  addPayment,
  upsertCorporateAccount,
  folioBalance,
  fmtUGX,
  effectiveStatus,
  roomById,
  roomTypeById,
  generateGroupInvoice,
  generateGroupPerPersonInvoices,
  submitToEFRIS,
  type Folio,
  type FolioCharge,
  type PaymentMethod,
  type GroupBlock,
  type CorporateAccount,
  type VatTreatment,
  type Reservation,
  type Payment,
  type Invoice,
} from "@/lib/pms-store";
import { ROLE_META, useRole } from "@/lib/role";
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MasterBilling() {
  const groupBlocks = useStore((s) => s.groupBlocks);
  const corporateAccounts = useStore((s) => s.corporateAccounts);
  const reservations = useStore((s) => s.reservations);
  const folios = useStore((s) => s.folios);
  const charges = useStore((s) => s.charges);
  const payments = useStore((s) => s.payments);
  const [tab, setTab] = useState<"groups" | "corporate">("groups");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedCorpId, setSelectedCorpId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showNewCorp, setShowNewCorp] = useState(false);
  const [editingCorp, setEditingCorp] = useState<CorporateAccount | null>(null);
  const [deactivatingCorp, setDeactivatingCorp] = useState<CorporateAccount | null>(null);

  const activeGroups = useMemo(
    () => groupBlocks.filter((g) => g.status !== "cancelled"),
    [groupBlocks],
  );

  const activeCorp = useMemo(
    () => corporateAccounts.filter((c) => c.isActive),
    [corporateAccounts],
  );

  const filteredGroups = useMemo(
    () =>
      activeGroups.filter(
        (g) =>
          !q ||
          g.groupName.toLowerCase().includes(q.toLowerCase()) ||
          (g.organiserName ?? "").toLowerCase().includes(q.toLowerCase()),
      ),
    [activeGroups, q],
  );

  const filteredCorp = useMemo(
    () =>
      activeCorp.filter(
        (c) =>
          !q ||
          c.companyName.toLowerCase().includes(q.toLowerCase()) ||
          (c.billingContactName ?? "").toLowerCase().includes(q.toLowerCase()),
      ),
    [activeCorp, q],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link
          to="/billing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to billing
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-600 ring-1 ring-indigo-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Master Billing</h1>
              <p className="text-sm text-muted-foreground">
                Group bookings &amp; corporate account consolidated billing
              </p>
            </div>
          </div>
        </div>
        {tab === "corporate" && (
          <button
            onClick={() => setShowNewCorp(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add Organisation
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/30 p-1.5">
        <button
          onClick={() => { setTab("groups"); setSelectedGroupId(null); setSelectedCorpId(null); }}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            tab === "groups"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground/70 hover:text-foreground hover:bg-background/50",
          )}
        >
          <Users className="h-4 w-4" /> Group Bookings
        </button>
        <button
          onClick={() => { setTab("corporate"); setSelectedCorpId(null); setSelectedGroupId(null); }}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            tab === "corporate"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground/70 hover:text-foreground hover:bg-background/50",
          )}
        >
          <Landmark className="h-4 w-4" /> Corporate Accounts
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tab === "groups" ? "Search groups…" : "Search companies…"}
              className="w-full rounded-xl border border-border/50 bg-card py-2.5 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="max-h-[600px] space-y-2 overflow-y-auto rounded-xl border border-border/50 bg-card p-2 shadow-sm">
            {tab === "groups" && filteredGroups.length === 0 && (
              <p className="py-10 text-center text-xs text-muted-foreground/50">No group bookings found.</p>
            )}
            {tab === "corporate" && filteredCorp.length === 0 && (
              <p className="py-10 text-center text-xs text-muted-foreground/50">No corporate accounts found.</p>
            )}
            {tab === "groups" &&
              filteredGroups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  reservations={reservations.filter((r) => r.groupBlockId === g.id)}
                  folios={folios}
                  selected={selectedGroupId === g.id}
                  onSelect={() => { setSelectedGroupId(g.id); setSelectedCorpId(null); }}
                />
              ))}
            {tab === "corporate" &&
              filteredCorp.map((c) => {
                const corpReservations = reservations.filter((r) => r.corporateAccountId === c.id);
                return (
                  <CorpCard
                    key={c.id}
                    account={c}
                    reservations={corpReservations}
                    folios={folios}
                    selected={selectedCorpId === c.id}
                    onSelect={() => { setSelectedCorpId(c.id); setSelectedGroupId(null); }}
                  />
                );
              })}
          </div>
        </div>

        <div className="min-h-[400px]">
          {tab === "groups" && selectedGroupId && (
            <GroupBillingView
              group={groupBlocks.find((g) => g.id === selectedGroupId)!}
              reservations={reservations.filter((r) => r.groupBlockId === selectedGroupId)}
              folios={folios}
              charges={charges}
              payments={payments}
            />
          )}
          {tab === "corporate" && selectedCorpId && (
            <CorpBillingView
              account={corporateAccounts.find((c) => c.id === selectedCorpId)!}
              reservations={reservations.filter((r) => r.corporateAccountId === selectedCorpId)}
              folios={folios}
              charges={charges}
              payments={payments}
              onEdit={() => setEditingCorp(corporateAccounts.find((c) => c.id === selectedCorpId) ?? null)}
              onDeactivate={() => setDeactivatingCorp(corporateAccounts.find((c) => c.id === selectedCorpId) ?? null)}
            />
          )}
          {tab === "groups" && !selectedGroupId && <SelectPrompt />}
          {tab === "corporate" && !selectedCorpId && <SelectPrompt />}
        </div>
      </div>

      {showNewCorp && (
        <CorpAccountDialog
          onClose={() => setShowNewCorp(false)}
          onSave={(input) => {
            upsertCorporateAccount(input);
            toast.success(`Organisation "${input.companyName}" added.`);
            setShowNewCorp(false);
          }}
        />
      )}

      {editingCorp && (
        <CorpAccountDialog
          account={editingCorp}
          onClose={() => setEditingCorp(null)}
          onSave={(input) => {
            upsertCorporateAccount(input);
            toast.success("Organisation updated.");
            setEditingCorp(null);
          }}
        />
      )}

      {deactivatingCorp && (
        <AlertDialog open onOpenChange={(open) => !open && setDeactivatingCorp(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate organisation?</AlertDialogTitle>
              <AlertDialogDescription>
                "{deactivatingCorp.companyName}" will no longer appear in the organisation list or be
                selectable for new reservations. Existing folios remain untouched.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  upsertCorporateAccount({ ...deactivatingCorp, isActive: false });
                  toast.success("Organisation deactivated.");
                  setDeactivatingCorp(null);
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function GroupCard({
  group,
  reservations: res,
  folios,
  selected,
  onSelect,
}: {
  group: GroupBlock;
  reservations: Reservation[];
  folios: Folio[];
  selected: boolean;
  onSelect: () => void;
}) {
  const openFolios = folios.filter((f) =>
    res.some((r) => r.folioId === f.id) && f.status === "open",
  );
  const totalBalance = openFolios.reduce((s, f) => s + folioBalance(f.id), 0);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-primary/40 bg-primary/[0.03] shadow-sm ring-1 ring-primary/10"
          : "border-border/40 hover:border-border/70 hover:bg-muted/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{group.groupName}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60 truncate">
            {res.length} reservation{res.length !== 1 ? "s" : ""} &middot; {openFolios.length} open folio{openFolios.length !== 1 ? "s" : ""}
          </p>
          {group.organiserName && (
            <p className="text-[11px] text-muted-foreground/50 truncate">{group.organiserName}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground/50">Balance</p>
          <p className={cn(
            "text-sm font-bold tabular-nums",
            totalBalance > 0 ? "text-destructive" : "text-success",
          )}>
            {fmtUGX(totalBalance)}
          </p>
        </div>
      </div>
    </button>
  );
}

function CorpCard({
  account,
  reservations: res,
  folios,
  selected,
  onSelect,
}: {
  account: CorporateAccount;
  reservations: Reservation[];
  folios: Folio[];
  selected: boolean;
  onSelect: () => void;
}) {
  const activeFolios = folios.filter((f) =>
    res.some((r) => r.folioId === f.id) && (f.status === "open" || f.status === "transferred_to_ledger" || f.status === "transferred_to_agent"),
  );
  const totalBalance = activeFolios.reduce((s, f) => s + folioBalance(f.id), 0);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-primary/40 bg-primary/[0.03] shadow-sm ring-1 ring-primary/10"
          : "border-border/40 hover:border-border/70 hover:bg-muted/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{account.companyName}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60 truncate">
            {res.length} associated reservation{res.length !== 1 ? "s" : ""}
            {account.creditLimit > 0 && ` · Credit UGX ${fmtUGX(account.creditLimit)}`}
          </p>
          {account.billingContactName && (
            <p className="text-[11px] text-muted-foreground/50 truncate">{account.billingContactName}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground/50">Balance</p>
          <p className={cn(
            "text-sm font-bold tabular-nums",
            totalBalance > 0 ? "text-destructive" : "text-success",
          )}>
            {fmtUGX(totalBalance)}
          </p>
        </div>
      </div>
    </button>
  );
}

function SelectPrompt() {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30">
      <Building2 className="mb-3 h-12 w-12 text-muted-foreground/20" />
      <p className="text-sm font-medium text-muted-foreground">Select a group or account</p>
      <p className="mt-1 text-xs text-muted-foreground/50">
        Choose from the list to view consolidated billing
      </p>
    </div>
  );
}

type FolioEntry = {
  folio: Folio;
  reservation: Reservation;
  roomName: string;
  folioCharges: FolioCharge[];
  totalCharged: number;
  totalPaid: number;
  balance: number;
};

function useFolioEntries(
  reservations: Reservation[],
  folios: Folio[],
  charges: FolioCharge[],
  payments: Payment[],
): FolioEntry[] {
  return useMemo(
    () =>
      reservations
        .filter((r) => r.folioId)
        .map((r) => {
          const folio = folios.find((f) => f.id === r.folioId);
          if (!folio) return null;
          const folioCharges = charges.filter((c) => c.folioId === folio.id && !c.voided);
          const folioPayments = payments.filter((p) => p.folioId === folio.id && p.status === "confirmed");
          const room = roomById(r.roomId ?? "");
          const rt = roomTypeById(r.roomTypeId);
          return {
            folio,
            reservation: r,
            roomName: room ? `${room.id}` : rt?.name ?? r.roomTypeId,
            folioCharges,
            totalCharged: folioCharges.reduce((s, c) => s + c.amount, 0),
            totalPaid: folioPayments.reduce((s, p) => s + p.amount, 0),
            balance: folioBalance(folio.id),
          };
        })
        .filter((e): e is FolioEntry => e !== null)
        .sort((a, b) => a.reservation.guestName.localeCompare(b.reservation.guestName)),
    [reservations, folios, charges, payments],
  );
}

function GroupBillingView({
  group,
  reservations: res,
  folios,
  charges,
  payments,
}: {
  group: GroupBlock;
  reservations: Reservation[];
  folios: Folio[];
  charges: FolioCharge[];
  payments: Payment[];
}) {
  const entries = useFolioEntries(res, folios, charges, payments);
  const navigate = useNavigate();
  const [selectedFolioIds, setSelectedFolioIds] = useState<Set<string>>(new Set());
  const [showPayment, setShowPayment] = useState(false);
  const [generatingConsolidated, setGeneratingConsolidated] = useState(false);
  const [generatingPerPerson, setGeneratingPerPerson] = useState(false);
  const [generatedConsolidated, setGeneratedConsolidated] = useState<Invoice | null>(null);
  const [generatedPerPerson, setGeneratedPerPerson] = useState<Invoice[] | null>(null);
  const invoices = useStore((s) => s.invoices);

  const existingConsolidated = invoices.find((i) => i.id === `GROUP-INV-${group.id}`);
  const existingPerPerson = invoices.filter((i) =>
    i.id.startsWith("GRP-INV-") && res.some((r) => r.folioId === i.folioId),
  );

  const handleGenerateConsolidated = async () => {
    setGeneratingConsolidated(true);
    await new Promise((r) => setTimeout(r, 400));
    const inv = generateGroupInvoice(group.id);
    setGeneratingConsolidated(false);
    if (inv) {
      setGeneratedConsolidated(inv);
      submitToEFRIS(inv.id, "", "");
      toast.success(`Consolidated invoice ${inv.invoiceNo} generated`);
    } else {
      toast.error("Could not generate consolidated invoice");
    }
  };

  const handleGeneratePerPerson = async () => {
    setGeneratingPerPerson(true);
    await new Promise((r) => setTimeout(r, 400));
    const invoices = generateGroupPerPersonInvoices(group.id);
    setGeneratingPerPerson(false);
    if (invoices.length > 0) {
      setGeneratedPerPerson(invoices);
      invoices.forEach((inv) => submitToEFRIS(inv.id, "", ""));
      toast.success(`${invoices.length} individual invoice${invoices.length !== 1 ? "s" : ""} generated`);
    } else {
      toast.error("No invoices could be generated. Ensure folios exist with charges.");
    }
  };

  const totalCharged = entries.reduce((s, e) => s + e.totalCharged, 0);
  const totalPaid = entries.reduce((s, e) => s + e.totalPaid, 0);
  const totalBalance = entries.reduce((s, e) => s + e.balance, 0);
  const selectedEntries = entries.filter((e) => selectedFolioIds.has(e.folio.id));
  const selectedTotal = selectedEntries.reduce((s, e) => s + e.balance, 0);

  const toggleFolio = (folioId: string) => {
    const next = new Set(selectedFolioIds);
    if (next.has(folioId)) next.delete(folioId);
    else next.add(folioId);
    setSelectedFolioIds(next);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex items-start justify-between p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">Group Booking</span>
              <span className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                effectiveStatus(group) === "active" || effectiveStatus(group) === "confirmed"
                  ? "bg-success/15 text-success border-success/30"
                  : "bg-muted/40 text-muted-foreground border-border/40",
              )}>
                {effectiveStatus(group)}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold">{group.groupName}</h2>
            <p className="text-xs text-muted-foreground/70">
              {group.startDate} → {group.endDate}
              {group.organiserName && <> · Organiser: {group.organiserName}</>}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Outstanding</p>
            <p className={cn("text-2xl font-bold tabular-nums", totalBalance > 0 ? "text-destructive" : "text-success")}>
              {fmtUGX(totalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice actions */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Invoicing</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateConsolidated}
            disabled={generatingConsolidated}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3.5 py-2 text-xs font-medium transition hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            {generatingConsolidated ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5" />
            )}
            Consolidated Invoice
          </button>
          <button
            onClick={handleGeneratePerPerson}
            disabled={generatingPerPerson}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3.5 py-2 text-xs font-medium transition hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            {generatingPerPerson ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            Per-Person Invoices
          </button>
        </div>
      </div>

      {/* Generated consolidated invoice link */}
      {(existingConsolidated || generatedConsolidated) && (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Consolidated Invoice</span>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary">
                {(existingConsolidated ?? generatedConsolidated)!.invoiceNo}
              </span>
            </div>
            <button
              onClick={() => navigate(`/billing?invoice=GROUP-${group.id}`)}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <ExternalLink className="h-3 w-3" /> View Invoice
            </button>
          </div>
        </div>
      )}

      {/* Generated per-person invoice links */}
      {(existingPerPerson.length > 0 || (generatedPerPerson && generatedPerPerson.length > 0)) && (
        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Per-Person Invoices</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {(existingPerPerson.length > 0 ? existingPerPerson : generatedPerPerson!).length}
            </span>
          </div>
          <div className="space-y-1.5">
            {(existingPerPerson.length > 0 ? existingPerPerson : generatedPerPerson!).map((inv) => {
              const r = res.find((rv) => rv.folioId === inv.folioId);
              return (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{r?.guestName ?? "—"}</span>
                    <span className="font-mono text-muted-foreground">{inv.invoiceNo}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/billing?folio=${inv.folioId}`)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
          <div>
            <h3 className="text-sm font-semibold">Folios ({entries.length})</h3>
            <p className="text-[11px] text-muted-foreground/60">
              Select folios to record a consolidated payment
            </p>
          </div>
          {selectedFolioIds.size > 0 && (
            <button
              onClick={() => setShowPayment(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <CreditCard className="h-3.5 w-3.5" /> Pay UGX {fmtUGX(selectedTotal)} ({selectedFolioIds.size} folios)
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="py-14 text-center">
            <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/50">No folios found for this group.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {entries.map((entry) => (
              <div
                key={entry.folio.id}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20 cursor-pointer",
                  selectedFolioIds.has(entry.folio.id) && "bg-primary/[0.02]",
                )}
                onClick={() => toggleFolio(entry.folio.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedFolioIds.has(entry.folio.id)}
                  onChange={() => toggleFolio(entry.folio.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-[10px] font-bold text-primary ring-1 ring-primary/20">
                  {entry.reservation.guestName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{entry.reservation.guestName}</span>
                    <span className={cn(
                      "inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                      entry.reservation.status === "checked_in" ? "bg-success/15 text-success border-success/30" :
                      entry.reservation.status === "checked_out" ? "bg-muted/40 text-muted-foreground border-border/40" :
                      "bg-muted/20 text-muted-foreground border-border/40",
                    )}>
                      {entry.reservation.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/60">
                    <span>{entry.folio.id}</span>
                    <span>{entry.roomName}</span>
                    <span>{entry.reservation.checkIn} → {entry.reservation.checkOut}</span>
                    <span>{entry.folioCharges.length} charge{entry.folioCharges.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xs text-muted-foreground/50">Balance</p>
                  <p className={cn(
                    "text-sm font-bold tabular-nums",
                    entry.balance > 0 ? "text-destructive" : "text-success",
                  )}>
                    {fmtUGX(entry.balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/50 bg-muted/10 px-5 py-3 text-sm">
          <div className="flex gap-6">
            <span className="text-muted-foreground">Total charged: <strong>{fmtUGX(totalCharged)}</strong></span>
            <span className="text-muted-foreground">Total paid: <strong className="text-success">{fmtUGX(totalPaid)}</strong></span>
          </div>
          <span className={cn("font-bold tabular-nums", totalBalance > 0 ? "text-destructive" : "text-success")}>
            Balance: {fmtUGX(totalBalance)}
          </span>
        </div>
      </div>

      {showPayment && (
        <MasterPaymentDialog
          payerName={group.groupName}
          payerEmail={group.organiserEmail}
          entries={selectedEntries}
          totalAmount={selectedTotal}
          onClose={() => setShowPayment(false)}
          onDone={() => { setShowPayment(false); setSelectedFolioIds(new Set()); }}
        />
      )}
    </div>
  );
}

function CorpBillingView({
  account,
  reservations: res,
  folios,
  charges,
  payments,
  onEdit,
  onDeactivate,
}: {
  account: CorporateAccount;
  reservations: Reservation[];
  folios: Folio[];
  charges: FolioCharge[];
  payments: Payment[];
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  const entries = useFolioEntries(res, folios, charges, payments);
  const [selectedFolioIds, setSelectedFolioIds] = useState<Set<string>>(new Set());
  const [showPayment, setShowPayment] = useState(false);

  const totalCharged = entries.reduce((s, e) => s + e.totalCharged, 0);
  const totalPaid = entries.reduce((s, e) => s + e.totalPaid, 0);
  const totalBalance = entries.reduce((s, e) => s + e.balance, 0);
  const selectedEntries = entries.filter((e) => selectedFolioIds.has(e.folio.id));
  const selectedTotal = selectedEntries.reduce((s, e) => s + e.balance, 0);

  const toggleFolio = (folioId: string) => {
    const next = new Set(selectedFolioIds);
    if (next.has(folioId)) next.delete(folioId);
    else next.add(folioId);
    setSelectedFolioIds(next);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex items-start justify-between p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">Corporate Account</span>
              <span className="inline-flex rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                Active
              </span>
            </div>
            <h2 className="font-display text-xl font-bold">{account.companyName}</h2>
            <p className="text-xs text-muted-foreground/70">
              TIN: {account.tin ?? "—"} · Credit: UGX {fmtUGX(account.creditLimit)} · Terms: {account.creditTermsDays}d
              {account.billingContactName && <> · Contact: {account.billingContactName}</>}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Outstanding</p>
            <p className={cn("text-2xl font-bold tabular-nums", totalBalance > 0 ? "text-destructive" : "text-success")}>
              {fmtUGX(totalBalance)}
            </p>
            {account.creditLimit > 0 && (
              <p className="text-[10px] text-muted-foreground/50">
                Credit remaining: UGX {fmtUGX(Math.max(0, account.creditLimit - totalBalance))}
              </p>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
              <button
                onClick={onDeactivate}
                className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-card px-2.5 py-1.5 text-[11px] font-medium text-destructive transition hover:bg-destructive/10"
              >
                <ShieldOff className="h-3 w-3" /> Deactivate
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
          <div>
            <h3 className="text-sm font-semibold">Folios ({entries.length})</h3>
            <p className="text-[11px] text-muted-foreground/60">
              Select folios to record a consolidated payment
            </p>
          </div>
          {selectedFolioIds.size > 0 && (
            <button
              onClick={() => setShowPayment(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <CreditCard className="h-3.5 w-3.5" /> Pay UGX {fmtUGX(selectedTotal)} ({selectedFolioIds.size} folios)
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="py-14 text-center">
            <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/50">No folios found for this account.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {entries.map((entry) => (
              <div
                key={entry.folio.id}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20 cursor-pointer",
                  selectedFolioIds.has(entry.folio.id) && "bg-primary/[0.02]",
                )}
                onClick={() => toggleFolio(entry.folio.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedFolioIds.has(entry.folio.id)}
                  onChange={() => toggleFolio(entry.folio.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-[10px] font-bold text-primary ring-1 ring-primary/20">
                  {entry.reservation.guestName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{entry.reservation.guestName}</span>
                    <span className={cn(
                      "inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                      entry.reservation.status === "checked_in" ? "bg-success/15 text-success border-success/30" :
                      entry.reservation.status === "checked_out" ? "bg-muted/40 text-muted-foreground border-border/40" :
                      "bg-muted/20 text-muted-foreground border-border/40",
                    )}>
                      {entry.reservation.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/60">
                    <span>{entry.folio.id}</span>
                    <span>{entry.roomName}</span>
                    <span>{entry.reservation.checkIn} → {entry.reservation.checkOut}</span>
                    <span>{entry.folioCharges.length} charge{entry.folioCharges.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xs text-muted-foreground/50">Balance</p>
                  <p className={cn(
                    "text-sm font-bold tabular-nums",
                    entry.balance > 0 ? "text-destructive" : "text-success",
                  )}>
                    {fmtUGX(entry.balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/50 bg-muted/10 px-5 py-3 text-sm">
          <div className="flex gap-6">
            <span className="text-muted-foreground">Total charged: <strong>{fmtUGX(totalCharged)}</strong></span>
            <span className="text-muted-foreground">Total paid: <strong className="text-success">{fmtUGX(totalPaid)}</strong></span>
          </div>
          <span className={cn("font-bold tabular-nums", totalBalance > 0 ? "text-destructive" : "text-success")}>
            Balance: {fmtUGX(totalBalance)}
          </span>
        </div>
      </div>

      {showPayment && (
        <MasterPaymentDialog
          payerName={account.companyName}
          payerEmail={account.billingContactEmail}
          entries={selectedEntries}
          totalAmount={selectedTotal}
          onClose={() => setShowPayment(false)}
          onDone={() => { setShowPayment(false); setSelectedFolioIds(new Set()); }}
        />
      )}
    </div>
  );
}

function CorpAccountDialog({
  account,
  onClose,
  onSave,
}: {
  account?: CorporateAccount;
  onClose: () => void;
  onSave: (input: CorporateAccount) => void;
}) {
  const [companyName, setCompanyName] = useState(account?.companyName ?? "");
  const [billingContactName, setBillingContactName] = useState(account?.billingContactName ?? "");
  const [billingContactEmail, setBillingContactEmail] = useState(account?.billingContactEmail ?? "");
  const [billingContactPhone, setBillingContactPhone] = useState(account?.billingContactPhone ?? "");
  const [address, setAddress] = useState(account?.address ?? "");
  const [tin, setTin] = useState(account?.tin ?? "");
  const [creditLimit, setCreditLimit] = useState(account?.creditLimit ?? 0);
  const [creditTermsDays, setCreditTermsDays] = useState(account?.creditTermsDays ?? 30);
  const [vatTreatment, setVatTreatment] = useState<VatTreatment>(account?.vatTreatment ?? "inclusive");

  const handleSave = () => {
    if (!companyName.trim()) {
      toast.error("Company name is required.");
      return;
    }
    const now = new Date().toISOString();
    onSave({
      id: account?.id ?? crypto.randomUUID(),
      propertyId: account?.propertyId ?? "T001",
      companyName: companyName.trim(),
      billingContactName: billingContactName.trim() || undefined,
      billingContactEmail: billingContactEmail.trim() || undefined,
      billingContactPhone: billingContactPhone.trim() || undefined,
      address: address.trim() || undefined,
      tin: tin.trim() || undefined,
      creditLimit: Math.max(0, Number(creditLimit) || 0),
      creditTermsDays: Math.max(0, Number(creditTermsDays) || 30),
      vatTreatment,
      creditGracePeriodDays: account?.creditGracePeriodDays ?? 0,
      isActive: account?.isActive ?? true,
      outstandingBalance: account?.outstandingBalance ?? 0,
      legacyRef: account?.legacyRef,
      createdAt: account?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Organisation" : "Add Organisation"}</DialogTitle>
          <DialogDescription>
            {account
              ? "Update the corporate account details."
              : "Create a corporate account for city-ledger billing."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Company name *</label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Nile Traders Ltd"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Billing contact name</label>
              <input
                value={billingContactName}
                onChange={(e) => setBillingContactName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Billing contact phone</label>
              <input
                value={billingContactPhone}
                onChange={(e) => setBillingContactPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Billing contact email</label>
            <input
              type="email"
              value={billingContactEmail}
              onChange={(e) => setBillingContactEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">TIN</label>
              <input
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">VAT treatment</label>
              <Select value={vatTreatment} onValueChange={(v) => setVatTreatment(v as VatTreatment)}>
                <SelectTrigger className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  <SelectValue placeholder="VAT treatment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inclusive">Inclusive</SelectItem>
                  <SelectItem value="exclusive">Exclusive</SelectItem>
                  <SelectItem value="not_applicable">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Credit limit (UGX)</label>
              <input
                type="number"
                min={0}
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Credit terms (days)</label>
              <input
                type="number"
                min={0}
                value={creditTermsDays}
                onChange={(e) => setCreditTermsDays(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Plot 12, Kampala Road"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
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
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {account ? "Save Changes" : "Add Organisation"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MasterPaymentDialog({
  payerName,
  payerEmail,
  entries,
  totalAmount,
  onClose,
  onDone,
}: {
  payerName: string;
  payerEmail?: string;
  entries: FolioEntry[];
  totalAmount: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const actor = useRole();
  const actorName = ROLE_META[actor.role]?.person ?? actor.role;
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(totalAmount);
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (amount <= 0) { toast.error("Amount must be greater than zero."); return; }
    setPaying(true);
    let successCount = 0;
    let remainder = amount;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.balance <= 0) continue;
      const isLast = i === entries.length - 1;
      const folioAmount = isLast ? remainder : Math.min(remainder, entry.balance);
      if (folioAmount <= 0) continue;
      addPayment(entry.folio.id, {
        method,
        amount: folioAmount,
        reference: reference || undefined,
        date: new Date().toISOString().slice(0, 10),
        receiptedBy: actorName,
        status: "confirmed",
      });
      successCount++;
      remainder -= folioAmount;
    }

    setPaying(false);
    toast.success(`Payment of UGX ${fmtUGX(amount)} recorded across ${successCount} folio${successCount !== 1 ? "s" : ""}.`);
    onDone();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Master Payment</DialogTitle>
          <DialogDescription>
            One payment from <strong>{payerName}</strong> covering multiple folios
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Payer</span>
              <span className="font-medium">{payerName}</span>
            </div>
            {payerEmail && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{payerEmail}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Folios covered</span>
              <span className="font-medium">{entries.length}</span>
            </div>
          </div>

          <div className="max-h-[200px] overflow-y-auto space-y-1.5 rounded-xl border border-border/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Folio breakdown</p>
            {entries.map((e) => (
              <div key={e.folio.id} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{e.folio.id} — {e.reservation.guestName}</span>
                <span className={cn("tabular-nums font-medium", e.balance > 0 ? "text-destructive" : "text-success")}>
                  {fmtUGX(e.balance)}
                </span>
              </div>
            ))}
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Payment method</label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="mtn_momo">MTN MoMo</SelectItem>
                <SelectItem value="airtel_money">Airtel Money</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Amount (UGX)</label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Reference (optional)</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Receipt or transaction ref"
              className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-border/60 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={paying || amount <= 0}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {paying ? "Recording…" : `Pay UGX ${fmtUGX(amount)}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
