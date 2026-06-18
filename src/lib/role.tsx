import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  CalendarCheck2,
  BedDouble,
  Users,
  Sparkles,
  Receipt,
  BarChart3,
  Wallet,
  Settings,
  ShoppingCart,
  ShieldCheck,
  FileSearch,
  CreditCard,
  TrendingUp,
  Tag,
  LogIn,
  LogOut,
} from "lucide-react";

/* eslint-disable react-refresh/only-export-components */

export type Role =
  | "Owner / GM"
  | "Front Desk"
  | "Housekeeping"
  | "POS / Cashier"
  | "Reservations / Revenue"
  | "Accountant"
  | "System Administrator";

export const ROLES: Role[] = [
  "Owner / GM",
  "Front Desk",
  "Housekeeping",
  "POS / Cashier",
  "Reservations / Revenue",
  "Accountant",
  "System Administrator",
];

export const ROLE_META: Record<
  Role,
  { initials: string; person: string; accent: string; tagline: string }
> = {
  "Owner / GM": { initials: "SN", person: "Sarah Nakato", accent: "from-blue-600 to-indigo-600", tagline: "Property performance at a glance" },
  "Front Desk": { initials: "AK", person: "Amani Kato", accent: "from-blue-600 to-sky-500", tagline: "Arrivals, departures & in-house" },
  Housekeeping: { initials: "GA", person: "Grace Achieng", accent: "from-emerald-600 to-teal-500", tagline: "Room status & assignments" },
  "POS / Cashier": { initials: "JM", person: "John Mukasa", accent: "from-amber-500 to-orange-500", tagline: "Orders, tabs & cash drawer" },
  "Reservations / Revenue": { initials: "EN", person: "Esther Nambi", accent: "from-violet-600 to-fuchsia-500", tagline: "Bookings, rates & forecast" },
  Accountant: { initials: "PS", person: "Peter Ssempijja", accent: "from-slate-700 to-slate-500", tagline: "Folio, payments & GL" },
  "System Administrator": { initials: "RK", person: "Robert Kizza", accent: "from-rose-600 to-pink-500", tagline: "Users, roles & audit" },
};

export type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

export type NavGroup = { section: string; items: NavItem[] };

const COMMON: { [k: string]: NavItem } = {
  dashboard: { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  checkIn: { label: "Check-In", to: "/check-in", icon: LogIn },
  checkOut: { label: "Check-Out", to: "/check-out", icon: LogOut },
  reservations: { label: "Reservations", to: "/reservations", icon: CalendarCheck2 },
  rooms: { label: "Rooms", to: "/rooms", icon: BedDouble },
  guests: { label: "Guests", to: "/guests", icon: Users },
  housekeeping: { label: "Housekeeping", to: "/housekeeping", icon: Sparkles },
  billing: { label: "Billing & Folio", to: "/billing", icon: Receipt },
  payments: { label: "Payments", to: "/billing", icon: CreditCard },
  pos: { label: "POS", to: "/pos", icon: ShoppingCart },
  reports: { label: "Reports", to: "/reports", icon: BarChart3 },
  accounting: { label: "Accounting", to: "/accounting", icon: Wallet },
  revenue: { label: "Revenue", to: "/reports", icon: TrendingUp },
  rates: { label: "Rates & Availability", to: "/rates", icon: Tag },
  audit: { label: "Audit Trail", to: "/audit", icon: FileSearch },
  identity: { label: "Identity & Access", to: "/identity", icon: ShieldCheck },
  settings: { label: "Settings", to: "/settings", icon: Settings },
};

export const ROLE_NAV: Record<Role, NavGroup[]> = {
  "Owner / GM": [
    { section: "Overview", items: [COMMON.dashboard] },
    { section: "Operations", items: [COMMON.reservations, COMMON.rooms, COMMON.housekeeping] },
    { section: "Revenue", items: [COMMON.rates] },
    { section: "Finance", items: [COMMON.billing, COMMON.reports] },
    { section: "System", items: [COMMON.audit, COMMON.settings] },
  ],
  "Front Desk": [
    { section: "Today", items: [COMMON.dashboard] },
    { section: "Front Office", items: [COMMON.reservations, COMMON.rooms, COMMON.guests, COMMON.billing] },
    { section: "Reference", items: [COMMON.rates] },
  ],
  Housekeeping: [
    { section: "Today", items: [COMMON.dashboard] },
    { section: "Operations", items: [COMMON.housekeeping, COMMON.rooms] },
  ],
  "POS / Cashier": [
    { section: "Today", items: [COMMON.dashboard] },
    { section: "Point of Sale", items: [COMMON.pos, COMMON.billing] },
  ],
  "Reservations / Revenue": [
    { section: "Today", items: [COMMON.dashboard] },
    { section: "Bookings", items: [COMMON.reservations, COMMON.rooms, COMMON.guests] },
    { section: "Revenue", items: [COMMON.rates, COMMON.revenue] },
  ],
  Accountant: [
    { section: "Today", items: [COMMON.dashboard] },
    { section: "Finance", items: [COMMON.billing, COMMON.accounting, COMMON.reports] },
    { section: "Reference", items: [COMMON.rates] },
  ],
  "System Administrator": [
    { section: "Today", items: [COMMON.dashboard] },
    { section: "Administration", items: [COMMON.identity, COMMON.audit, COMMON.settings] },
  ],
};

type Ctx = { role: Role; setRole: (r: Role) => void };
const RoleContext = createContext<Ctx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("Owner / GM");

  useEffect(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("jambo-role") : null;
    if (stored && (ROLES as string[]).includes(stored)) setRoleState(stored as Role);
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    if (typeof localStorage !== "undefined") localStorage.setItem("jambo-role", r);
  };
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
