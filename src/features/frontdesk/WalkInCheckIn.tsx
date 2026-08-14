import { Link, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
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
  Utensils,
  Lock,
  Search,
  Landmark,
  MapPin,
  Printer,
  Building2,
} from "lucide-react";
import { cn, effectiveDeposit } from "@/lib/utils";
import { createReservation, checkIn, findAvailableRooms, fmtUGX, nightsBetween, addPayment, reservationById, useStore, MEAL_PLAN_IDS, MEAL_PLAN_LABELS, MEAL_PLAN_DESCRIPTIONS, type GroupBlock, type CorporateAccount, type TravelAgentAccount } from "@/lib/pms-store";
import { StepGroupBlock } from "@/features/groups/StepGroupBlock";
import { DatePicker } from "@/components/ui/date-picker";
import { CountrySelect } from "@/shared/components/CountrySelect";
import { TimePicker } from "@/shared/components/TimePicker";
import { GuestAutocomplete } from "@/shared/components/GuestAutocomplete";
import GuestRegistrationForm from "@/features/frontdesk/GuestRegistrationForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const steps = [
  { id: 1, label: "Room & Dates", icon: BedDouble },
  { id: 2, label: "Guest Details", icon: User },
  { id: 3, label: "Rate & Payment", icon: CreditCard },
  { id: 4, label: "Review & Confirm", icon: CheckCircle2 },
] as const;

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export default function WalkInCheckIn() {
  const [searchParams] = useSearchParams();
  const [groupBlockId, setGroupBlockId] = useState<string | undefined>(
   searchParams.get("groupBlockId") || undefined,
 );
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const guests = useStore((s) => s.guests);
  const idTypes = useStore((s) => s.idTypeConfig.types);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);

  /* Guest Details */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("Uganda");
  const [clientType, setClientType] = useState("Individual");
  const [idType, setIdType] = useState("Passport");
  const [idNumber, setIdNumber] = useState("");
  const [purpose, setPurpose] = useState("");
  const [carReg, setCarReg] = useState("");
  const [vip, setVip] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [taxTreatment, setTaxTreatment] = useState("Inclusive");
  const [serviceCharge, setServiceCharge] = useState("Inclusive");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [billingArrangement, setBillingArrangement] = useState<"pay_at_checkout" | "city_ledger" | "agent_ledger">("pay_at_checkout");
  const [corporateAccountId, setCorporateAccountId] = useState<string | undefined>(undefined);
  const [travelAgentAccountId, setTravelAgentAccountId] = useState<string | undefined>(undefined);

  /* Room & Dates */
  const [checkInDate, setCheckInDate] = useState(today());
  const [checkOutDate, setCheckOutDate] = useState(tomorrow());
  const [selectedRoom, setSelectedRoom] = useState("");
  const [mealPlan, setMealPlan] = useState("BB");
  const [specialRequests, setSpecialRequests] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [extraBeds, setExtraBeds] = useState(0);

  /* Rate & Payment */
  const [ratePerNight, setRatePerNight] = useState(0);
  const [rateOverride, setRateOverride] = useState(false);
  const [overrideRate, setOverrideRate] = useState(0);
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

  /* Key Card */
  const [keyIssued, setKeyIssued] = useState(false);
  const [keyRef, setKeyRef] = useState("");

  const groupBlocks = useStore((s) => s.groupBlocks);
  const corporateAccounts = useStore((s) => s.corporateAccounts);
  const travelAgentAccounts = useStore((s) => s.travelAgentAccounts);
  const groupBlock = groupBlockId
    ? groupBlocks.find((b) => b.id === groupBlockId)
    : undefined;
  const nights = nightsBetween(checkInDate, checkOutDate);
  const effectiveRate = rateOverride
    ? overrideRate
    : groupBlock?.groupRate ?? ratePerNight;
  const total = effectiveRate * Math.max(1, nights);

  const roomOptions = useMemo(() => {
    return rooms
      .filter((r) => r.status === "available")
      .map((r) => {
        const rt = roomTypes.find((t) => t.id === r.roomTypeId);
        const available = findAvailableRooms(r.roomTypeId, checkInDate, checkOutDate).some(
          (a) => a.id === r.id,
        );
        return {
          id: r.id,
          roomNumber: r.roomNumber,
          type: rt?.name ?? r.roomTypeId,
          typeId: r.roomTypeId,
          rate: rt?.baseRate ?? 0,
          available,
          floor: String(r.floor),
        };
      });
  }, [rooms, roomTypes, checkInDate, checkOutDate]);

  const mpConfig = useStore((s) => s.mealPlanConfig);
  const mealPlans = useMemo(
    () => MEAL_PLAN_IDS.map((id) => ({
      id,
      label: MEAL_PLAN_LABELS[id],
      desc: MEAL_PLAN_DESCRIPTIONS[id],
      price: mpConfig.prices[id] ?? 0,
    })),
    [mpConfig],
  );

  const meal = mealPlans.find((m) => m.id === mealPlan) ?? mealPlans[0];
  const room = roomOptions.find((r) => r.id === selectedRoom);
  const grandTotal = total + meal.price * Math.max(1, nights);

  const canNext = (() => {
    switch (step) {
      case 1: return !!selectedRoom && nights >= 0;
      case 2: return firstName.trim().length > 0 && lastName.trim().length > 0 && phone.trim().length > 0;
      case 3: return effectiveRate > 0;
      case 4: return true;
      default: return false;
    }
  })();

  const go = (n: number) => {
    setDirection(n > step ? 1 : -1);
    setStep(n);
  };

  const selectRoom = (id: string) => {
    const r = roomOptions.find((ro) => ro.id === id);
    setSelectedRoom(id);
    if (r && ratePerNight === 0) {
      setRatePerNight(r.rate);
      setOverrideRate(r.rate);
    }
    go(2);
  };

  const submit = async () => {
    if (!selectedRoom) return;
    setError(null);
    setSubmitted(true);

    const guestName = `${firstName} ${lastName}`.trim();

    const res = createReservation({
      guestName,
      guestEmail: email,
      guestPhone: phone,
      nationality,
      clientType,
      idType,
      idNumber,
      roomTypeId: room!.typeId,
      roomId: selectedRoom,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults,
      children,
      ratePerNight: effectiveRate,
      mealPlan,
      bookingSource: "walk_in",
      arrivalTime: arrivalTime || undefined,
      checkOutTime: checkOutTime || undefined,
      purpose: purpose || undefined,
      carReg: carReg || undefined,
      specialRequests: specialRequirements || specialRequests || undefined,
      vipFlag: vip,
      groupBlockId,
      billingArrangement,
      corporateAccountId,
      travelAgentAccountId,
    });

    if (!res.ok) {
      toast.error(res.error);
      setSubmitted(false);
      return;
    }

    const r = checkIn(res.id, { roomId: selectedRoom });
    if (!r.ok) {
      toast.error(r.error);
      setSubmitted(false);
      return;
    }

    if (collectPayment && payMethod) {
      const amount = effectiveDeposit(grandTotal, payMethod, payAmount);
      const updated = reservationById(res.id);
      const folioId = updated?.folioId;
      if (folioId) {
        addPayment(folioId, {
          method: payMethod,
          amount,
          date: today(),
          phone: (payMethod === "mtn_momo" || payMethod === "airtel_money") ? payPhone : undefined,
          reference: payRef || undefined,
          status: "confirmed",
        });
      }
    }

    setConfirmationId(res.id);
    toast.success(`${guestName} checked in successfully.`);
  };

  if (confirmationId) {
    return (
      <>
        <ConfirmationScreen
          guestName={`${firstName} ${lastName}`.trim()}
          roomId={selectedRoom}
          roomType={room?.type ?? ""}
          checkIn={checkInDate}
          checkOut={checkOutDate}
          nights={nights}
          total={grandTotal}
          effectiveRate={effectiveRate}
          reservationId={confirmationId}
          onPrintRegistration={() => setShowRegForm(true)}
        />
        {showRegForm && (
          <GuestRegistrationForm
            guestName={`${firstName} ${lastName}`.trim()}
            idType={idType}
            idNumber={idNumber}
            nationality={nationality}
            phone={phone}
            email={email}
            roomNumber={room?.roomNumber ?? selectedRoom}
            roomType={room?.type ?? ""}
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
            nights={nights}
            adults={adults}
            children={children}
            ratePerNight={effectiveRate}
            totalAmount={grandTotal}
            specialRequests={specialRequests || specialRequirements}
            purpose={purpose}
            vipFlag={vip}
            onClose={() => setShowRegForm(false)}
          />
        )}
      </>
    );
  }

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
            <h1 className="font-display text-3xl font-bold tracking-tight">Walk-in Check-In</h1>
            <p className="text-sm text-muted-foreground">
              Check in a guest without a reservation in four quick steps.
            </p>
          </div>
        </div>
      </div>

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
                      active && "border-primary/50 bg-gradient-to-br from-primary/30 to-success/20 text-primary shadow-lg shadow-primary/30",
                      !done && !active && "border-border/50 bg-card/40 text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Step {s.id}</div>
                    <div className={cn("truncate text-sm font-semibold", !active && !done && "text-muted-foreground")}>
                      {s.label}
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", done || active ? "bg-gradient-to-r from-primary to-success" : "bg-transparent")}
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
            <StepRoomDates
              checkIn={checkInDate} setCheckIn={setCheckInDate}
              checkOut={checkOutDate} setCheckOut={setCheckOutDate}
              nights={nights}
              selectedRoom={selectedRoom} selectRoom={selectRoom}
              roomOptions={roomOptions}
              mealPlan={mealPlan} setMealPlan={setMealPlan}
              mealPlans={mealPlans}
              adults={adults} setAdults={setAdults}
              children={children} setChildren={setChildren}
              arrivalTime={arrivalTime} setArrivalTime={setArrivalTime}
              checkOutTime={checkOutTime} setCheckOutTime={setCheckOutTime}
              extraBeds={extraBeds} setExtraBeds={setExtraBeds}
              specialRequests={specialRequests} setSpecialRequests={setSpecialRequests}
            />
          )}
          {step === 2 && (
            <StepGuestDetails
              guests={guests}
              firstName={firstName} setFirstName={setFirstName}
              lastName={lastName} setLastName={setLastName}
              email={email} setEmail={setEmail}
              phone={phone} setPhone={setPhone}
              nationality={nationality} setNationality={setNationality}
              clientType={clientType} setClientType={setClientType}
              idType={idType} setIdType={setIdType}
              idTypes={idTypes}
              idNumber={idNumber} setIdNumber={setIdNumber}
              purpose={purpose} setPurpose={setPurpose}
              carReg={carReg} setCarReg={setCarReg}
              vip={vip} setVip={setVip}
              taxTreatment={taxTreatment} setTaxTreatment={setTaxTreatment}
              serviceCharge={serviceCharge} setServiceCharge={setServiceCharge}
              specialRequirements={specialRequirements} setSpecialRequirements={setSpecialRequirements}
              billingArrangement={billingArrangement} setBillingArrangement={setBillingArrangement}
              corporateAccounts={corporateAccounts}
              travelAgentAccounts={travelAgentAccounts}
              corporateAccountId={corporateAccountId} setCorporateAccountId={setCorporateAccountId}
              travelAgentAccountId={travelAgentAccountId} setTravelAgentAccountId={setTravelAgentAccountId}
              groupBlockId={groupBlockId}
              onGroupBlockSelect={(id, rate) => {
                setGroupBlockId(id);
                setRatePerNight(rate);
                setOverrideRate(rate);
              }}
              checkIn={checkInDate}
              checkOut={checkOutDate}
              effectiveRate={effectiveRate}
            />
          )}
          {step === 3 && (
            <StepRatePayment
              ratePerNight={ratePerNight} setRatePerNight={setRatePerNight}
              nights={nights}
              total={grandTotal}
              roomTotal={total}
              meal={meal}
              rateOverride={rateOverride} setRateOverride={setRateOverride}
              overrideRate={overrideRate} setOverrideRate={setOverrideRate}
              authCode={authCode} setAuthCode={setAuthCode}
              collectPayment={collectPayment} setCollectPayment={setCollectPayment}
              payMethod={payMethod} setPayMethod={setPayMethod}
              payPhone={payPhone} setPayPhone={setPayPhone}
              payAmount={payAmount} setPayAmount={setPayAmount}
              payRef={payRef} setPayRef={setPayRef}
              cardholderName={cardholderName} setCardholderName={setCardholderName}
              cardNumber={cardNumber} setCardNumber={setCardNumber}
              cardExpiry={cardExpiry} setCardExpiry={setCardExpiry}
              cardCvv={cardCvv} setCardCvv={setCardCvv}
            />
          )}
          {step === 4 && (
            <StepReviewConfirm
              guestName={`${firstName} ${lastName}`.trim()}
              email={email}
              phone={phone}
              nationality={nationality}
              clientType={clientType}
              room={room}
              checkIn={checkInDate}
              checkOut={checkOutDate}
              nights={nights}
              total={total}
              effectiveRate={effectiveRate}
              rateOverride={rateOverride}
              meal={meal}
              adults={adults}
              children={children}
              vip={vip}
              specialRequests={specialRequests}
              collectPayment={collectPayment}
              payMethod={payMethod}
              payAmount={payAmount}
              grandTotal={grandTotal}
              keyIssued={keyIssued}
              keyRef={keyRef}
              setKeyIssued={setKeyIssued}
              setKeyRef={setKeyRef}
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
  guestName, roomId, roomType, checkIn, checkOut, nights, total, effectiveRate, reservationId,
  onPrintRegistration,
}: {
  guestName: string; roomId: string; roomType: string; checkIn: string; checkOut: string;
  nights: number; total: number; effectiveRate: number; reservationId: string;
  onPrintRegistration: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl">
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
          <Link to={`/reservations/${reservationId}`} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
            View Reservation
          </Link>
          <Link to="/check-in" className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground">
            Check In Another Guest
          </Link>
          <Link to="/check-in/new" className="inline-flex items-center gap-1.5 rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-success/90">
            New Walk-In
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 1: Guest Details ─── */
function Field({ label, value, onChange, icon, type = "text", placeholder, className }: {
  label: string; value: string; onChange: (v: string) => void;
  icon?: React.ReactNode; type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn("group relative", className)}>
      <div className="relative rounded-xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          className="peer block w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none placeholder-transparent"
        />
        <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-primary">
          {label}
        </label>
      </div>
    </div>
  );
}

function NumberStepper({ label, value, onChange, min = 0, max = 99 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="grid h-7 w-7 place-items-center rounded-lg border border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground">−</button>
        <span className="text-xl font-bold tabular-nums">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="grid h-7 w-7 place-items-center rounded-lg border border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground">+</button>
      </div>
    </div>
  );
}

function StepGuestDetails({
   guests,
   firstName, setFirstName, lastName, setLastName,
   email, setEmail, phone, setPhone,
   nationality, setNationality,
   clientType, setClientType, idType, setIdType, idTypes, idNumber, setIdNumber,
   purpose, setPurpose, carReg, setCarReg,
   vip, setVip,
    taxTreatment, setTaxTreatment,
    serviceCharge, setServiceCharge,
    specialRequirements, setSpecialRequirements,
    billingArrangement, setBillingArrangement,
    corporateAccounts,
    travelAgentAccounts,
    corporateAccountId, setCorporateAccountId,
    travelAgentAccountId, setTravelAgentAccountId,
    groupBlockId,
    onGroupBlockSelect,
    checkIn,
    checkOut,
    effectiveRate,
 }: {
   guests: { id: string; fullName: string; email: string; phone: string; idNumber: string; nationality: string }[];
   firstName: string; setFirstName: (v: string) => void;
   lastName: string; setLastName: (v: string) => void;
   email: string; setEmail: (v: string) => void;
   phone: string; setPhone: (v: string) => void;
   nationality: string; setNationality: (v: string) => void;
   clientType: string; setClientType: (v: string) => void;
   idType: string; setIdType: (v: string) => void;
   idTypes: string[];
   idNumber: string; setIdNumber: (v: string) => void;
   purpose: string; setPurpose: (v: string) => void;
   carReg: string; setCarReg: (v: string) => void;
   vip: boolean; setVip: (v: boolean) => void;
   taxTreatment: string; setTaxTreatment: (v: string) => void;
   serviceCharge: string; setServiceCharge: (v: string) => void;
   specialRequirements: string; setSpecialRequirements: (v: string) => void;
   billingArrangement: "pay_at_checkout" | "city_ledger" | "agent_ledger";
   setBillingArrangement: (v: "pay_at_checkout" | "city_ledger" | "agent_ledger") => void;
   corporateAccounts: CorporateAccount[];
   travelAgentAccounts: TravelAgentAccount[];
   corporateAccountId: string | undefined;
   setCorporateAccountId: (v: string | undefined) => void;
   travelAgentAccountId: string | undefined;
   setTravelAgentAccountId: (v: string | undefined) => void;
   groupBlockId: string | undefined;
   onGroupBlockSelect: (id: string | undefined, rate: number) => void;
   checkIn: string;
   checkOut: string;
   effectiveRate: number;
 }) {
   return (
     <div>
       <SectionTitle title="Guest Details" subtitle="Enter the guest's personal and contact information." />
 
       <div className="mb-6">
         <GuestAutocomplete
           firstName={firstName}
           lastName={lastName}
           onSelect={(data) => {
             setFirstName(data.firstName);
             setLastName(data.lastName);
             setEmail(data.email);
             setPhone(data.phone);
             setNationality(data.nationality);
             setIdType(data.idType);
             setIdNumber(data.idNumber);
           }}
         />
       </div>
       <div className="grid gap-4 sm:grid-cols-2">
         <Field icon={<User className="h-4 w-4" />} label="First name" value={firstName} onChange={setFirstName} />
         <Field icon={<User className="h-4 w-4" />} label="Last name" value={lastName} onChange={setLastName} />
         <Field icon={<Mail className="h-4 w-4" />} label="Email" type="email" value={email} onChange={setEmail} />
         <Field icon={<Phone className="h-4 w-4" />} label="Phone" value={phone} onChange={setPhone} />
         <CountrySelect value={nationality} onChange={setNationality} />
         <div className="relative rounded-xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]">
           <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
             <Users className="h-4 w-4" />
           </span>
           <Select value={clientType} onValueChange={setClientType}>
             <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
               <SelectValue placeholder="Client Type" />
             </SelectTrigger>
             <SelectContent className="rounded-2xl">
               {["Individual", "Organisation", "Travel Agent", "Short Stay"].map((ct) => (
                 <SelectItem key={ct} value={ct}>{ct}</SelectItem>
               ))}
             </SelectContent>
           </Select>
           <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">Client Type</label>
         </div>
         <div className="relative rounded-xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]">
           <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
             <IdCard className="h-4 w-4" />
           </span>
           <Select value={idType} onValueChange={setIdType}>
             <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
               <SelectValue placeholder="ID Type" />
             </SelectTrigger>
             <SelectContent className="rounded-2xl">
               {idTypes.map((t) => (
                 <SelectItem key={t} value={t}>{t}</SelectItem>
               ))}
             </SelectContent>
           </Select>
           <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">ID Type</label>
         </div>
         <Field icon={<IdCard className="h-4 w-4" />} label="ID number" value={idNumber} onChange={setIdNumber} className="sm:col-span-2" />
         <Field icon={<Search className="h-4 w-4" />} label="Purpose of visit" value={purpose} onChange={setPurpose} />
         <Field icon={<Search className="h-4 w-4" />} label="Car registration" value={carReg} onChange={setCarReg} />
         <div className="sm:col-span-2">
           <button type="button" onClick={() => setVip(!vip)} className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all", vip ? "border-primary/50 bg-primary/10 text-primary" : "border-border/70 bg-card/30 text-muted-foreground")}>
             <div className={cn("flex h-5 w-5 items-center justify-center rounded-lg border transition-all", vip ? "border-primary bg-primary text-white" : "border-border/70 bg-card/40")}>
               {vip && <Check className="h-3 w-3" />}
             </div>
             VIP Guest
           </button>
         </div>
         {/* Tax & Service Charge */}
         <div className="relative rounded-2xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60">
           <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
             <Landmark className="h-4 w-4" />
           </span>
           <Select value={taxTreatment} onValueChange={setTaxTreatment}>
             <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
               <SelectValue placeholder="Tax" />
             </SelectTrigger>
             <SelectContent className="rounded-2xl">
               {["Inclusive", "Exclusive", "Not Applicable"].map((opt) => (
                 <SelectItem key={opt} value={opt}>{opt}</SelectItem>
               ))}
             </SelectContent>
           </Select>
           <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">Tax</label>
         </div>
         <div className="relative rounded-2xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60">
           <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
             <Landmark className="h-4 w-4" />
           </span>
           <Select value={serviceCharge} onValueChange={setServiceCharge}>
             <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
               <SelectValue placeholder="Service Charge" />
             </SelectTrigger>
             <SelectContent className="rounded-2xl">
               {["Inclusive", "Exclusive", "Not Applicable"].map((opt) => (
                 <SelectItem key={opt} value={opt}>{opt}</SelectItem>
               ))}
             </SelectContent>
           </Select>
           <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">Service Charge</label>
         </div>
         <div className="sm:col-span-2 relative rounded-2xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]">
           <span className="pointer-events-none absolute left-3.5 top-4 text-muted-foreground">
             <MapPin className="h-4 w-4" />
           </span>
           <textarea
             value={specialRequirements}
             onChange={(e) => setSpecialRequirements(e.target.value)}
             placeholder=" "
             rows={3}
             className="peer block w-full resize-none bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none placeholder-transparent"
           />
           <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-primary">
             Special Requirements
           </label>
         </div>
          {/* Billing Arrangement */}
          <div className="sm:col-span-2 relative rounded-2xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
            </span>
            <Select value={billingArrangement} onValueChange={setBillingArrangement}>
              <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
                <SelectValue placeholder="Billing Arrangement" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="pay_at_checkout">Pay at Check-out</SelectItem>
                <SelectItem value="city_ledger">Organisation (City Ledger)</SelectItem>
                <SelectItem value="agent_ledger">Travel Agent (Agent Ledger)</SelectItem>
              </SelectContent>
            </Select>
            <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">Billing Arrangement</label>
          </div>
          {billingArrangement === "city_ledger" && (
            <div className="sm:col-span-2 relative rounded-2xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
              </span>
              <Select value={corporateAccountId ?? ""} onValueChange={(v) => setCorporateAccountId(v || undefined)}>
                <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
                  <SelectValue placeholder="Select Organisation" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {corporateAccounts.filter((c) => c.isActive).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">Organisation</label>
            </div>
          )}
          {billingArrangement === "agent_ledger" && (
            <div className="sm:col-span-2 relative rounded-2xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Globe className="h-4 w-4" />
              </span>
              <Select value={travelAgentAccountId ?? ""} onValueChange={(v) => setTravelAgentAccountId(v || undefined)}>
                <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
                  <SelectValue placeholder="Select Travel Agent" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {travelAgentAccounts.filter((a) => a.isActive).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.agencyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">Travel Agent</label>
            </div>
          )}
          {/* Group Block Selection */}
          <div className="sm:col-span-2">
            <StepGroupBlock
             checkIn={checkIn}
             checkOut={checkOut}
             groupBlockId={groupBlockId}
             currentRate={effectiveRate}
             onSelect={onGroupBlockSelect}
           />
         </div>
       </div>
     </div>
   );
}

/* ─── Step 1: Room & Dates ─── */
function StepRoomDates({
  checkIn, setCheckIn, checkOut, setCheckOut,
  nights,
  selectedRoom, selectRoom, roomOptions,
  mealPlan, setMealPlan, mealPlans,
  adults, setAdults, children, setChildren,
  arrivalTime, setArrivalTime,
  checkOutTime, setCheckOutTime,
  extraBeds, setExtraBeds,
  specialRequests, setSpecialRequests,
}: {
  checkIn: string; setCheckIn: (v: string) => void;
  checkOut: string; setCheckOut: (v: string) => void;
  nights: number;
  selectedRoom: string; selectRoom: (id: string) => void;
  roomOptions: { id: string; roomNumber: string; type: string; rate: number; available: boolean; floor: string }[];
  mealPlan: string; setMealPlan: (v: string) => void;
  mealPlans: { id: string; label: string; desc: string; price: number }[];
  adults: number; setAdults: (v: number) => void;
  children: number; setChildren: (v: number) => void;
  arrivalTime: string; setArrivalTime: (v: string) => void;
  checkOutTime: string; setCheckOutTime: (v: string) => void;
  extraBeds: number; setExtraBeds: (v: number) => void;
  specialRequests: string; setSpecialRequests: (v: string) => void;
}) {
  const available = roomOptions.filter((r) => r.available);
  const [type, setType] = useState("All");
  const filtered = available.filter((r) => type === "All" || r.type === type);
  const types = ["All", ...new Set(available.map((r) => r.type))];

  return (
    <div>
      <SectionTitle title="Dates & Meal Plan" subtitle="Pick your stay window and dining preference." />
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <DatePicker value={checkIn} onChange={setCheckIn} />
        <DatePicker value={checkOut} onChange={setCheckOut} />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card/30 p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Nights</div>
          <div className="mt-1 text-2xl font-bold">{nights}</div>
        </div>
        <NumberStepper label="Adults" value={adults} onChange={setAdults} min={1} max={10} />
        <NumberStepper label="Children" value={children} onChange={setChildren} min={0} max={10} />
        <NumberStepper label="Extra beds" value={extraBeds} onChange={setExtraBeds} min={0} max={5} />
      </div>
      <div className={"mb-6 grid gap-3 " + (checkIn === checkOut && checkIn && arrivalTime && checkOutTime ? "grid-cols-3" : "grid-cols-2")}>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {checkIn === checkOut && checkIn ? "Check-in time" : "Arrival time"}
          </div>
          <TimePicker value={arrivalTime} onChange={setArrivalTime} />
        </div>
        {checkIn === checkOut && checkIn && (
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Check-out time
            </div>
            <TimePicker value={checkOutTime} onChange={setCheckOutTime} />
          </div>
        )}
        {checkIn === checkOut && checkIn && arrivalTime && checkOutTime && (
          <div className="rounded-xl border border-border/60 bg-card/30 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Duration</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">
              {(() => {
                const [ah, am] = arrivalTime.split(":").map(Number);
                const [bh, bm] = checkOutTime.split(":").map(Number);
                let diff = (bh * 60 + bm) - (ah * 60 + am);
                if (diff < 0) diff += 1440;
                const h = Math.floor(diff / 60);
                const m = diff % 60;
                return `${h}h ${m}m`;
              })()}
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {types.map((t) => (
          <button key={t} onClick={() => setType(t)} className={cn("rounded-xl border px-3 py-1.5 text-xs font-medium transition", type === t ? "border-primary/50 bg-primary/15 text-primary" : "border-border/60 bg-card/30 text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-6 text-center text-sm text-warning">
          No rooms available for the selected dates.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const active = selectedRoom === r.id;
            return (
              <button key={r.id} onClick={() => selectRoom(r.id)}
                className={cn("group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-4 text-left transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20",
                  active && "border-primary/60 bg-gradient-to-br from-primary/15 to-success/10 shadow-xl shadow-primary/30 ring-2 ring-primary/40"
                )}
              >
                {active && <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3.5 w-3.5" /></span>}
                <div className="flex items-start justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-success/30"><BedDouble className="h-4 w-4 text-primary" /></span>
                  <span className="text-[10px] uppercase tracking-wider text-success">● Available</span>
                </div>
                <div className="mt-3 font-display text-2xl font-bold tracking-tight">Room {r.roomNumber}</div>
                <div className="text-xs text-muted-foreground">{r.type} · Floor {r.floor}</div>
                <div className="mt-3 text-sm font-semibold">{fmtUGX(r.rate)} / night</div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Utensils className="h-4 w-4 text-primary" /> Meal plan
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {mealPlans.map((m) => {
            const active = m.id === mealPlan;
            return (
              <button key={m.id} onClick={() => setMealPlan(m.id)}
                className={cn("rounded-2xl border p-4 text-left transition-all", active ? "border-primary/60 bg-gradient-to-br from-primary/15 to-success/10 shadow-lg shadow-primary/30 ring-2 ring-primary/40" : "border-border/60 bg-card/30 hover:-translate-y-0.5 hover:border-primary/40")}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold">{m.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.id}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
                <div className="mt-3 text-sm font-semibold">{m.price === 0 ? "Included" : `+${fmtUGX(m.price)}/night`}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Special requests</label>
        <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={3}
          placeholder="Late arrival, dietary needs, room preference…"
          className="w-full resize-none rounded-xl border border-border/70 bg-card/40 p-3 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
        />
      </div>
    </div>
  );
}

/* ─── Step 3: Rate & Payment ─── */
function StepRatePayment({
  ratePerNight, setRatePerNight, nights, total, roomTotal, meal,
  rateOverride, setRateOverride, overrideRate, setOverrideRate, authCode, setAuthCode,
  collectPayment, setCollectPayment, payMethod, setPayMethod,
  payPhone, setPayPhone, payAmount, setPayAmount, payRef, setPayRef,
  cardholderName, setCardholderName, cardNumber, setCardNumber, cardExpiry, setCardExpiry, cardCvv, setCardCvv,
}: {
  ratePerNight: number; setRatePerNight: (v: number) => void;
  nights: number; total: number; roomTotal: number; meal: { label: string; price: number };
  rateOverride: boolean; setRateOverride: (v: boolean) => void;
  overrideRate: number; setOverrideRate: (v: number) => void;
  authCode: string; setAuthCode: (v: string) => void;
  collectPayment: boolean; setCollectPayment: (v: boolean) => void;
  payMethod: string; setPayMethod: (v: "mtn_momo" | "airtel_money" | "card" | "cash" | "") => void;
  payPhone: string; setPayPhone: (v: string) => void;
  payAmount: number; setPayAmount: (v: number) => void;
  payRef: string; setPayRef: (v: string) => void;
  cardholderName: string; setCardholderName: (v: string) => void;
  cardNumber: string; setCardNumber: (v: string) => void;
  cardExpiry: string; setCardExpiry: (v: string) => void;
  cardCvv: string; setCardCvv: (v: string) => void;
}) {
  const collected = collectPayment && payMethod ? effectiveDeposit(total, payMethod, payAmount) : 0;

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle title="Rate" subtitle="Set the nightly rate for this stay." />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Rate per night</label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">UGX</span>
              <input type="number" value={ratePerNight} onChange={(e) => { setRatePerNight(Number(e.target.value)); setOverrideRate(Number(e.target.value)); }}
                className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm outline-none focus:border-primary/60"
              />
            </div>
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
              Rate override requires manager authorization code.
            </div>
          </div>
        )}

        <div className="mt-4 space-y-1.5 rounded-xl bg-muted/30 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Room × {nights} night{nights !== 1 ? "s" : ""}</span>
            <span className="font-medium tabular-nums">{fmtUGX(roomTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{meal.label}</span>
            <span className="font-medium tabular-nums">+{fmtUGX(meal.price * Math.max(1, nights))}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-1.5">
            <span className="text-sm text-muted-foreground">Total stay</span>
            <span className="text-base font-bold tabular-nums">{fmtUGX(total)}</span>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle title="Payment" subtitle="Collect payment or pre-authorize." />
        <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/30 px-4 py-3 transition hover:border-primary/40 cursor-pointer">
          <input type="checkbox" checked={collectPayment} onChange={(e) => setCollectPayment(e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />
          <div>
            <span className="text-sm font-medium">Collect payment</span>
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
                <button key={pm.id} onClick={() => {
                  setPayMethod(pm.id);
                  if (payAmount === 0) setPayAmount(effectiveDeposit(total, pm.id, 0));
                }}
                  className={cn("rounded-lg border px-3 py-2.5 text-xs font-medium transition",
                    payMethod === pm.id ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
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
                <div><label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cardholder name</label><input value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} placeholder="John Doe" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60" /></div>
                <div><label className="text-[10px] uppercase tracking-wider text-muted-foreground">Card number</label><input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" maxLength={19} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] uppercase tracking-wider text-muted-foreground">Expiry date</label><input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60" /></div>
                  <div><label className="text-[10px] uppercase tracking-wider text-muted-foreground">CVV</label><input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" maxLength={4} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60" /></div>
                </div>
                <div><label className="text-[10px] uppercase tracking-wider text-muted-foreground">Card reference (last 4 digits)</label><input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="4242" maxLength={4} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60" /></div>
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
                    className={cn("rounded-lg border px-3 py-2 text-xs font-medium transition",
                      payAmount >= total ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    Full (100%)
                  </button>
                  <button
                    onClick={() => setPayAmount(Math.round(total * 0.5))}
                    className={cn("rounded-lg border px-3 py-2 text-xs font-medium transition",
                      payAmount > 0 && payAmount < total ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
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
                  <span className={cn("font-semibold tabular-nums", collected >= total ? "text-success" : "text-warning")}>
                    {fmtUGX(Math.max(0, total - collected))}
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
  guestName, email, phone, nationality, clientType,
  room, checkIn, checkOut, nights, total, effectiveRate, rateOverride,
  meal, adults, children, vip, specialRequests,
  collectPayment, payMethod, payAmount, grandTotal,
  keyIssued, keyRef, setKeyIssued, setKeyRef,
}: {
  guestName: string; email: string; phone: string; nationality: string; clientType: string;
  room: { id: string; roomNumber: string; type: string } | undefined;
  checkIn: string; checkOut: string; nights: number; total: number; effectiveRate: number; rateOverride: boolean;
  meal: { label: string; price: number };
  adults: number; children: number; vip: boolean; specialRequests: string;
  collectPayment: boolean; payMethod: string; payAmount: number; grandTotal: number;
  keyIssued: boolean; keyRef: string; setKeyIssued: (v: boolean) => void; setKeyRef: (v: string) => void;
}) {
  const collected = collectPayment && payMethod ? effectiveDeposit(grandTotal, payMethod, payAmount) : 0;

  return (
    <div>
      <SectionTitle title="Review & Confirm" subtitle="Double-check everything before checking in the guest." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Guest</h4>
          <div className="mt-3 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/50 to-success/50 text-lg font-bold text-primary-foreground">
              {(guestName?.charAt(0) ?? "?").toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-semibold">{guestName}</div>
              <div className="text-xs text-muted-foreground">{email} · {phone}</div>
              <div className="text-xs text-muted-foreground">{nationality} · {clientType}</div>
              {vip && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber/10 px-2 py-0.5 text-xs font-semibold text-amber">VIP</span>}
            </div>
          </div>

          <div className="my-5 h-px bg-border/50" />
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Stay</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <ReviewItem label="Room" value={room ? `Room ${room.roomNumber} · ${room.type}` : "—"} />
            <ReviewItem label="Check in" value={checkIn} />
            <ReviewItem label="Check out" value={checkOut} />
            <ReviewItem label="Nights" value={String(nights)} />
            <ReviewItem label="Rate" value={`${fmtUGX(effectiveRate)} / night${rateOverride ? " (overridden)" : ""}`} />
            <ReviewItem label="Guests" value={`${adults} Adult${adults !== 1 ? "s" : ""}${children ? `, ${children} Child` : ""}`} />
            <ReviewItem label="Meal plan" value={meal.label} />
          </div>

          <div className="my-5 h-px bg-border/50" />
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Key Card</h4>
          <div className="mt-3">
            {keyIssued ? (
              <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-success">Key Card Issued</p>
                  <p className="text-xs text-muted-foreground">Reference: {keyRef} · Expires: {checkOut}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-card/30 p-4 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                  <Lock className="h-5 w-5 text-muted-foreground/40" />
                </span>
                <p className="mt-2 text-sm text-muted-foreground">No key card issued yet</p>
                <button onClick={() => { setKeyIssued(true); setKeyRef(`KC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`); toast.success("Key card encoded for Room " + room?.roomNumber); }}
                  disabled={!room}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
                >
                  <Key className="h-3.5 w-3.5" /> Encode Key Card
                </button>
              </div>
            )}
          </div>

          {specialRequests && (
            <>
              <div className="my-5 h-px bg-border/50" />
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Special Requests</h4>
              <p className="mt-2 text-sm">{specialRequests}</p>
            </>
          )}
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Summary</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">{nights === 0 ? "Short stay" : `Room × ${nights} night${nights !== 1 ? "s" : ""}`}</span>
              <span className="font-medium tabular-nums">{fmtUGX(effectiveRate * Math.max(1, nights))}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">{meal.label}</span>
              <span className="font-medium tabular-nums">+{fmtUGX(meal.price * Math.max(1, nights))}</span>
            </li>
            {collectPayment && payMethod && (
              <li className="flex justify-between border-t border-border/50 pt-3">
                <span className="text-success">Deposit ({payMethod === "mtn_momo" ? "MTN MoMo" : payMethod === "airtel_money" ? "Airtel Money" : payMethod === "card" ? "Card" : "Cash"})</span>
                <span className="font-bold text-success">{fmtUGX(collected)}</span>
              </li>
            )}
            {collectPayment && payMethod && collected > 0 && collected < grandTotal && (
              <li className="flex justify-between">
                <span className="text-muted-foreground">Balance due at check-out</span>
                <span className="font-semibold text-warning">{fmtUGX(Math.max(0, grandTotal - collected))}</span>
              </li>
            )}
          </ul>
          <div className="my-4 h-px bg-border/50" />
          <div className="flex items-end justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
            <span className="text-2xl font-bold text-gradient-primary tabular-nums">{fmtUGX(total + meal.price * Math.max(1, nights))}</span>
          </div>
          <div className="mt-6 rounded-xl border border-info/30 bg-info/10 p-3 text-xs text-info">
            <p className="font-medium">Check-in activates the room</p>
            <p className="mt-0.5 text-muted-foreground">A reservation will be created and the room will be set to occupied immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
