import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  Utensils,
  Calendar as CalIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createReservation,
  findAvailableRooms,
  fmtUGX,
  useStore,
  type PaymentMethod,
} from "@/lib/pms-store";

export const Route = createFileRoute("/_app/reservations/new")({
  head: () => ({ meta: [{ title: "New Reservation — Jambo ERP" }] }),
  component: NewReservation,
});

const steps = [
  { id: 1, label: "Guest Details", icon: User },
  { id: 2, label: "Room Selection", icon: BedDouble },
  { id: 3, label: "Dates & Plan", icon: CalIcon },
  { id: 4, label: "Review", icon: CheckCircle2 },
] as const;

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  idType: string;
  idNumber: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  mealPlan: string;
  adults: number;
  children: number;
  notes: string;
  arrivalTime: string;
  extraBeds: number;
  purpose: string;
  carReg: string;
  paymentMethod: PaymentMethod | "";
  paymentPhone: string;
  paymentReference: string;
  collectPayment: boolean;
};

type RoomOption = {
  id: string;
  type: string;
  rate: number;
  beds: string;
  available: boolean;
  typeId: string;
};

function useRoomOptions(checkIn: string, checkOut: string): RoomOption[] {
  const rooms = useStore((s) => s.rooms);
  const roomTypes = useStore((s) => s.roomTypes);
  const haveDates = !!(checkIn && checkOut && checkIn < checkOut);
  return rooms.map((r) => {
    const rt = roomTypes.find((t) => t.id === r.roomTypeId);
    const available = haveDates
      ? findAvailableRooms(r.roomTypeId, checkIn, checkOut).some((a) => a.id === r.id)
      : r.status === "available";
    return {
      id: r.id,
      type: rt?.name ?? r.roomTypeId,
      typeId: r.roomTypeId,
      rate: rt?.baseRate ?? 0,
      beds: rt?.name === "Suite" ? "1 King + Sofa" : rt?.name === "Deluxe" ? "1 King" : "1 Queen",
      available,
    };
  });
}

const mealPlans = [
  { id: "RO", label: "Room Only", desc: "Accommodation only", price: 0 },
  { id: "BB", label: "Bed & Breakfast", desc: "Breakfast buffet included", price: 60_000 },
  { id: "HB", label: "Half Board", desc: "Breakfast + dinner", price: 140_000 },
  { id: "FB", label: "Full Board", desc: "All three meals", price: 220_000 },
];

function NewReservation() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationality: "Uganda",
    idType: "Passport",
    idNumber: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    mealPlan: "BB",
    adults: 1,
    children: 0,
    notes: "",
    arrivalTime: "",
    extraBeds: 0,
    purpose: "",
    carReg: "",
    paymentMethod: "",
    paymentPhone: "",
    paymentReference: "",
    collectPayment: false,
  });
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const roomOptions = useRoomOptions(form.checkIn, form.checkOut);
  const room = roomOptions.find((r) => r.id === form.roomId);
  const meal = mealPlans.find((m) => m.id === form.mealPlan)!;
  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 0;
    const a = new Date(form.checkIn).getTime();
    const b = new Date(form.checkOut).getTime();
    return Math.max(0, Math.round((b - a) / 86_400_000));
  }, [form.checkIn, form.checkOut]);
  const tenant = useStore((s) => s.tenant);
  const taxRate = tenant?.vatRate ?? 0.18;
  const subtotal = (room?.rate ?? 0) * nights;
  const mealTotal = meal.price * nights;
  const tax = Math.round((subtotal + mealTotal) * taxRate);
  const total = subtotal + mealTotal + tax;

  const canNext =
    step === 1
      ? form.firstName && form.lastName && form.email && form.phone
      : step === 2
        ? !!form.roomId
        : step === 3
          ? form.checkIn && form.checkOut && nights > 0
          : true;

  const go = (n: number) => {
    setDirection(n > step ? 1 : -1);
    setStep(n);
  };
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!room) return;
    const paymentAmount =
      form.collectPayment && form.paymentMethod
        ? Math.round(
            total *
              (form.paymentMethod === "mtn_momo" || form.paymentMethod === "airtel_money"
                ? 1
                : 0.5),
          )
        : 0;
    const res = createReservation({
      guestName: `${form.firstName} ${form.lastName}`.trim(),
      guestEmail: form.email,
      guestPhone: form.phone,
      nationality: form.nationality,
      idType: form.idType,
      idNumber: form.idNumber,
      roomTypeId: room.roomTypeId,
      roomId: room.id,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      adults: form.adults,
      children: form.children,
      ratePerNight: room.rate,
      mealPlan: form.mealPlan,
      source: "Direct",
      arrivalTime: form.arrivalTime || undefined,
      extraBeds: form.extraBeds || undefined,
      purpose: form.purpose || undefined,
      carReg: form.carReg || undefined,
      notes: form.notes,
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
    setTimeout(() => navigate({ to: "/reservations" }), 1400);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/reservations"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">New Reservation</h1>
            <p className="text-sm text-muted-foreground">Create a booking in four quick steps.</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="glass rounded-2xl p-5">
        <div className="grid grid-cols-4 gap-2">
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
          {step === 1 && <StepGuestDetails form={form} set={set} />}
          {step === 2 && (
            <StepRoomSelection
              rooms={roomOptions}
              selected={form.roomId}
              onSelect={(id) => set("roomId", id)}
            />
          )}
          {step === 3 && <StepDatesAndPlan form={form} set={set} nights={nights} meal={meal} />}
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
    </div>
  );
}

/* ───────────────────────── Step 1 ───────────────────────── */
function StepGuestDetails({
  form,
  set,
}: {
  form: Form;
  set: <K extends keyof Form>(k: K, v: Form[K]) => void;
}) {
  return (
    <div>
      <SectionTitle title="Guest Details" subtitle="Tell us about the primary guest." />
      <div className="grid gap-4 sm:grid-cols-2">
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
        <SelectField
          icon={<MapPin className="h-4 w-4" />}
          label="Nationality"
          value={form.nationality}
          onChange={(v) => set("nationality", v)}
          options={[
            "Uganda",
            "Kenya",
            "Tanzania",
            "Rwanda",
            "Ghana",
            "Nigeria",
            "India",
            "United Kingdom",
            "United States",
            "Other",
          ]}
        />
        <SelectField
          icon={<IdCard className="h-4 w-4" />}
          label="ID type"
          value={form.idType}
          onChange={(v) => set("idType", v)}
          options={["Passport", "National ID", "Driver's License", "Other"]}
        />
        <Field
          icon={<IdCard className="h-4 w-4" />}
          label="ID number"
          value={form.idNumber}
          onChange={(v) => set("idNumber", v)}
          className="sm:col-span-2"
        />
        <Field
          icon={<MapPin className="h-4 w-4" />}
          label="Purpose of visit"
          value={form.purpose}
          onChange={(v) => set("purpose", v)}
          className="sm:col-span-2"
        />
        <Field
          icon={<Smartphone className="h-4 w-4" />}
          label="Car registration"
          value={form.carReg}
          onChange={(v) => set("carReg", v)}
        />
      </div>
    </div>
  );
}

/* ───────────────────────── Step 2 ───────────────────────── */
function StepRoomSelection({
  rooms,
  selected,
  onSelect,
}: {
  rooms: RoomOption[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [type, setType] = useState("All");
  const filtered = rooms.filter((r) => type === "All" || r.type === type);
  return (
    <div>
      <SectionTitle title="Room Selection" subtitle="Pick from live availability." />
      <div className="mb-5 flex flex-wrap gap-2">
        {["All", "Standard", "Deluxe", "Suite"].map((t) => (
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
              disabled={!r.available}
              onClick={() => onSelect(r.id)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-4 text-left transition-all",
                r.available
                  ? "border-border/60 bg-card/40 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20"
                  : "cursor-not-allowed border-border/40 bg-muted/20 opacity-50",
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
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider",
                    r.available ? "text-success" : "text-destructive",
                  )}
                >
                  {r.available ? "● Available" : "● Booked"}
                </span>
              </div>
              <div className="mt-3 font-display text-2xl font-bold tracking-tight">Room {r.roomNumber}</div>
              <div className="text-xs text-muted-foreground">
                {r.type} · {r.beds}
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
    </div>
  );
}

/* ───────────────────────── Step 3 ───────────────────────── */
function StepDatesAndPlan({
  form,
  set,
  nights,
  meal,
}: {
  form: Form;
  set: <K extends keyof Form>(k: K, v: Form[K]) => void;
  nights: number;
  meal: (typeof mealPlans)[number];
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
            Arrival time
          </div>
          <input
            type="time"
            value={form.arrivalTime}
            onChange={(e) => set("arrivalTime", e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </div>
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
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
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
  submitted,
}: {
  form: Form;
  set: <K extends keyof Form>(k: K, v: Form[K]) => void;
  room: RoomOption | undefined;
  meal: (typeof mealPlans)[number];
  nights: number;
  subtotal: number;
  mealTotal: number;
  tax: number;
  taxRate: number;
  total: number;
  submitted: boolean;
}) {
  const momoAmount = form.collectPayment && form.paymentMethod ? total : 0;

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
                {form.nationality} · {form.idType}
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
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {[
                      { id: "mtn_momo" as const, label: "MTN MoMo", icon: MtnIcon },
                      { id: "airtel_money" as const, label: "Airtel Money", icon: AirtelIcon },
                      { id: "card" as const, label: "Card", icon: CardIcon },
                      { id: "cash" as const, label: "Cash", icon: CashIcon },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => set("paymentMethod", pm.id)}
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
                )}

                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Amount to collect</span>
                  <span className="font-bold text-foreground">
                    {fmtUGX(momoAmount > 0 ? momoAmount : total)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {form.notes && (
            <>
              <div className="my-5 h-px bg-border/50" />
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Notes
              </h4>
              <p className="mt-2 text-sm">{form.notes}</p>
            </>
          )}
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Summary
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">
                Room × {nights} night{nights !== 1 && "s"}
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
