import { Link } from "react-router-dom";
import { X, ArrowRight, MoveRight } from "lucide-react";
import {
  checkOut,
  findAvailableRooms,
  fmtUGX,
  noShowReservation,
  reservationById,
  roomById,
  roomTypeById,
  updateReservation,
  useStore,
  cancelReservation,
  changeRoom,
} from "@/lib/pms-store";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/shared/components/TimePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CheckInDialog({
  reservationId,
  onClose,
}: {
  reservationId: string;
  onClose: (toast?: { tone: "ok" | "err"; msg: string }) => void;
}) {
  const res = reservationById(reservationId);
  if (!res) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Check in {res.guestName}</h3>
            <p className="text-xs text-muted-foreground">
              {res.id} · {res.checkIn} → {res.checkOut}
            </p>
          </div>
          <button
            onClick={() => onClose()}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Use the full check-in wizard to verify guest details, assign a room, and secure payment.
          </p>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={() => onClose()}
            className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"
          >
            Cancel
          </button>
          <Link
            to={`/check-in/${reservationId}`}
            onClick={() => onClose()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Open Check-In <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function EditDialog({
  reservationId,
  onClose,
}: {
  reservationId: string;
  onClose: (toast?: { tone: "ok" | "err"; msg: string }) => void;
}) {
  const res = reservationById(reservationId);
  const roomTypes = useStore((s) => s.roomTypes);

  const [guestName, setGuestName] = useState(res?.guestName ?? "");
  const [guestEmail, setGuestEmail] = useState(res?.guestEmail ?? "");
  const [guestPhone, setGuestPhone] = useState(res?.guestPhone ?? "");
  const [roomTypeId, setRoomTypeId] = useState(res?.roomTypeId ?? "");
  const [checkIn, setCheckIn] = useState(res?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(res?.checkOut ?? "");
  const [adults, setAdults] = useState(res?.adults ?? 1);
  const [children, setChildren] = useState(res?.children ?? 0);
  const [ratePerNight, setRatePerNight] = useState(res?.ratePerNight ?? 0);
  const [mealPlan, setMealPlan] = useState(res?.mealPlan ?? "RO");
  const [deposit, setDeposit] = useState(res?.deposit ?? 0);
  const [discount, setDiscount] = useState(res?.discount ?? 0);
  const [arrivalTime, setArrivalTime] = useState(res?.arrivalTime ?? "");
  const [extraBeds, setExtraBeds] = useState(res?.extraBeds ?? 0);
  const [purpose, setPurpose] = useState(res?.purpose ?? "");
  const [carReg, setCarReg] = useState(res?.carReg ?? "");
  const [specialRequests, setSpecialRequests] = useState(res?.specialRequests ?? "");

  if (!res) return null;

  const submit = () => {
    const patch: Record<string, unknown> = {
      guestName,
      guestEmail,
      guestPhone,
      roomTypeId,
      checkIn,
      checkOut,
      adults,
      children,
      mealPlan,
      deposit: deposit || undefined,
      discount: discount || undefined,
      arrivalTime: arrivalTime || undefined,
      extraBeds: extraBeds || undefined,
      purpose: purpose || undefined,
      carReg: carReg || undefined,
      specialRequests: specialRequests || undefined,
    };
    const r = updateReservation(reservationId, patch);
    onClose(
      r.ok
        ? { tone: "ok", msg: "Reservation updated successfully." }
        : { tone: "err", msg: r.error },
    );
  };

  const nights = Math.max(
    1,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000),
  );
  const total = nights * ratePerNight;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Edit Reservation</h3>
            <p className="text-xs text-muted-foreground">{res.id}</p>
          </div>
          <button
            onClick={() => onClose()}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 max-h-[60vh] overflow-y-auto space-y-4 pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Guest name</label>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Email</label>
            <input
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Phone</label>
            <input
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Room type</label>
            <Select value={roomTypeId} onValueChange={setRoomTypeId}>
              <SelectTrigger className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {rt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Meal plan</label>
            <Select value={mealPlan} onValueChange={setMealPlan}>
              <SelectTrigger className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
                <SelectValue placeholder="Select meal plan" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { id: "RO", label: "Room Only" },
                  { id: "BB", label: "Bed & Breakfast" },
                  { id: "HB", label: "Half Board" },
                  { id: "FB", label: "Full Board" },
                ].map((mp) => (
                  <SelectItem key={mp.id} value={mp.id}>
                    {mp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Check-in</label>
            <DatePicker value={checkIn} onChange={setCheckIn} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Check-out</label>
            <DatePicker value={checkOut} onChange={setCheckOut} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Adults</label>
            <input
              type="number"
              min={1}
              max={10}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Children</label>
            <input
              type="number"
              min={0}
              max={10}
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Rate per night (UGX)
            </label>
            {res.status !== "open" ? (
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground">
                <span className="tabular-nums font-medium">UGX {ratePerNight.toLocaleString()}</span>
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Locked</span>
              </div>
            ) : (
              <input
                type="number"
                min={0}
                step={1000}
                value={ratePerNight}
                onChange={(e) => setRatePerNight(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Arrival time</label>
            <TimePicker value={arrivalTime} onChange={setArrivalTime} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Extra beds</label>
            <input
              type="number"
              min={0}
              max={5}
              value={extraBeds}
              onChange={(e) => setExtraBeds(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Purpose of visit
            </label>
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Car registration
            </label>
            <input
              value={carReg}
              onChange={(e) => setCarReg(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div className="col-span-2 rounded-lg bg-muted/30 p-3 text-sm">
            <div className="flex justify-between">
              <span>Rate × nights</span>
              <span>{fmtUGX(total)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>-{fmtUGX(discount)}</span>
              </div>
            )}
            {deposit > 0 && (
              <div className="flex justify-between text-green-500">
                <span>Deposit</span>
                <span>{fmtUGX(deposit)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-border pt-1 font-bold">
              <span>Balance due</span>
              <span>{fmtUGX(total - discount)}</span>
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Special Requests</label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div className="col-span-2 rounded-lg bg-muted/30 p-3 text-center text-sm">
            <span className="text-muted-foreground">
              {nights} night{nights !== 1 && "s"} × {fmtUGX(ratePerNight)} ={" "}
            </span>
            <span className="font-bold text-foreground">{fmtUGX(total)}</span>
          </div>
        </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onClose()}
            className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

export function CancelDialog({
  reservationId,
  onClose,
}: {
  reservationId: string;
  onClose: (toast?: { tone: "ok" | "err"; msg: string }) => void;
}) {
  const res = reservationById(reservationId);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [chargeFee, setChargeFee] = useState(true);

  if (!res) return null;

  const submit = () => {
    const finalReason = reason === "Other" ? customReason || undefined : reason || undefined;
    cancelReservation(reservationId, { reason: finalReason, chargeFee, actor: "Front Desk", role: "Front Desk" });
    onClose({ tone: "ok", msg: "Reservation cancelled." });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-destructive">Cancel Reservation</h3>
            <p className="text-xs text-muted-foreground">
              {res.id} · {res.guestName}
            </p>
          </div>
          <button
            onClick={() => onClose()}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to cancel this reservation? This action cannot be undone.
          </p>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Cancellation reason <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <Select
              value={reason}
              onValueChange={(v) => {
                setReason(v);
                if (v !== "Other") setCustomReason("");
              }}
            >
              <SelectTrigger className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-0 shadow-none">
                <SelectValue placeholder="Select a reason…" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="Guest request">Guest request</SelectItem>
                <SelectItem value="No-show">No-show</SelectItem>
                <SelectItem value="Duplicate booking">Duplicate booking</SelectItem>
                <SelectItem value="Payment declined">Payment declined</SelectItem>
                <SelectItem value="Change of plans">Change of plans</SelectItem>
                <SelectItem value="Rate too high">Rate too high</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {reason === "Other" && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter reason…"
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          )}
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
            <input
              type="checkbox"
              checked={chargeFee}
              onChange={(e) => setChargeFee(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm text-muted-foreground">
              Apply cancellation fee (per policy)
            </span>
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={() => onClose()}
            className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"
          >
            Keep reservation
          </button>
          <button
            onClick={submit}
            className="rounded-md bg-destructive px-3.5 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            Cancel reservation
          </button>
        </div>
      </div>
    </div>
  );
}

export function NoShowDialog({
  reservationId,
  onClose,
}: {
  reservationId: string;
  onClose: (toast?: { tone: "ok" | "err"; msg: string }) => void;
}) {
  const res = reservationById(reservationId);
  const [chargeFee, setChargeFee] = useState(true);

  if (!res) return null;

  const submit = () => {
    noShowReservation(reservationId, { chargeFee });
    const feeMsg = chargeFee ? " and cancellation fee applied" : "";
    onClose({ tone: "ok", msg: `Reservation marked as no-show${feeMsg}.` });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-warning">No-Show Confirmation</h3>
            <p className="text-xs text-muted-foreground">
              {res.id} · {res.guestName}
            </p>
          </div>
          <button
            onClick={() => onClose()}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Confirm that <strong>{res.guestName}</strong> did not arrive for their reservation (
            {res.checkIn} → {res.checkOut}). This will release the room and mark the reservation
            as no-show. This action cannot be undone.
          </p>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
            <input
              type="checkbox"
              checked={chargeFee}
              onChange={(e) => setChargeFee(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm text-muted-foreground">
              Apply no-show cancellation fee
            </span>
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={() => onClose()}
            className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"
          >
            Go back
          </button>
          <button
            onClick={submit}
            className="rounded-md bg-warning px-3.5 py-2 text-xs font-semibold text-warning-foreground hover:bg-warning/90"
          >
            Confirm no-show
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChangeRoomDialog({
  reservationId,
  onClose,
}: {
  reservationId: string;
  onClose: (toast?: { tone: "ok" | "err"; msg: string }) => void;
}) {
  const res = reservationById(reservationId);
  const roomTypes = useStore((s) => s.roomTypes);

  const [selectedTypeId, setSelectedTypeId] = useState(res?.roomTypeId ?? "");
  const [selected, setSelected] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (!res || !res.roomId) return null;

  const oldRoom = roomById(res.roomId);
  const oldRt = roomTypeById(res.roomTypeId);

  const selectedRt = roomTypeById(selectedTypeId);
  const typeChanged = selectedTypeId !== res.roomTypeId;

  const candidates = findAvailableRooms(selectedTypeId, res.checkIn, res.checkOut, reservationId)
    .filter((r) => (typeChanged ? true : r.id !== res.roomId));

  const selectedRoom = candidates.find((r) => r.id === selected);
  const effectiveRate = roomTypeById(selectedRoom?.roomTypeId ?? "")?.baseRate ?? selectedRt?.baseRate ?? res.ratePerNight;

  const handleSubmit = () => {
    if (!selected) return;
    setConfirming(true);
    const r = changeRoom(
      reservationId,
      selected,
      "Front Desk",
      "Front Desk",
      typeChanged ? selectedTypeId : undefined,
      typeChanged ? effectiveRate : undefined,
    );
    setConfirming(false);
    onClose(
      r.ok
        ? {
            tone: "ok",
            msg: typeChanged
              ? `Guest moved to Room ${r.newRoom} (${selectedRt?.name ?? selectedTypeId}, ${fmtUGX(effectiveRate)}/night).`
              : `Guest moved from Room ${r.oldRoom} to Room ${r.newRoom}.`,
          }
        : { tone: "err", msg: r.error },
    );
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Change Room</h3>
            <p className="text-xs text-muted-foreground">
              {res.id} · {res.guestName}
            </p>
          </div>
          <button
            onClick={() => onClose()}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current room</p>
            <p className="mt-1 text-sm font-semibold">
              {oldRoom?.id ?? "—"} · {oldRoom?.roomNumber ?? "—"} (Floor {oldRoom?.floor ?? "—"})
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {oldRt?.name ?? res.roomTypeId} · {fmtUGX(res.ratePerNight)}/night
            </p>
          </div>

          <div className="flex justify-center">
            <MoveRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Room type selector */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Room type</p>
            <Select value={selectedTypeId} onValueChange={(v) => { setSelectedTypeId(v); setSelected(""); }}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {rt.name} ({fmtUGX(rt.baseRate)}/night)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room selection */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Select new room</p>
            {candidates.length === 0 ? (
              <p className="mt-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-3 text-xs text-destructive">
                No available rooms of type {selectedRt?.name ?? selectedTypeId} for the stay period.
              </p>
            ) : (
              <div className="mt-2 grid gap-2 max-h-48 overflow-y-auto">
                {candidates.map((r) => {
                  const rt = roomTypeById(r.roomTypeId);
                  return (
                    <label
                      key={r.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                        selected === r.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-border/80 hover:bg-muted/30",
                      )}
                    >
                      <input
                        type="radio"
                        name="newRoom"
                        value={r.id}
                        checked={selected === r.id}
                        onChange={() => setSelected(r.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <div className="flex-1">
                        <span className="font-medium">{r.id}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{r.roomNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-muted-foreground">Floor {r.floor}</span>
                        {typeChanged && rt && (
                          <p className="text-[10px] text-muted-foreground/60">{fmtUGX(rt.baseRate)}/night</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {typeChanged && selectedRoom && (
            <div className="rounded-lg border border-amber-200/30 bg-amber-500/[0.04] p-3 text-[11px] text-muted-foreground">
              <p className="font-medium text-foreground">Rate change notice</p>
              <p className="mt-1">
                Room type changing from <strong>{oldRt?.name ?? res.roomTypeId}</strong> ({fmtUGX(res.ratePerNight)}/night)
                to <strong>{selectedRt?.name ?? selectedTypeId}</strong> ({fmtUGX(effectiveRate)}/night).
              </p>
              <p className="mt-0.5">Future nightly charges will use the new rate. Existing charges are unaffected.</p>
            </div>
          )}

          <div className="rounded-lg border border-info/20 bg-info/5 p-3 text-[11px] text-muted-foreground">
            <p className="font-medium text-foreground">What will happen:</p>
            <ul className="mt-1.5 list-inside list-disc space-y-0.5">
              <li>Old room ({oldRoom?.id}) set to <strong>Vacant Dirty</strong></li>
              <li>Housekeeping notified to clean the vacated room</li>
              <li>New room assigned and marked <strong>Occupied</strong></li>
              <li>Current key cards deactivated; new key card issued</li>
              <li>All folio charges stay with the reservation</li>
              {typeChanged && <li>Room type updated; future charges use the new rate</li>}
              <li>Audit trail logged with reason</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={() => onClose()}
            className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || confirming}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {confirming ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <MoveRight className="h-3.5 w-3.5" />
            )}
            Move to {selected ? selected : "…"}
          </button>
        </div>
      </div>
    </div>
  );
}
