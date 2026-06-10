import { createFileRoute } from "@tanstack/react-router";
import { Filter, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/reservations")({
  head: () => ({ meta: [{ title: "Reservations — Jambo ERP" }] }),
  component: ReservationsPage,
});

const rows = [
  { id: "RSV-4821", guest: "Sarah Nakato", room: "Deluxe 304", in: "Jun 10", out: "Jun 14", nights: 4, status: "Confirmed", amount: "UGX 1,200,000", source: "Direct" },
  { id: "RSV-4822", guest: "James Okello", room: "Suite 501", in: "Jun 10", out: "Jun 13", nights: 3, status: "Checked-in", amount: "UGX 3,400,000", source: "Booking.com" },
  { id: "RSV-4823", guest: "Priya Sharma", room: "Standard 212", in: "Jun 11", out: "Jun 15", nights: 4, status: "Pending", amount: "UGX 980,000", source: "Expedia" },
  { id: "RSV-4824", guest: "David Mensah", room: "Deluxe 308", in: "Jun 12", out: "Jun 18", nights: 6, status: "Confirmed", amount: "UGX 2,100,000", source: "Direct" },
  { id: "RSV-4825", guest: "Aisha Wanjiku", room: "Suite 502", in: "Jun 12", out: "Jun 16", nights: 4, status: "Checked-in", amount: "UGX 4,600,000", source: "Corporate" },
  { id: "RSV-4826", guest: "Mark Tindyebwa", room: "Standard 108", in: "Jun 13", out: "Jun 14", nights: 1, status: "Cancelled", amount: "UGX 280,000", source: "Direct" },
  { id: "RSV-4827", guest: "Linda Asiimwe", room: "Deluxe 311", in: "Jun 14", out: "Jun 20", nights: 6, status: "Confirmed", amount: "UGX 2,520,000", source: "Direct" },
];

const statusStyles: Record<string, string> = {
  Confirmed: "bg-info/15 text-info border-info/30",
  "Checked-in": "bg-success/15 text-success border-success/30",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

function ReservationsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Reservations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage bookings across all channels.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.6_0.2_220)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4" /> New Reservation
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Today", value: "12" },
          { label: "Arriving", value: "27" },
          { label: "Departing", value: "19" },
          { label: "In-house", value: "142" },
        ].map((s) => (
          <div key={s.label} className="glass card-hover rounded-2xl p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by guest, reservation ID, room…"
              className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60"
            />
          </div>
          {["All", "Confirmed", "Checked-in", "Pending", "Cancelled"].map((f, i) => (
            <button
              key={f}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-medium transition",
                i === 0
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/60 bg-card/30 text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/30 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-3 font-medium">ID</th>
                <th className="px-3 py-3 font-medium">Guest</th>
                <th className="px-3 py-3 font-medium">Room</th>
                <th className="px-3 py-3 font-medium">Check in</th>
                <th className="px-3 py-3 font-medium">Check out</th>
                <th className="px-3 py-3 font-medium">Nights</th>
                <th className="px-3 py-3 font-medium">Source</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/30 transition hover:bg-card/40">
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                  <td className="px-3 py-3 font-medium">{r.guest}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.room}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.in}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.out}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.nights}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.source}</td>
                  <td className="px-3 py-3">
                    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium", statusStyles[r.status])}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
