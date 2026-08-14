import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Package,
  UserCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  upsertLostFoundItem,
  deleteLostFoundItem,
  lostFoundItemById,
  roomById,
  reservationById,
  nextLostFoundId,
  type LostFoundItem,
} from "@/lib/pms-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LOST_CATEGORIES = [
  "Electronics", "Clothing", "Jewellery", "Wallet/Purse", "Keys",
  "Documents", "Baggage", "Umbrella", "Other",
];

export default function LostFoundPage() {
  const items = useStore((s) => s.lostFoundItems);
  const reservations = useStore((s) => s.reservations);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "found" | "returned">("all");
  const [showNew, setShowNew] = useState(false);

  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = items;
    if (filter === "found") list = list.filter((i) => i.status === "found");
    if (filter === "returned") list = list.filter((i) => i.status === "returned");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.locationFound.toLowerCase().includes(q) ||
          (i.guestName ?? "").toLowerCase().includes(q) ||
          i.foundBy.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => new Date(b.foundDate).getTime() - new Date(a.foundDate).getTime());
  }, [items, filter, search]);

  const handleReturn = (item: LostFoundItem) => {
    upsertLostFoundItem({
      ...item,
      status: "returned",
      returnedAt: new Date().toISOString(),
      returnedTo: "Guest (signature on file)",
    });
    toast.success("Item marked as returned");
    setSelectedItem(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Lost & Found</h2>
          <p className="text-xs text-muted-foreground/60">{items.length} item{items.length !== 1 ? "s" : ""} logged</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Log Found Item
        </button>
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item, location, guest…"
            className="w-full rounded-xl border border-border bg-background px-9 py-2 text-xs placeholder:text-muted-foreground/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex rounded-xl border border-border/50 p-0.5">
          {(["all", "found", "returned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "All" : f === "found" ? "Found" : "Returned"}
            </button>
          ))}
        </div>
      </div>

      {/* New item form */}
      {showNew && <NewItemForm onClose={() => setShowNew(false)} />}

      {/* Detail modal */}
      {selectedItem && (() => {
        const item = lostFoundItemById(selectedItem);
        if (!item) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4" onClick={() => setSelectedItem(null)}>
            <div className="w-full max-w-lg rounded-2xl border border-border/50 bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-semibold">{item.description}</h4>
                <button onClick={() => setSelectedItem(null)} className="text-muted-foreground/40 hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <p>Category: {item.category}</p>
                <p>Found: {item.locationFound} on {new Date(item.foundDate).toLocaleDateString()}</p>
                <p>Found by: {item.foundBy}</p>
                {item.storageLocation && <p>Stored: {item.storageLocation}</p>}
                {item.guestName && <p>Claimed by: {item.guestName}</p>}
                {item.returnedAt && <p>Returned: {new Date(item.returnedAt).toLocaleString()} to {item.returnedTo}</p>}
                {item.notes && <p>Notes: {item.notes}</p>}
              </div>
              {item.status === "found" && (
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => handleReturn(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-success/90"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Mark Returned
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card py-16 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground/50">No items found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="divide-y divide-border/40">
            {filtered.map((item) => (
              <div key={item.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/10 cursor-pointer" onClick={() => setSelectedItem(item.id)}>
                <div className={cn(
                  "mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-xs",
                  item.status === "found" ? "bg-warning/10 text-warning" : "bg-success/10 text-success",
                )}>
                  {item.status === "found" ? <Package className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.description}</span>
                    <span className={cn(
                      "inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                      item.status === "found"
                        ? "border-warning/30 bg-warning/15 text-warning"
                        : "border-success/30 bg-success/15 text-success",
                    )}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/60">
                    <span>{item.locationFound}</span>
                    <span>{new Date(item.foundDate).toLocaleDateString()}</span>
                    <span>By: {item.foundBy}</span>
                    {item.guestName && <span>For: {item.guestName}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NewItemForm({ onClose }: { onClose: () => void }) {
  const reservations = useStore((s) => s.reservations);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [locationFound, setLocationFound] = useState("");
  const [foundDate, setFoundDate] = useState(new Date().toISOString().slice(0, 10));
  const [foundBy, setFoundBy] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [guestName, setGuestName] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !locationFound || !foundBy) {
      toast.error("Please fill in description, location, and found by");
      return;
    }
    upsertLostFoundItem({
      id: "",
      propertyId: "JAMBO-UG-001",
      description,
      category,
      locationFound,
      foundDate,
      foundBy,
      status: "found",
      storageLocation: storageLocation || undefined,
      guestName: guestName || undefined,
      reservationId: reservationId || undefined,
      notes: notes || undefined,
      createdAt: "",
      updatedAt: "",
    });
    toast.success("Item logged");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      <h4 className="text-xs font-semibold">Log Found Item</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Item description *"
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
          required
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="rounded-xl border border-border bg-background px-3 py-2 text-xs h-auto">
            <SelectValue placeholder="Category…" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {LOST_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          value={locationFound}
          onChange={(e) => setLocationFound(e.target.value)}
          placeholder="Location found *"
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
          required
        />
        <input
          type="date"
          value={foundDate}
          onChange={(e) => setFoundDate(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
        />
        <input
          value={foundBy}
          onChange={(e) => setFoundBy(e.target.value)}
          placeholder="Found by (staff name) *"
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
          required
        />
        <input
          value={storageLocation}
          onChange={(e) => setStorageLocation(e.target.value)}
          placeholder="Storage location (optional)"
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
        />
        <input
          value={guestName}
          onChange={(e) => {
            setGuestName(e.target.value);
            const found = reservations.find((r) => r.guestName.toLowerCase().includes(e.target.value.toLowerCase()));
            if (found) setReservationId(found.id);
          }}
          placeholder="Guest name (if known)"
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-[11px] font-medium text-muted-foreground hover:bg-muted">
          Cancel
        </button>
        <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
          Log Item
        </button>
      </div>
    </form>
  );
}
