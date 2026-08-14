import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
  LogOut,
  LogIn,
  Plus,
  RefreshCw,
  WifiOff,
  Menu,
  X,
  Home,
  Sun,
  Moon,
  Globe,
  BellRing,
  Palette,
  Monitor,
  CalendarDays,
} from "lucide-react";
import { Store, type LucideIcon } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { ROLE_META, ROLE_NAV, ROLES, useRole, type Role } from "@/lib/role";
import { useTheme } from "@/hooks/use-theme";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { Download, ThumbsUp, ThumbsDown, ShieldCheck } from "lucide-react";
import { useStore, setCurrentUser, recordLogin, recordLogout, updateNotifSettings, switchProperty, currentProperty, approveRequest, rejectRequest, startAudit, completeAudit, setAuditStatus, fmtUGX, businessDate, type ApprovalRequest } from "@/lib/pms-store";
import FrontDeskAuditView from "@/features/frontdesk/FrontDeskAuditView";
import POSAuditView from "@/features/pos/POSAuditView";
import NotificationBell from "./NotificationBell";
import { useNotificationPoller } from "@/hooks/use-notification-poller";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const PROFILE_IDS: Record<string, string> = {
  "Owner / GM": "E004",
  "Front Desk": "E001",
  Housekeeping: "E002",
  "POS / Cashier": "E005",
  Accountant: "E007",
  "System Administrator": "E009",
};

const NAV_ICON_COLORS: Record<string, { pale: string; vivid: string }> = {
  "/dashboard": { pale: "#93C5FD", vivid: "#3B82F6" },
  "/check-in": { pale: "#86EFAC", vivid: "#22C55E" },
  "/reservations": { pale: "#A5B4FC", vivid: "#6366F1" },
  "/rooms": { pale: "#7DD3FC", vivid: "#0EA5E9" },
  "/guests": { pale: "#C4B5FD", vivid: "#8B5CF6" },
  "/housekeeping": { pale: "#F9A8D4", vivid: "#EC4899" },
  "/billing": { pale: "#94A3B8", vivid: "#64748B" },
  "/pos": { pale: "#FCD34D", vivid: "#F59E0B" },
  "/pos/orders": { pale: "#FCD34D", vivid: "#F59E0B" },
  "/pos/menu": { pale: "#FDBA74", vivid: "#F97316" },
  "/reports": { pale: "#67E8F9", vivid: "#06B6D4" },
  "/accounting": { pale: "#FDE047", vivid: "#EAB308" },
  "/rates": { pale: "#F0ABFC", vivid: "#D946EF" },
  "/audit": { pale: "#FDA4AF", vivid: "#F43F5E" },
  "/identity": { pale: "#A5B4FC", vivid: "#6366F1" },
  "/identity/roles": { pale: "#A5B4FC", vivid: "#6366F1" },
  "/settings": { pale: "#9CA3AF", vivid: "#6B7280" },
  "/notifications": { pale: "#FCD34D", vivid: "#F59E0B" },
  "/events": { pale: "#D8B4FE", vivid: "#A855F7" },
  "/invoices": { pale: "#94A3B8", vivid: "#64748B" },
  "/hr": { pale: "#C4B5FD", vivid: "#8B5CF6" },
  "/hr/leaves": { pale: "#C4B5FD", vivid: "#8B5CF6" },
  "/hr/schedule": { pale: "#94A3B8", vivid: "#64748B" },
  "/inventory": { pale: "#99F6E4", vivid: "#14B8A6" },
  "/inventory/list": { pale: "#99F6E4", vivid: "#14B8A6" },
  "/inventory/purchase-orders": { pale: "#FDA4AF", vivid: "#F43F5E" },
  "/inventory/suppliers": { pale: "#FDE68A", vivid: "#EAB308" },
  "/inventory/transfers": { pale: "#A5B4FC", vivid: "#6366F1" },
  "/inventory/adjustments": { pale: "#FCA5A5", vivid: "#EF4444" },
  "/inventory/stocktaking": { pale: "#A7F3D0", vivid: "#10B981" },
  "/inventory/par-levels": { pale: "#99F6E4", vivid: "#0D9488" },
  "/inventory/requisitions": { pale: "#86EFAC", vivid: "#22C55E" },
  "/inventory/consumption": { pale: "#F9A8D4", vivid: "#DB2777" },
  "/inventory/food-cost": { pale: "#FED7AA", vivid: "#EA580C" },
  "/inventory/receiving": { pale: "#A7F3D0", vivid: "#059669" },
  "/inventory/supplier-invoices": { pale: "#FDE68A", vivid: "#D97706" },
  "/housekeeping/minibar": { pale: "#F9A8D4", vivid: "#DB2777" },
};

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "check-in": "Check-In",
  reservations: "Reservations",
  rooms: "Rooms",
  guests: "Guests",
  housekeeping: "Housekeeping",
  billing: "Billing & Folio",
  reports: "Reports",
  accounting: "Accounting",
  rates: "Rates & Availability",
  inventory: "Inventory",
  pos: "POS",
  hr: "HR",
  events: "Events",
  notifications: "Notifications",
  settings: "Settings",
  audit: "Audit Trail",
  identity: "Identity & Access",
  new: "New",
  list: "List",
  requisitions: "Requisitions",
  consumption: "Department Consumption",
  "food-cost": "Food Cost",
  "purchase-orders": "Purchase Orders",
  suppliers: "Suppliers",
  transfers: "Transfers",
  adjustments: "Adjustments",
  stocktaking: "Stocktaking",
  "par-levels": "Par Levels",
  orders: "Orders",
  menu: "Menu",
  leaves: "Leaves",
  employees: "Employees",
  schedule: "Schedule",
  minibar: "Minibar",
  receiving: "Goods Receipts / Receiving",
  "supplier-invoices": "Supplier Invoices",
};

function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = BREADCRUMB_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
    const isLast = i === segments.length - 1;
    return { label, href, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <Link to="/dashboard" className="hover:text-foreground transition-colors" aria-label="Home">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <span className="text-muted-foreground/40">/</span>
          {crumb.isLast ? (
            <span className="font-medium text-foreground" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link to={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { role, setRole } = useRole();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const canCreateBooking = role === "Front Desk" || role === "Owner / GM";
  const { online, syncCount } = useOnlineStatus();
  const rawNotifs = useStore((s) => s.notifications);
  const unreadNotifs = rawNotifs.filter(
    (n) => !n.read && (!n.targetRoles || n.targetRoles.length === 0 || n.targetRoles.includes(role)),
  ).length;
  const notifSettings = useStore((s) => s.notifSettings);
  const { canInstall, install } = useInstallPrompt();
  const meta = ROLE_META[role];
  const nav = ROLE_NAV[role];
  const prevRoleRef = useRef(role);

  useEffect(() => {
    const prev = prevRoleRef.current;
    if (prev !== role) {
      recordLogout(ROLE_META[prev].person, prev);
    }
    setCurrentUser(meta.person, role);
    recordLogin(meta.person, role);
    prevRoleRef.current = role;
  }, [role]);

  useNotificationPoller();

  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* Audit timer — check every 60s if wall time ≥ configured auditTime */
  const auditStatus = useStore((s) => s.auditStatus);
  const tenant = useStore((s) => s.tenant);
  useEffect(() => {
    if (auditStatus !== "idle") return;
    const id = setInterval(() => {
      const prop = currentProperty();
      if (!prop?.auditTime) return;
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const [h, m] = prop.auditTime.split(":").map(Number);
      const auditMin = h * 60 + m;
      if (currentMin >= auditMin && currentMin < auditMin + 5) {
        startAudit();
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [auditStatus]);

  /* Auto-complete audit when status reaches "calculating" */
  const curBusinessDate = useStore((s) => s.businessDate);
  useEffect(() => {
    if (auditStatus === "calculating") {
      setPrevDate(curBusinessDate);
      completeAudit();
    }
  }, [auditStatus]);

  /* Compute audit day figures for completion dialog */
  const [prevDate, setPrevDate] = useState("");
  const storeCharges = useStore((s) => s.charges);
  const storePayments = useStore((s) => s.payments);
  const dayCharges = useMemo(() => {
    if (!prevDate) return { fdRevenue: 0, fdSales: 0, posRevenue: 0, posSales: 0 };
    const fdRevenue = storeCharges.filter((c) => c.date === prevDate && c.chargeSource !== "pos_charge").reduce((s, c) => s + c.amount, 0);
    const fdSales = storePayments.filter((p) => p.date === prevDate && p.status === "confirmed").reduce((s, p) => s + p.amount, 0);
    const posRevenue = storeCharges.filter((c) => c.date === prevDate && c.chargeSource === "pos_charge").reduce((s, c) => s + c.amount, 0);
    const posSales = storePayments.filter((p) => p.date === prevDate && p.status === "confirmed").reduce((s, p) => s + p.amount, 0);
    return { fdRevenue, fdSales, posRevenue, posSales };
  }, [prevDate, storeCharges, storePayments]);
  const now = clock.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = clock.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // derive page title
  const seg = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const title = seg
    .split("-")
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join(" ");

  return (
    <>
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden cursor-pointer"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-svh flex-col border-r border-sidebar-border bg-sidebar shadow-2xl shadow-black/20 transition-all duration-300",
          "md:left-3 md:top-3 md:h-[calc(100vh-24px)] md:rounded-2xl md:border md:border-white/5",
          collapsed ? "w-[72px]" : "w-[200px] xl:w-[244px]",
          "max-w-[85vw] sm:max-w-none",
          "-translate-x-full md:translate-x-0",
          mobileOpen && "translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            collapsed && "justify-center px-2",
          )}
          style={{ color: "var(--color-sidebar-foreground)" }}
        >
          <div
            style={
              {
                "--color-foreground": "#E2E8F0",
                "--color-muted-foreground": "#94A3B8",
              } as React.CSSProperties
            }
          >
            {collapsed ? (
              <Logo showText={false} size="sm" src="/Jambo logo 2025 full name white.png" />
            ) : (
              <div className="flex items-center gap-3">
                <img
                  src="/favicon.webp"
                  alt="Jambo PMS"
                  className="h-8 object-contain"
                />
                <div className="flex flex-col leading-tight">
                  <span className="font-display text-sm font-bold tracking-tight text-[#E2E8F0]">
                    Jambo<span className="text-gradient-primary"> PMS</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#94A3B8]">
                    Property Management
                  </span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="sidebar-scroll flex-1 overflow-y-auto px-2 py-4 [overscroll-behavior:contain]">
          {nav.map((group) => (
            <div key={group.section} className="mb-4">
              {!collapsed && (
                <div className="mb-2 px-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">
                    {group.section}
                  </span>
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((it, idx) => {
                  const hasMoreSpecificMatch = nav.some((g) =>
                    g.items.some(
                      (i) =>
                        i.to !== it.to &&
                        i.to.length > it.to.length &&
                        (pathname === i.to || pathname.startsWith(i.to + "/")),
                    ),
                  );
                  const active =
                    pathname === it.to ||
                    (pathname.startsWith(it.to + "/") && !hasMoreSpecificMatch);
                  const Icon = it.icon;
                  const c = NAV_ICON_COLORS[it.to];
                  return (
                    <li
                      key={it.label + it.to}
                      style={{ animationDelay: `${idx * 30}ms` }}
                      className={cn(!collapsed && "animate-sidebar-item-enter")}
                    >
                      <Link
                        to={it.to}
                        className={cn(
                          "group/nav-item relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          collapsed && "justify-center px-0",
                          active && c
                            ? "shadow-sm"
                            : "hover:bg-sidebar-accent/80 text-sidebar-foreground/80 hover:text-sidebar-foreground",
                        )}
                        style={
                          active && c
                            ? {
                                background: `${c.vivid}18`,
                                color: c.vivid,
                                boxShadow: `inset 0 0 0 1px ${c.vivid}30`,
                              }
                            : undefined
                        }
                      >
                        {active && c && (
                          <>
                            <span
                              className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full animate-sidebar-accent-in"
                              style={{
                                background: `linear-gradient(to bottom, ${c.vivid}, ${c.pale})`,
                                boxShadow: `0 0 10px ${c.vivid}80`,
                              }}
                            />
                            <span
                              className="absolute inset-0 rounded-xl opacity-30 animate-sidebar-glow-rotate"
                              style={{
                                background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${c.vivid}15, transparent 40%)`,
                              }}
                            />
                          </>
                        )}
                        <span
                          className="relative flex shrink-0 items-center justify-center rounded-lg p-0.5 transition-all duration-200"
                          style={active && c ? { background: `${c.vivid}20` } : undefined}
                        >
                          <Icon
                            className={cn(
                              "h-[18px] w-[18px] transition-all duration-200",
                              "group-hover/nav-item:scale-110 group-hover/nav-item:-translate-y-0.5",
                              active
                                ? "animate-sidebar-icon-float"
                                : "group-hover/nav-item:animate-sidebar-icon-bounce-hover",
                            )}
                            style={{
                              color: c ? (active ? c.vivid : c.pale) : undefined,
                            }}
                          />
                        </span>
                        {!collapsed && (
                          <>
                            <span
                              className={cn(
                                "flex-1 truncate transition-all duration-200",
                                active && "font-semibold",
                              )}
                            >
                              {it.label}
                            </span>
                            {(it.badge || (it.to === "/notifications" && unreadNotifs > 0)) && (
                              <span
                                className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold animate-sidebar-badge-pulse"
                                style={
                                  c
                                    ? {
                                        background: `${c.vivid}20`,
                                        color: c.vivid,
                                      }
                                    : undefined
                                }
                              >
                                {it.to === "/notifications" ? unreadNotifs : it.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Gradient fade — hints scrollable content below */}
        <div className="pointer-events-none relative -mt-12 h-12 bg-gradient-to-t from-sidebar to-transparent" />

        <div className={cn("space-y-1.5 border-t border-sidebar-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]", collapsed && "px-2")}>
          {canInstall && (
            <button
              onClick={install}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary/20",
                collapsed && "px-0",
              )}
              title="Install Jambo PMS"
            >
              <Download className="h-3.5 w-3.5" />
              {!collapsed && <span className="hidden md:inline">Install App</span>}
            </button>
          )}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/50 py-2 text-xs font-medium text-sidebar-foreground/60 transition-all duration-200 hover:border-sidebar-foreground/20 hover:text-sidebar-foreground",
              collapsed && "px-0",
            )}
            title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
            {!collapsed && <span className="hidden md:inline">{resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "hidden md:flex w-full items-center justify-center gap-1.5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 py-2 text-xs font-medium text-sidebar-foreground/60 transition-all duration-200 hover:border-sidebar-foreground/20 hover:text-sidebar-foreground",
              collapsed && "px-0",
            )}
          >
            <ChevronLeft
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                collapsed && "rotate-180",
              )}
            />
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[margin] duration-300",
          collapsed ? "md:ml-[96px]" : "md:ml-[224px] xl:ml-[268px]",
        )}
      >
        {/* Header — permanent sticky top bar, outside the rounded panel */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b border-border/50 bg-white/70 px-4 backdrop-blur-xl dark:bg-card/80 md:gap-3 md:px-6 md:shadow-[0_1px_0_0_var(--color-border)]">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-foreground md:text-base">
              {title || "Dashboard"}
            </h1>
            <p className="text-[10px] text-muted-foreground md:text-[11px]">
              {now} · {time}
            </p>
          </div>

          <div className="relative ml-auto hidden max-w-[180px] flex-1 md:block lg:ml-6 lg:max-w-sm group">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
            <input
              placeholder="Search guests, rooms, folios…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-card"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {canCreateBooking && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-primary/25 hover:scale-105 active:scale-95">
                    <Plus className="h-3.5 w-3.5" /> New Reservation/Check In
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <DropdownMenuItem asChild>
                    <Link
                      to="/reservations/new"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20">
                        <CalendarDays className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium">New Reservation</p>
                        <p className="text-[10px] text-muted-foreground">Create a new booking</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/check-in/new"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-success/20 to-success/5 text-success ring-1 ring-success/20">
                        <LogIn className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium">New Check In</p>
                        <p className="text-[10px] text-muted-foreground">Walk-in check-in for guests without a reservation</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Role switcher */}
            <RoleSwitcher role={role} setRole={setRole} />

            {/* Property switcher */}
            <PropertySwitcher />

            <NotificationBell />

            {/* Offline / sync indicator */}
            {(!online || syncCount > 0) && (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-medium",
                  online
                    ? "border-warning/30 bg-warning/10 text-warning"
                    : "border-destructive/30 bg-destructive/10 text-destructive",
                )}
                title={online ? `${syncCount} pending sync` : "Working offline"}
              >
                {online ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                {online ? `${syncCount}` : "Offline"}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-border bg-card pl-1 pr-2.5 py-1 text-left transition hover:border-primary/40">
                  <span
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br text-[11px] font-bold text-white",
                      meta.accent,
                    )}
                  >
                    {meta.initials}
                  </span>
                  <span className="hidden text-xs leading-tight md:block">
                    <span className="block font-semibold text-foreground">{meta.person}</span>
                    <span className="text-[10px] text-muted-foreground">{role}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Signed in</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to={`/hr/profile?id=${PROFILE_IDS[role]}`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPrefsOpen(true)}>
                  <Palette className="mr-2 h-3.5 w-3.5" /> Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    recordLogout(meta.person, role);
                    localStorage.removeItem("jambo-auth");
                    window.location.href = "/";
                  }}
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {!online && (
          <div className="mx-0 flex items-center justify-center gap-2 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive md:mx-4">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            You're offline — changes will sync when reconnected
          </div>
        )}
        <div className="mx-0 flex flex-1 flex-col overflow-y-auto rounded-none border-0 bg-transparent shadow-none md:mx-4 md:mb-4 md:rounded-2xl md:border md:border-border/60 md:bg-card md:shadow-sm">
          <main className="flex-1 px-4 pt-5 pb-12 md:px-6 md:pt-7 md:pb-16">
            <Breadcrumbs pathname={pathname} />
            {children}
          </main>
        </div>
      </div>
    </div>

    <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preferences</DialogTitle>
          <DialogDescription>Customise your app experience.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Theme</span>
            </div>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition " +
                    (theme === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")
                  }
                >
                  {t === "light" && <Sun className="mx-auto mb-1 h-4 w-4" />}
                  {t === "dark" && <Moon className="mx-auto mb-1 h-4 w-4" />}
                  {t === "system" && <Monitor className="mx-auto mb-1 h-4 w-4" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Region</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Timezone</Label>
                <Select defaultValue="Africa/Kampala">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Kampala">Africa/Kampala (UTC+3)</SelectItem>
                    <SelectItem value="Africa/Nairobi">Africa/Nairobi (UTC+3)</SelectItem>
                    <SelectItem value="Africa/Lagos">Africa/Lagos (UTC+1)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Currency</Label>
                <Select defaultValue="UGX">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UGX">UGX (Shilling)</SelectItem>
                    <SelectItem value="KES">KES (Shilling)</SelectItem>
                    <SelectItem value="USD">USD (Dollar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Notifications</span>
            </div>
            <div className="space-y-3">
              {[
                { key: "email" as const, label: "Email notifications", desc: "Receive updates via email" },
                { key: "sound" as const, label: "Sound alerts", desc: "Play sound on new notifications" },
                { key: "checkinReminders" as const, label: "Check-in reminders", desc: "Remind about upcoming arrivals" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifSettings[item.key]}
                    onCheckedChange={(v) => updateNotifSettings({ [item.key]: v })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Approval interrupt — auto popup for GM */}
    <ApprovalInterrupt role={role} actor={meta.person} />

    {/* End-of-day audit overlays */}
    {auditStatus === "front_desk" && <FrontDeskAuditView />}
    {auditStatus === "pos" && <POSAuditView />}
    {auditStatus === "completed" && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl mx-4">
          <h2 className="text-lg font-bold">Day Closed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Business date advanced to <span className="font-medium text-foreground">{curBusinessDate}</span>.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Front Desk Revenue</p>
              <p className="text-lg font-bold tabular-nums">{fmtUGX(dayCharges.fdRevenue)}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Front Desk Sales</p>
              <p className="text-lg font-bold tabular-nums">{fmtUGX(dayCharges.fdSales)}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">POS Revenue</p>
              <p className="text-lg font-bold tabular-nums">{fmtUGX(dayCharges.posRevenue)}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">POS Sales</p>
              <p className="text-lg font-bold tabular-nums">{fmtUGX(dayCharges.posSales)}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setAuditStatus("idle")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Start New Day
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function ApprovalInterrupt({ role, actor }: { role: string; actor: string }) {
  const approvalRequests = useStore((s) => s.approvalRequests);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const dismissedRef = useRef<Set<string>>(new Set());

  const pending = approvalRequests.filter((r) => r.status === "pending");
  const visible = pending.filter((r) => !dismissedRef.current.has(r.id));
  const current = visible[0] ?? null;
  const idx = current ? pending.indexOf(current) : -1;

  console.log("[ApprovalInterrupt] role:", role, "pending:", pending.length, "visible:", visible.length, "current:", current?.id ?? null, "total requests:", approvalRequests.length);
  if (current) console.log("[ApprovalInterrupt] current action:", current.action, "folio:", current.folioId, "by:", current.requestedBy);
  if (role === "Owner / GM" && pending.length > 0 && !current) console.log("[ApprovalInterrupt] WARNING: pending exists but none visible — likely all dismissed");

  if (role !== "Owner / GM" || !current) {
    if (role === "Owner / GM" && pending.length > 0) console.log("[ApprovalInterrupt] role=GM but !current — dismissed ref has:", Array.from(dismissedRef.current));
    return null;
  }

  const dismiss = () => {
    dismissedRef.current.add(current.id);
    setRejectingId(null);
    setRejectReason("");
  };

  const handleApprove = () => {
    approveRequest(current.id, actor, role);
    toast.success(`${current.action.replace(/_/g, " ")} approved`);
    setRejectingId(null);
    setRejectReason("");
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectRequest(current.id, actor, rejectReason.trim());
    toast.success(`${current.action.replace(/_/g, " ")} rejected`);
    setRejectingId(null);
    setRejectReason("");
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 rounded-2xl border border-amber-200/60 bg-card shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] dark:border-amber-900/30">
        <div className="flex items-center gap-3 border-b border-amber-200/40 bg-gradient-to-r from-amber-50/60 via-amber-50/20 to-transparent px-6 py-4 dark:from-amber-950/30">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm dark:from-amber-500 dark:to-amber-600">
            <ShieldCheck className="h-5.5 w-5.5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">Approval Required</h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                {idx + 1} / {pending.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/80">A Front Desk action needs your review</p>
          </div>
          <button onClick={dismiss} className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors">
            Skip &rarr;
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
            <div>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-amber-400" />
                Action
              </span>
              <p className="mt-1 text-sm font-semibold capitalize">{current.action.replace(/_/g, " ")}</p>
            </div>
            <div>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-blue-400" />
                Folio
              </span>
              <p className="mt-1 font-mono text-sm font-medium text-blue-600 dark:text-blue-400">{current.folioId}</p>
            </div>
            <div>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                Requested by
              </span>
              <p className="mt-1 text-sm font-medium">{current.requestedBy}</p>
            </div>
            <div>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-purple-400" />
                Role
              </span>
              <p className="mt-1 text-sm">{current.requestedByRole}</p>
            </div>
            <div className="col-span-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-slate-400" />
                Time
              </span>
              <p className="mt-1 text-sm">{new Date(current.requestedAt).toLocaleString()}</p>
            </div>
          </div>

          {current.payload && Object.keys(current.payload).length > 0 && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Details</span>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                {Object.entries(current.payload).map(([key, value]) => (
                  <div key={key} className="col-span-2 sm:col-span-1">
                    <span className="text-muted-foreground">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</span>
                    <p className="mt-0.5 text-sm font-medium break-all">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={handleApprove}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.97]"
            >
              <ThumbsUp className="h-4 w-4" />
              Approve
            </button>

            {rejectingId === current.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="flex-1 rounded-xl border border-destructive/30 bg-background px-3 py-2.5 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-destructive focus:ring-1 focus:ring-destructive/20"
                  autoFocus
                />
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-red-600 hover:to-red-700 active:scale-[0.97] disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  onClick={() => { setRejectingId(null); setRejectReason(""); }}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setRejectingId(current.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-5 py-2.5 text-sm font-semibold text-destructive transition-all hover:bg-destructive/5 hover:border-destructive/50 active:scale-[0.97]"
              >
                <ThumbsDown className="h-4 w-4" />
                Reject
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PropertySwitcher() {
  const properties = useStore((s) => s.properties);
  const currentProp = currentProperty();
  const [open, setOpen] = useState(false);

  if (properties.length <= 1) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/40">
          <span className="hidden md:inline truncate max-w-[120px]">{currentProp.name}</span>
          <span className="md:hidden">Property</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-foreground">Switch property</p>
            <p className="text-[10px] text-muted-foreground">
              Change active tenant context
            </p>
          </div>
        </div>
        <div className="-mx-1">
          {properties.map((p) => {
            const active = currentProp.id === p.id;
            return (
              <DropdownMenuItem
                key={p.id}
                onClick={() => { switchProperty(p.id); setOpen(false); }}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-3 py-2.5",
                  active && "bg-primary/10",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-md bg-gradient-to-br text-xs font-bold text-white",
                    active ? "from-primary to-primary/80" : "from-muted to-muted/80",
                  )}
                >
                  {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", active && "text-primary")}>{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {p.city}, {p.country} · {p.propertyType.replace(/_/g, " ")}
                  </p>
                </div>
                {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RoleSwitcher({ role, setRole }: { role: Role; setRole: (r: Role) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/40">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="hidden sm:inline">{role}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-foreground">Switch role</p>
            <p className="text-[10px] text-muted-foreground">
              Experience the app as a different role
            </p>
          </div>
        </div>
        <div className="-mx-1">
          {ROLES.map((r) => {
            const m = ROLE_META[r];
            const active = role === r;
            return (
              <DropdownMenuItem
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5",
                  active && "bg-primary/10",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-md bg-gradient-to-br text-xs font-bold text-white",
                    m.accent,
                  )}
                >
                  {m.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", active && "text-primary")}>{r}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {m.person} — {m.tagline}
                  </p>
                </div>
                {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
