import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Users,
  Building2,
  BadgeCheck,
  MapPin,
  Phone,
  Mail,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/hr")({
  head: () => ({ meta: [{ title: "Employees — Jambo ERP" }] }),
  component: HRLayout,
});

type Department = "Front Office" | "Housekeeping" | "F&B" | "Kitchen" | "Maintenance" | "Security" | "Admin" | "Sales";

type EmployeeStatus = "Active" | "On Leave" | "Suspended" | "Terminated";

type Employee = {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  department: Department;
  position: string;
  status: EmployeeStatus;
  email: string;
  phone: string;
  location: string;
  joinDate: string;
  employeeNo: string;
  manager: string;
};

const departments: Department[] = [
  "Front Office", "Housekeeping", "F&B", "Kitchen", "Maintenance", "Security", "Admin", "Sales",
];

const employees: Employee[] = [
  { id: "E001", name: "Amani Kato", avatar: "", initials: "AK", department: "Front Office", position: "Front Office Manager", status: "Active", email: "amani@jambo.ug", phone: "+256 700 111 001", location: "Kampala", joinDate: "2022-03-15", employeeNo: "JAM-1001", manager: "Sarah Nakato" },
  { id: "E002", name: "Grace Achieng", avatar: "", initials: "GA", department: "Housekeeping", position: "Housekeeping Supervisor", status: "Active", email: "grace@jambo.ug", phone: "+256 700 111 002", location: "Kampala", joinDate: "2021-11-01", employeeNo: "JAM-1002", manager: "Amani Kato" },
  { id: "E003", name: "David Ochieng", avatar: "", initials: "DO", department: "Kitchen", position: "Head Chef", status: "Active", email: "david@jambo.ug", phone: "+256 700 111 003", location: "Entebbe", joinDate: "2023-01-20", employeeNo: "JAM-1003", manager: "Amani Kato" },
  { id: "E004", name: "Sarah Nakato", avatar: "", initials: "SN", department: "Admin", position: "General Manager", status: "Active", email: "sarah@jambo.ug", phone: "+256 700 111 004", location: "Kampala", joinDate: "2020-06-10", employeeNo: "JAM-1004", manager: "Board" },
  { id: "E005", name: "John Mukasa", avatar: "", initials: "JM", department: "F&B", position: "F&B Manager", status: "On Leave", email: "john@jambo.ug", phone: "+256 700 111 005", location: "Jinja", joinDate: "2022-08-05", employeeNo: "JAM-1005", manager: "Sarah Nakato" },
  { id: "E006", name: "Mary Nakibuuka", avatar: "", initials: "MN", department: "Housekeeping", position: "Room Attendant", status: "Active", email: "mary@jambo.ug", phone: "+256 700 111 006", location: "Kampala", joinDate: "2023-05-12", employeeNo: "JAM-1006", manager: "Grace Achieng" },
  { id: "E007", name: "Peter Ssempijja", avatar: "", initials: "PS", department: "Maintenance", position: "Chief Engineer", status: "Active", email: "peter@jambo.ug", phone: "+256 700 111 007", location: "Kampala", joinDate: "2021-04-18", employeeNo: "JAM-1007", manager: "Sarah Nakato" },
  { id: "E008", name: "Esther Nambi", avatar: "", initials: "EN", department: "Front Office", position: "Receptionist", status: "Active", email: "esther@jambo.ug", phone: "+256 700 111 008", location: "Kampala", joinDate: "2023-09-01", employeeNo: "JAM-1008", manager: "Amani Kato" },
  { id: "E009", name: "Robert Kizza", avatar: "", initials: "RK", department: "Security", position: "Security Lead", status: "Active", email: "robert@jambo.ug", phone: "+256 700 111 009", location: "Kampala", joinDate: "2022-02-14", employeeNo: "JAM-1009", manager: "Sarah Nakato" },
  { id: "E010", name: "Faith Akello", avatar: "", initials: "FA", department: "Sales", position: "Sales Executive", status: "Terminated", email: "faith@jambo.ug", phone: "+256 700 111 010", location: "Kampala", joinDate: "2022-07-22", employeeNo: "JAM-1010", manager: "Sarah Nakato" },
  { id: "E011", name: "Samuel Wasswa", avatar: "", initials: "SW", department: "Kitchen", position: "Sous Chef", status: "Active", email: "samuel@jambo.ug", phone: "+256 700 111 011", location: "Entebbe", joinDate: "2023-03-08", employeeNo: "JAM-1011", manager: "David Ochieng" },
  { id: "E012", name: "Helen Nanteza", avatar: "", initials: "HN", department: "Front Office", position: "Night Auditor", status: "On Leave", email: "helen@jambo.ug", phone: "+256 700 111 012", location: "Kampala", joinDate: "2023-11-15", employeeNo: "JAM-1012", manager: "Amani Kato" },
];

const statusStyles: Record<EmployeeStatus, string> = {
  Active: "bg-success/15 text-success border-success/30",
  "On Leave": "bg-warning/15 text-warning border-warning/30",
  Suspended: "bg-destructive/15 text-destructive border-destructive/30",
  Terminated: "bg-muted/50 text-muted-foreground border-border/40",
};

function HRLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/hr") return <Outlet />;
  return <EmployeeList />;
}

function EmployeeList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<Department | "All">("All");

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        const matchSearch =
          !search ||
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.position.toLowerCase().includes(search.toLowerCase()) ||
          e.employeeNo.toLowerCase().includes(search.toLowerCase());
        const matchDept = deptFilter === "All" || e.department === deptFilter;
        return matchSearch && matchDept;
      }),
    [search, deptFilter],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your workforce — {employees.length} total,{" "}
            {employees.filter((e) => e.status === "Active").length} active.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/hr/payroll"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <Users className="h-4 w-4" />
            Payroll
          </Link>
          <Link
            to="/hr/leaves"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <BadgeCheck className="h-4 w-4" />
            Leaves
          </Link>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50">
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by name, position, or employee no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-primary/60 focus:bg-card/70"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["All", ...departments].map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d as Department | "All")}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                deptFilter === d
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {d === "All" ? "All" : d}
            </button>
          ))}
        </div>
      </div>

      {/* Employee grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((emp) => (
          <button
            key={emp.id}
            onClick={() => navigate({ to: "/hr/profile", search: { id: emp.id } })}
            className="glass card-hover group relative rounded-2xl border border-border/50 p-5 text-left transition w-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-sm font-bold text-primary-foreground">
                {emp.initials}
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  statusStyles[emp.status],
                )}
              >
                {emp.status}
              </span>
            </div>
            <h3 className="font-display font-semibold text-foreground truncate">{emp.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{emp.position}</p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{emp.department}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{emp.location}</span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No employees match your filters.
        </div>
      )}
    </div>
  );
}
