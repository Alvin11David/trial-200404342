import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarRange,
  Plus,
  Percent,
  Tag,
  ShieldAlert,
  Ban,
  Pencil,
  Trash2,
  Search,
  X,
  TrendingUp,
  Lock,
  Info,
} from "lucide-react";
import {
  useStore,
  upsertRatePlan,
  deleteRatePlan,
  type RoomType,
  type Room,
  type RatePlan,
  type CancellationPolicy,
  type VatTreatment,
} from "@/lib/pms-store";
import { useRole } from "@/lib/role";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

export const Route = createFileRoute("/_app/rates")({
  head: () => ({ meta: [{ title: "Rates & Availability — Jambo PMS" }] }),
  component: RatesPage,
});

type SeasonalRate = {
  id: string;
  ratePlanId: string;
  label: string;
  from: string;
  to: string;
  multiplier: number; // 1.25 = +25%
  override?: number; // absolute UGX overrides multiplier
};

type DateRestriction = {
  id: string;
  date: string;
  roomTypeId: string;
  minStay: number;
  closedToArrival: boolean;
  closedToDeparture: boolean;
  note?: string;
};

type Promotion = {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  roomTypeIds: string[];
  validFrom: string;
  validTo: string;
  active: boolean;
  requiresApproval: boolean;
};

const fmtUGX = (n: number) => "UGX " + Math.round(n).toLocaleString();

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/* ============================== Page ============================== */

function RatesPage() {
  const { role } = useRole();
  const canWrite =
    role === "Reservations / Revenue" || role === "Owner / GM" || role === "System Administrator";

  const [tab, setTab] = useState<
    "overview" | "plans" | "calendar" | "availability" | "promotions" | "restrictions"
  >("overview");

  const plans = useStore((s) => s.ratePlans);
  const cancellationPolicies = useStore((s) => s.cancellationPolicies);
  const [seasons, setSeasons] = useState<SeasonalRate[]>([]);
  const [restrictions, setRestrictions] = useState<DateRestriction[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "plans", label: "Rate plans", icon: Tag },
    { id: "calendar", label: "Rate calendar", icon: CalendarRange },
    { id: "availability", label: "Availability grid", icon: CalendarRange },
    { id: "restrictions", label: "Restrictions", icon: ShieldAlert },
    { id: "promotions", label: "Promotions", icon: Percent },
  ] as const;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            Rates &amp; Availability
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Pricing &amp; inventory brain
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            One source of truth for what each room costs and when it&apos;s sellable. Every
            reservation, folio and EFRIS invoice draws from here.
          </p>
        </div>
        {!canWrite && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Read-only for {role}
          </div>
        )}
      </header>

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <Overview plans={plans} seasons={seasons} promos={promos} />}
      {tab === "plans" && <PlansTab canWrite={canWrite} plans={plans} />}
      {tab === "calendar" && <CalendarTab plans={plans} seasons={seasons} />}
      {tab === "availability" && <AvailabilityTab />}
      {tab === "restrictions" && (
        <RestrictionsTab
          canWrite={canWrite}
          restrictions={restrictions}
          setRestrictions={setRestrictions}
          seasons={seasons}
          setSeasons={setSeasons}
        />
      )}
      {tab === "promotions" && (
        <PromotionsTab canWrite={canWrite} promos={promos} setPromos={setPromos} />
      )}
    </div>
  );
}

/* ============================ Overview ============================ */

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Overview({
  plans,
  seasons,
  promos,
}: {
  plans: RatePlan[];
  seasons: SeasonalRate[];
  promos: Promotion[];
}) {
  const tenant = useStore((s) => s.tenant);
  const rooms = useStore((s) => s.rooms);
  const reservations = useStore((s) => s.reservations);
  const roomTypes = useStore((s) => s.roomTypes);

  const today = todayISO();
  const totalRooms = rooms.length;
  const occupiedToday = rooms.filter((r) => r.status === "occupied").length;
  const blockedToday = rooms.filter(
    (r) => r.status === "blocked" || r.status === "maintenance",
  ).length;
  const sellable = totalRooms - blockedToday;
  const occupancyPct = sellable ? Math.round((occupiedToday / sellable) * 100) : 0;

  const activePlans = plans.filter((p) => p.isActive);
  const cheapest = activePlans.reduce(
    (min, p) => (p.nightlyRate < min ? p.nightlyRate : min),
    Infinity,
  );

  const upcomingSeasons = seasons.filter((s) => s.to >= today).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          label="Active rate plans"
          value={String(activePlans.length)}
          hint={`${plans.length - activePlans.length} archived`}
        />
        <Stat
          label="Lowest BAR"
          value={cheapest === Infinity ? "—" : fmtUGX(cheapest)}
          hint="per night, all room types"
        />
        <Stat
          label="Sellable rooms"
          value={`${sellable} / ${totalRooms}`}
          hint={`${blockedToday} blocked or maintenance`}
        />
        <Stat
          label="Today occupancy"
          value={`${occupancyPct}%`}
          hint={`${occupiedToday} occupied of ${sellable} sellable`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Rates by room type
            </h2>
            <span className="text-[11px] text-muted-foreground">
              Currency: {tenant.defaultCurrency} · VAT 18%
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4">Room type</th>
                  {activePlans.map((p) => (
                    <th key={p.id} className="py-2 pr-4 text-right">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roomTypes.map((rt) => (
                  <tr key={rt.id}>
                    <td className="py-2.5 pr-4">
                      <div className="font-medium">{rt.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        capacity {rt.maxOccupancy}
                      </div>
                    </td>
                    {activePlans.map((p) => (
                      <td key={p.id} className="py-2.5 pr-4 text-right">
                        {p.roomTypeId === rt.id ? (
                          <span className="font-mono text-sm">{fmtUGX(p.nightlyRate)}</span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">
            Upcoming seasons
          </h2>
          <ul className="space-y-3">
            {upcomingSeasons.length === 0 && (
              <li className="text-sm text-muted-foreground">No upcoming seasonal pricing.</li>
            )}
            {upcomingSeasons.map((s) => {
              const plan = plans.find((p) => p.id === s.ratePlanId);
              const delta = Math.round((s.multiplier - 1) * 100);
              return (
                <li key={s.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{s.label}</p>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold",
                        delta >= 0 ? "bg-success/10 text-success" : "bg-primary/10 text-primary",
                      )}
                    >
                      {delta >= 0 ? "+" : ""}
                      {delta}%
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {plan?.name ?? "—"} · {s.from} → {s.to}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">
            Active promotions
          </h2>
          <ul className="space-y-2">
            {promos
              .filter((p) => p.active)
              .map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-[11px] font-bold text-primary">
                      {p.code}
                    </span>
                    <span className="text-foreground">
                      {p.type === "percent" ? `${p.value}% off` : `${fmtUGX(p.value)} off`}
                    </span>
                  </div>
                  {p.requiresApproval && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning">
                      <ShieldAlert className="h-3 w-3" />
                      Approval required
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">
            Live reservation pressure
          </h2>
          <p className="mb-3 text-[12px] text-muted-foreground">
            Confirmed bookings in the next 14 days that consume sellable inventory.
          </p>
          <div className="flex h-24 items-end gap-1.5">
            {Array.from({ length: 14 }).map((_, i) => {
              const date = addDaysISO(i);
              const count = reservations.filter(
                (r) =>
                  r.checkIn <= date &&
                  r.checkOut > date &&
                  (r.status === "confirmed" || r.status === "checked_in"),
              ).length;
              const h = Math.min(100, (count / Math.max(totalRooms, 1)) * 100);
              return (
                <div
                  key={date}
                  className="flex flex-1 flex-col items-center gap-1"
                  title={`${date}: ${count} rooms`}
                >
                  <div
                    className="w-full rounded-t bg-primary/80"
                    style={{ height: `${Math.max(h, 4)}%` }}
                  />
                  <span className="text-[9px] text-muted-foreground">{date.slice(8)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ Plans tab ============================ */

function PlansTab({
  canWrite,
  plans,
}: {
  canWrite: boolean;
  plans: RatePlan[];
}) {
  const roomTypes = useStore((s) => s.roomTypes);
  const [editing, setEditing] = useState<RatePlan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState("");

  const filtered = plans.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q.toLowerCase()),
  );

  const onSave = (rp: RatePlan) => {
    upsertRatePlan(rp);
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or code…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {canWrite && (
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> New rate plan
          </button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className={cn(
              "group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-md",
              !p.isActive && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      p.isActive ? "bg-success" : "bg-muted-foreground",
                    )}
                  />
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">{p.name}</h3>
              </div>
              {canWrite && (
                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => {
                      setEditing(p);
                      setShowForm(true);
                    }}
                    className="rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteRatePlan(p.id)}
                    className="rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold tracking-tight">
                {fmtUGX(p.nightlyRate)}
              </span>
              <span className="text-[11px] text-muted-foreground">/ night</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 font-semibold",
                  p.vatTreatment === "inclusive"
                    ? "bg-success/10 text-success"
                    : p.vatTreatment === "exclusive"
                      ? "bg-warning/10 text-warning"
                      : "bg-muted text-muted-foreground",
                )}
              >
                VAT {p.vatTreatment === "not_applicable" ? "N/A" : p.vatTreatment}
              </span>
              {p.minLengthOfStay > 1 && (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
                  min {p.minLengthOfStay} nights
                </span>
              )}
              {p.depositRequiredPct > 0 && (
                <span className="rounded-md bg-info/10 text-info px-1.5 py-0.5 font-semibold">
                  {p.depositRequiredPct}% deposit
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {(() => {
                const rt = roomTypes.find((r) => r.id === p.roomTypeId);
                return (
                  <span
                    className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-foreground"
                  >
                    {rt?.name ?? p.roomTypeId}
                  </span>
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <RatePlanForm
          editing={editing}
          roomTypes={roomTypes}
          onSave={onSave}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function RatePlanForm({
  editing,
  roomTypes,
  onSave,
  onClose,
}: {
  editing: RatePlan | null;
  roomTypes: RoomType[];
  onSave: (p: RatePlan) => void;
  onClose: () => void;
}) {
  const cancellationPolicies = useStore((s) => s.cancellationPolicies);
  const tenant = useStore((s) => s.tenant);
  const [form, setForm] = useState<RatePlan>(
    editing ?? {
      id: "rp_" + Math.random().toString(36).slice(2, 8),
      propertyId: tenant.id,
      roomTypeId: roomTypes[0]?.id ?? "",
      cancellationPolicyId: cancellationPolicies[0]?.id,
      name: "",
      nightlyRate: 200_000,
      vatTreatment: "inclusive",
      depositRequiredPct: 0,
      minLengthOfStay: 1,
      isActive: true,
    },
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h3 className="font-display text-lg font-semibold tracking-tight">
              {editing ? "Edit rate plan" : "New rate plan"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Pricing applied to confirmed reservations is locked at booking time.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60"
            />
          </Field>
          <Field label="Room type">
            <Select
              value={form.roomTypeId}
              onValueChange={(v) => setForm({ ...form, roomTypeId: v })}
            >
              <SelectTrigger className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nightly rate (UGX)">
            <input
              type="number"
              value={form.nightlyRate}
              onChange={(e) => setForm({ ...form, nightlyRate: Number(e.target.value) })}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60"
            />
          </Field>
          <Field label="Min length of stay">
            <input
              type="number"
              min={1}
              value={form.minLengthOfStay}
              onChange={(e) => setForm({ ...form, minLengthOfStay: Math.max(1, Number(e.target.value)) })}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60"
            />
          </Field>
          <Field label="VAT treatment">
            <Select
              value={form.vatTreatment}
              onValueChange={(v) => setForm({ ...form, vatTreatment: v as VatTreatment })}
            >
              <SelectTrigger className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
                <SelectValue placeholder="Select VAT treatment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inclusive">VAT inclusive</SelectItem>
                <SelectItem value="exclusive">VAT exclusive</SelectItem>
                <SelectItem value="not_applicable">Not applicable</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Deposit required (%)">
            <input
              type="number"
              min={0}
              max={100}
              value={form.depositRequiredPct}
              onChange={(e) => setForm({ ...form, depositRequiredPct: Math.max(0, Math.min(100, Number(e.target.value))) })}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60"
            />
          </Field>
          <Field label="Cancellation policy">
            <Select
              value={form.cancellationPolicyId ?? ""}
              onValueChange={(v) => setForm({ ...form, cancellationPolicyId: v || undefined })}
            >
              <SelectTrigger className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                {cancellationPolicies.map((cp) => (
                  <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.isActive ? "1" : "0"}
              onValueChange={(v) => setForm({ ...form, isActive: v === "1" })}
            >
              <SelectTrigger className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name}
            className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            Save rate plan
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ============================ Calendar tab ============================ */

function CalendarTab({ plans, seasons }: { plans: RatePlan[]; seasons: SeasonalRate[] }) {
  const activePlans = plans.filter((p) => p.isActive);
  const [planId, setPlanId] = useState(activePlans[0]?.id ?? "");
  const [start, setStart] = useState(todayISO());
  const plan = plans.find((p) => p.id === planId);

  const days = useMemo(() => {
    const arr: { date: string; price: number; season?: SeasonalRate }[] = [];
    const startDate = new Date(start);
    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const date = d.toISOString().slice(0, 10);
      let price = plan?.nightlyRate ?? 0;
      let season: SeasonalRate | undefined;
      for (const s of seasons) {
        if (s.ratePlanId === planId && date >= s.from && date <= s.to) {
          season = s;
          price = s.override ?? Math.round(price * s.multiplier);
          break;
        }
      }
      arr.push({ date, price, season });
    }
    return arr;
  }, [plan, planId, seasons, start]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <Select value={planId} onValueChange={setPlanId}>
          <SelectTrigger className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            {activePlans.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker value={start} onChange={setStart} />
        <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
          <Legend dotClass="bg-primary/40" label="Base" />
          <Legend dotClass="bg-success/60" label="Discounted season" />
          <Legend dotClass="bg-warning/60" label="Peak season" />
        </div>
      </div>

      {!plan ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Select a rate plan to view the calendar.
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const day = new Date(d.date);
            const isPeak = d.season && d.season.multiplier > 1;
            const isLow = d.season && d.season.multiplier < 1;
            return (
              <div
                key={d.date}
                className={cn(
                  "relative rounded-lg border bg-card p-3 text-left transition hover:border-primary/40",
                  isPeak ? "border-warning/40" : isLow ? "border-success/40" : "border-border",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                    {day.toLocaleDateString("en-GB", { weekday: "short" })}
                  </span>
                  <span className="font-display text-base font-bold">{day.getDate()}</span>
                </div>
                <p
                  className={cn(
                    "mt-2 font-mono text-[12px] font-semibold",
                    isPeak && "text-warning",
                    isLow && "text-success",
                  )}
                >
                  {fmtUGX(d.price)}
                </p>
                {d.season && (
                  <p className="mt-1 truncate text-[9px] text-muted-foreground">{d.season.label}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Legend({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", dotClass)} />
      {label}
    </span>
  );
}

/* ============================ Availability tab ============================ */

function AvailabilityTab() {
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const reservations = useStore((s) => s.reservations);
  const [start, setStart] = useState(todayISO());
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const filteredRooms = rooms.filter((r) => typeFilter === "all" || r.roomTypeId === typeFilter);

  const cellFor = (room: Room, date: string) => {
    if (room.status === "maintenance" || room.status === "blocked") {
      return { kind: "blocked" as const };
    }
    const res = reservations.find(
      (r) =>
        r.roomId === room.id &&
        r.checkIn <= date &&
        r.checkOut > date &&
        (r.status === "confirmed" || r.status === "checked_in"),
    );
    if (res) return { kind: "booked" as const, res };
    return { kind: "free" as const };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <DatePicker value={start} onChange={setStart} />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
            <SelectValue placeholder="Filter by room type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All room types</SelectItem>
            {roomTypes.map((rt) => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
          <Legend dotClass="bg-success/60" label="Free" />
          <Legend dotClass="bg-primary/60" label="Booked" />
          <Legend dotClass="bg-destructive/60" label="Blocked" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/40">
            <tr>
              <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left font-semibold">
                Room
              </th>
              {days.map((d) => {
                const dd = new Date(d);
                return (
                  <th key={d} className="px-1 py-2 text-center font-medium">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      {dd.toLocaleDateString("en-GB", { weekday: "short" })}
                    </div>
                    <div className="text-sm font-bold text-foreground">{dd.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRooms.map((room) => {
              const rt = roomTypes.find((r) => r.id === room.roomTypeId);
              return (
                <tr key={room.id}>
                  <td className="sticky left-0 z-10 bg-card px-3 py-2">
                    <div className="font-semibold">{room.roomNumber}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Floor {room.floor} · {rt?.name}
                    </div>
                  </td>
                  {days.map((d) => {
                    const c = cellFor(room, d);
                    return (
                      <td key={d} className="px-1 py-1.5">
                        <div
                          className={cn(
                            "h-7 rounded-md border text-center text-[10px] font-medium leading-7 transition",
                            c.kind === "free" && "border-success/30 bg-success/10 text-success",
                            c.kind === "booked" && "border-primary/40 bg-primary/15 text-primary",
                            c.kind === "blocked" &&
                              "border-destructive/30 bg-destructive/10 text-destructive",
                          )}
                          title={
                            c.kind === "booked"
                              ? `${c.res.guestName} · ${c.res.id}`
                              : c.kind === "blocked"
                                ? "Blocked / Maintenance"
                                : "Available"
                          }
                        >
                          {c.kind === "free" && "✓"}
                          {c.kind === "booked" && c.res.guestName.split(" ")[0]}
                          {c.kind === "blocked" && <Ban className="mx-auto h-3 w-3" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        Availability updates automatically as reservations are created, cancelled or rooms are
        blocked. Offline changes queue in the outbox and sync on reconnection.
      </div>
    </div>
  );
}

/* ============================ Restrictions tab ============================ */

function RestrictionsTab({
  canWrite,
  restrictions,
  setRestrictions,
  seasons,
  setSeasons,
}: {
  canWrite: boolean;
  restrictions: DateRestriction[];
  setRestrictions: React.Dispatch<React.SetStateAction<DateRestriction[]>>;
  seasons: SeasonalRate[];
  setSeasons: React.Dispatch<React.SetStateAction<SeasonalRate[]>>;
}) {
  const roomTypes = useStore((s) => s.roomTypes);

  const addRestriction = () => {
    setRestrictions((prev) => [
      ...prev,
      {
        id: "r_" + Math.random().toString(36).slice(2, 7),
        date: todayISO(),
        roomTypeId: roomTypes[0]?.id ?? "",
        minStay: 1,
        closedToArrival: false,
        closedToDeparture: false,
      },
    ]);
  };

  const addSeason = () => {
    setSeasons((prev) => [
      ...prev,
      {
        id: "s_" + Math.random().toString(36).slice(2, 7),
        ratePlanId: "rp_std",
        label: "New season",
        from: todayISO(),
        to: addDaysISO(7),
        multiplier: 1.1,
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Seasonal &amp; date overrides
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Multiply the base rate or pin an absolute UGX override for a date range.
            </p>
          </div>
          {canWrite && (
            <button
              onClick={addSeason}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Add season
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5">Label</th>
              <th className="px-3 py-2.5">Rate plan</th>
              <th className="px-3 py-2.5">From</th>
              <th className="px-3 py-2.5">To</th>
              <th className="px-3 py-2.5 text-right">Multiplier</th>
              <th className="px-3 py-2.5 text-right">Override (UGX)</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {seasons.map((s) => (
              <tr key={s.id}>
                <td className="px-5 py-2.5 font-medium">{s.label}</td>
                <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                  {s.ratePlanId}
                </td>
                <td className="px-3 py-2.5">{s.from}</td>
                <td className="px-3 py-2.5">{s.to}</td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {(s.multiplier * 100).toFixed(0)}%
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {s.override ? fmtUGX(s.override) : "—"}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {canWrite && (
                    <button
                      onClick={() => setSeasons((prev) => prev.filter((x) => x.id !== s.id))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {seasons.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-sm text-muted-foreground">
                  No seasonal overrides yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">Stay restrictions</h2>
            <p className="text-[11px] text-muted-foreground">
              Min-stay, closed-to-arrival and closed-to-departure rules by date and room type.
            </p>
          </div>
          {canWrite && (
            <button
              onClick={addRestriction}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Add restriction
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5">Date</th>
              <th className="px-3 py-2.5">Room type</th>
              <th className="px-3 py-2.5 text-right">Min stay</th>
              <th className="px-3 py-2.5">CTA</th>
              <th className="px-3 py-2.5">CTD</th>
              <th className="px-3 py-2.5">Note</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {restrictions.map((r) => {
              const rt = roomTypes.find((x) => x.id === r.roomTypeId);
              return (
                <tr key={r.id}>
                  <td className="px-5 py-2.5">{r.date}</td>
                  <td className="px-3 py-2.5">{rt?.name ?? r.roomTypeId}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{r.minStay}</td>
                  <td className="px-3 py-2.5">
                    {r.closedToArrival ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                        <Ban className="h-3 w-3" /> Closed
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">Open</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {r.closedToDeparture ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                        <Ban className="h-3 w-3" /> Closed
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">Open</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{r.note ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right">
                    {canWrite && (
                      <button
                        onClick={() => setRestrictions((prev) => prev.filter((x) => x.id !== r.id))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {restrictions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-sm text-muted-foreground">
                  No restrictions configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ============================ Promotions tab ============================ */

function PromotionsTab({
  canWrite,
  promos,
  setPromos,
}: {
  canWrite: boolean;
  promos: Promotion[];
  setPromos: React.Dispatch<React.SetStateAction<Promotion[]>>;
}) {
  const roomTypes = useStore((s) => s.roomTypes);

  const addPromo = () => {
    setPromos((prev) => [
      ...prev,
      {
        id: "p_" + Math.random().toString(36).slice(2, 7),
        code: "NEW" + Math.floor(Math.random() * 99),
        type: "percent",
        value: 10,
        roomTypeIds: roomTypes.map((r) => r.id),
        validFrom: todayISO(),
        validTo: addDaysISO(60),
        active: true,
        requiresApproval: false,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Discounts applied at booking time. Reason &amp; approver are logged in the Audit Trail.
        </p>
        {canWrite && (
          <button
            onClick={addPromo}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> New promotion
          </button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {promos.map((p) => (
          <div
            key={p.id}
            className={cn(
              "rounded-xl border border-border bg-card p-4 transition hover:border-primary/40",
              !p.active && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-[11px] font-bold text-primary">
                    {p.code}
                  </span>
                  {p.requiresApproval && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                      <ShieldAlert className="h-3 w-3" /> Approval
                    </span>
                  )}
                </div>
                <p className="mt-2 font-display text-xl font-bold tracking-tight">
                  {p.type === "percent" ? `${p.value}% off` : `${fmtUGX(p.value)} off`}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Valid {p.validFrom} → {p.validTo}
                </p>
              </div>
              {canWrite && (
                <button
                  onClick={() => setPromos((prev) => prev.filter((x) => x.id !== p.id))}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {p.roomTypeIds.map((id) => {
                const rt = roomTypes.find((r) => r.id === id);
                return (
                  <span
                    key={id}
                    className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-foreground"
                  >
                    {rt?.name ?? id}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
