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
  "hr": "HR",
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
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link to="/dashboard" className="hover:text-foreground transition-colors" aria-label="Home">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <span className="text-muted-foreground/40">/</span>
          {crumb.isLast ? (
            <span className="font-medium text-foreground" aria-current="page">{crumb.label}</span>
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
  const time = clock.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

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
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "sticky top-0 z-20 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300",
          collapsed ? "w-[72px]" : "w-[200px] xl:w-[244px]",
          "fixed -translate-x-full md:relative md:translate-x-0",
          mobileOpen && "translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            collapsed && "justify-center px-2",
          )}
        >
          {collapsed ? <Logo showText={false} size="sm" /> : <Logo size="sm" />}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {nav.map((group) => (
            <div key={group.section} className="mb-5">
              {!collapsed && (
                <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                  {group.section}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((it) => {
                  const active = pathname === it.to || pathname.startsWith(it.to + "/");
                  const Icon = it.icon;
                  return (
                    <li key={it.label + it.to}>
                      <Link
                        to={it.to}
                        className={cn(
                          "group/nav-item relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-foreground",
                          collapsed && "justify-center px-0",
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-sm animate-sidebar-accent-in" />
                        )}
                        <span className={cn(
                          "relative flex shrink-0 items-center justify-center rounded-lg p-0.5 transition-all duration-200",
                          active && "animate-sidebar-glow-pulse",
                        )}>
                          <Icon
                            className={cn(
                              "h-[18px] w-[18px] transition-all duration-200",
                              active
                                ? "text-primary animate-sidebar-icon-pulse drop-shadow-[0_0_6px_var(--color-primary)]"
                                : "text-muted-foreground group-hover/nav-item:scale-110",
                            )}
                          />
                        </span>
                        {!collapsed && (
                          <>
                            <span className={cn(
                              "flex-1 truncate transition-all duration-200",
                              active && "font-semibold",
                            )}>
                              {it.label}
                            </span>
                            {it.badge && (
                              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
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

        <div className={cn("border-t border-sidebar-border p-3", collapsed && "px-2")}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-sidebar-border bg-card py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b border-border bg-card/80 px-4 backdrop-blur md:gap-3 md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-foreground md:text-base">{title || "Dashboard"}</h1>
            <p className="text-[10px] text-muted-foreground md:text-[11px]">{now} · {time}</p>
          </div>

          <div className="relative ml-auto hidden max-w-[180px] flex-1 md:block lg:ml-6 lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search guests, rooms, folios…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/reservations/new"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> New Booking
            </Link>

            {/* Role switcher */}
            <RoleSwitcher role={role} setRole={setRole} />

            <button
              onClick={() => navigate({ to: "/notifications" })}
              className={cn(
                "relative rounded-lg border border-border bg-card p-2 text-muted-foreground transition hover:border-primary/40 hover:text-foreground",
                pathname === "/notifications" && "border-primary/40 bg-primary/5 text-primary",
              )}
            >
              <Bell className="h-4 w-4" />
            </button>

            {/* Offline / sync indicator */}
            {(!online || syncCount > 0) && (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-medium",
                  online ? "border-warning/30 bg-warning/10 text-warning" : "border-destructive/30 bg-destructive/10 text-destructive",
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
                  <Link to="/"><LogOut className="mr-2 h-3.5 w-3.5" /> Sign out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 md:px-6 md:py-7">
          <Breadcrumbs pathname={pathname} />
          {children}
        </main>
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
            <p className="text-[10px] text-muted-foreground">Experience the app as a different role</p>
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
