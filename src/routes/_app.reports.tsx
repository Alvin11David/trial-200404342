import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — Jambo ERP" }] }),
  component: Reports,
});

function Reports() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Operational and financial intelligence.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { t: "Night Audit", d: "End-of-day reconciliation summary." },
          { t: "Occupancy Forecast", d: "30-day forward projection." },
          { t: "RevPAR Analysis", d: "Revenue per available room trends." },
          { t: "Channel Performance", d: "OTA vs direct comparison." },
          { t: "Guest Insights", d: "Demographics & repeat patterns." },
          { t: "Housekeeping Productivity", d: "Tasks per staff member." },
        ].map((r) => (
          <div key={r.t} className="glass card-hover rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold">{r.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.d}</p>
            <button className="mt-4 rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/25">
              Generate →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
