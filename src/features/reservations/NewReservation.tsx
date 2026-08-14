import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Check,
  CheckCircle2,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Smartphone,
  Landmark,
  User,
  Users,
  Utensils,
  Calendar as CalIcon,
  Printer,
  Building2,
  Globe,
} from "lucide-react";
import { cn, effectiveDeposit } from "@/lib/utils";
import {
  MEAL_PLAN_IDS,
  MEAL_PLAN_LABELS,
  MEAL_PLAN_DESCRIPTIONS,
} from "@/lib/pms-store";

function MtnIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#FFC915" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontWeight="700"
        fontSize="13"
        fill="#000"
        fontFamily="Arial"
      >
        M
      </text>
    </svg>
  );
}

function AirtelIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#E40101" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontWeight="700"
        fontSize="13"
        fill="#FFF"
        fontFamily="Arial"
      >
        A
      </text>
    </svg>
  );
}

function CashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 9h3m14 0h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" />
      <line
        x1="6"
        y1="14"
        x2="10"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
import { DatePicker } from "@/components/ui/date-picker";
import { CountrySelect } from "@/shared/components/CountrySelect";
import { GuestAutocomplete } from "@/shared/components/GuestAutocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createReservation, findAvailableRooms, fmtUGX, useStore, type PaymentMethod, type CorporateAccount, type TravelAgentAccount } from "@/lib/pms-store";
import { StepGroupBlock } from "@/features/groups/StepGroupBlock";
import { TimePicker } from "@/shared/components/TimePicker";

export default function NewReservationPage() {
  return <NewReservation />;
}

const steps = [
  { id: 1, label: "Room Selection", icon: BedDouble },
  { id: 2, label: "Guest Details", icon: User },
  { id: 3, label: "Dates & Plan", icon: CalIcon },
  { id: 4, label: "Review", icon: CheckCircle2 },
] as const;

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  clientType: string;
  idType: string;
  idNumber: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  mealPlan: string;
  adults: number;
  children: number;
  specialRequests: string;
  arrivalTime: string;
  checkOutTime: string;
  extraBeds: number;
  purpose: string;
  carReg: string;
  ratePlanId: string;
  discountPct: number;
  depositAmount: number;
  paymentMethod: PaymentMethod | "";
  paymentPhone: string;
  paymentReference: string;
  cardholderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  collectPayment: boolean;
  vip: boolean;
  taxTreatment: string;
  serviceCharge: string;
  specialRequirements: string;
  billingArrangement: string;
  corporateAccountId?: string;
  travelAgentAccountId?: string;
};

type RoomOption = {
  id: string;
  roomNumber: string;
  type: string;
  rate: number;
  beds: string;
  available: boolean;
  typeId: string;
  policyName: string;
  policyDesc: string;
};

function useRoomOptions(checkIn: string, checkOut: string): RoomOption[] {
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const ratePlans = useStore((s) => s.ratePlans);
  const cancellationPolicies = useStore((s) => s.cancellationPolicies);
  const haveDates = !!(checkIn && checkOut && checkIn <= checkOut);

  const policyForType = (roomTypeId: string) => {
    const rp = ratePlans.find((p) => p.roomTypeId === roomTypeId && p.isActive);
    if (!rp?.cancellationPolicyId) return { name: "Standard", desc: "" };
    const cp = cancellationPolicies.find((c) => c.id === rp.cancellationPolicyId);
    return {
      name: cp?.name ?? "Standard",
      desc: cp ? describePolicy(cp) : "",
    };
  };

  return rooms.map((r) => {
    const rt = roomTypes.find((t) => t.id === r.roomTypeId);
    const available = haveDates
      ? findAvailableRooms(r.roomTypeId, checkIn, checkOut).some((a) => a.id === r.id)
      : r.status === "available";
    const policy = policyForType(r.roomTypeId);
    return {
      id: r.id,
      roomNumber: r.roomNumber,
      type: rt?.name ?? r.roomTypeId,
      typeId: r.roomTypeId,
      rate: rt?.baseRate ?? 0,
      beds: rt?.name === "Suite" ? "1 King + Sofa" : rt?.name === "Deluxe" ? "1 King" : rt?.name === "Deluxe Single" ? "1 Single" : rt?.name === "Deluxe Double" ? "1 Queen" : "1 Queen",
      available,
      policyName: policy.name,
      policyDesc: policy.desc,
    };
  });
}

function describePolicy(cp: { freeCancelHoursBefore: number; partialRefundPct: number; partialRefundHoursBefore: number; noShowChargePct: number }) {
  const parts: string[] = [];
  if (cp.freeCancelHoursBefore > 0) {
    parts.push(`Free cancellation up to ${cp.freeCancelHoursBefore} hours before check-in`);
  }
  if (cp.partialRefundPct > 0) {
    parts.push(`${cp.partialRefundPct}% refund if cancelled ${cp.partialRefundHoursBefore} hours before`);
  }
  parts.push(`No-show charge: ${cp.noShowChargePct}% of first night`);
  return parts.join(". ");
}

function NewReservation() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const [groupBlockId, setGroupBlockId] = useState<string | undefined>(
     searchParams.get("groupBlockId") || undefined,
   );
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationality: "Uganda",
    clientType: "Individual",
    idType: "Passport",
    idNumber: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    mealPlan: "BB",
    adults: 1,
    children: 0,
    specialRequests: "",
    arrivalTime: "",
    checkOutTime: "",
    extraBeds: 0,
    purpose: "",
    carReg: "",
    ratePlanId: "",
    discountPct: 0,
    depositAmount: 0,
    paymentMethod: "",
    paymentPhone: "",
    paymentReference: "",
    cardholderName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    collectPayment: false,
    vip: false,
    taxTreatment: "Inclusive",
    serviceCharge: "Inclusive",
    specialRequirements: "",
    billingArrangement: "pay_at_checkout",
    corporateAccountId: undefined,
    travelAgentAccountId: undefined,
  });
  
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const roomOptions = useRoomOptions(form.checkIn, form.checkOut);
  const ratePlans = useStore((s) => s.ratePlans);
  const groupBlocks = useStore((s) => s.groupBlocks);
  const room = roomOptions.find((r) => r.id === form.roomId);
  const availableRatePlans = useMemo(
    () => ratePlans.filter((rp) => rp.roomTypeId === room?.typeId && rp.isActive),
    [ratePlans, room?.typeId],
  );
  const selectedRatePlan = useMemo(
    () => availableRatePlans.find((rp) => rp.id === form.ratePlanId),
    [availableRatePlans, form.ratePlanId],
  );
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
  const groupBlock = groupBlockId
    ? groupBlocks.find((b) => b.id === groupBlockId)
    : undefined;
  const effectiveRate =
    groupBlock?.groupRate ?? selectedRatePlan?.nightlyRate ?? room?.rate ?? 0;
  const meal = mealPlans.find((m) => m.id === form.mealPlan) ?? mealPlans[0];
  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 0;
    const a = new Date(form.checkIn).getTime();
    const b = new Date(form.checkOut).getTime();
    return Math.max(0, Math.round((b - a) / 86_400_000));
  }, [form.checkIn, form.checkOut]);
  const tenant = useStore((s) => s.tenant);
  const corporateAccounts = useStore((s) => s.corporateAccounts);
  const travelAgentAccounts = useStore((s) => s.travelAgentAccounts);
  const taxRate = tenant?.vatRate ?? 0.18;
  const roomTypeFilters = useStore((s) => s.roomTypeFilterConfig.types);
  const idTypeConfigTypes = useStore((s) => s.idTypeConfig.types);
  const billedNights = Math.max(1, nights);
  const subtotal = effectiveRate * billedNights;
  const mealTotal = meal.price * billedNights;
  const tax = Math.round((subtotal + mealTotal) * taxRate);
  const discountAmount = Math.round((subtotal + mealTotal) * (form.discountPct / 100));
  const total = subtotal + mealTotal + tax - discountAmount;
  const paymentAmount =
    form.collectPayment && form.paymentMethod
      ? effectiveDeposit(total, form.paymentMethod, form.depositAmount)
      : 0;

  const canNext =
    step === 1
      ? !!form.roomId
      : step === 2
        ? form.firstName && form.lastName && form.email && form.phone
        : step === 3
          ? form.checkIn && form.checkOut && nights >= 0
          : true;

  const go = (n: number) => {
    setDirection(n > step ? 1 : -1);
    setStep(n);
  };
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!room) return;
    const res = createReservation({
      guestName: `${form.firstName} ${form.lastName}`.trim(),
      guestEmail: form.email,
      guestPhone: form.phone,
      nationality: form.nationality,
      clientType: form.clientType,
      idType: form.idType,
      idNumber: form.idNumber,
      roomTypeId: room.typeId,
      roomId: room.id,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      adults: form.adults,
      children: form.children,
      ratePerNight: effectiveRate,
      mealPlan: form.mealPlan,
      bookingSource: "direct_web",
      arrivalTime: form.arrivalTime || undefined,
      checkOutTime: form.checkOutTime || undefined,
      extraBeds: form.extraBeds || undefined,
      purpose: form.purpose || undefined,
      carReg: form.carReg || undefined,
      specialRequests: form.specialRequirements || form.specialRequests,
      vipFlag: form.vip,
      groupBlockId,
      billingArrangement: form.billingArrangement as "pay_at_checkout" | "city_ledger" | "agent_ledger",
      corporateAccountId: form.corporateAccountId,
      travelAgentAccountId: form.travelAgentAccountId,
      discount: discountAmount > 0 ? discountAmount : undefined,
      ...(paymentAmount > 0 && form.paymentMethod
        ? {
            payment: {
              method: form.paymentMethod,
              amount: paymentAmount,
              phone:
                form.paymentMethod === "mtn_momo" || form.paymentMethod === "airtel_money"
                  ? form.paymentPhone
                  : undefined,
              reference: form.paymentReference || undefined,
            },
          }
        : {}),
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSubmitted(true);
    setConfirmationId(res.id);
  };

  const [confirmationId, setConfirmationId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={groupBlockId ? `/groups/${groupBlockId}` : "/reservations"}
            className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">New Reservation</h1>
            <p className="text-sm text-muted-foreground">
              {groupBlockId ? "Booking for a group block." : "Create a booking in four quick steps."}
            </p>
          </div>
        </div>
      </div>

      {submitted ? (
        <ConfirmationScreen
          confirmationId={confirmationId!}
          guestName={`${form.firstName} ${form.lastName}`.trim()}
          roomNumber={room?.roomNumber ?? ""}
          roomType={room?.type ?? ""}
          checkIn={form.checkIn}
          checkOut={form.checkOut}
          nights={nights}
          total={total}
          effectiveRate={effectiveRate}
          meal={meal}
          paymentMethod={form.paymentMethod}
          paymentAmount={paymentAmount}
          groupBlockId={groupBlockId}
        />
      ) : (
        <>
      {/* Stepper */}
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

      {/* Step body */}
      <div className="glass overflow-hidden rounded-2xl p-6 sm:p-8">
        <div
          key={step}
          className={cn(
            "animate-in fade-in duration-300",
            direction === 1 ? "slide-in-from-right-4" : "slide-in-from-left-4",
          )}
        >
          {step === 1 && (
            <StepRoomSelection
              rooms={roomOptions}
              selected={form.roomId}
              onSelect={(id) => {
                set("roomId", id);
                set("ratePlanId", "");
                go(2);
              }}
              ratePlans={availableRatePlans}
              selectedRatePlanId={form.ratePlanId}
              onRatePlanSelect={(id) => set("ratePlanId", id)}
              roomTypeFilters={roomTypeFilters}
            />
          )}
          {step === 2 && (
            <StepGuestDetails
              form={form}
              set={set}
              idTypes={idTypeConfigTypes}
              groupBlockId={groupBlockId}
              onGroupBlockSelect={(id, rate) => {
                setGroupBlockId(id);
                set("ratePlanId", "");
              }}
              corporateAccounts={corporateAccounts}
              travelAgentAccounts={travelAgentAccounts}
              checkIn={form.checkIn}
              checkOut={form.checkOut}
              effectiveRate={effectiveRate}
            />
          )}
          {step === 3 && <StepDatesAndPlan form={form} set={set} nights={nights} meal={meal} mealPlans={mealPlans} />}
          {step === 4 && (
            <StepReview
              form={form}
              set={set}
              room={room}
              meal={meal}
              nights={nights}
              subtotal={subtotal}
              mealTotal={mealTotal}
              tax={tax}
              taxRate={taxRate}
              total={total}
              discountPct={form.discountPct}
              discountAmount={discountAmount}
              submitted={submitted}
            />
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-destructive/20 text-[10px] font-bold">
              !
            </span>
            {error}
          </div>
        )}
        {/* Footer */}
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
                  <CheckCircle2 className="h-4 w-4 animate-pulse" /> Reservation created
                </>
              ) : (
                <>
                  Confirm Reservation
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}

/* ───────────────────────── Step Guest Details ───────────────────────── */
function StepGuestDetails({
  form,
  set,
  idTypes,
  groupBlockId,
  onGroupBlockSelect,
  corporateAccounts,
  travelAgentAccounts,
  checkIn,
  checkOut,
  effectiveRate,
}: {
  form: Form;
  set: <K extends keyof Form>(k: K, v: Form[K]) => void;
  idTypes: string[];
  groupBlockId: string | undefined;
  onGroupBlockSelect: (id: string | undefined, rate: number) => void;
  corporateAccounts: CorporateAccount[];
  travelAgentAccounts: TravelAgentAccount[];
  checkIn: string;
  checkOut: string;
  effectiveRate: number;
}) {
  return (
    <div>
      <SectionTitle title="Guest Details" subtitle="Tell us about the primary guest." />
      <div className="grid gap-4 sm:grid-cols-2">
        <GuestAutocomplete
          firstName={form.firstName}
          lastName={form.lastName}
          onSelect={(data) => {
            set("firstName", data.firstName);
            set("lastName", data.lastName);
            set("email", data.email);
            set("phone", data.phone);
            set("nationality", data.nationality);
            set("idType", data.idType);
            set("idNumber", data.idNumber);
          }}
        />
        <div className="sm:col-span-2">
          <div className="relative rounded-2xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Users className="h-4 w-4" />
            </span>
            <Select value={form.clientType} onValueChange={(v) => set("clientType", v)}>
              <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
                <SelectValue placeholder="Client Type" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {["Individual", "Organisation", "Travel Agent", "Short Stay"].map((ct) => (
                  <SelectItem key={ct} value={ct}>
                    {ct}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">
              Client Type
            </label>
          </div>
        </div>
        <Field
          icon={<User className="h-4 w-4" />}
          label="First name"
          value={form.firstName}
          onChange={(v) => set("firstName", v)}
        />
        <Field
          icon={<User className="h-4 w-4" />}
          label="Last name"
          value={form.lastName}
          onChange={(v) => set("lastName", v)}
        />
        <Field
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => set("email", v)}
        />
        <Field
          icon={<Phone className="h-4 w-4" />}
          label="Phone"
          value={form.phone}
          onChange={(v) => set("phone", v)}
        />
        <CountrySelect
          value={form.nationality}
          onChange={(v) => set("nationality", v)}
        />
        <SelectField
          icon={<IdCard className="h-4 w-4" />}
          label="ID type"
          value={form.idType}
          onChange={(v) => set("idType", v)}
          options={idTypes}
        />
        <Field
          icon={<IdCard className="h-4 w-4" />}
          label="ID number"
          value={form.idNumber}
          onChange={(v) => set("idNumber", v)}
          className="sm:col-span-2"
        />
        {/* VIP toggle */}
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => set("vip", !form.vip)}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
              form.vip
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/70 bg-card/30 text-muted-foreground",
            )}
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-lg border transition-all",
                form.vip
                  ? "border-primary bg-primary text-white"
                  : "border-border/70 bg-card/40",
              )}
            >
              {form.vip && <Check className="h-3 w-3" />}
            </div>
            VIP Guest
          </button>
        </div>
        {/* Tax & Service Charge dropdowns */}
        <div className="sm:col-span-2 relative rounded-2xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Landmark className="h-4 w-4" />
          </span>
          <Select value={form.taxTreatment} onValueChange={(v) => set("taxTreatment", v)}>
            <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
              <SelectValue placeholder="Tax" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {["Inclusive", "Exclusive", "Not Applicable"].map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">
            Tax
          </label>
        </div>
        <div className="sm:col-span-2 relative rounded-2xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Landmark className="h-4 w-4" />
          </span>
          <Select value={form.serviceCharge} onValueChange={(v) => set("serviceCharge", v)}>
            <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
              <SelectValue placeholder="Service Charge" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {["Inclusive", "Exclusive", "Not Applicable"].map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">
            Service Charge
          </label>
        </div>
        <div className="sm:col-span-2 relative rounded-2xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]">
          <span className="pointer-events-none absolute left-3.5 top-4 text-muted-foreground">
            <MapPin className="h-4 w-4" />
          </span>
          <textarea
            value={form.specialRequirements}
            onChange={(e) => set("specialRequirements", e.target.value)}
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
          <Select
            value={form.billingArrangement}
            onValueChange={(v) => set("billingArrangement", v)}
          >
            <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
              <SelectValue placeholder="Billing Arrangement" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="pay_at_checkout">Pay at Check-out</SelectItem>
              <SelectItem value="city_ledger">Organisation (City Ledger)</SelectItem>
              <SelectItem value="agent_ledger">Travel Agent (Agent Ledger)</SelectItem>
            </SelectContent>
          </Select>
          <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">
            Billing Arrangement
          </label>
        </div>
        {form.billingArrangement === "city_ledger" && (
          <div className="sm:col-span-2 relative rounded-2xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
            </span>
            <Select
              value={form.corporateAccountId ?? ""}
              onValueChange={(v) => set("corporateAccountId", v || undefined)}
            >
              <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
                <SelectValue placeholder="Select Organisation" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {corporateAccounts.filter((c) => c.isActive).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">
              Organisation
            </label>
          </div>
        )}
        {form.billingArrangement === "agent_ledger" && (
          <div className="sm:col-span-2 relative rounded-2xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Globe className="h-4 w-4" />
            </span>
            <Select
              value={form.travelAgentAccountId ?? ""}
              onValueChange={(v) => set("travelAgentAccountId", v || undefined)}
            >
              <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto rounded-2xl">
                <SelectValue placeholder="Select Travel Agent" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {travelAgentAccounts.filter((a) => a.isActive).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.agencyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">
              Travel Agent
            </label>
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

/* ───────────────────────── Step 2 ───────────────────────── */
function StepRoomSelection({
  rooms,
  selected,
  onSelect,
  ratePlans,
  selectedRatePlanId,
  onRatePlanSelect,
  roomTypeFilters,
}: {
  rooms: RoomOption[];
  selected: string;
  onSelect: (id: string) => void;
  ratePlans: { id: string; name: string; nightlyRate: number }[];
  selectedRatePlanId: string;
  onRatePlanSelect: (id: string) => void;
  roomTypeFilters: string[];
}) {
  const [type, setType] = useState("All");
  const filtered = rooms.filter((r) => r.available && (type === "All" || r.type === type));
  const selRoom = rooms.find((r) => r.id === selected);
  const validPlans = selRoom ? ratePlans : [];
  return (
    <div>
      <SectionTitle title="Room Selection" subtitle="Pick from live availability." />
      <div className="mb-5 flex flex-wrap gap-2">
        {roomTypeFilters.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-xs font-medium transition",
              type === t
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border/60 bg-card/30 text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => {
          const active = selected === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-4 text-left transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20",
                active &&
                  "border-primary/60 bg-gradient-to-br from-primary/15 to-success/10 shadow-xl shadow-primary/30 ring-2 ring-primary/40",
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
                <span className="text-[10px] uppercase tracking-wider text-success">
                  ● Available
                </span>
              </div>
              <div className="mt-3 font-display text-2xl font-bold tracking-tight">Room {r.roomNumber}</div>
              <div className="text-xs text-muted-foreground">
                {r.type} · {r.beds}
              </div>
              <div className="mt-2">
                <span className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                  r.policyName === "Flexible" ? "bg-success/10 text-success" :
                  r.policyName === "Moderate" ? "bg-warning/10 text-warning" :
                  "bg-destructive/10 text-destructive",
                )}>
                  {r.policyName} cancellation
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-sm font-semibold">UGX {r.rate.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">per night</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {validPlans.length > 0 && (
        <div className="mt-8">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BedDouble className="h-4 w-4 text-primary" /> Rate Plan
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {validPlans.map((rp) => {
              const active = selectedRatePlanId === rp.id;
              return (
                <button
                  key={rp.id}
                  onClick={() => onRatePlanSelect(rp.id)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all",
                    active
                      ? "border-primary/60 bg-gradient-to-br from-primary/15 to-success/10 shadow-lg shadow-primary/30 ring-2 ring-primary/40"
                      : "border-border/60 bg-card/30 hover:-translate-y-0.5 hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold">{rp.name}</span>
                    {active && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="mt-2 text-lg font-bold tabular-nums">
                    {fmtUGX(rp.nightlyRate)} <span className="text-xs font-normal text-muted-foreground">/ night</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Step 3 ───────────────────────── */
function StepDatesAndPlan({
  form,
  set,
  nights,
  meal,
  mealPlans,
}: {
  form: Form;
  set: <K extends keyof Form>(k: K, v: Form[K]) => void;
  nights: number;
  meal: { id: string; label: string; desc: string; price: number };
  mealPlans: { id: string; label: string; desc: string; price: number }[];
}) {
  return (
    <div>
      <SectionTitle
        title="Dates &amp; Meal Plan"
        subtitle="Pick your stay window and dining preference."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker value={form.checkIn} onChange={(v) => set("checkIn", v)} />
        <DatePicker value={form.checkOut} onChange={(v) => set("checkOut", v)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Nights</div>
          <div className="mt-1 text-2xl font-bold text-gradient-primary tabular-nums">{nights}</div>
        </div>
        <NumberStepper
          label="Adults"
          value={form.adults}
          onChange={(v) => set("adults", v)}
          min={1}
          max={6}
        />
        <NumberStepper
          label="Children"
          value={form.children}
          onChange={(v) => set("children", v)}
          min={0}
          max={6}
        />
        <div className="glass rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {form.checkIn === form.checkOut && form.checkIn ? "Check-in time" : "Arrival time"}
          </div>
          <TimePicker
            value={form.arrivalTime}
            onChange={(v) => set("arrivalTime", v)}
          />
        </div>
        {form.checkIn === form.checkOut && form.checkIn && (
          <div className="glass rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Check-out time
            </div>
            <TimePicker
              value={form.checkOutTime}
              onChange={(v) => set("checkOutTime", v)}
            />
          </div>
        )}
        {form.checkIn === form.checkOut && form.checkIn && form.arrivalTime && form.checkOutTime && (
          <div className="glass rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Duration
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums">
              {(() => {
                const [ah, am] = form.arrivalTime.split(":").map(Number);
                const [bh, bm] = form.checkOutTime.split(":").map(Number);
                let diff = (bh * 60 + bm) - (ah * 60 + am);
                if (diff < 0) diff += 1440;
                const h = Math.floor(diff / 60);
                const m = diff % 60;
                return `${h}h ${m}m`;
              })()}
            </div>
          </div>
        )}
        <NumberStepper
          label="Extra beds"
          value={form.extraBeds}
          onChange={(v) => set("extraBeds", v)}
          min={0}
          max={5}
        />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Utensils className="h-4 w-4 text-primary" /> Meal plan
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {mealPlans.map((m) => {
            const active = m.id === form.mealPlan;
            return (
              <button
                key={m.id}
                onClick={() => set("mealPlan", m.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all",
                  active
                    ? "border-primary/60 bg-gradient-to-br from-primary/15 to-success/10 shadow-lg shadow-primary/30 ring-2 ring-primary/40"
                    : "border-border/60 bg-card/30 hover:-translate-y-0.5 hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold">{m.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.id}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
                <div className="mt-3 text-sm font-semibold">
                  {m.price === 0 ? "Included" : `+UGX ${m.price.toLocaleString()}/night`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
          Special requests
        </label>
        <textarea
          value={form.specialRequests}
          onChange={(e) => set("specialRequests", e.target.value)}
          rows={3}
          placeholder="Late arrival, dietary needs, room preference…"
          className="w-full resize-none rounded-xl border border-border/70 bg-card/40 p-3 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
        />
      </div>
    </div>
  );
}

/* ───────────────────────── Step 4 ───────────────────────── */
function StepReview({
  form,
  set,
  room,
  meal,
  nights,
  subtotal,
  mealTotal,
  tax,
  taxRate,
  total,
  discountPct,
  discountAmount,
  submitted,
}: {
  form: Form;
  set: <K extends keyof Form>(k: K, v: Form[K]) => void;
  room: RoomOption | undefined;
  meal: { id: string; label: string; desc: string; price: number };
  nights: number;
  subtotal: number;
  mealTotal: number;
  tax: number;
  taxRate: number;
  total: number;
  discountPct: number;
  discountAmount: number;
  submitted: boolean;
}) {
  const momoAmount = form.collectPayment && form.paymentMethod ? effectiveDeposit(total, form.paymentMethod, form.depositAmount) : 0;

  return (
    <div>
      <SectionTitle
        title="Review &amp; Confirm"
        subtitle="Double-check everything before booking."
      />

      {submitted && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div>
            <div className="font-semibold text-success">Reservation confirmed!</div>
            <div className="text-xs text-muted-foreground">Redirecting to reservations list…</div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Guest
          </h4>
          <div className="mt-3 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/50 to-success/50 text-lg font-bold text-primary-foreground">
              {(form.firstName[0] ?? "?") + (form.lastName[0] ?? "")}
            </div>
            <div>
              <div className="text-lg font-semibold">
                {form.firstName} {form.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {form.email} · {form.phone}
              </div>
              <div className="text-xs text-muted-foreground">
                {form.nationality} · {form.clientType} · {form.idType}
              </div>
              <div className="text-xs text-muted-foreground">
                {form.vip && <span className="mr-2 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">VIP</span>}
                Tax: {form.taxTreatment} · Service: {form.serviceCharge}
              </div>
            </div>
          </div>

          <div className="my-5 h-px bg-border/50" />

          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Stay
          </h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <ReviewItem label="Room" value={room ? `${room.roomNumber} · ${room.type}` : "—"} />
            <ReviewItem label="Check in" value={form.checkIn || "—"} />
            <ReviewItem label="Check out" value={form.checkOut || "—"} />
            <ReviewItem label="Nights" value={String(nights)} />
            <ReviewItem
              label="Guests"
              value={`${form.adults} adult${form.adults !== 1 ? "s" : ""}${form.children ? `, ${form.children} child` : ""}`}
            />
            <ReviewItem label="Meal plan" value={meal.label} />
            {form.arrivalTime && <ReviewItem label="Arrival" value={form.arrivalTime} />}
            {form.extraBeds > 0 && <ReviewItem label="Extra beds" value={String(form.extraBeds)} />}
            {form.purpose && <ReviewItem label="Purpose" value={form.purpose} />}
            {form.carReg && <ReviewItem label="Car" value={form.carReg} />}
          </div>

          {room && (
            <>
              <div className="my-5 h-px bg-border/50" />
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Cancellation Policy
              </h4>
              <div className="mt-3 rounded-xl border border-border/60 bg-card/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    room.policyName === "Flexible" ? "bg-success/10 text-success" :
                    room.policyName === "Moderate" ? "bg-warning/10 text-warning" :
                    "bg-destructive/10 text-destructive",
                  )}>
                    {room.policyName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">cancellation policy</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{room.policyDesc || "Standard cancellation terms apply."}</p>
              </div>
            </>
          )}

          {/* Payment section */}
          <div className="my-5 h-px bg-border/50" />
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Payment
          </h4>
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/30 p-3 transition hover:border-primary/40 cursor-pointer">
              <input
                type="checkbox"
                checked={form.collectPayment}
                onChange={(e) => set("collectPayment", e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary"
              />
              <div>
                <span className="text-sm font-medium">Collect payment at booking</span>
                <p className="text-[11px] text-muted-foreground">
                  Accept deposit via mobile money or card
                </p>
              </div>
            </label>

            {form.collectPayment && (
              <div className="space-y-3 rounded-xl border border-border/60 bg-card/30 p-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Payment method
                  </label>
                  <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: "mtn_momo" as const, label: "MTN MoMo", icon: MtnIcon },
                      { id: "airtel_money" as const, label: "Airtel Money", icon: AirtelIcon },
                      { id: "card" as const, label: "Card", icon: CardIcon },
                      { id: "cash" as const, label: "Cash", icon: CashIcon },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => {
                          set("paymentMethod", pm.id);
                          if (form.depositAmount === 0) set("depositAmount", effectiveDeposit(total, pm.id, 0));
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition",
                          form.paymentMethod === pm.id
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border/60 hover:border-primary/40 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <pm.icon className="h-4 w-4" />
                        {pm.label}
                      </button>
                    ))}
                  </div>
                  {form.paymentMethod && (
                    <div className="rounded-lg bg-muted/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                      Set any deposit amount — the balance is due at check-out.
                    </div>
                  )}
                </div>

                {(form.paymentMethod === "mtn_momo" || form.paymentMethod === "airtel_money") && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Mobile money phone number
                    </label>
                    <input
                      value={form.paymentPhone}
                      onChange={(e) => set("paymentPhone", e.target.value)}
                      placeholder="e.g. +256 700 000 000"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                    />
                  </div>
                )}

                {form.paymentMethod === "card" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Cardholder name
                      </label>
                      <input
                        value={form.cardholderName}
                        onChange={(e) => set("cardholderName", e.target.value)}
                        placeholder="e.g. John Doe"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Card number
                      </label>
                      <input
                        value={form.cardNumber}
                        onChange={(e) => set("cardNumber", e.target.value)}
                        placeholder="e.g. 4242424242424242"
                        maxLength={19}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Expiry date
                        </label>
                        <input
                          value={form.cardExpiry}
                          onChange={(e) => set("cardExpiry", e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          CVV
                        </label>
                        <input
                          value={form.cardCvv}
                          onChange={(e) => set("cardCvv", e.target.value)}
                          placeholder="e.g. 123"
                          maxLength={4}
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Card reference (last 4 digits)
                      </label>
                      <input
                        value={form.paymentReference}
                        onChange={(e) => set("paymentReference", e.target.value)}
                        placeholder="e.g. 4242"
                        maxLength={4}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
                      Amount to collect
                    </label>
                    <span className="text-sm font-bold text-foreground">{fmtUGX(momoAmount)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => set("depositAmount", Math.round(total))}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-medium transition",
                        form.depositAmount >= total
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      Full (100%)
                    </button>
                    <button
                      onClick={() => set("depositAmount", Math.round(total * 0.5))}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-medium transition",
                        form.depositAmount > 0 && form.depositAmount < total
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
                    value={form.depositAmount || ""}
                    onChange={(e) =>
                      set("depositAmount", Math.max(0, Math.min(Math.round(total), Number(e.target.value) || 0)))
                    }
                    placeholder="Custom amount"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-primary/60"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Amount to pay today — the balance is due at check-out. 0 uses the suggested amount for the method.
                  </p>
                  <div className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Balance due at check-out</span>
                    <span className={cn("font-semibold tabular-nums", momoAmount >= total ? "text-success" : "text-warning")}>
                      {fmtUGX(Math.max(0, total - momoAmount))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {form.specialRequests && (
            <>
              <div className="my-5 h-px bg-border/50" />
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Special Requests
              </h4>
              <p className="mt-2 text-sm">{form.specialRequests}</p>
            </>
          )}
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Summary
          </h4>

          <div className="mt-4 rounded-xl border border-border/60 bg-card/30 p-3">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Discount</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={discountPct}
                onChange={(e) => set("discountPct", Math.min(100, Math.max(0, Number(e.target.value))))}
                placeholder="0"
                className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary/60"
              />
              <span className="text-xs text-muted-foreground">% off</span>
              {discountAmount > 0 && (
                <span className="ml-auto text-xs font-medium text-destructive">-{fmtUGX(discountAmount)}</span>
              )}
            </div>
          </div>

          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">
                {nights === 0 ? "Short stay" : `Room × ${nights} night${nights !== 1 ? "s" : ""}`}
              </span>
              <span className="font-medium tabular-nums">UGX {subtotal.toLocaleString()}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">{meal.label}</span>
              <span className="font-medium tabular-nums">UGX {mealTotal.toLocaleString()}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Taxes ({Math.round(taxRate * 100)}%)</span>
              <span className="font-medium tabular-nums">UGX {tax.toLocaleString()}</span>
            </li>
            {discountAmount > 0 && (
              <li className="flex justify-between">
                <span className="text-destructive">Discount ({discountPct}%)</span>
                <span className="font-medium text-destructive tabular-nums">-{fmtUGX(discountAmount)}</span>
              </li>
            )}
            {form.collectPayment && form.paymentMethod && momoAmount > 0 && (
              <li className="flex justify-between border-t border-border/50 pt-3">
                <span className="text-success">
                  Deposit paid (
                  {form.paymentMethod === "mtn_momo"
                    ? "MTN MoMo"
                    : form.paymentMethod === "airtel_money"
                      ? "Airtel Money"
                      : form.paymentMethod === "card"
                        ? "Card"
                        : "Cash"}
                  )
                </span>
                <span className="font-bold text-success">{fmtUGX(momoAmount)}</span>
              </li>
            )}
          </ul>
          <div className="my-4 h-px bg-border/50" />
          <div className="flex items-end justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {form.collectPayment && form.paymentMethod ? "Balance due" : "Total"}
            </span>
            <span className="text-2xl font-bold text-gradient-primary tabular-nums">
              {fmtUGX(
                form.collectPayment && form.paymentMethod ? Math.max(0, total - momoAmount) : total,
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── shared bits ───────────────────────── */

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2
        className="font-display text-2xl font-bold tracking-tight"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  type?: string;
  className?: string;
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

function SelectField({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="relative rounded-xl border border-border/70 bg-card/30 transition focus-within:border-primary/60 focus-within:bg-card/60">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none border-0 shadow-none focus:ring-0 h-auto">
            <SelectValue placeholder={label} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-muted-foreground">
          {label}
        </label>
      </div>
    </div>
  );
}

function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid h-7 w-7 place-items-center rounded-lg border border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
        >
          −
        </button>
        <span className="text-xl font-bold tabular-nums">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="grid h-7 w-7 place-items-center rounded-lg border border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
        >
          +
        </button>
      </div>
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
  confirmationId,
  guestName,
  roomNumber,
  roomType,
  checkIn,
  checkOut,
  nights,
  total,
  effectiveRate,
  meal,
  paymentMethod,
  paymentAmount,
  groupBlockId,
}: {
  confirmationId: string;
  guestName: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  effectiveRate: number;
  meal: { label: string; price: number };
  paymentMethod: string;
  paymentAmount: number;
  groupBlockId?: string;
}) {
  const navigate = useNavigate();
  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(new Date());

  return (
    <>
      <style>{`@media print { body > * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } @page { margin: 1.5cm; size: A4 portrait; } }`}</style>
      <div id="print-area" className="glass rounded-2xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">Reservation Confirmed</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Booking <span className="font-mono font-semibold text-foreground">{confirmationId}</span> was created successfully.
        </p>

        <div className="mx-auto mt-8 max-w-md rounded-xl border border-border bg-card/50 p-5 text-left">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guest</span>
              <span className="font-semibold">{guestName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room</span>
              <span className="font-semibold">{roomNumber} · {roomType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-semibold">{checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-out</span>
              <span className="font-semibold">{checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{nights === 0 ? "Stay" : "Nights"}</span>
              <span className="font-semibold">{nights === 0 ? "Short stay" : nights}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-semibold">{fmtUGX(effectiveRate)} / night</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Meal plan</span>
              <span className="font-semibold">{meal.label}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-base">
              <span className="font-bold">Total</span>
              <span className="font-bold text-success">{fmtUGX(total)}</span>
            </div>
            {paymentAmount > 0 && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Paid via {paymentMethod.replace("_", " ")}</span>
                  <span className="font-semibold text-success">{fmtUGX(paymentAmount)}</span>
                </div>
                {paymentAmount < total && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Balance due at check-out</span>
                    <span className="font-semibold text-warning">{fmtUGX(total - paymentAmount)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Signature section */}
        <div className="mt-8 space-y-5">
          <div className="flex flex-col items-center">
            <span className="block w-[70%] border-b border-foreground h-9" />
            <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Guest Signature</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="block w-[70%] border-b border-foreground h-9" />
            <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Front Desk / Authorized Signature</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Confirmed on {formatted}
        </p>

        <div className="no-print mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:bg-muted"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <a
            href={`mailto:?subject=Reservation Confirmation ${confirmationId}&body=Reservation ${confirmationId} confirmed for ${guestName}.%0A%0ARoom: ${roomNumber} · ${roomType}%0ACheck-in: ${checkIn}%0ACheck-out: ${checkOut}%0ANights: ${nights}%0ATotal: ${fmtUGX(total)}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:bg-muted"
          >
            <Mail className="h-4 w-4" /> Email
          </a>
          <Link
            to={groupBlockId ? `/groups/${groupBlockId}` : "/reservations"}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            {groupBlockId ? "Back to Group Block" : "Back to Reservations"}
          </Link>
        </div>
      </div>
    </>
  );
}
