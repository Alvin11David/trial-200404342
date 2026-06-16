import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ArrowLeft, Building2, MapPin, Phone, Mail, CalendarDays, BadgeCheck, Clock, Edit3, Save, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/hr/profile")({
  head: () => ({ meta: [{ title: "Employee Profile — Jambo ERP" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : "",
  }),
  component: EmployeeProfilePage,
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

const DEPARTMENTS: Department[] = ["Front Office", "Housekeeping", "F&B", "Kitchen", "Maintenance", "Security", "Admin", "Sales"];

const ALL_EMPLOYEES: Employee[] = [
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

function EmployeeProfilePage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const employee = useMemo(() => ALL_EMPLOYEES.find((e) => e.id === id), [id]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Employee | null>(null);

  if (!employee) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/hr" className="rounded-lg border border-border/60 bg-card p-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight">Employee Not Found</h1>
        </div>
        <p className="text-sm text-muted-foreground">The employee with ID "{id}" does not exist.</p>
      </div>
    );
  }

  const handleEdit = () => {
    setForm({ ...employee });
    setEditing(true);
  };

  const handleSave = () => {
    if (!form) return;
    setEditing(false);
    setForm(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setForm(null);
  };

  const emp = editing && form ? form : employee;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/hr" className="rounded-lg border border-border/60 bg-card p-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight">Employee Profile</h1>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
                <Save className="h-4 w-4" /> Save
              </button>
              <button onClick={handleCancel} className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
                <X className="h-4 w-4" /> Cancel
              </button>
            </>
          ) : (
            <button onClick={handleEdit} className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
              <Edit3 className="h-4 w-4" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <div className="flex flex-wrap items-start gap-6">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-2xl font-bold text-primary-foreground shadow-lg">
            {emp.initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              {editing ? (
                <input value={form!.name} onChange={(e) => setForm({ ...form!, name: e.target.value })} className="font-display text-2xl font-bold bg-transparent border-b border-primary/40 outline-none text-foreground" />
              ) : (
                <h2 className="font-display text-2xl font-bold text-foreground">{emp.name}</h2>
              )}
              <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium", statusStyles[emp.status])}>{emp.status}</span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{emp.position}</p>
            <p className="text-xs text-muted-foreground">Employee #{emp.employeeNo}</p>
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-8 grid gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {([
            { icon: Building2, label: "Department", value: emp.department, key: "department" as const },
            { icon: MapPin, label: "Location", value: emp.location, key: "location" as const },
            { icon: Mail, label: "Email", value: emp.email, key: "email" as const },
            { icon: Phone, label: "Phone", value: emp.phone, key: "phone" as const },
            { icon: CalendarDays, label: "Joined", value: emp.joinDate, key: "joinDate" as const },
            { icon: User, label: "Reports to", value: emp.manager, key: "manager" as const },
          ]).map(({ icon: Icon, label, value, key }) => (
            <div key={key} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                {editing ? (
                  <input value={(form as any)[key] ?? ""} onChange={(e) => setForm({ ...form!, [key]: e.target.value })} className="mt-0.5 w-full bg-transparent border-b border-primary/40 text-sm font-medium text-foreground outline-none" />
                ) : (
                  <p className="mt-0.5 text-sm font-medium text-foreground truncate">{value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity timeline */}
      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { date: "2026-06-10", event: "Leave request submitted (Annual, 8 days)", actor: "Self" },
            { date: "2026-06-01", event: "Payroll processed — May 2026", actor: "System" },
            { date: "2026-05-20", event: "Profile updated (phone number changed)", actor: "HR Admin" },
            { date: "2026-05-01", event: "Payroll processed — April 2026", actor: "System" },
            { date: "2026-04-01", event: "Annual performance review completed", actor: "Manager" },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-primary/40" />
                {i < 4 && <div className="h-8 w-px bg-border" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{a.event}</p>
                <p className="text-[11px] text-muted-foreground">{a.date} &middot; {a.actor}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
