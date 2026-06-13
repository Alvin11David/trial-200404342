import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, ShieldCheck, KeyRound, Check, X } from "lucide-react";
import { ROLES, type Role } from "@/lib/role";

export const Route = createFileRoute("/_app/identity")({
  head: () => ({ meta: [{ title: "Identity & Access — Jambo PMS" }] }),
  component: IdentityPage,
});

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "Active" | "Disabled" | "Invited";
  lastLogin: string;
};

const USERS: User[] = [
  { id: "U001", name: "Sarah Nakato", email: "sarah@jambo.ug", role: "Owner / GM", status: "Active", lastLogin: "10 min ago" },
  { id: "U002", name: "Amani Kato", email: "amani@jambo.ug", role: "Front Desk", status: "Active", lastLogin: "Just now" },
  { id: "U003", name: "Grace Achieng", email: "grace@jambo.ug", role: "Housekeeping", status: "Active", lastLogin: "2h ago" },
  { id: "U004", name: "John Mukasa", email: "john@jambo.ug", role: "POS / Cashier", status: "Active", lastLogin: "30 min ago" },
  { id: "U005", name: "Esther Nambi", email: "esther@jambo.ug", role: "Reservations / Revenue", status: "Active", lastLogin: "1h ago" },
  { id: "U006", name: "Peter Ssempijja", email: "peter@jambo.ug", role: "Accountant", status: "Active", lastLogin: "Yesterday" },
  { id: "U007", name: "Robert Kizza", email: "robert@jambo.ug", role: "System Administrator", status: "Active", lastLogin: "5 min ago" },
  { id: "U008", name: "Mary Nakibuuka", email: "mary@jambo.ug", role: "Housekeeping", status: "Invited", lastLogin: "—" },
  { id: "U009", name: "Faith Akello", email: "faith@jambo.ug", role: "Front Desk", status: "Disabled", lastLogin: "1 month ago" },
];

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
  "Owner / GM": ["Reservations","Front Desk","Housekeeping","Billing & Folio","Payments","Reports","Audit Trail","Settings"],
  "Front Desk": ["Reservations","Front Desk","Billing & Folio","Payments"],
  Housekeeping: ["Housekeeping"],
  "POS / Cashier": ["POS","Billing & Folio","Payments"],
  "Reservations / Revenue": ["Reservations","Front Desk","Reports"],
  Accountant: ["Billing & Folio","Payments","Reports"],
  "System Administrator": ["Identity & Access","Audit Trail","Settings"],
};

const statusStyles: Record<User["status"], string> = {
  Active: "bg-success/10 text-success border-success/20",
  Disabled: "bg-muted text-muted-foreground border-border",
  Invited: "bg-warning/10 text-warning border-warning/20",
};

function IdentityPage() {
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("Owner / GM");

  const filtered = USERS.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Identity & Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage users, roles and permissions across the property.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> Invite user
        </button>
      </header>

      <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
        {(["users","roles"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={"rounded-md px-4 py-1.5 font-semibold capitalize " + (tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
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
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
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
                          {u.name.split(" ").map((s) => s[0]).join("").slice(0,2)}
                        </span>
                        <div>
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{u.role}</td>
                    <td className="px-4 py-3">
                      <span className={"inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold " + statusStyles[u.status]}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.lastLogin}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="rounded-md border border-border px-2 py-1 text-[11px] hover:border-primary/40">Edit</button>
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
                className={"flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition " + (selectedRole === r ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/60")}
              >
                <span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> {r}</span>
                <span className="text-[10px] text-muted-foreground">{ROLE_PERMS[r].length}</span>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">{selectedRole}</h3>
                <p className="text-xs text-muted-foreground">
                  Permissions granted to this role. Changes are recorded in the audit log.
                </p>
              </div>
              <KeyRound className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((p) => {
                const granted = ROLE_PERMS[selectedRole].includes(p);
                return (
                  <div key={p} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
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
    </div>
  );
}
