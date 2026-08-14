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
  Package,
  Utensils,
  Calendar,
  Bell,
  Clock,
  CalendarDays,
  ClipboardCheck,
  MessageSquare,
  AlarmClock,
  Building2,
  Truck,
  ArrowLeftRight,
  PackageX,
  ClipboardList,
  Gauge,
  Martini,
  FileText,
  PackageCheck,
  ChartPie,
  ChefHat,
  Landmark,
} from "lucide-react";

/* eslint-disable react-refresh/only-export-components */

export type Role =
  | "Owner / GM"
  | "Front Desk"
  | "Housekeeping"
  | "POS / Cashier"
  | "Accountant"
  | "System Administrator"
  | "Inventory Manager"
  | "Store Keeper";

export const ROLES: Role[] = [
  "Owner / GM",
  "Front Desk",
  "Housekeeping",
  "POS / Cashier",
  "Accountant",
  "System Administrator",
  "Inventory Manager",
  "Store Keeper",
];

export const ROLE_META: Record<
  Role,
  { initials: string; person: string; accent: string; tagline: string }
> = {
  "Owner / GM": {
    initials: "SN",
    person: "Sarah Nakato",
    accent: "from-blue-600 to-indigo-600",
    tagline: "Property performance at a glance",
  },
  "Front Desk": {
    initials: "AK",
    person: "Amani Kato",
    accent: "from-blue-600 to-sky-500",
    tagline: "Arrivals, departures & in-house",
  },
  Housekeeping: {
    initials: "GA",
    person: "Grace Achieng",
    accent: "from-emerald-600 to-teal-500",
    tagline: "Room status & assignments",
  },
  "POS / Cashier": {
    initials: "JM",
    person: "John Mukasa",
    accent: "from-amber-500 to-orange-500",
    tagline: "Orders, tabs & cash drawer",
  },
  Accountant: {
    initials: "PS",
    person: "Peter Ssempijja",
    accent: "from-slate-700 to-slate-500",
    tagline: "Folio, payments & GL",
  },
  "System Administrator": {
    initials: "RK",
    person: "Robert Kizza",
    accent: "from-rose-600 to-pink-500",
    tagline: "Users, roles & audit",
  },
  "Inventory Manager": {
    initials: "JM",
    person: "James Mugisha",
    accent: "from-teal-600 to-emerald-500",
    tagline: "Stock control & purchasing",
  },
  "Store Keeper": {
    initials: "DO",
    person: "David Okello",
    accent: "from-orange-500 to-amber-500",
    tagline: "Approve & issue stock from store",
  },
};

export type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  badge?: string;
};

export type NavGroup = { section: string; items: NavItem[] };

const COMMON: { [k: string]: NavItem } = {
  dashboard: { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  checkIn: { label: "Check-In", to: "/check-in", icon: LogIn },
  groups: { label: "Groups & Blocks", to: "/groups", icon: Users },
  guestServices: { label: "Guest Services", to: "/guest-services", icon: ClipboardCheck },

  reservations: { label: "Reservation/Check In", to: "/reservations", icon: CalendarCheck2 },
  rooms: { label: "Rooms", to: "/rooms", icon: BedDouble },
  guests: { label: "Guests", to: "/guests", icon: Users },
  housekeeping: { label: "Housekeeping", to: "/housekeeping", icon: Sparkles },
  billing: { label: "Billing & Folio", to: "/billing", icon: Receipt },
  masterBilling: { label: "Master Billing", to: "/billing/master", icon: Landmark },
  payments: { label: "Payments", to: "/billing", icon: CreditCard },
  pos: { label: "POS", to: "/pos", icon: ShoppingCart },
  reports: { label: "Reports", to: "/reports", icon: BarChart3 },
  accounting: { label: "Accounting", to: "/accounting", icon: Wallet },
  revenue: { label: "Revenue", to: "/reports", icon: TrendingUp },
  rates: { label: "Rates & Availability", to: "/rates", icon: Tag },
  audit: { label: "Audit Trail", to: "/audit", icon: FileSearch },
  identity: { label: "Identity & Access", to: "/identity", icon: ShieldCheck },
  settings: { label: "Settings", to: "/settings", icon: Settings },
  roomsConfig: { label: "Room & Property Config", to: "/settings/rooms", icon: BedDouble },
  properties: { label: "Properties", to: "/admin/properties", icon: Building2 },
  notifications: { label: "Notifications", to: "/notifications", icon: Bell },
  events: { label: "Events", to: "/events", icon: Calendar },
  invoices: { label: "Invoices", to: "/invoices", icon: Receipt },
  hr: { label: "HR Dashboard", to: "/hr", icon: Users },
  leaveManagement: { label: "Leave Management", to: "/hr/leaves", icon: CalendarDays },
  inventoryDashboard: { label: "Dashboard", to: "/inventory", icon: Package },
  inventoryList: { label: "Inventory List", to: "/inventory/list", icon: Package },
  purchaseOrders: { label: "Purchase Orders", to: "/inventory/purchase-orders", icon: FileSearch },
  suppliers: { label: "Suppliers", to: "/inventory/suppliers", icon: Truck },
  transfers: { label: "Transfers", to: "/inventory/transfers", icon: ArrowLeftRight },
  adjustments: { label: "Adjustments", to: "/inventory/adjustments", icon: PackageX },
  stocktaking: { label: "Stocktaking", to: "/inventory/stocktaking", icon: ClipboardList },
  parLevels: { label: "Reorder / Par Levels", to: "/inventory/par-levels", icon: Gauge },
  requisitions: { label: "Requisitions", to: "/inventory/requisitions", icon: ClipboardCheck },
  consumption: { label: "Department Consumption", to: "/inventory/consumption", icon: ChartPie },
  foodCost: { label: "Food Cost", to: "/inventory/food-cost", icon: ChefHat },
  posOrders: { label: "Orders", to: "/pos/orders", icon: ShoppingCart },
  posMenu: { label: "Menu", to: "/pos/menu", icon: Utensils },
  posSettings: { label: "POS Settings", to: "/settings/pos", icon: ShoppingCart },
  miscChargesSettings: { label: "Service Price List", to: "/settings/misc-charges", icon: Package },
  rateCard: { label: "Service Prices", to: "/services", icon: Tag },
  schedule: { label: "Schedule", to: "/hr/schedule", icon: Clock },
  minibar: { label: "Minibar", to: "/housekeeping/minibar", icon: Martini },
  receiving: { label: "Goods Receipts / Receiving", to: "/inventory/receiving", icon: PackageCheck },
  supplierInvoices: { label: "Supplier Invoices", to: "/inventory/supplier-invoices", icon: FileText },
};

export const ROLE_NAV: Record<Role, NavGroup[]> = {
  "Owner / GM": [
    { section: "Overview", items: [COMMON.dashboard] },
    {
      section: "Operations",
      items: [
        COMMON.reservations,
        COMMON.groups,
        COMMON.guestServices,
        COMMON.rooms,
        COMMON.rateCard,
        COMMON.minibar,
      ],
    },
    { section: "Finance", items: [COMMON.billing, COMMON.masterBilling, COMMON.invoices, COMMON.reports] },
    {
      section: "Inventory",
      items: [
        COMMON.inventoryDashboard,
        COMMON.inventoryList,
        COMMON.requisitions,
        COMMON.consumption,
        COMMON.foodCost,
        COMMON.purchaseOrders,
        COMMON.receiving,
        COMMON.supplierInvoices,
        COMMON.suppliers,
        COMMON.transfers,
        COMMON.adjustments,
        COMMON.stocktaking,
        COMMON.parLevels,
      ],
    },
    { section: "HR", items: [COMMON.hr, COMMON.leaveManagement, COMMON.schedule] },
    { section: "System", items: [COMMON.notifications, COMMON.audit, COMMON.settings] },
  ],
  "Front Desk": [
    { section: "Today", items: [COMMON.dashboard] },
    {
      section: "Front Office",
      items: [
        COMMON.guests,
        COMMON.reservations,
        COMMON.groups,
        COMMON.guestServices,
        COMMON.rooms,
        COMMON.billing,
        COMMON.masterBilling,
      ],
    },
    { section: "Reports", items: [COMMON.reports] },
    { section: "Reference", items: [COMMON.notifications, COMMON.rateCard] },
  ],
  Housekeeping: [
    { section: "Today", items: [COMMON.dashboard] },
    { section: "Operations", items: [COMMON.housekeeping, COMMON.rooms] },
  ],
  "POS / Cashier": [
    { section: "Today", items: [COMMON.dashboard] },
    {
      section: "Point of Sale",
      items: [COMMON.pos, COMMON.posOrders, COMMON.posMenu, COMMON.billing, COMMON.masterBilling, COMMON.rateCard],
    },
  ],
  Accountant: [
    { section: "Today", items: [COMMON.dashboard] },
    {
      section: "Finance",
      items: [COMMON.billing, COMMON.masterBilling, COMMON.invoices, COMMON.accounting, COMMON.supplierInvoices, COMMON.reports, COMMON.rateCard],
    },
  ],
  "System Administrator": [
    { section: "Today", items: [COMMON.dashboard] },
    {
      section: "Administration",
      items: [COMMON.identity, COMMON.audit, COMMON.settings, COMMON.roomsConfig, COMMON.posSettings, COMMON.miscChargesSettings, COMMON.properties, COMMON.notifications],
    },
  ],
  "Inventory Manager": [
    { section: "Today", items: [COMMON.dashboard] },
    {
      section: "Inventory",
      items: [COMMON.inventoryDashboard, COMMON.inventoryList, COMMON.purchaseOrders, COMMON.requisitions, COMMON.consumption, COMMON.foodCost, COMMON.receiving, COMMON.supplierInvoices, COMMON.suppliers, COMMON.transfers, COMMON.adjustments, COMMON.stocktaking, COMMON.parLevels],
    },
    { section: "Reports", items: [COMMON.reports] },
    { section: "Notifications", items: [COMMON.notifications] },
  ],
  "Store Keeper": [
    { section: "Today", items: [COMMON.dashboard] },
    {
      section: "Inventory",
      items: [COMMON.inventoryDashboard, COMMON.inventoryList, COMMON.requisitions, COMMON.consumption, COMMON.foodCost, COMMON.purchaseOrders, COMMON.receiving, COMMON.suppliers, COMMON.transfers, COMMON.adjustments, COMMON.stocktaking, COMMON.parLevels],
    },
    { section: "Notifications", items: [COMMON.notifications] },
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
