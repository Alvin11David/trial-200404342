import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Download, ShieldCheck } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { useStore, type AuditSeverity } from "@/lib/pms-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/audit")({
  head: () => ({ meta: [{ title: "Audit Trail — Jambo PMS" }] }),
  component: AuditPage,
});

const sevStyles: Record<AuditSeverity, string> = {
  info: "bg-info/10 text-info border-info/20",
  warn: "bg-warning/10 text-warning border-warning/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const MODULES = [
  "all",
  "reservations",
  "billing",
  "rooms",
  "housekeeping",
  "identity",
  "settings",
  "auth",
  "system",
];

function AuditPage() {
  const audit = useStore((s) => s.audit);
  const users = useStore((s) => s.users);

  const [q, setQ] = useState("");
  const [sev, setSev] = useState<AuditSeverity | "all">("all");
  const [mod, setMod] = useState<string>("all");
  const [actor, setActor] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return audit.filter((e) => {
      if (sev !== "all" && e.severity !== sev) return false;
      if (mod !== "all" && e.module !== mod) return false;
      if (actor !== "all" && e.actor !== actor) return false;
      const day = e.ts.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (
        q &&
        ![e.actor, e.action, e.entity, e.id, e.role, e.module].some((s) =>
          s.toLowerCase().includes(q.toLowerCase()),
        )
      )
        return false;
      return true;
    });
  }, [audit, q, sev, mod, actor, from, to]);

  const actors = Array.from(new Set(audit.map((a) => a.actor))).sort();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Audit Trail</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Immutable log of staff and system actions.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-primary/40">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { l: "Total events", v: audit.length.toString(), bar: "var(--color-primary)" },
          {
            l: "Critical",
            v: audit.filter((a) => a.severity === "critical").length.toString(),
            tone: "text-destructive",
            bar: "var(--color-destructive)",
          },
          {
            l: "Warnings",
            v: audit.filter((a) => a.severity === "warn").length.toString(),
            tone: "text-warning",
            bar: "var(--color-warning)",
          },
          { l: "Actors", v: actors.length.toString(), bar: "var(--color-info)" },
        ].map((s) => (
          <div
            key={s.l}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-4"
          >
            <div
              className="absolute left-0 top-0 h-full w-[3px]"
              style={{ background: s.bar, boxShadow: `0 0 10px ${s.bar}` }}
            />
            <div className="pl-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
              <p className={"mt-1 font-display text-2xl font-bold " + (s.tone ?? "")}>{s.v}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search action, actor, entity…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
          />
        </div>
        <Select value={actor} onValueChange={setActor}>
          <SelectTrigger className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {actors.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={mod} onValueChange={setMod}>
          <SelectTrigger className="rounded-lg border border-border bg-background px-3 py-2 text-sm capitalize outline-none focus:border-primary/60 focus:ring-0 shadow-none">
            <SelectValue placeholder="All modules" />
          </SelectTrigger>
          <SelectContent>
            {MODULES.map((m) => (
              <SelectItem key={m} value={m}>
                {m === "all" ? "All modules" : m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
          {(["all", "info", "warn", "critical"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSev(s)}
              className={
                "rounded-md px-3 py-1.5 capitalize " +
                (sev === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {s === "warn" ? "Warning" : s}
            </button>
          ))}
        </div>
        <DatePicker value={from} onChange={setFrom} />
        <DatePicker value={to} onChange={setTo} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Event</th>
              <th className="px-4 py-2.5 text-left font-semibold">When</th>
              <th className="px-4 py-2.5 text-left font-semibold">Actor</th>
              <th className="px-4 py-2.5 text-left font-semibold">Module</th>
              <th className="px-4 py-2.5 text-left font-semibold">Action</th>
              <th className="px-4 py-2.5 text-left font-semibold">Entity</th>
              <th className="px-4 py-2.5 text-left font-semibold">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.id}</td>
                <td className="px-4 py-3 text-xs">{e.ts.replace("T", " ").slice(0, 16)}</td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium">{e.actor}</div>
                  <div className="text-[11px] text-muted-foreground">{e.role}</div>
                </td>
                <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{e.module}</td>
                <td className="px-4 py-3 text-sm">{e.action}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{e.entity}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase " +
                      sevStyles[e.severity]
                    }
                  >
                    <ShieldCheck className="h-3 w-3" /> {e.severity}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No matching events.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* keep users imported value referenced */}
      <span hidden>{users.length}</span>
    </div>
  );
}
