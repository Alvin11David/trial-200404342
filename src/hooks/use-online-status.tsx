import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { getPendingSyncCount, processOutbox } from "@/lib/pms-store";

type OnlineCtx = {
  online: boolean;
  syncCount: number;
};

const Ctx = createContext<OnlineCtx>({ online: true, syncCount: 0 });

export function OnlineProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncCount, setSyncCount] = useState(getPendingSyncCount);
  const notifiedRef = useRef(false);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      const synced = processOutbox();
      setSyncCount(getPendingSyncCount());
      if (notifiedRef.current) {
        if (synced > 0) {
          toast.success(`Back online — ${synced} change${synced !== 1 ? "s" : ""} synced`);
        } else {
          toast.success("Back online");
        }
      }
    };
    const goOffline = () => {
      setOnline(false);
      notifiedRef.current = true;
      toast.warning("You're offline — changes will sync when connected");
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const interval = setInterval(() => setSyncCount(getPendingSyncCount()), 5000);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <Ctx.Provider value={{ online, syncCount }}>
      {children}
    </Ctx.Provider>
  );
}

export function useOnlineStatus() {
  return useContext(Ctx);
}
