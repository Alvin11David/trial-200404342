import { createFileRoute } from "@tanstack/react-router";
import { BedDouble, Wifi, Coffee, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/rooms")({
  head: () => ({ meta: [{ title: "Rooms — Jambo ERP" }] }),
  component: RoomsPage,
});

type RoomStatus = "Occupied" | "Available" | "Dirty" | "OOS";

const floors = [1, 2, 3, 4, 5] as const;
const rooms: { number: string; floor: number; type: string; status: RoomStatus; rate: string; guest?: string }[] = [];
const types = ["Standard", "Deluxe", "Suite", "Standard", "Deluxe", "Standard"];
const statuses: RoomStatus[] = ["Occupied", "Available", "Occupied", "Occupied", "Dirty", "Available", "Occupied", "OOS"];
floors.forEach((f) => {
  for (let i = 1; i <= 8; i++) {
    const number = `${f}${String(i).padStart(2, "0")}`;
    const status = statuses[(f + i) % statuses.length];
    rooms.push({
      number,
      floor: f,
      type: types[i % types.length],
      status,
      rate: `UGX ${(180 + i * 40).toLocaleString()}K`,
      guest: status === "Occupied" ? ["S. Nakato", "J. Okello", "P. Sharma", "D. Mensah"][i % 4] : undefined,
    });
  }
});

const statusMeta: Record<RoomStatus, { dot: string; label: string; ring: string }> = {
  Occupied: { dot: "bg-primary", label: "Occupied", ring: "ring-primary/30" },
  Available: { dot: "bg-success", label: "Available", ring: "ring-success/30" },
  Dirty: { dot: "bg-warning", label: "Needs cleaning", ring: "ring-warning/30" },
  OOS: { dot: "bg-destructive", label: "Out of service", ring: "ring-destructive/30" },
};

function RoomsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Rooms</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live floor plan · 40 rooms across 5 floors</p>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {(Object.keys(statusMeta) as RoomStatus[]).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", statusMeta[k].dot)} />
              {statusMeta[k].label}
            </div>
          ))}
        </div>
      </div>

      {floors.map((floor) => (
        <div key={floor} className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Floor {floor}</h3>
            <span className="text-xs text-muted-foreground">8 rooms</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {rooms.filter((r) => r.floor === floor).map((r) => {
              const meta = statusMeta[r.status];
              return (
                <div
                  key={r.number}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border border-border/60 bg-card/40 p-4 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/20",
                    "ring-1", meta.ring,
                  )}
                >
                  <div className="flex items-start justify-between">
                    <BedDouble className="h-4 w-4 text-muted-foreground" />
                    <span className={cn("h-2 w-2 rounded-full", meta.dot, "animate-pulse-glow")} />
                  </div>
                  <div className="mt-3 font-display text-xl font-bold tracking-tight">{r.number}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{r.type}</div>
                  {r.guest && (
                    <div className="mt-2 truncate text-xs text-foreground/80">{r.guest}</div>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-muted-foreground/80">
                    <Wifi className="h-3 w-3" />
                    <Coffee className="h-3 w-3" />
                    <Wind className="h-3 w-3" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
