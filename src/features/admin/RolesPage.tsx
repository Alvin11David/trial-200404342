import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  X,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  upsertRole,
  deleteRole,
  ROLE_PERMISSIONS_LIST,
  ROLE_PERMISSION_GROUPS,
  type RoleRecord,
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

const ROLE_ACCENT: Record<string, string> = {
  "Owner / GM": "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400",
  "Front Desk": "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-400",
  Housekeeping: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
  "POS / Cashier": "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
  Accountant: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/30 dark:text-slate-400",
  "System Administrator": "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400",
  "Night Auditor": "bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-900/30 dark:text-stone-400",
  Maintenance: "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400",
  "Sales & Marketing": "bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-900/30 dark:text-pink-400",
  "Human Resources": "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Inventory Manager": "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400",
  Laundry: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
};

const ROLE_DEFAULT_ACCENT = "bg-muted/40 text-muted-foreground border-border/40";

export default function RolesPage() {
  const navigate = useNavigate();
  const roles = useStore((s) => s.roles);
  const userRoles = useStore((s) => s.userRoles);
  const [query, setQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleRecord | null>(null);

  const filtered = useMemo(
    () =>
      roles
        .filter(
          (r) =>
            !query ||
            r.roleName.toLowerCase().includes(query.toLowerCase()) ||
            (r.description ?? "").toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) => a.roleName.localeCompare(b.roleName)),
    [roles, query],
  );

  const userCountForRole = (roleId: string) =>
    userRoles.filter((ur) => ur.roleId === roleId && !ur.revokedAt).length;

  const handleSave = (data: { roleName: string; roleCode: string; description: string; permissions: string[] }) => {
    const now = new Date().toISOString();
    if (editingRole) {
      upsertRole({ ...editingRole, ...data, updatedAt: now });
      toast.success(`Updated ${data.roleName}`);
    } else {
      const id = `R${Date.now().toString(36).toUpperCase()}`;
      upsertRole({ id, ...data, createdAt: now });
      toast.success(`Created ${data.roleName}`);
    }
    setShowDialog(false);
    setEditingRole(null);
  };

  const handleDelete = () => {
    if (!deletingRole) return;
    deleteRole(deletingRole.id);
    setDeletingRole(null);
    toast.success(`Deleted ${deletingRole.roleName}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Roles &amp; Permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {roles.length} role{roles.length !== 1 ? "s" : ""} defined
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/identity")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Shield className="h-4 w-4" /> Users
          </button>
          <button
            onClick={() => { setEditingRole(null); setShowDialog(true); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Create Role
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search roles…"
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldCheck className="mb-3 h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm font-medium text-muted-foreground">No roles found</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {query ? "No roles match your search." : "Create a role to get started."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((role) => (
              <div key={role.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/20">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary ring-1 ring-primary/20">
                  {role.roleName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{role.roleName}</span>
                    <span className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                      ROLE_ACCENT[role.roleName] ?? ROLE_DEFAULT_ACCENT,
                    )}>
                      {role.roleCode}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{role.description}</span>
                    <span>{(role.permissions ?? []).length} permission{(role.permissions ?? []).length !== 1 ? "s" : ""}</span>
                    <span>{userCountForRole(role.id)} user{userCountForRole(role.id) !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingRole(role); setShowDialog(true); }}
                    className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-primary/10 hover:text-primary"
                    title="Edit role"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingRole(role)}
                    className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Delete role"
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
        <RoleDialog
          role={editingRole}
          onSave={handleSave}
          onClose={() => { setShowDialog(false); setEditingRole(null); }}
        />
      )}

      <AlertDialog open={!!deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingRole?.roleName}</strong>?
              This will also remove the role from all assigned users.
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

function RoleDialog({
  role,
  onSave,
  onClose,
}: {
  role: RoleRecord | null;
  onSave: (data: { roleName: string; roleCode: string; description: string; permissions: string[]; customPermissions: { key: string; label: string }[] }) => void;
  onClose: () => void;
}) {
  const [roleName, setRoleName] = useState(role?.roleName ?? "");
  const [roleCode, setRoleCode] = useState(role?.roleCode ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? []);
  const [customPerms, setCustomPerms] = useState<{ key: string; label: string }[]>(role?.customPermissions ?? []);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const allPerms = useMemo(() => {
    const std = ROLE_PERMISSIONS_LIST.map((p) => ({ key: p.key, label: p.label, group: p.group }));
    const custom = customPerms.map((p) => ({ key: p.key, label: p.label, group: "Custom" }));
    return [...std, ...custom];
  }, [customPerms]);

  const groupedPermissions = useMemo(() => {
    const groups: { group: string; items: { key: string; label: string; group: string }[] }[] = [];
    const seen = new Set<string>();
    for (const perm of allPerms) {
      if (!seen.has(perm.group)) {
        seen.add(perm.group);
        groups.push({ group: perm.group, items: allPerms.filter((p) => p.group === perm.group) });
      }
    }
    return groups;
  }, [allPerms]);

  const togglePermission = (key: string) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const groupCount = (group: string) => {
    const total = allPerms.filter((p) => p.group === group).length;
    const checked = permissions.filter((k) => allPerms.some((p) => p.key === k && p.group === group)).length;
    return `${checked} / ${total}`;
  };

  const toggleGroup = (group: string, on: boolean) => {
    const groupKeys = allPerms.filter((p) => p.group === group).map((p) => p.key);
    setPermissions((prev) =>
      on
        ? [...new Set([...prev, ...groupKeys])]
        : prev.filter((p) => !groupKeys.includes(p)),
    );
  };

  const isGroupFullyChecked = (group: string) => {
    const groupKeys = allPerms.filter((p) => p.group === group).map((p) => p.key);
    return groupKeys.every((k) => permissions.includes(k));
  };

  const selectAll = () => setPermissions(allPerms.map((p) => p.key));
  const deselectAll = () => setPermissions([]);

  const addCustomPermission = () => {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, "_");
    const label = newLabel.trim();
    if (!key || !label) return;
    if (customPerms.some((p) => p.key === key)) return;
    if (ROLE_PERMISSIONS_LIST.some((p) => p.key === key)) return;
    setCustomPerms([...customPerms, { key, label }]);
    setPermissions([...permissions, key]);
    setNewKey("");
    setNewLabel("");
  };

  const removeCustomPermission = (key: string) => {
    setCustomPerms(customPerms.filter((p) => p.key !== key));
    setPermissions(permissions.filter((p) => p !== key));
  };

  const handleSubmit = () => {
    if (!roleName.trim() || !roleCode.trim()) return;
    onSave({
      roleName: roleName.trim(),
      roleCode: roleCode.trim().toUpperCase(),
      description: description.trim(),
      permissions,
      customPermissions: customPerms,
    });
  };

  const inputCls = "mt-1 w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15";
  const labelCls = "text-[11px] font-medium text-muted-foreground";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/20">
          <DialogTitle className="text-xl">{role ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            {role ? "Update role details and adjust permissions." : "Define a new role with custom permissions."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* Details */}
          <div className="rounded-xl border border-border/30 bg-card/50 p-4 space-y-3.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1 w-5 rounded-full bg-primary/50" />
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Details</h4>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={labelCls}>Role name</label>
                <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Night Auditor" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Role code</label>
                <input value={roleCode} onChange={(e) => setRoleCode(e.target.value)} placeholder="e.g. NIGHT_AUDITOR" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this role" className={inputCls} />
            </div>
          </div>

          {/* Permissions */}
          <div className="rounded-xl border border-border/30 bg-card/50 p-4 space-y-3.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="h-1 w-5 rounded-full bg-primary/50" />
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Permissions</h4>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors">Select all</button>
                <span className="text-[11px] text-muted-foreground/40">|</span>
                <button onClick={deselectAll} className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">Deselect all</button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/60 italic">
              {permissions.length} of {allPerms.length} permissions selected
            </p>
            <div className="space-y-3">
              {groupedPermissions.map(({ group, items }) => (
                <div key={group}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isGroupFullyChecked(group)}
                          onChange={(e) => toggleGroup(group, e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="h-4 w-7 rounded-full bg-muted-foreground/20 ring-1 ring-inset ring-border/40 transition-colors peer-checked:bg-primary/70 after:absolute after:top-0.5 after:left-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-3" />
                      </div>
                      <span className="text-[12px] font-semibold text-foreground/80">{group}</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground/50">{groupCount(group)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((perm) => (
                      <button
                        key={perm.key}
                        onClick={() => togglePermission(perm.key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all",
                          permissions.includes(perm.key)
                            ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                            : "border-border/50 text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
                        )}
                      >
                        {permissions.includes(perm.key) ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground/30" />
                        )}
                        {perm.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add custom permission */}
            <div className="border-t border-border/30 pt-3 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-5 rounded-full bg-primary/50" />
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Add Custom Permission</h4>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className={labelCls}>Permission key</label>
                  <input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="e.g. laundry.dry_clean"
                    className={inputCls}
                    onKeyDown={(e) => e.key === "Enter" && addCustomPermission()}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelCls}>Display label</label>
                  <input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Dry Clean"
                    className={inputCls}
                    onKeyDown={(e) => e.key === "Enter" && addCustomPermission()}
                  />
                </div>
                <button
                  onClick={addCustomPermission}
                  disabled={!newKey.trim() || !newLabel.trim()}
                  className="mb-0.5 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {customPerms.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {customPerms.map((p) => (
                    <span
                      key={p.key}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-400"
                    >
                      {p.label}
                      <button onClick={() => removeCustomPermission(p.key)} className="hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/20 bg-muted/10">
          <button onClick={onClose} className="rounded-xl border border-border/60 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">Cancel</button>
          <button onClick={handleSubmit} disabled={!roleName.trim() || !roleCode.trim()} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none">
            {role ? "Save Changes" : "Create Role"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
