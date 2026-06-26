import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteRoom,
  deleteRoomType,
  updateTenant,
  upsertRoom,
  upsertRoomType,
  useStore,
  type Room,
  type RoomStatus,
  type RoomType,
} from "@/lib/pms-store";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Jambo PMS" }] }),
  component: SettingsPage,
});

const STATUSES: RoomStatus[] = ["available", "occupied", "dirty", "maintenance", "blocked"];

function SettingsPage() {
  const [tab, setTab] = useState<"tenant" | "types" | "rooms">("tenant");
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Property configuration, room types and inventory.
        </p>
      </header>

      <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
        {(
          [
            ["tenant", "Property"],
            ["types", "Room types"],
            ["rooms", "Rooms"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={
              "rounded-md px-4 py-1.5 font-semibold " +
              (tab === k
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "tenant" && <TenantPanel />}
      {tab === "types" && <RoomTypesPanel />}
      {tab === "rooms" && <RoomsPanel />}
    </div>
  );
}

function TenantPanel() {
  const tenant = useStore((s) => s.tenant);
  const [t, setT] = useState(tenant);
  const save = () => updateTenant(t);
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold">Property Details</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Labeled label="Property name">
          <input value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} className="input" />
        </Labeled>
        <Labeled label="Email">
          <input value={t.email ?? ""} onChange={(e) => setT({ ...t, email: e.target.value })} className="input" />
        </Labeled>
        <Labeled label="Phone">
          <input value={t.phone ?? ""} onChange={(e) => setT({ ...t, phone: e.target.value })} className="input" />
        </Labeled>
        <Labeled label="TIN">
          <input value={t.tin ?? ""} onChange={(e) => setT({ ...t, tin: e.target.value })} className="input" />
        </Labeled>
        <Labeled label="EFRIS Device No">
          <input value={t.efrisDeviceNo ?? ""} onChange={(e) => setT({ ...t, efrisDeviceNo: e.target.value })} className="input" />
        </Labeled>
        <Labeled label="Default Currency">
          <input value={t.defaultCurrency} onChange={(e) => setT({ ...t, defaultCurrency: e.target.value })} className="input" />
        </Labeled>
        <Labeled label="Timezone">
          <input value={t.timezone} onChange={(e) => setT({ ...t, timezone: e.target.value })} className="input" />
        </Labeled>
        <Labeled label="City">
          <input value={t.city} onChange={(e) => setT({ ...t, city: e.target.value })} className="input" />
        </Labeled>
        <Labeled label="Country">
          <input value={t.country} onChange={(e) => setT({ ...t, country: e.target.value })} className="input" />
        </Labeled>
        <Labeled label="Address" className="sm:col-span-2 lg:col-span-2">
          <textarea value={t.address ?? ""} onChange={(e) => setT({ ...t, address: e.target.value })} className="input min-h-[60px]" />
        </Labeled>
      </div>

      <div className="mb-4 mt-6 flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold">Operational Settings</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Labeled label="Standard Check-in Time">
          <input value={t.standardCheckinTime} onChange={(e) => setT({ ...t, standardCheckinTime: e.target.value })} className="input" />
        </Labeled>
        <Labeled label="Standard Check-out Time">
          <input value={t.standardCheckoutTime} onChange={(e) => setT({ ...t, standardCheckoutTime: e.target.value })} className="input" />
        </Labeled>
        <Labeled label="Late Checkout Half Cutoff">
          <input value={t.lateCheckoutHalfCutoff} onChange={(e) => setT({ ...t, lateCheckoutHalfCutoff: e.target.value })} className="input" />
        </Labeled>
        <Labeled label="Folio Adj Agent Threshold (UGX)">
          <input type="number" value={t.folioAdjAgentThreshold} onChange={(e) => setT({ ...t, folioAdjAgentThreshold: Number(e.target.value) })} className="input" />
        </Labeled>
        <Labeled label="Folio Adj PM Threshold (UGX)">
          <input type="number" value={t.folioAdjPmThreshold} onChange={(e) => setT({ ...t, folioAdjPmThreshold: Number(e.target.value) })} className="input" />
        </Labeled>
        <Labeled label="Requisition Approval Threshold (UGX)">
          <input type="number" value={t.requisitionApprovalThreshold} onChange={(e) => setT({ ...t, requisitionApprovalThreshold: Number(e.target.value) })} className="input" />
        </Labeled>
        <Labeled label="Credit Grace Period (days)">
          <input type="number" value={t.creditGracePeriodDays} onChange={(e) => setT({ ...t, creditGracePeriodDays: Number(e.target.value) })} className="input" />
        </Labeled>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <div className="text-[11px] text-muted-foreground">
          Created: {t.createdAt} · Updated: {t.updatedAt}
        </div>
        <button onClick={save} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
          Save changes
        </button>
      </div>
      <style>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid hsl(var(--border) / 0.7); background: var(--background); padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; }`}</style>
    </div>
  );
}

function RoomTypesPanel() {
  const types = useStore((s) => s.roomTypes);
  const [edit, setEdit] = useState<RoomType | "new" | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setEdit("new")}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3 w-3" /> Add room type
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Name</th>
              <th className="px-4 py-2.5 text-right font-semibold">Base rate</th>
              <th className="px-4 py-2.5 text-right font-semibold">Capacity</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {types.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  UGX {t.baseRate.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">{t.maxOccupancy}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEdit(t)}
                    className="rounded-md border border-border px-2 py-1 text-[11px]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete room type?")) deleteRoomType(t.id);
                    }}
                    className="ml-1 rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <RoomTypeEditor initial={edit === "new" ? null : edit} onClose={() => setEdit(null)} />
      )}
    </div>
  );
}

function RoomTypeEditor({ initial, onClose }: { initial: RoomType | null; onClose: () => void }) {
  const [id, setId] = useState(initial?.id ?? "");
  const [typeName, setTypeName] = useState(initial?.name ?? "");
  const [rate, setRate] = useState<number | "">(initial?.baseRate ?? "");
  const [capacity, setCapacity] = useState<number | "">(initial?.maxOccupancy ?? 2);
  return (
    <Modal title={initial ? "Edit room type" : "New room type"} onClose={onClose}>
      <div className="space-y-3">
        <Labeled label="Code">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={!!initial}
            className="input"
          />
        </Labeled>
        <Labeled label="Name">
          <input value={typeName} onChange={(e) => setTypeName(e.target.value)} className="input" />
        </Labeled>
        <Labeled label="Base rate (UGX)">
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value === "" ? "" : Number(e.target.value))}
            className="input"
          />
        </Labeled>
        <Labeled label="Capacity">
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value === "" ? "" : Number(e.target.value))}
            className="input"
          />
        </Labeled>
      </div>
      <Footer
        onClose={onClose}
        disabled={!id || !typeName || !rate}
        onSave={() => {
          upsertRoomType({ id, name: typeName, baseRate: Number(rate), maxOccupancy: Number(capacity) });
          onClose();
        }}
      />
    </Modal>
  );
}

function RoomsPanel() {
  const rooms = useStore((s) => s.rooms);
  const types = useStore((s) => s.roomTypes);
  const [edit, setEdit] = useState<Room | "new" | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setEdit("new")}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3 w-3" /> Add room
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Room</th>
              <th className="px-4 py-2.5 text-left font-semibold">Floor</th>
              <th className="px-4 py-2.5 text-left font-semibold">Type</th>
              <th className="px-4 py-2.5 text-left font-semibold">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rooms.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{r.roomNumber}</td>
                <td className="px-4 py-3">{r.floor}</td>
                <td className="px-4 py-3">
                  {types.find((t) => t.id === r.roomTypeId)?.name ?? r.roomTypeId}
                </td>
                <td className="px-4 py-3 capitalize">{r.status}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEdit(r)}
                    className="rounded-md border border-border px-2 py-1 text-[11px]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this room?")) deleteRoom(r.id);
                    }}
                    className="ml-1 rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <RoomEditor
          initial={edit === "new" ? null : edit}
          types={types}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
}

function RoomEditor({
  initial,
  types,
  onClose,
}: {
  initial: Room | null;
  types: RoomType[];
  onClose: () => void;
}) {
  const [id, setId] = useState(initial?.id ?? "");
  const [floor, setFloor] = useState<number | "">(initial?.floor ?? 1);
  const [roomTypeId, setRoomTypeId] = useState(initial?.roomTypeId ?? types[0]?.id ?? "");
  const [status, setStatus] = useState<RoomStatus>(initial?.status ?? "available");
  const [roomNumber, setRoomNumber] = useState(initial?.roomNumber ?? initial?.id ?? "");
  const [legacyRef, setLegacyRef] = useState(initial?.legacyRef ?? "");
  return (
    <Modal title={initial ? "Edit room" : "New room"} onClose={onClose}>
      <div className="space-y-3">
        <Labeled label="Room number">
          <input
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            className="input"
          />
        </Labeled>
        <Labeled label="Floor">
          <input
            type="number"
            value={floor}
            onChange={(e) => setFloor(e.target.value === "" ? "" : Number(e.target.value))}
            className="input"
          />
        </Labeled>
        <Labeled label="Room type">
          <Select value={roomTypeId} onValueChange={setRoomTypeId}>
            <SelectTrigger className="input focus:ring-0 shadow-none">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Labeled>
        <Labeled label="Legacy ref">
          <input
            value={legacyRef}
            onChange={(e) => setLegacyRef(e.target.value)}
            className="input"
            placeholder="Optional"
          />
        </Labeled>
        <Labeled label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as RoomStatus)}>
            <SelectTrigger className="input capitalize focus:ring-0 shadow-none">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Labeled>
      </div>
      <Footer
        onClose={onClose}
        disabled={!roomNumber || !roomTypeId}
        onSave={() => {
          upsertRoom({
            id: roomNumber,
            propertyId: "T001",
            roomTypeId,
            roomNumber,
            floor: Number(floor),
            status,
            legacyRef: legacyRef || undefined,
          });
          onClose();
        }}
      />
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        <style>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid hsl(var(--border) / 0.7); background: var(--background); padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; }`}</style>
      </div>
    </div>
  );
}
function Footer({
  onClose,
  onSave,
  disabled,
}: {
  onClose: () => void;
  onSave: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button onClick={onClose} className="rounded-md border border-border px-3 py-2 text-xs">
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={disabled}
        className="rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}
function Labeled({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
