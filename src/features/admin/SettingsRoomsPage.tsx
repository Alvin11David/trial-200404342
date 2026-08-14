import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  BedDouble,
  Tag,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  CalendarRange,
  Layers,
  DoorOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  upsertRoomType,
  deleteRoomType,
  upsertRatePlan,
  deleteRatePlan,
  upsertCancellationPolicy,
  deleteCancellationPolicy,
  upsertSeasonalPricing,
  deleteSeasonalPricing,
  bulkUpdateRoomRates,
  createRoom,
  upsertRoom,
  deleteRoom,
  type RoomType,
  type RatePlan,
  type CancellationPolicy,
  type SeasonalPricing,
  type Room,
} from "@/lib/pms-store";
import RoomDialog from "@/features/rooms/RoomDialog";
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
import { Switch } from "@/components/ui/switch";

const fmtUGX = (n: number) => "UGX " + Math.round(n).toLocaleString();

type Tab = "rooms" | "room-types" | "rate-plans" | "bulk-pricing";

export default function SettingsRoomsPage() {
  const navigate = useNavigate();
  const roomTypes = useStore((s) => s.roomTypes);
  const ratePlans = useStore((s) => s.ratePlans);
  const rooms = useStore((s) => s.rooms);
  const cancellationPolicies = useStore((s) => s.cancellationPolicies);
  const [tab, setTab] = useState<Tab>("room-types");

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:border-primary/40"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Room & Property Configuration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Room types, rate plans, seasonal pricing, and bulk room rates
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {[
          { id: "rooms", label: "Rooms", icon: DoorOpen },
          { id: "room-types", label: "Room Types", icon: BedDouble },
          { id: "rate-plans", label: "Rate Plans & Seasonal", icon: Tag },
          { id: "bulk-pricing", label: "Bulk Room Pricing", icon: DollarSign },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
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

      {tab === "rooms" && (
        <RoomsTab rooms={rooms} roomTypes={roomTypes} ratePlans={ratePlans} />
      )}
      {tab === "room-types" && (
        <RoomTypesTab roomTypes={roomTypes} rooms={rooms} />
      )}
      {tab === "rate-plans" && (
        <RatePlansTab ratePlans={ratePlans} roomTypes={roomTypes} cancellationPolicies={cancellationPolicies} />
      )}
      {tab === "bulk-pricing" && (
        <BulkPricingTab rooms={rooms} roomTypes={roomTypes} ratePlans={ratePlans} />
      )}
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  available: "border-success/30 bg-success/10 text-success",
  occupied: "border-primary/30 bg-primary/10 text-primary",
  dirty: "border-warning/30 bg-warning/10 text-warning",
  maintenance: "border-destructive/30 bg-destructive/10 text-destructive",
  blocked: "border-muted-foreground/30 bg-muted/20 text-muted-foreground",
  clean: "border-success/30 bg-success/10 text-success",
  inspected: "border-info/30 bg-info/10 text-info",
  in_progress: "border-amber/30 bg-amber/10 text-amber",
};

function RoomsTab({ rooms, roomTypes, ratePlans }: { rooms: Room[]; roomTypes: RoomType[]; ratePlans: RatePlan[] }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);

  const roomsByType = useMemo(() => {
    const grouped: Record<string, Room[]> = {};
    rooms.forEach((r) => {
      if (!grouped[r.roomTypeId]) grouped[r.roomTypeId] = [];
      grouped[r.roomTypeId].push(r);
    });
    return grouped;
  }, [rooms]);

  const handleSave = (data: Omit<Room, "id" | "createdAt" | "updatedAt">) => {
    if (editingRoom) {
      upsertRoom({ ...editingRoom, ...data, updatedAt: new Date().toISOString() });
      toast.success(`Updated room ${data.roomNumber}`);
    } else {
      createRoom(data);
      toast.success(`Created room ${data.roomNumber}`);
    }
    setShowDialog(false);
    setEditingRoom(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteRoom(deleting.id);
    toast.success(`Deleted room ${deleting.roomNumber}`);
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rooms.length} rooms configured</p>
        <button
          onClick={() => { setEditingRoom(null); setShowDialog(true); }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Create Room
        </button>
      </div>

      {Object.entries(roomsByType).map(([roomTypeId, typeRooms]) => {
        const rt = roomTypes.find((t) => t.id === roomTypeId);
        return (
          <div key={roomTypeId} className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
              <BedDouble className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{rt?.name ?? roomTypeId}</span>
              <span className="text-xs text-muted-foreground">{typeRooms.length} rooms</span>
            </div>
            <div className="divide-y divide-border/40">
              {typeRooms.map((room) => {
                const plan = ratePlans.find((rp) => rp.id === room.defaultRatePlanId);
                const baseRate = rt?.baseRate ?? 0;
                const effectiveRate = room.extraPersonCharge ?? plan?.nightlyRate ?? baseRate;
                return (
                  <div key={room.id} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="text-sm font-medium">{room.roomNumber}</span>
                      {room.roomName && <span className="text-xs text-muted-foreground truncate">{room.roomName}</span>}
                      <span className="text-xs text-muted-foreground">Floor {room.floor}</span>
                      <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-semibold", STATUS_BADGE[room.status] ?? "border-border/60 bg-muted/30 text-muted-foreground")}>
                        {room.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-medium text-foreground">
                        {fmtUGX(effectiveRate)}/night
                      </span>
                      {plan && <span className="hidden sm:inline text-[10px]">{plan.name}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingRoom(room); setShowDialog(true); }}
                        className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-primary/10 hover:text-primary"
                        title="Edit room"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleting(room)}
                        className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Delete room"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {showDialog && (
        <RoomDialog
          room={editingRoom}
          onSave={handleSave}
          onClose={() => { setShowDialog(false); setEditingRoom(null); }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete room <strong>{deleting?.roomNumber}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoomTypesTab({ roomTypes, rooms }: { roomTypes: RoomType[]; rooms: Room[] }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [deleting, setDeleting] = useState<RoomType | null>(null);
  const [form, setForm] = useState<RoomType>({ id: "", name: "", description: "", maxOccupancy: 2, baseRate: 0 });

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Room type name is required");
      return;
    }
    const payload: RoomType = {
      ...form,
      id: form.id || `rt_${Date.now().toString(36)}`,
      createdAt: form.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    upsertRoomType(payload);
    toast.success(editing ? `Updated ${payload.name}` : `Added ${payload.name}`);
    setShowDialog(false);
    setEditing(null);
    setForm({ id: "", name: "", description: "", maxOccupancy: 2, baseRate: 0 });
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteRoomType(deleting.id);
    toast.success(`Deleted ${deleting.name}`);
    setDeleting(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ id: "", name: "", description: "", maxOccupancy: 2, baseRate: 0 });
    setShowDialog(true);
  };

  const openEdit = (rt: RoomType) => {
    setEditing(rt);
    setForm({ ...rt });
    setShowDialog(true);
  };

  const roomCountByType = useMemo(() => {
    const counts: Record<string, number> = {};
    rooms.forEach((r) => {
      if (r.roomTypeId) counts[r.roomTypeId] = (counts[r.roomTypeId] || 0) + 1;
    });
    return counts;
  }, [rooms]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{roomTypes.length} room types configured</p>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Room Type
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="divide-y divide-border/40">
          {roomTypes.map((rt) => (
            <div key={rt.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/20">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary ring-1 ring-primary/20">
                {rt.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{rt.name}</span>
                  <span className="text-xs text-muted-foreground">{roomCountByType[rt.id] || 0} rooms</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>Max occupancy: {rt.maxOccupancy}</span>
                  <span>Base rate: {fmtUGX(rt.baseRate)}</span>
                  {rt.description && <span className="truncate">{rt.description}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(rt)}
                  className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-primary/10 hover:text-primary"
                  title="Edit room type"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleting(rt)}
                  className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Delete room type"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDialog && (
        <RoomTypeDialog
          roomType={editing}
          onSave={handleSave}
          onClose={() => { setShowDialog(false); setEditing(null); setForm({ id: "", name: "", description: "", maxOccupancy: 2, baseRate: 0 }); }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete room type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleting?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoomTypeDialog({
  roomType,
  onSave,
  onClose,
}: {
  roomType: RoomType | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<RoomType>(
    roomType ?? { id: "", name: "", description: "", maxOccupancy: 2, baseRate: 0 },
  );

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Room type name is required");
      return;
    }
    onSave();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{roomType ? "Edit Room Type" : "New Room Type"}</DialogTitle>
          <DialogDescription>
            {roomType ? "Update room type configuration" : "Add a new room type"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Max Occupancy</label>
              <input
                type="number"
                min={1}
                value={form.maxOccupancy}
                onChange={(e) => setForm((f) => ({ ...f, maxOccupancy: parseInt(e.target.value) || 1 }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Base Rate (UGX)</label>
              <input
                type="number"
                min={0}
                value={form.baseRate}
                onChange={(e) => setForm((f) => ({ ...f, baseRate: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Save Room Type
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RatePlansTab({
  ratePlans,
  roomTypes,
  cancellationPolicies,
}: {
  ratePlans: RatePlan[];
  roomTypes: RoomType[];
  cancellationPolicies: CancellationPolicy[];
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<RatePlan | null>(null);
  const [deleting, setDeleting] = useState<RatePlan | null>(null);
  const [form, setForm] = useState<RatePlan>({
    id: "",
    propertyId: "T001",
    roomTypeId: roomTypes[0]?.id ?? "",
    name: "",
    nightlyRate: 0,
    vatTreatment: "inclusive",
    depositRequiredPct: 0,
    minLengthOfStay: 1,
    isActive: true,
    seasonalPricing: [],
  });

  const handleSubmit = () => {
    if (!form.name.trim() || !form.roomTypeId) {
      toast.error("Name and room type are required");
      return;
    }
    const payload: RatePlan = {
      ...form,
      id: form.id || `rp_${Date.now().toString(36)}`,
      createdAt: form.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    upsertRatePlan(payload);
    toast.success(editing ? `Updated ${payload.name}` : `Added ${payload.name}`);
    setShowDialog(false);
    setEditing(null);
    setForm({ id: "", propertyId: "T001", roomTypeId: roomTypes[0]?.id ?? "", name: "", nightlyRate: 0, vatTreatment: "inclusive", depositRequiredPct: 0, minLengthOfStay: 1, isActive: true, seasonalPricing: [] });
  };

  const onClose = () => {
    setShowDialog(false);
    setEditing(null);
    setForm({ id: "", propertyId: "T001", roomTypeId: roomTypes[0]?.id ?? "", name: "", nightlyRate: 0, vatTreatment: "inclusive", depositRequiredPct: 0, minLengthOfStay: 1, isActive: true, seasonalPricing: [] });
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteRatePlan(deleting.id);
    toast.success(`Deleted ${deleting.name}`);
    setDeleting(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ id: "", propertyId: "T001", roomTypeId: roomTypes[0]?.id ?? "", name: "", nightlyRate: 0, vatTreatment: "inclusive", depositRequiredPct: 0, minLengthOfStay: 1, isActive: true, seasonalPricing: [] });
    setShowDialog(true);
  };

  const openEdit = (rp: RatePlan) => {
    setEditing(rp);
    setForm({ ...rp, seasonalPricing: rp.seasonalPricing ?? [] });
    setShowDialog(true);
  };

  const [seasonalDialog, setSeasonalDialog] = useState<{ open: boolean; planId: string; editing: SeasonalPricing | null }>({ open: false, planId: "", editing: null });
  const [seasonalForm, setSeasonalForm] = useState<SeasonalPricing>({ id: "", ratePlanId: "", label: "", from: "", to: "", multiplier: 1, override: undefined });

  const openSeasonalDialog = (planId: string, seasonal?: SeasonalPricing) => {
    if (seasonal) {
      setSeasonalForm(seasonal);
    } else {
      setSeasonalForm({ id: `sp_${Date.now().toString(36)}`, ratePlanId: planId, label: "", from: "", to: "", multiplier: 1 });
    }
    setSeasonalDialog({ open: true, planId, editing: seasonal ?? null });
  };

  const handleSeasonalSave = () => {
    if (!seasonalForm.label.trim() || !seasonalForm.from || !seasonalForm.to) {
      toast.error("Label and dates are required");
      return;
    }
    upsertSeasonalPricing(seasonalDialog.planId, seasonalForm);
    toast.success(seasonalDialog.editing ? "Updated seasonal pricing" : "Added seasonal pricing");
    setSeasonalDialog({ open: false, planId: "", editing: null });
  };

  const handleSeasonalDelete = (planId: string, seasonalId: string) => {
    deleteSeasonalPricing(planId, seasonalId);
    toast.success("Deleted seasonal pricing");
  };

  const [policyDialog, setPolicyDialog] = useState<{ open: boolean; editing: CancellationPolicy | null }>({ open: false, editing: null });
  const [policyForm, setPolicyForm] = useState<CancellationPolicy>({ id: "", name: "", freeCancelHoursBefore: 24, partialRefundPct: 0, partialRefundHoursBefore: 0, noShowChargePct: 100 });

  const openPolicyDialog = (policy?: CancellationPolicy) => {
    if (policy) {
      setPolicyForm(policy);
    } else {
      setPolicyForm({ id: `cp_${Date.now().toString(36)}`, name: "", freeCancelHoursBefore: 24, partialRefundPct: 0, partialRefundHoursBefore: 0, noShowChargePct: 100 });
    }
    setPolicyDialog({ open: true, editing: policy ?? null });
  };

  const handlePolicySave = () => {
    if (!policyForm.name.trim()) {
      toast.error("Policy name is required");
      return;
    }
    upsertCancellationPolicy(policyForm);
    toast.success(policyDialog.editing ? `Updated ${policyForm.name}` : `Added ${policyForm.name}`);
    setPolicyDialog({ open: false, editing: null });
  };

  const handlePolicyDelete = (id: string) => {
    const policy = cancellationPolicies.find((cp) => cp.id === id);
    deleteCancellationPolicy(id);
    toast.success(`Deleted ${policy?.name ?? id}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Rate Plans</h2>
            <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" /> Add Plan
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="divide-y divide-border/40">
              {ratePlans.map((rp) => {
                const rt = roomTypes.find((rt) => rt.id === rp.roomTypeId);
                return (
                  <div key={rp.id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/20">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{rp.name}</span>
                        <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-semibold", rp.isActive ? "border-success/30 bg-success/10 text-success" : "border-muted-foreground/30 bg-muted/20 text-muted-foreground")}>
                          {rp.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {rt?.name ?? rp.roomTypeId} · {fmtUGX(rp.nightlyRate)} · Min {rp.minLengthOfStay} night(s)
                      </p>
                      {rp.seasonalPricing && rp.seasonalPricing.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {rp.seasonalPricing.map((s) => (
                            <span key={s.id} className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {s.label}: {s.multiplier}x
                              <button onClick={() => handleSeasonalDelete(rp.id, s.id)} className="hover:text-destructive">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openSeasonalDialog(rp.id)} className="rounded-lg p-1.5 text-muted-foreground/40 hover:bg-primary/10 hover:text-primary" title="Add seasonal pricing">
                        <CalendarRange className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => openEdit(rp)} className="rounded-lg p-1.5 text-muted-foreground/40 hover:bg-primary/10 hover:text-primary" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleting(rp)} className="rounded-lg p-1.5 text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Cancellation Policies</h2>
            <button onClick={() => openPolicyDialog()} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" /> Add Policy
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="divide-y divide-border/40">
              {cancellationPolicies.map((cp) => (
                <div key={cp.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold">{cp.name}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Free cancel: {cp.freeCancelHoursBefore}h · Partial: {cp.partialRefundPct}% · No-show: {cp.noShowChargePct}%
                    </p>
                  </div>
                  <button onClick={() => handlePolicyDelete(cp.id)} className="rounded-lg p-1.5 text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showDialog && (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Rate Plan" : "New Rate Plan"}</DialogTitle>
              <DialogDescription>{editing ? "Update rate plan" : "Create a new rate plan"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Name *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Room Type *</label>
                  <select value={form.roomTypeId} onChange={(e) => setForm((f) => ({ ...f, roomTypeId: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60">
                    {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Nightly Rate (UGX)</label>
                  <input type="number" min={0} value={form.nightlyRate} onChange={(e) => setForm((f) => ({ ...f, nightlyRate: parseInt(e.target.value) || 0 }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Min Length of Stay</label>
                  <input type="number" min={1} value={form.minLengthOfStay} onChange={(e) => setForm((f) => ({ ...f, minLengthOfStay: parseInt(e.target.value) || 1 }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Deposit Required %</label>
                  <input type="number" min={0} max={100} value={form.depositRequiredPct} onChange={(e) => setForm((f) => ({ ...f, depositRequiredPct: parseInt(e.target.value) || 0 }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">VAT Treatment</label>
                  <select value={form.vatTreatment} onChange={(e) => setForm((f) => ({ ...f, vatTreatment: e.target.value as RatePlan["vatTreatment"] }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60">
                    <option value="inclusive">Inclusive</option>
                    <option value="exclusive">Exclusive</option>
                    <option value="exempt">Exempt</option>
                    <option value="not_applicable">Not Applicable</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))} />
                <label className="text-sm cursor-pointer">Active rate plan</label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Save Rate Plan</button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={seasonalDialog.open} onOpenChange={(v) => !v && setSeasonalDialog({ open: false, planId: "", editing: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{seasonalDialog.editing ? "Edit Seasonal Pricing" : "Add Seasonal Pricing"}</DialogTitle>
            <DialogDescription>Override rates for specific date ranges</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Label *</label>
              <input value={seasonalForm.label} onChange={(e) => setSeasonalForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. Christmas Peak" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">From *</label>
                <input type="date" value={seasonalForm.from} onChange={(e) => setSeasonalForm((f) => ({ ...f, from: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">To *</label>
                <input type="date" value={seasonalForm.to} onChange={(e) => setSeasonalForm((f) => ({ ...f, to: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Multiplier</label>
                <input type="number" step="0.1" min={0} value={seasonalForm.multiplier} onChange={(e) => setSeasonalForm((f) => ({ ...f, multiplier: parseFloat(e.target.value) || 1 }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Override Rate (UGX, optional)</label>
                <input type="number" min={0} value={seasonalForm.override ?? ""} onChange={(e) => setSeasonalForm((f) => ({ ...f, override: e.target.value ? parseInt(e.target.value) : undefined }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setSeasonalDialog({ open: false, planId: "", editing: null })} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
            <button onClick={handleSeasonalSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Save</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={policyDialog.open} onOpenChange={(v) => !v && setPolicyDialog({ open: false, editing: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{policyDialog.editing ? "Edit Policy" : "New Cancellation Policy"}</DialogTitle>
            <DialogDescription>Configure cancellation terms</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input value={policyForm.name} onChange={(e) => setPolicyForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Free Cancel Hours Before</label>
                <input type="number" min={0} value={policyForm.freeCancelHoursBefore} onChange={(e) => setPolicyForm((f) => ({ ...f, freeCancelHoursBefore: parseInt(e.target.value) || 0 }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Partial Refund %</label>
                <input type="number" min={0} max={100} value={policyForm.partialRefundPct} onChange={(e) => setPolicyForm((f) => ({ ...f, partialRefundPct: parseInt(e.target.value) || 0 }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Partial Refund Hours Before</label>
                <input type="number" min={0} value={policyForm.partialRefundHoursBefore} onChange={(e) => setPolicyForm((f) => ({ ...f, partialRefundHoursBefore: parseInt(e.target.value) || 0 }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">No-Show Charge %</label>
                <input type="number" min={0} max={100} value={policyForm.noShowChargePct} onChange={(e) => setPolicyForm((f) => ({ ...f, noShowChargePct: parseInt(e.target.value) || 0 }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setPolicyDialog({ open: false, editing: null })} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
            <button onClick={handlePolicySave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Save Policy</button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rate plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleting?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BulkPricingTab({
  rooms,
  roomTypes,
  ratePlans,
}: {
  rooms: Room[];
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
}) {
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [ratePlanId, setRatePlanId] = useState(ratePlans[0]?.id ?? "");
  const [overrideRate, setOverrideRate] = useState<string>("");

  const activeRatePlans = ratePlans.filter((rp) => rp.isActive);
  const selectedRatePlan = activeRatePlans.find((rp) => rp.id === ratePlanId);

  const toggleRoom = (roomId: string) => {
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRooms.size === rooms.length) {
      setSelectedRooms(new Set());
    } else {
      setSelectedRooms(new Set(rooms.map((r) => r.id)));
    }
  };

  const handleApply = () => {
    if (selectedRooms.size === 0) {
      toast.error("Select at least one room");
      return;
    }
    if (!ratePlanId) {
      toast.error("Select a rate plan");
      return;
    }
    const rate = overrideRate ? parseInt(overrideRate) : undefined;
    bulkUpdateRoomRates(Array.from(selectedRooms), ratePlanId, rate);
    toast.success(`Updated ${selectedRooms.size} rooms to ${selectedRatePlan?.name ?? "selected plan"}${rate ? ` @ ${fmtUGX(rate)}` : ""}`);
    setSelectedRooms(new Set());
    setOverrideRate("");
  };

  const roomsByType = useMemo(() => {
    const grouped: Record<string, Room[]> = {};
    rooms.forEach((r) => {
      if (!grouped[r.roomTypeId]) grouped[r.roomTypeId] = [];
      grouped[r.roomTypeId].push(r);
    });
    return grouped;
  }, [rooms]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium">Rate Plan</label>
            <select value={ratePlanId} onChange={(e) => setRatePlanId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60">
              {activeRatePlans.map((rp) => <option key={rp.id} value={rp.id}>{rp.name} ({fmtUGX(rp.nightlyRate)})</option>)}
            </select>
          </div>
          <div className="w-48">
            <label className="mb-1 block text-sm font-medium">Override Rate (UGX)</label>
            <input type="number" min={0} value={overrideRate} onChange={(e) => setOverrideRate(e.target.value)} placeholder={selectedRatePlan ? fmtUGX(selectedRatePlan.nightlyRate) : ""} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <button onClick={handleApply} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
            <Layers className="h-4 w-4" /> Apply to {selectedRooms.size} room{selectedRooms.size !== 1 ? "s" : ""}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Select rooms below and apply the chosen rate plan. Leave override blank to use the plan&apos;s default nightly rate.
        </p>
      </div>

      {Object.entries(roomsByType).map(([roomTypeId, typeRooms]) => {
        const rt = roomTypes.find((rt) => rt.id === roomTypeId);
        return (
          <div key={roomTypeId} className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={typeRooms.every((r) => selectedRooms.has(r.id))}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded accent-primary"
                />
                <span className="text-sm font-semibold">{rt?.name ?? roomTypeId}</span>
                <span className="text-xs text-muted-foreground">{typeRooms.length} rooms</span>
              </div>
            </div>
            <div className="divide-y divide-border/40">
              {typeRooms.map((room) => (
                <label key={room.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20">
                  <input
                    type="checkbox"
                    checked={selectedRooms.has(room.id)}
                    onChange={() => toggleRoom(room.id)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-sm font-medium">{room.roomNumber}</span>
                  {room.roomName && <span className="text-xs text-muted-foreground">{room.roomName}</span>}
                  <span className="text-xs text-muted-foreground">Floor {room.floor}</span>
                  {room.defaultRatePlanId && (
                    <span className="ml-auto rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {ratePlans.find((rp) => rp.id === room.defaultRatePlanId)?.name ?? room.defaultRatePlanId}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
