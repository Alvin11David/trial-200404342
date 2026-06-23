import { useState, useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
  LogOut,
  Plus,
  RefreshCw,
  WifiOff,
  Menu,
  X,
  Home,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { ROLE_META, ROLE_NAV, ROLES, useRole, type Role } from "@/lib/role";
import { getPendingSyncCount, processOutbox } from "@/lib/pms-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ICON_COLORS: Record<string, { pale: string; vivid: string }> = {
  "/dashboard": { pale: "#93C5FD", vivid: "#3B82F6" },
  "/check-in": { pale: "#86EFAC", vivid: "#22C55E" },
  "/check-out": { pale: "#FDBA74", vivid: "#F97316" },
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
  "/inventory/requisitions": { pale: "#86EFAC", vivid: "#22C55E" },
};

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "check-in": "Check-In",
  "check-out": "Check-Out",
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
  "purchase-orders": "Purchase Orders",
  orders: "Orders",
  menu: "Menu",
  leaves: "Leaves",
  employees: "Employees",
  schedule: "Schedule",
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
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role, setRole } = useRole();
  const canCreateBooking =
    role === "Front Desk" || role === "Reservations / Revenue" || role === "Owner / GM";
  const [online, setOnline] = useState(true);
  const [syncCount, setSyncCount] = useState(() => getPendingSyncCount());

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      const synced = processOutbox();
      setSyncCount(getPendingSyncCount());
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const interval = setInterval(() => setSyncCount(getPendingSyncCount()), 5000);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      clearInterval(interval);
    };
  }, []);
  const meta = ROLE_META[role];
  const nav = ROLE_NAV[role];

  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
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
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden cursor-pointer"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-20 flex h-screen flex-col border-r border-sidebar-border bg-sidebar shadow-2xl shadow-black/20 transition-[width] duration-300",
          "md:left-3 md:top-3 md:h-[calc(100vh-24px)] md:rounded-2xl md:border md:border-white/5",
          collapsed ? "w-[72px]" : "w-[200px] xl:w-[244px]",
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
            {collapsed ? <Logo showText={false} size="sm" /> : <Logo size="sm" />}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="sidebar-scroll flex-1 overflow-y-auto px-2 py-4">
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
                            {it.badge && (
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
                                {it.badge}
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

        <div className={cn("relative border-t border-sidebar-border p-3", collapsed && "px-2")}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 py-2 text-xs font-medium text-sidebar-foreground/60 transition-all duration-200 hover:border-sidebar-foreground/20 hover:text-sidebar-foreground",
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
              <Link
                to="/reservations/new"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 hover:scale-105 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" /> New Booking
              </Link>
            )}

            {/* Role switcher */}
            <RoleSwitcher role={role} setRole={setRole} />

            <button
              onClick={() => navigate({ to: "/notifications" })}
              className={cn(
                "relative rounded-lg border border-border bg-card p-2 text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:text-foreground hover:shadow-sm hover:shadow-primary/10",
                pathname === "/notifications" && "border-primary/40 bg-primary/5 text-primary",
              )}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 transition-transform duration-200 hover:animate-sidebar-icon-bounce-hover" />
            </button>

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
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" asChild>
                  <Link to="/">
                    <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="mx-0 flex flex-1 flex-col overflow-hidden rounded-none border-0 bg-transparent shadow-none md:mx-4 md:mb-4 md:rounded-2xl md:border md:border-border/60 md:bg-card md:shadow-sm">
          <main className="flex-1 px-4 py-5 md:px-6 md:py-7">
            <Breadcrumbs pathname={pathname} />
            {children}
          </main>
        </div>
      </div>
    </div>
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
