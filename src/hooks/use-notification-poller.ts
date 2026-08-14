import { useEffect, useRef } from "react";
import { pushNotification, useStore } from "@/lib/pms-store";

const REMINDER_INTERVAL = 5 * 60 * 1000;

export function useNotificationPoller() {
  const settings = useStore((s) => s.notifSettings);
  const reservations = useStore((s) => s.reservations);
  const remindersOn = settings.checkinReminders;
  const remindedRef = useRef(new Set<string>());
  const reservationsRef = useRef(reservations);

  reservationsRef.current = reservations;

  useEffect(() => {
    if (!remindersOn) return;

    const check = () => {
      const today = new Date().toISOString().slice(0, 10);
      for (const r of reservationsRef.current) {
        if (
          r.status === "confirmed" &&
          r.checkIn === today &&
          !remindedRef.current.has(r.id)
        ) {
          remindedRef.current.add(r.id);
          pushNotification({
            type: "check_in",
            title: "Upcoming check-in reminder",
            description: `${r.guestName} arrives today — Room ${r.roomId ?? "not assigned"}`,
            link: `/reservations/${r.id}`,
            reservationId: r.id,
            targetRoles: ["Front Desk", "Housekeeping", "Owner / GM"],
          });
        }
      }
    };

    check();
    const interval = setInterval(check, REMINDER_INTERVAL);
    return () => clearInterval(interval);
  }, [remindersOn]);
}
