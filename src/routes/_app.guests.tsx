import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, Star } from "lucide-react";

export const Route = createFileRoute("/_app/guests")({
  head: () => ({ meta: [{ title: "Guests — Jambo ERP" }] }),
  component: GuestsPage,
});

const guests = [
  { name: "Sarah Nakato", email: "sarah@example.com", phone: "+256 700 123 456", visits: 8, tier: "Platinum", country: "Uganda" },
  { name: "James Okello", email: "j.okello@example.com", phone: "+256 772 998 111", visits: 4, tier: "Gold", country: "Uganda" },
  { name: "Priya Sharma", email: "priya@example.in", phone: "+91 98 7654 3210", visits: 2, tier: "Silver", country: "India" },
  { name: "David Mensah", email: "d.mensah@example.com", phone: "+233 24 555 6677", visits: 6, tier: "Gold", country: "Ghana" },
  { name: "Aisha Wanjiku", email: "aisha.w@example.com", phone: "+254 712 334 556", visits: 12, tier: "Platinum", country: "Kenya" },
  { name: "Mark Tindyebwa", email: "mark.t@example.com", phone: "+256 701 222 778", visits: 1, tier: "Silver", country: "Uganda" },
];

const tierStyle: Record<string, string> = {
  Platinum: "from-[oklch(0.85_0.05_270)] to-[oklch(0.7_0.1_280)]",
  Gold: "from-[oklch(0.82_0.16_75)] to-[oklch(0.7_0.18_50)]",
  Silver: "from-[oklch(0.75_0.02_250)] to-[oklch(0.6_0.02_250)]",
};

function GuestsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Guests</h1>
        <p className="mt-1 text-sm text-muted-foreground">CRM · loyalty · history</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guests.map((g) => (
          <div key={g.email} className="glass card-hover rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className={`grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br text-sm font-bold text-primary-foreground ${tierStyle[g.tier]}`}>
                {g.name.split(" ").map((p) => p[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold">{g.name}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Star className="h-3 w-3 text-warning" /> {g.tier}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{g.country} · {g.visits} stays</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> {g.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> {g.phone}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-lg border border-border/60 bg-card/30 py-2 text-xs hover:border-primary/40 hover:text-foreground">View profile</button>
              <button className="flex-1 rounded-lg bg-primary/15 py-2 text-xs font-medium text-primary hover:bg-primary/25">New booking</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
