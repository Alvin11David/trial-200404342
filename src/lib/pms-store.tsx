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
  name: string;
  description?: string;
  maxOccupancy: number;
  baseRate: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Guest = {
  id: string;
  propertyId: string;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  idType: string;
  idNumber: string;
  address?: string;
  vipFlag: boolean;
  notes?: string;
  sourceSystemRef?: string;
  createdAt: string;
  updatedAt: string;
  totalVisits: number;
  totalRevenue: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  dateOfBirth?: string;
  gender?: string;
  company?: string;
  discountRate?: number;
  creditLimit?: number;
};

export type RoomStatus =
  | "available"
  | "occupied"
  | "dirty"
  | "in_progress"
  | "clean"
  | "inspected"
  | "maintenance"
  | "blocked";
export type Room = {
  id: string;
  propertyId: string;
  roomTypeId: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  blockStatus?: boolean;
  notes?: string;
  legacyRef?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ReservationStatus = "open" | "confirmed" | "checked_in" | "checked_out" | "cancelled";

export type VatTreatment = "inclusive" | "exclusive" | "exempt" | "not_applicable";

export type CancellationPolicy = {
  id: string;
  name: string;
  freeCancelHoursBefore: number;
  partialRefundPct: number;
  partialRefundHoursBefore: number;
  noShowChargePct: number;
  createdAt?: string;
};

export type RatePlan = {
  id: string;
  propertyId: string;
  roomTypeId: string;
  cancellationPolicyId?: string;
  name: string;
  nightlyRate: number;
  vatTreatment: VatTreatment;
  depositRequiredPct: number;
  minLengthOfStay: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CorporateAccount = {
  id: string;
  propertyId: string;
  companyName: string;
  billingContactName?: string;
  billingContactEmail?: string;
  billingContactPhone?: string;
  address?: string;
  tin?: string;
  creditLimit: number;
  creditTermsDays: number;
  vatTreatment: VatTreatment;
  creditGracePeriodDays: number;
  isActive: boolean;
  outstandingBalance: number;
  legacyRef?: string;
  createdAt: string;
  updatedAt: string;
};

export type TravelAgentAccount = {
  id: string;
  propertyId: string;
  agencyName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  commissionRatePct: number;
  vatTreatment: VatTreatment;
  isActive: boolean;
  legacyRef?: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupBlockStatus = "active" | "confirmed" | "closed" | "cancelled";

export type GroupBlock = {
  id: string;
  propertyId: string;
  groupName: string;
  organiserName?: string;
  organiserEmail?: string;
  startDate: string;
  endDate: string;
  totalRoomsBlocked: number;
  groupRate: number;
  cutoffDate?: string;
  status: GroupBlockStatus;
  createdBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type BillingArrangement = "pay_at_checkout" | "city_ledger" | "agent_ledger";

export type Reservation = {
  id: string;
  propertyId: string;
  confirmationNumber: string;
  resNo?: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestProfileId?: string;
  corporateAccountId?: string;
  travelAgentAccountId?: string;
  groupBlockId?: string;
  billingArrangement: BillingArrangement;
  bookingSource: string;
  otaName?: string;
  agentVoucherNumber?: string;
  roomTypeId: string;
  roomId: string | null;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  ratePerNight: number;
  mealPlan: string;
  status: ReservationStatus;
  specialRequests?: string;
  vipFlag: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  folioId?: string;
  vatRate?: number;
  vatTreatment?: VatTreatment;
  deposit?: number;
  discount?: number;
  arrivalTime?: string;
  extraBeds?: number;
  checkinBy?: string;
  checkoutBy?: string;
  purpose?: string;
  carReg?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  noShowDeclaredAt?: string;
  noShowDeclaredBy?: string;
  sourceSystemRef?: string;
  resCode?: string;
  currency?: string;
  address?: string;
};

export type FolioChargeType = "room" | "fnb" | "tax" | "misc";
export type FolioCharge = {
  id: string;
  folioId: string;
  date: string; // YYYY-MM-DD
  type: FolioChargeType;
  description: string;
  amount: number; // UGX (positive)
  vatTreatment?: VatTreatment;
  voided?: boolean;
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: string;
  postedBy?: string;
};

export type PaymentMethod = "cash" | "card" | "mtn_momo" | "airtel_money" | "bank_transfer";
export type PaymentStatus = "pending" | "confirmed" | "failed";
export type Payment = {
  id: string;
  folioId: string;
  date: string;
  method: PaymentMethod;
  paymentMode?: string;
  paymentType?: string;
  payMode?: string;
  reference?: string;
  phone?: string;
  amount: number;
  totalAmount?: number;
  balance?: number;
  tendered?: number;
  change?: number;
  status: PaymentStatus;
  providerRef?: string;
  failureReason?: string;
  refundOf?: string;
  refundReason?: string;
  refundedBy?: string;
  refundedAt?: string;
  receiptGenerated?: boolean;
  receiptId?: string;
  eventNo?: number;
  organisation?: string;
  currency?: string;
  exchangeRate?: number;
  details?: string;
  visaCharge?: number;
  receiptedBy?: string;
  postingDate?: string;
  cardNamez?: string;
  cardNumber?: string;
  cardNumber2?: string;
  expdate?: string;
  expdate2?: string;
  paymentRefundedOnId?: number;
  efrisInvoiceNo?: string;
  efrisInvoiceId?: string;
  efrisQRCode?: string;
  efrisReferenceNumber?: string;
  efrisVerificationCode?: string;
  customerTin?: string;
  refNo?: string;
  receiptNo?: string;
  cloudStatus?: number;
  remotePosting?: string;
};

export type MealPlan = "ro" | "bb" | "hb" | "fb" | "ai";

export type RoomAssignmentStatus = "assigned" | "checked_in" | "checked_out" | "cancelled";

export type RoomAssignment = {
  id: string;
  reservationId: string;
  roomId: string;
  ratePlanId?: string;
  mealPlan: MealPlan;
  adultCount: number;
  childCount: number;
  nightlyRate: number;
  numberOfNights: number;
  status: RoomAssignmentStatus;
  preAssigned: boolean;
  comingFrom?: string;
  destination?: string;
  purposeOfVisit?: string;
  createdAt: string;
  updatedAt: string;
};

export type Deposit = {
  id: string;
  reservationId: string;
  propertyId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  providerReference?: string;
  collectedBy?: string;
  collectedAt: string;
  appliedAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
};

export type InvoiceStatus = "paid" | "partial" | "unpaid";
export type EFRISStatus = "pending" | "submitted" | "failed" | "confirmed";
export type Invoice = {
  id: string;
  invoiceNo: string;
  folioId: string;
  reservationId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  companyName?: string;
  companyTin?: string;
  companyAddress?: string;
  issuedAt: string;
  status: InvoiceStatus;
  eFRISStatus: EFRISStatus;
  eFRISFiscalNo?: string;
  eFRISQRCode?: string;
  eFRISSubmittedAt?: string;
  totalTaxable: number;
  totalVat: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  isProforma: boolean;
  isCreditNote: boolean;
  creditNoteFor?: string;
  creditNoteReason?: string;
};
export type InvoiceLineItem = {
  id: string;
  invoiceId: string;
  description: string;
  amount: number;
  vatTreatment: VatTreatment;
  vatRate: number;
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;
};

export type FolioStatus = "open" | "active" | "pending_settlement" | "settled" | "closed" | "void";
export type Folio = {
  id: string;
  reservationId: string;
  openedAt: string;
  closedAt?: string;
  status: FolioStatus;
  notes?: string;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  passwordHash?: string;
  isActive: boolean;
  lastLoginAt?: string;
  passwordChangedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type RoleRecord = {
  id: string;
  roleCode: string;
  roleName: string;
  description?: string;
  createdAt: string;
};

export type UserRole = {
  id: string;
  userId: string;
  roleId: string;
  assignedBy?: string;
  assignedAt: string;
  revokedAt?: string;
  revocationReason?: string;
};

export type Property = {
  id: string;
  name: string;
  address?: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  tin?: string;
  efrisDeviceNo?: string;
  defaultCurrency: string;
  standardCheckinTime: string;
  standardCheckoutTime: string;
  timezone: string;
  lateCheckoutHalfCutoff: string;
  folioAdjAgentThreshold: number;
  folioAdjPmThreshold: number;
  requisitionApprovalThreshold: number;
  creditGracePeriodDays: number;
  createdAt: string;
  updatedAt: string;
};

export type AuditSeverity = "info" | "warn" | "critical";
export type AuditEntry = {
  id: string;
  ts: string;
  actor: string;
  role: string;
  module: string;
  action: string;
  entity: string;
  severity: AuditSeverity;
  tableName?: string;
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  auditSetting?: string;
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
  due: string;
  notes: string;
  createdAt: string;
  completedAt?: string;
  taskDescription?: string;
  employeeId?: string;
  date?: string;
  cloudStatus?: number;
  remotePosting?: string;
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
  startTime: string; // ISO
  endTime?: string;
  reason: string;
};

type State = {
  tenant: Property;
  roomTypes: RoomType[];
  rooms: Room[];
  reservations: Reservation[];
  guests: Guest[];
  folios: Folio[];
  charges: FolioCharge[];
  payments: Payment[];
  invoices: Invoice[];
  invoiceLineItems: InvoiceLineItem[];
  users: User[];
  roles: RoleRecord[];
  userRoles: UserRole[];
  cancellationPolicies: CancellationPolicy[];
  ratePlans: RatePlan[];
  corporateAccounts: CorporateAccount[];
  travelAgentAccounts: TravelAgentAccount[];
  groupBlocks: GroupBlock[];
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
  { id: "std", name: "Standard", description: "Comfortable standard room with essential amenities", maxOccupancy: 2, baseRate: 220_000 },
  { id: "dlx", name: "Deluxe", description: "Spacious deluxe room with premium furnishings", maxOccupancy: 3, baseRate: 380_000 },
  { id: "ste", name: "Suite", description: "Luxury suite with separate living area and premium amenities", maxOccupancy: 4, baseRate: 850_000 },
];

const CANCELLATION_POLICIES: CancellationPolicy[] = [
  { id: "cp_flexible", name: "Flexible", freeCancelHoursBefore: 24, partialRefundPct: 0, partialRefundHoursBefore: 0, noShowChargePct: 100, createdAt: new Date().toISOString() },
  { id: "cp_moderate", name: "Moderate", freeCancelHoursBefore: 48, partialRefundPct: 50, partialRefundHoursBefore: 24, noShowChargePct: 100, createdAt: new Date().toISOString() },
  { id: "cp_strict", name: "Strict", freeCancelHoursBefore: 72, partialRefundPct: 0, partialRefundHoursBefore: 0, noShowChargePct: 100, createdAt: new Date().toISOString() },
  { id: "cp_nonrefundable", name: "Non-Refundable", freeCancelHoursBefore: 0, partialRefundPct: 0, partialRefundHoursBefore: 0, noShowChargePct: 100, createdAt: new Date().toISOString() },
];

const RATE_PLANS: RatePlan[] = [
  { id: "rp_rack", propertyId: "T001", roomTypeId: "std", cancellationPolicyId: "cp_flexible", name: "Rack Rate", nightlyRate: 220_000, vatTreatment: "inclusive", depositRequiredPct: 0, minLengthOfStay: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rp_corporate", propertyId: "T001", roomTypeId: "dlx", cancellationPolicyId: "cp_moderate", name: "Corporate Rate", nightlyRate: 195_000, vatTreatment: "exclusive", depositRequiredPct: 0, minLengthOfStay: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rp_bb", propertyId: "T001", roomTypeId: "std", cancellationPolicyId: "cp_flexible", name: "Bed & Breakfast", nightlyRate: 265_000, vatTreatment: "inclusive", depositRequiredPct: 0, minLengthOfStay: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rp_weekend", propertyId: "T001", roomTypeId: "ste", cancellationPolicyId: "cp_strict", name: "Weekend Special", nightlyRate: 310_000, vatTreatment: "inclusive", depositRequiredPct: 20, minLengthOfStay: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rp_nightly", propertyId: "T001", roomTypeId: "dlx", cancellationPolicyId: "cp_flexible", name: "Nightly Saver", nightlyRate: 175_000, vatTreatment: "not_applicable", depositRequiredPct: 50, minLengthOfStay: 1, isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const CORP_ACCOUNTS: CorporateAccount[] = [
  { id: "CA001", propertyId: "T001", companyName: "Speke Resort Bookings Ltd", billingContactName: "Sarah Nambi", billingContactEmail: "accounts@speke.ug", billingContactPhone: "+256-772-100200", address: "Speke Resort, Munyonyo", tin: "UG-1234567890", creditLimit: 50_000_000, creditTermsDays: 30, vatTreatment: "exclusive", creditGracePeriodDays: 14, isActive: true, outstandingBalance: 18_400_000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "CA002", propertyId: "T001", companyName: "Kampala Events Co.", billingContactName: "David Muwonge", billingContactEmail: "finance@kec.co.ug", billingContactPhone: "+256-700-300400", address: "Kololo, Kampala", tin: "UG-0987654321", creditLimit: 20_000_000, creditTermsDays: 30, vatTreatment: "exclusive", creditGracePeriodDays: 14, isActive: true, outstandingBalance: 6_800_000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "CA003", propertyId: "T001", companyName: "Ministry of Tourism", billingContactName: "Alice Kyomugisha", billingContactEmail: "ap@tourism.go.ug", billingContactPhone: "+256-414-555000", address: "Plot 2/4 Jinja Rd, Kampala", tin: "UG-GOVT-001", creditLimit: 100_000_000, creditTermsDays: 60, vatTreatment: "exclusive", creditGracePeriodDays: 30, isActive: true, outstandingBalance: 24_200_000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "CA004", propertyId: "T001", companyName: "Equator Travel Agency", billingContactName: "John Mugisha", billingContactEmail: "billing@equator.ug", billingContactPhone: "+256-701-800900", address: "Entebbe Rd, Kampala", creditLimit: 10_000_000, creditTermsDays: 15, vatTreatment: "exclusive", creditGracePeriodDays: 7, isActive: true, outstandingBalance: 3_400_000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "CA005", propertyId: "T001", companyName: "Acme Corp", billingContactName: "Peter Wasswa", billingContactEmail: "ap@acmecorp.ug", billingContactPhone: "+256-772-111222", tin: "UG-5566778899", creditLimit: 0, creditTermsDays: 30, vatTreatment: "inclusive", creditGracePeriodDays: 14, isActive: true, outstandingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "CA006", propertyId: "T001", companyName: "Global Tech Ltd", billingContactEmail: "finance@globaltech.co.ug", creditLimit: 30_000_000, creditTermsDays: 30, vatTreatment: "exclusive", creditGracePeriodDays: 14, isActive: false, outstandingBalance: 12_500_000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const TRAVEL_AGENTS: TravelAgentAccount[] = [
  { id: "TA001", propertyId: "T001", agencyName: "Equator Travel Agency", contactName: "John Mugisha", contactEmail: "billing@equator.ug", contactPhone: "+256-701-800900", address: "Entebbe Rd, Kampala", commissionRatePct: 15, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "TA002", propertyId: "T001", agencyName: "Safari Giants Ltd", contactName: "Grace Akello", contactEmail: "res@safarigiants.ug", contactPhone: "+256-772-500600", address: "Plot 15, Kololo", commissionRatePct: 10, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "TA003", propertyId: "T001", agencyName: "Pearl Africa Tours", contactName: "Robert Ssempijja", contactEmail: "bookings@pearlafrica.com", contactPhone: "+256-414-233000", commissionRatePct: 12, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "TA004", propertyId: "T001", agencyName: "Uganda Wildlife Safaris", contactEmail: "ops@ugandawildlife.ug", commissionRatePct: 20, vatTreatment: "exclusive", isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const GROUP_BLOCKS: GroupBlock[] = [
  { id: "GB001", propertyId: "T001", groupName: "Kampala Business Summit 2026", organiserName: "Sarah Mukasa", organiserEmail: "sarah@kbsummit.ug", startDate: "2026-07-15", endDate: "2026-07-18", totalRoomsBlocked: 10, groupRate: 180_000, cutoffDate: "2026-07-01", status: "confirmed", createdBy: "U001", approvedBy: "U002", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "GB002", propertyId: "T001", groupName: "Wedding Block — Nambi & Kato", organiserName: "Grace Nambi", organiserEmail: "grace.nambi@email.com", startDate: "2026-08-20", endDate: "2026-08-22", totalRoomsBlocked: 15, groupRate: 200_000, cutoffDate: "2026-08-10", status: "active", createdBy: "U001", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "GB003", propertyId: "T001", groupName: "East African Tourism Expo", organiserName: "John Okello", organiserEmail: "john@eate.ug", startDate: "2026-09-05", endDate: "2026-09-08", totalRoomsBlocked: 20, groupRate: 165_000, cutoffDate: "2026-08-25", status: "active", createdBy: "U002", approvedBy: "U002", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "GB004", propertyId: "T001", groupName: "Closed — Staff Retreat", organiserName: "Admin", startDate: "2026-03-10", endDate: "2026-03-12", totalRoomsBlocked: 8, groupRate: 0, status: "closed", createdBy: "U001", approvedBy: "U002", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "GB005", propertyId: "T001", groupName: "Cancelled Conference Q1", organiserName: "Peter Wasswa", startDate: "2026-01-20", endDate: "2026-01-22", totalRoomsBlocked: 5, groupRate: 190_000, status: "cancelled", createdBy: "U001", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const HOUSEKEEPERS = ["U003", "U008"]; // grace, mary
const DEFAULT_VAT_RATE = 0.18;

const ROOMS: Room[] = (() => {
  const list: Room[] = [];
  const layout: Array<[number, string]> = [
    [1, "std"],
    [1, "std"],
    [1, "std"],
    [1, "dlx"],
    [2, "std"],
    [2, "std"],
    [2, "dlx"],
    [2, "dlx"],
    [3, "dlx"],
    [3, "dlx"],
    [3, "dlx"],
    [3, "ste"],
    [4, "dlx"],
    [4, "ste"],
    [4, "ste"],
    [4, "ste"],
    [5, "ste"],
    [5, "ste"],
  ];
  layout.forEach(([floor, roomTypeId], idx) => {
    const num = `${floor}${String((idx % 4) + 1).padStart(2, "0")}`;
    list.push({
      id: num,
      propertyId: "T001",
      roomTypeId,
      roomNumber: num,
      floor,
      status: [
        "available",
        "occupied",
        "dirty",
        "available",
        "maintenance",
        "available",
        "available",
        "dirty",
      ][idx % 8] as RoomStatus,
    });
  });
  return list;
})();

const RES_SEED_NAMES = [
  "Sarah Mwangi",
  "James Okello",
  "Priya Sharma",
  "David Mensah",
  "Aisha Wanjiku",
  "Mark Tindyebwa",
  "Linda Owino",
  "Tom Kabuye",
  "Joan Nansubuga",
  "Daniel Etyang",
];

const COUNTER_KEY = "jambo-pms-counters";
function loadCounters() {
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}
function saveCounters() {
  try {
    localStorage.setItem(
      COUNTER_KEY,
      JSON.stringify({
        resCounter,
        folioCounter,
        chargeCounter,
        payCounter,
        guestCounter,
        auditCounter,
        hkTaskCounter,
        maintCounter,
        dndCounter,
        receiptCounter,
        invoiceCounter,
        creditNoteCounter,
      }),
    );
  } catch {
    /* ignore */
  }
}
const savedCounters = loadCounters();
let resCounter = savedCounters.resCounter ?? 1000;
const nextResId = () => {
  const v = `RES-${++resCounter}`;
  saveCounters();
  return v;
};
let folioCounter = savedCounters.folioCounter ?? 3000;
const nextFolioId = () => {
  const v = `F-${++folioCounter}`;
  saveCounters();
  return v;
};
let chargeCounter = savedCounters.chargeCounter ?? 7000;
const nextChargeId = () => {
  const v = `C-${++chargeCounter}`;
  saveCounters();
  return v;
};
let payCounter = savedCounters.payCounter ?? 9000;
const nextPayId = () => {
  const v = `PMT-${++payCounter}`;
  saveCounters();
  return v;
};
let guestCounter = savedCounters.guestCounter ?? 500;
const nextGuestId = () => {
  const v = `GST-${++guestCounter}`;
  saveCounters();
  return v;
};
let auditCounter = savedCounters.auditCounter ?? 2900;
const nextAuditId = () => {
  const v = `EVT-${++auditCounter}`;
  saveCounters();
  return v;
};
let hkTaskCounter = savedCounters.hkTaskCounter ?? 4000;
const nextHkTaskId = () => {
  const v = `HK-${++hkTaskCounter}`;
  saveCounters();
  return v;
};
let maintCounter = savedCounters.maintCounter ?? 100;
const nextMaintId = () => {
  const v = `MNT-${++maintCounter}`;
  saveCounters();
  return v;
};
let dndCounter = savedCounters.dndCounter ?? 50;
const nextDndId = () => {
  const v = `DND-${++dndCounter}`;
  saveCounters();
  return v;
};
let receiptCounter = savedCounters.receiptCounter ?? 100;
const nextReceiptId = () => {
  const v = `RCT-${++receiptCounter}`;
  saveCounters();
  return v;
};
let invoiceCounter = savedCounters.invoiceCounter ?? 200;
const nextInvoiceNo = () => {
  const v = `JSL-${new Date().getFullYear()}-${String(++invoiceCounter).padStart(5, "0")}`;
  saveCounters();
  return v;
};
let creditNoteCounter = savedCounters.creditNoteCounter ?? 100;
const nextCreditNoteNo = () => {
  const v = `JSL-CN-${new Date().getFullYear()}-${String(++creditNoteCounter).padStart(5, "0")}`;
  saveCounters();
  return v;
};

const RESERVATIONS: Reservation[] = RES_SEED_NAMES.map((name, i) => {
  // mix of arriving today, departing today, and future
  const offsetIn = (i % 5) - 2; // -2..2
  const nights = 1 + (i % 4);
  const checkIn = addDays(TODAY, offsetIn);
  const checkOut = addDays(checkIn, nights);
  const typeIdx = i % 3;
  const rt = ROOM_TYPES[typeIdx];
  const sameTypeRooms = ROOMS.filter((r) => r.roomTypeId === rt.id);
  const room = sameTypeRooms[i % sameTypeRooms.length];
  // status logic: those with offsetIn < 0 are checked_in (in-house), == 0 arriving, > 0 confirmed.
  let status: ReservationStatus = "confirmed";
  if (offsetIn < 0) status = "checked_in";
  else if (offsetIn === 0) status = i % 2 === 0 ? "confirmed" : "checked_in";
  const id = nextResId();
  const sources = ["direct_web", "ota", "ota", "direct_web", "direct_web"] as const;
  const otaNames: (string | undefined)[] = [undefined, "Booking.com", "Expedia", undefined, undefined];
  const res: Reservation = {
    id,
    propertyId: "T001",
    confirmationNumber: `CNF-${id}`,
    guestName: name,
    guestEmail: name.toLowerCase().replace(" ", ".") + "@example.com",
    guestPhone: "+256 7" + (10000000 + i * 13).toString().slice(0, 8),
    roomTypeId: rt.id,
    roomId: status === "checked_in" || status === "confirmed" ? room.id : null,
    checkIn: iso(checkIn),
    checkOut: iso(checkOut),
    adults: 1 + (i % 2),
    children: i % 3 === 0 ? 1 : 0,
    ratePerNight: rt.baseRate,
    mealPlan: ["RO", "BB", "HB", "BB", "RO"][i % 5],
    billingArrangement: "pay_at_checkout",
    bookingSource: sources[i % 5],
    otaName: otaNames[i % 5],
    status,
    vipFlag: false,
    createdAt: addDays(TODAY, offsetIn - 7).toISOString(),
    updatedAt: addDays(TODAY, offsetIn - 7).toISOString(),
    address: "Kampala, Uganda",
    currency: "UGX",
    resCode: id,
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
      status: "confirmed",
      paymentMode: "mobile_money",
      paymentType: "deposit",
      payMode: "mtn_momo",
      totalAmount: r.ratePerNight,
      balance: 0,
      currency: "UGX",
      exchangeRate: 1,
      details: `Advance payment for ${r.id}`,
      receiptedBy: "Amani Kato",
      postingDate: iso(addDays(TODAY, -1)),
      refNo: `REF-${r.id}`,
      receiptNo: `RCT-${Date.now()}`,
      cloudStatus: 0,
    });
  }
});

// Historical checked-out reservations spanning the past 10 days so the
// 7-day occupancy chart on the dashboard shows a realistic, varied curve.
const HISTORICAL_GUESTS = [
  "Kwame Boateng",
  "Maria Lopez",
  "Aliya Hassan",
  "Brian Otim",
  "Jane Wairimu",
  "Samuel Tenywa",
  "Grace Akello",
  "Paul Mugisha",
  "Ruth Kemigisha",
  "Hassan Ssebunya",
  "Diana Nalwoga",
  "Isaac Kintu",
  "Martha Kyomugisha",
  "Fred Muwonge",
  "Catherine Nakayima",
  "Peter Wasswa",
  "Joyce Namutebi",
  "Robert Ssali",
];
HISTORICAL_GUESTS.forEach((name, k) => {
  const daysAgo = 1 + (k % 9); // 1..9 days in the past
  const nights = 1 + (k % 3); // 1..3 night stays
  const checkIn = addDays(TODAY, -daysAgo - 1);
  const checkOut = addDays(TODAY, -daysAgo);
  const rt = ROOM_TYPES[k % ROOM_TYPES.length];
  const sameTypeRooms = ROOMS.filter((r) => r.roomTypeId === rt.id);
  const room = sameTypeRooms[k % sameTypeRooms.length];
  const id = nextResId();
  const res: Reservation = {
    id,
    guestName: name,
    guestEmail: name.toLowerCase().replace(" ", ".") + "@hist.example.com",
    guestPhone: "+256 701" + (100000 + k * 11).toString().slice(0, 8),
    nationality: ["Uganda", "Kenya", "Rwanda", "Tanzania"][k % 4],
    idType: k % 2 ? "Passport" : "National ID",
    idNumber: "P" + (8000000 + k * 73).toString(),
    roomTypeId: rt.id,
    roomId: room.id,
    checkIn: iso(checkIn),
    checkOut: iso(checkOut),
    adults: 1 + (k % 2),
    children: k % 5 === 0 ? 1 : 0,
    ratePerNight: rt.baseRate,
    mealPlan: ["RO", "BB", "HB"][k % 3],
    mealPlanAmount: 0,
    source: ["Direct", "Booking.com", "Expedia", "Corporate"][k % 4],
    status: "checked_out",
    createdAt: addDays(TODAY, -30).toISOString(),
    address: "Kampala, Uganda",
    totalDays: 1 + (k % 3),
    currency: "UGX",
    payType: "pay_at_hotel",
    occupancyType: "single",
    destination: "Kampala",
    blockStatus: false,
    noOfDays: 1 + (k % 3),
    resCode: id,
    isMailSent: true,
    cloudStatus: 0,
    deleteStatus: 0,
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
  const total = res.ratePerNight * nights;
  CHARGES.push({
    id: nextChargeId(),
    folioId: folio.id,
    date: iso(checkIn),
    type: "room",
    description: `Room ${res.roomId} — ${nights} nights`,
    amount: total,
  });
  const histMethod = (["cash", "card", "mtn_momo", "airtel_money"] as PaymentMethod[])[k % 4];
  PAYMENTS.push({
    id: nextPayId(),
    folioId: folio.id,
    date: iso(checkOut),
    method: histMethod,
    amount: total,
    status: "confirmed",
    paymentMode: histMethod === "mtn_momo" || histMethod === "airtel_money" ? "mobile_money" : histMethod === "card" ? "card" : "cash",
    paymentType: "settlement",
    payMode: histMethod,
    totalAmount: total,
    balance: 0,
    currency: "UGX",
    exchangeRate: 1,
    details: `Payment for ${res.id}`,
    receiptedBy: "Amani Kato",
    postingDate: iso(checkOut),
    refNo: `REF-${res.id}`,
    receiptNo: `RCT-${Date.now()}`,
    cloudStatus: 0,
  });
});

/* Seed historical invoices for settled folios */
const INVOICES: Invoice[] = [];
const INVOICE_LINE_ITEMS: InvoiceLineItem[] = [];
FOLIOS.filter((f) => f.status === "settled").forEach((f) => {
  const res = RESERVATIONS.find((r) => r.id === f.reservationId);
  if (!res) return;
  const folioCharges = CHARGES.filter((c) => c.folioId === f.id && !c.voided);
  const folioPayments = PAYMENTS.filter((p) => p.folioId === f.id && p.status === "confirmed");
  const totalCharges = folioCharges.reduce((s, c) => s + c.amount, 0);
  const totalPaid = folioPayments.reduce((s, p) => s + p.amount, 0);
  let totalTaxable = 0,
    totalVat = 0;
  const lines: InvoiceLineItem[] = [];
  folioCharges.forEach((c) => {
    const vt = c.type === "tax" ? "exempt" : (res.vatTreatment ?? "inclusive");
    const taxable =
      vt === "exempt" ? 0 : vt === "inclusive" ? Math.round(c.amount / (1 + 0.18)) : c.amount;
    const vat = vt === "exempt" ? 0 : Math.round(taxable * 0.18);
    totalTaxable += taxable;
    totalVat += vat;
    const li: InvoiceLineItem = {
      id: `INVLI-${FOLIOS.indexOf(f)}-${lines.length}`,
      invoiceId: f.id,
      description: c.description,
      amount: c.amount,
      vatTreatment: vt,
      vatRate: 0.18,
      taxableAmount: taxable,
      vatAmount: vat,
      totalAmount: c.amount,
    };
    lines.push(li);
  });
  const inv: Invoice = {
    id: f.id,
    invoiceNo: nextInvoiceNo(),
    folioId: f.id,
    reservationId: res.id,
    guestName: res.guestName,
    guestEmail: res.guestEmail,
    guestPhone: res.guestPhone,
    issuedAt: f.closedAt ?? f.openedAt,
    status: totalPaid >= totalCharges ? "paid" : totalPaid > 0 ? "partial" : "unpaid",
    eFRISStatus: "confirmed",
    eFRISFiscalNo: `EFRIS-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    eFRISQRCode: "https://ura.go.ug/efris/qr?placeholder",
    eFRISSubmittedAt: f.closedAt,
    totalTaxable,
    totalVat,
    totalAmount: totalCharges,
    paidAmount: totalPaid,
    outstandingAmount: Math.max(0, totalCharges - totalPaid),
    isProforma: false,
    isCreditNote: false,
  };
  inv.eFRISQRCode = `https://ura.go.ug/efris/qr?invoice=${inv.invoiceNo}`;
  INVOICES.push(inv);
  INVOICE_LINE_ITEMS.push(...lines);
});

const USERS: User[] = [
  { id: "U001", fullName: "Sarah Nakato", email: "sarah@jambo.ug", isActive: true, lastLoginAt: "2026-06-25T10:00:00Z", createdAt: "2024-01-15T00:00:00Z", updatedAt: "2026-06-25T10:00:00Z" },
  { id: "U002", fullName: "Amani Kato", email: "amani@jambo.ug", isActive: true, lastLoginAt: "2026-06-26T08:30:00Z", createdAt: "2024-02-20T00:00:00Z", updatedAt: "2026-06-26T08:30:00Z" },
  { id: "U003", fullName: "Grace Achieng", email: "grace@jambo.ug", isActive: true, lastLoginAt: "2026-06-26T06:00:00Z", createdAt: "2024-03-10T00:00:00Z", updatedAt: "2026-06-26T06:00:00Z" },
  { id: "U004", fullName: "John Mukasa", email: "john@jambo.ug", isActive: true, lastLoginAt: "2026-06-26T09:30:00Z", createdAt: "2024-04-05T00:00:00Z", updatedAt: "2026-06-26T09:30:00Z" },
  { id: "U005", fullName: "Esther Nambi", email: "esther@jambo.ug", isActive: true, lastLoginAt: "2026-06-26T07:00:00Z", createdAt: "2024-05-12T00:00:00Z", updatedAt: "2026-06-26T07:00:00Z" },
  { id: "U006", fullName: "Peter Ssempijja", email: "peter@jambo.ug", isActive: true, lastLoginAt: "2026-06-25T16:00:00Z", createdAt: "2024-06-01T00:00:00Z", updatedAt: "2026-06-25T16:00:00Z" },
  { id: "U007", fullName: "Robert Kizza", email: "robert@jambo.ug", isActive: true, lastLoginAt: "2026-06-26T09:55:00Z", createdAt: "2024-01-10T00:00:00Z", updatedAt: "2026-06-26T09:55:00Z" },
  { id: "U008", fullName: "Mary Nakibuuka", email: "mary@jambo.ug", isActive: true, lastLoginAt: "2026-06-25T06:00:00Z", createdAt: "2024-07-22T00:00:00Z", updatedAt: "2026-06-25T06:00:00Z" },
  { id: "U009", fullName: "Faith Akello", email: "faith@jambo.ug", isActive: false, lastLoginAt: "2026-05-25T10:00:00Z", createdAt: "2024-08-15T00:00:00Z", updatedAt: "2024-08-15T00:00:00Z" },
];

const ROLES_DATA: RoleRecord[] = [
  { id: "R001", roleCode: "OWNER_GM", roleName: "Owner / GM", description: "Full property access & executive reporting", createdAt: "2024-01-01T00:00:00Z" },
  { id: "R002", roleCode: "FD_AGENT", roleName: "Front Desk", description: "Front desk check-in/out & reservations", createdAt: "2024-01-01T00:00:00Z" },
  { id: "R003", roleCode: "HK_STAFF", roleName: "Housekeeping", description: "Housekeeping task management", createdAt: "2024-01-01T00:00:00Z" },
  { id: "R004", roleCode: "POS_CASHIER", roleName: "POS / Cashier", description: "Point of sale & cash handling", createdAt: "2024-01-01T00:00:00Z" },
  { id: "R005", roleCode: "RES_REVENUE", roleName: "Reservations / Revenue", description: "Reservations & revenue management", createdAt: "2024-01-01T00:00:00Z" },
  { id: "R006", roleCode: "ACCOUNTANT", roleName: "Accountant", description: "Accounting, billing & financial reports", createdAt: "2024-01-01T00:00:00Z" },
  { id: "R007", roleCode: "SYS_ADMIN", roleName: "System Administrator", description: "System configuration & access control", createdAt: "2024-01-01T00:00:00Z" },
];

const USER_ROLES_DATA: UserRole[] = [
  { id: "UR001", userId: "U001", roleId: "R001", assignedBy: "U007", assignedAt: "2024-01-15T00:00:00Z" },
  { id: "UR002", userId: "U002", roleId: "R002", assignedBy: "U007", assignedAt: "2024-02-20T00:00:00Z" },
  { id: "UR003", userId: "U003", roleId: "R003", assignedBy: "U007", assignedAt: "2024-03-10T00:00:00Z" },
  { id: "UR004", userId: "U004", roleId: "R004", assignedBy: "U007", assignedAt: "2024-04-05T00:00:00Z" },
  { id: "UR005", userId: "U005", roleId: "R005", assignedBy: "U007", assignedAt: "2024-05-12T00:00:00Z" },
  { id: "UR006", userId: "U006", roleId: "R006", assignedBy: "U007", assignedAt: "2024-06-01T00:00:00Z" },
  { id: "UR007", userId: "U007", roleId: "R007", assignedBy: "U007", assignedAt: "2024-01-10T00:00:00Z" },
  { id: "UR008", userId: "U008", roleId: "R003", assignedBy: "U007", assignedAt: "2024-07-22T00:00:00Z" },
  { id: "UR009", userId: "U009", roleId: "R002", assignedBy: "U007", assignedAt: "2024-08-15T00:00:00Z" },
];

export const nightsBetween = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));

/* Build guest profiles from reservation data + extra seed guests */
const GUESTS: Guest[] = (() => {
  const seen = new Map<string, Guest>();
  const allRsvps = [...RESERVATIONS];

  const genders = ["Male", "Female", "Other"];
  const companies = ["Acme Corp", "Global Tech Ltd", "East African Traders", "", ""];
  allRsvps.forEach((r, idx) => {
    const key = r.guestEmail + r.guestPhone;
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      existing.totalVisits++;
      existing.totalRevenue += r.ratePerNight * nightsBetween(r.checkIn, r.checkOut);
    } else {
      const birthDate = new Date(1980 + (idx % 25), idx % 12, (idx % 28) + 1);
      seen.set(key, {
        id: nextGuestId(),
        propertyId: "T001",
        fullName: r.guestName,
        email: r.guestEmail,
        phone: r.guestPhone,
        address: r.address ?? "Kampala, Uganda",
        vipFlag: idx % 8 === 0,
        notes: idx % 7 === 0 ? "Preferred guest" : undefined,
        sourceSystemRef: idx < 3 ? "legacy-" + nextGuestId() : undefined,
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
        totalVisits: 1,
        totalRevenue: r.ratePerNight * nightsBetween(r.checkIn, r.checkOut),
        tier: "Bronze",
        dateOfBirth: birthDate.toISOString().slice(0, 10),
        gender: genders[idx % genders.length],
        company: companies[idx % companies.length] || undefined,
        discountRate: idx % 5 === 0 ? 10 : undefined,
        creditLimit: idx % 4 === 0 ? 5_000_000 : undefined,
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
  {
    id: nextAuditId(),
    ts: addDays(TODAY, -1).toISOString(),
    actor: "system",
    role: "System",
    module: "system",
    action: "Night audit completed",
    entity: "Day close " + iso(addDays(TODAY, -1)),
    severity: "info",
    tableName: "folios",
    recordId: "F-3001",
    oldValue: "status=active",
    newValue: "status=settled",
    ipAddress: "127.0.0.1",
  },
  {
    id: nextAuditId(),
    ts: addDays(TODAY, -1).toISOString(),
    actor: "Robert Kizza",
    role: "System Administrator",
    module: "identity",
    action: "Updated role permissions",
    entity: "Role: Front Desk",
    severity: "critical",
    tableName: "roles",
    recordId: "ROLE-002",
    oldValue: "permissions=5",
    newValue: "permissions=7",
    ipAddress: "192.168.1.100",
  },
  {
    id: nextAuditId(),
    ts: addDays(TODAY, 0).toISOString(),
    actor: "Amani Kato",
    role: "Front Desk",
    module: "reservations",
    action: "Created reservation",
    entity: RESERVATIONS[0].id,
    severity: "info",
    tableName: "reservations",
    recordId: RESERVATIONS[0].id,
    ipAddress: "192.168.1.101",
  },
];

const HK_TASKS: HousekeepingTask[] = [
  {
    id: "HK-4001",
    roomId: "101",
    type: "turnover",
    priority: "high",
    status: "queued",
    assignedTo: "U003",
    due: "11:30",
    notes: "Guest reported a stain on bedding",
    createdAt: new Date().toISOString(),
    taskDescription: "Replace bedding and deep clean bathroom",
    employeeId: "U003",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: "HK-4002",
    roomId: "308",
    type: "deep_clean",
    priority: "standard",
    status: "queued",
    assignedTo: null,
    due: "12:00",
    notes: "",
    createdAt: new Date().toISOString(),
    taskDescription: "Full room deep clean including carpets",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: "HK-4003",
    roomId: "412",
    type: "linen_change",
    priority: "standard",
    status: "queued",
    assignedTo: null,
    due: "13:15",
    notes: "",
    createdAt: new Date().toISOString(),
    taskDescription: "Change all linen and towels",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: "HK-4004",
    roomId: "117",
    type: "turnover",
    priority: "standard",
    status: "in_progress",
    assignedTo: "U008",
    due: "11:00",
    notes: "",
    createdAt: new Date().toISOString(),
    taskDescription: "Standard turnover cleaning after checkout",
    employeeId: "U008",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: "HK-4005",
    roomId: "502",
    type: "deep_clean",
    priority: "vip",
    status: "in_progress",
    assignedTo: "U003",
    due: "12:30",
    notes: "VIP guest arriving 14:00",
    createdAt: new Date().toISOString(),
    taskDescription: "VIP deep clean with extra attention to detail",
    employeeId: "U003",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: "HK-4006",
    roomId: "203",
    type: "turnover",
    priority: "standard",
    status: "clean",
    assignedTo: "U003",
    due: "10:00",
    notes: "",
    createdAt: addDays(TODAY, 0).toISOString(),
    taskDescription: "Standard turnover completed",
    employeeId: "U003",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: "HK-4007",
    roomId: "305",
    type: "deep_clean",
    priority: "standard",
    status: "clean",
    assignedTo: "U008",
    due: "09:30",
    notes: "",
    createdAt: addDays(TODAY, 0).toISOString(),
    taskDescription: "Deep clean completed",
    employeeId: "U008",
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: "HK-4008",
    roomId: "410",
    type: "turnover",
    priority: "standard",
    status: "inspected",
    assignedTo: "U003",
    due: "09:00",
    notes: "",
    createdAt: addDays(TODAY, 0).toISOString(),
    completedAt: new Date().toISOString(),
    taskDescription: "Turnover inspected and approved",
    employeeId: "U003",
    date: new Date().toISOString().slice(0, 10),
  },
];

const MAINT_REQUESTS: MaintenanceRequest[] = [];

const DND_RECORDS: DNDRecord[] = [];

const TENANT: Property = {
  id: "T001",
  name: "Jambo Sphere Hotel",
  address: "Plot 24, Kampala Road, Kampala, Uganda",
  city: "Kampala",
  country: "Uganda",
  phone: "+256 700 000 000",
  email: "frontdesk@jambo.ug",
  tin: "1000123456",
  efrisDeviceNo: "TCSe3bc4b1488854572",
  defaultCurrency: "UGX",
  standardCheckinTime: "14:00:00",
  standardCheckoutTime: "11:00:00",
  timezone: "Africa/Kampala",
  lateCheckoutHalfCutoff: "15:00:00",
  folioAdjAgentThreshold: 10_000,
  folioAdjPmThreshold: 50_000,
  requisitionApprovalThreshold: 500_000,
  creditGracePeriodDays: 14,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2026-06-26T00:00:00Z",
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
      invoices: state.invoices,
      invoiceLineItems: state.invoiceLineItems,
      users: state.users,
      roles: state.roles,
      userRoles: state.userRoles,
      audit: state.audit,
      housekeepingTasks: state.housekeepingTasks,
      maintenanceRequests: state.maintenanceRequests,
      dndRecords: state.dndRecords,
      cancellationPolicies: state.cancellationPolicies,
      ratePlans: state.ratePlans,
      corporateAccounts: state.corporateAccounts,
      travelAgentAccounts: state.travelAgentAccounts,
      groupBlocks: state.groupBlocks,
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
  invoices: persisted?.invoices ?? INVOICES,
  invoiceLineItems: persisted?.invoiceLineItems ?? INVOICE_LINE_ITEMS,
  users: persisted?.users ?? USERS,
  roles: persisted?.roles ?? ROLES_DATA,
  userRoles: persisted?.userRoles ?? USER_ROLES_DATA,
  audit: persisted?.audit ?? AUDIT,
  cancellationPolicies: persisted?.cancellationPolicies ?? CANCELLATION_POLICIES,
  ratePlans: persisted?.ratePlans ?? RATE_PLANS,
  corporateAccounts: persisted?.corporateAccounts ?? CORP_ACCOUNTS,
  travelAgentAccounts: persisted?.travelAgentAccounts ?? TRAVEL_AGENTS,
  groupBlocks: persisted?.groupBlocks ?? GROUP_BLOCKS,
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
  return useSyncExternalStore(
    subscribe,
    () => selector(snap()),
    () => selector(snap()),
  );
}

/* ============================== Offline Sync Queue ============================== */

const SYNC_KEY = "jambo-pms-outbox";

export type OutboxEntry = {
  id: string;
  ts: string;
  type:
    | "create_reservation"
    | "cancel_reservation"
    | "update_reservation"
    | "check_in"
    | "check_out";
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
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
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
export const fmtUGX = (n: number) => "UGX " + Math.round(n).toLocaleString();

export function logAudit(entry: Omit<AuditEntry, "id" | "ts">) {
  state.audit = [{ id: nextAuditId(), ts: new Date().toISOString(), ...entry }, ...state.audit];
}

/* date ranges overlap, treating checkOut as exclusive */
function rangesOverlap(aIn: string, aOut: string, bIn: string, bOut: string) {
  return aIn < bOut && bIn < aOut;
}

/** Rooms that are bookable for a given room type and date range, ignoring soft statuses. */
export function findAvailableRooms(roomTypeId: string, checkIn: string, checkOut: string) {
  return state.rooms.filter((r) => {
    if (r.roomTypeId !== roomTypeId) return false;
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

export function upsertGuest(input: {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  idType: string;
  idNumber: string;
  dateOfBirth?: string;
  gender?: string;
  company?: string;
  discountRate?: number;
  creditLimit?: number;
  notes?: string;
  address?: string;
}): string {
  const existing = state.guests.find((g) => g.email === input.email || g.phone === input.phone);
  if (existing) {
    state.guests = state.guests.map((g) => (g.id === existing.id ? { ...g, ...input } : g));
    emit();
    return existing.id;
  }
  const now = new Date().toISOString();
  const id = nextGuestId();
  state.guests = [
    {
      id,
      propertyId: "T001",
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      nationality: input.nationality,
      idType: input.idType,
      idNumber: input.idNumber,
      address: input.address,
      vipFlag: false,
      notes: input.notes,
      sourceSystemRef: undefined,
      createdAt: now,
      updatedAt: now,
      totalVisits: 0,
      totalRevenue: 0,
      tier: "Bronze",
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      company: input.company,
      discountRate: input.discountRate,
      creditLimit: input.creditLimit,
    },
    ...state.guests,
  ];
  emit();
  return id;
}

export function findGuestByPhoneOrEmail(query: string): Guest | undefined {
  const q = query.toLowerCase();
  return state.guests.find(
    (g) => g.phone.toLowerCase().includes(q) || g.email.toLowerCase().includes(q),
  );
}

export function findGuests(query: string): Guest[] {
  const q = query.toLowerCase();
  return state.guests.filter(
    (g) =>
      g.fullName.toLowerCase().includes(q) ||
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
  const reservations = state.reservations.filter(
    (r) => r.guestEmail === email && r.guestPhone === phone,
  );
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
  nationality?: string;
  idType?: string;
  idNumber?: string;
  payment?: {
    method: PaymentMethod;
    amount: number;
    phone?: string;
    reference?: string;
    tendered?: number;
    change?: number;
  };
};

export function createReservation(
  input: NewReservationInput,
): { ok: true; id: string } | { ok: false; error: string } {
  if (!input.checkIn || !input.checkOut || input.checkIn >= input.checkOut) {
    return { ok: false, error: "Check-out must be after check-in." };
  }
  let roomId = input.roomId ?? null;
  if (roomId) {
    const available = findAvailableRooms(input.roomTypeId, input.checkIn, input.checkOut).some(
      (r) => r.id === roomId,
    );
    if (!available)
      return { ok: false, error: "Selected room is no longer available for these dates." };
  }
  const now = new Date().toISOString();
  const reservation: Reservation = {
    id,
    propertyId: input.propertyId ?? "T001",
    confirmationNumber: input.confirmationNumber ?? `CNF-${id}`,
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone,
    guestProfileId: input.guestProfileId,
    corporateAccountId: input.corporateAccountId,
    travelAgentAccountId: input.travelAgentAccountId,
    groupBlockId: input.groupBlockId,
    billingArrangement: input.billingArrangement ?? "pay_at_checkout",
    bookingSource: input.bookingSource ?? "direct_web",
    otaName: input.otaName,
    agentVoucherNumber: input.agentVoucherNumber,
    roomTypeId: input.roomTypeId,
    roomId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adults,
    children: input.children,
    ratePerNight: input.ratePerNight,
    mealPlan: input.mealPlan,
    status: "confirmed",
    specialRequests: input.specialRequests,
    vipFlag: input.vipFlag ?? false,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    vatRate: DEFAULT_VAT_RATE,
    vatTreatment: "inclusive",
    deposit: input.deposit,
    discount: input.discount,
    arrivalTime: input.arrivalTime,
    extraBeds: input.extraBeds,
    checkinBy: input.checkinBy,
    checkoutBy: input.checkoutBy,
    purpose: input.purpose,
    carReg: input.carReg,
    sourceSystemRef: input.sourceSystemRef,
    resCode: input.resCode,
    currency: input.currency,
    address: input.address,
  };
  state.reservations = [reservation, ...state.reservations];

  // link/update guest profile
  upsertGuest({
    fullName: input.guestName,
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
    const needsGateway =
      input.payment.method === "mtn_momo" ||
      input.payment.method === "airtel_money" ||
      input.payment.method === "card" ||
      input.payment.method === "bank_transfer";
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
        tendered: input.payment.tendered,
        change: input.payment.change,
        status: needsGateway ? "pending" : "confirmed",
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

export type UpdateReservationInput = Partial<
  Omit<Reservation, "id" | "createdAt" | "status" | "folioId">
>;

export function updateReservation(
  id: string,
  patch: UpdateReservationInput,
): { ok: true } | { ok: false; error: string } {
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
    r.id === id
      ? {
          ...r,
          status: "cancelled",
          notes: reason
            ? `${r.notes ? r.notes + "\n" : ""}Cancellation reason: ${reason}`
            : r.notes,
        }
      : r,
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

export function checkIn(
  reservationId: string,
  opts: { roomId?: string } = {},
): { ok: true } | { ok: false; error: string } {
  const res = state.reservations.find((r) => r.id === reservationId);
  if (!res) return { ok: false, error: "Reservation not found." };
  if (res.status === "checked_in") return { ok: false, error: "Already checked in." };
  if (res.status !== "confirmed" && res.status !== "open")
    return { ok: false, error: "Cannot check in from status: " + res.status };
  const targetRoom = opts.roomId ?? res.roomId;
  if (!targetRoom) return { ok: false, error: "Assign a room before checking in." };
  const roomOk =
    findAvailableRooms(res.roomTypeId, res.checkIn, res.checkOut).some(
      (r) => r.id === targetRoom,
    ) || res.roomId === targetRoom;
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
  state.rooms = state.rooms.map((r) => (r.id === targetRoom ? { ...r, status: "occupied" } : r));

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
  if (res.status !== "checked_in")
    return { ok: false, error: "Guest is not currently checked in." };
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
    state.rooms = state.rooms.map((r) => (r.id === res.roomId ? { ...r, status: "dirty" } : r));
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
  const charges = state.charges
    .filter((c) => c.folioId === folioId)
    .reduce((s, c) => s + c.amount, 0);
  const payments = state.payments
    .filter((p) => p.folioId === folioId && p.status === "confirmed")
    .reduce((s, p) => s + p.amount, 0);
  return charges - payments;
}

export function addCharge(
  folioId: string,
  input: Omit<FolioCharge, "id" | "folioId" | "date"> & { date?: string; postedBy?: string },
) {
  state.charges = [
    ...state.charges,
    {
      id: nextChargeId(),
      folioId,
      date: input.date ?? todayISO(),
      type: input.type,
      description: input.description,
      amount: input.amount,
      postedBy: input.postedBy,
    },
  ];
  logAudit({
    actor: input.postedBy ?? "Front Desk",
    role: "Front Desk",
    module: "billing",
    action: "Posted charge",
    entity: `${folioId} ${fmtUGX(input.amount)}`,
    severity: "info",
  });
  emit();
}

export function addPayment(
  folioId: string,
  input: Omit<Payment, "id" | "folioId" | "date" | "status"> & {
    date?: string;
    receivedBy?: string;
    status?: PaymentStatus;
  },
) {
  const needsGateway =
    input.method === "mtn_momo" ||
    input.method === "airtel_money" ||
    input.method === "card" ||
    input.method === "bank_transfer";
  const status = input.status ?? (needsGateway ? "pending" : "confirmed");
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
      tendered: input.tendered,
      change: input.change,
      status,
      providerRef: input.providerRef,
      failureReason: input.failureReason,
      receiptGenerated: status === "confirmed",
      receiptId: status === "confirmed" ? nextReceiptId() : undefined,
    },
  ];
  // auto-settle only for confirmed payments
  if (status === "confirmed") {
    const bal = folioBalance(folioId);
    if (bal <= 0.5) {
      state.folios = state.folios.map((f) =>
        f.id === folioId ? { ...f, status: "settled", closedAt: new Date().toISOString() } : f,
      );
    }
  }
  logAudit({
    actor: input.receivedBy ?? "Cashier",
    role: "Accountant",
    module: "billing",
    action: `Posted ${status} payment`,
    entity: `${folioId} ${fmtUGX(input.amount)} via ${input.method}`,
    severity: "info",
  });
  emit();
}

export function confirmPayment(
  paymentId: string,
  actor: string,
  role: string,
  providerRef?: string,
) {
  state.payments = state.payments.map((p) =>
    p.id === paymentId && p.status === "pending"
      ? {
          ...p,
          status: "confirmed",
          providerRef: providerRef ?? p.providerRef,
          receiptGenerated: true,
          receiptId: nextReceiptId(),
        }
      : p,
  );
  const payment = state.payments.find((p) => p.id === paymentId);
  if (payment && payment.status === "confirmed") {
    const bal = folioBalance(payment.folioId);
    if (bal <= 0.5) {
      state.folios = state.folios.map((f) =>
        f.id === payment.folioId
          ? { ...f, status: "settled", closedAt: new Date().toISOString() }
          : f,
      );
    }
    logAudit({
      actor,
      role,
      module: "billing",
      action: "Confirmed payment",
      entity: `${payment.folioId} ${fmtUGX(payment.amount)} via ${payment.method} (${payment.id})`,
      severity: "info",
    });
  }
  emit();
}

export function failPayment(paymentId: string, reason: string, actor: string, role: string) {
  state.payments = state.payments.map((p) =>
    p.id === paymentId && p.status === "pending"
      ? { ...p, status: "failed", failureReason: reason }
      : p,
  );
  const payment = state.payments.find((p) => p.id === paymentId);
  if (payment && payment.status === "failed") {
    logAudit({
      actor,
      role,
      module: "billing",
      action: "Failed payment",
      entity: `${payment.folioId} ${fmtUGX(payment.amount)} via ${payment.method} — ${reason}`,
      severity: "warn",
    });
  }
  emit();
}

const REFUND_ALLOWED_ROLES = ["Owner / GM", "Accountant", "System Administrator"];

export function processRefund(
  paymentId: string,
  refundAmount: number,
  reason: string,
  actor: string,
  role: string,
) {
  if (!REFUND_ALLOWED_ROLES.includes(role)) {
    logAudit({
      actor,
      role,
      module: "billing",
      action: "Refund rejected — unauthorised",
      entity: `${paymentId} attempted by ${role}`,
      severity: "critical",
    });
    emit();
    return;
  }
  const original = state.payments.find((p) => p.id === paymentId);
  if (!original || original.status !== "confirmed") {
    logAudit({
      actor,
      role,
      module: "billing",
      action: "Refund rejected — invalid payment",
      entity: `${paymentId} status=${original?.status}`,
      severity: "warn",
    });
    emit();
    return;
  }
  if (refundAmount <= 0 || refundAmount > original.amount) {
    logAudit({
      actor,
      role,
      module: "billing",
      action: "Refund rejected — invalid amount",
      entity: `${paymentId} requested=${fmtUGX(refundAmount)} max=${fmtUGX(original.amount)}`,
      severity: "warn",
    });
    emit();
    return;
  }
  const refund: Payment = {
    id: nextPayId(),
    folioId: original.folioId,
    date: todayISO(),
    method: original.method,
    amount: -refundAmount,
    reference: original.reference,
    status: "confirmed",
    refundOf: paymentId,
    refundReason: reason,
    refundedBy: actor,
    refundedAt: todayISO(),
    receiptGenerated: true,
    receiptId: nextReceiptId(),
  };
  state.payments = [...state.payments, refund];
  logAudit({
    actor,
    role,
    module: "billing",
    action: "Refund processed",
    entity: `${refund.folioId} ${fmtUGX(refundAmount)} via ${original.method} — ${reason}`,
    severity: "warn",
  });
  emit();
}

/* ============================ Simulated Gateway ============================ */

type GatewayResult =
  | { success: true; providerRef: string }
  | { success: false; failureReason: string };
const gatewayResultCache = new Map<string, GatewayResult>();

function simulateNetworkCall(): Promise<GatewayResult> {
  const delay = 800 + Math.random() * 1200;
  return new Promise((resolve) => {
    setTimeout(() => {
      if (Math.random() < 0.8) {
        resolve({
          success: true,
          providerRef: `GATEWAY-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        });
      } else {
        resolve({ success: false, failureReason: "Network error — payment authorisation failed" });
      }
    }, delay);
  });
}

export async function simulateGatewayConfirm(
  paymentId: string,
  actor: string,
  role: string,
  idempotencyKey?: string,
): Promise<{ ok: boolean; message: string }> {
  const key = idempotencyKey ?? paymentId;
  const cached = gatewayResultCache.get(key);
  if (cached) {
    if (cached.success) {
      confirmPayment(paymentId, actor, role, cached.providerRef);
      logAudit({
        actor,
        role,
        module: "billing",
        action: "Gateway retry — idempotent",
        entity: `${paymentId} cached result used (key=${key})`,
        severity: "info",
      });
      return { ok: true, message: "Confirmed (idempotent retry)" };
    }
    return { ok: false, message: cached.failureReason };
  }
  const result = await simulateNetworkCall();
  gatewayResultCache.set(key, result);
  if (result.success) {
    confirmPayment(paymentId, actor, role, result.providerRef);
    return { ok: true, message: "Payment confirmed" };
  }
  failPayment(paymentId, result.failureReason, actor, role);
  return { ok: false, message: result.failureReason };
}

export function clearGatewayCache() {
  gatewayResultCache.clear();
}

/* ============================== Invoicing ============================== */

function currentVatRate(): number {
  return DEFAULT_VAT_RATE;
}

export function generateInvoice(folioId: string): Invoice | null {
  const folio = state.folios.find((f) => f.id === folioId);
  if (!folio || (folio.status !== "settled" && folio.status !== "closed")) return null;
  const existing = state.invoices.find(
    (i) => i.folioId === folioId && !i.isProforma && !i.isCreditNote,
  );
  if (existing) return existing;
  const res = state.reservations.find((r) => r.id === folio.reservationId);
  if (!res) return null;
  const folioCharges = state.charges.filter((c) => c.folioId === folioId && !c.voided);
  const folioPayments = state.payments.filter(
    (p) => p.folioId === folioId && p.status === "confirmed",
  );
  const totalCharges = folioCharges.reduce((s, c) => s + c.amount, 0);
  const totalPaid = folioPayments.reduce((s, p) => s + p.amount, 0);
  const vatRate = currentVatRate();
  let totalTaxable = 0,
    totalVat = 0;
  const lines: InvoiceLineItem[] = [];
  const invId = `INV-${folioId}`;
  folioCharges.forEach((c) => {
    const vt = c.vatTreatment ?? (c.type === "tax" ? "exempt" : (res.vatTreatment ?? "inclusive"));
    const taxable =
      vt === "exempt" ? 0 : vt === "inclusive" ? Math.round(c.amount / (1 + vatRate)) : c.amount;
    const vat = vt === "exempt" ? 0 : Math.round(taxable * vatRate);
    totalTaxable += taxable;
    totalVat += vat;
    lines.push({
      id: `INVLI-${invId}-${lines.length}`,
      invoiceId: invId,
      description: c.description,
      amount: c.amount,
      vatTreatment: vt,
      vatRate,
      taxableAmount: taxable,
      vatAmount: vat,
      totalAmount: c.amount,
    });
  });
  const inv: Invoice = {
    id: invId,
    invoiceNo: nextInvoiceNo(),
    folioId,
    reservationId: res.id,
    guestName: res.guestName,
    guestEmail: res.guestEmail,
    guestPhone: res.guestPhone,
    issuedAt: new Date().toISOString(),
    status: totalPaid >= totalCharges ? "paid" : totalPaid > 0 ? "partial" : "unpaid",
    eFRISStatus: "pending",
    totalTaxable,
    totalVat,
    totalAmount: totalCharges,
    paidAmount: totalPaid,
    outstandingAmount: Math.max(0, totalCharges - totalPaid),
    isProforma: false,
    isCreditNote: false,
  };
  state.invoices = [...state.invoices, inv];
  state.invoiceLineItems = [...state.invoiceLineItems, ...lines];
  logAudit({
    actor: "System",
    role: "System",
    module: "billing",
    action: `Invoice generated ${inv.invoiceNo}`,
    entity: `${folioId} total=${fmtUGX(totalCharges)}`,
    severity: "info",
  });
  emit();
  return inv;
}

export async function submitToEFRIS(
  invoiceId: string,
  actor: string,
  role: string,
): Promise<boolean> {
  const inv = state.invoices.find((i) => i.id === invoiceId);
  if (!inv || inv.isProforma || inv.isCreditNote) return false;
  if (inv.eFRISStatus === "confirmed") return true;
  state.invoices = state.invoices.map((i) =>
    i.id === invoiceId ? { ...i, eFRISStatus: "pending" as const } : i,
  );
  emit();
  const delay = 1000 + Math.random() * 2000;
  await new Promise((r) => setTimeout(r, delay));
  const success = Math.random() < 0.9;
  state.invoices = state.invoices.map((i) => {
    if (i.id !== invoiceId) return i;
    if (success) {
      return {
        ...i,
        eFRISStatus: "confirmed" as const,
        eFRISFiscalNo: `EFRIS-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        eFRISQRCode: `https://ura.go.ug/efris/qr?invoice=${i.invoiceNo}`,
        eFRISSubmittedAt: new Date().toISOString(),
      };
    }
    return { ...i, eFRISStatus: "failed" as const };
  });
  logAudit({
    actor,
    role,
    module: "billing",
    action: success ? "EFRIS submission confirmed" : "EFRIS submission failed",
    entity: `${inv.invoiceNo}`,
    severity: success ? "info" : "warn",
  });
  emit();
  return success;
}

export function generateCreditNote(
  folioId: string,
  voidedChargeId: string,
  reason: string,
  actor: string,
  role: string,
): Invoice | null {
  const existingInv = state.invoices.find(
    (i) => i.folioId === folioId && i.isCreditNote && i.creditNoteFor === voidedChargeId,
  );
  if (existingInv) return existingInv;
  const originalInv = state.invoices.find(
    (i) => i.folioId === folioId && !i.isProforma && !i.isCreditNote,
  );
  const charge = state.charges.find((c) => c.id === voidedChargeId);
  if (!charge) return null;
  const vatRate = currentVatRate();
  const vt = charge.vatTreatment ?? "inclusive";
  const taxable =
    vt === "exempt"
      ? 0
      : vt === "inclusive"
        ? Math.round(charge.amount / (1 + vatRate))
        : charge.amount;
  const vat = vt === "exempt" ? 0 : Math.round(taxable * vatRate);
  const cnId = `CN-${folioId}-${voidedChargeId}`;
  const cn: Invoice = {
    id: cnId,
    invoiceNo: nextCreditNoteNo(),
    folioId,
    reservationId: originalInv?.reservationId ?? "",
    guestName: originalInv?.guestName ?? "",
    guestEmail: originalInv?.guestEmail ?? "",
    guestPhone: originalInv?.guestPhone ?? "",
    issuedAt: new Date().toISOString(),
    status: "paid",
    eFRISStatus: "pending",
    totalTaxable: taxable,
    totalVat: vat,
    totalAmount: -charge.amount,
    paidAmount: 0,
    outstandingAmount: 0,
    isProforma: false,
    isCreditNote: true,
    creditNoteFor: originalInv?.invoiceNo,
    creditNoteReason: reason,
  };
  state.invoices = [...state.invoices, cn];
  state.invoiceLineItems = [
    ...state.invoiceLineItems,
    {
      id: `INVLI-${cnId}-0`,
      invoiceId: cnId,
      description: `Credit note: ${charge.description} — ${reason}`,
      amount: -charge.amount,
      vatTreatment: vt,
      vatRate,
      taxableAmount: -taxable,
      vatAmount: -vat,
      totalAmount: -charge.amount,
    },
  ];
  logAudit({
    actor,
    role,
    module: "billing",
    action: `Credit note ${cn.invoiceNo} generated`,
    entity: `${folioId} charge=${voidedChargeId} reason=${reason}`,
    severity: "warn",
  });
  emit();
  submitToEFRIS(cnId, actor, role);
  return cn;
}

export function generateProforma(folioId: string): Invoice | null {
  const folio = state.folios.find((f) => f.id === folioId);
  if (!folio) return null;
  const res = state.reservations.find((r) => r.id === folio.reservationId);
  if (!res) return null;
  const folioCharges = state.charges.filter((c) => c.folioId === folioId && !c.voided);
  const folioPayments = state.payments.filter(
    (p) => p.folioId === folioId && p.status === "confirmed",
  );
  const totalCharges = folioCharges.reduce((s, c) => s + c.amount, 0);
  const totalPaid = folioPayments.reduce((s, p) => s + p.amount, 0);
  const vatRate = currentVatRate();
  let totalTaxable = 0,
    totalVat = 0;
  const invId = `PRO-${folioId}`;
  const lines: InvoiceLineItem[] = folioCharges.map((c, idx) => {
    const vt = c.vatTreatment ?? (c.type === "tax" ? "exempt" : (res.vatTreatment ?? "inclusive"));
    const taxable =
      vt === "exempt" ? 0 : vt === "inclusive" ? Math.round(c.amount / (1 + vatRate)) : c.amount;
    const vat = vt === "exempt" ? 0 : Math.round(taxable * vatRate);
    totalTaxable += taxable;
    totalVat += vat;
    return {
      id: `INVLI-${invId}-${idx}`,
      invoiceId: invId,
      description: c.description,
      amount: c.amount,
      vatTreatment: vt,
      vatRate,
      taxableAmount: taxable,
      vatAmount: vat,
      totalAmount: c.amount,
    };
  });
  const pro: Invoice = {
    id: invId,
    invoiceNo: "PROFORMA",
    folioId,
    reservationId: res.id,
    guestName: res.guestName,
    guestEmail: res.guestEmail,
    guestPhone: res.guestPhone,
    issuedAt: new Date().toISOString(),
    status: totalPaid >= totalCharges ? "paid" : totalPaid > 0 ? "partial" : "unpaid",
    eFRISStatus: "confirmed",
    totalTaxable,
    totalVat,
    totalAmount: totalCharges,
    paidAmount: totalPaid,
    outstandingAmount: Math.max(0, totalCharges - totalPaid),
    isProforma: true,
    isCreditNote: false,
  };
  state.invoices = [...state.invoices, pro];
  state.invoiceLineItems = [...state.invoiceLineItems, ...lines];
  emit();
  return pro;
}

export function searchInvoices(query: {
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  eFRISStatus?: string;
}): Invoice[] {
  return state.invoices.filter((inv) => {
    if (inv.isCreditNote) return false;
    if (query.q) {
      const lower = query.q.toLowerCase();
      if (
        !inv.guestName.toLowerCase().includes(lower) &&
        !inv.invoiceNo.toLowerCase().includes(lower) &&
        !inv.reservationId.toLowerCase().includes(lower) &&
        !(inv.eFRISFiscalNo ?? "").toLowerCase().includes(lower)
      )
        return false;
    }
    if (query.dateFrom && inv.issuedAt.slice(0, 10) < query.dateFrom) return false;
    if (query.dateTo && inv.issuedAt.slice(0, 10) > query.dateTo) return false;
    if (query.status && inv.status !== query.status) return false;
    if (query.eFRISStatus && inv.eFRISStatus !== query.eFRISStatus) return false;
    return true;
  });
}

export function invoicesForFolio(folioId: string): Invoice[] {
  return state.invoices.filter((i) => i.folioId === folioId);
}

export function invoiceLineItemsFor(invoiceId: string): InvoiceLineItem[] {
  return state.invoiceLineItems.filter((li) => li.invoiceId === invoiceId);
}

export function voidCharge(
  folioId: string,
  chargeId: string,
  reason: string,
  actor: string,
  role: string,
) {
  state.charges = state.charges.map((c) =>
    c.id === chargeId && c.folioId === folioId && !c.voided
      ? {
          ...c,
          voided: true,
          voidReason: reason,
          voidedBy: actor,
          voidedAt: new Date().toISOString(),
        }
      : c,
  );
  logAudit({
    actor,
    role,
    module: "billing",
    action: `Voided charge ${chargeId}`,
    entity: `${folioId} — ${reason}`,
    severity: "warn",
  });
  emit();
  const hasInvoice = state.invoices.some(
    (i) => i.folioId === folioId && !i.isProforma && !i.isCreditNote,
  );
  if (hasInvoice) {
    generateCreditNote(folioId, chargeId, reason, actor, role);
  }
}

export function settleFolio(folioId: string, actor: string, role: string) {
  state.folios = state.folios.map((f) =>
    f.id === folioId && f.status !== "settled" && f.status !== "closed" && f.status !== "void"
      ? { ...f, status: "settled", closedAt: new Date().toISOString() }
      : f,
  );
  logAudit({
    actor,
    role,
    module: "billing",
    action: "Folio settled",
    entity: folioId,
    severity: "info",
  });
  emit();
  const inv = generateInvoice(folioId);
  if (inv) {
    logAudit({
      actor,
      role,
      module: "billing",
      action: "Invoice auto-generated on settle",
      entity: `${inv.invoiceNo} for ${folioId}`,
      severity: "info",
    });
    emit();
    submitToEFRIS(inv.id, actor, role);
  }
}

export function runNightAudit(actor: string, role: string) {
  const today = todayISO();
  const posted: string[] = [];
  state.folios.forEach((f) => {
    if (f.status !== "open" && f.status !== "active") return;
    const res = state.reservations.find((r) => r.id === f.reservationId);
    if (!res || !res.roomId) return;
    const alreadyPosted = state.charges.some(
      (c) => c.folioId === f.id && c.date === today && c.type === "room",
    );
    if (alreadyPosted) return;
    const nightsSoFar = Math.max(
      1,
      Math.ceil((new Date(today).getTime() - new Date(res.checkIn).getTime()) / 86_400_000),
    );
    state.charges = [
      ...state.charges,
      {
        id: nextChargeId(),
        folioId: f.id,
        date: today,
        type: "room",
        description: `Room ${res.roomId} — night ${nightsSoFar}`,
        amount: res.ratePerNight,
        postedBy: actor,
      },
    ];
    posted.push(f.id);
  });
  // advance folio lifecycle
  state.folios = state.folios.map((f) => {
    if (f.status === "open") return { ...f, status: "active" };
    return f;
  });
  logAudit({
    actor,
    role,
    module: "billing",
    action: "Night audit completed",
    entity: `${posted.length} folios charged for ${today}`,
    severity: "info",
  });
  emit();
  return posted;
}

export function totalOutstanding() {
  return state.folios
    .filter(
      (f) => f.status === "open" || f.status === "active" || f.status === "pending_settlement",
    )
    .reduce((s, f) => s + folioBalance(f.id), 0);
}

export function paymentsToday() {
  const today = todayISO();
  return state.payments
    .filter((p) => p.date === today && p.status === "confirmed")
    .reduce((s, p) => s + p.amount, 0);
}

export const FOLIO_STATUS_LABEL: Record<FolioStatus, string> = {
  open: "Open",
  active: "Active",
  pending_settlement: "Pending Settlement",
  settled: "Settled",
  closed: "Closed",
  void: "Void",
};

/* ============================== Rooms / Housekeeping ============================== */

export function setRoomStatus(roomId: string, status: RoomStatus) {
  state.rooms = state.rooms.map((r) => (r.id === roomId ? { ...r, status } : r));
  logAudit({
    actor: "Housekeeping",
    role: "Housekeeping",
    module: "housekeeping",
    action: "Updated room status",
    entity: `Room ${roomId} → ${status}`,
    severity: "info",
  });
  emit();
}

export function assignRoomHousekeeper(roomId: string, userId: string | null) {
  state.rooms = state.rooms.map((r) => (r.id === roomId ? { ...r, assignedTo: userId } : r));
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
  logAudit({
    actor: "Housekeeping",
    role: "Housekeeping",
    module: "housekeeping",
    action: "Task created",
    entity: `${task.id} — Room ${input.roomId} (${input.type})`,
    severity: "info",
  });
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
  logAudit({
    actor: "Housekeeping",
    role: "Housekeeping",
    module: "housekeeping",
    action: `Task ${status}`,
    entity: `${task.id} — Room ${task.roomId}`,
    severity: "info",
  });
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
  logAudit({
    actor: "Housekeeping",
    role: "Housekeeping",
    module: "housekeeping",
    action: "Issue flagged",
    entity: `Room ${task.roomId} — ${description}`,
    severity: severity === "critical" || severity === "high" ? "warn" : "info",
  });
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
  logAudit({
    actor: "Front Desk",
    role: "Front Desk",
    module: "housekeeping",
    action: "DND set",
    entity: `Room ${roomId} — ${reason}`,
    severity: "info",
  });
  emit();
}

export function clearDND(roomId: string) {
  state.dndRecords = state.dndRecords.map((r) =>
    r.roomId === roomId && !r.endTime ? { ...r, endTime: new Date().toISOString() } : r,
  );
  emit();
}

let cachedDndRecords: DNDRecord[] = [];
let cachedActiveDND: DNDRecord[] = [];
export function getActiveDND(): DNDRecord[] {
  if (state.dndRecords !== cachedDndRecords) {
    cachedDndRecords = state.dndRecords;
    cachedActiveDND = state.dndRecords.filter((r) => !r.endTime);
  }
  return cachedActiveDND;
}

export function upsertRoom(room: Room) {
  const exists = state.rooms.some((r) => r.id === room.id);
  state.rooms = exists
    ? state.rooms.map((r) => (r.id === room.id ? room : r))
    : [...state.rooms, room];
  logAudit({
    actor: "Admin",
    role: "System Administrator",
    module: "settings",
    action: exists ? "Updated room" : "Added room",
    entity: `Room ${room.id}`,
    severity: "info",
  });
  emit();
}
export function deleteRoom(roomId: string) {
  state.rooms = state.rooms.filter((r) => r.id !== roomId);
  logAudit({
    actor: "Admin",
    role: "System Administrator",
    module: "settings",
    action: "Deleted room",
    entity: `Room ${roomId}`,
    severity: "warn",
  });
  emit();
}

export function upsertRoomType(t: RoomType) {
  const exists = state.roomTypes.some((x) => x.id === t.id);
  state.roomTypes = exists
    ? state.roomTypes.map((x) => (x.id === t.id ? t : x))
    : [...state.roomTypes, t];
  emit();
}
export function deleteRoomType(id: string) {
  state.roomTypes = state.roomTypes.filter((x) => x.id !== id);
  emit();
}

/* ============================== Rate Plans ============================== */

export function upsertRatePlan(rp: RatePlan) {
  const exists = state.ratePlans.some((x) => x.id === rp.id);
  state.ratePlans = exists
    ? state.ratePlans.map((x) => (x.id === rp.id ? { ...rp, updatedAt: new Date().toISOString() } : x))
    : [...state.ratePlans, { ...rp, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
  emit();
}

export function deleteRatePlan(id: string) {
  state.ratePlans = state.ratePlans.filter((x) => x.id !== id);
  emit();
}

export function cancellationPolicyById(id: string | undefined | null) {
  return id ? state.cancellationPolicies.find((cp) => cp.id === id) : undefined;
}

/* ==================== Corporate Accounts ==================== */

export function upsertCorporateAccount(input: CorporateAccount) {
  const exists = state.corporateAccounts.some((c) => c.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.corporateAccounts = state.corporateAccounts.map((c) =>
      c.id === input.id ? { ...c, ...input, updatedAt: now } : c,
    );
  } else {
    state.corporateAccounts = [{ ...input, createdAt: now, updatedAt: now }, ...state.corporateAccounts];
  }
  emit();
}

export function deleteCorporateAccount(id: string) {
  state.corporateAccounts = state.corporateAccounts.filter((c) => c.id !== id);
  emit();
}

export function corporateAccountById(id: string | undefined | null) {
  return id ? state.corporateAccounts.find((c) => c.id === id) : undefined;
}

export function updateCorpAccountBalance(id: string, delta: number) {
  state.corporateAccounts = state.corporateAccounts.map((c) =>
    c.id === id ? { ...c, outstandingBalance: c.outstandingBalance + delta, updatedAt: new Date().toISOString() } : c,
  );
  emit();
}

/* ==================== Travel Agent Accounts ==================== */

export function upsertTravelAgent(input: TravelAgentAccount) {
  const exists = state.travelAgentAccounts.some((a) => a.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.travelAgentAccounts = state.travelAgentAccounts.map((a) =>
      a.id === input.id ? { ...a, ...input, updatedAt: now } : a,
    );
  } else {
    state.travelAgentAccounts = [{ ...input, createdAt: now, updatedAt: now }, ...state.travelAgentAccounts];
  }
  emit();
}

export function deleteTravelAgent(id: string) {
  state.travelAgentAccounts = state.travelAgentAccounts.filter((a) => a.id !== id);
  emit();
}

export function travelAgentById(id: string | undefined | null) {
  return id ? state.travelAgentAccounts.find((a) => a.id === id) : undefined;
}

/* ==================== Group Blocks ==================== */

export function upsertGroupBlock(input: GroupBlock) {
  const exists = state.groupBlocks.some((g) => g.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.groupBlocks = state.groupBlocks.map((g) =>
      g.id === input.id ? { ...g, ...input, updatedAt: now } : g,
    );
  } else {
    state.groupBlocks = [{ ...input, createdAt: now, updatedAt: now }, ...state.groupBlocks];
  }
  emit();
}

export function deleteGroupBlock(id: string) {
  state.groupBlocks = state.groupBlocks.filter((g) => g.id !== id);
  emit();
}

export function groupBlockById(id: string | undefined | null) {
  return id ? state.groupBlocks.find((g) => g.id === id) : undefined;
}

/* ============================== Users ============================== */

export function upsertUser(u: User) {
  const exists = state.users.some((x) => x.id === u.id);
  state.users = exists ? state.users.map((x) => (x.id === u.id ? u : x)) : [...state.users, u];
  logAudit({
    actor: "Admin",
    role: "System Administrator",
    module: "identity",
    action: exists ? "Updated user" : "Created user",
    entity: `${u.email}`,
    severity: exists ? "info" : "warn",
  });
  emit();
}
export function toggleUserActive(id: string) {
  state.users = state.users.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u));
  emit();
}
export function assignUserRole(userId: string, roleId: string, assignedBy?: string) {
  const existing = state.userRoles.find(
    (ur) => ur.userId === userId && ur.roleId === roleId && !ur.revokedAt,
  );
  if (existing) return;
  const active = state.userRoles.find((ur) => ur.userId === userId && !ur.revokedAt);
  if (active) {
    state.userRoles = state.userRoles.map((ur) =>
      ur.id === active.id ? { ...ur, revokedAt: new Date().toISOString() } : ur,
    );
  }
  const ur: UserRole = {
    id: "UR" + Date.now().toString(36),
    userId,
    roleId,
    assignedBy,
    assignedAt: new Date().toISOString(),
  };
  state.userRoles = [...state.userRoles, ur];
  emit();
}

export function getUserRoleNames(userId: string): string[] {
  const activeRoleIds = state.userRoles
    .filter((ur) => ur.userId === userId && !ur.revokedAt)
    .map((ur) => ur.roleId);
  return state.roles
    .filter((r) => activeRoleIds.includes(r.id))
    .map((r) => r.roleName);
}

export function getUserPrimaryRole(userId: string): string {
  return getUserRoleNames(userId)[0] ?? "—";
}

/* ============================== Tenant ============================== */

export function updateTenant(patch: Partial<Property>) {
  state.tenant = { ...state.tenant, ...patch };
  logAudit({
    actor: "Admin",
    role: "System Administrator",
    module: "settings",
    action: "Updated tenant configuration",
    entity: state.tenant.name,
    severity: "warn",
  });
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
  return state.charges.filter((c) => c.date === dateISO).reduce((s, c) => s + c.amount, 0);
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
export function ratePlanById(id: string) {
  return state.ratePlans.find((rp) => rp.id === id);
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
