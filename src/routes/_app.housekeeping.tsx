import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/housekeeping")({
  head: () => ({ meta: [{ title: "Housekeeping — Jambo ERP" }] }),
  component: HousekeepingPage,
});

const cols = [
  {
    title: "Queued",
    icon: Clock,
    accent: "warning",
    items: [
      { room: "204", type: "Turnover", assignee: "Joan", priority: "High" },
      { room: "308", type: "Deep clean", assignee: "—", priority: "Medium" },
      { room: "412", type: "Restock", assignee: "—", priority: "Low" },
    ],
  },
  {
    title: "In Progress",
    icon: Sparkles,
    accent: "primary",
    items: [
      { room: "502", type: "Suite refresh", assignee: "Mukasa", priority: "High" },
      { room: "117", type: "Turnover", assignee: "Grace", priority: "Medium" },
    ],
  },
  {
    title: "Completed",
    icon: CheckCircle2,
    accent: "success",
    items: [
      { room: "203", type: "Turnover", assignee: "Joan", priority: "—" },
      { room: "305", type: "Deep clean", assignee: "Mukasa", priority: "—" },
      { room: "410", type: "Turnover", assignee: "Grace", priority: "—" },
      { room: "501", type: "Suite refresh", assignee: "Joan", priority: "—" },
    ],
  },
];

const priColor: Record<string, string> = {
  High: "bg-destructive/15 text-destructive border-destructive/30",
  Medium: "bg-warning/15 text-warning border-warning/30",
  Low: "bg-info/15 text-info border-info/30",
  "—": "bg-muted/40 text-muted-foreground border-border/40",
};

function HousekeepingPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Housekeeping</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live task board for the housekeeping team.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {cols.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="glass rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className={cn("grid h-9 w-9 place-items-center rounded-xl",
                  c.accent === "warning" && "bg-warning/15 text-warning",
                  c.accent === "primary" && "bg-primary/15 text-primary",
                  c.accent === "success" && "bg-success/15 text-success",
                )}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display font-semibold">{c.title}</h3>
                  <p className="text-xs text-muted-foreground">{c.items.length} tasks</p>
                </div>
              </div>
              <ul className="space-y-3">
                {c.items.map((it, i) => (
                  <li key={i} className="rounded-xl border border-border/50 bg-card/30 p-4 transition hover:border-primary/40">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Room {it.room}</div>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", priColor[it.priority])}>{it.priority}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{it.type}</div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Assignee</span>
                      <span className="font-medium">{it.assignee}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
