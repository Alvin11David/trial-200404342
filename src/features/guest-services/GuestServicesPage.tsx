import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ClipboardCheck,
  MessageSquare,
  Plus,
  CheckCircle2,
  X,
  ChevronDown,
  AlarmClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useStore,
  upsertServiceRequest,
  deleteServiceRequest,
  pendingServiceRequests,
  serviceRequestById,
  upsertMessage,
  deleteMessage,
  pendingMessages,
  messageById,
  roomById,
  reservationById,
  nextMessageId,
  fmtUGX,
} from "@/lib/pms-store";
import type {
  ServiceRequest,
  Message,
} from "@/lib/pms-store";

type Tab = "requests" | "messages";

const TABS: { key: Tab; label: string; icon: typeof ClipboardCheck }[] = [
  { key: "requests", label: "Guest Requests", icon: ClipboardCheck },
  { key: "messages", label: "Messages", icon: MessageSquare },
];

export default function GuestServicesPage() {
  const [tab, setTab] = useState<Tab>("requests");
  const serviceRequests = useStore((s) => s.serviceRequests);
  const messages = useStore((s) => s.messages);
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);

  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);

  const openRequests = useMemo(
    () => serviceRequests.filter((r) => r.status === "open" || r.status === "in_progress"),
    [serviceRequests],
  );
  const completedRequests = useMemo(
    () => serviceRequests.filter((r) => r.status === "completed"),
    [serviceRequests],
  );
  const pendingMsgs = useMemo(() => messages.filter((m) => m.status === "pending"), [messages]);
  const deliveredMsgs = useMemo(() => messages.filter((m) => m.status !== "pending"), [messages]);

  const roomLabel = (roomId: string) => {
    const r = rooms.find((x) => x.id === roomId);
    return r ? `${r.id}${r.floor ? ` (Floor ${r.floor})` : ""}` : roomId;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-card p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all",
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================== REQUESTS TAB ==================== */}
      {tab === "requests" && (
        <RequestsTab
          openRequests={openRequests}
          completedRequests={completedRequests}
          showNew={showNewRequest}
          setShowNew={setShowNewRequest}
          roomLabel={roomLabel}
        />
      )}

      {/* ==================== MESSAGES TAB ==================== */}
      {tab === "messages" && (
        <MessagesTab
          pendingMsgs={pendingMsgs}
          deliveredMsgs={deliveredMsgs}
          showNew={showNewMessage}
          setShowNew={setShowNewMessage}
          roomLabel={roomLabel}
        />
      )}
    </div>
  );
}

/* ==================== Requests Tab ==================== */

const REQUEST_TYPES = [
  { value: "housekeeping", label: "Housekeeping" },
  { value: "maintenance", label: "Maintenance" },
  { value: "fb_delivery", label: "F&B Delivery" },
  { value: "complaint", label: "Complaint" },
  { value: "other", label: "Other" },
] as const;

function RequestsTab({
  openRequests,
  completedRequests,
  showNew,
  setShowNew,
  roomLabel,
}: {
  openRequests: ServiceRequest[];
  completedRequests: ServiceRequest[];
  showNew: boolean;
  setShowNew: (v: boolean) => void;
  roomLabel: (id: string) => string;
}) {
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);
  const [filter, setFilter] = useState<"all" | "open" | "completed">("open");

  const displayed = filter === "all"
    ? [...openRequests, ...completedRequests]
    : filter === "open"
      ? openRequests
      : completedRequests;

  const handleComplete = (req: ServiceRequest) => {
    upsertServiceRequest({ ...req, status: "completed", fulfilledAt: new Date().toISOString() });
    toast.success("Request marked as completed");
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold">Guest Requests</h3>
          <p className="text-[11px] text-muted-foreground/60">
            {openRequests.length} open · {completedRequests.length} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/50 p-0.5">
            {(["open", "all", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "open" ? "Open" : f === "all" ? "All" : "Completed"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" />
            New Request
          </button>
        </div>
      </div>

      {showNew && (
        <NewRequestForm onClose={() => setShowNew(false)} />
      )}

      {displayed.length === 0 ? (
        <div className="px-5 py-14 text-center text-xs text-muted-foreground/50">
          <ClipboardCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
          No guest requests yet.
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {displayed.map((req) => {
            const res = reservationById(req.reservationId);
            const room = roomById(req.roomId);
            return (
              <div key={req.id} className="flex items-start gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{req.description}</span>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                        req.urgency === "urgent"
                          ? "border-destructive/30 bg-destructive/15 text-destructive"
                          : "border-border/50 bg-muted/30 text-muted-foreground",
                      )}
                    >
                      {req.urgency}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                        req.status === "completed"
                          ? "border-success/30 bg-success/15 text-success"
                          : req.status === "in_progress"
                            ? "border-info/30 bg-info/15 text-info"
                            : "border-warning/30 bg-warning/15 text-warning",
                      )}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/60">
                    <span>{req.requestType.replace("_", " ")}</span>
                    <span>Room {roomLabel(req.roomId)}</span>
                    {reservationById(req.reservationId) && (
                      <span>{reservationById(req.reservationId)!.guestName}</span>
                    )}
                    <span>{new Date(req.requestedAt).toLocaleString()}</span>
                  </div>
                </div>
                {req.status !== "completed" && (
                  <button
                    onClick={() => handleComplete(req)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Complete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewRequestForm({ onClose }: { onClose: () => void }) {
  const reservations = useStore((s) => s.reservations);
  const rooms = useStore((s) => s.rooms);
  const [reservationId, setReservationId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [requestType, setRequestType] = useState<ServiceRequest["requestType"]>("housekeeping");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<ServiceRequest["urgency"]>("normal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationId || !description) {
      toast.error("Please fill in all required fields");
      return;
    }
    const res = reservationById(reservationId);
    upsertServiceRequest({
      id: "",
      propertyId: "JAMBO-UG-001",
      reservationId,
      roomId: roomId || res?.roomId || "",
      requestType,
      description,
      urgency,
      status: "open",
      requestedAt: new Date().toISOString(),
      slaBreached: false,
      isChargeable: false,
      createdAt: "",
      updatedAt: "",
    });
    toast.success("Request logged");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      <h4 className="text-xs font-semibold">New Guest Request</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select value={reservationId} onValueChange={(v) => { setReservationId(v); const res = reservationById(v); if (res?.roomId) setRoomId(res.roomId); }}>
          <SelectTrigger className="rounded-xl border border-border bg-background px-3 py-2 text-xs h-auto">
            <SelectValue placeholder="Select guest…" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {reservations.filter((r) => r.status === "checked_in").map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.guestName} — {r.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roomId} onValueChange={setRoomId}>
          <SelectTrigger className="rounded-xl border border-border bg-background px-3 py-2 text-xs h-auto">
            <SelectValue placeholder="Auto from reservation" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {rooms.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={requestType} onValueChange={(v) => setRequestType(v as ServiceRequest["requestType"])}>
          <SelectTrigger className="rounded-xl border border-border bg-background px-3 py-2 text-xs h-auto">
            <SelectValue placeholder="Select type…" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {REQUEST_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={urgency} onValueChange={(v) => setUrgency(v as ServiceRequest["urgency"])}>
          <SelectTrigger className="rounded-xl border border-border bg-background px-3 py-2 text-xs h-auto">
            <SelectValue placeholder="Select urgency…" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the request…"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
        rows={2}
        required
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Log Request
        </button>
      </div>
    </form>
  );
}

/* ==================== Messages Tab ==================== */

function MessagesTab({
  pendingMsgs,
  deliveredMsgs,
  showNew,
  setShowNew,
  roomLabel,
}: {
  pendingMsgs: Message[];
  deliveredMsgs: Message[];
  showNew: boolean;
  setShowNew: (v: boolean) => void;
  roomLabel: (id: string) => string;
}) {
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const displayed = filter === "pending" ? pendingMsgs : [...pendingMsgs, ...deliveredMsgs];

  const handleDeliver = (msg: Message) => {
    upsertMessage({
      ...msg,
      status: "delivered",
      deliveredAt: new Date().toISOString(),
      deliveredBy: "Front Desk",
    });
    toast.success("Message marked as delivered");
  };

  const handleAcknowledge = (msg: Message) => {
    upsertMessage({
      ...msg,
      status: "acknowledged",
      acknowledgedAt: new Date().toISOString(),
    });
    toast.success("Guest acknowledged receipt");
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold">Guest Messages</h3>
          <p className="text-[11px] text-muted-foreground/60">
            {pendingMsgs.length} pending delivery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/50 p-0.5">
            {(["pending", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "pending" ? "Pending" : "All"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" />
            New Message
          </button>
        </div>
      </div>

      {showNew && (
        <NewMessageForm onClose={() => setShowNew(false)} />
      )}

      {displayed.length === 0 ? (
        <div className="px-5 py-14 text-center text-xs text-muted-foreground/50">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
          No messages recorded.
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {displayed.map((msg) => {
            const res = reservationById(msg.reservationId);
            return (
              <div key={msg.id} className="flex items-start gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">For {msg.guestName}</span>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                        msg.status === "pending"
                          ? "border-warning/30 bg-warning/15 text-warning"
                          : msg.status === "delivered"
                            ? "border-info/30 bg-info/15 text-info"
                            : "border-success/30 bg-success/15 text-success",
                      )}
                    >
                      {msg.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{msg.messageText}</p>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/60">
                    <span>From: {msg.callerName}</span>
                    {msg.callerPhone && <span>Tel: {msg.callerPhone}</span>}
                    <span>Room {roomLabel(msg.roomId)}</span>
                    {res && <span>{res.guestName}</span>}
                    <span>Taken by: {msg.takenBy}</span>
                    <span>Via: {msg.deliveryMethod.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {msg.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleDeliver(msg)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Deliver
                      </button>
                    </>
                  )}
                  {msg.status === "delivered" && (
                    <button
                      onClick={() => handleAcknowledge(msg)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewMessageForm({ onClose }: { onClose: () => void }) {
  const reservations = useStore((s) => s.reservations);
  const [reservationId, setReservationId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [messageText, setMessageText] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<Message["deliveryMethod"]>("phone");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationId || !callerName || !messageText) {
      toast.error("Please fill in all required fields");
      return;
    }
    const res = reservationById(reservationId);
    upsertMessage({
      id: "",
      propertyId: "JAMBO-UG-001",
      reservationId,
      roomId: res?.roomId ?? "",
      guestName: res?.guestName ?? "",
      callerName,
      callerPhone: callerPhone || undefined,
      messageText,
      takenBy: "Front Desk",
      deliveryMethod,
      status: "pending",
      createdAt: "",
      updatedAt: "",
    });
    toast.success("Message recorded");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      <h4 className="text-xs font-semibold">Record Guest Message</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select value={reservationId} onValueChange={(v) => { setReservationId(v); const res = reservationById(v); if (res?.roomId) setRoomId(res.roomId); }}>
          <SelectTrigger className="rounded-xl border border-border bg-background px-3 py-2 text-xs h-auto">
            <SelectValue placeholder="Select guest…" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {reservations.filter((r) => r.status === "checked_in").map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.guestName} — {r.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          value={callerName}
          onChange={(e) => setCallerName(e.target.value)}
          placeholder="Caller name *"
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
          required
        />
        <input
          value={callerPhone}
          onChange={(e) => setCallerPhone(e.target.value)}
          placeholder="Caller phone (optional)"
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
        />
        <Select value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as Message["deliveryMethod"])}>
          <SelectTrigger className="rounded-xl border border-border bg-background px-3 py-2 text-xs h-auto">
            <SelectValue placeholder="Delivery method…" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="phone">Phone call</SelectItem>
            <SelectItem value="in_person">In person</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="note_under_door">Note under door</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <textarea
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        placeholder="Message text *"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
        rows={2}
        required
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Record Message
        </button>
      </div>
    </form>
  );
}
