import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarCheck2,
  BedDouble,
  Users,
  Sparkles,
  Receipt,
  BarChart3,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Plus,
  Sun,
  Moon,
  Monitor,
  ShoppingCart,
  ClipboardList,
  UtensilsCrossed,
  Package,
  Warehouse,
  FileText,
  ClipboardCheck,
  CalendarDays,
  PartyPopper,
  ListTodo,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const nav: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Front Office",
    items: [
      { label: "Reservations", to: "/reservations", icon: CalendarCheck2, badge: "12" },
      { label: "Rooms", to: "/rooms", icon: BedDouble },
      { label: "Guests", to: "/guests", icon: Users },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Housekeeping", to: "/housekeeping", icon: Sparkles, badge: "5" },
      { label: "Billing", to: "/billing", icon: Receipt },
      { label: "Reports", to: "/reports", icon: BarChart3 },
    ],
  },
  {
    section: "Food & Beverage",
    items: [
      { label: "POS Sell", to: "/pos", icon: ShoppingCart },
      { label: "Orders", to: "/pos/orders", icon: ClipboardList },
      { label: "Menu Items", to: "/pos/menu", icon: UtensilsCrossed },
    ],
  },
  {
    section: "Stores & Inventory",
    items: [
      { label: "Stock Dashboard", to: "/inventory", icon: Package },
      { label: "Inventory List", to: "/inventory/list", icon: Warehouse },
      { label: "Purchase Orders", to: "/inventory/purchase-orders", icon: FileText },
      { label: "Requisitions", to: "/inventory/requisitions", icon: ClipboardCheck },
    ],
  },
  {
    section: "Events & Banqueting",
    items: [
      { label: "Calendar", to: "/events", icon: CalendarDays },
      { label: "Events List", to: "/events/list", icon: ListTodo },
      { label: "New Event", to: "/events/new", icon: PartyPopper },
    ],
  },
  {
    section: "System",
    items: [{ label: "Settings", to: "/settings", icon: Settings }],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen w-full mesh-bg">
      {/* Decorative glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-[40vh] opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at top, oklch(0.74 0.21 71 / 0.18), transparent 60%)",
        }}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "sticky top-0 z-20 flex h-screen shrink-0 flex-col border-r border-sidebar-border/70 bg-sidebar/70 backdrop-blur-xl transition-[width] duration-300",
          collapsed ? "w-[76px]" : "w-[260px]",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border/60 px-4",
            collapsed && "justify-center px-2",
          )}
        >
          {collapsed ? <Logo showText={false} size="sm" /> : <Logo size="sm" />}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {nav.map((group) => (
            <div key={group.section} className="mb-6">
              {!collapsed && (
                <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  {group.section}
                </div>
              )}
              <ul className="space-y-1">
                {group.items.map((it) => {
                  const active = pathname === it.to || pathname.startsWith(it.to + "/");
                  const Icon = it.icon;
                  return (
                    <li key={it.to}>
                      <Link
                        to={it.to}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                          active
                            ? "bg-gradient-to-r from-primary/20 to-primary/5 text-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-foreground",
                          collapsed && "justify-center px-0",
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_oklch(0.74_0.21_71_/_0.8)]" />
                        )}
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition",
                            active
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{it.label}</span>
                            {it.badge && (
                              <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
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

        <div className={cn("border-t border-sidebar-border/60 p-3", collapsed && "px-2")}>
          {!collapsed ? (
            <div className="glass rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-sm font-bold text-primary-foreground">
                  AK
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">Amani Kato</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    Front Office Manager
                  </div>
                </div>
                <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-xs font-bold text-primary-foreground">
              AK
            </div>
          )}

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-sidebar-border/60 py-1.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
            aria-label="Toggle sidebar"
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

      {/* Main */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/60 bg-background/60 px-6 backdrop-blur-xl">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search reservations, guests, rooms…"
              className="w-full rounded-xl border border-border/70 bg-card/40 py-2.5 pl-9 pr-16 text-sm outline-none transition focus:border-primary/60 focus:bg-card/70"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          <div className="flex items-center gap-2">
            <button className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50">
              <Plus className="h-4 w-4" />
              New Booking
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-xl border border-border/70 bg-card/40 p-2.5 text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
                  {resolvedTheme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className={theme === "light" ? "text-primary font-semibold" : ""}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className={theme === "dark" ? "text-primary font-semibold" : ""}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className={theme === "system" ? "text-primary font-semibold" : ""}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button className="relative rounded-xl border border-border/70 bg-card/40 p-2.5 text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse-glow" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
