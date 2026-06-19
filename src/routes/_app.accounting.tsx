import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Search,
  FileText,
  Building2,
  Users as UsersIcon,
  Receipt,
  Filter,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

export const Route = createFileRoute("/_app/accounting")({
  head: () => ({ meta: [{ title: "Accounting — Jambo ERP" }] }),
  component: AccountingPage,
});

type Tab = "dashboard" | "coa" | "journal" | "parties" | "expenses";

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Financial Dashboard", icon: TrendingUp },
  { id: "coa", label: "Chart of Accounts", icon: FileText },
  { id: "journal", label: "Journal Entries", icon: Wallet },
  { id: "parties", label: "Debtors & Creditors", icon: UsersIcon },
  { id: "expenses", label: "Expenses", icon: Receipt },
];

const ugx = (n: number) => "UGX " + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

function AccountingPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ledgers, journals, receivables, payables &amp; expense tracking.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      {/* Tabs */}
      <div className="glass flex flex-wrap gap-1 rounded-2xl p-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-gradient-to-r from-primary/25 to-primary/5 text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
        {tab === "dashboard" && <FinancialDashboard />}
        {tab === "coa" && <ChartOfAccounts />}
        {tab === "journal" && <JournalEntries />}
        {tab === "parties" && <Parties />}
        {tab === "expenses" && <Expenses />}
      </div>
    </div>
  );
}

/* ───────────────────────────── 8a · Financial Dashboard ───────────────────────────── */

const revenueTrend = [
  { m: "Jan", v: 142 },
  { m: "Feb", v: 168 },
  { m: "Mar", v: 154 },
  { m: "Apr", v: 192 },
  { m: "May", v: 218 },
  { m: "Jun", v: 246 },
  { m: "Jul", v: 232 },
  { m: "Aug", v: 261 },
  { m: "Sep", v: 274 },
  { m: "Oct", v: 258 },
  { m: "Nov", v: 289 },
  { m: "Dec", v: 312 },
];

const expenseCats = [
  { name: "Payroll", value: 42, color: "oklch(0.74 0.21 71)" },
  { name: "Utilities", value: 18, color: "oklch(0.66 0.18 220)" },
  { name: "F&B Supplies", value: 16, color: "oklch(0.72 0.18 160)" },
  { name: "Maintenance", value: 12, color: "oklch(0.7 0.2 30)" },
  { name: "Marketing", value: 7, color: "oklch(0.68 0.21 320)" },
  { name: "Other", value: 5, color: "oklch(0.55 0.05 250)" },
];

function FinancialDashboard() {
  const income = 312_000_000;
  const expenses = 184_500_000;
  const net = income - expenses;
  const margin = ((net / income) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* P&L summary */}
      <div className="grid gap-4 lg:grid-cols-4">
        <PLCard
          label="Total Income"
          value={ugx(income)}
          delta="+18.2%"
          positive
          icon={ArrowUpRight}
          tone="success"
        />
        <PLCard
          label="Total Expenses"
          value={ugx(expenses)}
          delta="+6.4%"
          positive={false}
          icon={ArrowDownRight}
          tone="destructive"
        />
        <PLCard
          label="Net Profit"
          value={ugx(net)}
          delta={`Margin ${margin}%`}
          positive
          icon={TrendingUp}
          tone="primary"
        />
        <PLCard
          label="Cash Balance"
          value={ugx(94_200_000)}
          delta="3 accounts"
          positive
          icon={Wallet}
          tone="info"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass card-hover rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Revenue Trend</div>
              <div className="text-xs text-muted-foreground">Last 12 months · UGX (M)</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="h-3.5 w-3.5" />
              +24% YoY
            </div>
          </div>
          <RevenueAreaChart data={revenueTrend} />
        </div>

        <div className="glass card-hover rounded-2xl p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold">Top Expense Categories</div>
            <div className="text-xs text-muted-foreground">YTD · % of total spend</div>
          </div>
          <DonutChart data={expenseCats} />
        </div>
      </div>

      {/* Cash flow */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold">Cash Flow Summary</div>
          <div className="text-xs text-muted-foreground">June 2026</div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Operating",
              inflow: 246_000_000,
              outflow: 158_000_000,
              tone: "success" as const,
            },
            {
              label: "Investing",
              inflow: 4_200_000,
              outflow: 38_400_000,
              tone: "warning" as const,
            },
            {
              label: "Financing",
              inflow: 12_000_000,
              outflow: 22_500_000,
              tone: "info" as const,
            },
          ].map((c) => {
            const net = c.inflow - c.outflow;
            return (
              <div key={c.label} className="rounded-xl border border-border/60 bg-card/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {c.label}
                  </span>
                  <span
                    className={`text-xs font-semibold ${net >= 0 ? "text-success" : "text-destructive"}`}
                  >
                    {net >= 0 ? "+" : ""}
                    {ugx(net)}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inflow</span>
                    <span className="font-mono text-success">{ugx(c.inflow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outflow</span>
                    <span className="font-mono text-destructive">{ugx(c.outflow)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PLCard({
  label,
  value,
  delta,
  positive,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  tone: "success" | "destructive" | "primary" | "info";
}) {
  const toneMap = {
    success: "from-success/30 to-success/5 text-success",
    destructive: "from-destructive/30 to-destructive/5 text-destructive",
    primary: "from-primary/30 to-primary/5 text-primary",
    info: "from-[oklch(0.66_0.18_220)]/30 to-[oklch(0.66_0.18_220)]/5 text-[oklch(0.72_0.18_220)]",
  };
  const barColorMap: Record<string, string> = {
    success: "var(--color-success)",
    destructive: "var(--color-destructive)",
    primary: "var(--color-primary)",
    info: "oklch(0.72 0.18 220)",
  };
  return (
    <div className="glass card-hover relative overflow-hidden rounded-2xl p-5">
      <div
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${toneMap[tone]} blur-2xl opacity-40`}
      />
      <div
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: barColorMap[tone], boxShadow: `0 0 10px ${barColorMap[tone]}` }}
      />
      <div className="relative pl-1">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${toneMap[tone].split(" ").pop()}`} />
        </div>
        <div className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</div>
        <div
          className={`mt-1 text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}
        >
          {delta}
        </div>
      </div>
    </div>
  );
}

function RevenueAreaChart({ data }: { data: { m: string; v: number }[] }) {
  const w = 720;
  const h = 220;
  const pad = { l: 36, r: 12, t: 12, b: 26 };
  const max = Math.max(...data.map((d) => d.v)) * 1.1;
  const min = 0;
  const xs = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / (data.length - 1);
  const ys = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  const linePath = data.map((d, i) => `${i ? "L" : "M"}${xs(i)},${ys(d.v)}`).join(" ");
  const areaPath = linePath + ` L${xs(data.length - 1)},${h - pad.b} L${xs(0)},${h - pad.b} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[220px] w-full">
      <defs>
        <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.74 0.21 71)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="oklch(0.74 0.21 71)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => {
        const y = ys(t);
        return (
          <g key={i}>
            <line
              x1={pad.l}
              x2={w - pad.r}
              y1={y}
              y2={y}
              stroke="oklch(0.35 0.04 250 / 0.25)"
              strokeDasharray="2 4"
            />
            <text
              x={pad.l - 6}
              y={y + 3}
              textAnchor="end"
              fontSize="10"
              fill="oklch(0.65 0.03 250)"
            >
              {t}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#rev-fill)" />
      <path
        d={linePath}
        fill="none"
        stroke="oklch(0.74 0.21 71)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xs(i)} cy={ys(d.v)} r="3" fill="oklch(0.74 0.21 71)" />
          <text x={xs(i)} y={h - 8} textAnchor="middle" fontSize="10" fill="oklch(0.65 0.03 250)">
            {d.m}
          </text>
        </g>
      ))}
    </svg>
  );
}

function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 180;
  const r = 70;
  const stroke = 22;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="oklch(0.25 0.03 250 / 0.5)"
            strokeWidth={stroke}
          />
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const dash = `${len} ${c - len}`;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
            <div className="font-display text-lg font-bold">{ugx(184_500_000)}</div>
          </div>
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-1.5 text-xs">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
            <span className="font-mono font-semibold">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────────── 8b · Chart of Accounts ───────────────────────────── */

type Ledger = { name: string; balance: number };
type Group = {
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
  children: (Group | Ledger)[];
};

const coa: Group[] = [
  {
    name: "Assets",
    type: "Asset",
    children: [
      {
        name: "Current Assets",
        type: "Asset",
        children: [
          { name: "Cash on Hand", balance: 8_400_000 },
          { name: "Bank — Stanbic Operating", balance: 64_200_000 },
          { name: "Bank — Centenary Reserve", balance: 21_600_000 },
          { name: "Accounts Receivable", balance: 18_900_000 },
        ],
      },
      {
        name: "Fixed Assets",
        type: "Asset",
        children: [
          { name: "Furniture & Fittings", balance: 142_000_000 },
          { name: "Kitchen Equipment", balance: 68_400_000 },
          { name: "Building", balance: 1_200_000_000 },
        ],
      },
    ],
  },
  {
    name: "Liabilities",
    type: "Liability",
    children: [
      { name: "Accounts Payable", balance: 22_400_000 },
      { name: "VAT Payable", balance: 6_800_000 },
      { name: "Bank Loan — Equity Bank", balance: 240_000_000 },
    ],
  },
  {
    name: "Income",
    type: "Income",
    children: [
      { name: "Room Revenue", balance: 218_000_000 },
      { name: "F&B Revenue", balance: 72_000_000 },
      { name: "Events Revenue", balance: 22_000_000 },
    ],
  },
  {
    name: "Expenses",
    type: "Expense",
    children: [
      { name: "Payroll", balance: 78_000_000 },
      { name: "Utilities", balance: 32_000_000 },
      { name: "F&B Supplies", balance: 29_000_000 },
      { name: "Maintenance", balance: 22_000_000 },
    ],
  },
];

const typeTone: Record<string, string> = {
  Asset: "text-success border-success/30 bg-success/10",
  Liability: "text-destructive border-destructive/30 bg-destructive/10",
  Equity: "text-warning border-warning/30 bg-warning/10",
  Income: "text-primary border-primary/30 bg-primary/10",
  Expense:
    "text-[oklch(0.72_0.18_220)] border-[oklch(0.66_0.18_220)]/30 bg-[oklch(0.66_0.18_220)]/10",
};

function ChartOfAccounts() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search ledgers…"
            className="w-full rounded-xl border border-border/70 bg-card/40 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60"
          />
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-xs font-medium hover:border-primary/50">
            <Plus className="h-3.5 w-3.5" />
            New Group
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:shadow-primary/50">
            <Plus className="h-3.5 w-3.5" />
            New Ledger
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border/40 px-3 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Account</span>
          <span>Type</span>
          <span className="text-right">Balance</span>
        </div>
        <ul className="mt-2 space-y-1">
          {coa.map((g) => (
            <TreeNode key={g.name} node={g} depth={0} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function isGroup(n: Group | Ledger): n is Group {
  return (n as Group).children !== undefined;
}

function nodeBalance(n: Group | Ledger): number {
  return isGroup(n) ? n.children.reduce((s, c) => s + nodeBalance(c), 0) : n.balance;
}

function TreeNode({
  node,
  depth,
  parentType,
}: {
  node: Group | Ledger;
  depth: number;
  parentType?: string;
}) {
  const [open, setOpen] = useState(depth < 1);
  const group = isGroup(node);
  const type = group ? node.type : (parentType ?? "");
  const balance = nodeBalance(node);
  return (
    <li>
      <div
        className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-lg px-3 py-2 text-sm transition hover:bg-card/60"
        style={{ paddingLeft: `${12 + depth * 18}px` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {group ? (
            <button
              onClick={() => setOpen((o) => !o)}
              className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-card/80"
            >
              {open ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          )}
          <span className={`truncate ${group ? "font-semibold" : "text-muted-foreground"}`}>
            {node.name}
          </span>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${typeTone[type] ?? "text-muted-foreground border-border/50"}`}
        >
          {type}
        </span>
        <span className="font-mono text-xs font-semibold tabular-nums">{ugx(balance)}</span>
      </div>
      {group && open && (
        <ul className="space-y-1">
          {node.children.map((c) => (
            <TreeNode
              key={(c as Group | Ledger).name}
              node={c}
              depth={depth + 1}
              parentType={type}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ───────────────────────────── 8c · Journal Entries ───────────────────────────── */

const journals = [
  {
    id: "JV-2406-001",
    date: "Jun 09",
    ref: "INV-10241",
    narration: "Room revenue — Suite 204",
    debit: 1_200_000,
    credit: 1_200_000,
  },
  {
    id: "JV-2406-002",
    date: "Jun 09",
    ref: "PAY-301",
    narration: "Stanbic salary disbursement",
    debit: 24_500_000,
    credit: 24_500_000,
  },
  {
    id: "JV-2406-003",
    date: "Jun 10",
    ref: "EXP-118",
    narration: "Umeme electricity bill",
    debit: 4_800_000,
    credit: 4_800_000,
  },
  {
    id: "JV-2406-004",
    date: "Jun 10",
    ref: "INV-10243",
    narration: "F&B catering deposit",
    debit: 980_000,
    credit: 980_000,
  },
];

function JournalEntries() {
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Period: <span className="font-semibold text-foreground">Jun 2026</span>
        </div>
        <button
          onClick={() => setShowNew((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:shadow-primary/50"
        >
          <Plus className="h-3.5 w-3.5" />
          New Journal
        </button>
      </div>

      {showNew && <NewJournalForm onClose={() => setShowNew(false)} />}

      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Entry #</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Narration</th>
              <th className="px-4 py-3 text-right font-medium">Debit</th>
              <th className="px-4 py-3 text-right font-medium">Credit</th>
            </tr>
          </thead>
          <tbody>
            {journals.map((j) => (
              <tr key={j.id} className="border-b border-border/20 hover:bg-card/40">
                <td className="px-4 py-3 font-mono text-xs text-primary">{j.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{j.date}</td>
                <td className="px-4 py-3 font-mono text-xs">{j.ref}</td>
                <td className="px-4 py-3">{j.narration}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{ugx(j.debit)}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{ugx(j.credit)}</td>
              </tr>
            ))}
            <tr className="bg-card/40 font-semibold">
              <td className="px-4 py-3" colSpan={4}>
                Totals
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-success">
                {ugx(journals.reduce((s, j) => s + j.debit, 0))}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-success">
                {ugx(journals.reduce((s, j) => s + j.credit, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Line = { id: number; account: string; debit: string; credit: string };

function NewJournalForm({ onClose }: { onClose: () => void }) {
  const [date, setDate] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { id: 1, account: "", debit: "", credit: "" },
    { id: 2, account: "", debit: "", credit: "" },
  ]);
  const totals = useMemo(
    () => ({
      d: lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0),
      c: lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0),
    }),
    [lines],
  );
  const balanced = totals.d === totals.c && totals.d > 0;
  return (
    <div className="glass animate-in fade-in-50 slide-in-from-top-2 rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-display text-lg font-bold">New Journal Entry</div>
          <div className="text-xs text-muted-foreground">
            Add dynamic lines · debits must equal credits
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-border/60 p-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Date
          </span>
          <DatePicker value={date} onChange={setDate} />
        </label>
        <FloatInput label="Reference" placeholder="e.g. INV-10250" />
        <FloatInput label="Narration" placeholder="Brief description…" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60">
        <div className="grid grid-cols-[1fr_140px_140px_36px] gap-2 border-b border-border/40 bg-card/30 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Account</span>
          <span className="text-right">Debit</span>
          <span className="text-right">Credit</span>
          <span />
        </div>
        {lines.map((l, i) => (
          <div
            key={l.id}
            className="grid grid-cols-[1fr_140px_140px_36px] items-center gap-2 border-b border-border/20 px-3 py-2"
          >
            <input
              placeholder={`Line ${i + 1} account`}
              value={l.account}
              onChange={(e) =>
                setLines((ls) =>
                  ls.map((x) => (x.id === l.id ? { ...x, account: e.target.value } : x)),
                )
              }
              className="rounded-lg border border-border/50 bg-card/40 px-2.5 py-1.5 text-sm outline-none focus:border-primary/60"
            />
            <input
              type="number"
              placeholder="0"
              value={l.debit}
              onChange={(e) =>
                setLines((ls) =>
                  ls.map((x) => (x.id === l.id ? { ...x, debit: e.target.value, credit: "" } : x)),
                )
              }
              className="rounded-lg border border-border/50 bg-card/40 px-2.5 py-1.5 text-right font-mono text-sm outline-none focus:border-primary/60"
            />
            <input
              type="number"
              placeholder="0"
              value={l.credit}
              onChange={(e) =>
                setLines((ls) =>
                  ls.map((x) => (x.id === l.id ? { ...x, credit: e.target.value, debit: "" } : x)),
                )
              }
              className="rounded-lg border border-border/50 bg-card/40 px-2.5 py-1.5 text-right font-mono text-sm outline-none focus:border-primary/60"
            />
            <button
              onClick={() =>
                setLines((ls) => (ls.length > 2 ? ls.filter((x) => x.id !== l.id) : ls))
              }
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            setLines((ls) => [...ls, { id: Date.now(), account: "", debit: "", credit: "" }])
          }
          className="flex w-full items-center justify-center gap-1.5 bg-card/20 py-2 text-xs font-medium text-muted-foreground transition hover:bg-card/40 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Add line
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Debits: </span>
            <span className="font-mono font-semibold">{ugx(totals.d)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Credits: </span>
            <span className="font-mono font-semibold">{ugx(totals.c)}</span>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              balanced
                ? "border-success/40 bg-success/10 text-success"
                : "border-warning/40 bg-warning/10 text-warning"
            }`}
          >
            {balanced ? "Balanced" : "Unbalanced"}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-border/60 px-4 py-2 text-sm hover:border-primary/40"
          >
            Cancel
          </button>
          <button
            disabled={!balanced}
            className="rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Post Entry
          </button>
        </div>
      </div>
    </div>
  );
}

function FloatInput({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        {...rest}
        className="w-full rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm outline-none transition focus:border-primary/60"
      />
    </label>
  );
}

/* ───────────────────────────── 8d · Debtors & Creditors ───────────────────────────── */

const debtors = [
  {
    name: "Speke Resort Bookings Ltd",
    contact: "accounts@speke.ug",
    balance: 18_400_000,
    age: "0-30",
  },
  { name: "Kampala Events Co.", contact: "finance@kec.co.ug", balance: 6_800_000, age: "31-60" },
  { name: "Ministry of Tourism", contact: "ap@tourism.go.ug", balance: 24_200_000, age: "61-90" },
  { name: "Equator Travel Agency", contact: "billing@equator.ug", balance: 3_400_000, age: "0-30" },
];

const creditors = [
  { name: "Umeme Ltd", contact: "billing@umeme.co.ug", balance: 4_800_000, age: "0-30" },
  { name: "Mukwano Industries", contact: "ar@mukwano.com", balance: 7_200_000, age: "0-30" },
  { name: "Nile Breweries", contact: "trade@nile.co.ug", balance: 12_600_000, age: "31-60" },
  { name: "Centenary Bank", contact: "loans@centenary.ug", balance: 240_000_000, age: ">90" },
];

function Parties() {
  const [mode, setMode] = useState<"debtors" | "creditors">("debtors");
  const [modal, setModal] = useState<null | { kind: "receive" | "pay"; party: string }>(null);
  const list = mode === "debtors" ? debtors : creditors;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="glass inline-flex rounded-xl p-1">
          {(["debtors", "creditors"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition ${
                mode === m
                  ? "bg-gradient-to-r from-primary/30 to-primary/5 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Total outstanding:{" "}
          <span className="font-mono font-semibold text-foreground">
            {ugx(list.reduce((s, p) => s + p.balance, 0))}
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {list.map((p) => (
          <div key={p.name} className="glass card-hover rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-success/20 text-sm font-bold">
                  {p.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.contact}</div>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  p.age === "0-30"
                    ? "border-success/40 bg-success/10 text-success"
                    : p.age === "31-60"
                      ? "border-warning/40 bg-warning/10 text-warning"
                      : "border-destructive/40 bg-destructive/10 text-destructive"
                }`}
              >
                {p.age} days
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Outstanding
                </div>
                <div className="font-display text-xl font-bold">{ugx(p.balance)}</div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg border border-border/60 px-2.5 py-1 text-xs hover:border-primary/50">
                  View
                </button>
                <button
                  onClick={() =>
                    setModal({
                      kind: mode === "debtors" ? "receive" : "pay",
                      party: p.name,
                    })
                  }
                  className="rounded-lg bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/30"
                >
                  {mode === "debtors" ? "Receive" : "Pay"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <PaymentModal kind={modal.kind} party={modal.party} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function PaymentModal({
  kind,
  party,
  onClose,
}: {
  kind: "receive" | "pay";
  party: string;
  onClose: () => void;
}) {
  const [date, setDate] = useState("");
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-md animate-in fade-in-50 zoom-in-95 rounded-2xl p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {kind === "receive" ? "Receive Payment" : "Make Payment"}
            </div>
            <div className="font-display text-lg font-bold">{party}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-border/60 p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Date
            </span>
            <DatePicker value={date} onChange={setDate} />
          </label>
          <FloatInput label="Amount (UGX)" type="number" placeholder="0" />
          <FloatInput label="Method" placeholder="Bank Transfer / Mobile Money / Cash" />
          <FloatInput label="Reference" placeholder="Txn ID or cheque #" />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-border/60 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button className="rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30">
            {kind === "receive" ? "Record Receipt" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── 8e · Expenses ───────────────────────────── */

const initialExpenses = [
  {
    id: "EXP-118",
    category: "Utilities",
    vendor: "Umeme Ltd",
    date: "Jun 10",
    amount: 4_800_000,
  },
  {
    id: "EXP-117",
    category: "F&B Supplies",
    vendor: "Mukwano Industries",
    date: "Jun 09",
    amount: 7_200_000,
  },
  {
    id: "EXP-116",
    category: "Maintenance",
    vendor: "ProClean Services",
    date: "Jun 08",
    amount: 1_400_000,
  },
  {
    id: "EXP-115",
    category: "Marketing",
    vendor: "Pulse Digital",
    date: "Jun 07",
    amount: 3_200_000,
  },
  {
    id: "EXP-114",
    category: "Payroll",
    vendor: "Stanbic Payroll",
    date: "Jun 05",
    amount: 24_500_000,
  },
];

const catTone: Record<string, string> = {
  Utilities:
    "bg-[oklch(0.66_0.18_220)]/15 text-[oklch(0.72_0.18_220)] border-[oklch(0.66_0.18_220)]/30",
  "F&B Supplies": "bg-success/15 text-success border-success/30",
  Maintenance: "bg-warning/15 text-warning border-warning/30",
  Marketing:
    "bg-[oklch(0.68_0.21_320)]/15 text-[oklch(0.74_0.21_320)] border-[oklch(0.68_0.21_320)]/30",
  Payroll: "bg-primary/15 text-primary border-primary/30",
};

function Expenses() {
  const [items, setItems] = useState(initialExpenses);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ category: "Utilities", vendor: "", amount: "" });

  function addExpense() {
    if (!form.vendor || !form.amount) return;
    setItems((it) => [
      {
        id: `EXP-${119 + (it.length - 5)}`,
        category: form.category,
        vendor: form.vendor,
        date: "Jun 11",
        amount: parseFloat(form.amount),
      },
      ...it,
    ]);
    setForm({ category: "Utilities", vendor: "", amount: "" });
    setShowNew(false);
  }

  const total = items.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            {items.length} expenses · Total{" "}
            <span className="font-mono font-semibold text-foreground">{ugx(total)}</span>
          </span>
        </div>
        <button
          onClick={() => setShowNew((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:shadow-primary/50"
        >
          <Plus className="h-3.5 w-3.5" />
          New Expense
        </button>
      </div>

      {showNew && (
        <div className="glass animate-in fade-in-50 slide-in-from-top-2 rounded-2xl p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Category
              </span>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="w-full rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(catTone).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <FloatInput
              label="Vendor"
              placeholder="Vendor name"
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            />
            <FloatInput
              label="Amount (UGX)"
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 rounded-xl border border-border/60 py-2 text-sm hover:border-primary/40"
              >
                Cancel
              </button>
              <button
                onClick={addExpense}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-b border-border/20 hover:bg-card/40">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.id}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      catTone[e.category] ?? "border-border/50 text-muted-foreground"
                    }`}
                  >
                    {e.category}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{e.vendor}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.date}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold">
                  {ugx(e.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
