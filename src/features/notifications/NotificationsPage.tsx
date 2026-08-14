import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  XCircle,
  LogIn,
  LogOut,
  UserX,
  Archive,
  ArchiveRestore,
  CheckCheck,
  Check,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  archiveSelectedNotifications,
  notificationsForRole,
  type AppNotification,
} from "@/lib/pms-store";
import { useRole } from "@/lib/role";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TYPE_ICON: Record<AppNotification["type"], React.ComponentType<{ className?: string }>> = {
  reservation_created: Bell,
  reservation_cancelled: XCircle,
  check_in: LogIn,
  check_out: LogOut,
  payment_received: Bell,
  no_show: UserX,
  approval_required: ShieldCheck,
  approval_update: AlertTriangle,
  low_stock: AlertTriangle,
};

const TYPE_COLORS: Record<AppNotification["type"], string> = {
  reservation_created: "text-primary",
  reservation_cancelled: "text-destructive",
  check_in: "text-success",
  check_out: "text-warning",
  payment_received: "text-primary",
  no_show: "text-warning",
  approval_required: "text-amber",
  approval_update: "text-info",
  low_stock: "text-destructive",
};

const TYPE_BG: Record<AppNotification["type"], string> = {
  reservation_created: "bg-primary/10",
  reservation_cancelled: "bg-destructive/10",
  check_in: "bg-success/10",
  check_out: "bg-warning/10",
  payment_received: "bg-primary/10",
  no_show: "bg-warning/10",
  approval_required: "bg-amber/10",
  approval_update: "bg-info/10",
  low_stock: "bg-destructive/10",
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function groupLabel(ts: string): string {
  const d = new Date(ts);
  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(d, yesterday)) return "Yesterday";
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (d >= weekAgo) return "This week";
  return "Earlier";
}

type Filter = "all" | "unread" | "read" | "archived";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { role } = useRole();
  const allNotifications = useStore((s) => s.notifications);
  const notifications = useMemo(() => notificationsForRole(allNotifications, role), [allNotifications, role]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isArchiveView = filter === "archived";

  const filtered = useMemo(() => {
    if (filter === "archived") return notifications.filter((n) => n.archived);
    if (filter === "unread") return notifications.filter((n) => !n.read && !n.archived);
    if (filter === "read") return notifications.filter((n) => n.read && !n.archived);
    return notifications.filter((n) => !n.archived);
  }, [notifications, filter]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read && !n.archived).length,
    [notifications],
  );
  const archivedCount = useMemo(
    () => notifications.filter((n) => n.archived).length,
    [notifications],
  );

  const grouped = useMemo(() => {
    const groups: { label: string; items: AppNotification[] }[] = [];
    const order = isArchiveView ? ["Today", "Yesterday", "This week", "Earlier"] : ["Today", "Yesterday", "This week", "Earlier"];
    const map = new Map<string, AppNotification[]>();
    for (const n of filtered) {
      const g = groupLabel(n.ts);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(n);
    }
    for (const label of order) {
      if (map.has(label)) groups.push({ label, items: map.get(label)! });
    }
    return groups;
  }, [filtered, isArchiveView]);

  function handleClick(n: AppNotification) {
    if (!n.read) markNotificationRead(n.id);
    if (n.link) navigate(n.link);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((n) => n.id)));
    }
  }

  function handleArchiveSelected() {
    archiveSelectedNotifications(Array.from(selected));
    setSelected(new Set());
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isArchiveView
              ? archivedCount > 0
                ? `${archivedCount} archived notification${archivedCount !== 1 ? "s" : ""}`
                : "No archived notifications"
              : unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "All caught up"
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && !isArchiveView && (
            <button
              onClick={handleArchiveSelected}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium transition",
                "hover:border-primary/40 hover:text-foreground text-muted-foreground",
              )}
            >
              <Archive className="h-3.5 w-3.5" />
              Archive ({selected.size})
            </button>
          )}
          {unreadCount > 0 && filter !== "read" && !isArchiveView && (
            <button
              onClick={markAllNotificationsRead}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground",
                "hover:border-primary/40 hover:text-foreground transition",
              )}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => { setFilter(v as Filter); setSelected(new Set()); }}>
        <TabsList>
          <TabsTrigger value="all">
            All
            <span className="ml-1.5 rounded-full bg-muted-foreground/10 px-1.5 text-[10px] font-medium text-muted-foreground">
              {notifications.filter((n) => !n.archived).length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 text-[10px] font-medium text-primary">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">
            Read
          </TabsTrigger>
          <TabsTrigger value="archived">
            <Archive className="mr-1 h-3 w-3" />
            Archived
            {archivedCount > 0 && (
              <span className="ml-1.5 rounded-full bg-muted-foreground/10 px-1.5 text-[10px] font-medium text-muted-foreground">
                {archivedCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Select all bar */}
      {filtered.length > 0 && !isArchiveView && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            {selected.size > 0
              ? `${selected.size} selected`
              : "Select all"}
          </label>
          {selected.size > 0 && (
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground underline transition hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* List */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-16 text-center">
          <div className="relative mb-8">
            <svg width="200" height="180" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <style>{`
                  @keyframes bellSwing {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-8deg); }
                    75% { transform: rotate(8deg); }
                  }
                  @keyframes floatUp {
                    0% { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(-40px) scale(0.6); }
                  }
                  @keyframes floatUp2 {
                    0% { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(-50px) scale(0.5); }
                  }
                  @keyframes floatUp3 {
                    0% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-30px); }
                  }
                  @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                  }
                  .bell-group { animation: bellSwing 3s ease-in-out infinite; transform-origin: 100px 30px; }
                  .dot-1 { animation: floatUp 2.5s ease-out infinite; }
                  .dot-2 { animation: floatUp2 3s ease-out infinite 0.8s; }
                  .dot-3 { animation: floatUp3 2s ease-out infinite 1.6s; }
                  .bell-shadow { animation: bounce 3s ease-in-out infinite; }
                `}</style>
              </defs>

              <ellipse cx="100" cy="170" rx="50" ry="6" fill="oklch(0 0 0 / 0.06)" className="bell-shadow" />

              <g className="bell-group">
                <path d="M100 28c-20 0-36 16-36 36v24l-10 18c-3 5 1 12 7 12h78c6 0 10-7 7-12l-10-18V64c0-20-16-36-36-36z"
                  fill="oklch(0.62 0.18 264 / 0.12)" stroke="oklch(0.49 0.18 264 / 0.3)" strokeWidth="2.5" />
                <rect x="90" y="22" width="20" height="6" rx="3"
                  fill="oklch(0.62 0.18 264 / 0.12)" stroke="oklch(0.49 0.18 264 / 0.3)" strokeWidth="2" />
                <ellipse cx="100" cy="100" rx="28" ry="5"
                  fill="oklch(0.62 0.18 264 / 0.06)" stroke="oklch(0.49 0.18 264 / 0.2)" strokeWidth="2.5" />
                <circle cx="100" cy="65" r="4" fill="oklch(0.62 0.18 264 / 0.25)" />
                <line x1="88" y1="44" x2="82" y2="50" stroke="oklch(0.49 0.18 264 / 0.2)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="112" y1="44" x2="118" y2="50" stroke="oklch(0.49 0.18 264 / 0.2)" strokeWidth="2.5" strokeLinecap="round" />
              </g>

              <rect x="152" y="52" width="18" height="18" rx="5"
                fill="oklch(0.65 0.25 25 / 0.7)" className="dot-1"
                transform="rotate(12 161 61)" />
              <text x="157" y="65" fontSize="10" fill="white" fontWeight="700" className="dot-1">1</text>

              <rect x="28" y="68" width="14" height="14" rx="4"
                fill="oklch(0.65 0.25 25 / 0.7)" className="dot-2"
                transform="rotate(-8 35 75)" />
              <text x="32" y="79" fontSize="9" fill="white" fontWeight="700" className="dot-2">2</text>

              <rect x="168" y="82" width="10" height="10" rx="3"
                fill="oklch(0.62 0.18 264 / 0.3)" className="dot-3" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">
            {isArchiveView ? "No archived notifications" : filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {isArchiveView
              ? "Archived notifications will appear here."
              : filter === "unread"
                ? "You've read everything. Check back later for updates."
                : filter === "read"
                  ? "No read notifications yet."
                  : "When something happens — like a new reservation or check-in — you'll see it here."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.label}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </h2>
              <div className="space-y-1">
                {group.items.map((n) => {
                  const Icon = TYPE_ICON[n.type] ?? Bell;
                  const checked = selected.has(n.id);
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "group relative flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:bg-accent/50",
                        n.read
                          ? "border-transparent bg-transparent"
                          : "border-primary/15 bg-primary/[0.02]",
                        checked && "border-primary/40 bg-primary/[0.04]",
                      )}
                    >
                      {!isArchiveView && (
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(n.id)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
                        />
                      )}
                      <button
                        onClick={() => handleClick(n)}
                        className="flex flex-1 items-start gap-3 text-left"
                      >
                        <span
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                            TYPE_BG[n.type],
                            TYPE_COLORS[n.type],
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={cn(
                                "text-sm",
                                !n.read && "font-semibold",
                              )}
                            >
                              {n.title}
                            </span>
                            <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                              {timeAgo(n.ts)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                            {n.description}
                          </p>
                        </div>
                      </button>

                      <div className="flex flex-col gap-1 self-start pt-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {n.read ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationRead(n.id);
                            }}
                            className="rounded-md p-1 text-muted-foreground/50 transition hover:bg-muted hover:text-foreground"
                            title="Mark as unread"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationRead(n.id);
                            }}
                            className="rounded-md p-1 text-muted-foreground/50 transition hover:bg-muted hover:text-foreground"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveNotification(n.id);
                          }}
                          className="rounded-md p-1 text-muted-foreground/50 transition hover:bg-muted hover:text-foreground"
                          title="Archive"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {!n.read && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
