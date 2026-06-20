import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calendar, Download, BarChart3 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis, LabelList } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import {
  adrOnDate,
  dateRangeList,
  defaultRange,
  fmtUGX,
  occupancyOnDate,
  revparOnDate,
  roomRevenueOnDate,
  useStore,
} from "@/lib/pms-store";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — Jambo PMS" }] }),
  component: ReportsPage,
});

type ReportKey = "occupancy" | "revenue" | "payments" | "trends";

function ReportsPage() {
  const [report, setReport] = useState<ReportKey>("occupancy");
  const initial = defaultRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Operational &amp; financial reports for the property.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard active={report === "occupancy"} onClick={() => setReport("occupancy")} title="Occupancy" desc="Daily occupancy %" />
        <ReportCard active={report === "revenue"} onClick={() => setReport("revenue")} title="Revenue" desc="Charges by source" />
        <ReportCard active={report === "payments"} onClick={() => setReport("payments")} title="Payments" desc="By method &amp; date" />
        <ReportCard active={report === "trends"} onClick={() => setReport("trends")} title="ADR / RevPAR" desc="Rate performance" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">From</span>
          <DatePicker value={from} onChange={setFrom} />
          <span className="text-muted-foreground">to</span>
          <DatePicker value={to} onChange={setTo} />
        </div>
        <button className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {report === "occupancy" && <OccupancyReport from={from} to={to} />}
      {report === "revenue" && <RevenueReport from={from} to={to} />}
      {report === "payments" && <PaymentsReport from={from} to={to} />}
      {report === "trends" && <TrendsReport from={from} to={to} />}
    </div>
  );
}

function ReportCard({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition",
        active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className="flex items-center gap-2">
        <BarChart3 className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{desc}</p>
    </button>
  );
}

function OccupancyReport({ from, to }: { from: string; to: string }) {
  const dates = useMemo(() => dateRangeList(from, to), [from, to]);
  const rows = dates.map((d) => {
    const o = occupancyOnDate(d);
    return { date: d, total: o.total, occupied: o.occupied, pct: o.pct };
  });
  const avg = rows.length ? rows.reduce((s, r) => s + r.pct, 0) / rows.length : 0;

  const chartConfig = {
    occupancy: { label: "Occupancy", color: "var(--color-primary)" },
  } satisfies ChartConfig;

  const chartData = rows.map((r) => ({
    date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    occupancy: +(r.pct * 100).toFixed(1),
  }));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="occFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" className="rounded-xl" />} />
            <Area type="monotone" dataKey="occupancy" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#occFill)" dot={{ fill: "var(--color-card)", stroke: "var(--color-primary)", strokeWidth: 2.5, r: 4.5 }} activeDot={{ r: 6, fill: "var(--color-primary)" }}>
              <LabelList dataKey="occupancy" position="top" className="fill-foreground" fontSize={11} fontWeight={600} formatter={(v: number) => `${v}%`} />
            </Area>
          </AreaChart>
        </ChartContainer>
      </div>
      <ReportTable
        title="Occupancy report"
        subtitle={`Avg occupancy ${(avg * 100).toFixed(1)}%`}
        headers={["Date", "Total rooms", "Occupied", "Occupancy %"]}
        rows={rows.map((r) => [r.date, r.total.toString(), r.occupied.toString(), (r.pct * 100).toFixed(1) + "%"])}
      />
    </div>
  );
}

function RevenueReport({ from, to }: { from: string; to: string }) {
  const charges = useStore((s) => s.charges);
  const dates = dateRangeList(from, to);
  const rows = dates.map((d) => {
    const room = charges.filter((c) => c.date === d && c.type === "room").reduce((s, c) => s + c.amount, 0);
    const fnb = charges.filter((c) => c.date === d && c.type === "fnb").reduce((s, c) => s + c.amount, 0);
    const misc = charges.filter((c) => c.date === d && (c.type === "misc" || c.type === "tax")).reduce((s, c) => s + c.amount, 0);
    return { date: d, room, fnb, misc, total: room + fnb + misc };
  });
  const totals = rows.reduce(
    (s, r) => ({ room: s.room + r.room, fnb: s.fnb + r.fnb, misc: s.misc + r.misc, total: s.total + r.total }),
    { room: 0, fnb: 0, misc: 0, total: 0 },
  );

  const chartConfig = {
    room: { label: "Rooms", color: "var(--color-primary)" },
    fnb: { label: "F&B", color: "var(--color-success)" },
    misc: { label: "Misc", color: "var(--color-warning)" },
  } satisfies ChartConfig;

  const chartData = rows.map((r) => ({
    date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    room: r.room,
    fnb: r.fnb,
    misc: r.misc,
  }));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <ChartContainer config={chartConfig} className="h-52 w-full">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} />
            <YAxis tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} tickFormatter={(v: number) => fmtUGX(v)} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="room" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={12} stackId="a" />
            <Bar dataKey="fnb" fill="var(--color-success)" radius={[4, 4, 0, 0]} barSize={12} stackId="a" />
            <Bar dataKey="misc" fill="var(--color-warning)" radius={[4, 4, 0, 0]} barSize={12} stackId="a" />
          </BarChart>
        </ChartContainer>
      </div>
      <ReportTable
        title="Revenue report"
        subtitle={`Total ${fmtUGX(totals.total)} · Rooms ${fmtUGX(totals.room)} · F&B ${fmtUGX(totals.fnb)} · Misc ${fmtUGX(totals.misc)}`}
        headers={["Date", "Rooms", "F&B", "Misc", "Total"]}
        rows={rows.map((r) => [r.date, fmtUGX(r.room), fmtUGX(r.fnb), fmtUGX(r.misc), fmtUGX(r.total)])}
      />
    </div>
  );
}

function PaymentsReport({ from, to }: { from: string; to: string }) {
  const payments = useStore((s) => s.payments);
  const filtered = payments.filter((p) => p.date >= from && p.date <= to);
  const byMethod = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((p) => map.set(p.method, (map.get(p.method) ?? 0) + p.amount));
    return Array.from(map.entries());
  }, [filtered]);
  const totalPayments = filtered.reduce((s, p) => s + p.amount, 0);

  const dates = dateRangeList(from, to);
  const byDate = dates.map((d) => ({
    date: d,
    total: filtered.filter((p) => p.date === d).reduce((s, p) => s + p.amount, 0),
  }));

  const pieColors = ["var(--color-primary)", "var(--color-success)", "var(--color-warning)", "var(--color-info)", "var(--color-chart-5)"];
  const pieConfig = {
    value: { label: "Amount" },
  } satisfies ChartConfig;

  const barConfig = {
    payments: { label: "Payments", color: "var(--color-success)" },
  } satisfies ChartConfig;

  const barData = byDate.map((r) => ({
    date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    payments: r.total,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">By method</h3>
          <p className="text-[11px] text-muted-foreground">Total {fmtUGX(totalPayments)}</p>
          <ChartContainer config={pieConfig} className="mx-auto mt-2 h-44 w-44">
            <PieChart>
              <Pie data={byMethod.map(([m, a]) => ({ name: m.replace("_", " "), value: a }))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} strokeWidth={0} cornerRadius={4} paddingAngle={2}>
                {byMethod.map(([m], i) => (
                  <Cell key={m} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y divide-border">
              {byMethod.map(([method, amt]) => (
                <tr key={method}>
                  <td className="py-2 capitalize">{method.replace("_", " ")}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{fmtUGX(amt)}</td>
                </tr>
              ))}
              {byMethod.length === 0 && (
                <tr><td className="py-6 text-center text-xs text-muted-foreground">No payments in range.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <ChartContainer config={barConfig} className="h-40 w-full">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} tickFormatter={(v: number) => fmtUGX(v)} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="payments" fill="var(--color-success)" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ChartContainer>
          </div>
          <ReportTable
            title="By date"
            subtitle={`Total ${fmtUGX(totalPayments)}`}
            headers={["Date", "Collected"]}
            rows={byDate.map((r) => [r.date, fmtUGX(r.total)])}
            flat
          />
        </div>
      </div>
    </div>
  );
}

function TrendsReport({ from, to }: { from: string; to: string }) {
  const dates = dateRangeList(from, to);
  const rows = dates.map((d) => ({
    date: d,
    adr: adrOnDate(d),
    revpar: revparOnDate(d),
    rev: roomRevenueOnDate(d),
  }));

  const chartConfig = {
    adr: { label: "ADR", color: "var(--color-primary)" },
    revpar: { label: "RevPAR", color: "var(--color-success)" },
  } satisfies ChartConfig;

  const chartData = rows.map((r) => ({
    date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    adr: r.adr,
    revpar: r.revpar,
  }));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <ChartContainer config={chartConfig} className="h-52 w-full">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} />
            <YAxis tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} tickFormatter={(v: number) => fmtUGX(v)} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line type="monotone" dataKey="adr" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ fill: "var(--color-card)", stroke: "var(--color-primary)", strokeWidth: 2, r: 3.5 }} activeDot={{ r: 5, fill: "var(--color-primary)" }} />
            <Line type="monotone" dataKey="revpar" stroke="var(--color-success)" strokeWidth={2.5} dot={{ fill: "var(--color-card)", stroke: "var(--color-success)", strokeWidth: 2, r: 3.5 }} activeDot={{ r: 5, fill: "var(--color-success)" }} />
          </LineChart>
        </ChartContainer>
      </div>
      <ReportTable
        title="ADR &amp; RevPAR trends"
        subtitle="Computed from posted room charges"
        headers={["Date", "Room revenue", "ADR", "RevPAR"]}
        rows={rows.map((r) => [r.date, fmtUGX(r.rev), fmtUGX(r.adr), fmtUGX(r.revpar)])}
      />
    </div>
  );
}

function ReportTable({
  title,
  subtitle,
  headers,
  rows,
  flat,
}: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
  flat?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      {!flat && (
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      {flat && (
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              {headers.map((h, i) => (
                <th key={h} className={cn("px-4 py-2.5 font-semibold", i === 0 ? "text-left" : "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, idx) => (
              <tr key={idx} className="hover:bg-muted/30">
                {r.map((c, i) => (
                  <td key={i} className={cn("px-4 py-2.5", i === 0 ? "text-left text-muted-foreground" : "text-right font-medium tabular-nums")}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-4 py-10 text-center text-xs text-muted-foreground">
                  No data in range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
