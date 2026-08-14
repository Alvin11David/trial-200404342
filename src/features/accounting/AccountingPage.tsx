import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Search, ArrowUpDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  fmtUGX,
  folioBalance,
  FOLIO_STATUS_LABEL,
  type CorporateAccount,
} from "@/lib/pms-store";

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function agingBucket(days: number): string {
  if (days <= 0) return "Not yet due";
  if (days <= 30) return "0–30 days";
  if (days <= 60) return "31–60 days";
  if (days <= 90) return "61–90 days";
  return "90+ days";
}

const AGING_ORDER = ["0–30 days", "31–60 days", "61–90 days", "90+ days"];

export default function AccountingPage() {
  const folios = useStore((s) => s.folios);
  const corporateAccounts = useStore((s) => s.corporateAccounts);
  const [search, setSearch] = useState("");

  const transferredFolios = useMemo(
    () =>
      folios.filter(
        (f) =>
          f.corporateAccountId &&
          (f.status === "transferred_to_ledger" || f.status === "transferred_to_agent") &&
          f.closedAt,
      ),
    [folios],
  );

  type CorpAging = {
    account: CorporateAccount;
    totalOutstanding: number;
    buckets: Record<string, number>;
    folioCount: number;
  };

  const corpAging = useMemo(() => {
    const map = new Map<string, CorpAging>();
    for (const f of transferredFolios) {
      const corp = corporateAccounts.find((c) => c.id === f.corporateAccountId);
      if (!corp) continue;
      if (search && !corp.companyName.toLowerCase().includes(search.toLowerCase())) continue;
      const balance = folioBalance(f.id);
      if (balance <= 0) continue;
      const days = daysSince(f.closedAt!);
      const bucket = agingBucket(days);
      let entry = map.get(corp.id);
      if (!entry) {
        entry = { account: corp, totalOutstanding: 0, buckets: {}, folioCount: 0 };
        map.set(corp.id, entry);
      }
      entry.totalOutstanding += balance;
      entry.folioCount++;
      entry.buckets[bucket] = (entry.buckets[bucket] ?? 0) + balance;
    }
    return Array.from(map.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }, [transferredFolios, corporateAccounts, search]);

  const grandTotal = corpAging.reduce((s, c) => s + c.totalOutstanding, 0);
  const bucketTotals = AGING_ORDER.reduce(
    (acc, b) => ({ ...acc, [b]: corpAging.reduce((s, c) => s + (c.buckets[b] ?? 0), 0) }),
    {} as Record<string, number>,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">City Ledger Aging</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accounts receivable by corporate account with aging breakdown
          </p>
        </div>
        <Link
          to="/billing/master?tab=corporate"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary/40"
        >
          <Building2 className="h-3.5 w-3.5" /> Manage corporate accounts
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <SummaryCard label="Total Outstanding" value={fmtUGX(grandTotal)} />
        {AGING_ORDER.map((b) => (
          <SummaryCard key={b} label={b} value={fmtUGX(bucketTotals[b] ?? 0)} />
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search corporate accounts…"
          className="w-full rounded-xl border border-border/60 bg-background py-2.5 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50"
        />
      </div>

      {/* Table */}
      {corpAging.length === 0 ? (
        <div className="rounded-2xl border border-border/40 py-20 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
          <p className="text-sm font-medium text-muted-foreground">No outstanding city ledger balances</p>
          <p className="mt-1 text-xs text-muted-foreground/50">
            Corporate account balances will appear here after company-billed guests check out.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/40">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <Th>Corporate Account</Th>
                <Th>Folios</Th>
                {AGING_ORDER.map((b) => (
                  <Th key={b}>{b}</Th>
                ))}
                <Th className="text-right">Total Outstanding</Th>
              </tr>
            </thead>
            <tbody>
              {corpAging.map((c) => (
                <tr key={c.account.id} className="border-b border-border/20 transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link
                      to={`/billing/master?tab=corporate&corpId=${c.account.id}`}
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      {c.account.companyName}
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.folioCount}</td>
                  {AGING_ORDER.map((b) => (
                    <td key={b} className="px-4 py-3 tabular-nums">
                      {c.buckets[b] ? fmtUGX(c.buckets[b]) : "—"}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-destructive">
                    {fmtUGX(c.totalOutstanding)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <p className="mt-1 font-display text-lg font-bold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70", className)}>
      {children}
    </th>
  );
}
