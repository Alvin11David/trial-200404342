import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  upsertProperty,
  deleteProperty,
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
} from "@/components/ui/alert-dialog";

const PROPERTY_TYPES = [
  "hotel", "lodge", "guesthouse", "resort", "apartment", "serviced_suites",
] as const;

const COUNTRIES = ["Uganda", "Kenya", "Rwanda", "Tanzania", "Burundi", "South Sudan", "DR Congo"] as const;

const TIMEZONES = [
  "Africa/Kampala",
  "Africa/Nairobi",
  "Africa/Kigali",
  "Africa/Dar_es_Salaam",
  "Africa/Bujumbura",
  "Africa/Juba",
  "Africa/Lubumbashi",
] as const;

export default function PropertiesPage() {
  const navigate = useNavigate();
  const properties = useStore((s) => s.properties);
  const [query, setQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState<Property | null>(null);

  const filtered = useMemo(
    () =>
      properties
        .filter(
          (p) =>
            !query ||
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.propertyCode.toLowerCase().includes(query.toLowerCase()) ||
            p.city.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [properties, query],
  );

  const handleSave = (payload: Property) => {
    const now = new Date().toISOString();
    const data: Property = {
      ...payload,
      updatedAt: now,
      createdAt: payload.createdAt || now,
      phoneNumbers: payload.phone ? [payload.phone] : payload.phoneNumbers,
    };
    if (!data.propertyCode.trim() || !data.name.trim()) {
      toast.error("Property code and name are required");
      return;
    }
    upsertProperty(data);
    toast.success(editing ? `Updated ${data.name}` : `Added ${data.name}`);
    setShowDialog(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteProperty(deleting.id);
    toast.success(`Deleted ${deleting.name}`);
    setDeleting(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:border-primary/40"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Properties</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {properties.length} propert{properties.length === 1 ? "y" : "ies"} configured
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowDialog(true); }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Property
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, code or city…"
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="mb-3 h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm font-medium text-muted-foreground">No properties found</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {query ? "No results match your search." : "Add a property to get started."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((prop) => (
              <div key={prop.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/20">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary ring-1 ring-primary/20">
                  {prop.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{prop.name}</span>
                    <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {prop.propertyCode}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        prop.isActive
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-muted-foreground/30 bg-muted/20 text-muted-foreground",
                      )}
                    >
                      {prop.isActive ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                      {prop.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{prop.city}, {prop.country}</span>
                    <span>{prop.propertyType}</span>
                    {prop.starRating && <span>{"★".repeat(prop.starRating)}</span>}
                    <span>{prop.totalRoomCount ?? 0} rooms</span>
                    <span>Created: {new Date(prop.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditing(prop); setShowDialog(true); }}
                    className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-primary/10 hover:text-primary"
                    title="Edit property"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleting(prop)}
                    className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Delete property"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDialog && (
        <PropertyDialog
          property={editing}
          onSave={handleSave}
          onClose={() => { setShowDialog(false); setEditing(null); }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleting?.name}</strong> ({deleting?.propertyCode})?
              This action cannot be undone.
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

function PropertyDialog({
  property,
  onSave,
  onClose,
}: {
  property: Property | null;
  onSave: (data: Property) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Property>(() =>
    property
      ? { ...property }
      : {
          id: "",
          propertyCode: "",
          name: "",
          propertyType: "hotel",
          description: "",
          address: "",
          streetAddress: "",
          district: "",
          gpsCoordinates: "",
          city: "",
          country: "Uganda",
          phone: "",
          phoneNumbers: [],
          email: "",
          website: "",
          businessName: "",
          businessRegistrationNumber: "",
          tradingLicenseNumber: "",
          standardCheckinTime: "14:00:00",
          standardCheckoutTime: "11:00:00",
          defaultCurrency: "UGX",
          timezone: "Africa/Kampala",
          lateCheckoutHalfCutoff: "15:00:00",
          numberOfFloors: 1,
          totalRoomCount: 0,
          folioAdjAgentThreshold: 10_000,
          folioAdjPmThreshold: 50_000,
          requisitionApprovalThreshold: 500_000,
          creditGracePeriodDays: 14,
          auditTime: "23:00",
          tin: "",
          efrisDeviceNo: "",
          vatRate: 0.18,
          isActive: true,
          createdAt: "",
          updatedAt: "",
        },
  );

  const set = (patch: Partial<Property>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = () => {
    if (!form.propertyCode.trim() || !form.name.trim()) {
      toast.error("Property code and name are required");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? "Edit Property" : "New Property"}</DialogTitle>
          <DialogDescription>
            {property ? "Update property configuration" : "Add a new property to the system"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identity</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
              <label className="mb-1 block text-sm font-medium">Property Code *</label>
              <input
                value={form.propertyCode}
                onChange={(e) => set({ propertyCode: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
              <label className="mb-1 block text-sm font-medium">Property Name *</label>
              <input
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <select
                  value={form.propertyType ?? "hotel"}
                  onChange={(e) => set({ propertyType: e.target.value as Property["propertyType"] })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Star Rating</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.starRating ?? 0}
                  onChange={(e) => set({ starRating: parseInt(e.target.value) || undefined })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => set({ description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Street Address</label>
                <input
                  value={form.streetAddress ?? form.address ?? ""}
                  onChange={(e) => set({ streetAddress: e.target.value, address: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">City/Town</label>
                <input
                  value={form.city ?? ""}
                  onChange={(e) => set({ city: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">District</label>
                <input
                  value={form.district ?? ""}
                  onChange={(e) => set({ district: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">GPS Coordinates</label>
                <input
                  value={form.gpsCoordinates ?? ""}
                  onChange={(e) => set({ gpsCoordinates: e.target.value })}
                  placeholder="0.3476,32.5825"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Country</label>
                <select
                  value={form.country ?? "Uganda"}
                  onChange={(e) => set({ country: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input
                  value={form.phone ?? ""}
                  onChange={(e) => set({ phone: e.target.value, phoneNumbers: [e.target.value] })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  value={form.email ?? ""}
                  onChange={(e) => set({ email: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Website</label>
                <input
                  value={form.website ?? ""}
                  onChange={(e) => set({ website: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal & Tax</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Business/Trading Name</label>
                <input
                  value={form.businessName ?? ""}
                  onChange={(e) => set({ businessName: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">TIN</label>
                <input
                  value={form.tin ?? ""}
                  onChange={(e) => set({ tin: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">EFRIS Device No.</label>
                <input
                  value={form.efrisDeviceNo ?? ""}
                  onChange={(e) => set({ efrisDeviceNo: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Business Registration No.</label>
                <input
                  value={form.businessRegistrationNumber ?? ""}
                  onChange={(e) => set({ businessRegistrationNumber: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Trading License No.</label>
                <input
                  value={form.tradingLicenseNumber ?? ""}
                  onChange={(e) => set({ tradingLicenseNumber: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operational Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Check-in Time</label>
                <input
                  type="time"
                  value={form.standardCheckinTime ?? "14:00:00"}
                  onChange={(e) => set({ standardCheckinTime: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Check-out Time</label>
                <input
                  type="time"
                  value={form.standardCheckoutTime ?? "11:00:00"}
                  onChange={(e) => set({ standardCheckoutTime: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Currency</label>
                <input
                  value={form.defaultCurrency ?? "UGX"}
                  onChange={(e) => set({ defaultCurrency: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Timezone</label>
                <select
                  value={form.timezone ?? "Africa/Kampala"}
                  onChange={(e) => set({ timezone: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz.replace("Africa/", "")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Audit Time</label>
                <input
                  type="time"
                  value={form.auditTime ?? "23:00"}
                  onChange={(e) => set({ auditTime: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Number of Floors</label>
                <input
                  type="number"
                  min={1}
                  value={form.numberOfFloors ?? 1}
                  onChange={(e) => set({ numberOfFloors: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Total Room Count</label>
                <input
                  type="number"
                  min={0}
                  value={form.totalRoomCount ?? 0}
                  onChange={(e) => set({ totalRoomCount: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </div>
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
              Save Property
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
