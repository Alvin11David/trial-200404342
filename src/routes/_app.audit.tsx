import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter, Download, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_app/audit")({
  head: () => ({ meta: [{ title: "Audit Trail — Jambo PMS" }] }),
  component: AuditPage,
});

type Severity = "info" | "warn" | "critical";
type Event = {
  id: string;
  ts: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  severity: Severity;
  ip: string;
};

const EVENTS: Event[] = [
  { id: "EVT-2901", ts: "2026-06-13 09:42", actor: "Amani Kato", role: "Front Desk", action: "Checked in guest", entity: "Reservation RES-1024", severity: "info", ip: "10.0.0.21" },
  { id: "EVT-2900", ts: "2026-06-13 09:31", actor: "Esther Nambi", role: "Reservations", action: "Created reservation", entity: "RES-1029 / Room 204", severity: "info", ip: "10.0.0.18" },
  { id: "EVT-2899", ts: "2026-06-13 09:18", actor: "Peter Ssempijja", role: "Accountant", action: "Voided folio line", entity: "Folio F-3320 line #3", severity: "warn", ip: "10.0.0.42" },
  { id: "EVT-2898", ts: "2026-06-13 08:55", actor: "Robert Kizza", role: "Administrator", action: "Updated role permissions", entity: "Role: Front Desk", severity: "critical", ip: "10.0.0.2" },
  { id: "EVT-2897", ts: "2026-06-13 08:40", actor: "Grace Achieng", role: "Housekeeping", action: "Marked room clean", entity: "Room 311", severity: "info", ip: "10.0.0.55" },
  { id: "EVT-2896", ts: "2026-06-13 08:21", actor: "John Mukasa", role: "POS", action: "Settled order", entity: "Order #4421 / UGX 86,000", severity: "info", ip: "10.0.0.71" },
  { id: "EVT-2895", ts: "2026-06-13 07:58", actor: "Amani Kato", role: "Front Desk", action: "Adjusted folio", entity: "Folio F-3318 / +UGX 25,000", severity: "warn", ip: "10.0.0.21" },
  { id: "EVT-2894", ts: "2026-06-13 07:31", actor: "system", role: "System", action: "Night audit completed", entity: "Day close 2026-06-12", severity: "info", ip: "127.0.0.1" },
  { id: "EVT-2893", ts: "2026-06-12 23:42", actor: "Unknown", role: "—", action: "Failed login attempt", entity: "admin@jambo.com", severity: "critical", ip: "41.210.55.11" },
  { id: "EVT-2892", ts: "2026-06-12 22:11", actor: "Peter Ssempijja", role: "Accountant", action: "Posted payment", entity: "Payment PMT-882 / UGX 600,000", severity: "info", ip: "10.0.0.42" },
];

const sevStyles: Record<Severity, string> = {
  info: "bg-info/10 text-info border-info/20",
  warn: "bg-warning/10 text-warning border-warning/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

function AuditPage() {
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<Severity | "all">("all");

  const filtered = useMemo(() => {
    return EVENTS.filter((e) => {
      const matchQ = !q ||
        [e.actor, e.action, e.entity, e.id, e.role, e.ip].some((s) =>
          s.toLowerCase().includes(q.toLowerCase()),
        );
      const matchS = sev === "all" || e.severity === sev;
      return matchQ && matchS;
    });
  }, [q, sev]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Audit Trail</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Immutable log of staff and system actions across the property.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary/40">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </header>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { l: "Events (24h)", v: "318" },
          { l: "Critical", v: "2", tone: "text-destructive" },
          { l: "Warnings", v: "11", tone: "text-warning" },
          { l: "Actors", v: "14" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
            <p className={"mt-1 font-display text-2xl font-bold " + (s.tone ?? "")}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search actor, action, entity, IP…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
          {(["all","info","warn","critical"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSev(s)}
              className={"rounded-md px-3 py-1.5 capitalize " + (sev === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {s === "warn" ? "Warning" : s}
            </button>
          ))}
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Date range
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Event ID</th>
              <th className="px-4 py-2.5 text-left font-semibold">When</th>
              <th className="px-4 py-2.5 text-left font-semibold">Actor</th>
              <th className="px-4 py-2.5 text-left font-semibold">Action</th>
              <th className="px-4 py-2.5 text-left font-semibold">Entity</th>
              <th className="px-4 py-2.5 text-left font-semibold">Severity</th>
              <th className="px-4 py-2.5 text-left font-semibold">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.id}</td>
                <td className="px-4 py-3 text-xs">{e.ts}</td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium">{e.actor}</div>
                  <div className="text-[11px] text-muted-foreground">{e.role}</div>
                </td>
                <td className="px-4 py-3 text-sm">{e.action}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{e.entity}</td>
                <td className="px-4 py-3">
                  <span className={"inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase " + sevStyles[e.severity]}>
                    <ShieldCheck className="h-3 w-3" /> {e.severity}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{e.ip}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No matching events.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
