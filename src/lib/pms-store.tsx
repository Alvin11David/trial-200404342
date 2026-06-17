/* eslint-disable react-refresh/only-export-components */
/**
 * Jambo PMS — Phase 1 frontend mock store.
 *
 * Single in-memory store that simulates the relational backend so that every
 * Phase 1 screen (dashboard, reservations, front desk, housekeeping, billing,
 * reports, audit, sysadmin) reads and writes against the same data and the
 * derived values (occupancy %, ADR, RevPAR, folio balance, status flips)
 * stay consistent.
 *
 * Everything lives in React state via `useSyncExternalStore`, so any mutation
 * re-renders every subscribed component.
 */

import { useSyncExternalStore } from "react";

/* ============================== Types ============================== */

export type RoomType = {
  id: string;
  name: string;       // e.g. "Standard", "Deluxe", "Suite"
  baseRate: number;   // UGX per night
  capacity: number;
};

export type Guest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  idType: string;
  idNumber: string;
  createdAt: string;
  totalVisits: number;
  totalRevenue: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
};

export type RoomStatus = "available" | "occupied" | "dirty" | "in_progress" | "clean" | "inspected" | "maintenance" | "blocked";
export type Room = {
  id: string;          // e.g. "204"
  floor: number;
  typeId: string;
  status: RoomStatus;
  assignedTo?: string | null; // housekeeping user id
  notes?: string;
};

export type ReservationStatus =
  | "open"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled";

export type VatTreatment = "inclusive" | "exclusive";

export type Reservation = {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  nationality: string;
  idType: string;
  idNumber: string;
  roomTypeId: string;
  roomId: string | null;     // assigned once available room is picked
  checkIn: string;            // YYYY-MM-DD
  checkOut: string;           // YYYY-MM-DD
  adults: number;
  children: number;
  ratePerNight: number;       // UGX
  mealPlan: string;
  source: string;             // Direct, Booking.com, etc.
  status: ReservationStatus;
  createdAt: string;          // ISO
  folioId?: string;
  vatRate?: number;           // VAT rate applicable at booking time (for invoicing)
  vatTreatment?: VatTreatment; // "inclusive" (default): price includes VAT; "exclusive": VAT added on top
  notes?: string;
};

export type FolioChargeType = "room" | "fnb" | "tax" | "misc";
export type FolioCharge = {
  id: string;
  folioId: string;
  date: string;        // YYYY-MM-DD
  type: FolioChargeType;
  description: string;
  amount: number;      // UGX (positive)
};

export type PaymentMethod = "cash" | "card" | "mtn_momo" | "airtel_money" | "bank_transfer";
export type Payment = {
  id: string;
  folioId: string;
  date: string;
  method: PaymentMethod;
  reference?: string;   // txn id
  phone?: string;       // for momo
  amount: number;
};

export type FolioStatus = "open" | "settled" | "void";
export type Folio = {
  id: string;
  reservationId: string;
  openedAt: string;
  closedAt?: string;
  status: FolioStatus;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lastLogin?: string;
};

export type Tenant = {
  id: string;
  name: string;
  currency: string;   // UGX
  vatRate: number;    // 0.18
  timezone: string;   // Africa/Kampala
  address: string;
  phone: string;
  email: string;
  tin: string;
};

export type AuditSeverity = "info" | "warn" | "critical";
export type AuditEntry = {
  id: string;
  ts: string;          // ISO
  actor: string;
  role: string;
  module: string;      // "reservations" | "billing" | "rooms" | "housekeeping" | "identity" | "settings" | "auth" | "system"
  action: string;
  entity: string;
  severity: AuditSeverity;
};

export type HkTaskType = "turnover" | "deep_clean" | "room_service" | "linen_change" | "inspection";
export type HkPriority = "standard" | "high" | "vip";
export type HkTaskStatus = "queued" | "in_progress" | "clean" | "flagged" | "inspected";
export type HousekeepingTask = {
  id: string;
  roomId: string;
  type: HkTaskType;
  priority: HkPriority;
  status: HkTaskStatus;
  assignedTo: string | null;
  due: string;          // time e.g. "11:30"
  notes: string;
  createdAt: string;     // ISO
  completedAt?: string;
};

export type MaintSeverity = "low" | "medium" | "high" | "critical";
export type MaintenanceRequest = {
  id: string;
  roomId: string;
  taskId: string;
  description: string;
  severity: MaintSeverity;
  status: "open" | "in_progress" | "resolved";
  reportedBy: string;
  createdAt: string;
  resolvedAt?: string;
};

export type DNDRecord = {
  id: string;
  roomId: string;
  startTime: string;     // ISO
  endTime?: string;
  reason: string;
};

type State = {
  tenant: Tenant;
  roomTypes: RoomType[];
  rooms: Room[];
  reservations: Reservation[];
  guests: Guest[];
  folios: Folio[];
  charges: FolioCharge[];
  payments: Payment[];
  users: UserRecord[];
  audit: AuditEntry[];
  housekeepingTasks: HousekeepingTask[];
  maintenanceRequests: MaintenanceRequest[];
  dndRecords: DNDRecord[];
};

/* ============================== Seed ============================== */

const TODAY = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const ROOM_TYPES: RoomType[] = [
  { id: "std", name: "Standard", baseRate: 220_000, capacity: 2 },
  { id: "dlx", name: "Deluxe", baseRate: 380_000, capacity: 3 },
  { id: "ste", name: "Suite", baseRate: 850_000, capacity: 4 },
];

const HOUSEKEEPERS = ["U003", "U008"]; // grace, mary

const ROOMS: Room[] = (() => {
  const list: Room[] = [];
  const layout: Array<[number, string]> = [
    [1, "std"], [1, "std"], [1, "std"], [1, "dlx"],
    [2, "std"], [2, "std"], [2, "dlx"], [2, "dlx"],
    [3, "dlx"], [3, "dlx"], [3, "dlx"], [3, "ste"],
    [4, "dlx"], [4, "ste"], [4, "ste"], [4, "ste"],
    [5, "ste"], [5, "ste"],
  ];
  layout.forEach(([floor, typeId], idx) => {
    const num = `${floor}${String((idx % 4) + 1).padStart(2, "0")}`;
    list.push({
      id: num,
      floor,
      typeId,
      status: (["available", "occupied", "dirty", "available", "maintenance", "available", "available", "dirty"][idx % 8] as RoomStatus),
      assignedTo: HOUSEKEEPERS[idx % HOUSEKEEPERS.length],
    });
  });
  return list;
})();

const RES_SEED_NAMES = [
  "Sarah Mwangi", "James Okello", "Priya Sharma", "David Mensah",
  "Aisha Wanjiku", "Mark Tindyebwa", "Linda Owino", "Tom Kabuye",
  "Joan Nansubuga", "Daniel Etyang",
];

const COUNTER_KEY = "jambo-pms-counters";
function loadCounters() {
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}
function saveCounters() {
  try {
    localStorage.setItem(COUNTER_KEY, JSON.stringify({
      resCounter, folioCounter, chargeCounter, payCounter, guestCounter, auditCounter,
      hkTaskCounter, maintCounter, dndCounter,
    }));
  } catch { /* ignore */ }
}
const savedCounters = loadCounters();
let resCounter = savedCounters.resCounter ?? 1000;
const nextResId = () => { const v = `RES-${++resCounter}`; saveCounters(); return v; };
let folioCounter = savedCounters.folioCounter ?? 3000;
const nextFolioId = () => { const v = `F-${++folioCounter}`; saveCounters(); return v; };
let chargeCounter = savedCounters.chargeCounter ?? 7000;
const nextChargeId = () => { const v = `C-${++chargeCounter}`; saveCounters(); return v; };
let payCounter = savedCounters.payCounter ?? 9000;
const nextPayId = () => { const v = `PMT-${++payCounter}`; saveCounters(); return v; };
let guestCounter = savedCounters.guestCounter ?? 500;
const nextGuestId = () => { const v = `GST-${++guestCounter}`; saveCounters(); return v; };
let auditCounter = savedCounters.auditCounter ?? 2900;
const nextAuditId = () => { const v = `EVT-${++auditCounter}`; saveCounters(); return v; };
let hkTaskCounter = savedCounters.hkTaskCounter ?? 4000;
const nextHkTaskId = () => { const v = `HK-${++hkTaskCounter}`; saveCounters(); return v; };
let maintCounter = savedCounters.maintCounter ?? 100;
const nextMaintId = () => { const v = `MNT-${++maintCounter}`; saveCounters(); return v; };
let dndCounter = savedCounters.dndCounter ?? 50;
const nextDndId = () => { const v = `DND-${++dndCounter}`; saveCounters(); return v; };

const RESERVATIONS: Reservation[] = RES_SEED_NAMES.map((name, i) => {
  // mix of arriving today, departing today, and future
  const offsetIn = (i % 5) - 2;   // -2..2
  const nights = 1 + (i % 4);
  const checkIn = addDays(TODAY, offsetIn);
  const checkOut = addDays(checkIn, nights);
  const typeIdx = i % 3;
  const rt = ROOM_TYPES[typeIdx];
  const sameTypeRooms = ROOMS.filter((r) => r.typeId === rt.id);
  const room = sameTypeRooms[i % sameTypeRooms.length];
  // status logic: those with offsetIn < 0 are checked_in (in-house), == 0 arriving, > 0 confirmed.
  let status: ReservationStatus = "confirmed";
  if (offsetIn < 0) status = "checked_in";
  else if (offsetIn === 0) status = i % 2 === 0 ? "confirmed" : "checked_in";
  const id = nextResId();
  const res: Reservation = {
    id,
    guestName: name,
    guestEmail: name.toLowerCase().replace(" ", ".") + "@example.com",
    guestPhone: "+256 7" + (10000000 + i * 13).toString().slice(0, 8),
    nationality: ["Uganda", "Kenya", "India", "Ghana", "Kenya"][i % 5],
    idType: i % 2 ? "Passport" : "National ID",
    idNumber: "ID" + (1000000 + i * 7).toString(),
    roomTypeId: rt.id,
    roomId: status === "checked_in" || status === "confirmed" ? room.id : null,
    checkIn: iso(checkIn),
    checkOut: iso(checkOut),
    adults: 1 + (i % 2),
    children: i % 3 === 0 ? 1 : 0,
    ratePerNight: rt.baseRate,
    mealPlan: ["RO", "BB", "HB", "BB", "RO"][i % 5],
    source: ["Direct", "Booking.com", "Expedia", "Corporate", "Direct"][i % 5],
    status,
    createdAt: addDays(TODAY, offsetIn - 7).toISOString(),
  };
  return res;
});

// Open folios for checked-in reservations, with seed charges and partial payments.
const FOLIOS: Folio[] = [];
const CHARGES: FolioCharge[] = [];
const PAYMENTS: Payment[] = [];

RESERVATIONS.forEach((r) => {
  if (r.status !== "checked_in") return;
  const folio: Folio = {
    id: nextFolioId(),
    reservationId: r.id,
    openedAt: r.createdAt,
    status: "open",
  };
  r.folioId = folio.id;
  FOLIOS.push(folio);

  // Room charges per night so far
  const start = new Date(r.checkIn);
  const nightsSoFar = Math.max(1, Math.ceil((TODAY.getTime() - start.getTime()) / 86_400_000));
  for (let n = 0; n < nightsSoFar; n++) {
    CHARGES.push({
      id: nextChargeId(),
      folioId: folio.id,
      date: iso(addDays(start, n)),
      type: "room",
      description: `Room ${r.roomId} — night ${n + 1}`,
      amount: r.ratePerNight,
    });
  }
  // A small F&B charge for some
  if (r.id.endsWith("2") || r.id.endsWith("4")) {
    CHARGES.push({
      id: nextChargeId(),
      folioId: folio.id,
      date: iso(TODAY),
      type: "fnb",
      description: "Restaurant",
      amount: 65_000,
    });
  }
  // Partial advance payment for some
  if (r.id.endsWith("3") || r.id.endsWith("7")) {
    PAYMENTS.push({
      id: nextPayId(),
      folioId: folio.id,
      date: iso(addDays(TODAY, -1)),
      method: "mtn_momo",
      phone: r.guestPhone,
      amount: r.ratePerNight,
    });
  }
});

// A couple of historical checked_out reservations with settled folios for revenue history.
for (let k = 1; k <= 6; k++) {
  const dayOff = -k;
  const rt = ROOM_TYPES[k % 3];
  const id = nextResId();
  const checkIn = addDays(TODAY, dayOff - 2);
  const checkOut = addDays(TODAY, dayOff);
  const res: Reservation = {
    id,
    guestName: ["Kwame Boateng", "Maria Lopez", "Aliya Hassan", "Brian Otim", "Jane Wairimu", "Samuel Tenywa"][k % 6],
    guestEmail: "guest" + k + "@example.com",
    guestPhone: "+256 700000" + k,
    nationality: "Uganda",
    idType: "Passport",
    idNumber: "P" + 9000000 + k,
    roomTypeId: rt.id,
    roomId: ROOMS.filter((r) => r.typeId === rt.id)[k % 4]?.id ?? null,
    checkIn: iso(checkIn),
    checkOut: iso(checkOut),
    adults: 1,
    children: 0,
    ratePerNight: rt.baseRate,
    mealPlan: "BB",
    source: ["Direct", "Booking.com", "Expedia"][k % 3],
    status: "checked_out",
    createdAt: addDays(checkIn, -3).toISOString(),
  };
  RESERVATIONS.push(res);
  const folio: Folio = {
    id: nextFolioId(),
    reservationId: id,
    openedAt: iso(checkIn),
    closedAt: iso(checkOut),
    status: "settled",
  };
  res.folioId = folio.id;
  FOLIOS.push(folio);
  const total = res.ratePerNight * 2;
  CHARGES.push({
    id: nextChargeId(),
    folioId: folio.id,
    date: iso(checkIn),
    type: "room",
    description: `Room ${res.roomId} — 2 nights`,
    amount: total,
  });
  PAYMENTS.push({
    id: nextPayId(),
    folioId: folio.id,
    date: iso(checkOut),
    method: (["cash", "card", "mtn_momo"] as PaymentMethod[])[k % 3],
    amount: total,
  });
}

const USERS: UserRecord[] = [
  { id: "U001", name: "Sarah Nakato", email: "sarah@jambo.ug", role: "Owner / GM", active: true, lastLogin: "10 min ago" },
  { id: "U002", name: "Amani Kato", email: "amani@jambo.ug", role: "Front Desk", active: true, lastLogin: "Just now" },
  { id: "U003", name: "Grace Achieng", email: "grace@jambo.ug", role: "Housekeeping", active: true, lastLogin: "2h ago" },
  { id: "U004", name: "John Mukasa", email: "john@jambo.ug", role: "POS / Cashier", active: true, lastLogin: "30 min ago" },
  { id: "U005", name: "Esther Nambi", email: "esther@jambo.ug", role: "Reservations / Revenue", active: true, lastLogin: "1h ago" },
  { id: "U006", name: "Peter Ssempijja", email: "peter@jambo.ug", role: "Accountant", active: true, lastLogin: "Yesterday" },
  { id: "U007", name: "Robert Kizza", email: "robert@jambo.ug", role: "System Administrator", active: true, lastLogin: "5 min ago" },
  { id: "U008", name: "Mary Nakibuuka", email: "mary@jambo.ug", role: "Housekeeping", active: true, lastLogin: "—" },
  { id: "U009", name: "Faith Akello", email: "faith@jambo.ug", role: "Front Desk", active: false, lastLogin: "1 month ago" },
];

export const nightsBetween = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));

/* Build guest profiles from reservation data + extra seed guests */
const GUESTS: Guest[] = (() => {
  const seen = new Map<string, Guest>();
  const allRsvps = [...RESERVATIONS];

  // for historical checked-out
  for (let k = 1; k <= 6; k++) {
    const rt = ROOM_TYPES[k % 3];
    const dayOff = -k;
    const checkIn = addDays(TODAY, dayOff - 2);
    const checkOut = addDays(TODAY, dayOff);
    const name = ["Kwame Boateng", "Maria Lopez", "Aliya Hassan", "Brian Otim", "Jane Wairimu", "Samuel Tenywa"][k % 6];
    const email = "guest" + k + "@example.com";
    const phone = "+256 700000" + k;
    const key = email + phone;
    if (!seen.has(key)) {
      seen.set(key, {
        id: nextGuestId(),
        name,
        email,
        phone,
        nationality: "Uganda",
        idType: "Passport",
        idNumber: "P" + 9000000 + k,
        createdAt: addDays(TODAY, -30).toISOString(),
        totalVisits: 1,
        totalRevenue: rt.baseRate * 2,
        tier: "Bronze",
      });
    }
  }

  allRsvps.forEach((r) => {
    const key = r.guestEmail + r.guestPhone;
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      existing.totalVisits++;
      existing.totalRevenue += r.ratePerNight * nightsBetween(r.checkIn, r.checkOut);
    } else {
      seen.set(key, {
        id: nextGuestId(),
        name: r.guestName,
        email: r.guestEmail,
        phone: r.guestPhone,
        nationality: r.nationality,
        idType: r.idType,
        idNumber: r.idNumber,
        createdAt: r.createdAt,
        totalVisits: 1,
        totalRevenue: r.ratePerNight * nightsBetween(r.checkIn, r.checkOut),
        tier: "Bronze",
      });
    }
  });

  // assign tiers based on visits
  seen.forEach((g) => {
    if (g.totalVisits >= 5) g.tier = "Platinum";
    else if (g.totalVisits >= 3) g.tier = "Gold";
    else if (g.totalVisits >= 2) g.tier = "Silver";
    else g.tier = "Bronze";
  });

  return Array.from(seen.values());
})();

const AUDIT: AuditEntry[] = [
  { id: nextAuditId(), ts: addDays(TODAY, -1).toISOString(), actor: "system", role: "System", module: "system", action: "Night audit completed", entity: "Day close " + iso(addDays(TODAY, -1)), severity: "info" },
  { id: nextAuditId(), ts: addDays(TODAY, -1).toISOString(), actor: "Robert Kizza", role: "System Administrator", module: "identity", action: "Updated role permissions", entity: "Role: Front Desk", severity: "critical" },
  { id: nextAuditId(), ts: addDays(TODAY, 0).toISOString(), actor: "Amani Kato", role: "Front Desk", module: "reservations", action: "Created reservation", entity: RESERVATIONS[0].id, severity: "info" },
];

const HK_TASKS: HousekeepingTask[] = [
  { id: "HK-4001", roomId: "101", type: "turnover", priority: "high", status: "queued", assignedTo: "U003", due: "11:30", notes: "Guest reported a stain on bedding", createdAt: new Date().toISOString() },
  { id: "HK-4002", roomId: "308", type: "deep_clean", priority: "standard", status: "queued", assignedTo: null, due: "12:00", notes: "", createdAt: new Date().toISOString() },
  { id: "HK-4003", roomId: "412", type: "linen_change", priority: "standard", status: "queued", assignedTo: null, due: "13:15", notes: "", createdAt: new Date().toISOString() },
  { id: "HK-4004", roomId: "117", type: "turnover", priority: "standard", status: "in_progress", assignedTo: "U008", due: "11:00", notes: "", createdAt: new Date().toISOString() },
  { id: "HK-4005", roomId: "502", type: "deep_clean", priority: "vip", status: "in_progress", assignedTo: "U003", due: "12:30", notes: "VIP guest arriving 14:00", createdAt: new Date().toISOString() },
  { id: "HK-4006", roomId: "203", type: "turnover", priority: "standard", status: "clean", assignedTo: "U003", due: "10:00", notes: "", createdAt: addDays(TODAY, 0).toISOString() },
  { id: "HK-4007", roomId: "305", type: "deep_clean", priority: "standard", status: "clean", assignedTo: "U008", due: "09:30", notes: "", createdAt: addDays(TODAY, 0).toISOString() },
  { id: "HK-4008", roomId: "410", type: "turnover", priority: "standard", status: "inspected", assignedTo: "U003", due: "09:00", notes: "", createdAt: addDays(TODAY, 0).toISOString(), completedAt: new Date().toISOString() },
];

const MAINT_REQUESTS: MaintenanceRequest[] = [];

const DND_RECORDS: DNDRecord[] = [];

const TENANT: Tenant = {
  id: "T001",
  name: "Jambo Sphere Hotel",
  currency: "UGX",
  vatRate: 0.18,
  timezone: "Africa/Kampala",
  address: "Plot 24, Kampala Road, Kampala, Uganda",
  phone: "+256 700 000 000",
  email: "frontdesk@jambo.ug",
  tin: "1000123456",
};

/* ============================== Store ============================== */

const STORAGE_KEY = "jambo-pms-cache";

function persistState() {
  try {
    const snapshot = {
      tenant: state.tenant,
      roomTypes: state.roomTypes,
      rooms: state.rooms,
      reservations: state.reservations,
      guests: state.guests,
      folios: state.folios,
      charges: state.charges,
      payments: state.payments,
      users: state.users,
      audit: state.audit,
      housekeepingTasks: state.housekeepingTasks,
      maintenanceRequests: state.maintenanceRequests,
      dndRecords: state.dndRecords,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // storage full or unavailable — degrade gracefully
  }
}

function loadPersistedState(): Partial<State> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<State>;
  } catch {
    return null;
  }
}

const persisted = loadPersistedState();

const state: State = {
  tenant: persisted?.tenant ?? TENANT,
  roomTypes: persisted?.roomTypes ?? ROOM_TYPES,
  rooms: persisted?.rooms ?? ROOMS,
  reservations: persisted?.reservations ?? RESERVATIONS,
  guests: persisted?.guests ?? GUESTS,
  folios: persisted?.folios ?? FOLIOS,
  charges: persisted?.charges ?? CHARGES,
  payments: persisted?.payments ?? PAYMENTS,
  users: persisted?.users ?? USERS,
  audit: persisted?.audit ?? AUDIT,
  housekeepingTasks: persisted?.housekeepingTasks ?? HK_TASKS,
  maintenanceRequests: persisted?.maintenanceRequests ?? MAINT_REQUESTS,
  dndRecords: persisted?.dndRecords ?? DND_RECORDS,
};

const listeners = new Set<() => void>();
const emit = () => {
  persistState();
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snap = () => state;

export function useStore<T>(selector: (s: State) => T): T {
  const state = useSyncExternalStore(subscribe, snap, snap);
  return selector(state);
}

/* ============================== Offline Sync Queue ============================== */

const SYNC_KEY = "jambo-pms-outbox";

export type OutboxEntry = {
  id: string;
  ts: string;
  type: "create_reservation" | "cancel_reservation" | "update_reservation" | "check_in" | "check_out";
  payload: unknown;
};

function getOutbox(): OutboxEntry[] {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOutbox(entries: OutboxEntry[]) {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(entries));
  } catch {
    // degrade gracefully
  }
}

function genId(): string {
  try { return crypto.randomUUID(); } catch { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
}

function addToOutbox(entry: Omit<OutboxEntry, "id" | "ts">) {
  if (navigator.onLine) return; // only queue when offline
  const outbox = getOutbox();
  outbox.push({ ...entry, id: genId(), ts: new Date().toISOString() });
  saveOutbox(outbox);
}

export function getPendingSyncCount(): number {
  return getOutbox().length;
}

export function clearSyncedEntries() {
  saveOutbox([]);
}

export function processOutbox(): number {
  const outbox = getOutbox();
  if (outbox.length === 0) return 0;
  // In production, this would POST each entry to the API.
  // For the mock, we just clear the outbox since the store already has the data.
  saveOutbox([]);
  return outbox.length;
}

export function isOnline(): boolean {
  return navigator.onLine;
}

/* ============================== Helpers ============================== */

export const isoDate = iso;
export const todayISO = () => iso(TODAY);
export const fmtUGX = (n: number) =>
  "UGX " + Math.round(n).toLocaleString();

export function logAudit(entry: Omit<AuditEntry, "id" | "ts">) {
  state.audit = [
    { id: nextAuditId(), ts: new Date().toISOString(), ...entry },
    ...state.audit,
  ];
}

/* date ranges overlap, treating checkOut as exclusive */
function rangesOverlap(aIn: string, aOut: string, bIn: string, bOut: string) {
  return aIn < bOut && bIn < aOut;
}

/** Rooms that are bookable for a given room type and date range, ignoring soft statuses. */
export function findAvailableRooms(roomTypeId: string, checkIn: string, checkOut: string) {
  return state.rooms.filter((r) => {
    if (r.typeId !== roomTypeId) return false;
    if (r.status !== "available") return false;
    // any active reservation already on this room in the same range?
    const conflict = state.reservations.some(
      (res) =>
        res.roomId === r.id &&
        (res.status === "confirmed" || res.status === "checked_in") &&
        rangesOverlap(checkIn, checkOut, res.checkIn, res.checkOut),
    );
    return !conflict;
  });
}

/* ============================== Guests ============================== */

export function upsertGuest(input: { name: string; email: string; phone: string; nationality: string; idType: string; idNumber: string }): string {
  const existing = state.guests.find(
    (g) => g.email === input.email || g.phone === input.phone,
  );
  if (existing) {
    state.guests = state.guests.map((g) =>
      g.id === existing.id ? { ...g, name: input.name, email: input.email, phone: input.phone, nationality: input.nationality, idType: input.idType, idNumber: input.idNumber } : g,
    );
    emit();
    return existing.id;
  }
  const id = nextGuestId();
  state.guests = [
    {
      id,
      ...input,
      createdAt: new Date().toISOString(),
      totalVisits: 0,
      totalRevenue: 0,
      tier: "Bronze",
    },
    ...state.guests,
  ];
  emit();
  return id;
}

export function findGuestByPhoneOrEmail(query: string): Guest | undefined {
  const q = query.toLowerCase();
  return state.guests.find((g) => g.phone.toLowerCase().includes(q) || g.email.toLowerCase().includes(q));
}

export function findGuests(query: string): Guest[] {
  const q = query.toLowerCase();
  return state.guests.filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.phone.includes(q) ||
      g.idNumber.toLowerCase().includes(q),
  );
}

export function getGuestReservations(guestId: string): Reservation[] {
  const guest = state.guests.find((g) => g.id === guestId);
  if (!guest) return [];
  return state.reservations.filter(
    (r) => r.guestEmail === guest.email && r.guestPhone === guest.phone,
  );
}

function updateGuestStats(email: string, phone: string) {
  const guest = state.guests.find((g) => g.email === email && g.phone === phone);
  if (!guest) return;
  const reservations = state.reservations.filter((r) => r.guestEmail === email && r.guestPhone === phone);
  const totalVisits = reservations.length;
  const totalRevenue = reservations.reduce(
    (s, r) => s + r.ratePerNight * nightsBetween(r.checkIn, r.checkOut),
    0,
  );
  let tier: Guest["tier"] = "Bronze";
  if (totalVisits >= 5) tier = "Platinum";
  else if (totalVisits >= 3) tier = "Gold";
  else if (totalVisits >= 2) tier = "Silver";
  state.guests = state.guests.map((g) =>
    g.id === guest.id ? { ...g, totalVisits, totalRevenue, tier } : g,
  );
}

/* ============================== Reservations ============================== */

export type NewReservationInput = Omit<
  Reservation,
  "id" | "createdAt" | "status" | "folioId" | "roomId" | "vatRate" | "vatTreatment"
> & {
  roomId?: string | null;
  payment?: { method: PaymentMethod; amount: number; phone?: string; reference?: string };
};

export function createReservation(input: NewReservationInput): { ok: true; id: string } | { ok: false; error: string } {
  if (!input.checkIn || !input.checkOut || input.checkIn >= input.checkOut) {
    return { ok: false, error: "Check-out must be after check-in." };
  }
  let roomId = input.roomId ?? null;
  if (roomId) {
    const available = findAvailableRooms(input.roomTypeId, input.checkIn, input.checkOut).some(
      (r) => r.id === roomId,
    );
    if (!available) return { ok: false, error: "Selected room is no longer available for these dates." };
  }
  const id = nextResId();
  const reservation: Reservation = {
    ...input,
    id,
    roomId,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    vatRate: state.tenant.vatRate,
    vatTreatment: "inclusive",
  };
  state.reservations = [reservation, ...state.reservations];

  // link/update guest profile
  upsertGuest({
    name: input.guestName,
    email: input.guestEmail,
    phone: input.guestPhone,
    nationality: input.nationality,
    idType: input.idType,
    idNumber: input.idNumber,
  });
  updateGuestStats(input.guestEmail, input.guestPhone);

  // always open a folio when a reservation is created
  const folio: Folio = {
    id: nextFolioId(),
    reservationId: id,
    openedAt: new Date().toISOString(),
    status: "open",
  };
  state.folios = [...state.folios, folio];
  state.reservations = state.reservations.map((r) =>
    r.id === id ? { ...r, folioId: folio.id } : r,
  );

  // if payment collected at booking, record it on the folio
  if (input.payment) {
    state.payments = [
      ...state.payments,
      {
        id: nextPayId(),
        folioId: folio.id,
        date: todayISO(),
        method: input.payment.method,
        reference: input.payment.reference,
        phone: input.payment.phone,
        amount: input.payment.amount,
      },
    ];
    logAudit({
      actor: input.guestName,
      role: "Reservations",
      module: "billing",
      action: `Deposit collected at booking via ${input.payment.method}`,
      entity: `${id} ${fmtUGX(input.payment.amount)}`,
      severity: "info",
    });
  }

  logAudit({
    actor: input.guestName,
    role: "Reservations",
    module: "reservations",
    action: "Created reservation",
    entity: id,
    severity: "info",
  });
  addToOutbox({ type: "create_reservation", payload: { id, ...input } });
  emit();
  return { ok: true, id };
}

export type UpdateReservationInput = Partial<Omit<Reservation, "id" | "createdAt" | "status" | "folioId">>;

export function updateReservation(id: string, patch: UpdateReservationInput): { ok: true } | { ok: false; error: string } {
  const res = state.reservations.find((r) => r.id === id);
  if (!res) return { ok: false, error: "Reservation not found." };
  if (res.status !== "confirmed" && res.status !== "open") {
    return { ok: false, error: `Cannot edit reservation in status: ${res.status}.` };
  }
  const updated = { ...res, ...patch };
  // re-check room availability if dates or room changed
  if ((patch.checkIn || patch.checkOut || patch.roomId || patch.roomTypeId) && updated.roomId) {
    const available = findAvailableRooms(
      updated.roomTypeId,
      updated.checkIn,
      updated.checkOut,
    ).some((r) => r.id === updated.roomId);
    if (!available && updated.roomId) {
      // unassign room if conflict
      updated.roomId = null;
    }
  }
  state.reservations = state.reservations.map((r) => (r.id === id ? updated : r));
  logAudit({
    actor: "Front Desk",
    role: "Front Desk",
    module: "reservations",
    action: "Updated reservation",
    entity: `${id} — changed: ${Object.keys(patch).join(", ")}`,
    severity: "info",
  });
  addToOutbox({ type: "update_reservation", payload: { id, patch } });
  emit();
  return { ok: true };
}

export function cancelReservation(id: string, reason?: string) {
  state.reservations = state.reservations.map((r) =>
    r.id === id ? { ...r, status: "cancelled", notes: reason ? `${r.notes ? r.notes + "\n" : ""}Cancellation reason: ${reason}` : r.notes } : r,
  );
  logAudit({
    actor: "Front Desk",
    role: "Front Desk",
    module: "reservations",
    action: `Cancelled reservation${reason ? ` — ${reason}` : ""}`,
    entity: id,
    severity: "warn",
  });
  addToOutbox({ type: "cancel_reservation", payload: { id, reason } });
  emit();
}

export function checkIn(reservationId: string, opts: { roomId?: string } = {}): { ok: true } | { ok: false; error: string } {
  const res = state.reservations.find((r) => r.id === reservationId);
  if (!res) return { ok: false, error: "Reservation not found." };
  if (res.status === "checked_in") return { ok: false, error: "Already checked in." };
  if (res.status !== "confirmed" && res.status !== "open") return { ok: false, error: "Cannot check in from status: " + res.status };
  const targetRoom = opts.roomId ?? res.roomId;
  if (!targetRoom) return { ok: false, error: "Assign a room before checking in." };
  const roomOk = findAvailableRooms(res.roomTypeId, res.checkIn, res.checkOut).some((r) => r.id === targetRoom) || res.roomId === targetRoom;
  if (!roomOk) return { ok: false, error: "Room conflict — pick another room." };

  // Use existing folio if deposit was collected at booking, else create one
  let folioId = res.folioId;
  if (!folioId) {
    const newFolio: Folio = {
      id: nextFolioId(),
      reservationId: res.id,
      openedAt: new Date().toISOString(),
      status: "open",
    };
    state.folios = [...state.folios, newFolio];
    folioId = newFolio.id;
  }

  // First night room charge posted on check-in
  state.charges = [
    ...state.charges,
    {
      id: nextChargeId(),
      folioId: folioId,
      date: todayISO(),
      type: "room",
      description: `Room ${targetRoom} — night 1`,
      amount: res.ratePerNight,
    },
  ];

  state.reservations = state.reservations.map((r) =>
    r.id === res.id ? { ...r, status: "checked_in", roomId: targetRoom, folioId } : r,
  );
  state.rooms = state.rooms.map((r) =>
    r.id === targetRoom ? { ...r, status: "occupied" } : r,
  );

  logAudit({
    actor: "Front Desk",
    role: "Front Desk",
    module: "reservations",
    action: "Checked in guest",
    entity: `${res.id} → Room ${targetRoom}`,
    severity: "info",
  });
  addToOutbox({ type: "check_in", payload: { reservationId, roomId: targetRoom } });
  emit();
  return { ok: true };
}

export function checkOut(reservationId: string): { ok: true } | { ok: false; error: string } {
  const res = state.reservations.find((r) => r.id === reservationId);
  if (!res) return { ok: false, error: "Reservation not found." };
  if (res.status !== "checked_in") return { ok: false, error: "Guest is not currently checked in." };
  const folio = state.folios.find((f) => f.id === res.folioId);
  if (!folio) return { ok: false, error: "No folio attached to reservation." };
  const balance = folioBalance(folio.id);
  if (balance > 0.5) {
    return {
      ok: false,
      error: `Folio still has an outstanding balance of ${fmtUGX(balance)}. Settle before checkout.`,
    };
  }

  state.folios = state.folios.map((f) =>
    f.id === folio.id ? { ...f, status: "settled", closedAt: new Date().toISOString() } : f,
  );
  state.reservations = state.reservations.map((r) =>
    r.id === res.id ? { ...r, status: "checked_out" } : r,
  );
  if (res.roomId) {
    // room flips to dirty awaiting housekeeping + auto-create turnover task
    state.rooms = state.rooms.map((r) =>
      r.id === res.roomId ? { ...r, status: "dirty" } : r,
    );
    const hkTask: HousekeepingTask = {
      id: nextHkTaskId(),
      roomId: res.roomId,
      type: "turnover",
      priority: "standard",
      status: "queued",
      assignedTo: null,
      due: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      notes: `Auto-generated after checkout of ${res.guestName}`,
      createdAt: new Date().toISOString(),
    };
    state.housekeepingTasks = [...state.housekeepingTasks, hkTask];
  }
  logAudit({
    actor: "Front Desk",
    role: "Front Desk",
    module: "reservations",
    action: "Checked out guest",
    entity: `${res.id} (Room ${res.roomId})`,
    severity: "info",
  });
  addToOutbox({ type: "check_out", payload: { reservationId } });
  emit();
  return { ok: true };
}

/* ============================== Folio ============================== */

export function folioBalance(folioId: string): number {
  const charges = state.charges.filter((c) => c.folioId === folioId).reduce((s, c) => s + c.amount, 0);
  const payments = state.payments.filter((p) => p.folioId === folioId).reduce((s, p) => s + p.amount, 0);
  return charges - payments;
}

export function addCharge(folioId: string, input: Omit<FolioCharge, "id" | "folioId" | "date"> & { date?: string }) {
  state.charges = [
    ...state.charges,
    {
      id: nextChargeId(),
      folioId,
      date: input.date ?? todayISO(),
      type: input.type,
      description: input.description,
      amount: input.amount,
    },
  ];
  logAudit({ actor: "Front Desk", role: "Front Desk", module: "billing", action: "Posted charge", entity: `${folioId} ${fmtUGX(input.amount)}`, severity: "info" });
  emit();
}

export function addPayment(folioId: string, input: Omit<Payment, "id" | "folioId" | "date"> & { date?: string }) {
  state.payments = [
    ...state.payments,
    {
      id: nextPayId(),
      folioId,
      date: input.date ?? todayISO(),
      method: input.method,
      reference: input.reference,
      phone: input.phone,
      amount: input.amount,
    },
  ];
  // auto-settle if balance hits zero
  const bal = folioBalance(folioId);
  if (bal <= 0.5) {
    state.folios = state.folios.map((f) =>
      f.id === folioId ? { ...f, status: "settled" } : f,
    );
  }
  logAudit({ actor: "Cashier", role: "Accountant", module: "billing", action: "Posted payment", entity: `${folioId} ${fmtUGX(input.amount)} via ${input.method}`, severity: "info" });
  emit();
}

/* ============================== Rooms / Housekeeping ============================== */

export function setRoomStatus(roomId: string, status: RoomStatus) {
  state.rooms = state.rooms.map((r) =>
    r.id === roomId ? { ...r, status } : r,
  );
  logAudit({ actor: "Housekeeping", role: "Housekeeping", module: "housekeeping", action: "Updated room status", entity: `Room ${roomId} → ${status}`, severity: "info" });
  emit();
}

export function assignRoomHousekeeper(roomId: string, userId: string | null) {
  state.rooms = state.rooms.map((r) =>
    r.id === roomId ? { ...r, assignedTo: userId } : r,
  );
  emit();
}

/* ============================== Housekeeping ============================== */

export function createHousekeepingTask(input: {
  roomId: string;
  type: HkTaskType;
  priority: HkPriority;
  assignedTo?: string | null;
  due: string;
  notes?: string;
}) {
  const task: HousekeepingTask = {
    id: nextHkTaskId(),
    roomId: input.roomId,
    type: input.type,
    priority: input.priority,
    status: "queued",
    assignedTo: input.assignedTo ?? null,
    due: input.due,
    notes: input.notes ?? "",
    createdAt: new Date().toISOString(),
  };
  state.housekeepingTasks = [...state.housekeepingTasks, task];
  setRoomStatus(input.roomId, "dirty");
  logAudit({ actor: "Housekeeping", role: "Housekeeping", module: "housekeeping", action: "Task created", entity: `${task.id} — Room ${input.roomId} (${input.type})`, severity: "info" });
  emit();
  return task;
}

export function assignHkTask(taskId: string, userId: string | null) {
  state.housekeepingTasks = state.housekeepingTasks.map((t) =>
    t.id === taskId ? { ...t, assignedTo: userId } : t,
  );
  emit();
}

export function updateHkTaskStatus(taskId: string, status: HkTaskStatus) {
  const task = state.housekeepingTasks.find((t) => t.id === taskId);
  if (!task) return;
  const patch: Partial<HousekeepingTask> = { status };
  if (status === "in_progress") {
    patch.completedAt = undefined;
    setRoomStatus(task.roomId, "in_progress");
  } else if (status === "clean") {
    setRoomStatus(task.roomId, "clean");
  } else if (status === "inspected") {
    patch.completedAt = new Date().toISOString();
    setRoomStatus(task.roomId, "available");
  } else if (status === "flagged") {
    setRoomStatus(task.roomId, "blocked");
  }
  state.housekeepingTasks = state.housekeepingTasks.map((t) =>
    t.id === taskId ? { ...t, ...patch } : t,
  );
  logAudit({ actor: "Housekeeping", role: "Housekeeping", module: "housekeeping", action: `Task ${status}`, entity: `${task.id} — Room ${task.roomId}`, severity: "info" });
  emit();
}

export function flagHkIssue(taskId: string, description: string, severity: MaintSeverity) {
  const task = state.housekeepingTasks.find((t) => t.id === taskId);
  if (!task) return;
  const req: MaintenanceRequest = {
    id: nextMaintId(),
    roomId: task.roomId,
    taskId,
    description,
    severity,
    status: "open",
    reportedBy: task.assignedTo ?? "Unknown",
    createdAt: new Date().toISOString(),
  };
  state.maintenanceRequests = [...state.maintenanceRequests, req];
  updateHkTaskStatus(taskId, "flagged");
  logAudit({ actor: "Housekeeping", role: "Housekeeping", module: "housekeeping", action: "Issue flagged", entity: `Room ${task.roomId} — ${description}`, severity: severity === "critical" || severity === "high" ? "warn" : "info" });
  emit();
}

export function resolveMaintenance(id: string) {
  state.maintenanceRequests = state.maintenanceRequests.map((r) =>
    r.id === id ? { ...r, status: "resolved", resolvedAt: new Date().toISOString() } : r,
  );
  emit();
}

export function setDND(roomId: string, reason: string, endTime?: string) {
  const dnd: DNDRecord = {
    id: nextDndId(),
    roomId,
    startTime: new Date().toISOString(),
    endTime,
    reason,
  };
  state.dndRecords = [...state.dndRecords, dnd];
  logAudit({ actor: "Front Desk", role: "Front Desk", module: "housekeeping", action: "DND set", entity: `Room ${roomId} — ${reason}`, severity: "info" });
  emit();
}

export function clearDND(roomId: string) {
  state.dndRecords = state.dndRecords.map((r) =>
    r.roomId === roomId && !r.endTime ? { ...r, endTime: new Date().toISOString() } : r,
  );
  emit();
}

export function getActiveDND(): DNDRecord[] {
  return state.dndRecords.filter((r) => !r.endTime);
}

export function upsertRoom(room: Room) {
  const exists = state.rooms.some((r) => r.id === room.id);
  state.rooms = exists ? state.rooms.map((r) => (r.id === room.id ? room : r)) : [...state.rooms, room];
  logAudit({ actor: "Admin", role: "System Administrator", module: "settings", action: exists ? "Updated room" : "Added room", entity: `Room ${room.id}`, severity: "info" });
  emit();
}
export function deleteRoom(roomId: string) {
  state.rooms = state.rooms.filter((r) => r.id !== roomId);
  logAudit({ actor: "Admin", role: "System Administrator", module: "settings", action: "Deleted room", entity: `Room ${roomId}`, severity: "warn" });
  emit();
}

export function upsertRoomType(t: RoomType) {
  const exists = state.roomTypes.some((x) => x.id === t.id);
  state.roomTypes = exists ? state.roomTypes.map((x) => (x.id === t.id ? t : x)) : [...state.roomTypes, t];
  emit();
}
export function deleteRoomType(id: string) {
  state.roomTypes = state.roomTypes.filter((x) => x.id !== id);
  emit();
}

/* ============================== Users ============================== */

export function upsertUser(u: UserRecord) {
  const exists = state.users.some((x) => x.id === u.id);
  state.users = exists ? state.users.map((x) => (x.id === u.id ? u : x)) : [...state.users, u];
  logAudit({ actor: "Admin", role: "System Administrator", module: "identity", action: exists ? "Updated user" : "Created user", entity: `${u.email}`, severity: exists ? "info" : "warn" });
  emit();
}
export function toggleUserActive(id: string) {
  state.users = state.users.map((u) => (u.id === id ? { ...u, active: !u.active } : u));
  emit();
}

/* ============================== Tenant ============================== */

export function updateTenant(patch: Partial<Tenant>) {
  state.tenant = { ...state.tenant, ...patch };
  logAudit({ actor: "Admin", role: "System Administrator", module: "settings", action: "Updated tenant configuration", entity: state.tenant.name, severity: "warn" });
  emit();
}

/* ============================== Computed / Reports ============================== */

export function occupancyOnDate(dateISO: string) {
  const total = state.rooms.length;
  if (total === 0) return { total, occupied: 0, pct: 0 };
  const occupied = state.reservations.filter(
    (r) =>
      (r.status === "checked_in" || r.status === "checked_out") &&
      r.checkIn <= dateISO &&
      r.checkOut > dateISO,
  ).length;
  return { total, occupied, pct: occupied / total };
}

export function roomRevenueOnDate(dateISO: string) {
  return state.charges
    .filter((c) => c.type === "room" && c.date === dateISO)
    .reduce((s, c) => s + c.amount, 0);
}

export function adrOnDate(dateISO: string) {
  const occ = occupancyOnDate(dateISO);
  const rev = roomRevenueOnDate(dateISO);
  return occ.occupied > 0 ? rev / occ.occupied : 0;
}

export function revparOnDate(dateISO: string) {
  const total = state.rooms.length;
  const rev = roomRevenueOnDate(dateISO);
  return total > 0 ? rev / total : 0;
}

export function totalRevenueOnDate(dateISO: string) {
  return state.charges
    .filter((c) => c.date === dateISO)
    .reduce((s, c) => s + c.amount, 0);
}

export function dateRangeList(fromISO: string, toISO: string): string[] {
  const out: string[] = [];
  const from = new Date(fromISO);
  const to = new Date(toISO);
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) out.push(iso(d));
  return out;
}

export function defaultRange(): { from: string; to: string } {
  return { from: iso(addDays(TODAY, -6)), to: iso(TODAY) };
}

/* convenience lookups */
export function roomById(id: string | null | undefined) {
  return id ? state.rooms.find((r) => r.id === id) : undefined;
}
export function roomTypeById(id: string) {
  return state.roomTypes.find((r) => r.id === id);
}
export function reservationById(id: string) {
  return state.reservations.find((r) => r.id === id);
}
export function folioById(id: string) {
  return state.folios.find((f) => f.id === id);
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  mtn_momo: "MTN Mobile Money",
  airtel_money: "Airtel Money",
  bank_transfer: "Bank Transfer",
};

export const CHARGE_TYPE_LABEL: Record<FolioChargeType, string> = {
  room: "Room",
  fnb: "Food & Beverage",
  tax: "Tax",
  misc: "Misc",
};
