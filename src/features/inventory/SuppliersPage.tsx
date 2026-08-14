import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useStore,
  upsertSupplier,
  deleteSupplier,
  nextSupplierId,
  type Supplier,
} from "@/lib/pms-store";
import { Plus, Edit2, Trash2, X, Save, Search, Truck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAYMENT_TERMS = ["Net 15", "Net 30", "Net 45", "Net 60", "COD", "Upon delivery"];

const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60";

const emptyForm = { name: "", contactPerson: "", phone: "", email: "", address: "", taxId: "", paymentTerms: "Net 30", isActive: true };

export default function SuppliersPage() {
  const suppliers = useStore((s) => s.suppliers);
  const pos = useStore((s) => s.purchaseOrders);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const filtered = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson ?? "").toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q) ||
      (s.taxId ?? "").toLowerCase().includes(q)
    );
  });

  function openNew() {
    setEditId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(s: Supplier) {
    setEditId(s.id);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      address: s.address ?? "",
      taxId: s.taxId ?? "",
      paymentTerms: s.paymentTerms ?? "Net 30",
      isActive: s.isActive,
    });
    setShowForm(true);
  }

  function save() {
    if (!form.name.trim()) { toast.error("Supplier name is required"); return; }
    upsertSupplier({
      id: editId ?? nextSupplierId(),
      propertyId: "T001",
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      taxId: form.taxId.trim() || undefined,
      paymentTerms: form.paymentTerms || undefined,
      isActive: form.isActive,
    });
    toast.success(editId ? "Supplier updated" : "Supplier created");
    setShowForm(false);
  }

  function confirmDelete(s: Supplier) {
    const count = pos.filter((p) => p.supplierId === s.id).length;
    if (count > 0) {
      toast.error(`Cannot delete — ${count} purchase order(s) reference this supplier`);
      return;
    }
    if (window.confirm(`Delete supplier "${s.name}"?`)) {
      deleteSupplier(s.id);
      toast.success("Supplier deleted");
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Vendor master — contact info, tax & payment terms, linked to purchase orders</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(inputCls, "w-72 pl-9")}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">TIN</th>
              <th className="px-4 py-3">Terms</th>
              <th className="px-4 py-3 text-center">POs</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const poCount = pos.filter((p) => p.supplierId === s.id).length;
              return (
                <tr key={s.id} className={cn("border-t border-border/40", !s.isActive && "opacity-50")}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.contactPerson ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.taxId ?? "—"}</td>
                  <td className="px-4 py-3">{s.paymentTerms ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {poCount > 0 ? (
                      <Link
                        to="/inventory/purchase-orders"
                        className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                      >
                        <Truck size={11} /> {poCount}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{s.isActive ? "✓" : "✗"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(s)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => confirmDelete(s)} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground/70">No suppliers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editId ? "Edit Supplier" : "New Supplier"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Company Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={cn(inputCls, "w-full")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Contact Person</label>
                  <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className={cn(inputCls, "w-full")} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={cn(inputCls, "w-full")} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={cn(inputCls, "w-full")} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={cn(inputCls, "w-full")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">TIN</label>
                  <input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} className={cn(inputCls, "w-full")} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Payment Terms</label>
                  <select value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} className={cn(inputCls, "w-full")}>
                    {PAYMENT_TERMS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              </div>
              <button onClick={save} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm text-primary-foreground transition hover:bg-primary/90">
                <Save size={16} /> {editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
