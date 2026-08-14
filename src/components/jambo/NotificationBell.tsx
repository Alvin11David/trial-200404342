import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Archive,
  LogIn,
  LogOut,
  XCircle,
  UserX,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  notificationsForRole,
  type AppNotification,
} from "@/lib/pms-store";
import { useRole } from "@/lib/role";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

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

export default function NotificationBell() {
  const navigate = useNavigate();
  const { role } = useRole();
  const allNotifications = useStore((s) => s.notifications);
  const notifications = useMemo(() => notificationsForRole(allNotifications, role), [allNotifications, role]);
  const active = notifications.filter((n) => !n.archived);
  const unreadNotifs = active.filter((n) => !n.read).length;
  const recent = active.slice(0, 8);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative rounded-lg border border-border bg-card p-2 text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:text-foreground hover:shadow-sm hover:shadow-primary/10",
          )}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 transition-transform duration-200" />
          {unreadNotifs > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-destructive-foreground">
              {unreadNotifs > 99 ? "99+" : unreadNotifs}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          <div className="flex items-center gap-1">
            {unreadNotifs > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => navigate("/notifications")}
              className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="View all"
            >
              <span className="text-xs font-medium">View all</span>
            </button>
          </div>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Bell className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y divide-border">
              {recent.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "group relative flex items-start gap-3 px-4 py-3 transition hover:bg-accent/30",
                      !n.read && "bg-primary/[0.02]",
                    )}
                  >
                    <button
                      onClick={() => {
                        if (!n.read) markNotificationRead(n.id);
                        if (n.link) navigate(n.link);
                      }}
                      className="flex flex-1 items-start gap-3 text-left"
                    >
                      <span
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                          TYPE_BG[n.type],
                          TYPE_COLORS[n.type],
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "text-xs",
                              !n.read && "font-semibold",
                            )}
                          >
                            {n.title}
                          </span>
                          <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                            {timeAgo(n.ts)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {n.description}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveNotification(n.id);
                      }}
                      className="absolute right-2 top-3 hidden rounded-md p-0.5 text-muted-foreground/50 transition hover:bg-muted hover:text-foreground group-hover:block"
                      title="Archive"
                    >
                      <Archive className="h-3 w-3" />
                    </button>
                    {!n.read && (
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {active.length > 8 && (
          <button
            onClick={() => navigate("/notifications")}
            className="flex w-full items-center justify-center border-t border-border px-4 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
          >
            View all {active.length} notifications
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
