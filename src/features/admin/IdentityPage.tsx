import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Shield,
  ShieldOff,
  Pencil,
  Trash2,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  upsertUser,
  toggleUserActive,
  deleteUser,
  assignUserRole,
  hashPassword,
  type User,
  type RoleRecord,
} from "@/lib/pms-store";
import { ROLE_META, ROLES, type Role } from "@/lib/role";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ROLE_ACCENT: Record<string, string> = {
  "Owner / GM": "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400",
  "Front Desk": "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-400",
  "Housekeeping": "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
  "POS / Cashier": "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
  "Accountant": "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/30 dark:text-slate-400",
  "System Administrator": "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400",
};

const DEPARTMENTS = [
  "Front Office", "Housekeeping", "F&B", "Finance", "Reservations",
  "Management", "IT", "Maintenance", "Security", "Sales & Marketing", "HR",
] as const;

const EMPLOYMENT_STATUSES = ["Full-time", "Part-time", "Contract", "Intern", "Probation"] as const;

export default function IdentityPage() {
  const navigate = useNavigate();
  const users = useStore((s) => s.users);
  const roles = useStore((s) => s.roles);
  const userRoles = useStore((s) => s.userRoles);
  const [query, setQuery] = useState("");
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [changingRole, setChangingRole] = useState<{ user: User; currentRole: string } | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const enriched = useMemo(
    () =>
      users
        .map((u) => {
          const activeUr = userRoles.find((ur) => ur.userId === u.id && !ur.revokedAt);
          const roleRecord = activeUr ? roles.find((r) => r.id === activeUr.roleId) : null;
          const roleName = roleRecord?.roleName ?? "—";
          const assignedByUser = activeUr?.assignedBy ? users.find((x) => x.id === activeUr.assignedBy) : null;
          return { ...u, roleName, roleRecord, assignedBy: assignedByUser?.fullName ?? activeUr?.assignedBy };
        })
        .filter(
          (u) =>
            !query ||
            u.fullName.toLowerCase().includes(query.toLowerCase()) ||
            u.email.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [users, userRoles, roles, query],
  );

  const handleSaveUser = (data: UserFormData) => {
    const now = new Date().toISOString();
    const fullName = `${data.firstName} ${data.lastName}`;
    const base = {
      fullName,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      phone: data.phone || undefined,
      nationalId: data.nationalId || undefined,
      passwordHash: data.password ? hashPassword(data.password) : editingUser?.passwordHash,
      passwordResetRequired: data.passwordResetRequired,
      department: data.department || undefined,
      employeeId: data.employeeId || undefined,
      dateOfJoining: data.dateOfJoining || undefined,
      employmentStatus: data.employmentStatus || undefined,
      employmentEndDate: data.employmentEndDate || undefined,
      updatedAt: now,
    };
    if (editingUser) {
      upsertUser({ ...editingUser, ...base });
      if (data.roleId) assignUserRole(editingUser.id, data.roleId);
      toast.success(`Updated ${fullName}`);
    } else {
      const newId = `U${Date.now().toString(36).toUpperCase()}`;
      upsertUser({ id: newId, ...base, isActive: true, createdAt: now });
      if (data.roleId) assignUserRole(newId, data.roleId);
      toast.success(`Added ${fullName}`);
    }
    setShowUserDialog(false);
    setEditingUser(null);
  };

  const handleToggleActive = (id: string) => {
    const user = users.find((u) => u.id === id);
    toggleUserActive(id);
    if (user) {
      toast.success(user.isActive ? `Deactivated ${user.fullName}` : `Activated ${user.fullName}`);
    }
  };

  const handleAssignRole = (userId: string, roleId: string) => {
    const roleName = roles.find((r) => r.id === roleId)?.roleName;
    assignUserRole(userId, roleId);
    setChangingRole(null);
    if (roleName) toast.success(`Role changed to ${roleName}`);
  };

  const handleDeleteUser = (user: User) => {
    deleteUser(user.id);
    setDeletingUser(null);
    toast.success(`Deleted ${user.fullName}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Identity &amp; Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users.length} user{users.length !== 1 ? "s" : ""} on record
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/identity/roles"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Shield className="h-4 w-4" /> Roles &amp; Permissions
          </Link>
          <button
            onClick={() => { setEditingUser(null); setShowUserDialog(true); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        {enriched.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="mb-3 h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm font-medium text-muted-foreground">No users found</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {query ? "No users match your search." : "Add a user to get started."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {enriched.map((user) => (
              <div key={user.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/20">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary ring-1 ring-primary/20">
                  {user.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{user.fullName}</span>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      user.isActive
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-muted-foreground/30 bg-muted/20 text-muted-foreground",
                    )}>
                      {user.isActive ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{user.email}</span>
                    {user.department && <span>{user.department}</span>}
                    {user.employeeId && <span>ID: {user.employeeId}</span>}
                    {user.lastLoginAt && (
                      <span>Last login: {new Date(user.lastLoginAt).toLocaleDateString()}</span>
                    )}
                    <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                    ROLE_ACCENT[user.roleName] ?? "bg-muted/40 text-muted-foreground border-border/40",
                  )}>
                    {user.roleName}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setChangingRole({ user, currentRole: user.roleName })}
                      className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-primary/10 hover:text-primary"
                      title="Change role"
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { setEditingUser(user); setShowUserDialog(true); }}
                      className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-primary/10 hover:text-primary"
                      title="Edit user"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      className={cn(
                        "rounded-lg p-1.5 transition-colors",
                        user.isActive
                          ? "text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive"
                          : "text-success/60 hover:bg-success/10 hover:text-success",
                      )}
                      title={user.isActive ? "Deactivate user" : "Activate user"}
                    >
                      {user.isActive ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => setDeletingUser(user)}
                      className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Delete user"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUserDialog && (
        <UserDialog
          user={editingUser}
          roles={roles}
          onSave={handleSaveUser}
          onClose={() => { setShowUserDialog(false); setEditingUser(null); }}
        />
      )}

      {changingRole && (
        <RoleDialog
          user={changingRole.user}
          currentRole={changingRole.currentRole}
          roles={roles}
          onAssign={handleAssignRole}
          onClose={() => setChangingRole(null)}
        />
      )}

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingUser?.fullName}</strong> ({deletingUser?.email})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingUser && handleDeleteUser(deletingUser)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type UserFormData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  nationalId: string;
  password: string;
  passwordResetRequired: boolean;
  department: string;
  employeeId: string;
  dateOfJoining: string;
  employmentStatus: string;
  employmentEndDate: string;
  roleId: string;
};

function UserDialog({
  user,
  roles,
  onSave,
  onClose,
}: {
  user: User | null;
  roles: RoleRecord[];
  onSave: (data: UserFormData) => void;
  onClose: () => void;
}) {
  const userRoles = useStore((s) => s.userRoles);

  const currentRoleId = useMemo(() => {
    if (!user) return "";
    const active = userRoles.find((ur) => ur.userId === user.id && !ur.revokedAt);
    return active?.roleId ?? "";
  }, [user, userRoles]);

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [nationalId, setNationalId] = useState(user?.nationalId ?? "");
  const [password, setPassword] = useState("");
  const [passwordResetRequired, setPasswordResetRequired] = useState(user?.passwordResetRequired ?? true);
  const [department, setDepartment] = useState(user?.department ?? "");
  const [employeeId, setEmployeeId] = useState(user?.employeeId ?? "");
  const [dateOfJoining, setDateOfJoining] = useState(user?.dateOfJoining ?? "");
  const [employmentStatus, setEmploymentStatus] = useState(user?.employmentStatus ?? "Full-time");
  const [employmentEndDate, setEmploymentEndDate] = useState(user?.employmentEndDate ?? "");
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId);

  const isFixedTerm = ["Part-time", "Contract", "Intern"].includes(employmentStatus);
  useEffect(() => {
    if (!isFixedTerm) setEmploymentEndDate("");
  }, [isFixedTerm]);

  useEffect(() => { setSelectedRoleId(currentRoleId); }, [currentRoleId]);

  const handleNameChange = (first: string, last: string) => {
    setFirstName(first);
    setLastName(last);
    if (!user) {
      const suggested = first && last
        ? `${first[0].toLowerCase()}${last.toLowerCase()}`.replace(/\s+/g, "")
        : "";
      setUsername(suggested);
    }
  };

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    if (!user && !username.trim()) return;
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      nationalId: nationalId.trim(),
      password,
      passwordResetRequired,
      department,
      employeeId: employeeId.trim(),
      dateOfJoining,
      employmentStatus,
      employmentEndDate,
      roleId: selectedRoleId,
    });
  };

  const inputCls = "mt-1 w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15";
  const labelCls = "text-[11px] font-medium text-muted-foreground";
  const sectionCls = "rounded-xl border border-border/30 bg-card/50 p-4 space-y-3.5";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/20">
          <DialogTitle className="text-xl">{user ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>
            {user ? "Update user details and account settings." : "Create a new user account with access permissions."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1 w-5 rounded-full bg-primary/50" />
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Identity</h4>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={labelCls}>First name</label>
                <input value={firstName} onChange={(e) => handleNameChange(e.target.value, lastName)} placeholder="Jane" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last name</label>
                <input value={lastName} onChange={(e) => handleNameChange(firstName, e.target.value)} placeholder="Doe" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={labelCls}>Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+256 700 000 000" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>National ID number</label>
              <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="CM12345678" className={inputCls} />
            </div>
          </div>

          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1 w-5 rounded-full bg-primary/50" />
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Account</h4>
            </div>
            <div>
              <label className={labelCls}>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="janedoe" className={inputCls} />
              {!user && (
                <p className="mt-1.5 text-[11px] text-muted-foreground/50 italic">Auto-suggested from name</p>
              )}
            </div>
            {!user && (
              <div>
                <label className={labelCls}>Temporary password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank for auto-generated" className={inputCls} />
              </div>
            )}
            <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
              <div className="relative">
                <input type="checkbox" checked={passwordResetRequired} onChange={(e) => setPasswordResetRequired(e.target.checked)} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-muted-foreground/20 ring-1 ring-inset ring-border/40 transition-colors peer-checked:bg-primary/80 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-4" />
              </div>
              <span className="text-[13px] text-muted-foreground">Password reset required on first login</span>
            </label>
          </div>

          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1 w-5 rounded-full bg-primary/50" />
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Role &amp; Access</h4>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={labelCls}>Role</label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Select role…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.roleName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelCls}>Department</label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Select department…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1 w-5 rounded-full bg-primary/50" />
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Employment</h4>
            </div>
            <div>
              <label className={labelCls}>Employee ID</label>
              <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="EMP010" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={labelCls}>Date of joining</label>
                <input type="date" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Employment status</label>
                <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Select status…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {EMPLOYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isFixedTerm && (
              <div>
                <label className={labelCls}>End date</label>
                <input type="date" value={employmentEndDate} onChange={(e) => setEmploymentEndDate(e.target.value)} className={inputCls} />
                <p className="mt-1 text-[11px] text-muted-foreground/50 italic">User will be deactivated automatically after this date</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/20 bg-muted/10">
          <button onClick={onClose} className="rounded-xl border border-border/60 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">Cancel</button>
          <button onClick={handleSubmit} disabled={!firstName.trim() || !lastName.trim() || !email.trim() || (!user && !username.trim())} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none">
            {user ? "Save Changes" : "Add User"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RoleDialog({
  user,
  currentRole,
  roles,
  onAssign,
  onClose,
}: {
  user: User;
  currentRole: string;
  roles: RoleRecord[];
  onAssign: (userId: string, roleId: string) => void;
  onClose: () => void;
}) {
  const [selectedRoleId, setSelectedRoleId] = useState(
    roles.find((r) => r.roleName === currentRole)?.id ?? "",
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Assign a new role to <strong>{user.fullName}</strong>. The previous role will be revoked.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/30 p-3 text-sm">
            <div className="font-medium">{user.fullName}</div>
            <div className="text-muted-foreground">{user.email}</div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Current role: <strong>{currentRole}</strong>
            </p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">New role</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            >
              <option value="">Select a role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roleName} — {r.description}
                </option>
              ))}
            </select>
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
            onClick={() => onAssign(user.id, selectedRoleId)}
            disabled={!selectedRoleId || selectedRoleId === roles.find((r) => r.roleName === currentRole)?.id}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Assign Role
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
