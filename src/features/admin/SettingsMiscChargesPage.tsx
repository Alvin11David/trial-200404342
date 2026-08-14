import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useStore,
  addMiscChargeItem,
  updateMiscChargeItem,
  removeMiscChargeItem,
} from "@/lib/pms-store";
import { Plus, Trash2, Package, Pencil, X } from "lucide-react";

const DEPARTMENT_OPTIONS = [
  { value: "", label: "None" },
  { value: "POOL", label: "Pool" },
  { value: "KPOOL", label: "Kids Pool" },
  { value: "REC", label: "Recreation" },
  { value: "BIZ", label: "Business Center" },
  { value: "CONF", label: "Conference" },
  { value: "HC", label: "Health Club" },
  { value: "SPA", label: "Spa" },
  { value: "REST", label: "Restaurant" },
  { value: "BAR", label: "Bar" },
  { value: "MISC", label: "General / Misc" },
];

const DEPT_LABEL: Record<string, string> = {
  POOL: "Pool", KPOOL: "Kids Pool", REC: "Recreation",
  BIZ: "Business Center", CONF: "Conference",
  HC: "Health Club", SPA: "Spa", REST: "Restaurant", BAR: "Bar", MISC: "General / Misc",
};

export default function SettingsMiscChargesPage() {
  const items = useStore((s) => s.miscChargeItems);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultPrice, setDefaultPrice] = useState<number | "">("");
  const [departmentCode, setDepartmentCode] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setDefaultPrice("");
    setDepartmentCode("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!name.trim() || !defaultPrice || defaultPrice <= 0) return;
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      defaultPrice: Number(defaultPrice),
      departmentCode: departmentCode || undefined,
      isActive: true,
    };
    if (editingId) {
      updateMiscChargeItem(editingId, payload);
      toast.success("Updated service item");
    } else {
      addMiscChargeItem(payload);
      toast.success("Added service item");
    }
    resetForm();
  };

  const handleEdit = (id: string) => {
    const item = items.find((m) => m.id === id);
    if (!item) return;
    setName(item.name);
    setDescription(item.description ?? "");
    setDefaultPrice(item.defaultPrice);
    setDepartmentCode(item.departmentCode ?? "");
    setEditingId(id);
    setShowForm(true);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            Service Price List
          </h1>
          <p className="text-xs text-muted-foreground/60">
            Configure standard rates for all hotel services. Staff use this list to quote consistent prices.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add Service
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Service name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pool Access (Adult)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                autoFocus
              />
            </div>
            <div className="w-36">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Price (UGX)</label>
              <input
                type="number"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Department</label>
              <select
                value={departmentCode}
                onChange={(e) => setDepartmentCode(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
              >
                {DEPARTMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !defaultPrice || defaultPrice <= 0}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {editingId ? "Update" : "Add"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for staff reference"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="px-5 py-14 text-center text-xs text-muted-foreground/50">
            <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
            No services configured.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.departmentCode && (
                      <span className="inline-flex rounded bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[9px] font-semibold">
                        {DEPT_LABEL[item.departmentCode] ?? item.departmentCode}
                      </span>
                    )}
                    <span className={cn(
                      "inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                      item.isActive
                        ? "bg-success/15 text-success border-success/30"
                        : "bg-muted/40 text-muted-foreground border-border/40",
                    )}>
                      {item.isActive ? "active" : "inactive"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground/60">
                    {item.id} · {item.defaultPrice.toLocaleString()} UGX
                    {item.description && <span> · {item.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateMiscChargeItem(item.id, { isActive: !item.isActive })}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                      item.isActive
                        ? "border-border text-muted-foreground hover:bg-muted"
                        : "border-success/30 text-success hover:bg-success/10",
                    )}
                  >
                    {item.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleEdit(item.id)}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { removeMiscChargeItem(item.id); toast.success("Removed service item"); }}
                    className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
