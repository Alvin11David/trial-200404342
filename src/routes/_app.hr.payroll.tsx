import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Download, Wallet, Users, ArrowUpRight, ArrowDownRight, ChevronDown, Filter, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/hr/payroll")({
  head: () => ({ meta: [{ title: "Payroll — Jambo ERP" }] }),
  component: PayrollPage,
});

type PayrollStatus = "Draft" | "Approved" | "Paid";
type PayPeriod = string;

type PayrollRun = {
  id: string;
  period: PayPeriod;
  processed: string;
  employees: number;
  gross: number;
  deductions: number;
  net: number;
  status: PayrollStatus;
};

type EmployeePay = {
  id: string;
  name: string;
  department: string;
  position: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "Active" | "On Leave";
};

const PAYROLL_RUNS: PayrollRun[] = [
  { id: "PR-006", period: "Jun 2026", processed: "2026-06-01", employees: 12, gross: 42_500_000, deductions: 5_950_000, net: 36_550_000, status: "Draft" },
  { id: "PR-005", period: "May 2026", processed: "2026-05-01", employees: 12, gross: 42_500_000, deductions: 5_950_000, net: 36_550_000, status: "Paid" },
  { id: "PR-004", period: "Apr 2026", processed: "2026-04-01", employees: 11, gross: 39_800_000, deductions: 5_572_000, net: 34_228_000, status: "Paid" },
  { id: "PR-003", period: "Mar 2026", processed: "2026-03-01", employees: 11, gross: 39_800_000, deductions: 5_572_000, net: 34_228_000, status: "Paid" },
  { id: "PR-002", period: "Feb 2026", processed: "2026-02-01", employees: 10, gross: 35_200_000, deductions: 4_928_000, net: 30_272_000, status: "Paid" },
  { id: "PR-001", period: "Jan 2026", processed: "2026-01-01", employees: 10, gross: 35_200_000, deductions: 4_928_000, net: 30_272_000, status: "Paid" },
];

const CURRENT_PAY: EmployeePay[] = [
  { id: "E001", name: "Amani Kato", department: "Front Office", position: "Front Office Manager", basicSalary: 5_500_000, allowances: 800_000, deductions: 1_050_000, netPay: 5_250_000, status: "Active" },
  { id: "E002", name: "Grace Achieng", department: "Housekeeping", position: "Housekeeping Supervisor", basicSalary: 3_800_000, allowances: 500_000, deductions: 720_000, netPay: 3_580_000, status: "Active" },
  { id: "E003", name: "David Ochieng", department: "Kitchen", position: "Head Chef", basicSalary: 6_000_000, allowances: 1_000_000, deductions: 1_200_000, netPay: 5_800_000, status: "Active" },
  { id: "E004", name: "Sarah Nakato", department: "Admin", position: "General Manager", basicSalary: 10_000_000, allowances: 2_000_000, deductions: 1_800_000, netPay: 10_200_000, status: "Active" },
  { id: "E005", name: "John Mukasa", department: "F&B", position: "F&B Manager", basicSalary: 4_200_000, allowances: 600_000, deductions: 780_000, netPay: 4_020_000, status: "On Leave" },
  { id: "E006", name: "Mary Nakibuuka", department: "Housekeeping", position: "Room Attendant", basicSalary: 2_200_000, allowances: 300_000, deductions: 420_000, netPay: 2_080_000, status: "Active" },
  { id: "E007", name: "Peter Ssempijja", department: "Maintenance", position: "Chief Engineer", basicSalary: 4_000_000, allowances: 500_000, deductions: 750_000, netPay: 3_750_000, status: "Active" },
  { id: "E008", name: "Esther Nambi", department: "Front Office", position: "Receptionist", basicSalary: 2_500_000, allowances: 300_000, deductions: 480_000, netPay: 2_320_000, status: "Active" },
  { id: "E009", name: "Robert Kizza", department: "Security", position: "Security Lead", basicSalary: 3_000_000, allowances: 400_000, deductions: 560_000, netPay: 2_840_000, status: "Active" },
  { id: "E011", name: "Samuel Wasswa", department: "Kitchen", position: "Sous Chef", basicSalary: 3_500_000, allowances: 500_000, deductions: 660_000, netPay: 3_340_000, status: "Active" },
  { id: "E012", name: "Helen Nanteza", department: "Front Office", position: "Night Auditor", basicSalary: 2_800_000, allowances: 300_000, deductions: 530_000, netPay: 2_570_000, status: "On Leave" },
  { id: "E013", name: "Tom Okello", department: "Maintenance", position: "Technician", basicSalary: 2_000_000, allowances: 200_000, deductions: 380_000, netPay: 1_820_000, status: "Active" },
];

const DEPARTMENTS = ["All", "Front Office", "Housekeeping", "Kitchen", "F&B", "Admin", "Maintenance", "Security"];

const ugx = (n: number) => `UGX ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function PayrollPage() {
  const [tab, setTab] = useState<"current" | "history">("current");
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");

  const filtered = useMemo(() => {
    if (tab === "history") return PAYROLL_RUNS;
    return CURRENT_PAY.filter((e) => {
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = dept === "All" || e.department === dept;
      return matchSearch && matchDept;
    });
  }, [tab, search, dept]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/hr" className="rounded-lg border border-border/60 bg-card p-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-display text-3xl font-bold tracking-tight">Payroll</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Manage salaries, deductions, and payroll runs.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50">
          <Wallet className="h-4 w-4" />
          Run Payroll
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: "var(--color-primary)", boxShadow: "0 0 10px var(--color-primary)" }} />
          <div className="pl-1">
            <p className="text-xs font-medium text-muted-foreground">Total Employees</p>
            <p className="mt-1 font-display text-2xl font-bold">{CURRENT_PAY.length}</p>
            <p className="mt-1 text-[11px] text-success flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> +2 this quarter</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: "var(--color-success)", boxShadow: "0 0 10px var(--color-success)" }} />
          <div className="pl-1">
            <p className="text-xs font-medium text-muted-foreground">Monthly Gross</p>
            <p className="mt-1 font-display text-2xl font-bold">{ugx(PAYROLL_RUNS[0].gross)}</p>
            <p className="mt-1 text-[11px] text-success flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> +6.8% from last month</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: "var(--color-warning)", boxShadow: "0 0 10px var(--color-warning)" }} />
          <div className="pl-1">
            <p className="text-xs font-medium text-muted-foreground">Total Deductions</p>
            <p className="mt-1 font-display text-2xl font-bold">{ugx(PAYROLL_RUNS[0].deductions)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">14% of gross</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: "var(--color-success)", boxShadow: "0 0 10px var(--color-success)" }} />
          <div className="pl-1">
            <p className="text-xs font-medium text-muted-foreground">Net Payroll</p>
            <p className="mt-1 font-display text-2xl font-bold">{ugx(PAYROLL_RUNS[0].net)}</p>
            <p className="mt-1 text-[11px] text-success flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Last run: May 2026</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
        {([["current", "Current Month"], ["history", "Run History"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("rounded-md px-4 py-2 font-medium transition", tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{l}</button>
        ))}
      </div>

      {/* Search + filter */}
      {tab === "current" && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search employee…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-primary/60 focus:bg-card/70" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DEPARTMENTS.map((d) => (
              <button key={d} onClick={() => setDept(d)} className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition", dept === d ? "border-primary/60 bg-primary/15 text-primary" : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground")}>{d}</button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tab === "current" ? (
                <><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Dept</th><th className="px-5 py-3 text-right">Basic</th><th className="px-5 py-3 text-right">Allowances</th><th className="px-5 py-3 text-right">Deductions</th><th className="px-5 py-3 text-right">Net Pay</th><th className="px-5 py-3">Status</th></>
              ) : (
                <><th className="px-5 py-3">Period</th><th className="px-5 py-3">Processed</th><th className="px-5 py-3 text-right">Employees</th><th className="px-5 py-3 text-right">Gross</th><th className="px-5 py-3 text-right">Deductions</th><th className="px-5 py-3 text-right">Net</th><th className="px-5 py-3">Status</th></>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No records found.</td></tr>
            )}
            {(tab === "current" ? filtered as EmployeePay[] : filtered as PayrollRun[]).map((row: any) => (
              <tr key={row.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20">
                {tab === "current" ? (
                  <>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-xs font-bold text-primary-foreground">{row.name.split(" ").map((s: string) => s[0]).join("")}</span>
                        <div><p className="font-medium text-foreground">{row.name}</p><p className="text-[11px] text-muted-foreground">{row.position}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{row.department}</td>
                    <td className="px-5 py-3 text-right font-medium">{ugx(row.basicSalary)}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{ugx(row.allowances)}</td>
                    <td className="px-5 py-3 text-right text-destructive">{ugx(row.deductions)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">{ugx(row.netPay)}</td>
                    <td className="px-5 py-3"><span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium", row.status === "Active" ? "border-success/30 bg-success/15 text-success" : "border-warning/30 bg-warning/15 text-warning")}>{row.status}</span></td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3 font-medium text-foreground">{row.period}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.processed}</td>
                    <td className="px-5 py-3 text-right">{row.employees}</td>
                    <td className="px-5 py-3 text-right font-medium">{ugx(row.gross)}</td>
                    <td className="px-5 py-3 text-right text-destructive">{ugx(row.deductions)}</td>
                    <td className="px-5 py-3 text-right font-semibold">{ugx(row.net)}</td>
                    <td className="px-5 py-3"><span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium", row.status === "Paid" ? "border-success/30 bg-success/15 text-success" : row.status === "Approved" ? "border-info/30 bg-info/15 text-info" : "border-warning/30 bg-warning/15 text-warning")}>{row.status}</span></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
