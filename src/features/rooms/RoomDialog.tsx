import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useStore, type Room, type RoomStatus, type Room as RoomType } from "@/lib/pms-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const BED_OPTIONS = ["single", "double", "twin", "king", "queen", "unknown"] as const;
const VIEW_OPTIONS = ["garden", "pool", "city", "lake", "mountain", "sea", "none", "other"] as const;
const HK_OPTIONS = ["clean", "dirty", "in_progress", "inspected", "out_of_order"] as const;
const STATUS_OPTIONS: { label: string; value: RoomStatus }[] = [
  { label: "Available", value: "available" },
  { label: "Occupied", value: "occupied" },
  { label: "Dirty", value: "dirty" },
  { label: "In Progress", value: "in_progress" },
  { label: "Clean", value: "clean" },
  { label: "Inspected", value: "inspected" },
  { label: "Maintenance", value: "maintenance" },
];

function emptyRoom(): Omit<Room, "id" | "createdAt" | "updatedAt"> {
  return {
    propertyId: "",
    roomTypeId: "",
    roomNumber: "",
    roomName: "",
    floor: 1,
    building: "",
    bedConfiguration: "unknown",
    maxOccupancy: 2,
    baseOccupancy: 2,
    viewType: "none",
    defaultRatePlanId: "",
    extraPersonCharge: 0,
    amenities: [],
    smokingAllowed: false,
    accessibilityFeatures: [],
    roomPhotos: [],
    status: "available",
    housekeepingStatus: "clean",
    isActive: true,
    blockStatus: false,
    notes: "",
    legacyRef: "",
  };
}

type RoomFormData = Omit<Room, "id" | "createdAt" | "updatedAt">;

interface RoomDialogProps {
  room?: Room | null;
  onSave: (data: RoomFormData) => void;
  onClose: () => void;
}

export default function RoomDialog({ room, onSave, onClose }: RoomDialogProps) {
  const currentProperty = useStore((s) => s.currentPropertyId ? s.properties.find((p) => p.id === s.currentPropertyId) ?? s.tenant : s.tenant);
  const roomTypes = useStore((s) => s.roomTypes);
  const ratePlans = useStore((s) => s.ratePlans);
  const [form, setForm] = useState<RoomFormData>(() => {
    if (room) {
      return {
        propertyId: room.propertyId,
        roomTypeId: room.roomTypeId,
        roomNumber: room.roomNumber,
        roomName: room.roomName ?? "",
        floor: room.floor,
        building: room.building ?? "",
        bedConfiguration: room.bedConfiguration ?? "unknown",
        maxOccupancy: room.maxOccupancy,
        baseOccupancy: room.baseOccupancy,
        viewType: room.viewType ?? "none",
        defaultRatePlanId: room.defaultRatePlanId ?? "",
        extraPersonCharge: room.extraPersonCharge ?? 0,
        amenities: room.amenities ?? [],
        smokingAllowed: room.smokingAllowed,
        accessibilityFeatures: room.accessibilityFeatures ?? [],
        roomPhotos: room.roomPhotos ?? [],
        status: room.status,
        housekeepingStatus: room.housekeepingStatus ?? "clean",
        isActive: room.isActive,
        blockStatus: room.blockStatus ?? false,
        notes: room.notes ?? "",
        legacyRef: room.legacyRef ?? "",
      };
    }
    return { ...emptyRoom(), propertyId: currentProperty.id };
  });

  useEffect(() => {
    if (!room) {
      setForm((f) => ({ ...f, propertyId: currentProperty.id }));
    }
  }, [currentProperty.id, room]);

  const set = (patch: Partial<RoomFormData>) => setForm((f) => ({ ...f, ...patch }));

  const toggleAmenity = (a: string) => {
    const current = form.amenities ?? [];
    set({
      amenities: current.includes(a)
        ? current.filter((x) => x !== a)
        : [...current, a],
    });
  };

  const handleSubmit = () => {
    if (!form.roomNumber.trim() || !form.roomTypeId) {
      toast.error("Room number and type are required");
      return;
    }
    onSave(form);
  };

  const propertyRatePlans = ratePlans.filter((rp) => rp.propertyId === form.propertyId);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{room ? "Edit Room" : "New Room"}</DialogTitle>
          <DialogDescription>
            {room ? "Update room configuration" : "Add a new room to the property"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Identity</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Room Number *</label>
                <input
                  value={form.roomNumber}
                  onChange={(e) => set({ roomNumber: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Room Name</label>
                <input
                  value={form.roomName ?? ""}
                  onChange={(e) => set({ roomName: e.target.value })}
                  placeholder="e.g. Presidential Suite"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Floor *</label>
                <input
                  type="number"
                  min={1}
                  value={form.floor}
                  onChange={(e) => set({ floor: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Building / Wing</label>
                <input
                  value={form.building ?? ""}
                  onChange={(e) => set({ building: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Classification</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Room Type *</label>
                <select
                  value={form.roomTypeId}
                  onChange={(e) => set({ roomTypeId: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                >
                  <option value="">Select type...</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Bed Configuration</label>
                <select
                  value={form.bedConfiguration ?? "unknown"}
                  onChange={(e) => set({ bedConfiguration: e.target.value as Room["bedConfiguration"] })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                >
                  {BED_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Max Occupancy</label>
                <input
                  type="number"
                  min={1}
                  value={form.maxOccupancy}
                  onChange={(e) => set({ maxOccupancy: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Base Occupancy</label>
                <input
                  type="number"
                  min={1}
                  value={form.baseOccupancy}
                  onChange={(e) => set({ baseOccupancy: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">View Type</label>
                <select
                  value={form.viewType ?? "none"}
                  onChange={(e) => set({ viewType: e.target.value as Room["viewType"] })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                >
                  {VIEW_OPTIONS.map((v) => (
                    <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pricing Link</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Default Rate Plan</label>
                <select
                  value={form.defaultRatePlanId ?? ""}
                  onChange={(e) => set({ defaultRatePlanId: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                >
                  <option value="">None</option>
                  {propertyRatePlans.map((rp) => (
                    <option key={rp.id} value={rp.id}>{rp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Extra Person Charge</label>
                <input
                  type="number"
                  min={0}
                  value={form.extraPersonCharge ?? 0}
                  onChange={(e) => set({ extraPersonCharge: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amenities</h3>
            <div className="grid grid-cols-2 gap-2">
              {["AC", "TV", "Wi-Fi", "Minibar", "Safe", "Balcony", "Hot Water", "Bathtub", "Shower", "Coffee Maker", "Desk", "Iron"].map((a) => (
                <label key={a} className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form.amenities ?? []).includes(a)}
                    onChange={() => toggleAmenity(a)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  {a}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
              <input
                type="checkbox"
                id="smoking"
                checked={form.smokingAllowed}
                onChange={(e) => set({ smokingAllowed: e.target.checked })}
                className="h-4 w-4 rounded accent-primary"
              />
              <label htmlFor="smoking" className="text-sm cursor-pointer">Smoking allowed</label>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Accessibility Features</label>
              <input
                value={form.accessibilityFeatures?.join(", ") ?? ""}
                onChange={(e) => set({ accessibilityFeatures: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Wheelchair accessible, grab bars, etc."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Room Photos (comma-separated URLs)</label>
              <input
                value={form.roomPhotos?.join(", ") ?? ""}
                onChange={(e) => set({ roomPhotos: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="https://..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status & Operations</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Room Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set({ status: e.target.value as RoomStatus })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Housekeeping Status</label>
                <select
                  value={form.housekeepingStatus ?? "clean"}
                  onChange={(e) => set({ housekeepingStatus: e.target.value as Room["housekeepingStatus"] })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                >
                  {HK_OPTIONS.map((h) => (
                    <option key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1).replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => set({ isActive: checked })}
              />
              <label className="text-sm cursor-pointer">Room active in inventory</label>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-4">
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
              Save Room
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
