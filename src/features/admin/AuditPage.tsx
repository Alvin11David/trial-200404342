import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowLeft,
  FileSearch,
  AlertCircle,
  Info,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, type AuditEntry, type AuditSeverity } from "@/lib/pms-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEVERITY_CONFIG: Record<AuditSeverity, { label: string; color: string; icon: typeof Info }> = {
  info: { label: "Info", color: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800", icon: Info },
  warn: { label: "Warning", color: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800", icon: AlertTriangle },
  critical: { label: "Critical", color: "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/30 dark:border-rose-800", icon: AlertCircle },
};

const MODULE_OPTIONS = [
  "all",
  "auth",
  "reservations",
  "rooms",
  "folios",
  "billing",
  "housekeeping",
  "admin",
  "settings",
  "reports",
  "pos",
  "hr",
  "inventory",
];

export default function AuditPage() {
  const navigate = useNavigate();
  const audits = useStore((s) => s.audit);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | "all">("all");
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const filtered = useMemo(() => {
    let list = [...audits].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    if (moduleFilter !== "all") {
      list = list.filter((a) => a.module === moduleFilter);
    }
    if (severityFilter !== "all") {
      list = list.filter((a) => a.severity === severityFilter);
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.actor.toLowerCase().includes(q) ||
          a.action.toLowerCase().includes(q) ||
          a.entity.toLowerCase().includes(q) ||
          a.module.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [audits, query, moduleFilter, severityFilter]);

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { info: 0, warn: 0, critical: 0 };
    audits.forEach((a) => {
      if (counts[a.severity] !== undefined) counts[a.severity]++;
    });
    return counts;
  }, [audits]);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:border-primary/40"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Audit Trail</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {audits.length} total events · {severityCounts.critical} critical · {severityCounts.warn} warnings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(["info", "warn", "critical"] as AuditSeverity[]).map((sev) => {
          const cfg = SEVERITY_CONFIG[sev];
          const Icon = cfg.icon;
          return (
            <div
              key={sev}
              onClick={() => setSeverityFilter(severityFilter === sev ? "all" : sev)}
              className={cn(
                "cursor-pointer rounded-xl border p-3 transition-all",
                severityFilter === sev
                  ? cfg.color + " ring-2 ring-offset-1"
                  : "border-border/50 bg-card hover:border-border",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">{cfg.label}</span>
              </div>
              <p className="mt-1 font-display text-2xl font-bold">{severityCounts[sev]}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by actor, action, entity, ID…"
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            {MODULE_OPTIONS.map((m) => (
              <SelectItem key={m} value={m}>
                {m === "all" ? "All modules" : m.charAt(0).toUpperCase() + m.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileSearch className="mb-3 h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm font-medium text-muted-foreground">No audit events found</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {query || moduleFilter !== "all" || severityFilter !== "all"
                ? "No results match your filters."
                : "Audit events will appear here as actions are performed."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((entry) => {
              const sevCfg = SEVERITY_CONFIG[entry.severity];
              const SevIcon = sevCfg.icon;
              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="flex w-full items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/20"
                >
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg border", sevCfg.color)}>
                    <SevIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{entry.action}</span>
                      <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {entry.module}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {entry.actor} ({entry.role})
                      </span>
                      <span>Entity: {entry.entity}</span>
                      {entry.recordId && <span>ID: {entry.recordId}</span>}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/60">{formatTime(entry.ts)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedEntry} onOpenChange={(v) => !v && setSelectedEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Event Detail</DialogTitle>
            <DialogDescription>Full details for {selectedEntry?.id}</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Event ID</p>
                  <p className="text-sm font-mono font-medium">{selectedEntry.id}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Timestamp</p>
                  <p className="text-sm font-medium">{formatTime(selectedEntry.ts)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Actor</p>
                  <p className="text-sm font-medium">{selectedEntry.actor}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Role</p>
                  <p className="text-sm font-medium">{selectedEntry.role}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Module</p>
                  <p className="text-sm font-medium">{selectedEntry.module}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Severity</p>
                  <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold", SEVERITY_CONFIG[selectedEntry.severity].color)}>
                    {SEVERITY_CONFIG[selectedEntry.severity].label}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Action</p>
                  <p className="text-sm font-medium">{selectedEntry.action}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Entity</p>
                  <p className="text-sm font-medium">{selectedEntry.entity}</p>
                </div>
                {selectedEntry.recordId && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Record ID</p>
                    <p className="text-sm font-mono">{selectedEntry.recordId}</p>
                  </div>
                )}
                {selectedEntry.ipAddress && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">IP Address</p>
                    <p className="text-sm font-mono">{selectedEntry.ipAddress}</p>
                  </div>
                )}
                {selectedEntry.auditSetting && (
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Setting</p>
                    <p className="text-sm font-medium">{selectedEntry.auditSetting}</p>
                  </div>
                )}
                {(selectedEntry.oldValue || selectedEntry.newValue) && (
                  <div className="col-span-2 grid grid-cols-2 gap-3">
                    {selectedEntry.oldValue && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Old Value</p>
                        <p className="text-sm font-mono text-destructive">{selectedEntry.oldValue}</p>
                      </div>
                    )}
                    {selectedEntry.newValue && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">New Value</p>
                        <p className="text-sm font-mono text-success">{selectedEntry.newValue}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
