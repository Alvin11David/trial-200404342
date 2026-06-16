import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Plus, CalendarDays, Clock, CheckCircle2, XCircle, ArrowLeft, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/hr/leaves")({
  head: () => ({ meta: [{ title: "Leave Management — Jambo ERP" }] }),
  component: LeavesPage,
});

type LeaveType = "Annual" | "Sick" | "Maternity" | "Paternity" | "Study" | "Unpaid";
type LeaveStatus = "Pending" | "Approved" | "Rejected";

type LeaveRequest = {
  id: string;
  employee: string;
  department: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  status: LeaveStatus;
  reason: string;
  appliedOn: string;
  approvedBy?: string;
};

const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "LV-012", employee: "Grace Achieng", department: "Housekeeping", type: "Annual", from: "2026-06-20", to: "2026-06-27", days: 8, status: "Pending", reason: "Family vacation", appliedOn: "2026-06-10" },
  { id: "LV-011", employee: "Samuel Wasswa", department: "Kitchen", type: "Sick", from: "2026-06-15", to: "2026-06-16", days: 2, status: "Approved", reason: "Medical appointment", appliedOn: "2026-06-14", approvedBy: "David Ochieng" },
  { id: "LV-010", employee: "Helen Nanteza", department: "Front Office", type: "Annual", from: "2026-06-01", to: "2026-06-14", days: 14, status: "Approved", reason: "Travel abroad", appliedOn: "2026-05-15", approvedBy: "Amani Kato" },
  { id: "LV-009", employee: "John Mukasa", department: "F&B", type: "Sick", from: "2026-05-25", to: "2026-05-26", days: 2, status: "Approved", reason: "Food poisoning", appliedOn: "2026-05-25", approvedBy: "Sarah Nakato" },
  { id: "LV-008", employee: "Mary Nakibuuka", department: "Housekeeping", type: "Annual", from: "2026-05-10", to: "2026-05-17", days: 8, status: "Approved", reason: "Village visit", appliedOn: "2026-04-20", approvedBy: "Grace Achieng" },
  { id: "LV-007", employee: "Peter Ssempijja", department: "Maintenance", type: "Study", from: "2026-05-05", to: "2026-05-05", days: 1, status: "Rejected", reason: "Exam leave - insufficient documentation", appliedOn: "2026-04-28", approvedBy: "Sarah Nakato" },
  { id: "LV-006", employee: "Esther Nambi", department: "Front Office", type: "Annual", from: "2026-04-20", to: "2026-04-24", days: 5, status: "Approved", reason: "Sister's wedding", appliedOn: "2026-03-15", approvedBy: "Amani Kato" },
  { id: "LV-005", employee: "Robert Kizza", department: "Security", type: "Unpaid", from: "2026-04-10", to: "2026-04-10", days: 1, status: "Approved", reason: "Personal matter", appliedOn: "2026-04-05", approvedBy: "Sarah Nakato" },
  { id: "LV-004", employee: "David Ochieng", department: "Kitchen", type: "Annual", from: "2026-04-01", to: "2026-04-10", days: 10, status: "Approved", reason: "International trip", appliedOn: "2026-03-01", approvedBy: "Sarah Nakato" },
  { id: "LV-003", employee: "Mary Nakibuuka", department: "Housekeeping", type: "Sick", from: "2026-03-20", to: "2026-03-21", days: 2, status: "Approved", reason: "Malaria", appliedOn: "2026-03-20", approvedBy: "Grace Achieng" },
  { id: "LV-002", employee: "Amani Kato", department: "Front Office", type: "Annual", from: "2026-03-01", to: "2026-03-05", days: 5, status: "Approved", reason: "Family event", appliedOn: "2026-02-10", approvedBy: "Sarah Nakato" },
  { id: "LV-001", employee: "Samuel Wasswa", department: "Kitchen", type: "Study", from: "2026-02-15", to: "2026-02-15", days: 1, status: "Approved", reason: "Professional exam", appliedOn: "2026-02-01", approvedBy: "David Ochieng" },
];

const LEAVE_TYPES: LeaveType[] = ["Annual", "Sick", "Maternity", "Paternity", "Study", "Unpaid"];
const DEPARTMENTS = ["All", "Front Office", "Housekeeping", "Kitchen", "F&B", "Admin", "Maintenance", "Security"];

const statusStyles: Record<LeaveStatus, string> = {
  Pending: "border-warning/30 bg-warning/15 text-warning",
  Approved: "border-success/30 bg-success/15 text-success",
  Rejected: "border-destructive/30 bg-destructive/15 text-destructive",
};

const LEAVE_BALANCES = [
  { employee: "Amani Kato", annual: 12, sick: 8, usedAnnual: 5, usedSick: 0 },
  { employee: "Sarah Nakato", annual: 20, sick: 10, usedAnnual: 2, usedSick: 0 },
  { employee: "Grace Achieng", annual: 15, sick: 8, usedAnnual: 8, usedSick: 2 },
  { employee: "David Ochieng", annual: 15, sick: 8, usedAnnual: 10, usedSick: 0 },
  { employee: "John Mukasa", annual: 12, sick: 6, usedAnnual: 0, usedSick: 2 },
  { employee: "Peter Ssempijja", annual: 14, sick: 7, usedAnnual: 0, usedSick: 0 },
  { employee: "Mary Nakibuuka", annual: 12, sick: 6, usedAnnual: 8, usedSick: 2 },
  { employee: "Esther Nambi", annual: 10, sick: 5, usedAnnual: 5, usedSick: 0 },
  { employee: "Robert Kizza", annual: 12, sick: 6, usedAnnual: 1, usedSick: 0 },
  { employee: "Samuel Wasswa", annual: 12, sick: 6, usedAnnual: 0, usedSick: 2 },
  { employee: "Helen Nanteza", annual: 10, sick: 5, usedAnnual: 14, usedSick: 0 },
  { employee: "Tom Okello", annual: 10, sick: 5, usedAnnual: 0, usedSick: 0 },
];

function LeavesPage() {
  const [tab, setTab] = useState<"requests" | "balances">("requests");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<LeaveType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "All">("All");

  const filtered = useMemo(() => {
    if (tab === "balances") return LEAVE_BALANCES.filter((b) => !search || b.employee.toLowerCase().includes(search.toLowerCase()));
    return LEAVE_REQUESTS.filter((r) => {
      const matchSearch = !search || r.employee.toLowerCase().includes(search.toLowerCase()) || r.department.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "All" || r.type === typeFilter;
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [tab, search, typeFilter, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/hr" className="rounded-lg border border-border/60 bg-card p-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-display text-3xl font-bold tracking-tight">Leave Management</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Track leave requests, approvals, and employee balances.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
        {([["requests", "Leave Requests"], ["balances", "Leave Balances"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("rounded-md px-4 py-2 font-medium transition", tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{l}</button>
        ))}
      </div>

      {tab === "requests" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Search employee or department…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-primary/60 focus:bg-card/70" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/40 px-2.5 py-1.5 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" /> Type:
              </div>
              {["All", ...LEAVE_TYPES].map((t) => (
                <button key={t} onClick={() => setTypeFilter(t as LeaveType | "All")} className={cn("rounded-lg border px-2.5 py-1.5 text-xs font-medium transition", typeFilter === t ? "border-primary/60 bg-primary/15 text-primary" : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground")}>{t}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/40 px-2.5 py-1.5 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" /> Status:
              </div>
              {(["All", "Pending", "Approved", "Rejected"] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={cn("rounded-lg border px-2.5 py-1.5 text-xs font-medium transition", statusFilter === s ? "border-primary/60 bg-primary/15 text-primary" : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground")}>{s}</button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Employee</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">From</th><th className="px-5 py-3">To</th><th className="px-5 py-3" align="center">Days</th><th className="px-5 py-3">Reason</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Approved By</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-muted-foreground">No leave requests found.</td></tr>
                )}
                {(filtered as LeaveRequest[]).map((r) => (
                  <tr key={r.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium text-foreground">{r.employee}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.department}</td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-medium">{r.type}</span></td>
                    <td className="px-5 py-3 text-muted-foreground">{r.from}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.to}</td>
                    <td className="px-5 py-3 text-center font-semibold">{r.days}</td>
                    <td className="max-w-[200px] truncate px-5 py-3 text-muted-foreground">{r.reason}</td>
                    <td className="px-5 py-3"><span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium", statusStyles[r.status])}>{r.status}</span></td>
                    <td className="px-5 py-3 text-muted-foreground">{r.approvedBy ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "balances" && (
        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card">
          <div className="relative flex-1 max-w-md p-4 pb-0">
            <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search employee…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-primary/60 focus:bg-card/70" />
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Employee</th><th className="px-5 py-3 text-right">Annual Entitlement</th><th className="px-5 py-3 text-right">Annual Used</th><th className="px-5 py-3 text-right">Annual Remaining</th><th className="px-5 py-3 text-right">Sick Entitlement</th><th className="px-5 py-3 text-right">Sick Used</th><th className="px-5 py-3 text-right">Sick Remaining</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No employee balances found.</td></tr>
              )}
              {(filtered as typeof LEAVE_BALANCES).map((b) => (
                <tr key={b.employee} className="border-b border-border/20 last:border-0 hover:bg-muted/20">
                  <td className="px-5 py-3 font-medium text-foreground">{b.employee}</td>
                  <td className="px-5 py-3 text-right">{b.annual}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{b.usedAnnual}</td>
                  <td className="px-5 py-3 text-right"><span className={cn("font-semibold", b.annual - b.usedAnnual < 3 ? "text-destructive" : "text-success")}>{b.annual - b.usedAnnual}</span></td>
                  <td className="px-5 py-3 text-right">{b.sick}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{b.usedSick}</td>
                  <td className="px-5 py-3 text-right"><span className="font-semibold text-success">{b.sick - b.usedSick}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
