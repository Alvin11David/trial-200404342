import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  User,
  BedDouble,
  DollarSign,
  CreditCard,
  LogIn,
  Phone,
  Mail,
  Globe,
  IdCard,
  ShieldCheck,
  Key,
  MessageSquare,
  Users,
  Clock,
  CalendarDays,
  Lock,
  Printer,
} from "lucide-react";
import { cn, effectiveDeposit } from "@/lib/utils";
import {
   checkIn,
   findAvailableRooms,
   fmtUGX,
   nightsBetween,
   reservationById,
   roomById,
   roomTypeById,
   addPayment,
   groupBlockById,
    effectiveStatus,
    useStore,
  } from "@/lib/pms-store";
import GuestRegistrationForm from "@/features/frontdesk/GuestRegistrationForm";

const steps = [
  { id: 1, label: "Guest Verification", icon: User },
  { id: 2, label: "Room Assignment", icon: BedDouble },
  { id: 3, label: "Rate & Payment", icon: CreditCard },
  { id: 4, label: "Review & Confirm", icon: CheckCircle2 },
] as const;

export default function CheckInWizard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reservations = useStore((s) => s.reservations);
  const reservation = reservations.find((r) => r.id === id);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showRegForm, setShowRegForm] = useState(false);

  const rt = reservation ? roomTypeById(reservation.roomTypeId) : undefined;
  const nights = reservation ? nightsBetween(reservation.checkIn, reservation.checkOut) : 0;
  const availableRooms = reservation
    ? findAvailableRooms(reservation.roomTypeId, reservation.checkIn, reservation.checkOut)
    : [];
  const candidates = reservation
    ? (reservation.roomId
        ? [reservation.roomId, ...availableRooms.filter((a) => a.id !== reservation.roomId).map((a) => a.id)]
        : availableRooms.map((a) => a.id))
    : [];

  const [room, setRoom] = useState(candidates[0] ?? "");

  const [editPhone, setEditPhone] = useState(reservation?.guestPhone ?? "");
  const [editEmail, setEditEmail] = useState(reservation?.guestEmail ?? "");
  const [editNationality, setEditNationality] = useState(reservation?.nationality ?? "");

  const [rateOverride, setRateOverride] = useState(false);
  const [overrideRate, setOverrideRate] = useState(reservation?.ratePerNight ?? 0);
  const [authCode, setAuthCode] = useState("");

  const [collectPayment, setCollectPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<"mtn_momo" | "airtel_money" | "card" | "cash" | "">("");
  const [payPhone, setPayPhone] = useState("");
  const [payAmount, setPayAmount] = useState(0);
  const [payRef, setPayRef] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [keyIssued, setKeyIssued] = useState(false);
  const [keyRef, setKeyRef] = useState("");

  const [specialRequests, setSpecialRequests] = useState(reservation?.specialRequests ?? "");

  if (!reservation) {
    return (
      <div className="mx-auto max-w-5xl py-24 text-center">
        <h2 className="text-lg font-semibold text-muted-foreground">Reservation not found</h2>
        <Link to="/check-in" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Check-In
        </Link>
      </div>
    );
  }

  const effectiveRate = rateOverride ? overrideRate : reservation.ratePerNight;
  const total = effectiveRate * nights;

  const canNext = (() => {
    switch (step) {
      case 1: return true;
      case 2: return !!room;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  })();

  const go = (n: number) => {
    setDirection(n > step ? 1 : -1);
    setStep(n);
  };

  const submit = async () => {
    if (!room) return;
    setError(null);
    setSubmitted(true);

    if (collectPayment && payMethod && reservation.folioId) {
      const amount = effectiveDeposit(total, payMethod, payAmount);
      addPayment(reservation.folioId, {
        method: payMethod,
        amount,
        date: new Date().toISOString().slice(0, 10),
        phone: (payMethod === "mtn_momo" || payMethod === "airtel_money") ? payPhone : undefined,
        reference: payRef || undefined,
        status: "confirmed",
      });
    }

    const r = checkIn(id!, { roomId: room });
    if (r.ok) {
      toast.success(`${reservation.guestName} checked in successfully.`);
      navigate(`/reservations/${id}`);
    } else {
      toast.error(r.error);
      setSubmitted(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/check-in"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Check-In</h1>
            <p className="text-sm text-muted-foreground">
              Register {reservation.guestName} in four quick steps.
            </p>
          </div>
        </div>
      </div>

      {submitted ? (
        <ConfirmationScreen
          guestName={reservation.guestName}
          roomId={room}
          roomType={rt?.name ?? ""}
          checkIn={reservation.checkIn}
          checkOut={reservation.checkOut}
          nights={nights}
          total={total}
          effectiveRate={effectiveRate}
          reservationId={id!}
          onPrintRegistration={() => setShowRegForm(true)}
        />
      ) : (
        <>
          <div className="glass rounded-2xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {steps.map((s, i) => {
                const done = step > s.id;
                const active = step === s.id;
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => s.id < step && go(s.id)}
                    className="group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all",
                          done && "border-success/40 bg-success/15 text-success",
                          active &&
                            "border-primary/50 bg-gradient-to-br from-primary/30 to-success/20 text-primary shadow-lg shadow-primary/30",
                          !done && !active && "border-border/50 bg-card/40 text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="hidden min-w-0 sm:block">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Step {s.id}
                        </div>
                        <div
                          className={cn(
                            "truncate text-sm font-semibold",
                            !active && !done && "text-muted-foreground",
                          )}
                        >
                          {s.label}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted/50">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          done || active
                            ? "bg-gradient-to-r from-primary to-success"
                            : "bg-transparent",
                        )}
                        style={{ width: done ? "100%" : active ? "55%" : "0%" }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass overflow-hidden rounded-2xl p-6 sm:p-8">
            <div
              key={step}
              className={cn(
                "animate-in fade-in duration-300",
                direction === 1 ? "slide-in-from-right-4" : "slide-in-from-left-4",
              )}
            >
              {step === 1 && (
                <StepGuestVerification
                  reservation={reservation}
                  editPhone={editPhone}
                  editEmail={editEmail}
                  editNationality={editNationality}
                  setEditPhone={setEditPhone}
                  setEditEmail={setEditEmail}
                  setEditNationality={setEditNationality}
                  nights={nights}
                  rt={rt}
                />
              )}
              {step === 2 && (
                <StepRoomAssignment
                  candidates={candidates}
                  room={room}
                  setRoom={setRoom}
                />
              )}
              {step === 3 && (
                <StepRatePayment
                  standardRate={reservation.ratePerNight}
                  nights={nights}
                  total={total}
                  rateOverride={rateOverride}
                  setRateOverride={setRateOverride}
                  overrideRate={overrideRate}
                  setOverrideRate={setOverrideRate}
                  authCode={authCode}
                  setAuthCode={setAuthCode}
                  collectPayment={collectPayment}
                  setCollectPayment={setCollectPayment}
                  payMethod={payMethod}
                  setPayMethod={setPayMethod}
                  payPhone={payPhone}
                  setPayPhone={setPayPhone}
                  payAmount={payAmount}
                  setPayAmount={setPayAmount}
                  payRef={payRef}
                  setPayRef={setPayRef}
                  cardholderName={cardholderName}
                  setCardholderName={setCardholderName}
                  cardNumber={cardNumber}
                  setCardNumber={setCardNumber}
                  cardExpiry={cardExpiry}
                  setCardExpiry={setCardExpiry}
                  cardCvv={cardCvv}
                  setCardCvv={setCardCvv}
                />
              )}
              {step === 4 && (
                <StepReviewConfirm
                  reservation={reservation}
                  room={room}
                  rt={rt}
                  nights={nights}
                  total={total}
                  effectiveRate={effectiveRate}
                  rateOverride={rateOverride}
                  collectPayment={collectPayment}
                  payMethod={payMethod}
                  payAmount={payAmount}
                  keyIssued={keyIssued}
                  keyRef={keyRef}
                  setKeyIssued={setKeyIssued}
                  setKeyRef={setKeyRef}
                  specialRequests={specialRequests}
                  setSpecialRequests={setSpecialRequests}
                />
              )}
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-destructive/20 text-[10px] font-bold">!</span>
                {error}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-6">
              <button
                onClick={() => step > 1 && go(step - 1)}
                disabled={step === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-4 py-2.5 text-sm text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              {step < 4 ? (
                <button
                  disabled={!canNext}
                  onClick={() => canNext && go(step + 1)}
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition",
                    !canNext && "cursor-not-allowed opacity-50",
                  )}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={submitted}
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-success to-emerald-600 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-success/30 transition hover:shadow-success/50"
                >
                  {submitted ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Checking in…
                    </>
                  ) : (
                    <>
                      Confirm Check-In
                      <LogIn className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {showRegForm && (
        <GuestRegistrationForm
          guestName={reservation.guestName}
          idType={reservation.idType ?? ""}
          idNumber={reservation.idNumber ?? ""}
          nationality={reservation.nationality ?? ""}
          phone={reservation.guestPhone ?? ""}
          email={reservation.guestEmail ?? ""}
          roomNumber={roomById(room)?.roomNumber ?? room}
          roomType={rt?.name ?? ""}
          checkInDate={reservation.checkIn}
          checkOutDate={reservation.checkOut}
          nights={nights}
          adults={reservation.adults ?? 1}
          children={reservation.children ?? 0}
          ratePerNight={effectiveRate}
          totalAmount={total}
          specialRequests={specialRequests}
          purpose={reservation.purpose}
          vipFlag={reservation.vipFlag}
          onClose={() => setShowRegForm(false)}
        />
      )}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function ConfirmationScreen({
  guestName,
  roomId,
  roomType,
  checkIn,
  checkOut,
  nights,
  total,
  effectiveRate,
  reservationId,
  onPrintRegistration,
}: {
  guestName: string;
  roomId: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  effectiveRate: number;
  reservationId: string;
  onPrintRegistration: () => void;
}) {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
        <CheckCircle2 className="h-8 w-8 text-success" />
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Guest Checked In</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{guestName}</span> is now checked into Room <span className="font-mono font-semibold text-foreground">{roomId}</span>.
      </p>

      <div className="mx-auto mt-8 max-w-md rounded-xl border border-border bg-card/50 p-5 text-left">
        <div className="grid grid-cols-2 gap-4">
          <ReviewItem label="Guest" value={guestName} />
          <ReviewItem label="Room" value={`${roomId} · ${roomType}`} />
          <ReviewItem label="Check in" value={checkIn} />
          <ReviewItem label="Check out" value={checkOut} />
          <ReviewItem label="Nights" value={String(nights)} />
          <ReviewItem label="Rate" value={fmtUGX(effectiveRate)} />
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
          <span className="text-sm text-muted-foreground">Total stay</span>
          <span className="text-lg font-bold text-gradient-primary">{fmtUGX(total)}</span>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={onPrintRegistration}
          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20"
        >
          <Printer className="h-4 w-4" /> Print Registration Form
        </button>
        <Link
          to={`/reservations/${reservationId}`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          View Reservation
        </Link>
        <Link
          to="/check-in"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          Check In Another Guest
        </Link>
      </div>
    </div>
  );
}

/* ─── Step 1: Guest Verification ─── */
function StepGuestVerification({
  reservation,
  editPhone,
  editEmail,
  editNationality,
  setEditPhone,
  setEditEmail,
  setEditNationality,
  nights,
  rt,
}: {
  reservation: NonNullable<ReturnType<typeof reservationById>>;
  editPhone: string;
  editEmail: string;
  editNationality: string;
  setEditPhone: (v: string) => void;
  setEditEmail: (v: string) => void;
  setEditNationality: (v: string) => void;
  nights: number;
  rt: ReturnType<typeof roomTypeById>;
}) {
  return (
    <div>
      <SectionTitle title="Guest Verification" subtitle="Verify the guest's identity and contact details. Editable fields can be updated." />

      <div className="flex items-center gap-4 mb-6 rounded-xl border border-border/60 bg-card/30 p-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/50 to-success/50 text-lg font-bold text-primary-foreground">
          {(reservation.guestName?.charAt(0) ?? "?").toUpperCase()}
        </div>
        <div>
          <div className="text-lg font-semibold">{reservation.guestName}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>#{reservation.id}</span>
            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{reservation.checkIn} – {reservation.checkOut}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{nights} night{nights > 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Full name</label>
          <p className="mt-1 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5 text-sm font-medium">{reservation.guestName}</p>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone (editable)</label>
          <div className="mt-1 flex items-center gap-1.5">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full rounded-lg border border-border/70 bg-card/30 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Email (editable)</label>
          <div className="mt-1 flex items-center gap-1.5">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full rounded-lg border border-border/70 bg-card/30 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nationality (editable)</label>
          <div className="mt-1 flex items-center gap-1.5">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input value={editNationality} onChange={(e) => setEditNationality(e.target.value)} className="w-full rounded-lg border border-border/70 bg-card/30 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">ID Type</label>
          <div className="mt-1 flex items-center gap-1.5">
            <IdCard className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm">{reservation.idType ?? "—"}</p>
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">ID Number</label>
          <p className="mt-1 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5 text-sm font-mono">{reservation.idNumber ?? "—"}</p>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Client Type</label>
          <p className="mt-1 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5 text-sm">{reservation.clientType ?? "—"}</p>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Guests</label>
          <div className="mt-1 flex items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm">
              {reservation.adults != null
                ? `${reservation.adults} Adult${reservation.adults !== 1 ? "s" : ""}${reservation.children ? `, ${reservation.children} Child${reservation.children !== 1 ? "ren" : ""}` : ""}`
                : "—"}
            </p>
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Room Type</label>
          <div className="mt-1 flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm">{rt?.name ?? reservation.roomTypeId}</p>
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Booking Source</label>
          <p className="mt-1 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5 text-sm">
            {reservation.bookingSource ? reservation.bookingSource.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—"}
          </p>
        </div>
        {reservation.purpose && (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Purpose of Visit</label>
            <p className="mt-1 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5 text-sm">{reservation.purpose}</p>
          </div>
        )}
        {reservation.carReg && (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Car Registration</label>
            <p className="mt-1 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5 text-sm font-mono">{reservation.carReg}</p>
          </div>
        )}
        {reservation.extraBeds != null && reservation.extraBeds > 0 && (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Extra Beds</label>
            <p className="mt-1 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5 text-sm">{reservation.extraBeds}</p>
          </div>
        )}
        {reservation.vipFlag && (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">VIP</label>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber/10 px-2 py-0.5 text-xs font-semibold text-amber">VIP</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Step 2: Room Assignment ─── */
function StepRoomAssignment({
  candidates,
  room,
  setRoom,
}: {
  candidates: string[];
  room: string;
  setRoom: (v: string) => void;
}) {
  return (
    <div>
      <SectionTitle title="Room Assignment" subtitle="Select the room to assign for this stay." />
      {candidates.length === 0 ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-6 text-center">
          <p className="text-sm font-medium text-warning">No rooms of this type are available for the selected dates.</p>
          <p className="mt-1 text-xs text-muted-foreground">Consider changing the room type or adjusting the stay dates.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((id) => {
            const r = roomById(id);
            const active = room === id;
            return (
              <button
                key={id}
                onClick={() => setRoom(id)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-4 text-left transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20",
                  active && "border-primary/60 bg-gradient-to-br from-primary/15 to-success/10 shadow-xl shadow-primary/30 ring-2 ring-primary/40",
                )}
              >
                {active && (
                  <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-success/30">
                    <BedDouble className="h-4 w-4 text-primary" />
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-success">● Available</span>
                </div>
                <div className="mt-3 font-display text-2xl font-bold tracking-tight">Room {id}</div>
                <div className="text-xs text-muted-foreground">
                  Floor {r?.floor} · {r?.status.replace("_", " ")}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Step 3: Rate & Payment ─── */
function StepRatePayment({
  standardRate,
  nights,
  total,
  rateOverride,
  setRateOverride,
  overrideRate,
  setOverrideRate,
  authCode,
  setAuthCode,
  collectPayment,
  setCollectPayment,
  payMethod,
  setPayMethod,
  payPhone,
  setPayPhone,
  payAmount,
  setPayAmount,
  payRef,
  setPayRef,
  cardholderName,
  setCardholderName,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
}: {
  standardRate: number;
  nights: number;
  total: number;
  rateOverride: boolean;
  setRateOverride: (v: boolean) => void;
  overrideRate: number;
  setOverrideRate: (v: number) => void;
  authCode: string;
  setAuthCode: (v: string) => void;
  collectPayment: boolean;
  setCollectPayment: (v: boolean) => void;
  payMethod: string;
  setPayMethod: (v: "mtn_momo" | "airtel_money" | "card" | "cash" | "") => void;
  payPhone: string;
  setPayPhone: (v: string) => void;
  payAmount: number;
  setPayAmount: (v: number) => void;
  payRef: string;
  setPayRef: (v: string) => void;
  cardholderName: string;
  setCardholderName: (v: string) => void;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardExpiry: string;
  setCardExpiry: (v: string) => void;
  cardCvv: string;
  setCardCvv: (v: string) => void;
}) {
  const collected = collectPayment && payMethod ? effectiveDeposit(total, payMethod, payAmount) : 0;

  return (
    <div className="space-y-8">
      {/* Rate Section */}
      <div>
        <SectionTitle title="Rate Confirmation" subtitle="Review and optionally override the nightly rate." />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-card/30 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Standard Rate</div>
            <div className="text-2xl font-bold">{fmtUGX(standardRate)} / night</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/30 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Nights</div>
            <div className="text-2xl font-bold">{nights}</div>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/30 px-4 py-3 transition hover:border-primary/40 cursor-pointer">
            <input type="checkbox" checked={rateOverride} onChange={(e) => setRateOverride(e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />
            <span className="text-sm font-medium">Override rate (requires manager authorization)</span>
          </label>
        </div>

        {rateOverride && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">New rate per night</label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">UGX</span>
                <input type="number" value={overrideRate} onChange={(e) => setOverrideRate(Number(e.target.value))} className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm outline-none focus:border-primary/60" />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Authorization code</label>
              <div className="relative mt-1">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input value={authCode} onChange={(e) => setAuthCode(e.target.value)} placeholder="e.g. MGR-042" className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60" />
              </div>
            </div>
            <div className="rounded-lg bg-info/10 px-3 py-2 text-[11px] text-info sm:col-span-2">
              Rate override requires manager authorization code. Enter a valid manager ID to proceed.
            </div>
          </div>
        )}
      </div>

      {/* Payment Section */}
      <div>
        <SectionTitle title="Payment / Pre-Authorization" subtitle="Secure payment for the stay." />
        <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/30 px-4 py-3 transition hover:border-primary/40 cursor-pointer">
          <input type="checkbox" checked={collectPayment} onChange={(e) => setCollectPayment(e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />
          <div>
            <span className="text-sm font-medium">Collect payment or pre-authorize</span>
            <p className="text-[11px] text-muted-foreground">Set a deposit amount via mobile money, card, or cash</p>
          </div>
        </label>

        {collectPayment && (
          <div className="mt-4 space-y-4 rounded-xl border border-border/60 bg-card/30 p-4">
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "mtn_momo" as const, label: "MTN MoMo" },
                { id: "airtel_money" as const, label: "Airtel Money" },
                { id: "card" as const, label: "Card" },
                { id: "cash" as const, label: "Cash" },
              ]).map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => {
                    setPayMethod(pm.id);
                    if (payAmount === 0) setPayAmount(effectiveDeposit(total, pm.id, 0));
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-xs font-medium transition",
                    payMethod === pm.id
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {pm.label}
                </button>
              ))}
            </div>

            {(payMethod === "mtn_momo" || payMethod === "airtel_money") && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone number</label>
                <input value={payPhone} onChange={(e) => setPayPhone(e.target.value)} placeholder="+256 700 000 000" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </div>
            )}

            {payMethod === "card" && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cardholder name</label>
                  <input value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} placeholder="John Doe" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Card number</label>
                  <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" maxLength={19} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Expiry date</label>
                    <input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">CVV</label>
                    <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" maxLength={4} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Card reference (last 4 digits)</label>
                  <input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="4242" maxLength={4} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60" />
                </div>
              </div>
            )}

            {payMethod && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Amount to collect</label>
                  <span className="text-sm font-bold">{fmtUGX(collected)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPayAmount(Math.round(total))}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition",
                      payAmount >= total
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    Full (100%)
                  </button>
                  <button
                    onClick={() => setPayAmount(Math.round(total * 0.5))}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition",
                      payAmount > 0 && payAmount < total
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    Half (50%)
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  max={Math.round(total)}
                  value={payAmount || ""}
                  onChange={(e) => setPayAmount(Math.max(0, Math.min(Math.round(total), Number(e.target.value) || 0)))}
                  placeholder="Custom amount"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-primary/60"
                />
                <p className="text-[10px] text-muted-foreground">
                  Amount to pay today — the balance is due at check-out. 0 uses the suggested amount for the method.
                </p>
                <div className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Balance due at check-out</span>
                  <span className={cn("font-semibold tabular-nums", effectiveDeposit(total, payMethod, payAmount) >= total ? "text-success" : "text-warning")}>
                    {fmtUGX(Math.max(0, total - effectiveDeposit(total, payMethod, payAmount)))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Step 4: Review & Confirm ─── */
function StepReviewConfirm({
  reservation,
  room,
  rt,
  nights,
  total,
  effectiveRate,
  rateOverride,
  collectPayment,
  payMethod,
  payAmount,
  keyIssued,
  keyRef,
  setKeyIssued,
  setKeyRef,
  specialRequests,
  setSpecialRequests,
}: {
  reservation: NonNullable<ReturnType<typeof reservationById>>;
  room: string;
  rt: ReturnType<typeof roomTypeById>;
  nights: number;
  total: number;
  effectiveRate: number;
  rateOverride: boolean;
  collectPayment: boolean;
  payMethod: string;
  payAmount: number;
  keyIssued: boolean;
  keyRef: string;
  setKeyIssued: (v: boolean) => void;
  setKeyRef: (v: string) => void;
  specialRequests: string;
  setSpecialRequests: (v: string) => void;
}) {
  const collected = collectPayment && payMethod ? effectiveDeposit(total, payMethod, payAmount) : 0;

  return (
    <div>
      <SectionTitle title="Review & Confirm" subtitle="Double-check everything before checking in the guest." />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          {/* Guest summary */}
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Guest</h4>
<div className="mt-3 flex items-center gap-4">
               <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/50 to-success/50 text-lg font-bold text-primary-foreground">
                 {(reservation.guestName?.charAt(0) ?? "?").toUpperCase()}
               </div>
               <div>
                 <div className="text-lg font-semibold">{reservation.guestName}</div>
                 <div className="text-xs text-muted-foreground">
                   {reservation.guestEmail} · {reservation.guestPhone}
                 </div>
                 <div className="text-xs text-muted-foreground">
                   {reservation.nationality} · {reservation.clientType}
                 </div>
               </div>
             </div>

             {reservation.groupBlockId && (() => {
               const block = groupBlockById(reservation.groupBlockId);
               if (!block) return null;
               const status = effectiveStatus(block);
               return (
                 <div className="mt-4 mb-2 flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 px-4 py-2">
                   <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Group Block</span>
                   <Link
                     to={`/groups/${block.id}`}
                     className="text-sm font-semibold text-primary hover:underline"
                   >
                     {block.groupName}
                   </Link>
                   <span className={cn(
                     "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                     status === "active"
                       ? "bg-success/15 text-success border-success/30"
                       : status === "confirmed"
                         ? "bg-info/15 text-info border-info/30"
                         : "bg-muted/40 text-muted-foreground border-border/40"
                   )}>
                     {status}
                   </span>
                   <span className="text-xs text-muted-foreground">
                     UGX {fmtUGX(block.groupRate)}/night · {block.totalRoomsBlocked} rooms
                   </span>
                 </div>
               );
             })()}

             <div className="my-5 h-px bg-border/50" />

          {/* Stay summary */}
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Stay</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <ReviewItem label="Room" value={room ? `Room ${room} · ${rt?.name ?? ""}` : "—"} />
            <ReviewItem label="Check in" value={reservation.checkIn} />
            <ReviewItem label="Check out" value={reservation.checkOut} />
            <ReviewItem label="Nights" value={String(nights)} />
            <ReviewItem label="Rate" value={`${fmtUGX(effectiveRate)} / night${rateOverride ? " (overridden)" : ""}`} />
            <ReviewItem label="Guests" value={`${reservation.adults ?? "—"} Adult${reservation.adults !== 1 ? "s" : ""}${reservation.children ? `, ${reservation.children} Child` : ""}`} />
          </div>

          <div className="my-5 h-px bg-border/50" />

          {/* Key Card */}
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Key Card</h4>
          <div className="mt-3">
            {keyIssued ? (
              <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-success">Key Card Issued</p>
                  <p className="text-xs text-muted-foreground">Reference: {keyRef} · Expires: {reservation.checkOut}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-card/30 p-4 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                  <Lock className="h-5 w-5 text-muted-foreground/40" />
                </span>
                <p className="mt-2 text-sm text-muted-foreground">No key card issued yet</p>
                <button
                  onClick={() => {
                    setKeyIssued(true);
                    setKeyRef(`KC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
                    toast.success("Key card encoded for Room " + room);
                  }}
                  disabled={!room}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
                >
                  <Key className="h-3.5 w-3.5" /> Encode Key Card
                </button>
              </div>
            )}
          </div>

          <div className="my-5 h-px bg-border/50" />

          {/* Special Requests */}
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Special Requests</h4>
          <div className="mt-3">
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
              placeholder="Late checkout, allergies, room preferences, extra amenities…"
              className="w-full resize-none rounded-xl border border-border/70 bg-card/40 p-3 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
            />
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Summary</h4>

          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Room × {nights} night{nights !== 1 && "s"}</span>
              <span className="font-medium tabular-nums">{fmtUGX(effectiveRate * nights)}</span>
            </li>
            {collectPayment && payMethod && (
              <li className="flex justify-between border-t border-border/50 pt-3">
                <span className="text-success">
                  Deposit ({payMethod === "mtn_momo" ? "MTN MoMo" : payMethod === "airtel_money" ? "Airtel Money" : payMethod === "card" ? "Card" : "Cash"})
                </span>
                <span className="font-bold text-success">
                  {fmtUGX(collected)}
                </span>
              </li>
            )}
          </ul>

          <div className="my-4 h-px bg-border/50" />
          <div className="flex items-end justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {collectPayment && payMethod ? "Balance due" : "Total"}
            </span>
            <span className="text-2xl font-bold text-gradient-primary tabular-nums">
              {fmtUGX(
                collectPayment && payMethod
                  ? Math.max(0, total - collected)
                  : total,
              )}
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-info/30 bg-info/10 p-3 text-xs text-info">
            <p className="font-medium">Check-in activates the room</p>
            <p className="mt-0.5 text-muted-foreground">Room status will update to occupied and the first night's charge will be posted to the folio.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
