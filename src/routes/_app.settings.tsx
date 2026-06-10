import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Jambo ERP" }] }),
  component: Settings,
});

function Settings() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Property &amp; workspace preferences.</p>
      </div>

      {[
        { t: "Property Profile", d: "Name, address, contact details, time zone." },
        { t: "Room Types & Rates", d: "Configure inventory and rate plans." },
        { t: "Team & Roles", d: "Invite staff and manage permissions." },
        { t: "Integrations", d: "Booking.com, Expedia, payments, accounting." },
        { t: "Notifications", d: "Email, SMS and in-app alerts." },
      ].map((s) => (
        <div key={s.t} className="glass card-hover flex items-center justify-between rounded-2xl p-5">
          <div>
            <h3 className="font-display font-semibold">{s.t}</h3>
            <p className="text-sm text-muted-foreground">{s.d}</p>
          </div>
          <button className="rounded-lg border border-border/60 bg-card/30 px-3 py-1.5 text-xs hover:border-primary/40 hover:text-foreground">
            Configure
          </button>
        </div>
      ))}
    </div>
  );
}
