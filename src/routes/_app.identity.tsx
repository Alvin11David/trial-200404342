import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, ShieldCheck, KeyRound, Check, X, Power } from "lucide-react";
import { ROLES, type Role } from "@/lib/role";
import { toggleUserActive, upsertUser, useStore, type UserRecord } from "@/lib/pms-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/identity")({
  head: () => ({ meta: [{ title: "Identity & Access — Jambo PMS" }] }),
  component: IdentityPage,
});

const PERMISSIONS = [
  "Reservations",
  "Front Desk",
  "Housekeeping",
  "Billing & Folio",
  "Payments",
  "POS",
  "Reports",
  "Audit Trail",
  "Identity & Access",
  "Settings",
];

const ROLE_PERMS: Record<Role, string[]> = {
  "Owner / GM": [
    "Reservations",
    "Front Desk",
    "Housekeeping",
    "Billing & Folio",
    "Payments",
    "Reports",
    "Audit Trail",
    "Settings",
  ],
  "Front Desk": ["Reservations", "Front Desk", "Billing & Folio", "Payments"],
  Housekeeping: ["Housekeeping"],
  "POS / Cashier": ["POS", "Billing & Folio", "Payments"],
  "Reservations / Revenue": ["Reservations", "Front Desk", "Reports"],
  Accountant: ["Billing & Folio", "Payments", "Reports"],
  "System Administrator": ["Identity & Access", "Audit Trail", "Settings"],
};

function IdentityPage() {
  const users = useStore((s) => s.users);
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("Owner / GM");
  const [edit, setEdit] = useState<UserRecord | "new" | null>(null);

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Identity &amp; Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage users, roles and permissions.</p>
        </div>
        <button
          onClick={() => setEdit("new")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Invite user
        </button>
      </header>

      <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
        {(["users", "roles"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "rounded-md px-4 py-1.5 font-semibold capitalize " +
              (tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">User</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Role</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Last login</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                          {u.name
                            .split(" ")
                            .map((s) => s[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <div>
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{u.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold " +
                          (u.active
                            ? "border-success/20 bg-success/10 text-success"
                            : "border-border bg-muted text-muted-foreground")
                        }
                      >
                        {u.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.lastLogin ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => toggleUserActive(u.id)}
                          title={u.active ? "Disable" : "Activate"}
                          className="rounded-md border border-border p-1.5 hover:border-primary/40"
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEdit(u)}
                          className="rounded-md border border-border px-2 py-1 text-[11px] hover:border-primary/40"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "roles" && (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="rounded-xl border border-border bg-card p-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition " +
                  (selectedRole === r
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted/60")
                }
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> {r}
                </span>
                <span className="text-[10px] text-muted-foreground">{ROLE_PERMS[r].length}</span>
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">{selectedRole}</h3>
                <p className="text-xs text-muted-foreground">Permissions granted to this role.</p>
              </div>
              <KeyRound className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((p) => {
                const granted = ROLE_PERMS[selectedRole].includes(p);
                return (
                  <div
                    key={p}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
                  >
                    <span className="text-sm">{p}</span>
                    {granted ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                        <Check className="h-3 w-3" /> Granted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        <X className="h-3 w-3" /> Denied
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {edit !== null && (
        <UserEditor initial={edit === "new" ? null : edit} onClose={() => setEdit(null)} />
      )}
    </div>
  );
}

function UserEditor({ initial, onClose }: { initial: UserRecord | null; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState<string>(initial?.role ?? "Front Desk");
  const [active, setActive] = useState(initial?.active ?? true);

  const submit = () => {
    if (!name || !email) return;
    const id = initial?.id ?? "U" + Math.floor(100 + Math.random() * 900);
    upsertUser({ id, name, email, role, active, lastLogin: initial?.lastLogin ?? "—" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-display text-lg font-bold">
            {initial ? "Edit user" : "Invite user"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <Labeled label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </Labeled>
          <Labeled label="Email">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </Labeled>
          <Labeled label="Role">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Labeled>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />{" "}
            Active
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-border px-3 py-2 text-xs">
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {initial ? "Save changes" : "Send invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
