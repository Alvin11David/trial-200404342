import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  ClipboardCheck,
  CheckCircle2,
  PartyPopper,
  ListTodo,
  Check,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/events/new")({
  head: () => ({ meta: [{ title: "New Event — Jambo ERP" }] }),
  component: NewEventPage,
});

const venues = [
  "Grand Ballroom",
  "Conference Hall A",
  "Conference Hall B",
  "Boardroom A",
  "Boardroom B",
  "Terrace Garden",
  "Rooftop Terrace",
  "VIP Lounge",
  "Poolside Deck",
  "Restaurant Private Room",
];

const services = [
  { id: "catering", label: "Catering / Meals" },
  { id: "bar", label: "Bar Service" },
  { id: "av", label: "Audio / Visual Equipment" },
  { id: "stage", label: "Stage & Lighting" },
  { id: "decoration", label: "Decoration / Florals" },
  { id: "security", label: "Security" },
  { id: "parking", label: "Valet Parking" },
  { id: "accommodation", label: "Guest Accommodation" },
  { id: "transport", label: "Transport / Shuttle" },
  { id: "photography", label: "Photography / Videography" },
];

function NewEventPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    organisation: "",
    eventName: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    venue: venues[0],
    guests: 0,
    notes: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => navigate({ to: "/events" }), 1600);
  }

  const canSubmit =
    form.organisation.trim() &&
    form.eventName.trim() &&
    form.startDate &&
    form.endDate &&
    form.startTime &&
    form.endTime;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-3">
        <Link
          to="/events"
          className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">New Event</h1>
          <p className="text-sm text-muted-foreground">Schedule a function, meeting or banquet.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/events/list"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <ListTodo className="h-4 w-4" />
            Events List
          </Link>
        </div>
      </div>

      {submitted ? (
        <div className="glass rounded-3xl p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15">
            <PartyPopper className="h-8 w-8 text-success" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-bold">Event Created!</h2>
          <p className="mt-2 text-muted-foreground">
            {form.eventName} has been scheduled. Redirecting to calendar…
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organisation & Event Name */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Event Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                icon={<Building2 className="h-4 w-4" />}
                label="Organisation Name"
                value={form.organisation}
                onChange={(v) => set("organisation", v)}
                placeholder="e.g. Jambo Sphere Ltd"
              />
              <FormField
                icon={<PartyPopper className="h-4 w-4" />}
                label="Event Name"
                value={form.eventName}
                onChange={(v) => set("eventName", v)}
                placeholder="e.g. Annual Gala Dinner"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Date &amp; Time</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DatePicker value={form.startDate} onChange={(v) => set("startDate", v)} />
              <DatePicker value={form.endDate} onChange={(v) => set("endDate", v)} />
              <FormField
                icon={<Clock className="h-4 w-4" />}
                label="Start Time"
                type="time"
                value={form.startTime}
                onChange={(v) => set("startTime", v)}
              />
              <FormField
                icon={<Clock className="h-4 w-4" />}
                label="End Time"
                type="time"
                value={form.endTime}
                onChange={(v) => set("endTime", v)}
              />
            </div>
          </div>

          {/* Venue & Guests */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Venue &amp; Guests</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> Venue / Room
                </label>
                <Select value={form.venue} onValueChange={(v) => set("venue", v)}>
                  <SelectTrigger className="w-full rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60 focus:ring-0 shadow-none">
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormField
                icon={<Users className="h-4 w-4" />}
                label="Number of Guests"
                type="number"
                value={String(form.guests || "")}
                onChange={(v) => set("guests", parseInt(v) || 0)}
                placeholder="e.g. 100"
                min="0"
              />
            </div>
          </div>

          {/* Services checklist */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Services Required
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((svc) => {
                const selected = selectedServices.includes(svc.id);
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => toggleService(svc.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition",
                      selected
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-border/60 bg-card/30 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-md border text-[10px] font-bold transition",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 bg-card/40",
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                    {svc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Notes
            </h2>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={4}
              placeholder="Special requirements, setup instructions, dietary restrictions, billing instructions…"
              className="w-full resize-none rounded-xl border border-border/70 bg-card/40 p-4 text-sm outline-none transition focus:border-primary/60 focus:bg-card/60"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link
              to="/events"
              className="rounded-xl border border-border/60 bg-card/40 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Create Event
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  icon,
  type = "text",
  placeholder,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  min?: string;
}) {
  return (
    <div className="group relative">
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
          placeholder={placeholder || " "}
          min={min}
          className="peer block w-full bg-transparent px-11 pb-2.5 pt-6 text-sm outline-none placeholder-transparent [&[type=date]]:uppercase [&[type=time]]:uppercase"
        />
        <label className="pointer-events-none absolute left-11 top-1.5 text-[11px] text-primary peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-primary">
          {label}
        </label>
      </div>
    </div>
  );
}
