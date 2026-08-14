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

import { useSyncExternalStore, useRef, useCallback } from "react";
import type { Role } from "@/lib/role";

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

export type HousekeepingStatus = "clean" | "dirty" | "in_progress" | "inspected" | "out_of_order";
export type BedConfiguration = "single" | "double" | "twin" | "king" | "queen" | "unknown";
export type ViewType = "garden" | "pool" | "city" | "lake" | "mountain" | "sea" | "none" | "other";

export type Room = {
  id: string;
  propertyId: string;
  roomTypeId: string;
  roomNumber: string;
  roomName?: string;
  floor: number;
  building?: string;
  bedConfiguration?: BedConfiguration;
  maxOccupancy: number;
  baseOccupancy: number;
  viewType?: ViewType;
  defaultRatePlanId?: string;
  extraPersonCharge?: number;
  amenities?: string[];
  smokingAllowed: boolean;
  accessibilityFeatures?: string[];
  roomPhotos?: string[];
  status: RoomStatus;
  housekeepingStatus?: HousekeepingStatus;
  isActive: boolean;
  blockStatus?: boolean;
  notes?: string;
  legacyRef?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedTo?: string | null;
};

export type ReservationStatus = "open" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";

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
  seasonalPricing?: SeasonalPricing[];
  vatTreatment: VatTreatment;
  depositRequiredPct: number;
  minLengthOfStay: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SeasonalPricing = {
  id: string;
  ratePlanId: string;
  label: string;
  from: string;
  to: string;
  multiplier: number;
  override?: number;
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
  totalPax?: number;
  groupRate: number;
  cutoffDate?: string;
  billingArrangement: BillingArrangement;
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
  checkOutTime?: string;
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
  nationality?: string;
  idType?: string;
  idNumber?: string;
  clientType?: string;
  vipOverride?: boolean;
  taxOverride?: string;
  serviceChargeOverride?: string;
  guests?: { name: string; checkIn?: string; checkOut?: string }[];
};

export type FolioChargeType = "room" | "fnb" | "tax" | "misc" | "discount";
export type FolioChargeSource = "room_auto" | "pos_charge" | "minibar_auto" | "service_request" | "manual" | "adjustment";
export type FolioChargeStatus = "posted" | "disputed" | "voided" | "adjusted";
export type FolioCharge = {
  id: string;
  propertyId?: string;
  folioId: string;
  chargeDate?: string; // YYYY-MM-DD
  date: string; // convenience — YYYY-MM-DD
  chargeSource?: FolioChargeSource;
  status?: FolioChargeStatus;
  type: FolioChargeType;
  description: string;
  quantity?: number;
  unitAmount?: number;
  grossAmount?: number;
  vatAmount?: number;
  netAmount?: number;
  amount: number; // convenience — UGX (positive)
  vatTreatment?: VatTreatment;
  voided?: boolean; // convenience — derived from status
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidAuthorisedBy?: string;
  postedBy?: string;
  postedAt?: string;
  adjustedFromChargeId?: string;
  sourceRefId?: number;
  sourceRefType?: string;
  createdAt?: string;
};

export type PaymentMethod = "cash" | "card" | "mtn_momo" | "airtel_money" | "bank_transfer" | "charge_to_room";
export const ALL_PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "mtn_momo", "airtel_money", "bank_transfer", "charge_to_room"];

export const MEAL_PLAN_IDS = ["RO", "BB", "HB", "FB"] as const;
export type MealPlanId = (typeof MEAL_PLAN_IDS)[number];

export const MEAL_PLAN_LABELS: Record<MealPlanId, string> = {
  RO: "Room Only",
  BB: "Bed & Breakfast",
  HB: "Half Board",
  FB: "Full Board",
};

export const MEAL_PLAN_DESCRIPTIONS: Record<MealPlanId, string> = {
  RO: "Accommodation only",
  BB: "Breakfast buffet included",
  HB: "Breakfast + dinner",
  FB: "All three meals",
};

export const CURRENCY_OPTIONS = [
  { code: "UGX", label: "UGX (Shilling)", symbol: "USh" },
  { code: "KES", label: "KES (Shilling)", symbol: "KSh" },
  { code: "USD", label: "USD (Dollar)", symbol: "$" },
  { code: "EUR", label: "EUR (Euro)", symbol: "€" },
  { code: "GBP", label: "GBP (Pound)", symbol: "£" },
  { code: "TZS", label: "TZS (Shilling)", symbol: "TSh" },
  { code: "RWF", label: "RWF (Franc)", symbol: "FRw" },
] as const;

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

export type ApprovalActionType =
  | "void_charge"
  | "complimentary"
  | "transfer_charge"
  | "transfer_folio"
  | "split_folio"
  | "discount"
  | "refund"
  | "void_checkin";

export type ApprovalRequest = {
  id: string;
  action: ApprovalActionType;
  folioId: string;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  requestedByRole: string;
  requestedAt: string;
  approvedBy?: string;
  approvedByRole?: string;
  approvedAt?: string;
  rejectionReason?: string;
};

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

export type CheckInEvent = {
  id: string;
  propertyId: string;
  reservationId: string;
  roomAssignmentId: string;
  agentId: string;
  actualCheckinTime: string;
  idTypeVerified: string;
  idNumberVerified: string;
  idVerifiedAt: string;
  managerOverride: boolean;
  overrideReason?: string;
  overrideBy?: string;
  createdAt: string;
};

export type KeyCard = {
  id: string;
  propertyId: string;
  reservationId: string;
  roomId: string;
  cardReference: string;
  cardType: "physical" | "rfid";
  issueNumber: number;
  issuedAt: string;
  issuedBy: string;
  expiresAt: string;
  deactivatedAt?: string;
  deactivationReason?: "checkout" | "loss_report" | "room_change" | "late_checkout_extension";
  deactivatedBy?: string;
  createdAt: string;
};

export type ServiceRequestType = "housekeeping" | "maintenance" | "fb_delivery" | "complaint" | "other";
export type ServiceRequestUrgency = "normal" | "urgent";
export type ServiceRequestStatus = "open" | "in_progress" | "completed" | "escalated";

export type ServiceRequest = {
  id: string;
  propertyId: string;
  reservationId: string;
  roomId: string;
  requestType: ServiceRequestType;
  description: string;
  urgency: ServiceRequestUrgency;
  status: ServiceRequestStatus;
  requestedAt: string;
  requestedBy?: string;
  assignedToDepartment?: string;
  slaDeadline?: string;
  slaBreached: boolean;
  fulfilledAt?: string;
  fulfilledBy?: string;
  isChargeable: boolean;
  chargeAmount?: number;
  folioChargeId?: string;
  createdAt: string;
  updatedAt: string;
};

export type LostFoundItemStatus = "found" | "returned" | "disposed";

export type LostFoundItem = {
  id: string;
  propertyId: string;
  description: string;
  category: string;
  locationFound: string;
  foundDate: string;
  foundBy: string;
  status: LostFoundItemStatus;
  storageLocation?: string;
  guestName?: string;
  reservationId?: string;
  returnedAt?: string;
  returnedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageDeliveryMethod = "phone" | "in_person" | "email" | "note_under_door";
export type MessageStatus = "pending" | "delivered" | "acknowledged";

export type Message = {
  id: string;
  propertyId: string;
  reservationId: string;
  roomId: string;
  guestName: string;
  callerName: string;
  callerPhone?: string;
  messageText: string;
  takenBy: string;
  deliveryMethod: MessageDeliveryMethod;
  status: MessageStatus;
  deliveredAt?: string;
  deliveredBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type WakeUpCallStatus = "scheduled" | "completed" | "cancelled";

export type WakeUpCall = {
  id: string;
  propertyId: string;
  reservationId: string;
  roomId: string;
  guestName: string;
  scheduledTime: string;
  status: WakeUpCallStatus;
  requestedBy: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceStatus = "draft" | "issued" | "paid" | "overdue" | "cancelled";
export type EFRISStatus = "pending" | "submitted" | "failed" | "confirmed";
export type Invoice = {
  id: string;
  propertyId?: string;
  invoiceNo: string;
  folioId: string;
  reservationId: string;
  cityLedgerEntryId?: string;
  agentLedgerEntryId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  companyName?: string;
  companyTin?: string;
  companyAddress?: string;
  issuedAt: string;
  issuedBy?: string;
  dueDate?: string;
  status: InvoiceStatus;
  eFRISStatus: EFRISStatus;
  eFRISFiscalNo?: string;
  eFRISQRCode?: string;
  eFRISSubmittedAt?: string;
  totalTaxable: number;
  totalVat: number;
  totalAmount: number;
  amountDue?: number;
  paidAmount: number;
  amountPaid?: number;
  outstandingAmount: number;
  overdueAlertedAt?: string;
  isProforma: boolean;
  isCreditNote: boolean;
  creditNoteFor?: string;
  creditNoteReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AgentLedgerEntryStatus = InvoiceStatus;
export type AgentLedgerEntry = {
  id: string;
  propertyId?: string;
  folioId: string;
  travelAgentAccountId: string;
  reservationId: string;
  guestName: string;
  stayFrom: string;
  stayTo: string;
  voucherNumber?: string;
  grossAmount: number;
  commissionRatePct: number;
  commissionAmount: number;
  netAmount: number;
  vatTreatment?: VatTreatment;
  status: AgentLedgerEntryStatus;
  transferredAt?: string;
  transferredBy?: string;
  paidAt?: string;
  paidAmount?: number;
  paymentReference?: string;
  invoiceId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ReconciliationReport = {
  id: string;
  propertyId?: string;
  reportDate: string;
  totalRevenue: number;
  totalVat: number;
  totalCash: number;
  totalMtnMomo: number;
  totalAirtelMoney: number;
  totalCard: number;
  totalCityLedgerTransferred: number;
  totalAgentLedgerTransferred: number;
  totalAdjustments: number;
  efrisSubmittedCount: number;
  efrisPendingCount: number;
  discrepancyAmount: number;
  discrepancyNotes?: string;
  signedOffBy?: string;
  signedOffAt?: string;
  isLocked: boolean;
  generatedAt: string;
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

export type FolioStatus = "open" | "post_stay" | "settled" | "transferred_to_ledger" | "transferred_to_agent" | "void";
export type Folio = {
  id: string;
  propertyId?: string;
  reservationId: string;
  guestProfileId?: string;
  corporateAccountId?: string;
  travelAgentAccountId?: string;
  billingArrangement?: BillingArrangement;
  vatTreatment?: VatTreatment;
  status: FolioStatus;
  depositAmount?: number;
  totalCharges?: number;
  totalVat?: number;
  totalPaid?: number;
  balanceDue?: number;
  openedAt: string;
  openedBy?: string;
  settledAt?: string;
  closedAt?: string; // convenience — alias for settledAt
  settledBy?: string;
  sourceSystemRef?: string;
  notes?: string; // kept for backward compat
  createdAt?: string;
  updatedAt?: string;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  nationalId?: string;
  passwordHash?: string;
  passwordResetRequired?: boolean;
  isActive: boolean;
  department?: string;
  jobTitle?: string;
  employeeId?: string;
  dateOfJoining?: string;
  employmentStatus?: string;
  employmentEndDate?: string;
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
  permissions: string[];
  customPermissions?: { key: string; label: string }[];
  createdAt: string;
  updatedAt?: string;
};

export const ROLE_PERMISSIONS_LIST = [
  { key: "dashboard.view", label: "View Dashboard", group: "Dashboard" },
  { key: "reservations.view", label: "View Reservations", group: "Reservations" },
  { key: "reservations.create", label: "Create Reservations", group: "Reservations" },
  { key: "reservations.edit", label: "Edit Reservations", group: "Reservations" },
  { key: "reservations.cancel", label: "Cancel Reservations", group: "Reservations" },
  { key: "checkin.perform", label: "Check In Guests", group: "Front Desk" },
  { key: "checkout.perform", label: "Check Out Guests", group: "Front Desk" },
  { key: "checkin.modify", label: "Modify Check-in Details", group: "Front Desk" },
  { key: "rooms.view", label: "View Rooms", group: "Rooms" },
  { key: "rooms.edit", label: "Edit Rooms", group: "Rooms" },
  { key: "rooms.status", label: "Change Room Status", group: "Rooms" },
  { key: "guests.view", label: "View Guest Profiles", group: "Guests" },
  { key: "guests.edit", label: "Edit Guest Profiles", group: "Guests" },
  { key: "groups.view", label: "View Groups & Blocks", group: "Groups" },
  { key: "groups.create", label: "Create Groups & Blocks", group: "Groups" },
  { key: "groups.edit", label: "Edit Groups & Blocks", group: "Groups" },
  { key: "billing.view", label: "View Folio / Billing", group: "Billing" },
  { key: "billing.charge", label: "Post Charges", group: "Billing" },
  { key: "billing.payment", label: "Record Payments", group: "Billing" },
  { key: "billing.refund", label: "Process Refunds", group: "Billing" },
  { key: "billing.settle", label: "Settle Folios", group: "Billing" },
  { key: "billing.transfer", label: "Transfer / Split Folios", group: "Billing" },
  { key: "billing.discount", label: "Apply Discounts", group: "Billing" },
  { key: "invoices.view", label: "View Invoices", group: "Invoices" },
  { key: "invoices.manage", label: "Manage Invoices", group: "Invoices" },
  { key: "pos.view", label: "View POS", group: "POS" },
  { key: "pos.order", label: "Create POS Orders", group: "POS" },
  { key: "pos.refund", label: "Process POS Refunds", group: "POS" },
  { key: "housekeeping.view", label: "View Housekeeping", group: "Housekeeping" },
  { key: "housekeeping.assign", label: "Assign Tasks", group: "Housekeeping" },
  { key: "housekeeping.complete", label: "Complete Tasks", group: "Housekeeping" },
  { key: "reports.view", label: "View Reports", group: "Reports" },
  { key: "reports.export", label: "Export Reports", group: "Reports" },
  { key: "accounting.view", label: "View Accounting", group: "Accounting" },
  { key: "accounting.manage", label: "Manage Accounting", group: "Accounting" },
  { key: "rates.view", label: "View Rates & Availability", group: "Rates" },
  { key: "rates.edit", label: "Edit Rates & Availability", group: "Rates" },
  { key: "audit.view", label: "View Audit Trail", group: "Audit" },
  { key: "identity.view", label: "View Users & Roles", group: "Identity & Access" },
  { key: "identity.manage", label: "Manage Users & Roles", group: "Identity & Access" },
  { key: "settings.view", label: "View Settings", group: "Settings" },
  { key: "settings.edit", label: "Edit Settings", group: "Settings" },
  { key: "inventory.view", label: "View Inventory", group: "Inventory" },
  { key: "inventory.edit", label: "Manage Inventory", group: "Inventory" },
  { key: "inventory.purchase", label: "Manage Purchase Orders", group: "Inventory" },
  { key: "inventory.requisition", label: "Manage Requisitions", group: "Inventory" },
  { key: "hr.view", label: "View HR", group: "HR" },
  { key: "hr.edit", label: "Manage HR", group: "HR" },
  { key: "guestservices.view", label: "View Guest Services", group: "Guest Services" },
  { key: "guestservices.manage", label: "Manage Guest Services", group: "Guest Services" },
  { key: "maintenance.view", label: "View Maintenance", group: "Maintenance" },
  { key: "maintenance.manage", label: "Manage Maintenance", group: "Maintenance" },
  { key: "notifications.view", label: "View Notifications", group: "Notifications" },
] as const;

export const ROLE_PERMISSION_GROUPS = [
  ...new Set(ROLE_PERMISSIONS_LIST.map((p) => p.group)),
] as string[];

export function permissionsForRole(roleName: string): string[] {
  return ROLES_DATA.find((r) => r.roleName === roleName)?.permissions ?? [];
}

const ROLE_PERMISSION_DEFAULTS: Record<string, string[]> = {
  "Owner / GM": ROLE_PERMISSIONS_LIST.map((p) => p.key),
  "Front Desk": [
    "dashboard.view",
    "reservations.view", "reservations.create", "reservations.edit",
    "checkin.perform", "checkout.perform", "checkin.modify",
    "rooms.view", "rooms.status",
    "guests.view", "guests.edit",
    "groups.view",
    "billing.view", "billing.payment",
    "invoices.view",
    "pos.view",
    "guestservices.view", "guestservices.manage",
    "notifications.view",
  ],
  Housekeeping: [
    "dashboard.view",
    "rooms.view", "rooms.status",
    "housekeeping.view", "housekeeping.assign", "housekeeping.complete",
    "maintenance.view", "maintenance.manage",
    "notifications.view",
  ],
  "POS / Cashier": [
    "dashboard.view",
    "billing.view", "billing.payment",
    "invoices.view",
    "pos.view", "pos.order",
    "guests.view",
    "notifications.view",
  ],
  Accountant: [
    "dashboard.view",
    "billing.view", "billing.charge", "billing.payment", "billing.refund", "billing.settle",
    "invoices.view", "invoices.manage",
    "accounting.view", "accounting.manage",
    "reports.view", "reports.export",
    "audit.view",
    "notifications.view",
  ],
  "System Administrator": ROLE_PERMISSIONS_LIST.map((p) => p.key),
  "Night Auditor": [
    "dashboard.view",
    "reservations.view",
    "billing.view", "billing.settle",
    "invoices.view",
    "reports.view", "reports.export",
    "audit.view",
    "rooms.view",
    "notifications.view",
  ],
  Maintenance: [
    "dashboard.view",
    "rooms.view", "rooms.status",
    "housekeeping.view",
    "maintenance.view", "maintenance.manage",
    "notifications.view",
  ],
  "Sales & Marketing": [
    "dashboard.view",
    "reservations.view",
    "groups.view",
    "rates.view",
    "guests.view",
    "reports.view", "reports.export",
    "notifications.view",
  ],
  "Human Resources": [
    "dashboard.view",
    "hr.view", "hr.edit",
    "notifications.view",
  ],
  "Inventory Manager": [
    "dashboard.view",
    "inventory.view", "inventory.edit", "inventory.purchase", "inventory.requisition",
    "reports.view",
    "notifications.view",
  ],
  Laundry: [
    "dashboard.view",
    "housekeeping.view", "housekeeping.complete",
    "rooms.view",
    "notifications.view",
  ],
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
  propertyCode: string;
  name: string;
  propertyType: "hotel" | "lodge" | "guesthouse" | "resort" | "apartment" | "serviced_suites";
  starRating?: number;
  description?: string;
  logoUrl?: string;
  address?: string;
  streetAddress?: string;
  district?: string;
  gpsCoordinates?: string;
  city: string;
  country: string;
  phone?: string;
  phoneNumbers?: string[];
  email?: string;
  website?: string;
  businessName?: string;
  businessRegistrationNumber?: string;
  tradingLicenseNumber?: string;
  standardCheckinTime: string;
  standardCheckoutTime: string;
  defaultCurrency: string;
  timezone: string;
  lateCheckoutHalfCutoff: string;
  numberOfFloors?: number;
  totalRoomCount?: number;
  folioAdjAgentThreshold: number;
  folioAdjPmThreshold: number;
  requisitionApprovalThreshold: number;
  creditGracePeriodDays: number;
  auditTime: string;
  tin?: string;
  efrisDeviceNo?: string;
  vatRate?: number;
  isActive: boolean;
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

export type HkTaskType = "turnover" | "deep_clean" | "room_service" | "linen_change" | "inspection" | "cleaning";
export type HkPriority = "standard" | "high" | "vip";
export type HkTaskStatus = "queued" | "pending" | "in_progress" | "clean" | "flagged" | "inspected";
export type HousekeepingTask = {
  id: string;
  propertyId?: string;
  roomId: string;
  type: HkTaskType;
  priority: HkPriority;
  status: HkTaskStatus;
  assignedTo: string | null;
  assignedBy?: string;
  due: string;
  expectedCompletionTime?: string;
  startedAt?: string;
  notes: string;
  createdAt: string;
  completedAt?: string;
  taskDescription?: string;
  employeeId?: string;
  date?: string;
  shiftDate?: string;
  dndFlaggedAt?: string;
  welfareCheckTriggered?: boolean;
  cloudStatus?: number;
  remotePosting?: string;
  updatedAt?: string;
};

export type InspectionResult = "pass" | "fail";
export type RoomInspection = {
  id: string;
  propertyId: string;
  housekeepingTaskId: string;
  roomId: string;
  inspectorId: string;
  result: InspectionResult;
  defectNotes?: string;
  inspectedAt: string;
  createdAt: string;
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

export type MinibarItem = {
  id: string;
  propertyId: string;
  roomTypeId?: string; // undefined = applies to all room types
  stockItemId?: string; // forward ref — Inventory domain (stock_items) not yet ported
  name: string; // denormalized display name, same convenience pattern as MenuItem.name
  parQuantity: number;
  unitSellingPrice: number;
  vatTreatment: VatTreatment;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MinibarLog = {
  id: string;
  propertyId: string;
  roomId: string;
  reservationId?: string;
  housekeepingTaskId?: string;
  minibarItemId: string;
  consumedQuantity: number;
  restockedQuantity: number;
  loggedBy: string;
  loggedAt: string;
  folioChargeId?: string;
  supervisorReviewRequired: boolean; // consumption > 150% of par — BR-HK-05
  supervisorReviewedBy?: string;
  supervisorReviewedAt?: string;
  createdAt?: string;
};

/* ==================== Domain 6 — Reporting ==================== */

export type ReportAccessLog = {
  id: string;
  propertyId?: string;
  userId: string;
  reportType: string;
  parameters?: Record<string, unknown>;
  exported?: boolean;
  exportFormat?: string;
  exportRef?: string;
  accessedAt: string;
};

export type ScheduledReportConfig = {
  id: string;
  propertyId?: string;
  reportType: string;
  scheduleCron: string;
  parameters?: Record<string, unknown>;
  recipientEmails: string[];
  isActive: boolean;
  lastRunAt?: string;
  lastRunStatus?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

/* ==================== Domain 7 — POS ==================== */

export type PosOutlet = {
  id: string;
  propertyId?: string;
  name: string;
  departmentCode?: string;
  inventoryEnabled?: boolean;
  serviceChargePct: number;
  isActive: boolean;
  legacyRef?: string;
  createdAt?: string;
};

export type MenuCategory = {
  id: string;
  posOutletId: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
};

export type MenuItem = {
  id: string;
  posOutletId: string;
  menuCategoryId: string;
  stockItemId?: string;
  name: string;
  description?: string;
  unitPrice: number;
  vatTreatment: VatTreatment;
  availabilityPeriods?: string[];
  isActive: boolean;
  isSoldOut?: boolean;
  legacyRef?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MenuModifierOption = {
  name: string;
  priceDelta: number;
};

export type MenuModifier = {
  id: string;
  menuItemId: string;
  name: string;
  options: MenuModifierOption[];
  isRequired: boolean;
  createdAt?: string;
};

/**
 * Recipe/BOM — one line per raw ingredient consumed for a single dish.
 * `quantity` is the ingredient amount (in the ingredient's unit) needed for
 * one unit of the menu item. When the dish is sold the line drives an
 * automatic `pos_sale` deduction from the Kitchen Store (inventory.domain).
 */
export type MenuItemRecipeLine = {
  id: string;
  menuItemId: string;
  stockItemId: string;
  quantity: number;
  createdAt?: string;
};

/**
 * Recorded at POS settlement for every menu item that has a recipe — the
 * ledger the food-cost report reads from (revenue + theoretical ingredient cost).
 */
export type MenuItemSale = {
  id: string;
  posTabId: string;
  posOutletId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  revenue: number;
  ingredientCost: number;
  settledAt: string;
};

export type PosTable = {
  id: string;
  posOutletId: string;
  tableName: string;
  seatingCapacity: number;
  isActive: boolean;
  reservedUntil?: string;
  reservationId?: string;
  legacyRef?: string;
  createdAt?: string;
};

export type PosTabStatus = "open" | "settled" | "room_charged" | "unrecovered" | "cancelled" | "merged";
export type PosSettlementMethod = "direct_payment" | "room_charge";
export type OrderType = "dine_in" | "takeaway" | "room_service" | "delivery";

export type PosTab = {
  id: string;
  propertyId?: string;
  posOutletId: string;
  posTableId?: string;
  orderType: OrderType;
  reservationId?: string;
  guestProfileId?: string;
  deliveryName?: string;
  deliveryAddress?: string;
  openedBy?: string;
  coverCount: number;
  status: PosTabStatus;
  subtotal: number;
  vatAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  openedAt: string;
  settledAt?: string;
  settledBy?: string;
  settlementMethod?: PosSettlementMethod;
  paymentMethod?: PaymentMethod;
  discount?: number;
  discountPct?: number;
  discountReason?: string;
  discountApprovedBy?: string;
  roomChargeFolioId?: string;
  roomChargeSignedAt?: string;
  roomChargeSignedBy?: string;
  roomChargeAuthRef?: string;
  efrisReceiptId?: string;
  unrecoveredReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PosTabItem = {
  id: string;
  posTabId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  modifierSelections?: Record<string, string>;
  specialNotes?: string;
  seatNumber?: number;
  courseNumber: number;
  sentToKot: boolean;
  isComplimentary: boolean;
  compAuthorisedBy?: string;
  compReason?: string;
  isVoided: boolean;
  voidedBy?: string;
  voidReason?: string;
  voidApprovedBy?: string;
  voidAfterAck: boolean;
  addedBy?: string;
  addedAt: string;
  createdAt?: string;
};

export const KOT_STATIONS = ["kitchen", "bar"] as const;
export type KotStation = (typeof KOT_STATIONS)[number];
export const STATION_LABELS: Record<KotStation, string> = { kitchen: "Kitchen", bar: "Bar" };
export const POS_VOID_APPROVAL_THRESHOLD = 25_000;

export function posVoidNeedsApproval(item: PosTabItem): boolean {
  return item.sentToKot || item.unitPrice * item.quantity >= POS_VOID_APPROVAL_THRESHOLD;
}

export type Kot = {
  id: string;
  posTabId: string;
  posOutletId: string;
  stationType: KotStation;
  status: string;
  waiterId?: string;
  createdAt: string;
  acknowledgedAt?: string;
  allReadyAt?: string;
  takenAt?: string;
  printCount?: number;
  lastPrintedAt?: string;
  voidedAt?: string;
  voidReason?: string;
};

export type KotItemStatus = "pending" | "in_preparation" | "ready" | "voided";
export type KotItem = {
  id: string;
  kotId: string;
  posTabItemId: string;
  menuItemId: string;
  quantity: number;
  modifierSelections?: Record<string, string>;
  specialNotes?: string;
  status: KotItemStatus;
  courseNumber?: number;
  inPreparationAt?: string;
  readyAt?: string;
  preparationSeconds?: number;
  voidedAt?: string;
  voidReason?: string;
  createdAt?: string;
};

export type PosServicePeriod = {
  id: string;
  propertyId?: string;
  posOutletId: string;
  periodName: string;
  periodDate: string;
  openedAt: string;
  closedAt?: string;
  closedBy?: string;
  status: string;
  openedBy?: string;
  openingFloat?: number;
  countedCash?: number;
  expectedCash?: number;
  closedVariance?: number;
  totalCovers: number;
  totalOrders: number;
  totalFoodRevenue: number;
  totalBeverageRevenue: number;
  totalVat: number;
  totalServiceCharge: number;
  totalDirectPayments: number;
  totalRoomCharges: number;
  totalComps: number;
  totalUnrecovered: number;
  cashReconciledAmount: number;
  cashVariance: number;
  createdAt?: string;
};

export type MiscChargeItem = {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  departmentCode?: string; // POOL | KPOOL | REC | BIZ | CONF | HC | SPA | REST | BAR | MISC
  isActive: boolean;
};

/* ==================== Domain 8 — Inventory ==================== */

export type StockCategory = {
  id: string;
  propertyId?: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
};

export type StorageLocation = {
  id: string;
  propertyId?: string;
  name: string;
  outletId?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
};

export type StockItem = {
  id: string;
  propertyId?: string;
  name: string;
  description?: string;
  unit: string;
  stockCategoryId?: string;
  storageLocationId?: string;
  location?: string;
  locationQuantities?: Record<string, number>;
  reorderLevel: number;
  currentQuantity: number;
  unitCost?: number;
  unitPrice?: number;
  sku?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type StockMovementType = "purchase_receipt" | "pos_sale" | "internal_use" | "wastage" | "breakage" | "theft" | "expiry" | "adjustment" | "return" | "transfer";

export type StockMovement = {
  id: string;
  propertyId?: string;
  stockItemId: string;
  type: StockMovementType;
  quantity: number; // positive = in, negative = out
  balanceBefore: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  posOutletId?: string;
  createdBy: string;
  createdAt: string;
};

export type Supplier = {
  id: string;
  propertyId?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PurchaseOrderStatus =
  | "draft"
  | "pending"
  | "approved"
  | "sent"
  | "partially_received"
  | "received"
  | "cancelled";

export type PurchaseOrder = {
  id: string;
  propertyId?: string;
  supplierId?: string;
  requisitionId?: string;
  orderNumber: string;
  status: PurchaseOrderStatus;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  sentVia?: string;
  receivedAt?: string;
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PurchaseOrderItem = {
  id: string;
  purchaseOrderId: string;
  stockItemId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  lineTotal: number;
};

export type GoodsReceipt = {
  id: string;
  propertyId?: string;
  poId: string;
  receivedBy: string;
  receivedAt: string;
  notes?: string;
  createdAt?: string;
};

export type GoodsReceiptItem = {
  id: string;
  goodsReceiptId: string;
  stockItemId: string;
  quantityReceived: number;
  unitCost: number;
  lineTotal: number;
};

export type SupplierInvoiceStatus = "unmatched" | "matched" | "paid" | "cancelled";

export type SupplierInvoice = {
  id: string;
  propertyId?: string;
  supplierId: string;
  poId: string;
  invoiceNo: string;
  invoiceDate: string;
  amount: number;
  taxAmount?: number;
  status: SupplierInvoiceStatus;
  paidAmount?: number;
  notes?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SupplierInvoiceLine = {
  id: string;
  supplierInvoiceId: string;
  stockItemId: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
};

export type SupplierPaymentMethod = "cash" | "bank_transfer" | "mtn_momo" | "airtel_money" | "card";

export type SupplierPayment = {
  id: string;
  propertyId?: string;
  supplierInvoiceId: string;
  supplierId: string;
  amount: number;
  method: SupplierPaymentMethod;
  reference?: string;
  paidBy: string;
  paidAt: string;
  createdAt?: string;
};

export type RequisitionStatus = "pending" | "approved" | "fulfilled" | "cancelled";

export type Requisition = {
  id: string;
  propertyId?: string;
  departmentCode?: string;
  posOutletId?: string;
  requestedBy: string;
  status: RequisitionStatus;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  issuedBy?: string;
  fulfilledAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RequisitionItem = {
  id: string;
  requisitionId: string;
  stockItemId: string;
  quantityRequested: number;
  quantityApproved?: number;
  quantityIssued?: number;
  notes?: string;
};

export type StockTransferStatus = "pending" | "completed" | "cancelled";

export type StockTransfer = {
  id: string;
  propertyId?: string;
  fromStorageLocationId: string;
  toStorageLocationId: string;
  status: StockTransferStatus;
  notes?: string;
  createdBy: string;
  completedBy?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type StockTransferItem = {
  id: string;
  transferId: string;
  stockItemId: string;
  quantity: number;
  quantityReceived?: number;
};

export type StockAdjustmentType = "wastage" | "breakage" | "theft" | "expiry" | "adjustment";
export type StockAdjustmentStatus = "pending" | "approved" | "rejected";

export type StockAdjustment = {
  id: string;
  propertyId?: string;
  type: StockAdjustmentType;
  reasonCode?: string;
  storageLocationId?: string;
  notes?: string;
  status: StockAdjustmentStatus;
  createdBy: string;
  createdByRole?: string;
  approvedBy?: string;
  approvedByRole?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type StockAdjustmentItem = {
  id: string;
  adjustmentId: string;
  stockItemId: string;
  quantity: number;
};

export type StocktakeStatus = "draft" | "finalized" | "reconciled" | "cancelled";

export type Stocktake = {
  id: string;
  propertyId?: string;
  name: string;
  storageLocationId: string;
  plannedDate?: string;
  notes?: string;
  status: StocktakeStatus;
  createdBy: string;
  createdByRole?: string;
  finalizedBy?: string;
  finalizedAt?: string;
  reconciledBy?: string;
  reconciledAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type StocktakeItem = {
  id: string;
  stocktakeId: string;
  stockItemId: string;
  systemQuantity: number;
  physicalQuantity?: number;
  unitCost?: number;
  variance?: number;
  valueVariance?: number;
};

export type StockParLevel = {
  id: string;
  propertyId?: string;
  stockItemId: string;
  storageLocationId: string;
  minLevel: number;
  maxLevel?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

type State = {
  tenant: Property;
  properties: Property[];
  currentPropertyId: string;
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
  roomAssignments: RoomAssignment[];
  deposits: Deposit[];
  checkInEvents: CheckInEvent[];
  keyCards: KeyCard[];
  serviceRequests: ServiceRequest[];
  messages: Message[];
  wakeUpCalls: WakeUpCall[];
  lostFoundItems: LostFoundItem[];
  audit: AuditEntry[];
  housekeepingTasks: HousekeepingTask[];
  roomInspections: RoomInspection[];
  maintenanceRequests: MaintenanceRequest[];
  dndRecords: DNDRecord[];
  minibarItems: MinibarItem[];
  minibarLogs: MinibarLog[];
  agentLedgerEntries: AgentLedgerEntry[];
  approvalRequests: ApprovalRequest[];
  reconciliationReports: ReconciliationReport[];
  reportAccessLogs: ReportAccessLog[];
  scheduledReportConfigs: ScheduledReportConfig[];
  posOutlets: PosOutlet[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  menuModifiers: MenuModifier[];
  menuItemRecipes: MenuItemRecipeLine[];
  menuItemSales: MenuItemSale[];
  posTables: PosTable[];
  posTabs: PosTab[];
  posTabItems: PosTabItem[];
  kots: Kot[];
  kotItems: KotItem[];
  posServicePeriods: PosServicePeriod[];
  notifications: AppNotification[];
  notifSettings: { email: boolean; sound: boolean; checkinReminders: boolean };
  lockoutSettings: { enabled: boolean; maxAttempts: number; lockoutMinutes: number };
  businessDate: string;
  auditStatus: "idle" | "front_desk" | "pos" | "calculating" | "completed";
  auditStartedAt?: string;
  auditCompletedAt?: string;
  paymentMethodConfig: { enabledMethods: PaymentMethod[] };
  currencyConfig: { code: string };
  mealPlanConfig: { prices: Record<string, number> };
  idTypeConfig: { types: string[] };
  roomTypeFilterConfig: { types: string[] };
  miscChargeItems: MiscChargeItem[];
  stockCategories: StockCategory[];
  storageLocations: StorageLocation[];
  stockItems: StockItem[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  purchaseOrderItems: PurchaseOrderItem[];
  requisitions: Requisition[];
  requisitionItems: RequisitionItem[];
  stockTransfers: StockTransfer[];
  stockTransferItems: StockTransferItem[];
  stockAdjustments: StockAdjustment[];
  stockAdjustmentItems: StockAdjustmentItem[];
  stocktakes: Stocktake[];
  stocktakeItems: StocktakeItem[];
  stockParLevels: StockParLevel[];
  goodsReceipts: GoodsReceipt[];
  goodsReceiptItems: GoodsReceiptItem[];
  supplierInvoices: SupplierInvoice[];
  supplierInvoiceLines: SupplierInvoiceLine[];
  supplierPayments: SupplierPayment[];
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
  { id: "dlxs", name: "Deluxe Single", description: "Deluxe room configured for single occupancy", maxOccupancy: 1, baseRate: 100_000 },
  { id: "dlxd", name: "Deluxe Double", description: "Deluxe room configured for double occupancy", maxOccupancy: 2, baseRate: 180_000 },
  { id: "huse", name: "House Use", description: "Room reserved for internal house use", maxOccupancy: 2, baseRate: 0 },
  { id: "comp", name: "Complementary", description: "Complimentary room for VIPs and special guests", maxOccupancy: 2, baseRate: 0 },
  { id: "ste", name: "Suite", description: "Luxury suite with separate living area and premium amenities", maxOccupancy: 4, baseRate: 850_000 },
];

const CANCELLATION_POLICIES: CancellationPolicy[] = [
  { id: "cp_flexible", name: "Flexible", freeCancelHoursBefore: 24, partialRefundPct: 0, partialRefundHoursBefore: 0, noShowChargePct: 100, createdAt: new Date().toISOString() },
  { id: "cp_moderate", name: "Moderate", freeCancelHoursBefore: 48, partialRefundPct: 50, partialRefundHoursBefore: 24, noShowChargePct: 100, createdAt: new Date().toISOString() },
  { id: "cp_strict", name: "Strict", freeCancelHoursBefore: 72, partialRefundPct: 0, partialRefundHoursBefore: 0, noShowChargePct: 100, createdAt: new Date().toISOString() },
  { id: "cp_nonrefundable", name: "Non-Refundable", freeCancelHoursBefore: 0, partialRefundPct: 0, partialRefundHoursBefore: 0, noShowChargePct: 100, createdAt: new Date().toISOString() },
];

const RATE_PLANS: RatePlan[] = [
  { id: "rp_rack", propertyId: "T001", roomTypeId: "std", cancellationPolicyId: "cp_flexible", name: "Rack Rate", nightlyRate: 220_000, seasonalPricing: [{ id: "sp_rack_xmas", ratePlanId: "rp_rack", label: "Christmas Peak", from: "2026-12-20", to: "2026-12-31", multiplier: 1.5 }], vatTreatment: "inclusive", depositRequiredPct: 0, minLengthOfStay: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rp_corporate", propertyId: "T001", roomTypeId: "dlx", cancellationPolicyId: "cp_moderate", name: "Corporate Rate", nightlyRate: 195_000, seasonalPricing: [], vatTreatment: "exclusive", depositRequiredPct: 0, minLengthOfStay: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rp_bb", propertyId: "T001", roomTypeId: "std", cancellationPolicyId: "cp_flexible", name: "Bed & Breakfast", nightlyRate: 265_000, seasonalPricing: [], vatTreatment: "inclusive", depositRequiredPct: 0, minLengthOfStay: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rp_weekend", propertyId: "T001", roomTypeId: "ste", cancellationPolicyId: "cp_strict", name: "Weekend Special", nightlyRate: 310_000, seasonalPricing: [{ id: "sp_weekend_newyr", ratePlanId: "rp_weekend", label: "New Year", from: "2026-12-30", to: "2027-01-02", multiplier: 1.8 }], vatTreatment: "inclusive", depositRequiredPct: 20, minLengthOfStay: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rp_nightly", propertyId: "T001", roomTypeId: "dlx", cancellationPolicyId: "cp_flexible", name: "Nightly Saver", nightlyRate: 175_000, seasonalPricing: [], vatTreatment: "not_applicable", depositRequiredPct: 50, minLengthOfStay: 1, isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rp_dlxs_rack", propertyId: "T001", roomTypeId: "dlxs", cancellationPolicyId: "cp_flexible", name: "Deluxe Single Rate", nightlyRate: 100_000, seasonalPricing: [], vatTreatment: "inclusive", depositRequiredPct: 0, minLengthOfStay: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rp_dlxd_rack", propertyId: "T001", roomTypeId: "dlxd", cancellationPolicyId: "cp_flexible", name: "Deluxe Double Rate", nightlyRate: 180_000, seasonalPricing: [], vatTreatment: "inclusive", depositRequiredPct: 0, minLengthOfStay: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
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
  { id: "GB001", propertyId: "T001", groupName: "Kampala Business Summit 2026", organiserName: "Sarah Mukasa", organiserEmail: "sarah@kbsummit.ug", startDate: "2026-07-15", endDate: "2026-07-18", totalRoomsBlocked: 10, groupRate: 180_000, cutoffDate: "2026-07-01", billingArrangement: "city_ledger", status: "confirmed", createdBy: "U001", approvedBy: "U002", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "GB002", propertyId: "T001", groupName: "Wedding Block — Nambi & Kato", organiserName: "Grace Nambi", organiserEmail: "grace.nambi@email.com", startDate: "2026-08-20", endDate: "2026-08-22", totalRoomsBlocked: 15, groupRate: 200_000, cutoffDate: "2026-08-10", billingArrangement: "pay_at_checkout", status: "active", createdBy: "U001", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "GB003", propertyId: "T001", groupName: "East African Tourism Expo", organiserName: "John Okello", organiserEmail: "john@eate.ug", startDate: "2026-09-05", endDate: "2026-09-08", totalRoomsBlocked: 20, groupRate: 165_000, cutoffDate: "2026-08-25", billingArrangement: "city_ledger", status: "active", createdBy: "U002", approvedBy: "U002", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "GB004", propertyId: "T001", groupName: "Closed — Staff Retreat", organiserName: "Admin", startDate: "2026-03-10", endDate: "2026-03-12", totalRoomsBlocked: 8, groupRate: 0, billingArrangement: "pay_at_checkout", status: "closed", createdBy: "U001", approvedBy: "U002", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "GB005", propertyId: "T001", groupName: "Cancelled Conference Q1", organiserName: "Peter Wasswa", startDate: "2026-01-20", endDate: "2026-01-22", totalRoomsBlocked: 5, groupRate: 190_000, billingArrangement: "pay_at_checkout", status: "cancelled", createdBy: "U001", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const ROOM_ASSIGNMENTS: RoomAssignment[] = [];

const MEAL_PLANS: MealPlan[] = ["ro", "bb", "hb", "fb", "ai"];
const DEPOSITS: Deposit[] = [];

const CHECK_IN_EVENTS: CheckInEvent[] = [];

const KEY_CARDS: KeyCard[] = [];

const SERVICE_REQUESTS: ServiceRequest[] = [];

const ROOM_INSPECTIONS: RoomInspection[] = [];

const MINIBAR_ITEMS: MinibarItem[] = [
  { id: "MB-1", propertyId: "JAMBO-UG-001", stockItemId: "SI001", name: "Coca-Cola 350ml", parQuantity: 4, unitSellingPrice: 8_000, vatTreatment: "inclusive", isActive: true },
  { id: "MB-2", propertyId: "JAMBO-UG-001", stockItemId: "SI004", name: "Still Water 500ml", parQuantity: 4, unitSellingPrice: 6_000, vatTreatment: "inclusive", isActive: true },
  { id: "MB-3", propertyId: "JAMBO-UG-001", stockItemId: "SI027", name: "Heineken 330ml", parQuantity: 3, unitSellingPrice: 15_000, vatTreatment: "inclusive", isActive: true },
  { id: "MB-4", propertyId: "JAMBO-UG-001", stockItemId: "SI028", name: "Nile Special 500ml", parQuantity: 3, unitSellingPrice: 12_000, vatTreatment: "inclusive", isActive: true },
  { id: "MB-5", propertyId: "JAMBO-UG-001", stockItemId: "SI030", name: "Assorted Nuts", parQuantity: 2, unitSellingPrice: 10_000, vatTreatment: "inclusive", isActive: true },
  { id: "MB-6", propertyId: "JAMBO-UG-001", roomTypeId: "ste", stockItemId: "SI029", name: "House Wine (Red) 187ml", parQuantity: 2, unitSellingPrice: 25_000, vatTreatment: "inclusive", isActive: true },
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
    [5, "dlxs"],
    [5, "dlxd"],
    [5, "huse"],
    [5, "comp"],
  ];
  layout.forEach(([floor, roomTypeId], idx) => {
    const num = `${floor}${String((idx % 4) + 1).padStart(2, "0")}`;
    const roomType = ROOM_TYPES.find((rt) => rt.id === roomTypeId);
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
      maxOccupancy: roomType?.maxOccupancy ?? 2,
      baseOccupancy: Math.max(1, Math.floor((roomType?.maxOccupancy ?? 2) / 2)),
      smokingAllowed: false,
      isActive: true,
      bedConfiguration: "unknown",
      amenities: [],
      accessibilityFeatures: [],
      roomPhotos: [],
      housekeepingStatus: "clean",
      viewType: "none",
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
        roomInspectionCounter,
        maintCounter,
        dndCounter,
        minibarItemCounter,
        minibarLogCounter,
        roomAssignmentCounter,
        depositCounter,
        checkInEventCounter,
        keyCardCounter,
        serviceRequestCounter,
        receiptCounter,
        invoiceCounter,
        agentLedgerEntryCounter,
        approvalRequestCounter,
        reconciliationReportCounter,
        creditNoteCounter,
        reportAccessLogCounter,
        scheduledReportConfigCounter,
        posOutletCounter,
        menuCategoryCounter,
        menuItemCounter,
        menuModifierCounter,
        menuItemRecipeLineCounter,
        menuItemSaleCounter,
        posTableCounter,
        posTabCounter,
        posTabItemCounter,
        kotCounter,
        kotItemCounter,
        posServicePeriodCounter,
        notifCounter,
        messageCounter,
        wakeUpCallCounter,
        lostFoundCounter,
        groupBlockCounter,
        stockCategoryCounter,
        stockItemCounter,
        stockMovementCounter,
        supplierCounter,
        purchaseOrderCounter,
        purchaseOrderItemCounter,
        requisitionCounter,
        requisitionItemCounter,
        stockTransferCounter,
        stockTransferItemCounter,
        stockAdjustmentCounter,
        stockAdjustmentItemCounter,
        stocktakeCounter,
        stocktakeItemCounter,
        stockParLevelCounter,
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
let guestCounter = savedCounters.guestCounter ?? 0;
const nextGuestId = () => {
  const v = `GUE-${String(++guestCounter).padStart(3, "0")}`;
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
let minibarItemCounter = savedCounters.minibarItemCounter ?? MINIBAR_ITEMS.length;
export const nextMinibarItemId = () => {
  const v = `MB-${++minibarItemCounter}`;
  saveCounters();
  return v;
};
let minibarLogCounter = savedCounters.minibarLogCounter ?? 0;
export const nextMinibarLogId = () => {
  const v = `MBL-${++minibarLogCounter}`;
  saveCounters();
  return v;
};
let roomAssignmentCounter = savedCounters.roomAssignmentCounter ?? 0;
const nextRoomAssignmentId = () => {
  const v = `RA-${++roomAssignmentCounter}`;
  saveCounters();
  return v;
};
let depositCounter = savedCounters.depositCounter ?? 0;
const nextDepositId = () => {
  const v = `DEP-${++depositCounter}`;
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
let agentLedgerEntryCounter = savedCounters.agentLedgerEntryCounter ?? 0;
const nextAgentLedgerId = () => {
  const v = `ALE-${++agentLedgerEntryCounter}`;
  saveCounters();
  return v;
};
let approvalRequestCounter = savedCounters.approvalRequestCounter ?? 0;
const nextApprovalRequestId = () => {
  const v = `APR-${++approvalRequestCounter}`;
  saveCounters();
  return v;
};
let reconciliationReportCounter = savedCounters.reconciliationReportCounter ?? 0;
const nextReconReportId = () => {
  const v = `RR-${++reconciliationReportCounter}`;
  saveCounters();
  return v;
};
let reportAccessLogCounter = savedCounters.reportAccessLogCounter ?? 0;
const nextReportAccessLogId = () => {
  const v = `RAL-${++reportAccessLogCounter}`;
  saveCounters();
  return v;
};
let scheduledReportConfigCounter = savedCounters.scheduledReportConfigCounter ?? 0;
const nextScheduledReportConfigId = () => {
  const v = `SRC-${++scheduledReportConfigCounter}`;
  saveCounters();
  return v;
};
let posOutletCounter = savedCounters.posOutletCounter ?? 3;
const nextPosOutletId = () => {
  const v = `PO${String(++posOutletCounter).padStart(3, "0")}`;
  saveCounters();
  return v;
};
let menuCategoryCounter = savedCounters.menuCategoryCounter ?? 5;
const nextMenuCategoryId = () => {
  const v = `MC${String(++menuCategoryCounter).padStart(3, "0")}`;
  saveCounters();
  return v;
};
let menuItemCounter = savedCounters.menuItemCounter ?? 5;
const nextMenuItemId = () => {
  const v = `MI${String(++menuItemCounter).padStart(3, "0")}`;
  saveCounters();
  return v;
};
let menuModifierCounter = savedCounters.menuModifierCounter ?? 2;
const nextMenuModifierId = () => {
  const v = `MM${String(++menuModifierCounter).padStart(3, "0")}`;
  saveCounters();
  return v;
};
let menuItemRecipeLineCounter = savedCounters.menuItemRecipeLineCounter ?? 20;
const nextMenuItemRecipeLineId = () => {
  const v = `MRL${String(++menuItemRecipeLineCounter).padStart(3, "0")}`;
  saveCounters();
  return v;
};
let menuItemSaleCounter = savedCounters.menuItemSaleCounter ?? 0;
const nextMenuItemSaleId = () => {
  const v = `MIS${++menuItemSaleCounter}`;
  saveCounters();
  return v;
};
let posTableCounter = savedCounters.posTableCounter ?? 5;
const nextPosTableId = () => {
  const v = `PT${String(++posTableCounter).padStart(3, "0")}`;
  saveCounters();
  return v;
};
let posTabCounter = savedCounters.posTabCounter ?? 0;
const nextPosTabId = () => {
  const v = `TAB-${++posTabCounter}`;
  saveCounters();
  return v;
};
let posTabItemCounter = savedCounters.posTabItemCounter ?? 0;
const nextPosTabItemId = () => {
  const v = `TABI-${++posTabItemCounter}`;
  saveCounters();
  return v;
};
let kotCounter = savedCounters.kotCounter ?? 0;
const nextKotId = () => {
  const v = `KOT-${++kotCounter}`;
  saveCounters();
  return v;
};
let kotItemCounter = savedCounters.kotItemCounter ?? 0;
const nextKotItemId = () => {
  const v = `KOTI-${++kotItemCounter}`;
  saveCounters();
  return v;
};
let posServicePeriodCounter = savedCounters.posServicePeriodCounter ?? 0;
const nextPosServicePeriodId = () => {
  const v = `PSP-${++posServicePeriodCounter}`;
  saveCounters();
  return v;
};

let messageCounter = savedCounters.messageCounter ?? 0;
export const nextMessageId = () => {
  const v = `MSG-${++messageCounter}`;
  saveCounters();
  return v;
};

let wakeUpCallCounter = savedCounters.wakeUpCallCounter ?? 0;
export const nextWakeUpCallId = () => {
  const v = `WUC-${++wakeUpCallCounter}`;
  saveCounters();
  return v;
};

let lostFoundCounter = savedCounters.lostFoundCounter ?? 0;
export const nextLostFoundId = () => {
  const v = `LF-${++lostFoundCounter}`;
  saveCounters();
  return v;
};

let groupBlockCounter = savedCounters.groupBlockCounter ?? 5;
export const nextGroupBlockId = () => {
  const v = `GB${String(++groupBlockCounter).padStart(3, "0")}`;
  saveCounters();
  return v;
};

/* Inventory counters */
let stockCategoryCounter = savedCounters.stockCategoryCounter ?? 0;
export const nextStockCategoryId = () => { const v = `SC-${++stockCategoryCounter}`; saveCounters(); return v; };
let storageLocationCounter = savedCounters.storageLocationCounter ?? 0;
export const nextStorageLocationId = () => { const v = `SL-${++storageLocationCounter}`; saveCounters(); return v; };
let stockItemCounter = savedCounters.stockItemCounter ?? 0;
export const nextStockItemId = () => { const v = `SI-${++stockItemCounter}`; saveCounters(); return v; };
let stockMovementCounter = savedCounters.stockMovementCounter ?? 0;
export const nextStockMovementId = () => { const v = `SM-${++stockMovementCounter}`; saveCounters(); return v; };
let supplierCounter = savedCounters.supplierCounter ?? 0;
export const nextSupplierId = () => { const v = `SUP-${++supplierCounter}`; saveCounters(); return v; };
let purchaseOrderCounter = savedCounters.purchaseOrderCounter ?? 0;
export const nextPurchaseOrderId = () => { const v = `PO-${++purchaseOrderCounter}`; saveCounters(); return v; };
let purchaseOrderItemCounter = savedCounters.purchaseOrderItemCounter ?? 0;
export const nextPurchaseOrderItemId = () => { const v = `POI-${++purchaseOrderItemCounter}`; saveCounters(); return v; };
let requisitionCounter = savedCounters.requisitionCounter ?? 0;
export const nextRequisitionId = () => { const v = `REQ-${++requisitionCounter}`; saveCounters(); return v; };
let requisitionItemCounter = savedCounters.requisitionItemCounter ?? 0;
export const nextRequisitionItemId = () => { const v = `REQI-${++requisitionItemCounter}`; saveCounters(); return v; };
let stockTransferCounter = savedCounters.stockTransferCounter ?? 0;
export const nextStockTransferId = () => { const v = `TR-${++stockTransferCounter}`; saveCounters(); return v; };
let stockTransferItemCounter = savedCounters.stockTransferItemCounter ?? 0;
export const nextStockTransferItemId = () => { const v = `STI-${++stockTransferItemCounter}`; saveCounters(); return v; };
let stockAdjustmentCounter = savedCounters.stockAdjustmentCounter ?? 0;
export const nextStockAdjustmentId = () => { const v = `ADJ-${++stockAdjustmentCounter}`; saveCounters(); return v; };
let stockAdjustmentItemCounter = savedCounters.stockAdjustmentItemCounter ?? 0;
export const nextStockAdjustmentItemId = () => { const v = `ADJI-${++stockAdjustmentItemCounter}`; saveCounters(); return v; };
let stocktakeCounter = savedCounters.stocktakeCounter ?? 0;
export const nextStocktakeId = () => { const v = `ST-${++stocktakeCounter}`; saveCounters(); return v; };
let stocktakeItemCounter = savedCounters.stocktakeItemCounter ?? 0;
export const nextStocktakeItemId = () => { const v = `STKI-${++stocktakeItemCounter}`; saveCounters(); return v; };
let stockParLevelCounter = savedCounters.stockParLevelCounter ?? 0;
export const nextStockParLevelId = () => { const v = `PAR-${++stockParLevelCounter}`; saveCounters(); return v; };
let grnCounter = savedCounters.grnCounter ?? 0;
export const nextGoodsReceiptId = () => { const v = `GRN-${++grnCounter}`; saveCounters(); return v; };
let grnItemCounter = savedCounters.grnItemCounter ?? 0;
export const nextGoodsReceiptItemId = () => { const v = `GRNI-${++grnItemCounter}`; saveCounters(); return v; };
let supplierInvoiceCounter = savedCounters.supplierInvoiceCounter ?? 0;
export const nextSupplierInvoiceId = () => { const v = `SPI-${++supplierInvoiceCounter}`; saveCounters(); return v; };
let supplierInvoiceLineCounter = savedCounters.supplierInvoiceLineCounter ?? 0;
export const nextSupplierInvoiceLineId = () => { const v = `SPIL-${++supplierInvoiceLineCounter}`; saveCounters(); return v; };
let supplierPaymentCounter = savedCounters.supplierPaymentCounter ?? 0;
export const nextSupplierPaymentId = () => { const v = `SPP-${++supplierPaymentCounter}`; saveCounters(); return v; };

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
    groupBlockId: i === 0 || i === 5 ? "GB001" : i === 1 || i === 6 ? "GB002" : undefined,
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
    propertyId: r.propertyId ?? "T001",
    reservationId: r.id,
    billingArrangement: r.billingArrangement,
    status: "open",
    openedAt: r.createdAt,
    createdAt: r.createdAt,
    updatedAt: r.createdAt,
  };
  r.folioId = folio.id;
  FOLIOS.push(folio);

  // Room charges per night so far
  const start = new Date(r.checkIn);
  const nightsSoFar = Math.max(1, Math.ceil((TODAY.getTime() - start.getTime()) / 86_400_000));
  for (let n = 0; n < nightsSoFar; n++) {
    const d = iso(addDays(start, n));
    CHARGES.push({
      id: nextChargeId(),
      folioId: folio.id,
      date: d,
      chargeDate: d,
      type: "room",
      chargeSource: "room_auto",
      description: `Room ${r.roomId} — night ${n + 1}`,
      amount: r.ratePerNight,
      grossAmount: r.ratePerNight,
      status: "posted",
    });
  }
  // A small F&B charge for some
  if (r.id.endsWith("2") || r.id.endsWith("4")) {
    const d = iso(TODAY);
    CHARGES.push({
      id: nextChargeId(),
      folioId: folio.id,
      date: d,
      chargeDate: d,
      type: "fnb",
      chargeSource: "pos_charge",
      description: "Restaurant",
      amount: 65_000,
      grossAmount: 65_000,
      status: "posted",
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

// Seed minibar logs so per-room on-hand stock and the auto-charge flow demo live.
const MINIBAR_LOGS: MinibarLog[] = [];
{
  const inHouse = RESERVATIONS.find((r) => r.status === "checked_in" && r.roomId);
  if (inHouse) {
    const now = new Date().toISOString();
    MINIBAR_LOGS.push(
      { id: "MBL001", propertyId: "T001", roomId: inHouse.roomId!, reservationId: inHouse.id, minibarItemId: "MB-1", consumedQuantity: 0, restockedQuantity: 4, loggedBy: "Grace Achieng", loggedAt: now, supervisorReviewRequired: false, createdAt: now },
      { id: "MBL002", propertyId: "T001", roomId: inHouse.roomId!, reservationId: inHouse.id, minibarItemId: "MB-2", consumedQuantity: 0, restockedQuantity: 4, loggedBy: "Grace Achieng", loggedAt: now, supervisorReviewRequired: false, createdAt: now },
      { id: "MBL003", propertyId: "T001", roomId: inHouse.roomId!, reservationId: inHouse.id, minibarItemId: "MB-1", consumedQuantity: 1, restockedQuantity: 0, loggedBy: "Grace Achieng", loggedAt: now, supervisorReviewRequired: false, createdAt: now },
      { id: "MBL004", propertyId: "T001", roomId: inHouse.roomId!, reservationId: inHouse.id, minibarItemId: "MB-3", consumedQuantity: 6, restockedQuantity: 0, loggedBy: "Grace Achieng", loggedAt: now, supervisorReviewRequired: true, createdAt: now },
    );
  }
}

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
    propertyId: "T001",
    confirmationNumber: `CNF-${id}`,
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
    bookingSource: ["Direct", "Booking.com", "Expedia", "Corporate"][k % 4],
    billingArrangement: "pay_at_checkout",
    vipFlag: false,
    status: "checked_out",
    createdAt: addDays(TODAY, -30).toISOString(),
    updatedAt: addDays(TODAY, -30).toISOString(),
    address: "Kampala, Uganda",
    currency: "UGX",
    resCode: id,
  };
  RESERVATIONS.push(res);
  const settledAt = iso(checkOut);
  const folio: Folio = {
    id: nextFolioId(),
    propertyId: "T001",
    reservationId: id,
    openedAt: iso(checkIn),
    closedAt: settledAt,
    settledAt,
    status: "settled",
    createdAt: iso(checkIn),
    updatedAt: settledAt,
  };
  res.folioId = folio.id;
  FOLIOS.push(folio);
  const total = res.ratePerNight * nights;
  const d = iso(checkIn);
  CHARGES.push({
    id: nextChargeId(),
    folioId: folio.id,
    date: d,
    chargeDate: d,
    type: "room",
    chargeSource: "room_auto",
    description: `Room ${res.roomId} — ${nights} nights`,
    amount: total,
    grossAmount: total,
    status: "posted",
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
    status: totalPaid >= totalCharges ? "paid" : totalPaid > 0 ? "issued" : "overdue",
    eFRISStatus: "confirmed",
    eFRISFiscalNo: `EFRIS-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    eFRISQRCode: "https://ura.go.ug/efris/qr?placeholder",
    eFRISSubmittedAt: f.closedAt,
    totalTaxable,
    totalVat,
    totalAmount: totalCharges,
    amountDue: Math.max(0, totalCharges - totalPaid),
    paidAmount: totalPaid,
    amountPaid: totalPaid,
    outstandingAmount: Math.max(0, totalCharges - totalPaid),
    isProforma: false,
    isCreditNote: false,
  };
  inv.eFRISQRCode = `https://ura.go.ug/efris/qr?invoice=${inv.invoiceNo}`;
  INVOICES.push(inv);
  INVOICE_LINE_ITEMS.push(...lines);
});

/* Sprinkle a handful of failed/pending EFRIS statuses for realistic demo data */
INVOICES.forEach((inv, i) => {
  if (i % 9 === 0) {
    inv.eFRISStatus = "failed";
    inv.eFRISFiscalNo = undefined;
    inv.eFRISQRCode = undefined;
  } else if (i % 13 === 0) {
    inv.eFRISStatus = "pending";
    inv.eFRISFiscalNo = undefined;
    inv.eFRISQRCode = undefined;
  }
});

const USERS: User[] = [
  { id: "U001", fullName: "Sarah Nakato", firstName: "Sarah", lastName: "Nakato", email: "sarah@jambo.ug", username: "snakato", phone: "+256 701 234 567", nationalId: "CM12345678", department: "Management", jobTitle: "General Manager", employeeId: "EMP001", dateOfJoining: "2023-01-15", employmentStatus: "Full-time", isActive: true, passwordHash: "cGFzc3dvcmQxMjM=", lastLoginAt: "2026-06-25T10:00:00Z", createdAt: "2024-01-15T00:00:00Z", updatedAt: "2026-06-25T10:00:00Z" },
  { id: "U002", fullName: "Amani Kato", firstName: "Amani", lastName: "Kato", email: "amani@jambo.ug", username: "akato", phone: "+256 702 345 678", nationalId: "CM23456789", department: "Front Office", jobTitle: "Front Desk Agent", employeeId: "EMP002", dateOfJoining: "2023-02-20", employmentStatus: "Full-time", isActive: true, passwordHash: "cGFzc3dvcmQxMjM=", lastLoginAt: "2026-06-26T08:30:00Z", createdAt: "2024-02-20T00:00:00Z", updatedAt: "2026-06-26T08:30:00Z" },
  { id: "U003", fullName: "Grace Achieng", firstName: "Grace", lastName: "Achieng", email: "grace@jambo.ug", username: "gachieng", phone: "+256 703 456 789", nationalId: "CM34567890", department: "Housekeeping", jobTitle: "Head Housekeeper", employeeId: "EMP003", dateOfJoining: "2023-03-10", employmentStatus: "Full-time", isActive: true, passwordHash: "cGFzc3dvcmQxMjM=", lastLoginAt: "2026-06-26T06:00:00Z", createdAt: "2024-03-10T00:00:00Z", updatedAt: "2026-06-26T06:00:00Z" },
  { id: "U004", fullName: "John Mukasa", firstName: "John", lastName: "Mukasa", email: "john@jambo.ug", username: "jmukasa", phone: "+256 704 567 890", nationalId: "CM45678901", department: "F&B", jobTitle: "Cashier", employeeId: "EMP004", dateOfJoining: "2023-04-05", employmentStatus: "Full-time", isActive: true, passwordHash: "cGFzc3dvcmQxMjM=", lastLoginAt: "2026-06-26T09:30:00Z", createdAt: "2024-04-05T00:00:00Z", updatedAt: "2026-06-26T09:30:00Z" },
  { id: "U005", fullName: "Esther Nambi", firstName: "Esther", lastName: "Nambi", email: "esther@jambo.ug", username: "enambi", phone: "+256 705 678 901", nationalId: "CM56789012", department: "Reservations", jobTitle: "Reservations Manager", employeeId: "EMP005", dateOfJoining: "2023-05-12", employmentStatus: "Full-time", isActive: true, passwordHash: "cGFzc3dvcmQxMjM=", lastLoginAt: "2026-06-26T07:00:00Z", createdAt: "2024-05-12T00:00:00Z", updatedAt: "2026-06-26T07:00:00Z" },
  { id: "U006", fullName: "Peter Ssempijja", firstName: "Peter", lastName: "Ssempijja", email: "peter@jambo.ug", username: "pssempijja", phone: "+256 706 789 012", nationalId: "CM67890123", department: "Finance", jobTitle: "Accountant", employeeId: "EMP006", dateOfJoining: "2023-06-01", employmentStatus: "Full-time", isActive: true, passwordHash: "cGFzc3dvcmQxMjM=", lastLoginAt: "2026-06-26T16:00:00Z", createdAt: "2024-06-01T00:00:00Z", updatedAt: "2026-06-26T16:00:00Z" },
  { id: "U007", fullName: "Robert Kizza", firstName: "Robert", lastName: "Kizza", email: "robert@jambo.ug", username: "rkizza", phone: "+256 707 890 123", nationalId: "CM78901234", department: "IT", jobTitle: "System Administrator", employeeId: "EMP007", dateOfJoining: "2023-01-10", employmentStatus: "Full-time", isActive: true, passwordHash: "cGFzc3dvcmQxMjM=", lastLoginAt: "2026-06-26T09:55:00Z", createdAt: "2024-01-10T00:00:00Z", updatedAt: "2026-06-26T09:55:00Z" },
  { id: "U008", fullName: "Mary Nakibuuka", firstName: "Mary", lastName: "Nakibuuka", email: "mary@jambo.ug", username: "mnakibuuka", phone: "+256 708 901 234", nationalId: "CM89012345", department: "Housekeeping", jobTitle: "Housekeeper", employeeId: "EMP008", dateOfJoining: "2023-07-22", employmentStatus: "Part-time", employmentEndDate: "2026-06-01", isActive: true, passwordHash: "cGFzc3dvcmQxMjM=", lastLoginAt: "2026-06-25T06:00:00Z", createdAt: "2024-07-22T00:00:00Z", updatedAt: "2026-06-25T06:00:00Z" },
  { id: "U009", fullName: "Faith Akello", firstName: "Faith", lastName: "Akello", email: "faith@jambo.ug", username: "fakello", phone: "+256 709 012 345", nationalId: "CM90123456", department: "Front Office", jobTitle: "Front Desk Agent", employeeId: "EMP009", dateOfJoining: "2023-08-15", employmentStatus: "Full-time", isActive: true, passwordHash: "cGFzc3dvcmQxMjM=", lastLoginAt: "2026-05-25T10:00:00Z", createdAt: "2024-08-15T00:00:00Z", updatedAt: "2024-08-15T00:00:00Z" },
];

const ROLES_DATA: RoleRecord[] = [
  { id: "R001", roleCode: "OWNER_GM", roleName: "Owner / GM", description: "Full property access & executive reporting", permissions: ROLE_PERMISSION_DEFAULTS["Owner / GM"], createdAt: "2024-01-01T00:00:00Z" },
  { id: "R002", roleCode: "FD_AGENT", roleName: "Front Desk", description: "Front desk check-in/out & reservations", permissions: ROLE_PERMISSION_DEFAULTS["Front Desk"], createdAt: "2024-01-01T00:00:00Z" },
  { id: "R003", roleCode: "HK_STAFF", roleName: "Housekeeping", description: "Housekeeping task management", permissions: ROLE_PERMISSION_DEFAULTS["Housekeeping"], createdAt: "2024-01-01T00:00:00Z" },
  { id: "R004", roleCode: "POS_CASHIER", roleName: "POS / Cashier", description: "Point of sale & cash handling", permissions: ROLE_PERMISSION_DEFAULTS["POS / Cashier"], createdAt: "2024-01-01T00:00:00Z" },
  { id: "R006", roleCode: "ACCOUNTANT", roleName: "Accountant", description: "Accounting, billing & financial reports", permissions: ROLE_PERMISSION_DEFAULTS["Accountant"], createdAt: "2024-01-01T00:00:00Z" },
  { id: "R007", roleCode: "SYS_ADMIN", roleName: "System Administrator", description: "System configuration & access control", permissions: ROLE_PERMISSION_DEFAULTS["System Administrator"], createdAt: "2024-01-01T00:00:00Z" },
  { id: "R008", roleCode: "NIGHT_AUDITOR", roleName: "Night Auditor", description: "Night audit, reconciliation & reporting", permissions: ROLE_PERMISSION_DEFAULTS["Night Auditor"], createdAt: "2024-01-01T00:00:00Z" },
  { id: "R009", roleCode: "MAINTENANCE", roleName: "Maintenance", description: "Maintenance work orders & room status", permissions: ROLE_PERMISSION_DEFAULTS["Maintenance"], createdAt: "2024-01-01T00:00:00Z" },
  { id: "R010", roleCode: "SALES_MKTG", roleName: "Sales & Marketing", description: "Sales pipeline, groups & rate management", permissions: ROLE_PERMISSION_DEFAULTS["Sales & Marketing"], createdAt: "2024-01-01T00:00:00Z" },
  { id: "R011", roleCode: "HR", roleName: "Human Resources", description: "Staff records, leave & scheduling", permissions: ROLE_PERMISSION_DEFAULTS["Human Resources"], createdAt: "2024-01-01T00:00:00Z" },
  { id: "R012", roleCode: "INVENTORY_MGR", roleName: "Inventory Manager", description: "Stock control, purchase orders & requisitions", permissions: ROLE_PERMISSION_DEFAULTS["Inventory Manager"], createdAt: "2024-01-01T00:00:00Z" },
  { id: "R013", roleCode: "LAUNDRY", roleName: "Laundry", description: "Laundry service & linen management", permissions: ROLE_PERMISSION_DEFAULTS["Laundry"], createdAt: "2024-01-01T00:00:00Z" },
];

const USER_ROLES_DATA: UserRole[] = [
  { id: "UR001", userId: "U001", roleId: "R001", assignedBy: "U007", assignedAt: "2024-01-15T00:00:00Z" },
  { id: "UR002", userId: "U002", roleId: "R002", assignedBy: "U007", assignedAt: "2024-02-20T00:00:00Z" },
  { id: "UR003", userId: "U003", roleId: "R003", assignedBy: "U007", assignedAt: "2024-03-10T00:00:00Z" },
  { id: "UR004", userId: "U004", roleId: "R004", assignedBy: "U007", assignedAt: "2024-04-05T00:00:00Z" },
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
        nationality: r.nationality ?? "Uganda",
        idType: r.idType ?? "Passport",
        idNumber: r.idNumber ?? `P${9000000 + idx}`,
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
    ts: addDays(TODAY, -2).toISOString(),
    actor: "Robert Kizza",
    role: "System Administrator",
    module: "identity",
    action: "Created user",
    entity: "grace.achieng@jambo.ug",
    severity: "warn",
    ipAddress: "192.168.1.100",
  },
  {
    id: nextAuditId(),
    ts: addDays(TODAY, -2).toISOString(),
    actor: "Robert Kizza",
    role: "System Administrator",
    module: "identity",
    action: "Assigned role",
    entity: "grace.achieng@jambo.ug → Housekeeping",
    severity: "info",
    ipAddress: "192.168.1.100",
  },
  {
    id: nextAuditId(),
    ts: addDays(TODAY, -3).toISOString(),
    actor: "Robert Kizza",
    role: "System Administrator",
    module: "settings",
    action: "Updated lockout settings",
    entity: "Security",
    severity: "warn",
    ipAddress: "192.168.1.100",
  },
  {
    id: nextAuditId(),
    ts: addDays(TODAY, -3).toISOString(),
    actor: "Robert Kizza",
    role: "System Administrator",
    module: "settings",
    action: "Updated notification settings",
    entity: "email, sound",
    severity: "info",
    ipAddress: "192.168.1.100",
  },
  {
    id: nextAuditId(),
    ts: addDays(TODAY, -4).toISOString(),
    actor: "Robert Kizza",
    role: "System Administrator",
    module: "settings",
    action: "Created property",
    entity: "Jambo Grand Hotel Kampala",
    severity: "warn",
    ipAddress: "192.168.1.100",
  },
  {
    id: nextAuditId(),
    ts: addDays(TODAY, -5).toISOString(),
    actor: "Robert Kizza",
    role: "System Administrator",
    module: "rooms",
    action: "Created room",
    entity: "101 — Jambo Grand Hotel Kampala",
    severity: "info",
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
  {
    id: nextAuditId(),
    ts: addDays(TODAY, 0).toISOString(),
    actor: "Amani Kato",
    role: "Front Desk",
    module: "reservations",
    action: "Checked in guest",
    entity: `${RESERVATIONS[0].id} → Room 101`,
    recordId: RESERVATIONS[0].id,
    severity: "info",
    ipAddress: "192.168.1.101",
  },
  {
    id: nextAuditId(),
    ts: addDays(TODAY, 0).toISOString(),
    actor: "Amani Kato",
    role: "Front Desk",
    module: "billing",
    action: "Posted confirmed payment",
    entity: `F-3001 UGX 450,000 via cash`,
    severity: "info",
    ipAddress: "192.168.1.101",
  },
  {
    id: nextAuditId(),
    ts: addDays(TODAY, 0).toISOString(),
    actor: "Amani Kato",
    role: "Front Desk",
    module: "housekeeping",
    action: "Updated room status",
    entity: "Room 101 → dirty",
    severity: "info",
    ipAddress: "192.168.1.101",
  },
  {
    id: nextAuditId(),
    ts: addDays(TODAY, -2).toISOString(),
    actor: "Amani Kato",
    role: "Front Desk",
    module: "reservations",
    action: "Cancelled reservation",
    entity: RESERVATIONS[1]?.id ?? "RES-002",
    severity: "warn",
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

const AGENT_LEDGER_ENTRIES: AgentLedgerEntry[] = [];

const RECONCILIATION_REPORTS: ReconciliationReport[] = [];

const REPORT_ACCESS_LOGS: ReportAccessLog[] = [];

const SCHEDULED_REPORT_CONFIGS: ScheduledReportConfig[] = [];

const POS_OUTLETS: PosOutlet[] = [
  { id: "PO001", propertyId: "T001", name: "Main Restaurant", departmentCode: "REST", inventoryEnabled: true, serviceChargePct: 10, isActive: true, createdAt: new Date().toISOString() },
  { id: "PO002", propertyId: "T001", name: "Rooftop Bar", departmentCode: "BAR", inventoryEnabled: true, serviceChargePct: 5, isActive: true, createdAt: new Date().toISOString() },
  { id: "PO003", propertyId: "T001", name: "Health Club", departmentCode: "HC", inventoryEnabled: true, serviceChargePct: 0, isActive: true, createdAt: new Date().toISOString() },
  { id: "PO004", propertyId: "T001", name: "Spa", departmentCode: "SPA", inventoryEnabled: true, serviceChargePct: 0, isActive: true, createdAt: new Date().toISOString() },
  { id: "PO005", propertyId: "T001", name: "Poolside", departmentCode: "POOL", inventoryEnabled: true, serviceChargePct: 0, isActive: true, createdAt: new Date().toISOString() },
];
const MENU_CATEGORIES: MenuCategory[] = [
  { id: "MC001", posOutletId: "PO001", name: "Starters", displayOrder: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: "MC002", posOutletId: "PO001", name: "Mains", displayOrder: 2, isActive: true, createdAt: new Date().toISOString() },
  { id: "MC003", posOutletId: "PO001", name: "Beverages", displayOrder: 3, isActive: true, createdAt: new Date().toISOString() },
  { id: "MC004", posOutletId: "PO002", name: "Cocktails", displayOrder: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: "MC005", posOutletId: "PO002", name: "Bar Snacks", displayOrder: 2, isActive: true, createdAt: new Date().toISOString() },
  { id: "MC006", posOutletId: "PO001", name: "Spirits", displayOrder: 4, isActive: true, createdAt: new Date().toISOString() },
  /* Health Club */
  { id: "MC007", posOutletId: "PO003", name: "Fitness Classes", displayOrder: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: "MC008", posOutletId: "PO003", name: "Personal Training", displayOrder: 2, isActive: true, createdAt: new Date().toISOString() },
  { id: "MC009", posOutletId: "PO003", name: "Wellness & Recovery", displayOrder: 3, isActive: true, createdAt: new Date().toISOString() },
  /* Spa */
  { id: "MC010", posOutletId: "PO004", name: "Massages", displayOrder: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: "MC011", posOutletId: "PO004", name: "Facials", displayOrder: 2, isActive: true, createdAt: new Date().toISOString() },
  { id: "MC012", posOutletId: "PO004", name: "Body Treatments", displayOrder: 3, isActive: true, createdAt: new Date().toISOString() },
];
const MENU_ITEMS: MenuItem[] = [
  { id: "MI001", posOutletId: "PO001", menuCategoryId: "MC002", name: "Ugali & Fish", description: "Grilled tilapia with ugali and sautéed greens", unitPrice: 45_000, vatTreatment: "inclusive", availabilityPeriods: ["lunch", "dinner"], isActive: true, createdAt: new Date().toISOString() },
  { id: "MI002", posOutletId: "PO001", menuCategoryId: "MC002", name: "Beef Stew & Rice", unitPrice: 38_000, vatTreatment: "inclusive", availabilityPeriods: ["lunch", "dinner"], isActive: true, createdAt: new Date().toISOString() },
  { id: "MI003", posOutletId: "PO001", menuCategoryId: "MC003", name: "Mountain Dew", unitPrice: 5_000, vatTreatment: "exclusive", availabilityPeriods: ["all_day"], isActive: true, createdAt: new Date().toISOString() },
  { id: "MI004", posOutletId: "PO002", menuCategoryId: "MC004", name: "Sunset Mojito", unitPrice: 25_000, vatTreatment: "inclusive", availabilityPeriods: ["bar_only"], isActive: true, createdAt: new Date().toISOString() },
  { id: "MI005", posOutletId: "PO001", menuCategoryId: "MC001", name: "Chicken Samosas (4 pcs)", unitPrice: 18_000, vatTreatment: "inclusive", availabilityPeriods: ["lunch", "dinner"], isActive: true, createdAt: new Date().toISOString() },
  /* Beverages */
  { id: "MI006", posOutletId: "PO001", menuCategoryId: "MC003", name: "Coca Cola", stockItemId: "SI001", unitPrice: 5_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI007", posOutletId: "PO001", menuCategoryId: "MC003", name: "Fanta Orange", stockItemId: "SI002", unitPrice: 5_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI008", posOutletId: "PO001", menuCategoryId: "MC003", name: "Sprite", stockItemId: "SI003", unitPrice: 5_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI009", posOutletId: "PO001", menuCategoryId: "MC003", name: "Mineral Water", stockItemId: "SI004", unitPrice: 3_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI010", posOutletId: "PO001", menuCategoryId: "MC003", name: "Fresh Orange Juice", unitPrice: 8_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI011", posOutletId: "PO001", menuCategoryId: "MC003", name: "Mango Smoothie", unitPrice: 10_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  /* Spirits */
  { id: "MI012", posOutletId: "PO001", menuCategoryId: "MC006", name: "Johnnie Walker Red", stockItemId: "SI005", unitPrice: 35_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI013", posOutletId: "PO001", menuCategoryId: "MC006", name: "Jameson Irish", stockItemId: "SI006", unitPrice: 30_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI014", posOutletId: "PO001", menuCategoryId: "MC006", name: "Smirnoff Vodka", stockItemId: "SI007", unitPrice: 25_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI015", posOutletId: "PO001", menuCategoryId: "MC006", name: "Beefeater Gin", stockItemId: "SI008", unitPrice: 28_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI016", posOutletId: "PO001", menuCategoryId: "MC006", name: "Captain Morgan Rum", stockItemId: "SI009", unitPrice: 26_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI017", posOutletId: "PO001", menuCategoryId: "MC006", name: "Local Waragi", stockItemId: "SI010", unitPrice: 15_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  /* Mains */
  { id: "MI018", posOutletId: "PO001", menuCategoryId: "MC002", name: "Grilled Chicken", description: "Tender grilled chicken with seasonal vegetables", unitPrice: 25_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI019", posOutletId: "PO001", menuCategoryId: "MC002", name: "Beef Steak", description: "Prime cut grilled to perfection", unitPrice: 35_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI020", posOutletId: "PO001", menuCategoryId: "MC002", name: "Fish & Chips", unitPrice: 22_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI021", posOutletId: "PO001", menuCategoryId: "MC002", name: "Chicken Burger", unitPrice: 18_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI022", posOutletId: "PO001", menuCategoryId: "MC002", name: "Vegetable Curry", unitPrice: 20_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI023", posOutletId: "PO001", menuCategoryId: "MC002", name: "Pasta Bolognese", unitPrice: 22_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  /* Starters */
  { id: "MI024", posOutletId: "PO001", menuCategoryId: "MC001", name: "French Fries", unitPrice: 8_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI025", posOutletId: "PO001", menuCategoryId: "MC001", name: "Onion Rings", unitPrice: 7_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI026", posOutletId: "PO001", menuCategoryId: "MC001", name: "Chicken Wings", unitPrice: 15_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI027", posOutletId: "PO001", menuCategoryId: "MC001", name: "Spring Rolls", unitPrice: 8_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI028", posOutletId: "PO001", menuCategoryId: "MC001", name: "Nachos", unitPrice: 12_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  /* Rooftop Bar additions */
  { id: "MI029", posOutletId: "PO002", menuCategoryId: "MC004", name: "Tropical Breeze", unitPrice: 22_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI030", posOutletId: "PO002", menuCategoryId: "MC004", name: "Whiskey Sour", unitPrice: 30_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI031", posOutletId: "PO002", menuCategoryId: "MC005", name: "Beef Biltong", unitPrice: 12_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI032", posOutletId: "PO002", menuCategoryId: "MC005", name: "Mixed Nuts", unitPrice: 8_000, vatTreatment: "inclusive", isActive: true, createdAt: new Date().toISOString() },
  /* Health Club */
  { id: "MI033", posOutletId: "PO003", menuCategoryId: "MC007", name: "Yoga Class", unitPrice: 25_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI034", posOutletId: "PO003", menuCategoryId: "MC007", name: "Pilates Class", unitPrice: 25_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI035", posOutletId: "PO003", menuCategoryId: "MC007", name: "Spin Class", unitPrice: 20_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI036", posOutletId: "PO003", menuCategoryId: "MC008", name: "PT Session (1 hr)", unitPrice: 50_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI037", posOutletId: "PO003", menuCategoryId: "MC008", name: "PT Session (30 min)", unitPrice: 30_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI038", posOutletId: "PO003", menuCategoryId: "MC009", name: "Sauna Access", unitPrice: 15_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI039", posOutletId: "PO003", menuCategoryId: "MC009", name: "Steam Room Access", unitPrice: 12_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI040", posOutletId: "PO003", menuCategoryId: "MC009", name: "Gym Day Pass", unitPrice: 20_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  /* Spa */
  { id: "MI041", posOutletId: "PO004", menuCategoryId: "MC010", name: "Swedish Massage (60 min)", unitPrice: 80_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI042", posOutletId: "PO004", menuCategoryId: "MC010", name: "Deep Tissue Massage (60 min)", unitPrice: 100_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI043", posOutletId: "PO004", menuCategoryId: "MC010", name: "Hot Stone Massage (90 min)", unitPrice: 130_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI044", posOutletId: "PO004", menuCategoryId: "MC010", name: "Aromatherapy Massage (60 min)", unitPrice: 90_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI045", posOutletId: "PO004", menuCategoryId: "MC011", name: "Classic Facial (45 min)", unitPrice: 60_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI046", posOutletId: "PO004", menuCategoryId: "MC011", name: "Anti-Aging Facial (60 min)", unitPrice: 85_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI047", posOutletId: "PO004", menuCategoryId: "MC011", name: "Brightening Facial (45 min)", unitPrice: 70_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI048", posOutletId: "PO004", menuCategoryId: "MC012", name: "Body Scrub (45 min)", unitPrice: 70_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI049", posOutletId: "PO004", menuCategoryId: "MC012", name: "Body Wrap (60 min)", unitPrice: 85_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI050", posOutletId: "PO004", menuCategoryId: "MC012", name: "Couples Massage (90 min)", unitPrice: 220_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  /* Health Club — Retail */
  { id: "MI051", posOutletId: "PO003", menuCategoryId: "MC009", name: "Protein Bar", stockItemId: "SI016", unitPrice: 8_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI052", posOutletId: "PO003", menuCategoryId: "MC009", name: "Gym Towel (Large)", stockItemId: "SI015", unitPrice: 12_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  /* Spa — Retail */
  { id: "MI053", posOutletId: "PO004", menuCategoryId: "MC011", name: "Face Mask Sheet", stockItemId: "SI013", unitPrice: 8_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI054", posOutletId: "PO004", menuCategoryId: "MC012", name: "Body Scrub (200g)", stockItemId: "SI014", unitPrice: 20_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
  { id: "MI055", posOutletId: "PO004", menuCategoryId: "MC010", name: "Massage Oil (500ml)", stockItemId: "SI011", unitPrice: 25_000, vatTreatment: "exclusive", isActive: true, createdAt: new Date().toISOString() },
];
const MENU_MODIFIERS: MenuModifier[] = [
  { id: "MM001", menuItemId: "MI001", name: "Doneness", options: [{ name: "Whole", priceDelta: 0 }, { name: "Portion", priceDelta: -5_000 }], isRequired: false, createdAt: new Date().toISOString() },
  { id: "MM002", menuItemId: "MI002", name: "Portion Size", options: [{ name: "Regular", priceDelta: 0 }, { name: "Large", priceDelta: 8_000 }], isRequired: false, createdAt: new Date().toISOString() },
  { id: "MM003", menuItemId: "MI002", name: "Extra Spicy", options: [{ name: "No", priceDelta: 0 }, { name: "Yes", priceDelta: 0 }], isRequired: false, createdAt: new Date().toISOString() },
];
const POS_TABLES: PosTable[] = [
  { id: "PT001", posOutletId: "PO001", tableName: "Table 1", seatingCapacity: 4, isActive: true, createdAt: new Date().toISOString() },
  { id: "PT002", posOutletId: "PO001", tableName: "Table 2", seatingCapacity: 4, isActive: true, createdAt: new Date().toISOString() },
  { id: "PT003", posOutletId: "PO001", tableName: "Table 3", seatingCapacity: 6, isActive: true, createdAt: new Date().toISOString() },
  { id: "PT004", posOutletId: "PO002", tableName: "Bar Stool A", seatingCapacity: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: "PT005", posOutletId: "PO002", tableName: "Terrace 1", seatingCapacity: 4, isActive: true, createdAt: new Date().toISOString() },
  /* Health Club */
  { id: "PT006", posOutletId: "PO003", tableName: "Gym Floor", seatingCapacity: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: "PT007", posOutletId: "PO003", tableName: "Studio 1", seatingCapacity: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: "PT008", posOutletId: "PO003", tableName: "Sauna", seatingCapacity: 1, isActive: true, createdAt: new Date().toISOString() },
  /* Spa */
  { id: "PT009", posOutletId: "PO004", tableName: "Treatment Room 1", seatingCapacity: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: "PT010", posOutletId: "PO004", tableName: "Treatment Room 2", seatingCapacity: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: "PT011", posOutletId: "PO004", tableName: "Treatment Room 3", seatingCapacity: 2, isActive: true, createdAt: new Date().toISOString() },
];
const POS_TABS: PosTab[] = [];
const POS_TAB_ITEMS: PosTabItem[] = [];
(() => {
  const d = (ago: number) => iso(addDays(TODAY, -ago));
  const t = (ago: number, h: number, m: number) => {
    const x = new Date(addDays(TODAY, -ago));
    x.setHours(h, m, 0, 0);
    return x.toISOString();
  };
  /* Restaurant settled tabs */
  POS_TABS.push(
    { id: "TAB-1", propertyId: "T001", posOutletId: "PO001", posTableId: "PT001", orderType: "dine_in", coverCount: 2, status: "settled", subtotal: 95_000, vatAmount: 14_492, serviceChargeAmount: 9_500, totalAmount: 118_992, openedAt: t(0, 12, 30), settledAt: t(0, 13, 15), settledBy: "U004", settlementMethod: "direct_payment" },
    { id: "TAB-2", propertyId: "T001", posOutletId: "PO001", posTableId: "PT002", orderType: "dine_in", coverCount: 1, status: "settled", subtotal: 56_000, vatAmount: 8_542, serviceChargeAmount: 5_600, totalAmount: 70_142, openedAt: t(0, 8, 0), settledAt: t(0, 8, 45), settledBy: "U004", settlementMethod: "direct_payment" },
    { id: "TAB-3", propertyId: "T001", posOutletId: "PO001", posTableId: "PT003", orderType: "dine_in", coverCount: 4, status: "settled", subtotal: 148_000, vatAmount: 22_576, serviceChargeAmount: 14_800, totalAmount: 185_376, openedAt: t(1, 19, 0), settledAt: t(1, 20, 30), settledBy: "U004", settlementMethod: "direct_payment" },
    { id: "TAB-4", propertyId: "T001", posOutletId: "PO001", posTableId: "PT001", orderType: "dine_in", coverCount: 2, status: "settled", subtotal: 106_000, vatAmount: 16_169, serviceChargeAmount: 10_600, totalAmount: 132_769, openedAt: t(1, 12, 0), settledAt: t(1, 12, 50), settledBy: "U004", settlementMethod: "direct_payment" },
    { id: "TAB-5", propertyId: "T001", posOutletId: "PO001", orderType: "takeaway", coverCount: 1, status: "settled", subtotal: 23_000, vatAmount: 3_508, serviceChargeAmount: 2_300, totalAmount: 28_808, openedAt: t(2, 10, 15), settledAt: t(2, 10, 30), settledBy: "U004", settlementMethod: "direct_payment" },
  );
  /* Bar settled tabs */
  POS_TABS.push(
    { id: "TAB-6", propertyId: "T001", posOutletId: "PO002", posTableId: "PT004", orderType: "dine_in", coverCount: 2, status: "settled", subtotal: 50_000, vatAmount: 7_627, serviceChargeAmount: 2_500, totalAmount: 60_127, openedAt: t(0, 17, 0), settledAt: t(0, 18, 15), settledBy: "U004", settlementMethod: "direct_payment" },
    { id: "TAB-7", propertyId: "T001", posOutletId: "PO002", posTableId: "PT005", orderType: "dine_in", coverCount: 3, status: "settled", subtotal: 75_000, vatAmount: 11_441, serviceChargeAmount: 3_750, totalAmount: 90_191, openedAt: t(1, 21, 0), settledAt: t(1, 22, 30), settledBy: "U004", settlementMethod: "direct_payment" },
    { id: "TAB-8", propertyId: "T001", posOutletId: "PO002", posTableId: "PT005", orderType: "dine_in", coverCount: 4, status: "settled", subtotal: 100_000, vatAmount: 15_254, serviceChargeAmount: 5_000, totalAmount: 120_254, openedAt: t(2, 20, 0), settledAt: t(2, 21, 0), settledBy: "U004", settlementMethod: "direct_payment" },
  );
  /* Room-charged tabs */
  POS_TABS.push(
    { id: "TAB-9",  propertyId: "T001", posOutletId: "PO001", posTableId: "PT002", orderType: "dine_in", reservationId: "R002", coverCount: 1, status: "room_charged", subtotal: 50_000, vatAmount: 7_627, serviceChargeAmount: 5_000, totalAmount: 62_627, openedAt: t(0, 19, 0), settledAt: t(0, 19, 30), settledBy: "U002", settlementMethod: "room_charge", roomChargeFolioId: "F-3001" },
    { id: "TAB-10", propertyId: "T001", posOutletId: "PO001", posTableId: "PT003", orderType: "dine_in", reservationId: "R004", coverCount: 2, status: "room_charged", subtotal: 83_000, vatAmount: 12_661, serviceChargeAmount: 8_300, totalAmount: 103_961, openedAt: t(1, 13, 0), settledAt: t(1, 14, 0), settledBy: "U002", settlementMethod: "room_charge", roomChargeFolioId: "F-3002" },
  );
  /* Open tabs */
  POS_TABS.push(
    { id: "TAB-11", propertyId: "T001", posOutletId: "PO001", posTableId: "PT001", orderType: "dine_in", coverCount: 2, status: "open", subtotal: 63_000, vatAmount: 0, serviceChargeAmount: 6_300, totalAmount: 69_300, openedAt: t(0, 11, 0) },
    { id: "TAB-12", propertyId: "T001", posOutletId: "PO002", posTableId: "PT004", orderType: "dine_in", coverCount: 1, status: "open", subtotal: 25_000, vatAmount: 0, serviceChargeAmount: 1_250, totalAmount: 26_250, openedAt: t(0, 11, 30) },
  );
  /* Tab items */
  const addItem = (tabId: string, menuItemId: string, qty: number, price: number) => {
    const idx = POS_TAB_ITEMS.length + 1;
    POS_TAB_ITEMS.push({
      id: `TABI-${idx}`,
      posTabId: tabId,
      menuItemId,
      quantity: qty,
      unitPrice: price,
      courseNumber: 0,
      sentToKot: true,
      isComplimentary: false,
      isVoided: false,
      voidAfterAck: false,
      addedBy: "U004",
      addedAt: new Date().toISOString(),
    });
  };
  /* TAB-1: Ugali & Fish x2, Mountain Dew x3 */
  addItem("TAB-1", "MI001", 2, 45_000);
  addItem("TAB-1", "MI003", 3, 5_000);
  /* TAB-2: Chicken Samosas, Mountain Dew */
  addItem("TAB-2", "MI005", 1, 18_000);
  addItem("TAB-2", "MI003", 1, 5_000);
  /* TAB-3: Beef Stew & Rice x2, Ugali & Fish, Mountain Dew x2 */
  addItem("TAB-3", "MI002", 2, 38_000);
  addItem("TAB-3", "MI001", 1, 45_000);
  addItem("TAB-3", "MI003", 2, 5_000);
  /* TAB-4: Ugali & Fish, Chicken Samosas x2, Mountain Dew x3 */
  addItem("TAB-4", "MI001", 1, 45_000);
  addItem("TAB-4", "MI005", 2, 18_000);
  addItem("TAB-4", "MI003", 3, 5_000);
  /* TAB-5: Mountain Dew x2 (not 3), Chicken Samosas */
  addItem("TAB-5", "MI003", 1, 5_000);
  addItem("TAB-5", "MI005", 1, 18_000);
  /* TAB-6: Sunset Mojito x2 */
  addItem("TAB-6", "MI004", 2, 25_000);
  /* TAB-7: Sunset Mojito x3 */
  addItem("TAB-7", "MI004", 3, 25_000);
  /* TAB-8: Sunset Mojito x4 */
  addItem("TAB-8", "MI004", 4, 25_000);
  /* TAB-9: Ugali & Fish, Mountain Dew */
  addItem("TAB-9", "MI001", 1, 45_000);
  addItem("TAB-9", "MI003", 1, 5_000);
  /* TAB-10: Beef Stew & Rice, Chicken Samosas x2 */
  addItem("TAB-10", "MI002", 1, 38_000);
  addItem("TAB-10", "MI005", 2, 18_000);
  /* TAB-11 open: Ugali & Fish, Mountain Dew */
  addItem("TAB-11", "MI001", 1, 45_000);
  addItem("TAB-11", "MI003", 1, 5_000);
  /* TAB-12 open: Sunset Mojito */
  addItem("TAB-12", "MI004", 1, 25_000);
})();
const KOTS: Kot[] = [];
const KOT_ITEMS: KotItem[] = [];
const POS_SERVICE_PERIODS: PosServicePeriod[] = [];

/*
 * Seed recipes (BOM) for a few prepared dishes so the "sale → ingredient
 * deduction → food cost" flow demos out of the box. Quantities are per dish;
 * ingredients map to F&B Ingredients (SC003) held at the Kitchen Store (SL002).
 */
const MENU_ITEM_RECIPES: MenuItemRecipeLine[] = [
  { id: "MRL001", menuItemId: "MI001", stockItemId: "SI025", quantity: 0.5, createdAt: new Date().toISOString() },
  { id: "MRL002", menuItemId: "MI001", stockItemId: "SI017", quantity: 0.1, createdAt: new Date().toISOString() },
  { id: "MRL003", menuItemId: "MI001", stockItemId: "SI019", quantity: 0.2, createdAt: new Date().toISOString() },
  { id: "MRL004", menuItemId: "MI001", stockItemId: "SI020", quantity: 0.1, createdAt: new Date().toISOString() },
  { id: "MRL005", menuItemId: "MI002", stockItemId: "SI024", quantity: 0.3, createdAt: new Date().toISOString() },
  { id: "MRL006", menuItemId: "MI002", stockItemId: "SI018", quantity: 0.15, createdAt: new Date().toISOString() },
  { id: "MRL007", menuItemId: "MI002", stockItemId: "SI019", quantity: 0.1, createdAt: new Date().toISOString() },
  { id: "MRL008", menuItemId: "MI002", stockItemId: "SI020", quantity: 0.05, createdAt: new Date().toISOString() },
  { id: "MRL009", menuItemId: "MI002", stockItemId: "SI017", quantity: 0.05, createdAt: new Date().toISOString() },
  { id: "MRL010", menuItemId: "MI005", stockItemId: "SI023", quantity: 0.1, createdAt: new Date().toISOString() },
  { id: "MRL011", menuItemId: "MI005", stockItemId: "SI026", quantity: 0.25, createdAt: new Date().toISOString() },
  { id: "MRL012", menuItemId: "MI005", stockItemId: "SI017", quantity: 0.05, createdAt: new Date().toISOString() },
  { id: "MRL013", menuItemId: "MI005", stockItemId: "SI020", quantity: 0.05, createdAt: new Date().toISOString() },
  { id: "MRL014", menuItemId: "MI018", stockItemId: "SI026", quantity: 0.5, createdAt: new Date().toISOString() },
  { id: "MRL015", menuItemId: "MI018", stockItemId: "SI017", quantity: 0.05, createdAt: new Date().toISOString() },
  { id: "MRL016", menuItemId: "MI020", stockItemId: "SI025", quantity: 0.4, createdAt: new Date().toISOString() },
  { id: "MRL017", menuItemId: "MI020", stockItemId: "SI017", quantity: 0.15, createdAt: new Date().toISOString() },
  { id: "MRL018", menuItemId: "MI020", stockItemId: "SI023", quantity: 0.05, createdAt: new Date().toISOString() },
  { id: "MRL019", menuItemId: "MI021", stockItemId: "SI026", quantity: 0.3, createdAt: new Date().toISOString() },
  { id: "MRL020", menuItemId: "MI021", stockItemId: "SI023", quantity: 0.1, createdAt: new Date().toISOString() },
];
const MENU_ITEM_SALES: MenuItemSale[] = [];

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "NOTIF-1",
    type: "check_in",
    title: "Guest checked in",
    description: "Amani Kato checked into Room 101",
    ts: new Date(Date.now() - 10 * 60000).toISOString(),
    read: false,
    archived: false,
    link: "/reservations/R001",
    reservationId: "R001",
    targetRoles: ["Front Desk", "Housekeeping", "Owner / GM"],
  },
  {
    id: "NOTIF-2",
    type: "reservation_created",
    title: "New reservation",
    description: "Grace Achieng — 2026-07-20 to 2026-07-25",
    ts: new Date(Date.now() - 45 * 60000).toISOString(),
    read: false,
    archived: false,
    link: "/reservations/R010",
    reservationId: "R010",
    targetRoles: ["Front Desk", "Owner / GM"],
  },
  {
    id: "NOTIF-3",
    type: "payment_received",
    title: "Payment received",
    description: "UGX 850,000 via card",
    ts: new Date(Date.now() - 120 * 60000).toISOString(),
    read: true,
    archived: false,
    link: "/billing",
    targetRoles: ["Accountant", "POS / Cashier", "Front Desk", "Owner / GM"],
  },
  {
    id: "NOTIF-4",
    type: "check_out",
    title: "Guest checked out",
    description: "John Mukasa checked out of Room 205",
    ts: new Date(Date.now() - 3 * 3600000).toISOString(),
    read: true,
    archived: false,
    link: "/reservations/R005",
    reservationId: "R005",
    targetRoles: ["Front Desk", "Housekeeping", "Owner / GM"],
  },
  {
    id: "NOTIF-5",
    type: "no_show",
    title: "No-show declared",
    description: "Esther Nambi — reservation R008 marked no-show",
    ts: new Date(Date.now() - 8 * 3600000).toISOString(),
    read: false,
    archived: false,
    link: "/reservations/R008",
    reservationId: "R008",
    targetRoles: ["Front Desk", "Owner / GM"],
  },
  {
    id: "NOTIF-6",
    type: "reservation_cancelled",
    title: "Reservation cancelled",
    description: "Peter Ssempijja cancelled their booking for Jul 18–22",
    ts: new Date(Date.now() - 24 * 3600000).toISOString(),
    read: true,
    archived: false,
    link: "/reservations/R012",
    reservationId: "R012",
    targetRoles: ["Front Desk", "Owner / GM"],
  },
];

const TENANT: Property = {
  id: "T001",
  propertyCode: "JGH-KLA",
  name: "Jambo Sphere Hotel",
  propertyType: "hotel",
  starRating: 4,
  description: "Premier business and leisure hotel in the heart of Kampala",
  logoUrl: "",
  address: "Plot 24, Kampala Road",
  streetAddress: "Plot 24, Kampala Road",
  district: "Kampala",
  gpsCoordinates: "0.3476,32.5825",
  city: "Kampala",
  country: "Uganda",
  phone: "+256 700 000 000",
  phoneNumbers: ["+256 700 000 000"],
  email: "frontdesk@jambo.ug",
  website: "https://jambosphere.ug",
  businessName: "Jambo Sphere Ltd",
  businessRegistrationNumber: "BN-12345678",
  tradingLicenseNumber: "TL-KLA-2024-001",
  standardCheckinTime: "14:00:00",
  standardCheckoutTime: "11:00:00",
  defaultCurrency: "UGX",
  timezone: "Africa/Kampala",
  lateCheckoutHalfCutoff: "15:00:00",
  numberOfFloors: 5,
  totalRoomCount: 21,
  folioAdjAgentThreshold: 10_000,
  folioAdjPmThreshold: 50_000,
  requisitionApprovalThreshold: 500_000,
  creditGracePeriodDays: 14,
  auditTime: "23:00",
  tin: "1000123456",
  efrisDeviceNo: "TCSe3bc4b1488854572",
  vatRate: 0.18,
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2026-06-26T00:00:00Z",
};

const MISC_CHARGE_ITEMS: MiscChargeItem[] = [
  /* Pool */
  { id: "MCI001", name: "Pool Access (Adult)", description: "Full-day access to main swimming pool", defaultPrice: 20_000, departmentCode: "POOL", isActive: true },
  { id: "MCI002", name: "Pool Access (Child)", description: "Full-day access for children under 12", defaultPrice: 10_000, departmentCode: "POOL", isActive: true },
  { id: "MCI003", name: "Pool Towel Rental", description: "Fresh towel rental at poolside", defaultPrice: 5_000, departmentCode: "POOL", isActive: true },
  { id: "MCI004", name: "Swim Lesson (1 hr)", description: "One-on-one professional swimming instruction", defaultPrice: 30_000, departmentCode: "POOL", isActive: true },
  { id: "MCI005", name: "Poolside Drink Service", description: "Waiter-served beverages at pool loungers", defaultPrice: 5_000, departmentCode: "POOL", isActive: true },
  /* Kids Pool */
  { id: "MCI006", name: "Kids Pool Access", description: "Supervised access to dedicated children's pool", defaultPrice: 8_000, departmentCode: "KPOOL", isActive: true },
  { id: "MCI007", name: "Kids Swim Lesson (30 min)", description: "Gentle introduction to water for ages 3–8", defaultPrice: 20_000, departmentCode: "KPOOL", isActive: true },
  { id: "MCI008", name: "Pool Toys Rental", description: "Floaties, balls and water toys", defaultPrice: 10_000, departmentCode: "KPOOL", isActive: true },
  { id: "MCI009", name: "Kids Splash Session", description: "45-min supervised water play session", defaultPrice: 12_000, departmentCode: "KPOOL", isActive: true },
  /* Recreation */
  { id: "MCI010", name: "Tennis Court (1 hr)", description: "Flood-lit hard court rental", defaultPrice: 25_000, departmentCode: "REC", isActive: true },
  { id: "MCI011", name: "Games Room Access", description: "Table tennis, pool table, board games", defaultPrice: 10_000, departmentCode: "REC", isActive: true },
  { id: "MCI012", name: "Bicycle Rental (per hr)", description: "Mountain bike with helmet included", defaultPrice: 15_000, departmentCode: "REC", isActive: true },
  { id: "MCI013", name: "Guided Nature Walk", description: "2-hour guided tour of hotel grounds", defaultPrice: 20_000, departmentCode: "REC", isActive: true },
  { id: "MCI014", name: "Tennis Racket Rental", description: "Premium racket rental per session", defaultPrice: 10_000, departmentCode: "REC", isActive: true },
  /* Business Center */
  { id: "MCI015", name: "Computer Workstation", description: "Private workstation with printer access", defaultPrice: 10_000, departmentCode: "BIZ", isActive: true },
  { id: "MCI016", name: "Printing / Faxing", description: "Per-page black & white or fax", defaultPrice: 2_000, departmentCode: "BIZ", isActive: true },
  { id: "MCI017", name: "Meeting Room (Small)", description: "Boardroom for up to 6 pax with AV", defaultPrice: 50_000, departmentCode: "BIZ", isActive: true },
  { id: "MCI018", name: "Courier / Parcel Service", description: "Domestic courier dispatch", defaultPrice: 25_000, departmentCode: "BIZ", isActive: true },
  /* Conference */
  { id: "MCI019", name: "Conference Room (Full Day)", description: "Main hall for up to 80 pax", defaultPrice: 500_000, departmentCode: "CONF", isActive: true },
  { id: "MCI020", name: "AV Equipment Package", description: "Projector, screen, sound system, microphones", defaultPrice: 100_000, departmentCode: "CONF", isActive: true },
  { id: "MCI021", name: "Conference Catering (per head)", description: "Full-day tea break & lunch buffet", defaultPrice: 45_000, departmentCode: "CONF", isActive: true },
  { id: "MCI022", name: "Breakout Room (Half Day)", description: "Small meeting room for up to 12 pax", defaultPrice: 150_000, departmentCode: "CONF", isActive: true },
  /* Front Desk / Misc */
  { id: "MCI023", name: "Airport Pickup", description: "Private sedan transfer from Entebbe", defaultPrice: 50_000, departmentCode: "MISC", isActive: true },
  { id: "MCI024", name: "Extra Mattress", description: "Roll-away bed setup in room", defaultPrice: 30_000, departmentCode: "MISC", isActive: true },
  { id: "MCI025", name: "Late Checkout Fee", description: "Late checkout up to 6pm (subject to availability)", defaultPrice: 50_000, departmentCode: "MISC", isActive: true },
  { id: "MCI026", name: "Early Check-in Fee", description: "Early check-in from 8am (subject to availability)", defaultPrice: 40_000, departmentCode: "MISC", isActive: true },
  { id: "MCI027", name: "Crib / Cot", description: "Baby cot with bedding", defaultPrice: 25_000, departmentCode: "MISC", isActive: true },
];

/* ============================== Inventory Seed ============================== */

const STOCK_CATEGORIES: StockCategory[] = [
  { id: "SC001", propertyId: "T001", name: "Beverages", isActive: true, createdAt: new Date().toISOString() },
  { id: "SC002", propertyId: "T001", name: "Bar & Minibar", isActive: true, createdAt: new Date().toISOString() },
  { id: "SC003", propertyId: "T001", name: "F&B Ingredients", isActive: true, createdAt: new Date().toISOString() },
  { id: "SC004", propertyId: "T001", name: "Wellness & Spa", isActive: true, createdAt: new Date().toISOString() },
  { id: "SC005", propertyId: "T001", name: "Housekeeping Supplies", isActive: true, createdAt: new Date().toISOString() },
  { id: "SC006", propertyId: "T001", name: "Maintenance & Engineering", isActive: true, createdAt: new Date().toISOString() },
  { id: "SC007", propertyId: "T001", name: "Office Consumables", isActive: true, createdAt: new Date().toISOString() },
];

const STORAGE_LOCATIONS: StorageLocation[] = [
  { id: "SL001", propertyId: "T001", name: "Main Store", description: "General & dry goods store", isActive: true, createdAt: new Date().toISOString() },
  { id: "SL002", propertyId: "T001", name: "Kitchen Store", outletId: "PO001", description: "F&B ingredients, cold room & pantry", isActive: true, createdAt: new Date().toISOString() },
  { id: "SL003", propertyId: "T001", name: "Bar Store", outletId: "PO002", description: "Spirits, beer, wine & minibar stock", isActive: true, createdAt: new Date().toISOString() },
  { id: "SL004", propertyId: "T001", name: "Housekeeping Store", description: "Linen, toiletries & amenities", isActive: true, createdAt: new Date().toISOString() },
  { id: "SL005", propertyId: "T001", name: "Engineering Store", description: "Maintenance & repair supplies", isActive: true, createdAt: new Date().toISOString() },
  { id: "SL006", propertyId: "T001", name: "Office Store", description: "Office & stationery consumables", isActive: true, createdAt: new Date().toISOString() },
  { id: "SL007", propertyId: "T001", name: "Spa & Fitness Store", outletId: "PO003", description: "Spa treatments, gym towels & wellness retail", isActive: true, createdAt: new Date().toISOString() },
];

const STOCK_ITEMS: StockItem[] = [
  /* Beverages */
  { id: "SI001", propertyId: "T001", name: "Coca Cola (330ml)", unit: "bottles", stockCategoryId: "SC001", storageLocationId: "SL001", location: "Dry Store A — Drinks", locationQuantities: { SL001: 88, SL003: 12 }, sku: "FNB-BEV-0001", reorderLevel: 20, currentQuantity: 100, unitCost: 2500, unitPrice: 5000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI002", propertyId: "T001", name: "Fanta Orange (330ml)", unit: "bottles", stockCategoryId: "SC001", storageLocationId: "SL001", location: "Dry Store A — Drinks", sku: "FNB-BEV-0002", reorderLevel: 20, currentQuantity: 80, unitCost: 2500, unitPrice: 5000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI003", propertyId: "T001", name: "Sprite (330ml)", unit: "bottles", stockCategoryId: "SC001", storageLocationId: "SL001", location: "Dry Store A — Drinks", sku: "FNB-BEV-0003", reorderLevel: 20, currentQuantity: 90, unitCost: 2500, unitPrice: 5000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI004", propertyId: "T001", name: "Mineral Water (500ml)", unit: "bottles", stockCategoryId: "SC001", storageLocationId: "SL001", location: "Dry Store A — Drinks", locationQuantities: { SL001: 176, SL003: 24 }, sku: "FNB-BEV-0004", reorderLevel: 50, currentQuantity: 200, unitCost: 1500, unitPrice: 3000, isActive: true, createdAt: new Date().toISOString() },
  /* Bar & Minibar */
  { id: "SI005", propertyId: "T001", name: "Johnnie Walker Red", unit: "bottles", stockCategoryId: "SC002", storageLocationId: "SL003", location: "Spirits Rack 1", sku: "BAR-LIQ-0001", reorderLevel: 10, currentQuantity: 15, unitCost: 22000, unitPrice: 35000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI006", propertyId: "T001", name: "Jameson Irish Whiskey", unit: "bottles", stockCategoryId: "SC002", storageLocationId: "SL003", location: "Spirits Rack 1", sku: "BAR-LIQ-0002", reorderLevel: 10, currentQuantity: 12, unitCost: 18000, unitPrice: 30000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI007", propertyId: "T001", name: "Smirnoff Vodka", unit: "bottles", stockCategoryId: "SC002", storageLocationId: "SL003", location: "Spirits Rack 2", sku: "BAR-LIQ-0003", reorderLevel: 10, currentQuantity: 20, unitCost: 15000, unitPrice: 25000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI008", propertyId: "T001", name: "Beefeater Gin", unit: "bottles", stockCategoryId: "SC002", storageLocationId: "SL003", location: "Spirits Rack 2", sku: "BAR-LIQ-0004", reorderLevel: 10, currentQuantity: 8, unitCost: 17000, unitPrice: 28000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI009", propertyId: "T001", name: "Captain Morgan Rum", unit: "bottles", stockCategoryId: "SC002", storageLocationId: "SL003", location: "Spirits Rack 3", sku: "BAR-LIQ-0005", reorderLevel: 10, currentQuantity: 14, unitCost: 16000, unitPrice: 26000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI010", propertyId: "T001", name: "Local Waragi", unit: "bottles", stockCategoryId: "SC002", storageLocationId: "SL003", location: "Spirits Rack 3", sku: "BAR-LIQ-0006", reorderLevel: 15, currentQuantity: 25, unitCost: 8000, unitPrice: 15000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI027", propertyId: "T001", name: "Heineken 330ml", unit: "bottles", stockCategoryId: "SC002", storageLocationId: "SL003", location: "Bar Cooler", sku: "BAR-BER-0001", reorderLevel: 24, currentQuantity: 60, unitCost: 9000, unitPrice: 15000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI028", propertyId: "T001", name: "Nile Special 500ml", unit: "bottles", stockCategoryId: "SC002", storageLocationId: "SL003", location: "Bar Cooler", sku: "BAR-BER-0002", reorderLevel: 24, currentQuantity: 72, unitCost: 6500, unitPrice: 12000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI029", propertyId: "T001", name: "Red Wine (187ml)", unit: "bottles", stockCategoryId: "SC002", storageLocationId: "SL003", location: "Wine Store", sku: "BAR-WIN-0001", reorderLevel: 12, currentQuantity: 24, unitCost: 14000, unitPrice: 25000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI030", propertyId: "T001", name: "Assorted Nuts", unit: "pcs", stockCategoryId: "SC002", storageLocationId: "SL003", location: "Bar Store", sku: "BAR-SNK-0001", reorderLevel: 10, currentQuantity: 20, unitCost: 5500, unitPrice: 10000, isActive: true, createdAt: new Date().toISOString() },
  /* F&B Ingredients */
  { id: "SI017", propertyId: "T001", name: "Cooking Oil (5L)", unit: "liters", stockCategoryId: "SC003", storageLocationId: "SL002", location: "Dry Store B — Pantry", sku: "FNB-ING-0001", reorderLevel: 8, currentQuantity: 25, unitCost: 45000, unitPrice: 55000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI018", propertyId: "T001", name: "White Rice (10kg bag)", unit: "bags", stockCategoryId: "SC003", storageLocationId: "SL002", location: "Dry Store B — Pantry", sku: "FNB-ING-0002", reorderLevel: 10, currentQuantity: 30, unitCost: 42000, unitPrice: 50000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI019", propertyId: "T001", name: "Tomatoes (10kg box)", unit: "boxes", stockCategoryId: "SC003", storageLocationId: "SL002", location: "Cold Room", sku: "FNB-ING-0003", reorderLevel: 5, currentQuantity: 12, unitCost: 25000, unitPrice: 35000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI020", propertyId: "T001", name: "Onions (10kg bag)", unit: "bags", stockCategoryId: "SC003", storageLocationId: "SL002", location: "Dry Store B — Pantry", sku: "FNB-ING-0004", reorderLevel: 5, currentQuantity: 10, unitCost: 18000, unitPrice: 26000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI021", propertyId: "T001", name: "Fresh Milk (liter)", unit: "liters", stockCategoryId: "SC003", storageLocationId: "SL002", location: "Cold Room", sku: "FNB-ING-0005", reorderLevel: 30, currentQuantity: 50, unitCost: 3500, unitPrice: 5000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI022", propertyId: "T001", name: "Sugar (10kg bag)", unit: "bags", stockCategoryId: "SC003", storageLocationId: "SL002", location: "Dry Store B — Pantry", sku: "FNB-ING-0006", reorderLevel: 6, currentQuantity: 15, unitCost: 28000, unitPrice: 36000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI023", propertyId: "T001", name: "All-Purpose Flour (10kg)", unit: "bags", stockCategoryId: "SC003", storageLocationId: "SL002", location: "Dry Store B — Pantry", sku: "FNB-ING-0007", reorderLevel: 6, currentQuantity: 14, unitCost: 30000, unitPrice: 38000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI024", propertyId: "T001", name: "Beef (kg)", unit: "kg", stockCategoryId: "SC003", storageLocationId: "SL002", location: "Cold Room", sku: "FNB-ING-0008", reorderLevel: 15, currentQuantity: 20, unitCost: 18000, unitPrice: 24000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI025", propertyId: "T001", name: "Fresh Tilapia (kg)", unit: "kg", stockCategoryId: "SC003", storageLocationId: "SL002", location: "Cold Room", sku: "FNB-ING-0009", reorderLevel: 10, currentQuantity: 8, unitCost: 15000, unitPrice: 22000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI026", propertyId: "T001", name: "Whole Chicken", unit: "pcs", stockCategoryId: "SC003", storageLocationId: "SL002", location: "Cold Room", sku: "FNB-ING-0010", reorderLevel: 10, currentQuantity: 18, unitCost: 14000, unitPrice: 19000, isActive: true, createdAt: new Date().toISOString() },
  /* Wellness & Spa */
  { id: "SI011", propertyId: "T001", name: "Massage Oil (500ml)", unit: "bottles", stockCategoryId: "SC004", storageLocationId: "SL007", location: "Spa Store", sku: "SPA-WEL-0001", reorderLevel: 5, currentQuantity: 10, unitCost: 12000, unitPrice: 25000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI012", propertyId: "T001", name: "Essential Oil Blend", unit: "bottles", stockCategoryId: "SC004", storageLocationId: "SL007", location: "Spa Store", sku: "SPA-WEL-0002", reorderLevel: 5, currentQuantity: 8, unitCost: 15000, unitPrice: 30000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI013", propertyId: "T001", name: "Face Mask Sheets", unit: "pcs", stockCategoryId: "SC004", storageLocationId: "SL007", location: "Spa Store", sku: "SPA-WEL-0003", reorderLevel: 20, currentQuantity: 50, unitCost: 3000, unitPrice: 8000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI014", propertyId: "T001", name: "Body Scrub (200g)", unit: "pcs", stockCategoryId: "SC004", storageLocationId: "SL007", location: "Spa Store", sku: "SPA-WEL-0004", reorderLevel: 5, currentQuantity: 7, unitCost: 10000, unitPrice: 20000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI015", propertyId: "T001", name: "Gym Towel (Large)", unit: "pcs", stockCategoryId: "SC004", storageLocationId: "SL007", location: "Fitness Centre", sku: "SPA-WEL-0005", reorderLevel: 30, currentQuantity: 45, unitCost: 5000, unitPrice: 12000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI016", propertyId: "T001", name: "Protein Bar", unit: "pcs", stockCategoryId: "SC004", storageLocationId: "SL007", location: "Fitness Centre", sku: "SPA-WEL-0006", reorderLevel: 20, currentQuantity: 35, unitCost: 4000, unitPrice: 8000, isActive: true, createdAt: new Date().toISOString() },
  /* Housekeeping Supplies */
  { id: "SI031", propertyId: "T001", name: "King Fitted Sheet", unit: "pcs", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Linen Room", sku: "HSK-LIN-0001", reorderLevel: 40, currentQuantity: 80, unitCost: 28000, unitPrice: 45000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI032", propertyId: "T001", name: "Queen Fitted Sheet", unit: "pcs", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Linen Room", sku: "HSK-LIN-0002", reorderLevel: 40, currentQuantity: 75, unitCost: 26000, unitPrice: 42000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI033", propertyId: "T001", name: "Bath Towel (XL)", unit: "pcs", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Linen Room", sku: "HSK-LIN-0003", reorderLevel: 100, currentQuantity: 180, unitCost: 12000, unitPrice: 22000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI034", propertyId: "T001", name: "Hand Towel", unit: "pcs", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Linen Room", sku: "HSK-LIN-0004", reorderLevel: 60, currentQuantity: 120, unitCost: 6000, unitPrice: 12000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI035", propertyId: "T001", name: "Duvet Cover (King)", unit: "pcs", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Linen Room", sku: "HSK-LIN-0005", reorderLevel: 30, currentQuantity: 55, unitCost: 35000, unitPrice: 55000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI036", propertyId: "T001", name: "Toilet Paper (roll)", unit: "rolls", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Housekeeping Store", sku: "HSK-TOI-0001", reorderLevel: 200, currentQuantity: 350, unitCost: 2500, unitPrice: 5000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI037", propertyId: "T001", name: "Bar Soap", unit: "pcs", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Housekeeping Store", sku: "HSK-TOI-0002", reorderLevel: 100, currentQuantity: 200, unitCost: 2000, unitPrice: 4000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI038", propertyId: "T001", name: "Shampoo (250ml)", unit: "bottles", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Housekeeping Store", sku: "HSK-TOI-0003", reorderLevel: 60, currentQuantity: 90, unitCost: 5000, unitPrice: 9000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI039", propertyId: "T001", name: "Conditioner (250ml)", unit: "bottles", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Housekeeping Store", sku: "HSK-TOI-0004", reorderLevel: 50, currentQuantity: 80, unitCost: 5000, unitPrice: 9000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI040", propertyId: "T001", name: "Body Lotion (200ml)", unit: "bottles", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Housekeeping Store", sku: "HSK-TOI-0005", reorderLevel: 50, currentQuantity: 70, unitCost: 5500, unitPrice: 9500, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI041", propertyId: "T001", name: "Toothbrush Kit", unit: "pcs", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Housekeeping Store", sku: "HSK-AME-0001", reorderLevel: 40, currentQuantity: 100, unitCost: 3000, unitPrice: 6000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI042", propertyId: "T001", name: "Bathrobe", unit: "pcs", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Linen Room", sku: "HSK-AME-0002", reorderLevel: 20, currentQuantity: 35, unitCost: 25000, unitPrice: 40000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI043", propertyId: "T001", name: "Slippers (pair)", unit: "pairs", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Housekeeping Store", sku: "HSK-AME-0003", reorderLevel: 40, currentQuantity: 90, unitCost: 3500, unitPrice: 7000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI044", propertyId: "T001", name: "Cloth Hangers (set)", unit: "sets", stockCategoryId: "SC005", storageLocationId: "SL004", location: "Housekeeping Store", sku: "HSK-AME-0004", reorderLevel: 20, currentQuantity: 45, unitCost: 4000, unitPrice: 8000, isActive: true, createdAt: new Date().toISOString() },
  /* Maintenance & Engineering */
  { id: "SI045", propertyId: "T001", name: "LED Bulb (9W)", unit: "pcs", stockCategoryId: "SC006", storageLocationId: "SL005", location: "Engineering Store", sku: "MNT-ELE-0001", reorderLevel: 30, currentQuantity: 60, unitCost: 4500, unitPrice: 8000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI046", propertyId: "T001", name: "LED Bulb (18W)", unit: "pcs", stockCategoryId: "SC006", storageLocationId: "SL005", location: "Engineering Store", sku: "MNT-ELE-0002", reorderLevel: 20, currentQuantity: 40, unitCost: 6000, unitPrice: 10000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI047", propertyId: "T001", name: "Electrical Fuse (13A)", unit: "pcs", stockCategoryId: "SC006", storageLocationId: "SL005", location: "Engineering Store", sku: "MNT-ELE-0003", reorderLevel: 30, currentQuantity: 55, unitCost: 1500, unitPrice: 3000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI048", propertyId: "T001", name: "PVC Pipe (1in, 3m)", unit: "pcs", stockCategoryId: "SC006", storageLocationId: "SL005", location: "Engineering Store", sku: "MNT-PLM-0001", reorderLevel: 15, currentQuantity: 30, unitCost: 12000, unitPrice: 18000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI049", propertyId: "T001", name: "Pipe Fittings Set", unit: "sets", stockCategoryId: "SC006", storageLocationId: "SL005", location: "Engineering Store", sku: "MNT-PLM-0002", reorderLevel: 10, currentQuantity: 18, unitCost: 9000, unitPrice: 15000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI050", propertyId: "T001", name: "Wall Paint (5L)", unit: "liters", stockCategoryId: "SC006", storageLocationId: "SL005", location: "Engineering Store", sku: "MNT-PNT-0001", reorderLevel: 8, currentQuantity: 14, unitCost: 45000, unitPrice: 60000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI051", propertyId: "T001", name: "Ceiling Fan", unit: "pcs", stockCategoryId: "SC006", storageLocationId: "SL005", location: "Engineering Store", sku: "MNT-HVAC-0001", reorderLevel: 4, currentQuantity: 8, unitCost: 85000, unitPrice: 110000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI052", propertyId: "T001", name: "Door Lock Set", unit: "sets", stockCategoryId: "SC006", storageLocationId: "SL005", location: "Engineering Store", sku: "MNT-HDW-0001", reorderLevel: 6, currentQuantity: 12, unitCost: 15000, unitPrice: 24000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI053", propertyId: "T001", name: "Duct Tape (roll)", unit: "rolls", stockCategoryId: "SC006", storageLocationId: "SL005", location: "Engineering Store", sku: "MNT-GEN-0001", reorderLevel: 10, currentQuantity: 25, unitCost: 3500, unitPrice: 6000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI054", propertyId: "T001", name: "Extension Cable (10m)", unit: "pcs", stockCategoryId: "SC006", storageLocationId: "SL005", location: "Engineering Store", sku: "MNT-ELE-0004", reorderLevel: 6, currentQuantity: 10, unitCost: 28000, unitPrice: 40000, isActive: true, createdAt: new Date().toISOString() },
  /* Office Consumables */
  { id: "SI055", propertyId: "T001", name: "A4 Paper (ream)", unit: "reams", stockCategoryId: "SC007", storageLocationId: "SL006", location: "Office Store", sku: "OFF-STN-0001", reorderLevel: 30, currentQuantity: 60, unitCost: 15000, unitPrice: 22000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI056", propertyId: "T001", name: "Ballpoint Pens (box)", unit: "boxes", stockCategoryId: "SC007", storageLocationId: "SL006", location: "Office Store", sku: "OFF-STN-0002", reorderLevel: 20, currentQuantity: 40, unitCost: 12000, unitPrice: 18000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI057", propertyId: "T001", name: "Toner Cartridge", unit: "pcs", stockCategoryId: "SC007", storageLocationId: "SL006", location: "Office Store", sku: "OFF-TNR-0001", reorderLevel: 5, currentQuantity: 9, unitCost: 95000, unitPrice: 130000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI058", propertyId: "T001", name: "Stapler", unit: "pcs", stockCategoryId: "SC007", storageLocationId: "SL006", location: "Office Store", sku: "OFF-STN-0003", reorderLevel: 8, currentQuantity: 15, unitCost: 8000, unitPrice: 12000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI059", propertyId: "T001", name: "Staples (box)", unit: "boxes", stockCategoryId: "SC007", storageLocationId: "SL006", location: "Office Store", sku: "OFF-STN-0004", reorderLevel: 10, currentQuantity: 22, unitCost: 3000, unitPrice: 5000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI060", propertyId: "T001", name: "Ring Binders (pack)", unit: "packs", stockCategoryId: "SC007", storageLocationId: "SL006", location: "Office Store", sku: "OFF-STN-0005", reorderLevel: 10, currentQuantity: 18, unitCost: 14000, unitPrice: 20000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI061", propertyId: "T001", name: "Filing Folders (pack)", unit: "packs", stockCategoryId: "SC007", storageLocationId: "SL006", location: "Office Store", sku: "OFF-STN-0006", reorderLevel: 15, currentQuantity: 26, unitCost: 9000, unitPrice: 14000, isActive: true, createdAt: new Date().toISOString() },
  { id: "SI062", propertyId: "T001", name: "Printer Ink (set)", unit: "sets", stockCategoryId: "SC007", storageLocationId: "SL006", location: "Office Store", sku: "OFF-TNR-0002", reorderLevel: 5, currentQuantity: 8, unitCost: 65000, unitPrice: 90000, isActive: true, createdAt: new Date().toISOString() },
];

const SUPPLIERS: Supplier[] = [
  { id: "SUP001", propertyId: "T001", name: "Jinja Beverages Ltd", contactPerson: "Peter Kigozi", phone: "+256-700-111-222", email: "orders@jinjabev.co.ug", address: "Plot 12, Main Street, Jinja", taxId: "VAT-1001-2024", paymentTerms: "Net 30", isActive: true, createdAt: new Date().toISOString() },
  { id: "SUP002", propertyId: "T001", name: "Uganda Distillers Ltd", contactPerson: "Sarah Nabatanzi", phone: "+256-700-333-444", email: "sales@ugandadistillers.ug", address: "Lubowa Industrial Park, Kampala", taxId: "VAT-2002-2024", paymentTerms: "Net 45", isActive: true, createdAt: new Date().toISOString() },
  { id: "SUP003", propertyId: "T001", name: "Nature's Touch Spa Supplies", contactPerson: "Grace Okello", phone: "+256-700-555-666", email: "info@naturestouch.ug", address: "Acacia Mall, Kololo, Kampala", paymentTerms: "Net 30", isActive: true, createdAt: new Date().toISOString() },
  { id: "SUP004", propertyId: "T001", name: "Fresh Foods Uganda", contactPerson: "John Mugisha", phone: "+256-700-777-888", email: "orders@freshfoods.ug", address: "Kalwezi Market, Nakasero, Kampala", taxId: "VAT-3003-2024", paymentTerms: "Net 15", isActive: true, createdAt: new Date().toISOString() },
];

const STOCK_MOVEMENTS: StockMovement[] = [
  { id: "SM001", stockItemId: "SI001", type: "purchase_receipt", quantity: 50, balanceBefore: 50, balanceAfter: 100, referenceType: "purchase_order", referenceId: "PO002", createdBy: "U004", createdAt: new Date("2026-07-30T11:00:00").toISOString() },
  { id: "SM002", stockItemId: "SI004", type: "purchase_receipt", quantity: 100, balanceBefore: 100, balanceAfter: 200, referenceType: "purchase_order", referenceId: "PO002", createdBy: "U004", createdAt: new Date("2026-07-30T11:05:00").toISOString() },
  { id: "SM003", stockItemId: "SI024", type: "purchase_receipt", quantity: 15, balanceBefore: 5, balanceAfter: 20, referenceType: "purchase_order", referenceId: "PO001", createdBy: "U004", createdAt: new Date("2026-07-28T09:30:00").toISOString() },
];

const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: "PO001", propertyId: "T001", supplierId: "SUP004", orderNumber: "PO-2026-07-28-PO001", status: "received", notes: "Weekly kitchen produce order", createdBy: "U004", approvedBy: "U001", approvedAt: new Date("2026-07-28T09:00:00").toISOString(), receivedAt: new Date("2026-07-28T09:30:00").toISOString(), totalAmount: 485000, createdAt: new Date("2026-07-28T08:00:00").toISOString() },
  { id: "PO002", propertyId: "T001", supplierId: "SUP001", orderNumber: "PO-2026-07-30-PO002", status: "received", notes: "Restock soft drinks", createdBy: "U004", approvedBy: "U001", approvedAt: new Date("2026-07-30T10:00:00").toISOString(), receivedAt: new Date("2026-07-30T11:00:00").toISOString(), totalAmount: 275000, createdAt: new Date("2026-07-30T09:00:00").toISOString() },
  { id: "PO003", propertyId: "T001", supplierId: "SUP002", orderNumber: "PO-2026-07-31-PO003", status: "sent", notes: "Bar spirits restock", createdBy: "U004", approvedBy: "U001", approvedAt: new Date("2026-07-31T14:00:00").toISOString(), sentAt: new Date("2026-07-31T14:30:00").toISOString(), sentVia: "whatsapp", totalAmount: 380000, createdAt: new Date("2026-07-31T12:00:00").toISOString() },
];

const PURCHASE_ORDER_ITEMS: PurchaseOrderItem[] = [
  { id: "POI001", purchaseOrderId: "PO001", stockItemId: "SI024", quantityOrdered: 15, quantityReceived: 15, unitCost: 18000, lineTotal: 270000 },
  { id: "POI002", purchaseOrderId: "PO001", stockItemId: "SI019", quantityOrdered: 5, quantityReceived: 5, unitCost: 25000, lineTotal: 125000 },
  { id: "POI003", purchaseOrderId: "PO001", stockItemId: "SI020", quantityOrdered: 5, quantityReceived: 5, unitCost: 18000, lineTotal: 90000 },
  { id: "POI004", purchaseOrderId: "PO002", stockItemId: "SI001", quantityOrdered: 50, quantityReceived: 50, unitCost: 2500, lineTotal: 125000 },
  { id: "POI005", purchaseOrderId: "PO002", stockItemId: "SI004", quantityOrdered: 100, quantityReceived: 100, unitCost: 1500, lineTotal: 150000 },
  { id: "POI006", purchaseOrderId: "PO003", stockItemId: "SI005", quantityOrdered: 10, quantityReceived: 0, unitCost: 22000, lineTotal: 220000 },
  { id: "POI007", purchaseOrderId: "PO003", stockItemId: "SI010", quantityOrdered: 20, quantityReceived: 0, unitCost: 8000, lineTotal: 160000 },
];

const GOODS_RECEIPTS: GoodsReceipt[] = [
  { id: "GRN001", propertyId: "T001", poId: "PO001", receivedBy: "U004", receivedAt: new Date("2026-07-28T09:30:00").toISOString(), notes: "Full delivery — kitchen produce", createdAt: new Date("2026-07-28T09:30:00").toISOString() },
  { id: "GRN002", propertyId: "T001", poId: "PO002", receivedBy: "U004", receivedAt: new Date("2026-07-30T11:00:00").toISOString(), notes: "Full delivery — soft drinks", createdAt: new Date("2026-07-30T11:00:00").toISOString() },
];

const GOODS_RECEIPT_ITEMS: GoodsReceiptItem[] = [
  { id: "GRNI001", goodsReceiptId: "GRN001", stockItemId: "SI024", quantityReceived: 15, unitCost: 18000, lineTotal: 270000 },
  { id: "GRNI002", goodsReceiptId: "GRN001", stockItemId: "SI019", quantityReceived: 5, unitCost: 25000, lineTotal: 125000 },
  { id: "GRNI003", goodsReceiptId: "GRN001", stockItemId: "SI020", quantityReceived: 5, unitCost: 18000, lineTotal: 90000 },
  { id: "GRNI004", goodsReceiptId: "GRN002", stockItemId: "SI001", quantityReceived: 50, unitCost: 2500, lineTotal: 125000 },
  { id: "GRNI005", goodsReceiptId: "GRN002", stockItemId: "SI004", quantityReceived: 100, unitCost: 1500, lineTotal: 150000 },
];

const SUPPLIER_INVOICES: SupplierInvoice[] = [
  { id: "SPI001", propertyId: "T001", supplierId: "SUP004", poId: "PO001", invoiceNo: "INV-2026-001", invoiceDate: new Date("2026-07-29T00:00:00").toISOString(), amount: 485000, status: "paid", paidAmount: 485000, notes: "Weekly kitchen produce", createdBy: "U002", createdAt: new Date("2026-07-29T10:00:00").toISOString() },
  { id: "SPI002", propertyId: "T001", supplierId: "SUP001", poId: "PO002", invoiceNo: "INV-2026-002", invoiceDate: new Date("2026-07-31T00:00:00").toISOString(), amount: 275000, status: "matched", notes: "Soft drinks restock", createdBy: "U002", createdAt: new Date("2026-07-31T09:00:00").toISOString() },
];

const SUPPLIER_INVOICE_LINES: SupplierInvoiceLine[] = [
  { id: "SPIL001", supplierInvoiceId: "SPI001", stockItemId: "SI024", quantity: 15, unitCost: 18000, lineTotal: 270000 },
  { id: "SPIL002", supplierInvoiceId: "SPI001", stockItemId: "SI019", quantity: 5, unitCost: 25000, lineTotal: 125000 },
  { id: "SPIL003", supplierInvoiceId: "SPI001", stockItemId: "SI020", quantity: 5, unitCost: 18000, lineTotal: 90000 },
  { id: "SPIL004", supplierInvoiceId: "SPI002", stockItemId: "SI001", quantity: 50, unitCost: 2500, lineTotal: 125000 },
  { id: "SPIL005", supplierInvoiceId: "SPI002", stockItemId: "SI004", quantity: 100, unitCost: 1500, lineTotal: 150000 },
];

const SUPPLIER_PAYMENTS: SupplierPayment[] = [
  { id: "SPP001", propertyId: "T001", supplierInvoiceId: "SPI001", supplierId: "SUP004", amount: 485000, method: "bank_transfer", reference: "RTGS-20260729", paidBy: "U002", paidAt: new Date("2026-07-30T09:00:00").toISOString(), createdAt: new Date("2026-07-30T09:00:00").toISOString() },
];

const REQUISITIONS: Requisition[] = [];
const REQUISITION_ITEMS: RequisitionItem[] = [];

const STOCK_TRANSFERS: StockTransfer[] = [
  { id: "TR001", propertyId: "T001", fromStorageLocationId: "SL001", toStorageLocationId: "SL003", status: "completed", notes: "Restock bar with soft drinks & water", createdBy: "U004", completedBy: "U004", completedAt: new Date("2026-07-30T15:00:00").toISOString(), createdAt: new Date("2026-07-30T14:30:00").toISOString() },
  { id: "TR002", propertyId: "T001", fromStorageLocationId: "SL001", toStorageLocationId: "SL002", status: "pending", notes: "Kitchen cooking oil replenishment", createdBy: "U004", createdAt: new Date("2026-07-31T09:00:00").toISOString() },
];

const STOCK_TRANSFER_ITEMS: StockTransferItem[] = [
  { id: "STI001", transferId: "TR001", stockItemId: "SI004", quantity: 24 },
  { id: "STI002", transferId: "TR001", stockItemId: "SI001", quantity: 12 },
  { id: "STI003", transferId: "TR002", stockItemId: "SI017", quantity: 10 },
];

const STOCK_ADJUSTMENTS: StockAdjustment[] = [
  { id: "ADJ001", propertyId: "T001", type: "wastage", reasonCode: "WS-01", storageLocationId: "SL002", notes: "Tomatoes spoiled before use", status: "approved", createdBy: "U004", createdByRole: "Store Keeper", approvedBy: "U001", approvedByRole: "Owner / GM", approvedAt: new Date("2026-07-29T16:00:00").toISOString(), createdAt: new Date("2026-07-29T15:00:00").toISOString() },
  { id: "ADJ002", propertyId: "T001", type: "breakage", reasonCode: "BR-01", storageLocationId: "SL003", notes: "Broken wine bottles in cellar", status: "pending", createdBy: "U004", createdByRole: "Store Keeper", createdAt: new Date("2026-07-31T10:00:00").toISOString() },
];

const STOCK_ADJUSTMENT_ITEMS: StockAdjustmentItem[] = [
  { id: "ADJI001", adjustmentId: "ADJ001", stockItemId: "SI019", quantity: 2 },
  { id: "ADJI002", adjustmentId: "ADJ002", stockItemId: "SI029", quantity: 1 },
];

const STOCKTAKES: Stocktake[] = [
  {
    id: "ST001",
    propertyId: "T001",
    name: "Main Store July Count",
    storageLocationId: "SL001",
    plannedDate: "2026-07-31",
    notes: "End of month physical count",
    status: "finalized",
    createdBy: "U004",
    createdByRole: "Store Keeper",
    finalizedBy: "U004",
    finalizedAt: new Date("2026-07-31T11:00:00").toISOString(),
    createdAt: new Date("2026-07-31T09:00:00").toISOString(),
  },
];

const STOCKTAKE_ITEMS: StocktakeItem[] = [
  { id: "STKI001", stocktakeId: "ST001", stockItemId: "SI001", systemQuantity: 88, physicalQuantity: 86, unitCost: 2500, variance: -2, valueVariance: -5000 },
  { id: "STKI002", stocktakeId: "ST001", stockItemId: "SI004", systemQuantity: 176, physicalQuantity: 178, unitCost: 1500, variance: 2, valueVariance: 3000 },
  { id: "STKI003", stocktakeId: "ST001", stockItemId: "SI002", systemQuantity: 80, physicalQuantity: 80, unitCost: 2500, variance: 0, valueVariance: 0 },
];

const STOCK_PAR_LEVELS: StockParLevel[] = [
  { id: "PAR001", propertyId: "T001", stockItemId: "SI025", storageLocationId: "SL002", minLevel: 10, notes: "Daily fish requirement", createdAt: new Date().toISOString() },
  { id: "PAR002", propertyId: "T001", stockItemId: "SI008", storageLocationId: "SL003", minLevel: 10, createdAt: new Date().toISOString() },
  { id: "PAR003", propertyId: "T001", stockItemId: "SI033", storageLocationId: "SL004", minLevel: 100, maxLevel: 160, createdAt: new Date().toISOString() },
  { id: "PAR004", propertyId: "T001", stockItemId: "SI029", storageLocationId: "SL003", minLevel: 12, maxLevel: 24, createdAt: new Date().toISOString() },
];

/* ============================== Store ============================== */

const STORAGE_KEY = "jambo-pms-cache-v9";

function persistState() {
  try {
    const currentProp = state.properties.find((p) => p.id === state.currentPropertyId) ?? state.properties[0];
    if (currentProp && currentProp.id !== state.tenant.id) {
      state.tenant = { ...currentProp };
    }
    const snapshot = {
      tenant: state.tenant,
      properties: state.properties,
      currentPropertyId: state.currentPropertyId,
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
      roomInspections: state.roomInspections,
      maintenanceRequests: state.maintenanceRequests,
      dndRecords: state.dndRecords,
      cancellationPolicies: state.cancellationPolicies,
      ratePlans: state.ratePlans,
      corporateAccounts: state.corporateAccounts,
      travelAgentAccounts: state.travelAgentAccounts,
      groupBlocks: state.groupBlocks,
      roomAssignments: state.roomAssignments,
      deposits: state.deposits,
      checkInEvents: state.checkInEvents,
      keyCards: state.keyCards,
      serviceRequests: state.serviceRequests,
      messages: state.messages,
      wakeUpCalls: state.wakeUpCalls,
      lostFoundItems: state.lostFoundItems,
      agentLedgerEntries: state.agentLedgerEntries,
      approvalRequests: state.approvalRequests,
      reconciliationReports: state.reconciliationReports,
      reportAccessLogs: state.reportAccessLogs,
      scheduledReportConfigs: state.scheduledReportConfigs,
      posOutlets: state.posOutlets,
      menuCategories: state.menuCategories,
      menuItems: state.menuItems,
      menuModifiers: state.menuModifiers,
      menuItemRecipes: state.menuItemRecipes,
      menuItemSales: state.menuItemSales,
      posTables: state.posTables,
      posTabs: state.posTabs,
      posTabItems: state.posTabItems,
      kots: state.kots,
      kotItems: state.kotItems,
      posServicePeriods: state.posServicePeriods,
      lockoutSettings: state.lockoutSettings,
      paymentMethodConfig: state.paymentMethodConfig,
      currencyConfig: state.currencyConfig,
      mealPlanConfig: state.mealPlanConfig,
      idTypeConfig: state.idTypeConfig,
      roomTypeFilterConfig: state.roomTypeFilterConfig,
      notifications: state.notifications,
      notifSettings: state.notifSettings,
      miscChargeItems: state.miscChargeItems,
      stockCategories: state.stockCategories,
      storageLocations: state.storageLocations,
      stockItems: state.stockItems,
      stockMovements: state.stockMovements,
      suppliers: state.suppliers,
      purchaseOrders: state.purchaseOrders,
      purchaseOrderItems: state.purchaseOrderItems,
      requisitions: state.requisitions,
      requisitionItems: state.requisitionItems,
      stockTransfers: state.stockTransfers,
      stockTransferItems: state.stockTransferItems,
      stockAdjustments: state.stockAdjustments,
      stockAdjustmentItems: state.stockAdjustmentItems,
      stocktakes: state.stocktakes,
      stocktakeItems: state.stocktakeItems,
      stockParLevels: state.stockParLevels,
      goodsReceipts: state.goodsReceipts,
      goodsReceiptItems: state.goodsReceiptItems,
      supplierInvoices: state.supplierInvoices,
      supplierInvoiceLines: state.supplierInvoiceLines,
      supplierPayments: state.supplierPayments,
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
    const parsed = JSON.parse(raw) as Partial<State>;
    if (!parsed.properties || parsed.properties.length === 0) {
      parsed.properties = [parsed.tenant ?? TENANT];
    }
    if (!parsed.currentPropertyId) {
      parsed.currentPropertyId = parsed.tenant?.id ?? TENANT.id;
    }
    return parsed;
  } catch {
    return null;
  }
}

const persisted = loadPersistedState();

function withLocationQuantities(items: StockItem[]): StockItem[] {
  return items.map((i) => {
    if (i.locationQuantities) return i;
    if (!i.storageLocationId) return i;
    return { ...i, locationQuantities: { [i.storageLocationId]: i.currentQuantity } };
  });
}

const state: State = {
  tenant: persisted?.tenant ?? TENANT,
  properties: persisted?.properties ?? [TENANT],
  currentPropertyId: persisted?.currentPropertyId ?? TENANT.id,
  roomTypes: persisted?.roomTypes ?? ROOM_TYPES,
  rooms: persisted?.rooms ?? ROOMS.map((r) => ({ ...r, smokingAllowed: false, isActive: true, baseOccupancy: 2, maxOccupancy: r.propertyId === "T001" ? (ROOM_TYPES.find((rt) => rt.id === r.roomTypeId)?.maxOccupancy ?? 2) : 2 })),
  reservations: persisted?.reservations ?? RESERVATIONS,
  guests: persisted?.guests ?? GUESTS,
  folios: persisted?.folios ?? FOLIOS,
  charges: persisted?.charges ?? CHARGES,
  payments: persisted?.payments ?? PAYMENTS,
  invoices: persisted?.invoices ?? INVOICES,
  invoiceLineItems: persisted?.invoiceLineItems ?? INVOICE_LINE_ITEMS,
  users: persisted?.users ?? USERS,
  roles: (persisted?.roles ?? ROLES_DATA).map((r) => ({
    ...r,
    permissions: r.permissions ?? ROLE_PERMISSION_DEFAULTS[r.roleName] ?? [],
    customPermissions: r.customPermissions ?? [],
  })),
  userRoles: persisted?.userRoles ?? USER_ROLES_DATA,
  audit: persisted?.audit ?? AUDIT,
  cancellationPolicies: persisted?.cancellationPolicies ?? CANCELLATION_POLICIES,
  ratePlans: persisted?.ratePlans ?? RATE_PLANS,
  corporateAccounts: persisted?.corporateAccounts ?? CORP_ACCOUNTS,
  travelAgentAccounts: persisted?.travelAgentAccounts ?? TRAVEL_AGENTS,
  groupBlocks: persisted?.groupBlocks ?? GROUP_BLOCKS,
  roomAssignments: persisted?.roomAssignments ?? ROOM_ASSIGNMENTS,
  deposits: persisted?.deposits ?? DEPOSITS,
  checkInEvents: persisted?.checkInEvents ?? CHECK_IN_EVENTS,
  keyCards: persisted?.keyCards ?? KEY_CARDS,
  serviceRequests: persisted?.serviceRequests ?? SERVICE_REQUESTS,
  messages: persisted?.messages ?? [],
  wakeUpCalls: persisted?.wakeUpCalls ?? [],
  lostFoundItems: persisted?.lostFoundItems ?? [],
  housekeepingTasks: persisted?.housekeepingTasks ?? HK_TASKS,
  roomInspections: persisted?.roomInspections ?? ROOM_INSPECTIONS,
  maintenanceRequests: persisted?.maintenanceRequests ?? MAINT_REQUESTS,
  dndRecords: persisted?.dndRecords ?? DND_RECORDS,
  minibarItems: persisted?.minibarItems ?? MINIBAR_ITEMS,
  minibarLogs: persisted?.minibarLogs ?? MINIBAR_LOGS,
  agentLedgerEntries: persisted?.agentLedgerEntries ?? AGENT_LEDGER_ENTRIES,
  approvalRequests: persisted?.approvalRequests ?? [],
  reconciliationReports: persisted?.reconciliationReports ?? RECONCILIATION_REPORTS,
  reportAccessLogs: persisted?.reportAccessLogs ?? REPORT_ACCESS_LOGS,
  scheduledReportConfigs: persisted?.scheduledReportConfigs ?? SCHEDULED_REPORT_CONFIGS,
  posOutlets: persisted?.posOutlets ?? POS_OUTLETS,
  menuCategories: persisted?.menuCategories ?? MENU_CATEGORIES,
  menuItems: persisted?.menuItems ?? MENU_ITEMS,
  menuModifiers: persisted?.menuModifiers ?? MENU_MODIFIERS,
  menuItemRecipes: persisted?.menuItemRecipes ?? MENU_ITEM_RECIPES,
  menuItemSales: persisted?.menuItemSales ?? MENU_ITEM_SALES,
  posTables: persisted?.posTables ?? POS_TABLES,
  posTabs: persisted?.posTabs ?? POS_TABS,
  posTabItems: persisted?.posTabItems ?? POS_TAB_ITEMS,
  kots: persisted?.kots ?? KOTS,
  kotItems: persisted?.kotItems ?? KOT_ITEMS,
  posServicePeriods: persisted?.posServicePeriods ?? POS_SERVICE_PERIODS,
  notifications: persisted?.notifications ?? SEED_NOTIFICATIONS,
  notifSettings: persisted?.notifSettings ?? { email: true, sound: false, checkinReminders: true },
  lockoutSettings: persisted?.lockoutSettings ?? { enabled: false, maxAttempts: 5, lockoutMinutes: 15 },
  businessDate: persisted?.businessDate ?? iso(TODAY),
  auditStatus: persisted?.auditStatus ?? "idle",
  auditStartedAt: persisted?.auditStartedAt,
  auditCompletedAt: persisted?.auditCompletedAt,
  paymentMethodConfig: persisted?.paymentMethodConfig ?? { enabledMethods: [...ALL_PAYMENT_METHODS] },
  currencyConfig: persisted?.currencyConfig ?? { code: "UGX" },
  mealPlanConfig: persisted?.mealPlanConfig ?? { prices: { RO: 0, BB: 60000, HB: 140000, FB: 220000 } },
  idTypeConfig: persisted?.idTypeConfig ?? { types: ["Passport", "National ID", "Driving Permit", "Student", "Work ID"] },
  roomTypeFilterConfig: persisted?.roomTypeFilterConfig ?? { types: ["All", "Standard", "Deluxe", "Deluxe Single", "Deluxe Double", "Suite", "House Use", "Complementary"] },
  miscChargeItems: persisted?.miscChargeItems ?? MISC_CHARGE_ITEMS,
  stockCategories: persisted?.stockCategories ?? STOCK_CATEGORIES,
  storageLocations: persisted?.storageLocations ?? STORAGE_LOCATIONS,
  stockItems: withLocationQuantities(persisted?.stockItems ?? STOCK_ITEMS),
  stockMovements: persisted?.stockMovements ?? STOCK_MOVEMENTS,
  suppliers: persisted?.suppliers ?? SUPPLIERS,
  purchaseOrders: persisted?.purchaseOrders ?? PURCHASE_ORDERS,
  purchaseOrderItems: persisted?.purchaseOrderItems ?? PURCHASE_ORDER_ITEMS,
  requisitions: persisted?.requisitions ?? REQUISITIONS,
  requisitionItems: persisted?.requisitionItems ?? REQUISITION_ITEMS,
  stockTransfers: persisted?.stockTransfers ?? STOCK_TRANSFERS,
  stockTransferItems: persisted?.stockTransferItems ?? STOCK_TRANSFER_ITEMS,
  stockAdjustments: persisted?.stockAdjustments ?? STOCK_ADJUSTMENTS,
  stockAdjustmentItems: persisted?.stockAdjustmentItems ?? STOCK_ADJUSTMENT_ITEMS,
  stocktakes: persisted?.stocktakes ?? STOCKTAKES,
  stocktakeItems: persisted?.stocktakeItems ?? STOCKTAKE_ITEMS,
  stockParLevels: persisted?.stockParLevels ?? STOCK_PAR_LEVELS,
  goodsReceipts: persisted?.goodsReceipts ?? GOODS_RECEIPTS,
  goodsReceiptItems: persisted?.goodsReceiptItems ?? GOODS_RECEIPT_ITEMS,
  supplierInvoices: persisted?.supplierInvoices ?? SUPPLIER_INVOICES,
  supplierInvoiceLines: persisted?.supplierInvoiceLines ?? SUPPLIER_INVOICE_LINES,
  supplierPayments: persisted?.supplierPayments ?? SUPPLIER_PAYMENTS,
};

deactivateExpiredUsers();

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

/* Cross-tab sync — when another tab writes to localStorage, merge into this tab's in-memory state */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    const incoming = loadPersistedState();
    if (!incoming) return;
    const hadApprovalsBefore = state.approvalRequests.length;
    for (const key of Object.keys(incoming) as (keyof State)[]) {
      if (incoming[key] !== undefined) {
        (state as Record<string, unknown>)[key] = incoming[key] as never;
      }
    }
    const approvalsNow = state.approvalRequests.length;
    const pendingArr = state.approvalRequests.filter((r: ApprovalRequest) => r.status === "pending");
    console.log("[cross-tab-sync] storage event for", STORAGE_KEY, "| approvals:", hadApprovalsBefore, "→", approvalsNow, "| pending:", pendingArr.length, "| pending ids:", pendingArr.map((r: ApprovalRequest) => r.id));
    /* Notify React subscribers WITHOUT persisting (avoids write-back loop between tabs) */
    listeners.forEach((l) => l());
  });
}

export function useStore<T>(selector: (s: State) => T): T {
  const prevRef = useRef<T | undefined>(undefined);
  const getSnapshot = useCallback(() => {
    const next = selector(snap());
    if (!shallowEqual(prevRef.current, next)) {
      prevRef.current = next;
    }
    return prevRef.current as T;
  }, [selector]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/* Shallow equality check for arrays and primitives — keeps useStore snapshot stable */
function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
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
    | "check_out"
    | "no_show_reservation"
    | "room_change";
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
  if (navigator.onLine) return;
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
  if (!navigator.onLine) return 0;
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

/* ============================== Current User ============================== */

let _currentActor = "System";
let _currentRole = "System";

export function setCurrentUser(actor: string, role: string) {
  _currentActor = actor;
  _currentRole = role;
}

export function recordLogin(actor: string, role: string) {
  logAudit({
    module: "auth",
    action: "Logged in",
    entity: `${actor} (${role})`,
    severity: "info",
  });
  emit();
}

export function recordLogout(actor: string, role: string) {
  logAudit({
    module: "auth",
    action: "Logged out",
    entity: `${actor} (${role})`,
    severity: "info",
  });
  emit();
}

export function getCurrentUser() {
  return { actor: _currentActor, role: _currentRole };
}

/* ============================== Helpers ============================== */

export const isoDate = iso;
export const todayISO = () => iso(TODAY);
export const fmtUGX = (n: number) => {
  const code = state.currencyConfig?.code ?? "UGX";
  return code + " " + Math.round(n).toLocaleString();
};

export const hashPassword = (plain: string) => btoa(plain);

export function logAudit(
  entry: Omit<AuditEntry, "id" | "ts" | "actor" | "role"> & { actor?: string; role?: string },
) {
  state.audit = [
    { id: nextAuditId(), ts: new Date().toISOString(), actor: _currentActor, role: _currentRole, ...entry },
    ...state.audit,
  ];
  emit();
}

/* date ranges overlap, treating checkOut as exclusive */
function rangesOverlap(aIn: string, aOut: string, bIn: string, bOut: string) {
  return aIn < bOut && bIn < aOut;
}

/** Rooms that are bookable for a given room type and date range, ignoring soft statuses. */
export function findAvailableRooms(roomTypeId: string, checkIn: string, checkOut: string, excludeReservationId?: string) {
  return state.rooms.filter((r) => {
    if (r.roomTypeId !== roomTypeId) return false;
    if (r.status !== "available") return false;
    // any active reservation already on this room in the same range?
    const conflict = state.reservations.some(
      (res) =>
        res.id !== excludeReservationId &&
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
  | "id"
  | "createdAt"
  | "status"
  | "folioId"
  | "roomId"
  | "vatRate"
  | "vatTreatment"
  | "propertyId"
  | "confirmationNumber"
  | "billingArrangement"
  | "vipFlag"
  | "updatedAt"
> & {
  roomId?: string | null;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  clientType?: string;
  propertyId?: string;
  confirmationNumber?: string;
  billingArrangement?: BillingArrangement;
  vipFlag?: boolean;
  payment?: {
    method: PaymentMethod;
    amount: number;
    phone?: string;
    reference?: string;
    tendered?: number;
    change?: number;
  };
};

/* ============================== Notifications ============================== */

export type NotificationType =
  | "reservation_created"
  | "reservation_cancelled"
  | "check_in"
  | "check_out"
  | "payment_received"
  | "no_show"
  | "approval_required"
  | "approval_update"
  | "low_stock";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  ts: string;
  read: boolean;
  archived?: boolean;
  link?: string;
  reservationId?: string;
  /** If omitted, visible to all roles. Otherwise only these roles see it. */
  targetRoles?: Role[];
};

let notifCounter = savedCounters.notifCounter ?? 9000;
const nextNotifId = () => {
  const v = `NOTIF-${++notifCounter}`;
  saveCounters();
  return v;
};

export function notificationsForRole(
  notifications: AppNotification[],
  role: string,
): AppNotification[] {
  return notifications.filter(
    (n) => !n.targetRoles || n.targetRoles.length === 0 || n.targetRoles.includes(role as Role),
  );
}

export function pushNotification(n: Omit<AppNotification, "id" | "ts" | "read">) {
  state.notifications = [
    { id: nextNotifId(), ts: new Date().toISOString(), read: false, archived: false, ...n },
    ...state.notifications,
  ];
  emit();
}

export function markNotificationRead(id: string) {
  state.notifications = state.notifications.map((n) =>
    n.id === id ? { ...n, read: true, archived: true } : n,
  );
  emit();
}

export function markAllNotificationsRead() {
  state.notifications = state.notifications.map((n) => ({ ...n, read: true, archived: true }));
  emit();
}

export function updateNotifSettings(
  settings: Partial<State["notifSettings"]>,
) {
  state.notifSettings = { ...state.notifSettings, ...settings };
  logAudit({
    module: "settings",
    action: "Updated notification settings",
    entity: Object.keys(settings).join(", "),
    severity: "info",
  });
  emit();
}

export type LockoutSettings = State["lockoutSettings"];

export function updateLockoutSettings(
  settings: Partial<State["lockoutSettings"]>,
) {
  state.lockoutSettings = { ...state.lockoutSettings, ...settings };
  logAudit({
    module: "settings",
    action: "Updated lockout settings",
    entity: "Security",
    severity: "warn",
  });
  emit();
}

export type PaymentMethodConfig = State["paymentMethodConfig"];

export function updatePaymentMethodConfig(config: PaymentMethodConfig) {
  state.paymentMethodConfig = { ...config };
  logAudit({
    module: "settings",
    action: "Updated payment method configuration",
    entity: `Enabled: ${config.enabledMethods.join(", ")}`,
    severity: "info",
  });
  emit();
}

export function isPaymentMethodEnabled(method: PaymentMethod): boolean {
  return state.paymentMethodConfig.enabledMethods.includes(method);
}

export function getEnabledPaymentMethods(): PaymentMethod[] {
  return state.paymentMethodConfig.enabledMethods;
}

export type CurrencyConfig = State["currencyConfig"];

export function updateCurrencyConfig(config: CurrencyConfig) {
  state.currencyConfig = { ...config };
  logAudit({
    module: "settings",
    action: "Updated currency configuration",
    entity: `Currency: ${config.code}`,
    severity: "info",
  });
  emit();
}

export type MealPlanConfig = State["mealPlanConfig"];

export function updateMealPlanConfig(config: MealPlanConfig) {
  state.mealPlanConfig = { ...config, prices: { ...config.prices } };
  logAudit({
    module: "settings",
    action: "Updated meal plan pricing",
    entity: Object.entries(config.prices).map(([k, v]) => `${k}=${v}`).join(", "),
    severity: "info",
  });
  emit();
}

export function getMealPlanPrice(id: string): number {
  return state.mealPlanConfig.prices[id] ?? 0;
}

export function getMealPlanLabel(id: string): string {
  return MEAL_PLAN_LABELS[id as MealPlanId] ?? id;
}

export type IdTypeConfig = State["idTypeConfig"];

export function updateIdTypeConfig(config: IdTypeConfig) {
  state.idTypeConfig = { types: [...config.types] };
  logAudit({
    module: "settings",
    action: "Updated ID type list",
    entity: config.types.join(", "),
    severity: "info",
  });
  emit();
}

export function getIdTypes(): string[] {
  return state.idTypeConfig.types;
}

export type RoomTypeFilterConfig = State["roomTypeFilterConfig"];

export function updateRoomTypeFilterConfig(config: RoomTypeFilterConfig) {
  state.roomTypeFilterConfig = { types: [...config.types] };
  logAudit({
    module: "settings",
    action: "Updated room type filter list",
    entity: config.types.join(", "),
    severity: "info",
  });
  emit();
}

export function getRoomTypeFilters(): string[] {
  return state.roomTypeFilterConfig.types;
}

export type MiscChargeItemsConfig = MiscChargeItem[];

export function addMiscChargeItem(item: Omit<MiscChargeItem, "id">) {
  const id = `MCI${String(state.miscChargeItems.length + 1).padStart(3, "0")}`;
  state.miscChargeItems = [...state.miscChargeItems, { id, ...item }];
  logAudit({ module: "settings", action: "Added misc charge item", entity: item.name, severity: "info" });
  emit();
}

export function updateMiscChargeItem(id: string, patch: Partial<MiscChargeItem>) {
  state.miscChargeItems = state.miscChargeItems.map((m) => (m.id === id ? { ...m, ...patch } : m));
  logAudit({ module: "settings", action: "Updated misc charge item", entity: id, severity: "info" });
  emit();
}

export function removeMiscChargeItem(id: string) {
  state.miscChargeItems = state.miscChargeItems.filter((m) => m.id !== id);
  logAudit({ module: "settings", action: "Removed misc charge item", entity: id, severity: "info" });
  emit();
}

export function dismissNotification(id: string) {
  state.notifications = state.notifications.filter((n) => n.id !== id);
  emit();
}

export function archiveNotification(id: string) {
  state.notifications = state.notifications.map((n) =>
    n.id === id ? { ...n, archived: true } : n,
  );
  emit();
}

export function archiveSelectedNotifications(ids: string[]) {
  const set = new Set(ids);
  state.notifications = state.notifications.map((n) =>
    set.has(n.id) ? { ...n, archived: true } : n,
  );
  emit();
}

export function createReservation(
  input: NewReservationInput,
): { ok: true; id: string } | { ok: false; error: string } {
  if (!input.checkIn || !input.checkOut || input.checkIn > input.checkOut) {
    return { ok: false, error: "Check-out must not be before check-in." };
  }
  let roomId = input.roomId ?? null;
  if (roomId) {
    const available = findAvailableRooms(input.roomTypeId, input.checkIn, input.checkOut).some(
      (r) => r.id === roomId,
    );
    if (!available)
      return { ok: false, error: "Selected room is no longer available for these dates." };
  }

  // Validate group block if linked
  if (input.groupBlockId) {
    const block = state.groupBlocks.find((g) => g.id === input.groupBlockId);
    if (!block) return { ok: false, error: "Group block not found." };
    const blockStatus = effectiveStatus(block);
    if (blockStatus === "cancelled" || blockStatus === "closed")
      return { ok: false, error: `Group block is ${blockStatus}.` };
    if (input.checkIn < block.startDate || input.checkOut > block.endDate)
      return { ok: false, error: "Reservation dates must fall within the group block dates." };
    const pickedUp = state.reservations.filter(
      (r) => r.groupBlockId === input.groupBlockId && r.status !== "cancelled",
    ).length;
    if (pickedUp >= block.totalRoomsBlocked)
      return { ok: false, error: `Group block is fully booked (${block.totalRoomsBlocked}/${block.totalRoomsBlocked} rooms taken).` };
  }

  const now = new Date().toISOString();
  const id = nextResId();
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
    checkOutTime: input.checkOutTime,
    extraBeds: input.extraBeds,
    checkinBy: input.checkinBy,
    checkoutBy: input.checkoutBy,
    purpose: input.purpose,
    carReg: input.carReg,
    clientType: input.clientType,
    sourceSystemRef: input.sourceSystemRef,
    resCode: input.resCode,
    currency: input.currency,
    address: input.address,
  };
  state.reservations = [reservation, ...state.reservations];

  // link/update guest profile
  const guestId = upsertGuest({
    fullName: input.guestName,
    email: input.guestEmail,
    phone: input.guestPhone,
    nationality: input.nationality ?? "Uganda",
    idType: input.idType ?? "Passport",
    idNumber: input.idNumber ?? `P${Date.now()}`,
  });
  updateGuestStats(input.guestEmail, input.guestPhone);

  // always open a folio when a reservation is created
  const folio: Folio = {
    id: nextFolioId(),
    propertyId: input.propertyId ?? "T001",
    reservationId: id,
    guestProfileId: guestId,
    billingArrangement: input.billingArrangement ?? "pay_at_checkout",
    status: "open",
    openedAt: now,
    openedBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
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
      module: "billing",
      action: `Deposit collected at booking via ${input.payment.method}`,
      entity: `${id} ${fmtUGX(input.payment.amount)}`,
      recordId: id,
      severity: "info",
    });
  }

  logAudit({
    module: "reservations",
    action: "Created reservation",
    entity: id,
    recordId: id,
    severity: "info",
  });
  addToOutbox({ type: "create_reservation", payload: { id, ...input } });
  pushNotification({
    type: "reservation_created",
    title: "New reservation",
    description: `${input.guestName} — ${input.checkIn} to ${input.checkOut}`,
    link: `/reservations/${id}`,
    reservationId: id,
    targetRoles: ["Front Desk", "Owner / GM"],
  });
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
      id,
    ).some((r) => r.id === updated.roomId);
    if (!available && updated.roomId) {
      // unassign room if conflict
      updated.roomId = null;
    }
  }
  state.reservations = state.reservations.map((r) => (r.id === id ? updated : r));
  const changes = Object.entries(patch)
    .filter(([k]) => k in res)
    .map(([k, v]) => `${k}: ${JSON.stringify((res as any)[k])} → ${JSON.stringify(v)}`)
    .join("; ");
  logAudit({
    module: "reservations",
    action: `Updated reservation — ${Object.keys(patch).join(", ")}`,
    entity: id,
    recordId: id,
    tableName: "reservations",
    oldValue: Object.entries(patch)
      .filter(([k]) => k in res)
      .map(([k]) => `${k}: ${JSON.stringify((res as any)[k])}`)
      .join("; "),
    newValue: Object.entries(patch)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join("; "),
    severity: "info",
  });
  addToOutbox({ type: "update_reservation", payload: { id, patch } });
  emit();
  return { ok: true };
}

export function cancelReservation(id: string, opts?: { reason?: string; chargeFee?: boolean; actor?: string; role?: string }) {
  const reason = opts?.reason;
  const chargeFee = opts?.chargeFee ?? false;
  const actor = opts?.actor;
  const role = opts?.role;
  const res = state.reservations.find((r) => r.id === id);
  if (!res) return;

  const now = new Date().toISOString();
  const today = todayISO();

  // Release room back to available
  if (res.roomId && (res.status === "confirmed" || res.status === "checked_in")) {
    state.rooms = state.rooms.map((r) =>
      r.id === res.roomId ? { ...r, status: "available" as RoomStatus } : r,
    );
  }

  // Calculate cancellation fee if applicable
  let feeAmount = 0;
  let policyName = "";
  if (chargeFee && (res.status === "confirmed" || res.status === "open")) {
    const matchingRatePlan = state.ratePlans.find((rp) => rp.roomTypeId === res.roomTypeId);
    if (matchingRatePlan) {
      const policy = state.cancellationPolicies.find((cp) => cp.id === matchingRatePlan.cancellationPolicyId);
      if (policy) {
        policyName = policy.name;
        const hoursUntilCheckIn = (new Date(res.checkIn).getTime() - Date.now()) / 3_600_000;
        if (hoursUntilCheckIn < policy.freeCancelHoursBefore) {
          if (policy.partialRefundPct > 0) {
            feeAmount = Math.round((res.ratePerNight * (100 - policy.partialRefundPct)) / 100);
          } else {
            feeAmount = Math.round((res.ratePerNight * 100) / 100);
          }
        }
      }
    }
    if (!policyName && state.cancellationPolicies.length > 0) {
      const fallback = state.cancellationPolicies[0];
      policyName = fallback.name;
      feeAmount = Math.round((res.ratePerNight * fallback.noShowChargePct) / 100);
    }
  }

  // Create folio and post fee if applicable
  let folioId = res.folioId;
  if (feeAmount > 0 && !folioId) {
    folioId = nextFolioId();
    state.folios = [
      ...state.folios,
      {
        id: folioId,
        propertyId: res.propertyId,
        reservationId: res.id,
        billingArrangement: res.billingArrangement,
        status: "open",
        openedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }
  if (feeAmount > 0 && folioId) {
    state.charges = [
      ...state.charges,
      {
        id: nextChargeId(),
        folioId,
        date: today,
        chargeDate: today,
        type: "room",
        chargeSource: "room_auto",
        description: `Cancellation fee (${policyName || "policy"})`,
        amount: feeAmount,
        grossAmount: feeAmount,
        postedAt: now,
        status: "posted",
      },
    ];
  }

  state.reservations = state.reservations.map((r) =>
    r.id === id
      ? {
          ...r,
          status: "cancelled",
          cancellationReason: reason,
          roomId: res.status === "confirmed" || res.status === "open" ? null : r.roomId,
          cancelledAt: now,
          cancelledBy: actor || "Front Desk",
          folioId: folioId ?? r.folioId,
          updatedAt: now,
        }
      : r,
  );
  logAudit({
    module: "reservations",
    action: `Cancelled reservation${reason ? ` — ${reason}` : ""}${feeAmount > 0 ? ` — fee UGX ${feeAmount.toLocaleString()}` : ""}`,
    entity: id,
    recordId: id,
    severity: "warn",
  });
  addToOutbox({ type: "cancel_reservation", payload: { id, reason, feeAmount } });
  const cancelledRes = state.reservations.find((r) => r.id === id);
  pushNotification({
    type: "reservation_cancelled",
    title: "Reservation cancelled",
    description: `${cancelledRes?.guestName ?? "—"}${reason ? ` — ${reason}` : ""}${feeAmount > 0 ? ` (fee UGX ${feeAmount.toLocaleString()})` : ""}`,
    link: `/reservations/${id}`,
    reservationId: id,
    targetRoles: ["Front Desk", "Owner / GM"],
  });
  emit();
}

export function isWithinNoShowWindow(checkIn: string, checkOut: string): boolean {
  const now = new Date();
  const checkInDate = new Date(checkIn + "T00:00:00");
  const checkOutEnd = new Date(checkOut + "T23:59:59");
  const windowClose = new Date(checkOutEnd.getTime() + 48 * 60 * 60 * 1000);
  return now >= checkInDate && now <= windowClose;
}

export function noShowReservation(
  id: string,
  opts: { chargeFee?: boolean } = {},
) {
  const res = state.reservations.find((r) => r.id === id);
  if (!res) return;

  const now = new Date().toISOString();
  const today = todayISO();

  // Release room back to available
  if (res.roomId) {
    state.rooms = state.rooms.map((r) =>
      r.id === res.roomId ? { ...r, status: "available" as RoomStatus } : r,
    );
  }

  // Calculate no-show fee from the rate plan's cancellation policy
  let feeAmount = 0;
  let policyName = "";
  if (opts.chargeFee) {
    const matchingRatePlan = state.ratePlans.find((rp) => rp.roomTypeId === res.roomTypeId);
    if (matchingRatePlan) {
      const policy = state.cancellationPolicies.find((cp) => cp.id === matchingRatePlan.cancellationPolicyId);
      if (policy?.noShowChargePct) {
        feeAmount = Math.round((res.ratePerNight * policy.noShowChargePct) / 100);
        policyName = policy.name;
      }
    }
    if (!policyName && state.cancellationPolicies.length > 0) {
      const fallback = state.cancellationPolicies[0];
      feeAmount = Math.round((res.ratePerNight * fallback.noShowChargePct) / 100);
      policyName = fallback.name;
    }
  }

  // Create folio if needed for the fee
  let folioId = res.folioId;
  if (feeAmount > 0 && !folioId) {
    folioId = nextFolioId();
    state.folios = [
      ...state.folios,
      {
        id: folioId,
        propertyId: res.propertyId,
        reservationId: res.id,
        billingArrangement: res.billingArrangement,
        status: "open",
        openedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  // Post no-show fee charge
  if (feeAmount > 0 && folioId) {
    state.charges = [
      ...state.charges,
      {
        id: nextChargeId(),
        folioId,
        date: today,
        chargeDate: today,
        type: "room",
        chargeSource: "room_auto",
        description: "No-show fee",
        amount: feeAmount,
        grossAmount: feeAmount,
        postedAt: now,
        status: "posted",
      },
    ];
  }

  state.reservations = state.reservations.map((r) =>
    r.id === id
      ? {
          ...r,
          status: "no_show",
          roomId: null,
          noShowDeclaredAt: now,
          noShowDeclaredBy: "Front Desk",
          folioId: folioId ?? r.folioId,
          updatedAt: now,
        }
      : r,
  );

  logAudit({
    module: "reservations",
    action: `Marked reservation as no-show${feeAmount > 0 ? ` — no-show fee UGX ${feeAmount.toLocaleString()}` : ""}`,
    entity: id,
    recordId: id,
    severity: "warn",
  });

  addToOutbox({ type: "no_show_reservation", payload: { id, feeAmount } });
  const noShowRes = state.reservations.find((r) => r.id === id);
  pushNotification({
    type: "no_show",
    title: "No-show declared",
    description: `${noShowRes?.guestName ?? "—"}${feeAmount > 0 ? ` — fee UGX ${feeAmount.toLocaleString()}` : ""}`,
    link: `/reservations/${id}`,
    reservationId: id,
    targetRoles: ["Front Desk", "Owner / GM"],
  });
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
    const now = new Date().toISOString();
    const newFolio: Folio = {
      id: nextFolioId(),
      propertyId: res.propertyId,
      reservationId: res.id,
      billingArrangement: res.billingArrangement,
      status: "open",
      openedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    state.folios = [...state.folios, newFolio];
    folioId = newFolio.id;
  }

  // First night room charge posted on check-in
  const chargeDate = todayISO();
  state.charges = [
    ...state.charges,
    {
      id: nextChargeId(),
      folioId: folioId,
      date: chargeDate,
      chargeDate,
      type: "room",
      chargeSource: "room_auto",
      description: `Room ${targetRoom} — night 1`,
      amount: res.ratePerNight,
      grossAmount: res.ratePerNight,
      postedAt: new Date().toISOString(),
      status: "posted",
    },
  ];

  state.reservations = state.reservations.map((r) =>
    r.id === res.id ? { ...r, status: "checked_in", roomId: targetRoom, folioId } : r,
  );
  state.rooms = state.rooms.map((r) => (r.id === targetRoom ? { ...r, status: "occupied" } : r));

  logAudit({
    module: "reservations",
    action: "Checked in guest",
    entity: `${res.id} → Room ${targetRoom}`,
    recordId: res.id,
    severity: "info",
  });
  addToOutbox({ type: "check_in", payload: { reservationId, roomId: targetRoom } });
  const checkedInRes = state.reservations.find((r) => r.id === reservationId);
  pushNotification({
    type: "check_in",
    title: "Guest checked in",
    description: `${checkedInRes?.guestName ?? "—"} checked into Room ${checkedInRes?.roomId ?? "—"}`,
    link: `/reservations/${reservationId}`,
    reservationId,
    targetRoles: ["Front Desk", "Housekeeping", "Owner / GM"],
  });
  emit();
  return { ok: true };
}

export function checkOut(
  reservationId: string,
): { ok: true; postStay: boolean; balance?: number } | { ok: false; error: string } {
  const res = state.reservations.find((r) => r.id === reservationId);
  if (!res) return { ok: false, error: "Reservation not found." };
  if (res.status !== "checked_in")
    return { ok: false, error: "Guest is not currently checked in." };
  const folio = state.folios.find((f) => f.id === res.folioId);
  if (!folio) return { ok: false, error: "No folio attached to reservation." };
  const balance = folioBalance(folio.id);
  const isCompanyBilled = !!(res.corporateAccountId || res.billingArrangement === "city_ledger");
  const postStay = balance > 0.5;

  const now = new Date().toISOString();
  if (postStay) {
    // Outstanding balance — allow checkout but mark folio as post-stay so
    // finance can chase and settle later. Room is freed, housekeeping is
    // triggered, reservation is checked out. Folio stays open.
    updateFolio(folio.id, { status: "post_stay" });
  } else {
    // Balance is zero — settle the folio normally.
    updateFolio(folio.id, { status: "settled", settledAt: now, closedAt: now });
  }
  if (isCompanyBilled && balance > 0.5 && res.corporateAccountId) {
    updateCorpAccountBalance(res.corporateAccountId, balance);
  }
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
  // Deactivate all active key cards for this reservation
  state.keyCards = state.keyCards.map((k) =>
    k.reservationId === res.id && !k.deactivatedAt
      ? { ...k, deactivatedAt: now, deactivationReason: "checkout" as const, deactivatedBy: "Front Desk" }
      : k,
  );
  logAudit({
    module: "reservations",
    action: "Checked out guest",
    entity: `${res.id} (Room ${res.roomId})`,
    recordId: res.id,
    severity: "info",
  });
  addToOutbox({ type: "check_out", payload: { reservationId } });
  const checkedOutRes = state.reservations.find((r) => r.id === reservationId);
  pushNotification({
    type: "check_out",
    title: "Guest checked out",
    description: `${checkedOutRes?.guestName ?? "—"} checked out of Room ${checkedOutRes?.roomId ?? "—"}`,
    link: `/reservations/${reservationId}`,
    reservationId,
    targetRoles: ["Front Desk", "Housekeeping", "Owner / GM"],
  });
  emit();
  return { ok: true, postStay, balance: postStay ? balance : undefined };
}

export function settleAndCheckout(
  reservationId: string,
  method: PaymentMethod,
  details: { amount: number; tendered?: number; reference?: string; phone?: string },
  actor: string,
  actorRole: string,
): { ok: true } | { ok: false; error: string } {
  const res = state.reservations.find((r) => r.id === reservationId);
  if (!res) return { ok: false, error: "Reservation not found." };
  if (res.status !== "checked_in") return { ok: false, error: "Guest is not currently checked in." };
  const folio = state.folios.find((f) => f.id === res.folioId);
  if (!folio) return { ok: false, error: "No folio attached to reservation." };
  const balance = folioBalance(folio.id);
  if (balance <= 0.5) return { ok: false, error: "Folio balance is already zero." };

  if (method === "cash") {
    addPayment(folio.id, {
      method,
      amount: details.amount,
      tendered: details.tendered,
      change: details.tendered ? details.tendered - details.amount : undefined,
      receivedBy: actor,
    });
  } else if (method === "charge_to_room") {
    addPayment(folio.id, {
      method: "charge_to_room",
      amount: details.amount,
      receivedBy: actor,
    });
  } else {
    addPayment(folio.id, {
      method,
      amount: details.amount,
      reference: details.reference,
      phone: details.phone,
      receivedBy: actor,
    });
  }

  settleFolio(folio.id, actor, actorRole);
  return checkOut(reservationId);
}

export function changeRoom(
  reservationId: string,
  newRoomId: string,
  actor: string,
  role: string,
  newRoomTypeId?: string,
  newRatePerNight?: number,
): { ok: true; oldRoom: string; newRoom: string } | { ok: false; error: string } {
  const res = state.reservations.find((r) => r.id === reservationId);
  if (!res) return { ok: false, error: "Reservation not found." };
  if (res.status !== "checked_in")
    return { ok: false, error: "Room change is only allowed for checked-in guests." };
  const oldRoomId = res.roomId;
  if (!oldRoomId) return { ok: false, error: "No room assigned." };
  if (oldRoomId === newRoomId && !newRoomTypeId) return { ok: false, error: "That is the current room." };

  const newRoom = state.rooms.find((r) => r.id === newRoomId);
  if (!newRoom) return { ok: false, error: "Target room not found." };

  const conflict = state.reservations.some(
    (r) =>
      r.id !== reservationId &&
      r.roomId === newRoomId &&
      (r.status === "checked_in" || r.status === "confirmed") &&
      rangesOverlap(res.checkIn, res.checkOut, r.checkIn, r.checkOut),
  );
  if (conflict) return { ok: false, error: "Target room is occupied during the stay period." };

  const now = new Date().toISOString();
  const roomTypeChanged = newRoomTypeId && newRoomTypeId !== res.roomTypeId;
  const effectiveRate = newRatePerNight ?? (roomTypeChanged ? roomTypeById(newRoom.roomTypeId)?.baseRate ?? res.ratePerNight : res.ratePerNight);

  // Update reservation
  state.reservations = state.reservations.map((r) =>
    r.id === reservationId
      ? {
          ...r,
          roomId: newRoomId,
          ...(roomTypeChanged ? { roomTypeId: newRoomTypeId!, ratePerNight: effectiveRate } : {}),
          updatedAt: now,
        }
      : r,
  );

  // Update rooms
  state.rooms = state.rooms.map((r) => {
    if (r.id === oldRoomId) return { ...r, status: "dirty" };
    if (r.id === newRoomId) return { ...r, status: "occupied" };
    return r;
  });

  // Create housekeeping task for vacated room
  const task: HousekeepingTask = {
    id: nextHkTaskId(),
    roomId: oldRoomId,
    type: "cleaning",
    priority: "high",
    status: "queued",
    assignedTo: null,
    due: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    notes: `Room vacated due to guest move to Room ${newRoomId} (${res.guestName})`,
    createdAt: now,
  };
  state.housekeepingTasks = [...state.housekeepingTasks, task];

  // Deactivate key cards for the old room with reason "room_change"
  state.keyCards = state.keyCards.map((k) =>
    k.reservationId === reservationId && !k.deactivatedAt
      ? { ...k, deactivatedAt: now, deactivationReason: "room_change", deactivatedBy: actor }
      : k,
  );
  state.keyCards = [
    ...state.keyCards,
    {
      id: nextKeyCardId(),
      propertyId: res.propertyId,
      reservationId,
      roomId: newRoomId,
      cardType: "rfid",
      issueNumber: 1,
      cardReference: newRoomId + "-" + Date.now().toString(36),
      issuedAt: now,
      issuedBy: actor,
      expiresAt: res.checkOut,
      deactivatedAt: undefined,
      deactivationReason: undefined,
      deactivatedBy: undefined,
      createdAt: now,
    },
  ];

  const auditDetails = roomTypeChanged
    ? `${res.id} → Room ${newRoom.roomNumber} (type: ${res.roomTypeId} → ${newRoomTypeId}, rate: ${fmtUGX(res.ratePerNight)} → ${fmtUGX(effectiveRate)})`
    : `${res.id} → Room ${newRoom.roomNumber}`;
  logAudit({
    actor,
    role,
    module: "reservations",
    action: roomTypeChanged ? "Room change with type upgrade" : "Room change",
    entity: auditDetails,
    recordId: res.id,
    oldValue: oldRoomId,
    newValue: newRoomId,
    severity: "info",
  });

  addToOutbox({ type: "room_change", payload: { reservationId, oldRoomId, newRoomId } });
  emit();
  return { ok: true, oldRoom: oldRoomId, newRoom: newRoomId };
}

/* ============================== Folio ============================== */

function updateFolio(folioId: string, patch: Partial<Folio>) {
  state.folios = state.folios.map((f) =>
    f.id === folioId ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f,
  );
  emit();
}

function guardFolioOpen(folioId: string, allowTransferred?: boolean): boolean {
  const folio = state.folios.find((f) => f.id === folioId);
  if (!folio) return false;
  if (allowTransferred && (folio.status === "transferred_to_ledger" || folio.status === "transferred_to_agent")) return true;
  if (folio.status !== "open") {
    logAudit({
      module: "billing",
      action: "Rejected — folio is not open",
      entity: `${folioId} status=${folio?.status ?? "not_found"}`,
      severity: "warn",
    });
    emit();
    return false;
  }
  return true;
}

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
): string | undefined {
  if (!guardFolioOpen(folioId)) return;
  const now = new Date().toISOString();
  const chargeDate = input.date ?? todayISO();
  const id = nextChargeId();
  state.charges = [
    ...state.charges,
    {
      id,
      folioId,
      date: chargeDate,
      chargeDate,
      type: input.type,
      chargeSource: input.chargeSource ?? ("manual" as FolioChargeSource),
      description: input.description,
      quantity: input.quantity,
      unitAmount: input.unitAmount,
      amount: input.amount,
      grossAmount: input.amount,
      vatAmount: input.vatAmount,
      vatTreatment: input.vatTreatment,
      netAmount: input.netAmount,
      postedBy: input.postedBy,
      postedAt: now,
      status: "posted",
    },
  ];
  logAudit({
    module: "billing",
    action: "Posted charge",
    entity: `${folioId} ${fmtUGX(input.amount)}`,
    severity: "info",
  });
  emit();
  return id;
}

export function addDiscount(
  folioId: string,
  input: {
    description: string;
    amount: number;
    isPercentage?: boolean;
    postedBy?: string;
  },
) {
  if (!guardFolioOpen(folioId)) return;
  const now = new Date().toISOString();
  const chargeDate = todayISO();
  const discountAmount = -Math.abs(input.amount);
  state.charges = [
    ...state.charges,
    {
      id: nextChargeId(),
      folioId,
      date: chargeDate,
      chargeDate,
      type: "discount",
      chargeSource: "manual" as FolioChargeSource,
      description: input.description,
      amount: discountAmount,
      grossAmount: discountAmount,
      postedBy: input.postedBy,
      postedAt: now,
      status: "posted" as FolioChargeStatus,
    },
  ];
  logAudit({
    module: "billing",
    action: "Applied discount",
    entity: `${folioId} ${fmtUGX(input.amount)}${input.isPercentage ? " (%)" : ""}`,
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
  if (!guardFolioOpen(folioId, true)) return;
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
  if (status === "confirmed") {
    const folio = state.folios.find((f) => f.id === folioId);
    if (folio?.corporateAccountId) {
      updateCorpAccountBalance(folio.corporateAccountId, -input.amount);
    }
    const bal = folioBalance(folioId);
    if (bal <= 0.5 && state.folios.find((f) => f.id === folioId)?.status !== "post_stay") {
      state.folios = state.folios.map((f) =>
        f.id === folioId ? { ...f, status: "settled", closedAt: new Date().toISOString() } : f,
      );
    }
    pushNotification({
      type: "payment_received",
      title: "Payment received",
      description: `${fmtUGX(input.amount)} via ${input.method}`,
      link: `/billing`,
      targetRoles: ["Accountant", "POS / Cashier", "Front Desk", "Owner / GM"],
    });
  }
  logAudit({
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
  if (payment && !guardFolioOpen(payment.folioId, true)) return;
  if (payment && payment.status === "confirmed") {
    const folio = state.folios.find((f) => f.id === payment.folioId);
    if (folio?.corporateAccountId) {
      updateCorpAccountBalance(folio.corporateAccountId, -payment.amount);
    }
    const bal = folioBalance(payment.folioId);
    if (bal <= 0.5 && state.folios.find((f) => f.id === payment.folioId)?.status !== "post_stay") {
      state.folios = state.folios.map((f) =>
        f.id === payment.folioId
          ? { ...f, status: "settled", closedAt: new Date().toISOString() }
          : f,
      );
    }
    pushNotification({
      type: "payment_received",
      title: "Payment confirmed",
      description: `${fmtUGX(payment.amount)} via ${payment.method}`,
      link: `/billing`,
      targetRoles: ["Accountant", "POS / Cashier", "Front Desk", "Owner / GM"],
    });
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
  const p = state.payments.find((p) => p.id === paymentId);
  if (p && !guardFolioOpen(p.folioId)) return;
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
  if (!guardFolioOpen(original.folioId)) return;
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
  if (!folio) return null;
  if (folio.status !== "settled" && folio.status !== "transferred_to_ledger" && folio.status !== "transferred_to_agent") return null;
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
    status: totalPaid >= totalCharges ? "paid" : totalPaid > 0 ? "issued" : "overdue",
    eFRISStatus: "pending",
    totalTaxable,
    totalVat,
    totalAmount: totalCharges,
    amountDue: Math.max(0, totalCharges - totalPaid),
    paidAmount: totalPaid,
    amountPaid: totalPaid,
    outstandingAmount: Math.max(0, totalCharges - totalPaid),
    isProforma: false,
    isCreditNote: false,
  };
  state.invoices = [...state.invoices, inv];
  state.invoiceLineItems = [...state.invoiceLineItems, ...lines];
  logAudit({
    module: "billing",
    action: `Invoice generated ${inv.invoiceNo}`,
    entity: `${folioId} total=${fmtUGX(totalCharges)}`,
    severity: "info",
  });
  emit();
  return inv;
}

export function generatePosInvoice(
  tabId: string,
  items: { menuItemId: string; quantity: number; unitPrice: number; vatTreatment: VatTreatment }[],
  subtotal: number,
  serviceChargeAmount: number,
  totalAmount: number,
  settledBy: string,
): Invoice | null {
  const vatRate = currentVatRate();
  let totalTaxable = 0;
  let totalVat = 0;
  const lines: InvoiceLineItem[] = [];
  const invId = `POS-INV-${tabId}`;

  if (state.invoices.find((i) => i.id === invId)) return state.invoices.find((i) => i.id === invId)!;

  for (const item of items) {
    const itemTotal = item.unitPrice * item.quantity;
    const vt = item.vatTreatment ?? "inclusive";
    const taxable = vt === "exempt" ? 0 : vt === "inclusive" ? Math.round(itemTotal / (1 + vatRate)) : itemTotal;
    const vat = vt === "exempt" ? 0 : Math.round(taxable * vatRate);
    totalTaxable += taxable;
    totalVat += vat;
    lines.push({
      id: `INVLI-${invId}-${lines.length}`,
      invoiceId: invId,
      description: `${item.menuItemId} x${item.quantity}`,
      amount: itemTotal,
      vatTreatment: vt,
      vatRate,
      taxableAmount: taxable,
      vatAmount: vat,
      totalAmount: itemTotal,
    });
  }

  if (serviceChargeAmount > 0) {
    const vt: VatTreatment = "inclusive";
    const taxable = Math.round(serviceChargeAmount / (1 + vatRate));
    const vat = Math.round(taxable * vatRate);
    totalTaxable += taxable;
    totalVat += vat;
    lines.push({
      id: `INVLI-${invId}-${lines.length}`,
      invoiceId: invId,
      description: `Service charge`,
      amount: serviceChargeAmount,
      vatTreatment: vt,
      vatRate,
      taxableAmount: taxable,
      vatAmount: vat,
      totalAmount: serviceChargeAmount,
    });
  }

  const inv: Invoice = {
    id: invId,
    invoiceNo: nextInvoiceNo(),
    folioId: `POS-${tabId}`,
    reservationId: `POS-${tabId}`,
    guestName: "POS Customer",
    guestEmail: "",
    guestPhone: "",
    issuedAt: new Date().toISOString(),
    issuedBy: settledBy,
    status: "issued",
    eFRISStatus: "pending",
    totalTaxable,
    totalVat,
    totalAmount,
    paidAmount: totalAmount,
    amountPaid: totalAmount,
    amountDue: 0,
    outstandingAmount: 0,
    isProforma: false,
    isCreditNote: false,
  };

  state.invoices = [...state.invoices, inv];
  state.invoiceLineItems = [...state.invoiceLineItems, ...lines];
  logAudit({
    module: "pos",
    action: `POS invoice generated ${inv.invoiceNo}`,
    entity: `${tabId} total=${fmtUGX(totalAmount)}`,
    severity: "info",
  });
  emit();
  return inv;
}

export function generateGroupInvoice(groupBlockId: string): Invoice | null {
  const group = state.groupBlocks.find((g) => g.id === groupBlockId);
  if (!group) return null;

  const invId = `GROUP-INV-${groupBlockId}`;
  const pseudoFolioId = `GROUP-${groupBlockId}`;

  const existing = state.invoices.find((i) => i.id === invId);
  if (existing) return existing;

  const reservations = state.reservations.filter((r) => r.groupBlockId === groupBlockId);
  const folioIds = reservations.map((r) => r.folioId).filter(Boolean) as string[];

  const allCharges = state.charges.filter((c) => folioIds.includes(c.folioId) && !c.voided);
  const allPayments = state.payments.filter((p) => folioIds.includes(p.folioId) && p.status === "confirmed");

  const totalCharges = allCharges.reduce((s, c) => s + c.amount, 0);
  const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0);

  const vatRate = currentVatRate();
  let totalTaxable = 0, totalVat = 0;
  const lines: InvoiceLineItem[] = [];

  allCharges.forEach((c) => {
    const res = reservations.find((r) => r.folioId === c.folioId);
    const guestPrefix = res ? `${res.guestName} — ` : "";
    const vt = c.vatTreatment ?? (c.type === "tax" ? "exempt" : "inclusive");
    const taxable = vt === "exempt" ? 0 : vt === "inclusive" ? Math.round(c.amount / (1 + vatRate)) : c.amount;
    const vat = vt === "exempt" ? 0 : Math.round(taxable * vatRate);
    totalTaxable += taxable;
    totalVat += vat;
    lines.push({
      id: `INVLI-${invId}-${lines.length}`,
      invoiceId: invId,
      description: `${guestPrefix}${c.description}`,
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
    folioId: pseudoFolioId,
    reservationId: pseudoFolioId,
    guestName: group.groupName,
    guestEmail: group.organiserEmail ?? "",
    guestPhone: "",
    companyName: group.groupName,
    issuedAt: new Date().toISOString(),
    status: totalPaid >= totalCharges ? "paid" : totalPaid > 0 ? "issued" : "overdue",
    eFRISStatus: "pending",
    totalTaxable,
    totalVat,
    totalAmount: totalCharges,
    amountDue: Math.max(0, totalCharges - totalPaid),
    paidAmount: totalPaid,
    amountPaid: totalPaid,
    outstandingAmount: Math.max(0, totalCharges - totalPaid),
    isProforma: false,
    isCreditNote: false,
  };

  state.invoices = [...state.invoices, inv];
  state.invoiceLineItems = [...state.invoiceLineItems, ...lines];
  logAudit({
    module: "billing",
    action: `Group consolidated invoice generated ${inv.invoiceNo}`,
    entity: `${groupBlockId} total=${fmtUGX(totalCharges)}`,
    severity: "info",
  });
  emit();
  return inv;
}

export function generateGroupPerPersonInvoices(groupBlockId: string): Invoice[] {
  const generated: Invoice[] = [];
  const reservations = state.reservations.filter((r) => r.groupBlockId === groupBlockId);

  for (const res of reservations) {
    if (!res.folioId) continue;
    const folio = state.folios.find((f) => f.id === res.folioId);
    if (!folio) continue;
    const folioCharges = state.charges.filter((c) => c.folioId === folio.id && !c.voided);
    const folioPayments = state.payments.filter((p) => p.folioId === folio.id && p.status === "confirmed");
    const totalCharges = folioCharges.reduce((s, c) => s + c.amount, 0);
    const totalPaid = folioPayments.reduce((s, p) => s + p.amount, 0);
    const vatRate = currentVatRate();
    let totalTaxable = 0, totalVat = 0;
    const lines: InvoiceLineItem[] = [];
    const invId = `GRP-INV-${folio.id}`;

    const existing = state.invoices.find((i) => i.id === invId);
    if (existing) { generated.push(existing); continue; }

    folioCharges.forEach((c) => {
      const vt = c.vatTreatment ?? (c.type === "tax" ? "exempt" : (res.vatTreatment ?? "inclusive"));
      const taxable = vt === "exempt" ? 0 : vt === "inclusive" ? Math.round(c.amount / (1 + vatRate)) : c.amount;
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
      folioId: folio.id,
      reservationId: res.id,
      guestName: res.guestName,
      guestEmail: res.guestEmail,
      guestPhone: res.guestPhone,
      issuedAt: new Date().toISOString(),
      status: totalPaid >= totalCharges ? "paid" : totalPaid > 0 ? "issued" : "overdue",
      eFRISStatus: "pending",
      totalTaxable,
      totalVat,
      totalAmount: totalCharges,
      amountDue: Math.max(0, totalCharges - totalPaid),
      paidAmount: totalPaid,
      amountPaid: totalPaid,
      outstandingAmount: Math.max(0, totalCharges - totalPaid),
      isProforma: false,
      isCreditNote: false,
    };

    state.invoices = [...state.invoices, inv];
    state.invoiceLineItems = [...state.invoiceLineItems, ...lines];
    generated.push(inv);
  }

  if (generated.length > 0) {
    logAudit({
      module: "billing",
      action: `Group per-person invoices generated`,
      entity: `${groupBlockId} count=${generated.length}`,
      severity: "info",
    });
    emit();
  }
  return generated;
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
    amountDue: 0,
    paidAmount: 0,
    amountPaid: 0,
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
    status: totalPaid >= totalCharges ? "paid" : totalPaid > 0 ? "issued" : "overdue",
    eFRISStatus: "confirmed",
    totalTaxable,
    totalVat,
    totalAmount: totalCharges,
    amountDue: Math.max(0, totalCharges - totalPaid),
    paidAmount: totalPaid,
    amountPaid: totalPaid,
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
  if (!guardFolioOpen(folioId)) return;
  const now = new Date().toISOString();
  state.charges = state.charges.map((c) =>
    c.id === chargeId && c.folioId === folioId && !c.voided
      ? {
          ...c,
          voided: true,
          status: "voided",
          voidReason: reason,
          voidedBy: actor,
          voidedAt: now,
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

export function transferCharge(
  chargeId: string,
  targetFolioId: string,
  actor: string,
  role: string,
) {
  const charge = state.charges.find((c) => c.id === chargeId);
  if (!charge || charge.voided) return;
  if (charge.folioId === targetFolioId) return;
  if (!guardFolioOpen(charge.folioId)) return;
  const sourceFolioId = charge.folioId;
  state.charges = state.charges.map((c) =>
    c.id === chargeId ? { ...c, folioId: targetFolioId } : c,
  );
  logAudit({
    actor,
    role,
    module: "billing",
    action: "Transferred charge",
    entity: `${sourceFolioId} → ${targetFolioId} ${fmtUGX(charge.amount)} — ${charge.description}`,
    severity: "info",
  });
  emit();
}

export function transferFolio(
  sourceFolioId: string,
  targetFolioId: string,
  actor: string,
  role: string,
) {
  if (!guardFolioOpen(sourceFolioId)) return;
  const sourceFolio = state.folios.find((f) => f.id === sourceFolioId);
  const targetFolio = state.folios.find((f) => f.id === targetFolioId);
  if (!sourceFolio || !targetFolio) return;
  if (sourceFolioId === targetFolioId) return;
  const chargesToMove = state.charges.filter(
    (c) => c.folioId === sourceFolioId && !c.voided,
  );
  if (chargesToMove.length === 0) return;
  const chargeIds = chargesToMove.map((c) => c.id);
  state.charges = state.charges.map((c) =>
    chargeIds.includes(c.id) ? { ...c, folioId: targetFolioId } : c,
  );
  state.folios = state.folios.map((f) =>
    f.id === sourceFolioId
      ? { ...f, status: "transferred_to_ledger" as FolioStatus, closedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      : f,
  );
  const totalMoved = chargesToMove.reduce((s, c) => s + c.amount, 0);
  logAudit({
    actor,
    role,
    module: "billing",
    action: "Transferred entire folio",
    entity: `${sourceFolioId} → ${targetFolioId} ${fmtUGX(totalMoved)} — ${chargesToMove.length} charges`,
    severity: "info",
  });
  emit();
}

export function splitFolio(
  sourceFolioId: string,
  chargeIdsToMove: string[],
  actor: string,
  role: string,
): string {
  const sourceFolio = state.folios.find((f) => f.id === sourceFolioId);
  if (!sourceFolio || chargeIdsToMove.length === 0) return "";
  const now = new Date().toISOString();
  const targetId = nextFolioId();
  state.folios = [
    ...state.folios,
    {
      id: targetId,
      propertyId: sourceFolio.propertyId,
      reservationId: sourceFolio.reservationId,
      status: "open",
      openedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ];
  state.charges = state.charges.map((c) =>
    chargeIdsToMove.includes(c.id) ? { ...c, folioId: targetId } : c,
  );
  logAudit({
    actor,
    role,
    module: "billing",
    action: "Split folio",
    entity: `${sourceFolioId} → ${targetId} (${chargeIdsToMove.length} charges moved)`,
    severity: "info",
  });
  emit();
  return targetId;
}

export function settleFolio(folioId: string, actor: string, role: string) {
  const now = new Date().toISOString();
  state.folios = state.folios.map((f) =>
    f.id === folioId && f.status !== "settled" && f.status !== "transferred_to_ledger" && f.status !== "transferred_to_agent" && f.status !== "void"
      ? { ...f, status: "settled", settledAt: now, closedAt: now, settledBy: actor, updatedAt: now }
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

export function closeFolio(folioId: string): { ok: true } | { ok: false; error: string } {
  const balance = folioBalance(folioId);
  if (balance > 0.5) {
    return {
      ok: false,
      error: "Balance must be zero before closing folio. Record payment first.",
    };
  }
  const now = new Date().toISOString();
  updateFolio(folioId, { status: "settled", settledAt: now, closedAt: now });
  logAudit({
    module: "billing",
    action: "folio_closed",
    entity: "folio",
    recordId: folioId,
    severity: "info",
  });
  return { ok: true };
}

export function runNightAudit(actor: string, role: string) {
  const today = todayISO();
  const posted: string[] = [];
  state.folios.forEach((f) => {
    if (f.status !== "open") return;
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
        chargeDate: today,
        type: "room",
        chargeSource: "room_auto",
        description: `Room ${res.roomId} — night ${nightsSoFar}`,
        amount: res.ratePerNight,
        grossAmount: res.ratePerNight,
        postedBy: actor,
        postedAt: new Date().toISOString(),
        status: "posted",
      },
    ];
    posted.push(f.id);
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
    .filter((f) => f.status === "open" || f.status === "post_stay")
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
  post_stay: "Post-Stay",
  settled: "Settled",
  transferred_to_ledger: "Transferred to Ledger",
  transferred_to_agent: "Transferred to Agent",
  void: "Void",
};

/* ============================== Rooms / Housekeeping ============================== */

export function setRoomStatus(roomId: string, status: RoomStatus) {
  state.rooms = state.rooms.map((r) => (r.id === roomId ? { ...r, status } : r));
  logAudit({
    module: "housekeeping",
    action: "Updated room status",
    entity: `Room ${roomId} → ${status}`,
    severity: "info",
  });
  emit();
}

export function assignRoomHousekeeper(roomId: string, userId: string | null) {
  const prev = state.rooms.find((r) => r.id === roomId)?.assignedTo ?? null;
  state.rooms = state.rooms.map((r) => (r.id === roomId ? { ...r, assignedTo: userId } : r));
  logAudit({
    module: "housekeeping",
    action: userId ? "Assigned room housekeeper" : "Unassigned room housekeeper",
    entity: `Room ${roomId} → ${prev ?? "none"} to ${userId ?? "none"}`,
    severity: "info",
  });
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
    module: "housekeeping",
    action: "Task created",
    entity: `${task.id} — Room ${input.roomId} (${input.type})`,
    severity: "info",
  });
  emit();
  return task;
}

export function assignHkTask(taskId: string, userId: string | null) {
  const task = state.housekeepingTasks.find((t) => t.id === taskId);
  const prev = task?.assignedTo ?? null;
  state.housekeepingTasks = state.housekeepingTasks.map((t) => {
    if (t.id !== taskId) return t;
    const patch: Partial<HousekeepingTask> = { assignedTo: userId };
    if (userId) {
      /* assigning a queued task moves it to pending (awaiting cleaner) */
      if (t.status === "queued") patch.status = "pending";
    } else if (t.status === "pending") {
      /* unassigning a pending task reverts it to queued */
      patch.status = "queued";
    }
    return { ...t, ...patch };
  });
  logAudit({
    module: "housekeeping",
    action: userId ? "Assigned housekeeping task" : "Unassigned housekeeping task",
    entity: `${taskId} → ${prev ?? "none"} to ${userId ?? "none"}`,
    severity: "info",
  });
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
    module: "housekeeping",
    action: `Task ${status}`,
    entity: `${task.id} — Room ${task.roomId}`,
    severity: "info",
  });
  emit();
}

export function markHkTaskDirty(taskId: string) {
  const task = state.housekeepingTasks.find((t) => t.id === taskId);
  if (!task) return;
  state.housekeepingTasks = state.housekeepingTasks.map((t) =>
    t.id === taskId ? { ...t, status: "queued", completedAt: undefined } : t,
  );
  setRoomStatus(task.roomId, "dirty");
  logAudit({
    module: "housekeeping",
    action: "Room marked dirty — task re-queued",
    entity: `${task.id} — Room ${task.roomId}`,
    severity: "warn",
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

/* ==================== Room Inspections ==================== */

let roomInspectionCounter = savedCounters.roomInspectionCounter ?? 0;
export const nextRoomInspectionId = () => {
  const v = `RI-${++roomInspectionCounter}`;
  saveCounters();
  return v;
};

export function upsertRoomInspection(input: RoomInspection) {
  const exists = state.roomInspections.some((i) => i.id === input.id);
  if (exists) {
    state.roomInspections = state.roomInspections.map((i) => (i.id === input.id ? input : i));
  } else {
    state.roomInspections = [{ ...input, createdAt: new Date().toISOString() }, ...state.roomInspections];
  }
  emit();
}

export function deleteRoomInspection(id: string) {
  state.roomInspections = state.roomInspections.filter((i) => i.id !== id);
  emit();
}

export function roomInspectionById(id: string | undefined | null) {
  return id ? state.roomInspections.find((i) => i.id === id) : undefined;
}

export function roomInspectionsByTask(housekeepingTaskId: string) {
  return state.roomInspections.filter((i) => i.housekeepingTaskId === housekeepingTaskId);
}

export function roomInspectionsByRoom(roomId: string) {
  return state.roomInspections.filter((i) => i.roomId === roomId);
}

export function latestRoomInspectionByTask(housekeepingTaskId: string) {
  const inspections = state.roomInspections.filter((i) => i.housekeepingTaskId === housekeepingTaskId);
  return inspections.sort((a, b) => b.inspectedAt.localeCompare(a.inspectedAt))[0];
}

/* ==================== Minibar ==================== */

export function upsertMinibarItem(input: MinibarItem) {
  const exists = state.minibarItems.some((i) => i.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.minibarItems = state.minibarItems.map((i) => (i.id === input.id ? { ...input, updatedAt: now } : i));
  } else {
    state.minibarItems = [{ ...input, createdAt: now, updatedAt: now }, ...state.minibarItems];
  }
  emit();
}

export function deleteMinibarItem(id: string) {
  state.minibarItems = state.minibarItems.filter((i) => i.id !== id);
  emit();
}

export function minibarItemById(id: string | undefined | null) {
  return id ? state.minibarItems.find((i) => i.id === id) : undefined;
}

export function minibarItemsByRoomType(roomTypeId: string) {
  return state.minibarItems.filter((i) => i.isActive && (!i.roomTypeId || i.roomTypeId === roomTypeId));
}

export function minibarLogById(id: string | undefined | null) {
  return id ? state.minibarLogs.find((l) => l.id === id) : undefined;
}

export function minibarLogsByRoom(roomId: string) {
  return state.minibarLogs.filter((l) => l.roomId === roomId);
}

/**
 * Logs one minibar item's consumption/restock for a room and, if the room has an
 * in-house guest with an open folio, posts the consumption as a folio charge through
 * the existing billing charge path (source: minibar_auto — reserved for this in the
 * folio_charge_source enum, see ERD Domain 3/4).
 */
export function logMinibarConsumption(input: {
  roomId: string;
  minibarItemId: string;
  consumedQuantity: number;
  restockedQuantity?: number;
  loggedBy: string;
  housekeepingTaskId?: string;
  reservationId?: string;
}): { ok: true; log: MinibarLog; charged: boolean; warn?: string } | { ok: false; error: string } {
  const item = state.minibarItems.find((i) => i.id === input.minibarItemId);
  if (!item) return { ok: false, error: "Minibar item not found." };
  if (input.consumedQuantity < 0 || (input.restockedQuantity ?? 0) < 0) {
    return { ok: false, error: "Quantities cannot be negative." };
  }

  const reservation = input.reservationId
    ? state.reservations.find((r) => r.id === input.reservationId)
    : state.reservations.find((r) => r.roomId === input.roomId && r.status === "checked_in");

  let folioChargeId: string | undefined;
  let charged = false;
  let folioClosed = false;
  if (input.consumedQuantity > 0 && reservation?.folioId && guardFolioOpen(reservation.folioId)) {
    folioChargeId = addCharge(reservation.folioId, {
      type: "fnb",
      chargeSource: "minibar_auto" as FolioChargeSource,
      description: `Minibar — ${item.name} x${input.consumedQuantity}`,
      quantity: input.consumedQuantity,
      unitAmount: item.unitSellingPrice,
      amount: item.unitSellingPrice * input.consumedQuantity,
      vatTreatment: item.vatTreatment,
      postedBy: input.loggedBy,
    });
    charged = folioChargeId != null;
  } else if (input.consumedQuantity > 0 && reservation?.folioId) {
    folioClosed = true;
  }

  const now = new Date().toISOString();
  const log: MinibarLog = {
    id: nextMinibarLogId(),
    propertyId: item.propertyId,
    roomId: input.roomId,
    reservationId: reservation?.id,
    housekeepingTaskId: input.housekeepingTaskId,
    minibarItemId: input.minibarItemId,
    consumedQuantity: input.consumedQuantity,
    restockedQuantity: input.restockedQuantity ?? 0,
    loggedBy: input.loggedBy,
    loggedAt: now,
    folioChargeId,
    supervisorReviewRequired: item.parQuantity > 0 && input.consumedQuantity > item.parQuantity * 1.5,
    createdAt: now,
  };
  state.minibarLogs = [log, ...state.minibarLogs];

  logAudit({
    module: "housekeeping",
    action: "Minibar consumption logged",
    entity: `Room ${input.roomId} — ${item.name} x${input.consumedQuantity}`,
    severity: log.supervisorReviewRequired ? "warn" : "info",
  });
  emit();
  return {
    ok: true,
    log,
    charged,
    warn: folioClosed ? "No open folio — consumption logged, not charged." : undefined,
  };
}

export function activeReservationForRoom(roomId: string | null | undefined): Reservation | undefined {
  if (!roomId) return undefined;
  return state.reservations.find((r) => r.roomId === roomId && r.status === "checked_in");
}

export function minibarRoomStock(roomId: string): { item: MinibarItem; onHand: number; par: number; shortfall: number }[] {
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) return [];
  const logs = state.minibarLogs.filter((l) => l.roomId === roomId);
  return minibarItemsByRoomType(room.roomTypeId).map((item) => {
    const consumed = logs.filter((l) => l.minibarItemId === item.id).reduce((s, l) => s + l.consumedQuantity, 0);
    const restocked = logs.filter((l) => l.minibarItemId === item.id).reduce((s, l) => s + l.restockedQuantity, 0);
    const onHand = Math.max(0, restocked - consumed);
    return { item, onHand, par: item.parQuantity, shortfall: Math.max(0, item.parQuantity - onHand) };
  });
}

export function minibarRoomHistory(roomId: string): MinibarLog[] {
  return state.minibarLogs
    .filter((l) => l.roomId === roomId)
    .slice()
    .sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1));
}

export function restockMinibar(
  roomId: string,
  items: { minibarItemId: string; quantity: number }[],
  loggedBy: string,
): { ok: boolean; errors?: string[]; logs: MinibarLog[] } {
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) return { ok: false, errors: ["Room not found."], logs: [] };
  const errors: string[] = [];
  for (const li of items) {
    if (li.quantity <= 0) continue;
    const item = state.minibarItems.find((m) => m.id === li.minibarItemId);
    if (!item) {
      errors.push(`Unknown minibar item ${li.minibarItemId}.`);
      continue;
    }
    if (item.stockItemId) {
      const available = quantityAtLocation(item.stockItemId, "SL003");
      if (li.quantity > available) {
        errors.push(`${item.name}: restock ${li.quantity}, only ${available} at Bar Store.`);
      }
    }
  }
  if (errors.length > 0) return { ok: false, errors, logs: [] };
  const logs: MinibarLog[] = [];
  for (const li of items) {
    if (li.quantity <= 0) continue;
    const item = state.minibarItems.find((m) => m.id === li.minibarItemId);
    if (!item) continue;
    if (item.stockItemId) {
      addStockMovement({
        stockItemId: item.stockItemId,
        type: "internal_use",
        quantity: -li.quantity,
        referenceType: "minibar_restock",
        referenceId: roomId,
        notes: `Minibar restock — Room ${room.roomNumber}`,
        storageLocationId: "SL003",
        createdBy: loggedBy,
      });
    }
    const res = logMinibarConsumption({
      roomId,
      minibarItemId: li.minibarItemId,
      consumedQuantity: 0,
      restockedQuantity: li.quantity,
      loggedBy,
    });
    if (res.ok) logs.push(res.log);
  }
  logAudit({
    module: "housekeeping",
    action: "Minibar restocked",
    entity: `Room ${room.roomNumber}`,
    severity: "info",
  });
  emit();
  return { ok: true, logs };
}

export function reviewMinibarLog(id: string, reviewedBy: string) {
  state.minibarLogs = state.minibarLogs.map((l) =>
    l.id === id
      ? {
          ...l,
          supervisorReviewedBy: reviewedBy,
          supervisorReviewedAt: new Date().toISOString(),
        }
      : l,
  );
  logAudit({ module: "housekeeping", action: "Minibar consumption reviewed", entity: id, severity: "info" });
  emit();
}

/* ==================== Agent Ledger Entries (32) ==================== */
export function upsertAgentLedgerEntry(input: AgentLedgerEntry) {
  const exists = state.agentLedgerEntries.some((e) => e.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.agentLedgerEntries = state.agentLedgerEntries.map((e) => (e.id === input.id ? { ...input, updatedAt: now } : e));
  } else {
    state.agentLedgerEntries = [{ ...input, createdAt: now, updatedAt: now }, ...state.agentLedgerEntries];
  }
  emit();
}

export function deleteAgentLedgerEntry(id: string) {
  state.agentLedgerEntries = state.agentLedgerEntries.filter((e) => e.id !== id);
  emit();
}

export function agentLedgerEntryById(id: string | undefined | null) {
  return id ? state.agentLedgerEntries.find((e) => e.id === id) : undefined;
}

export function agentLedgerEntriesByFolio(folioId: string) {
  return state.agentLedgerEntries.filter((e) => e.folioId === folioId);
}

export function agentLedgerEntriesByAgent(travelAgentAccountId: string) {
  return state.agentLedgerEntries.filter((e) => e.travelAgentAccountId === travelAgentAccountId);
}

/* ==================== Reconciliation Reports (34) ==================== */

export function upsertReconciliationReport(input: ReconciliationReport) {
  const exists = state.reconciliationReports.some((r) => r.id === input.id);
  if (exists) {
    state.reconciliationReports = state.reconciliationReports.map((r) => (r.id === input.id ? input : r));
  } else {
    state.reconciliationReports = [{ ...input, generatedAt: new Date().toISOString() }, ...state.reconciliationReports];
  }
  emit();
}

export function deleteReconciliationReport(id: string) {
  state.reconciliationReports = state.reconciliationReports.filter((r) => r.id !== id);
  emit();
}

export function reconciliationReportById(id: string | undefined | null) {
  return id ? state.reconciliationReports.find((r) => r.id === id) : undefined;
}

export function reconciliationReportByDate(propertyId: string, reportDate: string) {
  return state.reconciliationReports.find((r) => r.propertyId === propertyId && r.reportDate === reportDate);
}

export function reconciliationReportsForProperty(propertyId: string) {
  return state.reconciliationReports.filter((r) => r.propertyId === propertyId);
}

export function upsertRoom(room: Room) {
  const exists = state.rooms.some((r) => r.id === room.id);
  state.rooms = exists
    ? state.rooms.map((r) => (r.id === room.id ? room : r))
    : [...state.rooms, room];
  logAudit({
    module: "settings",
    action: exists ? "Updated room" : "Added room",
    entity: `Room ${room.id}`,
    severity: "info",
  });
  emit();
}
export function deleteRoom(roomId: string) {
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) return;
  state.rooms = state.rooms.filter((r) => r.id !== roomId);
  const prop = state.properties.find((p) => p.id === room.propertyId);
  if (prop) {
    prop.totalRoomCount = Math.max(0, (prop.totalRoomCount ?? 1) - 1);
    if (state.currentPropertyId === prop.id) state.tenant = { ...prop };
  }
  logAudit({
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
  logAudit({
    module: "settings",
    action: exists ? "Updated room type" : "Created room type",
    entity: t.name,
    severity: "info",
  });
  emit();
}
export function deleteRoomType(id: string) {
  const rt = state.roomTypes.find((x) => x.id === id);
  state.roomTypes = state.roomTypes.filter((x) => x.id !== id);
  logAudit({
    module: "settings",
    action: "Deleted room type",
    entity: rt?.name ?? id,
    severity: "warn",
  });
  emit();
}

/* ============================== Rate Plans ============================== */

export function upsertRatePlan(rp: RatePlan) {
  const exists = state.ratePlans.some((x) => x.id === rp.id);
  state.ratePlans = exists
    ? state.ratePlans.map((x) => (x.id === rp.id ? { ...rp, updatedAt: new Date().toISOString() } : x))
    : [...state.ratePlans, { ...rp, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
  logAudit({
    module: "rates",
    action: exists ? "Updated rate plan" : "Created rate plan",
    entity: rp.name,
    severity: "warn",
  });
  emit();
}

export function deleteRatePlan(id: string) {
  const rp = state.ratePlans.find((x) => x.id === id);
  state.ratePlans = state.ratePlans.filter((x) => x.id !== id);
  logAudit({
    module: "rates",
    action: "Deleted rate plan",
    entity: rp?.name ?? id,
    severity: "warn",
  });
  emit();
}

export function cancellationPolicyById(id: string | undefined | null) {
  return id ? state.cancellationPolicies.find((cp) => cp.id === id) : undefined;
}

export function upsertCancellationPolicy(policy: CancellationPolicy) {
  const exists = state.cancellationPolicies.some((cp) => cp.id === policy.id);
  state.cancellationPolicies = exists
    ? state.cancellationPolicies.map((cp) => (cp.id === policy.id ? policy : cp))
    : [...state.cancellationPolicies, policy];
  logAudit({
    module: "settings",
    action: exists ? "Updated cancellation policy" : "Created cancellation policy",
    entity: policy.name,
    severity: "info",
  });
  emit();
}

export function deleteCancellationPolicy(id: string) {
  const policy = state.cancellationPolicies.find((cp) => cp.id === id);
  state.cancellationPolicies = state.cancellationPolicies.filter((cp) => cp.id !== id);
  logAudit({
    module: "settings",
    action: "Deleted cancellation policy",
    entity: policy?.name ?? id,
    severity: "warn",
  });
  emit();
}

export function upsertSeasonalPricing(ratePlanId: string, seasonal: SeasonalPricing) {
  const plan = state.ratePlans.find((rp) => rp.id === ratePlanId);
  if (!plan) return;
  const list = plan.seasonalPricing ?? [];
  const exists = list.some((s) => s.id === seasonal.id);
  const updated = exists
    ? list.map((s) => (s.id === seasonal.id ? seasonal : s))
    : [...list, { ...seasonal, ratePlanId }];
  state.ratePlans = state.ratePlans.map((rp) =>
    rp.id === ratePlanId ? { ...rp, seasonalPricing: updated, updatedAt: new Date().toISOString() } : rp,
  );
  logAudit({
    module: "rates",
    action: exists ? "Updated seasonal pricing" : "Created seasonal pricing",
    entity: `${seasonal.label} — ${plan.name}`,
    severity: "info",
  });
  emit();
}

export function deleteSeasonalPricing(ratePlanId: string, seasonalId: string) {
  const plan = state.ratePlans.find((rp) => rp.id === ratePlanId);
  if (!plan) return;
  const label = plan.seasonalPricing?.find((s) => s.id === seasonalId)?.label ?? seasonalId;
  state.ratePlans = state.ratePlans.map((rp) =>
    rp.id === ratePlanId
      ? { ...rp, seasonalPricing: (rp.seasonalPricing ?? []).filter((s) => s.id !== seasonalId), updatedAt: new Date().toISOString() }
      : rp,
  );
  logAudit({
    module: "rates",
    action: "Deleted seasonal pricing",
    entity: `${label} — ${plan.name}`,
    severity: "warn",
  });
  emit();
}

export function bulkUpdateRoomRates(roomIds: string[], ratePlanId: string, overrideNightlyRate?: number) {
  const rp = state.ratePlans.find((r) => r.id === ratePlanId);
  if (!rp) return;
  const rate = overrideNightlyRate ?? rp.nightlyRate;
  state.rooms = state.rooms.map((r) =>
    roomIds.includes(r.id) ? { ...r, defaultRatePlanId: ratePlanId, extraPersonCharge: rate } : r,
  );
  logAudit({
    module: "rates",
    action: "Bulk updated room rates",
    entity: `${roomIds.length} rooms → ${rp.name} @ ${fmtUGX(rate)}`,
    severity: "warn",
  });
  emit();
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
  logAudit({
    module: "billing",
    action: exists ? "Updated corporate account" : "Created corporate account",
    entity: input.companyName,
    severity: "warn",
  });
  emit();
}

export function deleteCorporateAccount(id: string) {
  const corp = state.corporateAccounts.find((c) => c.id === id);
  state.corporateAccounts = state.corporateAccounts.filter((c) => c.id !== id);
  logAudit({
    module: "billing",
    action: "Deleted corporate account",
    entity: corp?.companyName ?? id,
    severity: "warn",
  });
  emit();
}

export function corporateAccountById(id: string | undefined | null) {
  return id ? state.corporateAccounts.find((c) => c.id === id) : undefined;
}

export function updateCorpAccountBalance(id: string, delta: number) {
  const corp = state.corporateAccounts.find((c) => c.id === id);
  state.corporateAccounts = state.corporateAccounts.map((c) =>
    c.id === id ? { ...c, outstandingBalance: c.outstandingBalance + delta, updatedAt: new Date().toISOString() } : c,
  );
  logAudit({
    module: "billing",
    action: "Updated corporate account balance",
    entity: `${corp?.companyName ?? id} (delta: ${fmtUGX(delta)})`,
    severity: "warn",
  });
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
  logAudit({
    module: "billing",
    action: exists ? "Updated travel agent account" : "Created travel agent account",
    entity: input.agencyName,
    severity: "info",
  });
  emit();
}

export function deleteTravelAgent(id: string) {
  const agent = state.travelAgentAccounts.find((a) => a.id === id);
  state.travelAgentAccounts = state.travelAgentAccounts.filter((a) => a.id !== id);
  logAudit({
    module: "billing",
    action: "Deleted travel agent account",
    entity: agent?.agencyName ?? id,
    severity: "warn",
  });
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
  logAudit({
    module: "groups",
    action: exists ? "Updated group block" : "Created group block",
    entity: input.groupName,
    severity: "info",
  });
  emit();
}

export function deleteGroupBlock(id: string) {
  const block = state.groupBlocks.find((g) => g.id === id);
  state.groupBlocks = state.groupBlocks.filter((g) => g.id !== id);
  logAudit({
    module: "groups",
    action: "Deleted group block",
    entity: block?.groupName ?? id,
    severity: "warn",
  });
  emit();
}

export function effectiveStatus(block: GroupBlock): GroupBlockStatus {
  if (block.status === "cancelled") return "cancelled";
  const today = new Date().toISOString().slice(0, 10);
  if (today >= block.endDate) return "closed";
  if (today >= block.startDate) return "active";
  return block.status;
}

export function groupBlockById(id: string | undefined | null) {
  return id ? state.groupBlocks.find((g) => g.id === id) : undefined;
}

export function createGroupBlock(input: {
  groupName: string;
  startDate: string;
  endDate: string;
  totalRoomsBlocked: number;
  groupRate: number;
  organiserName?: string;
  organiserEmail?: string;
  createdBy?: string;
  totalPax?: number;
  billingArrangement?: BillingArrangement;
}): GroupBlock {
  const now = new Date().toISOString();
  const block: GroupBlock = {
    id: nextGroupBlockId(),
    propertyId: "T001",
    groupName: input.groupName,
    organiserName: input.organiserName,
    organiserEmail: input.organiserEmail,
    startDate: input.startDate,
    endDate: input.endDate,
    totalRoomsBlocked: input.totalRoomsBlocked,
    totalPax: input.totalPax,
    groupRate: input.groupRate,
    billingArrangement: input.billingArrangement ?? "city_ledger",
    status: "confirmed",
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  state.groupBlocks = [block, ...state.groupBlocks];
  logAudit({
    module: "groups",
    action: "Created group block",
    entity: block.groupName,
    severity: "info",
  });
  emit();
  return block;
}

/* ==================== Approval Requests ==================== */

export function createApprovalRequest(
  action: ApprovalActionType,
  folioId: string,
  payload: Record<string, unknown>,
  requestedBy: string,
  requestedByRole: string,
) {
  const id = nextApprovalRequestId();
  const now = new Date().toISOString();
  const folioLabel = folioId ? `folio ${folioId}` : action.replace(/_/g, " ");
  state.approvalRequests = [
    {
      id,
      action,
      folioId,
      payload,
      status: "pending",
      requestedBy,
      requestedByRole,
      requestedAt: now,
    },
    ...state.approvalRequests,
  ];
  pushNotification({
    type: "approval_required",
    title: "Approval required",
    description: `${requestedBy} (${requestedByRole}) requested ${action.replace(/_/g, " ")} on ${folioLabel}`,
    link: folioId ? `/billing?folio=${folioId}` : "/audit",
    targetRoles: ["Owner / GM", "Accountant"],
  });
  logAudit({
    module: "billing",
    action: "Approval request created",
    entity: `${id} — ${action} on ${folioLabel} by ${requestedBy}`,
    severity: "info",
  });
  emit();
  return id;
}

export function approveRequest(id: string, approvedBy: string, approvedByRole: string) {
  const req = state.approvalRequests.find((r) => r.id === id);
  if (!req || req.status !== "pending") return;
  const now = new Date().toISOString();
  state.approvalRequests = state.approvalRequests.map((r) =>
    r.id === id ? { ...r, status: "approved" as const, approvedBy, approvedAt: now } : r
  );
  const updated = state.approvalRequests.find((r) => r.id === id)!;
  executeApprovedAction(updated);
  pushNotification({
    type: "approval_update",
    title: "Request approved",
    description: `${approvedBy} approved your ${req.action.replace(/_/g, " ")} request on folio ${req.folioId}`,
    link: `/billing?folio=${req.folioId}`,
    targetRoles: [req.requestedByRole as Role],
  });
  logAudit({
    module: "billing",
    action: "Approval request approved",
    entity: `${id} — ${req.action} on folio ${req.folioId} by ${req.requestedBy}, approved by ${approvedBy}`,
    severity: "info",
  });
  emit();
}

export function rejectRequest(id: string, rejectedBy: string, reason: string) {
  const req = state.approvalRequests.find((r) => r.id === id);
  if (!req || req.status !== "pending") return;
  const now = new Date().toISOString();
  state.approvalRequests = state.approvalRequests.map((r) =>
    r.id === id ? { ...r, status: "rejected" as const, approvedBy: rejectedBy, approvedAt: now, rejectionReason: reason } : r
  );
  pushNotification({
    type: "approval_update",
    title: "Request rejected",
    description: `${rejectedBy} rejected your ${req.action.replace(/_/g, " ")} request on folio ${req.folioId}. Reason: ${reason}`,
    link: `/billing?folio=${req.folioId}`,
    targetRoles: [req.requestedByRole as Role],
  });
  logAudit({
    module: "billing",
    action: "Approval request rejected",
    entity: `${id} — ${req.action} on folio ${req.folioId} by ${req.requestedBy}, rejected by ${rejectedBy}. Reason: ${reason}`,
    severity: "warn",
  });
  emit();
}

function executeApprovedAction(req: ApprovalRequest) {
  const payload = req.payload;
  switch (req.action) {
    case "void_charge":
      voidCharge(
        req.folioId,
        payload.chargeId as string,
        (payload.reason as string) || "Approved void",
        req.approvedBy || "",
        req.approvedByRole || "",
      );
      break;
    case "complimentary":
      voidCharge(
        req.folioId,
        payload.chargeId as string,
        "Complimentary",
        req.approvedBy || "",
        req.approvedByRole || "",
      );
      break;
    case "transfer_charge":
      transferCharge(
        payload.chargeId as string,
        payload.targetFolioId as string,
        req.approvedBy || "",
        req.approvedByRole || "",
      );
      break;
    case "transfer_folio":
      transferFolio(
        req.folioId,
        payload.targetFolioId as string,
        req.approvedBy || "",
        req.approvedByRole || "",
      );
      break;
    case "split_folio":
      splitFolio(
        req.folioId,
        payload.chargeIdsToMove as string[],
        req.approvedBy || "",
        req.approvedByRole || "",
      );
      break;
    case "discount":
      addDiscount(req.folioId, {
        description: payload.description as string,
        amount: payload.amount as number,
        isPercentage: payload.isPercentage as boolean,
        postedBy: req.approvedBy,
      });
      break;
    case "refund":
      processRefund(
        payload.paymentId as string,
        payload.refundAmount as number,
        payload.reason as string,
        req.approvedBy || "",
        req.approvedByRole || "",
      );
      break;
    case "void_checkin": {
      voidCheckInApproved(payload.reservationId as string);
      break;
    }
  }
}

export function pendingApprovals(): ApprovalRequest[] {
  return state.approvalRequests.filter((r) => r.status === "pending");
}

/* ==================== End-of-Day Audit ==================== */

export function businessDate(): string {
  return state.businessDate;
}

export function setAuditStatus(status: State["auditStatus"]) {
  state.auditStatus = status;
  if (status === "front_desk") state.auditStartedAt = new Date().toISOString();
  if (status === "completed") state.auditCompletedAt = new Date().toISOString();
  emit();
}

export function startAudit() {
  if (state.auditStatus !== "idle") return;
  state.businessDate = todayISO();
  state.auditStatus = "front_desk";
  state.auditStartedAt = new Date().toISOString();
  state.auditCompletedAt = undefined;
  logAudit({
    module: "audit",
    action: "End-of-day audit started",
    entity: `Business date ${state.businessDate}`,
    severity: "info",
  });
  emit();
}

export function extendStay(reservationId: string, extraDays: number) {
  const res = state.reservations.find((r) => r.id === reservationId);
  if (!res) return { ok: false as const, error: "Reservation not found." };
  if (res.status !== "checked_in") return { ok: false as const, error: "Guest is not checked in." };
  const newCheckOut = addDays(new Date(res.checkOut), extraDays);
  state.reservations = state.reservations.map((r) =>
    r.id === reservationId ? { ...r, checkOut: iso(newCheckOut), updatedAt: new Date().toISOString() } : r,
  );
  logAudit({
    module: "frontdesk",
    action: "Extended stay",
    entity: `${res.guestName} — +${extraDays} day(s), new check-out ${iso(newCheckOut)}`,
    severity: "info",
  });
  emit();
  return { ok: true as const };
}

export function requestVoidCheckIn(reservationId: string, reason: string, actor: string, role: string) {
  const res = state.reservations.find((r) => r.id === reservationId);
  if (!res) return { ok: false as const, error: "Reservation not found." };
  if (res.status !== "checked_in") return { ok: false as const, error: "Guest is not checked in." };
  createApprovalRequest(
    "void_checkin",
    "",
    { reservationId, reason, guestName: res.guestName },
    actor,
    role,
  );
  return { ok: true as const };
}

function voidCheckInApproved(reservationId: string) {
  const res = state.reservations.find((r) => r.id === reservationId);
  if (!res) return;
  if (res.roomId) {
    state.rooms = state.rooms.map((r) =>
      r.id === res.roomId ? { ...r, status: "available" as const } : r,
    );
  }
  if (res.folioId) {
    state.folios = state.folios.map((f) =>
      f.id === res.folioId ? { ...f, status: "void" as const } : f,
    );
  }
  state.reservations = state.reservations.map((r) =>
    r.id === reservationId
      ? { ...r, status: "cancelled" as const, cancellationReason: "Check-in voided during audit", updatedAt: new Date().toISOString() }
      : r,
  );
  logAudit({
    module: "frontdesk",
    action: "Check-in voided (GM approved)",
    entity: `${res.guestName} — reservation ${reservationId}`,
    severity: "warn",
  });
  emit();
}

export function completeAudit() {
  if (state.auditStatus !== "calculating") return;
  // Store daily figures
  const date = state.businessDate;
  const fdCharges = state.charges.filter(
    (c) => c.date === date && c.chargeSource !== "pos_charge",
  ).reduce((s, c) => s + c.amount, 0);
  const fdPayments = state.payments.filter(
    (p) => p.date === date && p.status === "confirmed",
  ).reduce((s, p) => s + p.amount, 0);
  const posCharges = state.charges.filter(
    (c) => c.date === date && c.chargeSource === "pos_charge",
  ).reduce((s, c) => s + c.amount, 0);
  const posPayments = state.payments.filter(
    (p) => p.date === date && p.status === "confirmed",
  ).reduce((s, p) => s + p.amount, 0);
  logAudit({
    module: "audit",
    action: "End-of-day audit completed",
    entity: `Date ${date} — FD revenue ${fmtUGX(fdCharges)} vs sales ${fmtUGX(fdPayments)}, POS revenue ${fmtUGX(posCharges)} vs sales ${fmtUGX(posPayments)}`,
    severity: "info",
  });
  state.auditStatus = "completed";
  state.auditCompletedAt = new Date().toISOString();
  state.businessDate = addDays(new Date(date), 1).toISOString().slice(0, 10);
  emit();
}

export function pendingOpenTabs(): PosTab[] {
  return state.posTabs.filter((t) => t.status === "open");
}

export function upsertRoomAssignment(input: RoomAssignment) {
  const exists = state.roomAssignments.some((a) => a.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.roomAssignments = state.roomAssignments.map((a) =>
      a.id === input.id ? { ...a, ...input, updatedAt: now } : a,
    );
  } else {
    state.roomAssignments = [{ ...input, createdAt: now, updatedAt: now }, ...state.roomAssignments];
  }
  emit();
}

export function deleteRoomAssignment(id: string) {
  state.roomAssignments = state.roomAssignments.filter((a) => a.id !== id);
  emit();
}

export function roomAssignmentById(id: string | undefined | null) {
  return id ? state.roomAssignments.find((a) => a.id === id) : undefined;
}

export function roomAssignmentsByReservation(reservationId: string) {
  return state.roomAssignments.filter((a) => a.reservationId === reservationId);
}

export function activeRoomAssignmentForRoom(roomId: string) {
  return state.roomAssignments.find(
    (a) => a.roomId === roomId && (a.status === "assigned" || a.status === "checked_in"),
  );
}

/* ==================== Deposits ==================== */

export function upsertDeposit(input: Deposit) {
  const exists = state.deposits.some((d) => d.id === input.id);
  if (exists) {
    state.deposits = state.deposits.map((d) => (d.id === input.id ? input : d));
  } else {
    state.deposits = [{ ...input, createdAt: new Date().toISOString() }, ...state.deposits];
  }
  emit();
}

export function deleteDeposit(id: string) {
  state.deposits = state.deposits.filter((d) => d.id !== id);
  emit();
}

export function depositById(id: string | undefined | null) {
  return id ? state.deposits.find((d) => d.id === id) : undefined;
}

export function depositsByReservation(reservationId: string) {
  return state.deposits.filter((d) => d.reservationId === reservationId);
}

export function totalDepositsByReservation(reservationId: string) {
  return state.deposits
    .filter((d) => d.reservationId === reservationId && !d.refundedAt)
    .reduce((sum, d) => sum + d.amount, 0);
}

/* ==================== Check-In Events ==================== */

let checkInEventCounter = savedCounters.checkInEventCounter ?? 0;
const nextCheckInEventId = () => {
  const v = `CIE-${++checkInEventCounter}`;
  saveCounters();
  return v;
};

export function upsertCheckInEvent(input: CheckInEvent) {
  const exists = state.checkInEvents.some((e) => e.id === input.id);
  if (exists) {
    state.checkInEvents = state.checkInEvents.map((e) => (e.id === input.id ? input : e));
  } else {
    state.checkInEvents = [{ ...input, createdAt: new Date().toISOString() }, ...state.checkInEvents];
  }
  emit();
}

export function deleteCheckInEvent(id: string) {
  state.checkInEvents = state.checkInEvents.filter((e) => e.id !== id);
  emit();
}

export function checkInEventById(id: string | undefined | null) {
  return id ? state.checkInEvents.find((e) => e.id === id) : undefined;
}

export function checkInEventsByReservation(reservationId: string) {
  return state.checkInEvents.filter((e) => e.reservationId === reservationId);
}

/* ==================== Key Cards ==================== */

let keyCardCounter = savedCounters.keyCardCounter ?? 0;
const nextKeyCardId = () => {
  const v = `KC-${++keyCardCounter}`;
  saveCounters();
  return v;
};

export function upsertKeyCard(input: KeyCard) {
  const exists = state.keyCards.some((k) => k.id === input.id);
  if (exists) {
    state.keyCards = state.keyCards.map((k) => (k.id === input.id ? input : k));
  } else {
    state.keyCards = [{ ...input, createdAt: new Date().toISOString() }, ...state.keyCards];
  }
  emit();
}

export function deleteKeyCard(id: string) {
  state.keyCards = state.keyCards.filter((k) => k.id !== id);
  emit();
}

export function keyCardById(id: string | undefined | null) {
  return id ? state.keyCards.find((k) => k.id === id) : undefined;
}

export function keyCardsByReservation(reservationId: string) {
  return state.keyCards.filter((k) => k.reservationId === reservationId);
}

export function activeKeyCardsByReservation(reservationId: string) {
  return state.keyCards.filter((k) => k.reservationId === reservationId && !k.deactivatedAt);
}

/* ==================== Service Requests ==================== */

let serviceRequestCounter = savedCounters.serviceRequestCounter ?? 0;
const nextServiceRequestId = () => {
  const v = `SR-${++serviceRequestCounter}`;
  saveCounters();
  return v;
};

export function upsertServiceRequest(input: ServiceRequest) {
  const exists = state.serviceRequests.some((s) => s.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.serviceRequests = state.serviceRequests.map((s) =>
      s.id === input.id ? { ...s, ...input, updatedAt: now } : s,
    );
  } else {
    state.serviceRequests = [{ ...input, createdAt: now, updatedAt: now }, ...state.serviceRequests];
  }
  emit();
}

export function deleteServiceRequest(id: string) {
  state.serviceRequests = state.serviceRequests.filter((s) => s.id !== id);
  emit();
}

export function serviceRequestById(id: string | undefined | null) {
  return id ? state.serviceRequests.find((s) => s.id === id) : undefined;
}

export function serviceRequestsByReservation(reservationId: string) {
  return state.serviceRequests.filter((s) => s.reservationId === reservationId);
}

export function serviceRequestsByRoom(roomId: string) {
  return state.serviceRequests.filter((s) => s.roomId === roomId);
}

export function pendingServiceRequests() {
  return state.serviceRequests.filter((s) => s.status === "open" || s.status === "in_progress");
}

/* ==================== Messages ==================== */

export function upsertMessage(input: Message) {
  const exists = state.messages.some((m) => m.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.messages = state.messages.map((m) =>
      m.id === input.id ? { ...m, ...input, updatedAt: now } : m,
    );
  } else {
    state.messages = [{ ...input, createdAt: now, updatedAt: now }, ...state.messages];
  }
  emit();
}

export function deleteMessage(id: string) {
  state.messages = state.messages.filter((m) => m.id !== id);
  emit();
}

export function messageById(id: string | undefined | null) {
  return id ? state.messages.find((m) => m.id === id) : undefined;
}

export function messagesByReservation(reservationId: string) {
  return state.messages.filter((m) => m.reservationId === reservationId);
}

export function pendingMessages() {
  return state.messages.filter((m) => m.status === "pending");
}

/* ==================== Wake-Up Calls ==================== */

export function upsertWakeUpCall(input: WakeUpCall) {
  const exists = state.wakeUpCalls.some((w) => w.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.wakeUpCalls = state.wakeUpCalls.map((w) =>
      w.id === input.id ? { ...w, ...input, updatedAt: now } : w,
    );
  } else {
    state.wakeUpCalls = [{ ...input, createdAt: now, updatedAt: now }, ...state.wakeUpCalls];
  }
  emit();
}

export function deleteWakeUpCall(id: string) {
  state.wakeUpCalls = state.wakeUpCalls.filter((w) => w.id !== id);
  emit();
}

export function wakeUpCallById(id: string | undefined | null) {
  return id ? state.wakeUpCalls.find((w) => w.id === id) : undefined;
}

export function wakeUpCallsByReservation(reservationId: string) {
  return state.wakeUpCalls.filter((w) => w.reservationId === reservationId);
}

export function pendingWakeUpCalls() {
  return state.wakeUpCalls.filter((w) => w.status === "scheduled");
}

/* ==================== Lost & Found ==================== */

export function upsertLostFoundItem(input: LostFoundItem) {
  const exists = state.lostFoundItems.some((l) => l.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.lostFoundItems = state.lostFoundItems.map((l) =>
      l.id === input.id ? { ...l, ...input, updatedAt: now } : l,
    );
  } else {
    state.lostFoundItems = [{ ...input, createdAt: now, updatedAt: now }, ...state.lostFoundItems];
  }
  emit();
}

export function deleteLostFoundItem(id: string) {
  state.lostFoundItems = state.lostFoundItems.filter((l) => l.id !== id);
  emit();
}

export function lostFoundItemById(id: string | undefined | null) {
  return id ? state.lostFoundItems.find((l) => l.id === id) : undefined;
}

export function lostFoundItemsByReservation(reservationId: string) {
  return state.lostFoundItems.filter((l) => l.reservationId === reservationId);
}

export function lostFoundItemsByStatus(status: LostFoundItemStatus) {
  return state.lostFoundItems.filter((l) => l.status === status);
}

/* ============================== Users ============================== */

export function upsertUser(u: User) {
  const exists = state.users.some((x) => x.id === u.id);
  state.users = exists ? state.users.map((x) => (x.id === u.id ? u : x)) : [...state.users, u];
  logAudit({
    module: "identity",
    action: exists ? "Updated user" : "Created user",
    entity: `${u.email}`,
    severity: exists ? "info" : "warn",
  });
  deactivateExpiredUsers();
  emit();
}
export function toggleUserActive(id: string) {
  const user = state.users.find((u) => u.id === id);
  if (!user) return;
  state.users = state.users.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u));
  logAudit({
    module: "identity",
    action: user.isActive ? "Deactivated user" : "Activated user",
    entity: user.email,
    severity: "warn",
  });
  emit();
}

export function deleteUser(id: string) {
  const user = state.users.find((u) => u.id === id);
  if (!user) return;
  state.users = state.users.filter((u) => u.id !== id);
  state.userRoles = state.userRoles.filter((ur) => ur.userId !== id);
  logAudit({
    module: "identity",
    action: "Deleted user",
    entity: `${user.email}`,
    severity: "warn",
  });
  emit();
}

export function deactivateExpiredUsers() {
  const now = new Date();
  state.users = state.users.map((u) =>
    u.employmentEndDate && new Date(u.employmentEndDate) <= now && u.isActive
      ? { ...u, isActive: false }
      : u,
  );
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
  const roleName = state.roles.find((r) => r.id === roleId)?.roleName ?? roleId;
  const userName = state.users.find((u) => u.id === userId)?.email ?? userId;
  logAudit({
    module: "identity",
    action: "Assigned role",
    entity: `${userName} → ${roleName}`,
    severity: "info",
  });
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

/* ============================== Roles ============================== */

export function upsertRole(input: RoleRecord) {
  const exists = state.roles.some((r) => r.id === input.id);
  state.roles = exists
    ? state.roles.map((r) => (r.id === input.id ? input : r))
    : [...state.roles, input];
  logAudit({
    module: "identity",
    action: exists ? "Updated role" : "Created role",
    entity: input.roleName,
    severity: "warn",
  });
  emit();
}

export function deleteRole(id: string) {
  const role = state.roles.find((r) => r.id === id);
  if (!role) return;
  state.roles = state.roles.filter((r) => r.id !== id);
  state.userRoles = state.userRoles.filter((ur) => ur.roleId !== id);
  logAudit({
    module: "identity",
    action: "Deleted role",
    entity: role.roleName,
    severity: "warn",
  });
  emit();
}

/* ============================== Tenant ============================== */

export function updateTenant(patch: Partial<Property>) {
  state.tenant = { ...state.tenant, ...patch };
  const idx = state.properties.findIndex((p) => p.id === state.tenant.id);
  if (idx >= 0) {
    state.properties[idx] = { ...state.properties[idx], ...patch };
  }
  logAudit({
    module: "settings",
    action: "Updated tenant configuration",
    entity: state.tenant.name,
    severity: "warn",
  });
  emit();
}

/* ============================== Properties ============================== */

export function upsertProperty(input: Property) {
  const exists = state.properties.some((p) => p.id === input.id);
  state.properties = exists
    ? state.properties.map((p) => (p.id === input.id ? input : p))
    : [...state.properties, input];
  if (state.currentPropertyId === input.id || (!state.currentPropertyId && exists)) {
    state.tenant = { ...input };
    state.currentPropertyId = input.id;
  }
  logAudit({
    module: "settings",
    action: exists ? "Updated property" : "Created property",
    entity: input.name,
    severity: "warn",
  });
  emit();
}

export function deleteProperty(id: string) {
  const prop = state.properties.find((p) => p.id === id);
  if (!prop) return;
  state.properties = state.properties.filter((p) => p.id !== id);
  if (state.currentPropertyId === id) {
    const next = state.properties[0];
    state.currentPropertyId = next?.id ?? "";
    state.tenant = next ? { ...next } : state.tenant;
  }
  logAudit({
    module: "settings",
    action: "Deleted property",
    entity: prop.name,
    severity: "warn",
  });
  emit();
}

export function switchProperty(id: string) {
  const prop = state.properties.find((p) => p.id === id);
  if (!prop) return;
  state.currentPropertyId = id;
  state.tenant = { ...prop };
  logAudit({
    module: "settings",
    action: "Switched property context",
    entity: prop.name,
    severity: "info",
  });
  emit();
}

export function currentProperty(): Property {
  return state.properties.find((p) => p.id === state.currentPropertyId) ?? state.properties[0] ?? state.tenant;
}

/* ============================== Rooms (Extended CRUD) ============================== */

export function createRoom(input: {
  propertyId: string;
  roomTypeId: string;
  roomNumber: string;
  roomName?: string;
  floor: number;
  building?: string;
  bedConfiguration?: Room["bedConfiguration"];
  maxOccupancy: number;
  baseOccupancy: number;
  viewType?: Room["viewType"];
  defaultRatePlanId?: string;
  extraPersonCharge?: number;
  amenities?: string[];
  smokingAllowed: boolean;
  accessibilityFeatures?: string[];
  roomPhotos?: string[];
  housekeepingStatus?: Room["housekeepingStatus"];
}): string {
  const now = new Date().toISOString();
  const id = `R-${Date.now().toString(36).toUpperCase()}`;
  const room: Room = {
    id,
    propertyId: input.propertyId,
    roomTypeId: input.roomTypeId,
    roomNumber: input.roomNumber,
    roomName: input.roomName,
    floor: input.floor,
    building: input.building,
    bedConfiguration: input.bedConfiguration,
    maxOccupancy: input.maxOccupancy,
    baseOccupancy: input.baseOccupancy,
    viewType: input.viewType,
    defaultRatePlanId: input.defaultRatePlanId,
    extraPersonCharge: input.extraPersonCharge,
    amenities: input.amenities,
    smokingAllowed: input.smokingAllowed,
    accessibilityFeatures: input.accessibilityFeatures,
    roomPhotos: input.roomPhotos,
    status: "available",
    housekeepingStatus: input.housekeepingStatus ?? "clean",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  state.rooms = [...state.rooms, room];
  const prop = state.properties.find((p) => p.id === input.propertyId);
  if (prop) {
    prop.totalRoomCount = (prop.totalRoomCount ?? 0) + 1;
    if (state.currentPropertyId === prop.id) state.tenant = { ...prop };
  }
  logAudit({
    module: "rooms",
    action: "Created room",
    entity: `${input.roomNumber} — ${prop?.name ?? input.propertyId}`,
    severity: "info",
  });
  emit();
  return id;
}

export function updateRoom(id: string, patch: Partial<Room>) {
  const room = state.rooms.find((r) => r.id === id);
  if (!room) return;
  state.rooms = state.rooms.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r));
  logAudit({
    module: "rooms",
    action: "Updated room",
    entity: `${room.roomNumber}`,
    severity: "info",
  });
  emit();
}

/* ==================== Report Access Logs (44) ==================== */

export function upsertReportAccessLog(input: ReportAccessLog) {
  const exists = state.reportAccessLogs.some((l) => l.id === input.id);
  if (exists) {
    state.reportAccessLogs = state.reportAccessLogs.map((l) => (l.id === input.id ? input : l));
  } else {
    state.reportAccessLogs = [{ ...input, accessedAt: new Date().toISOString() }, ...state.reportAccessLogs];
  }
  emit();
}

export function deleteReportAccessLog(id: string) {
  state.reportAccessLogs = state.reportAccessLogs.filter((l) => l.id !== id);
  emit();
}

export function reportAccessLogById(id: string | undefined | null) {
  return id ? state.reportAccessLogs.find((l) => l.id === id) : undefined;
}

export function reportAccessLogsByUser(userId: string) {
  return state.reportAccessLogs.filter((l) => l.userId === userId);
}

/* ==================== Scheduled Report Configs (45) ==================== */

export function upsertScheduledReportConfig(input: ScheduledReportConfig) {
  const exists = state.scheduledReportConfigs.some((c) => c.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.scheduledReportConfigs = state.scheduledReportConfigs.map((c) =>
      c.id === input.id ? { ...c, ...input, updatedAt: now } : c,
    );
  } else {
    state.scheduledReportConfigs = [{ ...input, createdAt: now, updatedAt: now }, ...state.scheduledReportConfigs];
  }
  emit();
}

export function deleteScheduledReportConfig(id: string) {
  state.scheduledReportConfigs = state.scheduledReportConfigs.filter((c) => c.id !== id);
  emit();
}

export function scheduledReportConfigById(id: string | undefined | null) {
  return id ? state.scheduledReportConfigs.find((c) => c.id === id) : undefined;
}

/* ==================== POS Outlets (46) ==================== */

export function upsertPosOutlet(input: PosOutlet) {
  const exists = state.posOutlets.some((o) => o.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.posOutlets = state.posOutlets.map((o) => (o.id === input.id ? { ...o, ...input } : o));
  } else {
    state.posOutlets = [{ ...input, createdAt: now }, ...state.posOutlets];
  }
  emit();
}

export function deletePosOutlet(id: string): { ok: boolean; errors?: string[] } {
  const outlet = state.posOutlets.find((o) => o.id === id);
  if (!outlet) return { ok: false, errors: ["Outlet not found"] };
  const hasTables = state.posTables.some((t) => t.posOutletId === id);
  const hasCategories = state.menuCategories.some((c) => c.posOutletId === id);
  const hasItems = state.menuItems.some((m) => m.posOutletId === id);
  const hasOpenTabs = state.posTabs.some((t) => t.posOutletId === id && t.status === "open");
  if (hasTables || hasCategories || hasItems || hasOpenTabs) {
    return { ok: false, errors: ["Outlet still has linked tables, menu items, or open tabs. Move or clear them first."] };
  }
  state.posOutlets = state.posOutlets.filter((o) => o.id !== id);
  emit();
  return { ok: true };
}

export function posOutletById(id: string | undefined | null) {
  return id ? state.posOutlets.find((o) => o.id === id) : undefined;
}

/* ==================== Menu Categories (47) ==================== */

export function upsertMenuCategory(input: MenuCategory) {
  const exists = state.menuCategories.some((c) => c.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.menuCategories = state.menuCategories.map((c) => (c.id === input.id ? { ...c, ...input } : c));
  } else {
    state.menuCategories = [{ ...input, createdAt: now }, ...state.menuCategories];
  }
  emit();
}

export function deleteMenuCategory(id: string) {
  state.menuCategories = state.menuCategories.filter((c) => c.id !== id);
  emit();
}

export function menuCategoryById(id: string | undefined | null) {
  return id ? state.menuCategories.find((c) => c.id === id) : undefined;
}

export function menuCategoriesByOutlet(posOutletId: string) {
  return state.menuCategories.filter((c) => c.posOutletId === posOutletId);
}

/* ==================== Menu Items (48) ==================== */

export function upsertMenuItem(input: MenuItem) {
  const exists = state.menuItems.some((i) => i.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.menuItems = state.menuItems.map((i) => (i.id === input.id ? { ...i, ...input, updatedAt: now } : i));
  } else {
    state.menuItems = [{ ...input, createdAt: now, updatedAt: now }, ...state.menuItems];
  }
  emit();
}

export function deleteMenuItem(id: string) {
  state.menuItems = state.menuItems.filter((i) => i.id !== id);
  emit();
}

export function menuItemById(id: string | undefined | null) {
  return id ? state.menuItems.find((i) => i.id === id) : undefined;
}

export function menuItemsByCategory(menuCategoryId: string) {
  return state.menuItems.filter((i) => i.menuCategoryId === menuCategoryId);
}

export function menuItemsByOutlet(posOutletId: string) {
  return state.menuItems.filter((i) => i.posOutletId === posOutletId);
}

export const SERVICE_PERIOD_OPTIONS = [
  { value: "all_day", label: "All day" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "bar_only", label: "Bar hours" },
] as const;

export type ServicePeriod = (typeof SERVICE_PERIOD_OPTIONS)[number]["value"];

const PERIOD_WINDOWS: Record<ServicePeriod, { start: number; end: number }> = {
  all_day: { start: 0, end: 24 * 60 },
  breakfast: { start: 6 * 60, end: 11 * 60 },
  lunch: { start: 11 * 60, end: 15 * 60 },
  dinner: { start: 17 * 60, end: 22 * 60 },
  bar_only: { start: 16 * 60, end: 26 * 60 },
};

export function isMenuItemAvailable(
  item: Pick<MenuItem, "isActive" | "isSoldOut" | "availabilityPeriods">,
  now = new Date(),
): boolean {
  if (!item.isActive || item.isSoldOut) return false;
  const periods = item.availabilityPeriods && item.availabilityPeriods.length > 0 ? item.availabilityPeriods : ["all_day"];
  const mins = now.getHours() * 60 + now.getMinutes();
  return periods.some((p) => {
    const w = PERIOD_WINDOWS[p as ServicePeriod];
    if (!w) return false;
    if (w.end > 24 * 60) return mins >= w.start || mins < w.end - 24 * 60;
    return mins >= w.start && mins < w.end;
  });
}

export function menuItemStockStatus(item: MenuItem): { soldOut: boolean; remaining?: number } {
  if (!item.stockItemId) return { soldOut: false };
  const remaining = state.stockItems.find((i) => i.id === item.stockItemId)?.currentQuantity ?? 0;
  return { soldOut: remaining <= 0, remaining };
}

/* ==================== Menu Modifiers (49) ==================== */

export function upsertMenuModifier(input: MenuModifier) {
  const exists = state.menuModifiers.some((m) => m.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.menuModifiers = state.menuModifiers.map((m) => (m.id === input.id ? { ...m, ...input } : m));
  } else {
    state.menuModifiers = [{ ...input, createdAt: now }, ...state.menuModifiers];
  }
  emit();
}

export function deleteMenuModifier(id: string) {
  state.menuModifiers = state.menuModifiers.filter((m) => m.id !== id);
  emit();
}

export function menuModifiersByItem(menuItemId: string) {
  return state.menuModifiers.filter((m) => m.menuItemId === menuItemId);
}

/* ==================== POS Tables (50) ==================== */

export function upsertPosTable(input: PosTable) {
  const exists = state.posTables.some((t) => t.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.posTables = state.posTables.map((t) => (t.id === input.id ? { ...t, ...input } : t));
  } else {
    state.posTables = [{ ...input, createdAt: now }, ...state.posTables];
  }
  emit();
}

export function deletePosTable(id: string) {
  state.posTables = state.posTables.filter((t) => t.id !== id);
  emit();
}

export function posTableById(id: string | undefined | null) {
  return id ? state.posTables.find((t) => t.id === id) : undefined;
}

export function posTablesByOutlet(posOutletId: string) {
  return state.posTables.filter((t) => t.posOutletId === posOutletId);
}

export function openTabForTable(tableId: string): PosTab | undefined {
  return state.posTabs.find((t) => t.posTableId === tableId && t.status === "open");
}

export type PosTableStatus = "free" | "occupied" | "reserved";

export function posTableStatus(tableId: string, now = new Date()): PosTableStatus {
  if (openTabForTable(tableId)) return "occupied";
  const table = state.posTables.find((t) => t.id === tableId);
  if (table?.reservedUntil && new Date(table.reservedUntil) > now) return "reserved";
  return "free";
}

export function setPosTableReservation(
  tableId: string,
  reservedUntil?: string,
  reservationId?: string,
) {
  state.posTables = state.posTables.map((t) =>
    t.id === tableId
      ? { ...t, reservedUntil: reservedUntil ?? undefined, reservationId: reservationId ?? undefined }
      : t,
  );
  emit();
}

function recomputePosTabAmounts(tabId: string) {
  const tab = state.posTabs.find((t) => t.id === tabId);
  if (!tab) return;
  const items = state.posTabItems.filter((i) => i.posTabId === tabId && !i.isVoided);
  const outlet = state.posOutlets.find((o) => o.id === tab.posOutletId);
  const serviceChargePct = outlet?.serviceChargePct ?? 0;
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const serviceChargeAmount = Math.round((subtotal * serviceChargePct) / 100);
  const vatRate = currentVatRate();
  let vatAmount = 0;
  for (const item of items) {
    const storeItem = state.menuItems.find((m) => m.id === item.menuItemId);
    const vt = storeItem?.vatTreatment ?? "inclusive";
    const itemTotal = item.unitPrice * item.quantity;
    const taxable = vt === "exempt" ? 0 : vt === "inclusive" ? Math.round(itemTotal / (1 + vatRate)) : itemTotal;
    if (vt !== "exempt") vatAmount += Math.round(taxable * vatRate);
  }
  state.posTabs = state.posTabs.map((t) =>
    t.id === tabId
      ? { ...t, subtotal, vatAmount, serviceChargeAmount, totalAmount: subtotal + serviceChargeAmount + vatAmount, updatedAt: new Date().toISOString() }
      : t,
  );
}

/* ==================== POS Tabs (51) ==================== */

export function upsertPosTab(input: PosTab) {
  const exists = state.posTabs.some((t) => t.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.posTabs = state.posTabs.map((t) => (t.id === input.id ? { ...t, ...input, updatedAt: now } : t));
  } else {
    state.posTabs = [{ ...input, createdAt: now, updatedAt: now }, ...state.posTabs];
  }
  emit();
}

export function deletePosTab(id: string) {
  state.posTabs = state.posTabs.filter((t) => t.id !== id);
  emit();
}

export function posTabById(id: string | undefined | null) {
  return id ? state.posTabs.find((t) => t.id === id) : undefined;
}

export function openPosTabsByOutlet(posOutletId: string) {
  return state.posTabs.filter((t) => t.posOutletId === posOutletId && t.status === "open");
}

export function posTabsByTable(posTableId: string) {
  return state.posTabs.filter((t) => t.posTableId === posTableId);
}

export function openFolioByGuestName(name: string) {
  const nameLower = name.toLowerCase();
  const guest = state.guests.find((g) =>
    g.fullName.toLowerCase().includes(nameLower) ||
    g.email.toLowerCase().includes(nameLower) ||
    g.phone.includes(name),
  );
  if (!guest) return undefined;
  return state.folios.find((f) => f.guestProfileId === guest.id && f.status === "open");
}

export function settlePosTab(
  tabId: string,
  input: {
    settlementMethod: PosSettlementMethod;
    settledBy: string;
    paymentMethod?: PaymentMethod;
    folioId?: string;
    roomChargeSignedBy?: string;
  },
): string[] {
  const tab = state.posTabs.find((t) => t.id === tabId);
  if (!tab) return [];
  const items = state.posTabItems.filter((i) => i.posTabId === tabId && !i.isVoided && !i.isComplimentary);
  const shortages: string[] = [];
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discount = Math.max(0, tab.discount ?? 0);
  const applicableBase = Math.max(0, subtotal - discount);
  const outlet = state.posOutlets.find((o) => o.id === tab.posOutletId);
  const serviceChargePct = outlet?.serviceChargePct ?? 0;
  const serviceChargeAmount = Math.round(applicableBase * serviceChargePct / 100);

  /* Per-item VAT calculation using each menu item's vatTreatment */
  const vatRate = currentVatRate();
  const itemDetails: { menuItemId: string; quantity: number; unitPrice: number; vatTreatment: VatTreatment }[] = [];
  let totalVat = 0;
  for (const item of items) {
    const storeItem = state.menuItems.find((m) => m.id === item.menuItemId);
    const vt = storeItem?.vatTreatment ?? "inclusive";
    const itemTotal = item.unitPrice * item.quantity;
    const taxable = vt === "exempt" ? 0 : vt === "inclusive" ? Math.round(itemTotal / (1 + vatRate)) : itemTotal;
    const vat = vt === "exempt" ? 0 : Math.round(taxable * vatRate);
    totalVat += vat;
    itemDetails.push({ menuItemId: item.menuItemId, quantity: item.quantity, unitPrice: item.unitPrice, vatTreatment: vt });
  }

const totalAmount = applicableBase + totalVat + serviceChargeAmount;
  const newStatus = input.settlementMethod === "room_charge" ? "room_charged" : "settled";

  state.posTabs = state.posTabs.map((t) =>
    t.id === tabId
? {
              ...t,
              status: newStatus,
              settlementMethod: input.settlementMethod,
              paymentMethod: input.settlementMethod === "direct_payment" ? input.paymentMethod : undefined,
              subtotal,
              vatAmount: totalVat,
              serviceChargeAmount,
              totalAmount,
              settledAt: new Date().toISOString(),
              settledBy: input.settledBy,
              roomChargeFolioId: input.settlementMethod === "room_charge" ? input.folioId : undefined,
              roomChargeSignedAt: input.settlementMethod === "room_charge" ? new Date().toISOString() : undefined,
              roomChargeSignedBy: input.settlementMethod === "room_charge" ? input.roomChargeSignedBy : undefined,
              roomChargeAuthRef: input.settlementMethod === "room_charge" ? `AUTH-${tabId.slice(-4)}-${Date.now().toString().slice(-6)}` : undefined,
            }
      : t,
  );

  if (input.settlementMethod === "room_charge" && input.folioId) {
    for (const item of items) {
      const storeItem = state.menuItems.find((m) => m.id === item.menuItemId);
      addCharge(input.folioId, {
        description: `${item.menuItemId} x${item.quantity}`,
        amount: item.unitPrice * item.quantity,
        quantity: item.quantity,
        unitAmount: item.unitPrice,
        type: "fnb",
        chargeSource: "pos_charge",
        vatTreatment: storeItem?.vatTreatment,
        vatAmount: itemDetails.find((d) => d.menuItemId === item.menuItemId)
          ? Math.round(
              (item.unitPrice * item.quantity) /
                ((storeItem?.vatTreatment ?? "inclusive") === "inclusive" ? 1 + vatRate : 1) *
                vatRate
            )
          : undefined,
        postedBy: input.settledBy,
      });
    }
    if (serviceChargeAmount > 0) {
      addCharge(input.folioId, {
        description: `Service charge (${serviceChargePct}%)`,
        amount: serviceChargeAmount,
        type: "fnb",
        chargeSource: "pos_charge",
        vatTreatment: "inclusive" as VatTreatment,
        postedBy: input.settledBy,
      });
    }
    if (discount > 0) {
      addCharge(input.folioId, {
        description: `Discount${tab.discountReason ? ` (${tab.discountReason})` : ""}`,
        amount: -discount,
        type: "fnb",
        chargeSource: "pos_charge",
        vatTreatment: "exempt" as VatTreatment,
        postedBy: input.settledBy,
      });
    }
  }

  if (input.settlementMethod === "direct_payment" && input.paymentMethod && input.folioId) {
    addPayment(input.folioId, {
      method: input.paymentMethod,
      amount: totalAmount,
      receivedBy: input.settledBy,
    });
  }

  /* EFRIS invoice on every POS settlement */
  const inv = generatePosInvoice(tabId, itemDetails, subtotal, serviceChargeAmount, totalAmount, input.settledBy);
  if (inv) {
    state.posTabs = state.posTabs.map((t) =>
      t.id === tabId ? { ...t, efrisReceiptId: inv.invoiceNo } : t,
    );
    /* Fire-and-forget EFRIS submission (async, non-blocking) */
    submitToEFRIS(inv.id, input.settledBy, "pos").catch(() => {});
  }

  /*
   * Stock decrement — if the outlet has inventory tracking enabled.
   * Menu items WITH a recipe/BOM deduct each raw ingredient from the Kitchen
   * Store (SL002); items without a recipe fall back to their single linked
   * stock item (direct-sale stock, e.g. beverages at the bar).
   */
  if (outlet?.inventoryEnabled) {
    for (const item of items) {
      const storeItem = state.menuItems.find((m) => m.id === item.menuItemId);
      if (!storeItem) continue;
      const recipe = recipeLinesForMenuItem(storeItem.id);
      if (recipe.length > 0) {
        let ingredientCost = 0;
        for (const line of recipe) {
          const need = line.quantity * item.quantity;
          ingredientCost += line.unitCost * need;
          const available = quantityAtLocation(line.stockItemId, KITCHEN_STORE);
          if (available < need) {
            shortages.push(
              `${storeItem.name}: ${line.name} need ${need} ${line.unit}, only ${available} at Kitchen Store`,
            );
          }
          addStockMovement({
            stockItemId: line.stockItemId,
            type: "pos_sale",
            quantity: -need,
            referenceType: "recipe_consumption",
            referenceId: tabId,
            posOutletId: tab.posOutletId,
            storageLocationId: KITCHEN_STORE,
            notes: `Recipe consumption — ${storeItem.name} x${item.quantity}`,
            createdBy: input.settledBy,
          });
        }
        recordMenuItemSale({
          posTabId: tabId,
          posOutletId: tab.posOutletId,
          menuItemId: storeItem.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          ingredientCost,
          settledBy: input.settledBy,
        });
      } else if (storeItem.stockItemId) {
        addStockMovement({
          stockItemId: storeItem.stockItemId,
          type: "pos_sale",
          quantity: -item.quantity,
          referenceType: "pos_tab",
          referenceId: tabId,
          posOutletId: tab.posOutletId,
          createdBy: input.settledBy,
        });
      }
    }
  }

  logAudit({
    module: "pos",
    action: `Tab ${newStatus}`,
    entity: `${tabId} ${fmtUGX(totalAmount)} via ${input.settlementMethod}`,
    severity: "info",
  });
  emit();
  return shortages;
}

export function setItemComp(
  tabId: string,
  itemId: string,
  input: { isComp: boolean; reason?: string; authorisedBy?: string },
) {
  state.posTabItems = state.posTabItems.map((i) =>
    i.id === itemId && i.posTabId === tabId
      ? {
          ...i,
          isComplimentary: input.isComp,
          compReason: input.isComp ? input.reason : undefined,
          compAuthorisedBy: input.isComp ? input.authorisedBy : undefined,
        }
      : i,
  );
  logAudit({
    module: "pos",
    action: input.isComp ? "Item comped" : "Comp removed",
    entity: `${itemId}${input.isComp ? ` by ${input.authorisedBy}` : ""}`,
    severity: "info",
  });
  emit();
}

export function applyPosDiscount(
  tabId: string,
  input: { amount: number; reason: string; approvedBy: string },
) {
  state.posTabs = state.posTabs.map((t) => {
    if (t.id !== tabId) return t;
    const pct = t.subtotal > 0 ? Math.round((input.amount / t.subtotal) * 100) : undefined;
    return {
      ...t,
      discount: Math.max(0, input.amount),
      discountPct: pct,
      discountReason: input.reason,
      discountApprovedBy: input.approvedBy,
    };
  });
  logAudit({
    module: "pos",
    action: "Discount applied",
    entity: `${tabId} ${fmtUGX(input.amount)} by ${input.approvedBy}`,
    severity: "info",
  });
  emit();
}

export function clearPosDiscount(tabId: string) {
  state.posTabs = state.posTabs.map((t) =>
    t.id === tabId ? { ...t, discount: undefined, discountPct: undefined, discountReason: undefined, discountApprovedBy: undefined } : t,
  );
  emit();
}

export function splitPosTab(
  tabId: string,
  itemIds: string[],
  newTabInput: { posOutletId?: string; posTableId?: string; orderType: OrderType; coverCount: number },
): string | undefined {
  const tab = state.posTabs.find((t) => t.id === tabId);
  if (!tab || itemIds.length === 0) return undefined;
  const itemsToMove = state.posTabItems.filter((i) => i.posTabId === tabId && itemIds.includes(i.id));
  if (itemsToMove.length === 0) return undefined;

  const newTabId = `TAB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  upsertPosTab({
    id: newTabId,
    propertyId: tab.propertyId,
    posOutletId: newTabInput.posOutletId || tab.posOutletId,
    posTableId: newTabInput.posTableId ?? tab.posTableId,
    orderType: newTabInput.orderType,
    coverCount: newTabInput.coverCount,
    status: "open",
    subtotal: 0,
    vatAmount: 0,
    serviceChargeAmount: 0,
    totalAmount: 0,
    openedAt: new Date().toISOString(),
  });

  for (const item of itemsToMove) {
    deletePosTabItem(item.id);
    upsertPosTabItem({ ...item, id: `PTI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, posTabId: newTabId });
  }

  recomputePosTabAmounts(tabId);
  recomputePosTabAmounts(newTabId);
  emit();
  return newTabId;
}

type SplitNewTabInput = { posOutletId?: string; posTableId?: string; orderType: OrderType; coverCount: number };

export function splitPosTabEvenly(
  tabId: string,
  parts: number,
  newTabInput: SplitNewTabInput,
): { ok: boolean; errors?: string[]; tabIds: string[] } {
  const tab = state.posTabs.find((t) => t.id === tabId);
  if (!tab) return { ok: false, errors: ["Tab not found"], tabIds: [] };
  if (parts < 2) return { ok: false, errors: ["Split into at least 2 parts"], tabIds: [] };
  const items = state.posTabItems.filter((i) => i.posTabId === tabId && !i.isVoided);
  if (items.length === 0) return { ok: false, errors: ["No items to split"], tabIds: [] };
  const groups: { ids: string[]; value: number }[] = Array.from({ length: parts }, () => ({ ids: [], value: 0 }));
  const sorted = [...items].sort((a, b) => b.unitPrice * b.quantity - a.unitPrice * a.quantity);
  for (const item of sorted) {
    const g = groups.reduce((min, cur) => (cur.value < min.value ? cur : min), groups[0]);
    g.ids.push(item.id);
    g.value += item.unitPrice * item.quantity;
  }
  const tabIds: string[] = [];
  for (const g of groups) {
    if (g.ids.length === 0) continue;
    const id = splitPosTab(tabId, g.ids, newTabInput);
    if (id) tabIds.push(id);
  }
  emit();
  return { ok: tabIds.length > 0, tabIds };
}

export function splitPosTabBySeat(
  tabId: string,
  newTabInput: SplitNewTabInput,
): { ok: boolean; errors?: string[]; tabIds: string[] } {
  const items = state.posTabItems.filter((i) => i.posTabId === tabId && !i.isVoided && i.seatNumber && i.seatNumber > 0);
  if (items.length === 0) return { ok: false, errors: ["No items have seat numbers assigned"], tabIds: [] };
  const bySeat = new Map<number, string[]>();
  for (const item of items) {
    const seat = item.seatNumber ?? 0;
    const arr = bySeat.get(seat) ?? [];
    arr.push(item.id);
    bySeat.set(seat, arr);
  }
  const tabIds: string[] = [];
  for (const ids of bySeat.values()) {
    const id = splitPosTab(tabId, ids, newTabInput);
    if (id) tabIds.push(id);
  }
  emit();
  return { ok: tabIds.length > 0, tabIds };
}

export function splitPosTabByAmount(
  tabId: string,
  amounts: number[],
  newTabInput: SplitNewTabInput,
): { ok: boolean; errors?: string[]; tabIds: string[] } {
  const tab = state.posTabs.find((t) => t.id === tabId);
  if (!tab) return { ok: false, errors: ["Tab not found"], tabIds: [] };
  const total = tab.totalAmount;
  const clean = amounts.map((a) => Math.max(0, Math.round(a)));
  if (clean.length < 2) return { ok: false, errors: ["At least 2 split amounts"], tabIds: [] };
  const sum = clean.reduce((s, a) => s + a, 0);
  if (sum <= 0 || sum > total) return { ok: false, errors: [`Split amounts must sum to > 0 and ≤ ${fmtUGX(total)}`], tabIds: [] };
  const items = state.posTabItems.filter((i) => i.posTabId === tabId && !i.isVoided);
  const sorted = [...items].sort((a, b) => b.unitPrice * b.quantity - a.unitPrice * a.quantity);
  const groups: { ids: string[]; target: number; value: number }[] = clean.map((target) => ({ ids: [], target, value: 0 }));
  let gi = 0;
  for (const item of sorted) {
    const value = item.unitPrice * item.quantity;
    while (gi < groups.length - 1 && groups[gi].value + value > groups[gi].target && groups[gi].value >= groups[gi].target) gi += 1;
    groups[gi].ids.push(item.id);
    groups[gi].value += value;
  }
  const tabIds: string[] = [];
  for (const g of groups) {
    if (g.ids.length === 0) continue;
    const id = splitPosTab(tabId, g.ids, newTabInput);
    if (id) tabIds.push(id);
  }
  emit();
  return { ok: tabIds.length > 0, tabIds };
}

export function mergePosTabs(
  targetTabId: string,
  sourceTabId: string,
  mergedBy: string,
): { ok: boolean; errors?: string[] } {
  if (targetTabId === sourceTabId) return { ok: false, errors: ["Cannot merge a tab into itself"] };
  const target = state.posTabs.find((t) => t.id === targetTabId);
  const source = state.posTabs.find((t) => t.id === sourceTabId);
  if (!target || !source) return { ok: false, errors: ["Tab not found"] };
  if (target.status !== "open" || source.status !== "open") return { ok: false, errors: ["Both tabs must be open to merge"] };
  const sourceItems = state.posTabItems.filter((i) => i.posTabId === sourceTabId && !i.isVoided);
  if (sourceItems.length === 0) return { ok: false, errors: ["Source tab has no items to merge"] };
  for (const item of sourceItems) {
    const oldId = item.id;
    const newId = `PTI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    deletePosTabItem(oldId);
    upsertPosTabItem({ ...item, id: newId, posTabId: targetTabId });
    const affectedKotIds = kotItemsForPosTabItem(oldId).map((ki) => ki.kotId);
    state.kotItems = state.kotItems.map((ki) => (ki.posTabItemId === oldId ? { ...ki, posTabItemId: newId } : ki));
    for (const kotId of affectedKotIds) {
      state.kots = state.kots.map((k) =>
        k.id === kotId && k.posTabId === sourceTabId ? { ...k, posTabId: targetTabId } : k,
      );
    }
  }
  state.posTabs = state.posTabs.map((t) =>
    t.id === sourceTabId
      ? { ...t, status: "merged" as PosTabStatus, settledBy: mergedBy, settledAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      : t,
  );
  recomputePosTabAmounts(targetTabId);
  emit();
  return { ok: true };
}

/* ==================== POS Tab Items (52) ==================== */

export function upsertPosTabItem(input: PosTabItem) {
  const exists = state.posTabItems.some((i) => i.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.posTabItems = state.posTabItems.map((i) => (i.id === input.id ? { ...i, ...input } : i));
  } else {
    state.posTabItems = [{ ...input, createdAt: now }, ...state.posTabItems];
  }
  emit();
}

export function deletePosTabItem(id: string) {
  state.posTabItems = state.posTabItems.filter((i) => i.id !== id);
  emit();
}

export function posTabItemsByTab(posTabId: string) {
  return state.posTabItems.filter((i) => i.posTabId === posTabId);
}

/* ==================== Recipes / BOM + Food Cost (7) ==================== */

const KITCHEN_STORE = "SL002";

export type RecipeLineView = {
  line: MenuItemRecipeLine;
  stockItemId: string;
  name: string;
  unit: string;
  quantity: number;
  unitCost: number;
  cost: number;
};

export function recipeLinesForMenuItem(menuItemId: string): RecipeLineView[] {
  return state.menuItemRecipes
    .filter((l) => l.menuItemId === menuItemId)
    .map((line) => {
      const item = stockItemById(line.stockItemId);
      const cost = (item?.unitCost ?? 0) * line.quantity;
      return {
        line,
        stockItemId: line.stockItemId,
        name: item?.name ?? line.stockItemId,
        unit: item?.unit ?? "",
        quantity: line.quantity,
        unitCost: item?.unitCost ?? 0,
        cost,
      };
    });
}

export function menuItemRecipeCost(menuItemId: string): number {
  return recipeLinesForMenuItem(menuItemId).reduce((s, l) => s + l.cost, 0);
}

/**
 * Replaces a menu item's recipe (BOM) wholesale. `lines` are the raw
 * ingredients per single dish; existing lines for the item are removed.
 */
export function saveMenuItemRecipe(
  menuItemId: string,
  lines: { stockItemId: string; quantity: number }[],
  savedBy: string,
): { ok: boolean; errors?: string[] } {
  const clean = lines.filter((l) => l.stockItemId && l.quantity > 0);
  const errors: string[] = [];
  for (const l of clean) {
    if (!stockItemById(l.stockItemId)) errors.push(`Unknown stock item ${l.stockItemId}.`);
  }
  if (errors.length > 0) return { ok: false, errors };
  const now = new Date().toISOString();
  state.menuItemRecipes = [
    ...state.menuItemRecipes.filter((l) => l.menuItemId !== menuItemId),
    ...clean.map((l) => ({
      id: nextMenuItemRecipeLineId(),
      menuItemId,
      stockItemId: l.stockItemId,
      quantity: l.quantity,
      createdAt: now,
    })),
  ];
  const item = state.menuItems.find((m) => m.id === menuItemId);
  logAudit({
    module: "pos",
    action: "Recipe / BOM saved",
    entity: `${item?.name ?? menuItemId} (${clean.length} ingredient${clean.length === 1 ? "" : "s"})`,
    severity: "info",
  });
  emit();
  return { ok: true };
}

export function deleteMenuItemRecipe(menuItemId: string) {
  state.menuItemRecipes = state.menuItemRecipes.filter((l) => l.menuItemId !== menuItemId);
  emit();
}

export function recordMenuItemSale(input: {
  posTabId: string;
  posOutletId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  ingredientCost: number;
  settledBy: string;
}) {
  const item = state.menuItems.find((m) => m.id === input.menuItemId);
  state.menuItemSales = [
    {
      id: nextMenuItemSaleId(),
      posTabId: input.posTabId,
      posOutletId: input.posOutletId,
      menuItemId: input.menuItemId,
      name: item?.name ?? input.menuItemId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      revenue: input.unitPrice * input.quantity,
      ingredientCost: input.ingredientCost,
      settledAt: new Date().toISOString(),
    },
    ...state.menuItemSales,
  ];
  emit();
}

export type FoodCostReport = {
  revenue: number;
  cogs: number;
  foodCostPct: number;
  grossProfit: number;
  grossMarginPct: number;
  salesCount: number;
  byOutlet: {
    posOutletId: string;
    outletName: string;
    revenue: number;
    cogs: number;
    foodCostPct: number;
  }[];
  byItem: {
    menuItemId: string;
    name: string;
    quantity: number;
    revenue: number;
    cogs: number;
    foodCostPct: number;
    recipeCost: number;
  }[];
};

export function foodCostReport(opts: { posOutletId?: string } = {}): FoodCostReport {
  const sales = state.menuItemSales.filter(
    (s) => !opts.posOutletId || s.posOutletId === opts.posOutletId,
  );
  const revenue = sales.reduce((sum, s) => sum + s.revenue, 0);
  const cogs = sales.reduce((sum, s) => sum + s.ingredientCost, 0);
  const byItemMap = new Map<string, FoodCostReport["byItem"][number]>();
  for (const s of sales) {
    const entry = byItemMap.get(s.menuItemId);
    if (entry) {
      entry.quantity += s.quantity;
      entry.revenue += s.revenue;
      entry.cogs += s.ingredientCost;
    } else {
      byItemMap.set(s.menuItemId, {
        menuItemId: s.menuItemId,
        name: s.name,
        quantity: s.quantity,
        revenue: s.revenue,
        cogs: s.ingredientCost,
        foodCostPct: 0,
        recipeCost: menuItemRecipeCost(s.menuItemId),
      });
    }
  }
  const byOutletMap = new Map<string, FoodCostReport["byOutlet"][number]>();
  for (const s of sales) {
    const entry = byOutletMap.get(s.posOutletId);
    if (entry) {
      entry.revenue += s.revenue;
      entry.cogs += s.ingredientCost;
    } else {
      byOutletMap.set(s.posOutletId, {
        posOutletId: s.posOutletId,
        outletName: posOutletById(s.posOutletId)?.name ?? s.posOutletId,
        revenue: s.revenue,
        cogs: s.ingredientCost,
        foodCostPct: 0,
      });
    }
  }
  const byItem = [...byItemMap.values()].map((i) => ({
    ...i,
    foodCostPct: i.revenue > 0 ? (i.cogs / i.revenue) * 100 : 0,
  }));
  const byOutlet = [...byOutletMap.values()].map((o) => ({
    ...o,
    foodCostPct: o.revenue > 0 ? (o.cogs / o.revenue) * 100 : 0,
  }));
  return {
    revenue,
    cogs,
    foodCostPct: revenue > 0 ? (cogs / revenue) * 100 : 0,
    grossProfit: revenue - cogs,
    grossMarginPct: revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0,
    salesCount: sales.length,
    byOutlet: byOutlet.sort((a, b) => b.revenue - a.revenue),
    byItem: byItem.sort((a, b) => b.cogs - a.cogs),
  };
}

/* ==================== KOTs (53) ==================== */

export function upsertKot(input: Kot) {
  const exists = state.kots.some((k) => k.id === input.id);
  if (exists) {
    state.kots = state.kots.map((k) => (k.id === input.id ? input : k));
  } else {
    state.kots = [{ ...input, createdAt: new Date().toISOString() }, ...state.kots];
  }
  emit();
}

export function deleteKot(id: string) {
  state.kots = state.kots.filter((k) => k.id !== id);
  emit();
}

export function kotById(id: string | undefined | null) {
  return id ? state.kots.find((k) => k.id === id) : undefined;
}

export function kotsByTab(posTabId: string) {
  return state.kots.filter((k) => k.posTabId === posTabId);
}

/* ==================== KOT Items (54) ==================== */

export function upsertKotItem(input: KotItem) {
  const exists = state.kotItems.some((i) => i.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.kotItems = state.kotItems.map((i) => (i.id === input.id ? { ...i, ...input } : i));
  } else {
    state.kotItems = [{ ...input, createdAt: now }, ...state.kotItems];
  }
  emit();
}

export function deleteKotItem(id: string) {
  state.kotItems = state.kotItems.filter((i) => i.id !== id);
  emit();
}

export function kotItemsByKot(kotId: string) {
  return state.kotItems.filter((i) => i.kotId === kotId);
}

export function kotItemsForPosTabItem(posTabItemId: string) {
  return state.kotItems.filter((i) => i.posTabItemId === posTabItemId);
}

export function posTabItemNeedsKot(item: Pick<PosTabItem, "id" | "isVoided">): boolean {
  return !item.isVoided && kotItemsForPosTabItem(item.id).length === 0;
}

const BAR_CATEGORY_RE = /bar|beverage|cocktail|spirit|wine|juice|mocktail|shake|soft drink/i;
const BAR_NAME_RE = /drink|juice|soda|water|beer|wine|cocktail|spirit|whisky|vodka|gin|rum|liquor|mocktail|smoothie|shake|waragi/i;

export function stationForMenuItem(menuItemId: string): KotStation {
  const item = state.menuItems.find((i) => i.id === menuItemId);
  if (!item) return "kitchen";
  const category = state.menuCategories.find((c) => c.id === item.menuCategoryId);
  if (category && BAR_CATEGORY_RE.test(category.name)) return "bar";
  if (BAR_NAME_RE.test(item.name)) return "bar";
  return "kitchen";
}

export function voidKotItemsForPosTabItem(posTabItemId: string, reason?: string) {
  const now = new Date().toISOString();
  state.kotItems = state.kotItems.map((i) =>
    i.posTabItemId === posTabItemId && i.status !== "voided" ? { ...i, status: "voided" as KotItemStatus, voidReason: reason, voidedAt: now } : i,
  );
  emit();
}

export function voidKotTicket(kotId: string, reason?: string) {
  const now = new Date().toISOString();
  state.kotItems = state.kotItems.map((i) =>
    i.kotId === kotId && i.status !== "voided" ? { ...i, status: "voided" as KotItemStatus, voidReason: reason, voidedAt: now } : i,
  );
  state.kots = state.kots.map((k) => (k.id === kotId ? { ...k, status: "voided", voidReason: reason, voidedAt: now } : k));
  emit();
}

export function setKotItemStatus(kotItemId: string, status: KotItemStatus) {
  const now = new Date().toISOString();
  let kotId = "";
  state.kotItems = state.kotItems.map((i) => {
    if (i.id !== kotItemId) return i;
    kotId = i.kotId;
    return {
      ...i,
      status,
      inPreparationAt: status === "in_preparation" ? now : i.inPreparationAt,
      readyAt: status === "ready" ? now : i.readyAt,
    };
  });
  if (kotId) {
    const lines = kotItemsByKot(kotId);
    const active = lines.filter((l) => l.status !== "voided");
    const allReady = active.length > 0 && active.every((l) => l.status === "ready");
    state.kots = state.kots.map((k) =>
      k.id === kotId
        ? {
            ...k,
            status: allReady ? "ready" : k.status === "voided" ? "voided" : "in_preparation",
            allReadyAt: allReady ? now : k.allReadyAt,
          }
        : k,
    );
  }
  emit();
}

export function markKotPrinted(kotId: string) {
  state.kots = state.kots.map((k) => (k.id === kotId ? { ...k, printCount: (k.printCount ?? 0) + 1, lastPrintedAt: new Date().toISOString() } : k));
  emit();
}

export function buildKotTicket(kotId: string) {
  const kot = state.kots.find((k) => k.id === kotId);
  if (!kot) return null;
  const tab = state.posTabs.find((t) => t.id === kot.posTabId);
  const outlet = state.posOutlets.find((o) => o.id === kot.posOutletId);
  const items = state.kotItems
    .filter((i) => i.kotId === kotId)
    .map((ki) => {
      const menu = state.menuItems.find((m) => m.id === ki.menuItemId);
      const modifiers = Object.entries(ki.modifierSelections ?? {}).map(([, opt]) => opt);
      return { ...ki, name: menu?.name ?? "Unknown item", modifiers, menuItemId: ki.menuItemId };
    });
  return { kot, tab, outlet, items };
}

export function sendKotForTabItems(posTabId: string, itemIds: string[]): Kot[] {
  const tab = state.posTabs.find((t) => t.id === posTabId);
  if (!tab) return [];
  const items = state.posTabItems.filter(
    (i) => i.posTabId === posTabId && itemIds.includes(i.id) && posTabItemNeedsKot(i),
  );
  if (items.length === 0) return [];

  const groups = new Map<KotStation, PosTabItem[]>();
  for (const item of items) {
    const station = stationForMenuItem(item.menuItemId);
    if (!groups.has(station)) groups.set(station, []);
    groups.get(station)!.push(item);
  }

  const createdKots: Kot[] = [];
  let kotSeq = state.kots.length + 1;
  for (const [station, stationItems] of groups) {
    const kotId = `KOT-${Date.now()}-${kotSeq++}`;
    const kot: Kot = {
      id: kotId,
      posTabId,
      posOutletId: tab.posOutletId,
      stationType: station,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    upsertKot(kot);
    createdKots.push(kot);

    for (const item of stationItems) {
      const kotItem: KotItem = {
        id: `KOTI-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kotId,
        posTabItemId: item.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        modifierSelections: item.modifierSelections,
        specialNotes: item.specialNotes,
        courseNumber: item.courseNumber,
        status: "pending",
      };
      upsertKotItem(kotItem);
    }

    state.posTabItems = state.posTabItems.map((i) =>
      i.posTabId === posTabId && itemIds.includes(i.id) ? { ...i, sentToKot: true } : i,
    );
  }
  emit();
  return createdKots;
}

/* ==================== POS Service Periods (55) ==================== */

export function upsertPosServicePeriod(input: PosServicePeriod) {
  const exists = state.posServicePeriods.some((p) => p.id === input.id);
  if (exists) {
    state.posServicePeriods = state.posServicePeriods.map((p) => (p.id === input.id ? input : p));
  } else {
    state.posServicePeriods = [{ ...input, createdAt: new Date().toISOString() }, ...state.posServicePeriods];
  }
  emit();
}

export function deletePosServicePeriod(id: string) {
  state.posServicePeriods = state.posServicePeriods.filter((p) => p.id !== id);
  emit();
}

export function posServicePeriodById(id: string | undefined | null) {
  return id ? state.posServicePeriods.find((p) => p.id === id) : undefined;
}

export function openPosServicePeriodByOutlet(posOutletId: string) {
  return state.posServicePeriods.find((p) => p.posOutletId === posOutletId && p.status === "open");
}

function computePeriodMetrics(periodId: string): PosServicePeriod {
  const period = state.posServicePeriods.find((p) => p.id === periodId);
  if (!period) throw new Error("Period not found");
  const start = period.openedAt;
  const end = period.closedAt;
  const settledTabs = state.posTabs.filter(
    (t) => t.settledAt && t.settledAt >= start && (!end || t.settledAt <= end),
  );
  const tabIds = new Set(settledTabs.map((t) => t.id));

  let foodRevenue = 0;
  let beverageRevenue = 0;
  for (const item of state.posTabItems) {
    if (!tabIds.has(item.posTabId) || item.isVoided || item.isComplimentary) continue;
    const station = stationForMenuItem(item.menuItemId);
    if (station === "bar") beverageRevenue += item.unitPrice * item.quantity;
    else foodRevenue += item.unitPrice * item.quantity;
  }

  const totalOrders = settledTabs.length;
  const totalCovers = settledTabs.reduce((s, t) => s + (t.coverCount || 0), 0);
  const totalVat = settledTabs.reduce((s, t) => s + (t.vatAmount || 0), 0);
  const totalServiceCharge = settledTabs.reduce((s, t) => s + (t.serviceChargeAmount || 0), 0);
  const totalDirectPayments = settledTabs
    .filter((t) => t.settlementMethod === "direct_payment")
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalRoomCharges = settledTabs
    .filter((t) => t.settlementMethod === "room_charge")
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalComps = state.posTabItems
    .filter((i) => tabIds.has(i.posTabId) && i.isComplimentary)
    .reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const totalUnrecovered = settledTabs
    .filter((t) => t.status === "unrecovered")
    .reduce((s, t) => s + t.totalAmount, 0);
  const cashSales = settledTabs
    .filter((t) => t.settlementMethod === "direct_payment" && t.paymentMethod === "cash")
    .reduce((s, t) => s + t.totalAmount, 0);
  const openingFloat = period.openingFloat ?? 0;
  const expectedCash = openingFloat + cashSales;
  const countedCash = period.countedCash;
  const cashVariance = countedCash !== undefined ? countedCash - expectedCash : 0;

  return {
    ...period,
    totalFoodRevenue: Math.round(foodRevenue),
    totalBeverageRevenue: Math.round(beverageRevenue),
    totalOrders,
    totalCovers,
    totalVat,
    totalServiceCharge,
    totalDirectPayments,
    totalRoomCharges,
    totalComps,
    totalUnrecovered,
    expectedCash,
    cashReconciledAmount: countedCash ?? cashVariance,
    cashVariance,
  };
}

export function openPosServiceShift(
  posOutletId: string,
  input: { openedBy: string; periodName?: string; openingFloat?: number },
) {
  const existing = openPosServicePeriodByOutlet(posOutletId);
  if (existing) return existing;

  const now = new Date();
  const periodName = input.periodName || `Shift ${now.getHours() < 12 ? "AM" : "PM"} ${now.toLocaleDateString("en-UG", { month: "short", day: "numeric" })}`;
  const period: PosServicePeriod = {
    id: `POSP-${Date.now()}`,
    posOutletId,
    periodName,
    periodDate: state.businessDate,
    openedAt: now.toISOString(),
    openedBy: input.openedBy,
    openingFloat: input.openingFloat ?? 0,
    status: "open",
    totalCovers: 0,
    totalOrders: 0,
    totalFoodRevenue: 0,
    totalBeverageRevenue: 0,
    totalVat: 0,
    totalServiceCharge: 0,
    totalDirectPayments: 0,
    totalRoomCharges: 0,
    totalComps: 0,
    totalUnrecovered: 0,
    cashReconciledAmount: 0,
    cashVariance: 0,
    createdAt: now.toISOString(),
  };
  upsertPosServicePeriod(period);
  logAudit({ module: "pos", action: "Shift opened", entity: `${periodName} float ${fmtUGX(input.openingFloat ?? 0)}`, severity: "info" });
  return period;
}

export function posServicePeriodMetrics(periodId: string): PosServicePeriod | undefined {
  if (!state.posServicePeriods.some((p) => p.id === periodId)) return undefined;
  return computePeriodMetrics(periodId);
}

export function reconcilePosServicePeriod(
  periodId: string,
  input: { countedCash: number; closedBy: string },
) {
  const metrics = computePeriodMetrics(periodId);
  const variance = input.countedCash - (metrics.expectedCash ?? 0);
  state.posServicePeriods = state.posServicePeriods.map((p) =>
    p.id === periodId
      ? {
          ...p,
          totalCovers: metrics.totalCovers,
          totalOrders: metrics.totalOrders,
          totalFoodRevenue: metrics.totalFoodRevenue,
          totalBeverageRevenue: metrics.totalBeverageRevenue,
          totalVat: metrics.totalVat,
          totalServiceCharge: metrics.totalServiceCharge,
          totalDirectPayments: metrics.totalDirectPayments,
          totalRoomCharges: metrics.totalRoomCharges,
          totalComps: metrics.totalComps,
          totalUnrecovered: metrics.totalUnrecovered,
          cashReconciledAmount: input.countedCash,
          cashVariance: variance,
          expectedCash: metrics.expectedCash,
          countedCash: input.countedCash,
          closedVariance: variance,
          status: "closed",
          closedAt: new Date().toISOString(),
          closedBy: input.closedBy,
        }
      : p,
  );
  logAudit({ module: "pos", action: "Shift closed & reconciled", entity: `${periodId} variance ${fmtUGX(variance)}`, severity: "info" });
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

/* ── Room charge helpers ──────────────────────────────────── */

export interface RoomChargeTarget {
  folio: Folio;
  guestName: string;
  guestProfileId?: string;
  roomNumber?: string;
  currentBalance: number;
  creditLimit?: number;
}

export function findRoomByNumber(roomNumber: string): Room | undefined {
  return state.rooms.find(
    (r) => r.roomNumber.toLowerCase() === roomNumber.trim().toLowerCase() && r.isActive,
  );
}

export function lookupRoomChargeTarget(query: string): RoomChargeTarget | undefined {
  const q = query.trim();
  if (!q) return undefined;

  /* 1) Try room number — must be occupied + checked-in reservation + open folio */
  const room = findRoomByNumber(q);
  if (room && room.status === "occupied") {
    const reservation = state.reservations.find(
      (r) => r.roomId === room.id && r.status === "checked_in",
    );
    if (reservation && reservation.folioId) {
      const folio = state.folios.find((f) => f.id === reservation.folioId && f.status === "open");
      if (folio) {
        const guest = reservation.guestProfileId
          ? state.guests.find((g) => g.id === reservation.guestProfileId)
          : undefined;
        return {
          folio,
          guestName: guest?.fullName ?? reservation.guestName,
          guestProfileId: guest?.id,
          roomNumber: room.roomNumber,
          currentBalance: folioBalance(folio.id),
          creditLimit: guest?.creditLimit,
        };
      }
    }
  }

  /* 2) Fallback — guest name / email / phone search */
  const folio = openFolioByGuestName(q);
  if (!folio) return undefined;

  let guestName = "Unknown";
  let creditLimit: number | undefined;
  let guestProfileId: string | undefined;

  if (folio.guestProfileId) {
    const guest = state.guests.find((g) => g.id === folio.guestProfileId);
    guestName = guest?.fullName ?? guestName;
    creditLimit = guest?.creditLimit;
    guestProfileId = guest?.id;
  } else if (folio.reservationId) {
    const res = state.reservations.find((r) => r.id === folio.reservationId);
    if (res) {
      guestName = res.guestName;
      if (res.guestProfileId) {
        const guest = state.guests.find((g) => g.id === res.guestProfileId);
        guestProfileId = guest?.id;
        creditLimit = guest?.creditLimit;
      }
    }
  }

  return { folio, guestName, guestProfileId, currentBalance: folioBalance(folio.id), creditLimit };
}

export function checkRoomChargeLimit(
  guestProfileId: string | undefined,
  proposedCharge: number,
): { allowed: boolean; availableCredit?: number; reason?: string } {
  if (!guestProfileId) return { allowed: true };
  const guest = state.guests.find((g) => g.id === guestProfileId);
  if (!guest?.creditLimit) return { allowed: true };

  const openFolios = state.folios.filter(
    (f) => f.guestProfileId === guest.id && f.status === "open",
  );
  const currentBalance = openFolios.reduce((sum, f) => sum + folioBalance(f.id), 0);
  const availableCredit = guest.creditLimit - currentBalance;

  if (proposedCharge > availableCredit) {
    return {
      allowed: false,
      availableCredit: Math.max(0, availableCredit),
      reason:
        `Guest credit limit UGX ${guest.creditLimit.toLocaleString()} exceeded. ` +
        `Current balance: UGX ${currentBalance.toLocaleString()}, ` +
        `available: UGX ${Math.max(0, availableCredit).toLocaleString()}, ` +
        `needed: UGX ${proposedCharge.toLocaleString()}.`,
    };
  }
  return { allowed: true, availableCredit: Math.max(0, availableCredit) };
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  mtn_momo: "MTN Mobile Money",
  airtel_money: "Airtel Money",
  bank_transfer: "Bank Transfer",
  charge_to_room: "Charge to Room",
};

export const CHARGE_TYPE_LABEL: Record<FolioChargeType, string> = {
  room: "Room",
  fnb: "Food & Beverage",
  tax: "Tax",
  misc: "Misc",
  discount: "Discount",
};

/* ==================== Inventory CRUD ==================== */ 

/* Stock Categories */
export function upsertStockCategory(input: StockCategory) {
  const exists = state.stockCategories.some((c) => c.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.stockCategories = state.stockCategories.map((c) => (c.id === input.id ? { ...c, ...input } : c));
  } else {
    state.stockCategories = [{ ...input, createdAt: now }, ...state.stockCategories];
  }
  emit();
}
export function deleteStockCategory(id: string) {
  state.stockCategories = state.stockCategories.filter((c) => c.id !== id);
  emit();
}
export function stockCategoryById(id: string | undefined | null) {
  return id ? state.stockCategories.find((c) => c.id === id) : undefined;
}

/* Storage Locations */
export function upsertStorageLocation(input: StorageLocation) {
  const exists = state.storageLocations.some((l) => l.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.storageLocations = state.storageLocations.map((l) => (l.id === input.id ? { ...l, ...input } : l));
  } else {
    state.storageLocations = [{ ...input, createdAt: now }, ...state.storageLocations];
  }
  emit();
}
export function deleteStorageLocation(id: string) {
  state.storageLocations = state.storageLocations.filter((l) => l.id !== id);
  state.stockItems = state.stockItems.map((i) => (i.storageLocationId === id ? { ...i, storageLocationId: undefined } : i));
  emit();
}
export function storageLocationById(id: string | undefined | null) {
  return id ? state.storageLocations.find((l) => l.id === id) : undefined;
}

/* Stock Items */
export function upsertStockItem(input: StockItem) {
  const exists = state.stockItems.some((i) => i.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.stockItems = state.stockItems.map((i) => {
      if (i.id !== input.id) return i;
      const lq = i.locationQuantities ? { ...i.locationQuantities } : undefined;
      if (lq && Object.keys(lq).length) {
        const currentSum = Object.values(lq).reduce((a, b) => a + (b ?? 0), 0);
        const delta = (input.currentQuantity ?? 0) - currentSum;
        if (delta !== 0) {
          const home = input.storageLocationId ?? i.storageLocationId ?? Object.keys(lq)[0];
          lq[home] = Math.max(0, (lq[home] ?? 0) + delta);
        }
      }
      return { ...i, ...input, locationQuantities: lq, updatedAt: now };
    });
  } else {
    state.stockItems = [{ ...input, locationQuantities: input.locationQuantities ?? (input.storageLocationId ? { [input.storageLocationId]: input.currentQuantity } : undefined), createdAt: now, updatedAt: now }, ...state.stockItems];
  }
  emit();
}
export function deleteStockItem(id: string) {
  state.stockItems = state.stockItems.filter((i) => i.id !== id);
  emit();
}
export function stockItemById(id: string | undefined | null) {
  return id ? state.stockItems.find((i) => i.id === id) : undefined;
}
export function stockItemsByCategory(categoryId: string) {
  return state.stockItems.filter((i) => i.stockCategoryId === categoryId);
}

/* Stock Movements */
export function addStockMovement(input: {
  stockItemId: string;
  type: StockMovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  posOutletId?: string;
  storageLocationId?: string;
  createdBy: string;
}) {
  const item = state.stockItems.find((i) => i.id === input.stockItemId);
  if (!item) return;
  const balanceBefore = item.currentQuantity;
  const balanceAfter = balanceBefore + input.quantity;
  const beforeLq = item.locationQuantities ? { ...item.locationQuantities } : undefined;
  state.stockItems = state.stockItems.map((i) => {
    if (i.id !== input.stockItemId) return i;
    const lq = i.locationQuantities ? { ...i.locationQuantities } : undefined;
    if (lq) {
      const target = input.storageLocationId ?? i.storageLocationId;
      if (input.quantity > 0) {
        const home = target ?? Object.keys(lq)[0];
        if (home) lq[home] = (lq[home] ?? 0) + input.quantity;
      } else {
        let remaining = -input.quantity;
        const order = target
          ? [target, ...Object.keys(lq).filter((k) => k !== target)]
          : i.storageLocationId
            ? [i.storageLocationId, ...Object.keys(lq).filter((k) => k !== i.storageLocationId)]
            : Object.keys(lq);
        for (const loc of order) {
          if (remaining <= 0) break;
          const cur = lq[loc] ?? 0;
          const take = Math.min(cur, remaining);
          lq[loc] = cur - take;
          remaining -= take;
        }
      }
    }
    return { ...i, currentQuantity: balanceAfter, locationQuantities: lq ?? i.locationQuantities, updatedAt: new Date().toISOString() };
  });
  if (input.quantity < 0 && beforeLq) {
    const afterLq = state.stockItems.find((x) => x.id === input.stockItemId)?.locationQuantities;
    if (afterLq) {
      for (const [loc, beforeQty] of Object.entries(beforeLq)) {
        const afterQty = afterLq[loc] ?? 0;
        const par = parLevelFor(input.stockItemId, loc);
        if (par.minLevel > 0 && beforeQty >= par.minLevel && afterQty < par.minLevel) {
          pushNotification({
            type: "low_stock",
            title: "Low stock alert",
            description: `${item.name} dropped to ${afterQty} at ${storageLocationById(loc)?.name ?? loc} — below min ${par.minLevel}`,
            link: "/inventory/par-levels",
            targetRoles: ["Inventory Manager", "Store Keeper"],
          });
        }
      }
    }
  }
  const movement: StockMovement = {
    id: nextStockMovementId(),
    propertyId: item.propertyId,
    stockItemId: input.stockItemId,
    type: input.type,
    quantity: input.quantity,
    balanceBefore,
    balanceAfter,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    notes: input.notes,
    posOutletId: input.posOutletId,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  state.stockMovements = [movement, ...state.stockMovements];
  logAudit({
    module: "inventory",
    action: "Stock movement",
    entity: `${item.name} ${input.quantity > 0 ? "+" : ""}${input.quantity} (${input.type})`,
    severity: "info",
  });
  emit();
}
export function stockMovementsByItem(stockItemId: string) {
  return state.stockMovements.filter((m) => m.stockItemId === stockItemId);
}
export function stockMovementsByRef(referenceType: string, referenceId: string) {
  return state.stockMovements.filter((m) => m.referenceType === referenceType && m.referenceId === referenceId);
}

export type DepartmentConsumption = {
  posOutletId: string;
  outletName: string;
  totalQuantity: number;
  totalValue: number;
  lastIssuedAt?: string;
  items: {
    stockItemId: string;
    name: string;
    unit: string;
    quantity: number;
    value: number;
  }[];
};

export function departmentConsumption() {
  const byOutlet = new Map<string, DepartmentConsumption>();
  for (const m of state.stockMovements) {
    if (m.type !== "internal_use" || m.quantity >= 0) continue;
    const posOutletId = m.posOutletId ?? "unassigned";
    const existing = byOutlet.get(posOutletId);
    const item = state.stockItems.find((i) => i.id === m.stockItemId);
    const qty = -m.quantity;
    const value = qty * (item?.unitCost ?? 0);
    const entry = existing?.items.find((x) => x.stockItemId === m.stockItemId);
    if (entry) {
      entry.quantity += qty;
      entry.value += value;
    } else {
      const created = existing ?? { posOutletId, outletName: "", totalQuantity: 0, totalValue: 0, lastIssuedAt: undefined, items: [] };
      created.items.push({ stockItemId: m.stockItemId, name: item?.name ?? m.stockItemId, unit: item?.unit ?? "", quantity: qty, value });
      byOutlet.set(posOutletId, created);
    }
    const outlet = byOutlet.get(posOutletId)!;
    outlet.totalQuantity += qty;
    outlet.totalValue += value;
    if (!outlet.lastIssuedAt || m.createdAt > outlet.lastIssuedAt) outlet.lastIssuedAt = m.createdAt;
  }
  return [...byOutlet.values()]
    .sort((a, b) => (b.lastIssuedAt ?? "").localeCompare(a.lastIssuedAt ?? ""))
    .map((o) => ({
      ...o,
      outletName:
        o.posOutletId === "unassigned"
          ? "Unassigned"
          : posOutletById(o.posOutletId)?.name ?? o.posOutletId,
      items: [...o.items].sort((a, b) => b.value - a.value),
    }));
}

/* Suppliers */
export function upsertSupplier(input: Supplier) {
  const exists = state.suppliers.some((s) => s.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.suppliers = state.suppliers.map((s) => (s.id === input.id ? { ...s, ...input, updatedAt: now } : s));
  } else {
    state.suppliers = [{ ...input, createdAt: now, updatedAt: now }, ...state.suppliers];
  }
  emit();
}
export function deleteSupplier(id: string) {
  state.suppliers = state.suppliers.filter((s) => s.id !== id);
  emit();
}
export function supplierById(id: string | undefined | null) {
  return id ? state.suppliers.find((s) => s.id === id) : undefined;
}

/* Purchase Orders */
export function upsertPurchaseOrder(input: PurchaseOrder) {
  const exists = state.purchaseOrders.some((po) => po.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.purchaseOrders = state.purchaseOrders.map((po) => (po.id === input.id ? { ...po, ...input, updatedAt: now } : po));
  } else {
    state.purchaseOrders = [{ ...input, createdAt: now, updatedAt: now }, ...state.purchaseOrders];
  }
  emit();
}
export function deletePurchaseOrder(id: string) {
  state.purchaseOrders = state.purchaseOrders.filter((po) => po.id !== id);
  emit();
}
export function purchaseOrderById(id: string | undefined | null) {
  return id ? state.purchaseOrders.find((po) => po.id === id) : undefined;
}
export function approvePurchaseOrder(id: string, approvedBy: string) {
  state.purchaseOrders = state.purchaseOrders.map((po) =>
    po.id === id ? { ...po, status: "approved" as PurchaseOrderStatus, approvedBy, approvedAt: new Date().toISOString() } : po,
  );
  logAudit({ module: "inventory", action: "Purchase order approved", entity: id, severity: "info" });
  emit();
}
export function sendPurchaseOrder(id: string, via: "whatsapp" | "email" | "print") {
  state.purchaseOrders = state.purchaseOrders.map((po) =>
    po.id === id
      ? { ...po, status: "sent" as PurchaseOrderStatus, sentAt: new Date().toISOString(), sentVia: via }
      : po,
  );
  logAudit({ module: "inventory", action: `Purchase order sent to supplier via ${via}`, entity: id, severity: "info" });
  emit();
}
export function receivePurchaseOrder(id: string) {
  const po = state.purchaseOrders.find((p) => p.id === id);
  if (!po || (po.status !== "approved" && po.status !== "sent" && po.status !== "partially_received")) return;
  const items = state.purchaseOrderItems.filter((i) => i.purchaseOrderId === id);
  for (const item of items) {
    const qtyToReceive = item.quantityOrdered - item.quantityReceived;
    if (qtyToReceive > 0) {
      addStockMovement({
        stockItemId: item.stockItemId,
        type: "purchase_receipt",
        quantity: qtyToReceive,
        referenceType: "purchase_order",
        referenceId: id,
        createdBy: po.createdBy,
      });
    }
  }
  state.purchaseOrderItems = state.purchaseOrderItems.map((i) =>
    i.purchaseOrderId === id ? { ...i, quantityReceived: i.quantityOrdered } : i,
  );
  state.purchaseOrders = state.purchaseOrders.map((p) =>
    p.id === id ? { ...p, status: "received" as PurchaseOrderStatus, receivedAt: new Date().toISOString() } : p,
  );
  logAudit({ module: "inventory", action: "Purchase order received", entity: id, severity: "info" });
  emit();
}

/* Goods Receipts (GRN) */
export function createGoodsReceipt(input: {
  poId: string;
  receivedBy: string;
  notes?: string;
  lines: { stockItemId: string; quantity: number; unitCost: number }[];
}): { ok: boolean; error?: string; grn?: GoodsReceipt } {
  const po = state.purchaseOrders.find((p) => p.id === input.poId);
  if (!po) return { ok: false, error: "Purchase order not found." };
  if (po.status !== "approved" && po.status !== "sent" && po.status !== "partially_received") {
    return { ok: false, error: `Cannot receive goods — PO is ${po.status}.` };
  }
  const poItems = state.purchaseOrderItems.filter((i) => i.purchaseOrderId === input.poId);
  const nonZero = input.lines.filter((l) => l.quantity > 0);
  if (nonZero.length === 0) return { ok: false, error: "Enter a quantity for at least one line." };
  for (const line of nonZero) {
    const item = poItems.find((i) => i.stockItemId === line.stockItemId);
    if (!item) return { ok: false, error: `Unknown line for ${line.stockItemId}.` };
    const outstanding = item.quantityOrdered - item.quantityReceived;
    if (line.quantity > outstanding) {
      return { ok: false, error: `${line.stockItemId}: receiving ${line.quantity}, only ${outstanding} outstanding.` };
    }
  }
  const now = new Date().toISOString();
  const grnId = nextGoodsReceiptId();
  const grn: GoodsReceipt = {
    id: grnId,
    propertyId: po.propertyId ?? "T001",
    poId: input.poId,
    receivedBy: input.receivedBy,
    receivedAt: now,
    notes: input.notes,
    createdAt: now,
  };
  state.goodsReceipts = [grn, ...state.goodsReceipts];
  for (const line of nonZero) {
    const item = poItems.find((i) => i.stockItemId === line.stockItemId);
    if (!item) continue;
    state.goodsReceiptItems = [
      ...state.goodsReceiptItems,
      {
        id: nextGoodsReceiptItemId(),
        goodsReceiptId: grnId,
        stockItemId: line.stockItemId,
        quantityReceived: line.quantity,
        unitCost: line.unitCost,
        lineTotal: line.quantity * line.unitCost,
      },
    ];
    addStockMovement({
      stockItemId: line.stockItemId,
      type: "purchase_receipt",
      quantity: line.quantity,
      referenceType: "goods_receipt",
      referenceId: grnId,
      notes: po.orderNumber,
      createdBy: input.receivedBy,
    });
    state.purchaseOrderItems = state.purchaseOrderItems.map((i) =>
      i.purchaseOrderId === input.poId && i.stockItemId === line.stockItemId
        ? { ...i, quantityReceived: i.quantityReceived + line.quantity }
        : i,
    );
  }
  const allDone = state.purchaseOrderItems
    .filter((i) => i.purchaseOrderId === input.poId)
    .every((i) => i.quantityReceived >= i.quantityOrdered);
  state.purchaseOrders = state.purchaseOrders.map((p) =>
    p.id === input.poId
      ? allDone
        ? { ...p, status: "received" as PurchaseOrderStatus, receivedAt: now }
        : { ...p, status: "partially_received" as PurchaseOrderStatus }
      : p,
  );
  logAudit({
    module: "inventory",
    action: "Goods receipt created",
    entity: `${grnId} for ${po.orderNumber}${allDone ? " (fully received)" : ""}`,
    severity: "info",
  });
  emit();
  return { ok: true, grn };
}
export function goodsReceiptsForPo(poId: string | undefined | null) {
  return poId ? state.goodsReceipts.filter((g) => g.poId === poId) : [];
}
export function goodsReceiptItemsFor(grnId: string) {
  return state.goodsReceiptItems.filter((i) => i.goodsReceiptId === grnId);
}

/* Purchase Order Items */
export function upsertPurchaseOrderItem(input: PurchaseOrderItem) {
  const exists = state.purchaseOrderItems.some((i) => i.id === input.id);
  if (exists) {
    state.purchaseOrderItems = state.purchaseOrderItems.map((i) => (i.id === input.id ? input : i));
  } else {
    state.purchaseOrderItems = [...state.purchaseOrderItems, input];
  }
  emit();
}
export function deletePurchaseOrderItem(id: string) {
  state.purchaseOrderItems = state.purchaseOrderItems.filter((i) => i.id !== id);
  emit();
}
export function purchaseOrderItemsByPo(purchaseOrderId: string) {
  return state.purchaseOrderItems.filter((i) => i.purchaseOrderId === purchaseOrderId);
}

/* Requisitions */
export function upsertRequisition(input: Requisition) {
  const exists = state.requisitions.some((r) => r.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.requisitions = state.requisitions.map((r) => (r.id === input.id ? { ...r, ...input, updatedAt: now } : r));
  } else {
    state.requisitions = [{ ...input, createdAt: now, updatedAt: now }, ...state.requisitions];
  }
  emit();
}
export function deleteRequisition(id: string) {
  state.requisitions = state.requisitions.filter((r) => r.id !== id);
  emit();
}
export function requisitionById(id: string | undefined | null) {
  return id ? state.requisitions.find((r) => r.id === id) : undefined;
}
export function approveRequisition(id: string, approvedBy: string) {
  state.requisitions = state.requisitions.map((r) =>
    r.id === id ? { ...r, status: "approved" as RequisitionStatus, approvedBy, approvedAt: new Date().toISOString() } : r,
  );
  logAudit({ module: "inventory", action: "Requisition approved", entity: id, severity: "info" });
  emit();
}
export function fulfillRequisition(id: string) {
  const req = state.requisitions.find((r) => r.id === id);
  if (!req || req.status !== "approved") return;
  const items = state.requisitionItems.filter((i) => i.requisitionId === id);
  for (const item of items) {
    const qty = item.quantityIssued ?? item.quantityApproved ?? item.quantityRequested;
    if (qty > 0) {
      addStockMovement({
        stockItemId: item.stockItemId,
        type: "internal_use",
        quantity: -qty,
        referenceType: "requisition",
        referenceId: id,
        posOutletId: req.posOutletId,
        createdBy: req.requestedBy,
      });
    }
  }
  state.requisitions = state.requisitions.map((r) =>
    r.id === id ? { ...r, status: "fulfilled" as RequisitionStatus, fulfilledAt: new Date().toISOString() } : r,
  );
  logAudit({ module: "inventory", action: "Requisition fulfilled", entity: id, severity: "info" });
  emit();
}
export function issueRequisition(
  id: string,
  issued: { stockItemId: string; quantity: number }[],
  issuedBy: string,
): { ok: boolean; errors?: string[] } {
  const req = state.requisitions.find((r) => r.id === id);
  if (!req || req.status !== "approved") return { ok: false, errors: ["Requisition is not approved"] };
  const errors: string[] = [];
  for (const line of issued) {
    if (line.quantity <= 0) continue;
    const item = state.stockItems.find((i) => i.id === line.stockItemId);
    if (!item) continue;
    if (line.quantity > item.currentQuantity) {
      errors.push(`${item.name}: requested ${line.quantity}, only ${item.currentQuantity} available`);
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  const issuedMap = new Map(issued.map((l) => [l.stockItemId, l.quantity]));
  for (const [stockItemId, qty] of issuedMap) {
    if (qty <= 0) continue;
    addStockMovement({
      stockItemId,
      type: "internal_use",
      quantity: -qty,
      referenceType: "requisition",
      referenceId: id,
      posOutletId: req.posOutletId,
      createdBy: issuedBy,
    });
  }
  state.requisitionItems = state.requisitionItems.map((i) =>
    i.requisitionId === id ? { ...i, quantityIssued: issuedMap.get(i.stockItemId) ?? 0 } : i,
  );
  state.requisitions = state.requisitions.map((r) =>
    r.id === id
      ? { ...r, status: "fulfilled" as RequisitionStatus, issuedBy, fulfilledAt: new Date().toISOString() }
      : r,
  );
  logAudit({ module: "inventory", action: "Requisition issued from store", entity: id, severity: "info" });
  emit();
  return { ok: true };
}

/* Requisition Items */
export function upsertRequisitionItem(input: RequisitionItem) {
  const exists = state.requisitionItems.some((i) => i.id === input.id);
  if (exists) {
    state.requisitionItems = state.requisitionItems.map((i) => (i.id === input.id ? input : i));
  } else {
    state.requisitionItems = [...state.requisitionItems, input];
  }
  emit();
}
export function deleteRequisitionItem(id: string) {
  state.requisitionItems = state.requisitionItems.filter((i) => i.id !== id);
  emit();
}
export function requisitionItemsByReq(requisitionId: string) {
  return state.requisitionItems.filter((i) => i.requisitionId === requisitionId);
}

/* Supplier Invoices & 3-way match (PO / GRN / Invoice) */
export function supplierInvoiceLinesFor(invoiceId: string) {
  return state.supplierInvoiceLines.filter((l) => l.supplierInvoiceId === invoiceId);
}
export function supplierInvoiceMatchStatus(invoiceId: string): {
  status: "matched" | "unmatched";
  lines: {
    stockItemId: string;
    ordered: number;
    received: number;
    invoiced: number;
    poUnitCost: number;
    invoicedUnitCost: number;
    priceTolerance: number;
    ok: boolean;
    issues: string[];
  }[];
  mismatches: string[];
} {
  const inv = state.supplierInvoices.find((i) => i.id === invoiceId);
  if (!inv) return { status: "unmatched", lines: [], mismatches: ["Invoice not found."] };
  const poItems = state.purchaseOrderItems.filter((i) => i.purchaseOrderId === inv.poId);
  const grnItems = state.goodsReceiptItems.filter((g) =>
    goodsReceiptsForPo(inv.poId).some((r) => r.id === g.goodsReceiptId),
  );
  const lines = supplierInvoiceLinesFor(invoiceId).map((line) => {
    const poItem = poItems.find((p) => p.stockItemId === line.stockItemId);
    const received = grnItems
      .filter((g) => g.stockItemId === line.stockItemId)
      .reduce((s, g) => s + g.quantityReceived, 0);
    const poUnitCost = poItem?.unitCost ?? line.unitCost;
    const priceTolerance = Math.max(1, poUnitCost * 0.01);
    const issues: string[] = [];
    if (line.quantity > received) issues.push(`Invoiced ${line.quantity} but only ${received} received`);
    if (Math.abs(line.unitCost - poUnitCost) > priceTolerance) {
      issues.push(`Price ${line.unitCost.toLocaleString()} vs PO ${poUnitCost.toLocaleString()}`);
    }
    return {
      stockItemId: line.stockItemId,
      ordered: poItem?.quantityOrdered ?? 0,
      received,
      invoiced: line.quantity,
      poUnitCost,
      invoicedUnitCost: line.unitCost,
      priceTolerance,
      ok: issues.length === 0,
      issues,
    };
  });
  const mismatches = lines.filter((l) => !l.ok).flatMap((l) => l.issues);
  return { status: mismatches.length === 0 ? "matched" : "unmatched", lines, mismatches };
}
export function upsertSupplierInvoice(input: {
  id?: string;
  supplierId: string;
  poId: string;
  invoiceNo: string;
  invoiceDate: string;
  taxAmount?: number;
  notes?: string;
  createdBy: string;
  lines: { stockItemId: string; quantity: number; unitCost: number }[];
}): { ok: boolean; error?: string; invoice?: SupplierInvoice } {
  const po = state.purchaseOrders.find((p) => p.id === input.poId);
  if (!po) return { ok: false, error: "Purchase order not found." };
  if (input.lines.length === 0) return { ok: false, error: "Add at least one invoice line." };
  const amount = input.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0) + (input.taxAmount ?? 0);
  const now = new Date().toISOString();
  const invId = input.id ?? nextSupplierInvoiceId();
  if (input.id) {
    state.supplierInvoices = state.supplierInvoices.map((i) =>
      i.id === invId
        ? { ...i, supplierId: input.supplierId, poId: input.poId, invoiceNo: input.invoiceNo, invoiceDate: input.invoiceDate, taxAmount: input.taxAmount, notes: input.notes, amount, status: "unmatched" as SupplierInvoiceStatus, updatedAt: now }
        : i,
    );
    state.supplierInvoiceLines = state.supplierInvoiceLines.filter((l) => l.supplierInvoiceId !== invId);
  } else {
    const inv: SupplierInvoice = {
      id: invId,
      propertyId: po.propertyId ?? "T001",
      supplierId: input.supplierId,
      poId: input.poId,
      invoiceNo: input.invoiceNo,
      invoiceDate: input.invoiceDate,
      taxAmount: input.taxAmount,
      amount,
      status: "unmatched",
      notes: input.notes,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    state.supplierInvoices = [inv, ...state.supplierInvoices];
  }
  for (const line of input.lines) {
    state.supplierInvoiceLines = [
      ...state.supplierInvoiceLines,
      {
        id: nextSupplierInvoiceLineId(),
        supplierInvoiceId: invId,
        stockItemId: line.stockItemId,
        quantity: line.quantity,
        unitCost: line.unitCost,
        lineTotal: line.quantity * line.unitCost,
      },
    ];
  }
  logAudit({ module: "inventory", action: "Supplier invoice registered", entity: `${invId} — ${input.invoiceNo}`, severity: "info" });
  emit();
  return { ok: true, invoice: state.supplierInvoices.find((i) => i.id === invId) };
}
export function cancelSupplierInvoice(id: string) {
  state.supplierInvoices = state.supplierInvoices.map((i) =>
    i.id === id ? { ...i, status: "cancelled" as SupplierInvoiceStatus, updatedAt: new Date().toISOString() } : i,
  );
  logAudit({ module: "inventory", action: "Supplier invoice cancelled", entity: id, severity: "warn" });
  emit();
}
export function deleteSupplierInvoice(id: string) {
  const inv = state.supplierInvoices.find((i) => i.id === id);
  if (inv && inv.status === "unmatched") {
    state.supplierInvoices = state.supplierInvoices.filter((i) => i.id !== id);
    state.supplierInvoiceLines = state.supplierInvoiceLines.filter((l) => l.supplierInvoiceId !== id);
  }
  emit();
}
export function supplierPaymentsForInvoice(invoiceId: string) {
  return state.supplierPayments.filter((p) => p.supplierInvoiceId === invoiceId);
}
export function recordSupplierPayment(input: {
  supplierInvoiceId: string;
  amount: number;
  method: SupplierPaymentMethod;
  reference?: string;
  paidBy: string;
}): { ok: boolean; error?: string } {
  const inv = state.supplierInvoices.find((i) => i.id === input.supplierInvoiceId);
  if (!inv) return { ok: false, error: "Invoice not found." };
  if (inv.status === "cancelled") return { ok: false, error: "Cannot pay a cancelled invoice." };
  if (input.amount <= 0) return { ok: false, error: "Enter a payment amount." };
  const match = supplierInvoiceMatchStatus(input.supplierInvoiceId);
  if (match.status !== "matched") {
    return {
      ok: false,
      error: `3-way match required — resolve PO/GRN/Invoice mismatches first: ${match.mismatches.join("; ")}`,
    };
  }
  const paidSoFar = inv.paidAmount ?? 0;
  const outstanding = inv.amount - paidSoFar;
  if (input.amount > outstanding) {
    return { ok: false, error: `Payment exceeds outstanding balance of ${outstanding.toLocaleString()}.` };
  }
  const now = new Date().toISOString();
  state.supplierPayments = [
    ...state.supplierPayments,
    {
      id: nextSupplierPaymentId(),
      propertyId: inv.propertyId ?? "T001",
      supplierInvoiceId: input.supplierInvoiceId,
      supplierId: inv.supplierId,
      amount: input.amount,
      method: input.method,
      reference: input.reference,
      paidBy: input.paidBy,
      paidAt: now,
      createdAt: now,
    },
  ];
  const newPaid = paidSoFar + input.amount;
  state.supplierInvoices = state.supplierInvoices.map((i) =>
    i.id === input.supplierInvoiceId
      ? {
          ...i,
          paidAmount: newPaid,
          status: newPaid >= i.amount ? ("paid" as SupplierInvoiceStatus) : i.status,
          updatedAt: now,
        }
      : i,
  );
  logAudit({
    module: "inventory",
    action: "Supplier payment recorded",
    entity: `${input.supplierInvoiceId} — ${input.amount.toLocaleString()} ${input.method}`,
    severity: "info",
  });
  emit();
  return { ok: true };
}

/* Stock Transfers */
export function quantityAtLocation(stockItemId: string, locationId: string | undefined | null): number {
  if (!locationId) return 0;
  const item = state.stockItems.find((i) => i.id === stockItemId);
  if (!item?.locationQuantities) return 0;
  return item.locationQuantities[locationId] ?? 0;
}
export function stockItemsAtLocation(locationId: string): StockItem[] {
  return state.stockItems.filter((i) => i.isActive && quantityAtLocation(i.id, locationId) > 0);
}
export function upsertStockTransfer(input: StockTransfer) {
  const exists = state.stockTransfers.some((t) => t.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.stockTransfers = state.stockTransfers.map((t) => (t.id === input.id ? { ...t, ...input, updatedAt: now } : t));
  } else {
    state.stockTransfers = [{ ...input, createdAt: now, updatedAt: now }, ...state.stockTransfers];
  }
  emit();
}
export function deleteStockTransfer(id: string) {
  const t = state.stockTransfers.find((x) => x.id === id);
  if (!t || t.status !== "pending") return;
  state.stockTransfers = state.stockTransfers.filter((x) => x.id !== id);
  state.stockTransferItems = state.stockTransferItems.filter((i) => i.transferId !== id);
  emit();
}
export function stockTransferById(id: string | undefined | null) {
  return id ? state.stockTransfers.find((t) => t.id === id) : undefined;
}
export function stockTransferItemsByTransfer(transferId: string) {
  return state.stockTransferItems.filter((i) => i.transferId === transferId);
}
export function upsertStockTransferItem(input: StockTransferItem) {
  const exists = state.stockTransferItems.some((i) => i.id === input.id);
  if (exists) {
    state.stockTransferItems = state.stockTransferItems.map((i) => (i.id === input.id ? input : i));
  } else {
    state.stockTransferItems = [...state.stockTransferItems, input];
  }
  emit();
}
export function cancelStockTransfer(id: string) {
  state.stockTransfers = state.stockTransfers.map((t) =>
    t.id === id && t.status === "pending" ? { ...t, status: "cancelled" as StockTransferStatus } : t,
  );
  logAudit({ module: "inventory", action: "Stock transfer cancelled", entity: id, severity: "info" });
  emit();
}
export function completeStockTransfer(id: string, completedBy: string): { ok: boolean; errors?: string[] } {
  const t = state.stockTransfers.find((x) => x.id === id);
  if (!t || t.status !== "pending") return { ok: false, errors: ["Transfer is not pending"] };
  const items = state.stockTransferItems.filter((i) => i.transferId === id);
  return receiveStockTransfer(
    id,
    items.map((i) => ({ stockItemId: i.stockItemId, quantity: i.quantity })),
    completedBy,
  );
}
export function receiveStockTransfer(
  id: string,
  received: { stockItemId: string; quantity: number }[],
  receivedBy: string,
): { ok: boolean; errors?: string[] } {
  const t = state.stockTransfers.find((x) => x.id === id);
  if (!t || t.status !== "pending") return { ok: false, errors: ["Transfer is not pending"] };
  if (t.fromStorageLocationId === t.toStorageLocationId) {
    return { ok: false, errors: ["Source and destination stores must differ"] };
  }
  const items = state.stockTransferItems.filter((i) => i.transferId === id);
  if (items.length === 0) return { ok: false, errors: ["Transfer has no line items"] };
  const receivedMap = new Map(received.map((r) => [r.stockItemId, r.quantity]));
  const errors: string[] = [];
  for (const line of items) {
    const item = state.stockItems.find((i) => i.id === line.stockItemId);
    if (!item) continue;
    const qty = receivedMap.get(line.stockItemId) ?? 0;
    if (qty < 0) { errors.push(`${item.name}: quantity cannot be negative`); continue; }
    if (qty > line.quantity) { errors.push(`${item.name}: cannot receive ${qty}, only ${line.quantity} requested`); continue; }
    const available = quantityAtLocation(line.stockItemId, t.fromStorageLocationId);
    if (qty > available) { errors.push(`${item.name}: only ${available} available at source, cannot receive ${qty}`); }
  }
  if (errors.length > 0) return { ok: false, errors };
  for (const line of items) {
    const qty = receivedMap.get(line.stockItemId) ?? 0;
    if (qty <= 0) continue;
    const fromName = storageLocationById(t.fromStorageLocationId)?.name ?? t.fromStorageLocationId;
    const toName = storageLocationById(t.toStorageLocationId)?.name ?? t.toStorageLocationId;
    addStockMovement({
      stockItemId: line.stockItemId,
      type: "transfer",
      quantity: -qty,
      referenceType: "stock_transfer",
      referenceId: id,
      notes: `${fromName} → ${toName}`,
      storageLocationId: t.fromStorageLocationId,
      createdBy: receivedBy,
    });
    addStockMovement({
      stockItemId: line.stockItemId,
      type: "transfer",
      quantity: qty,
      referenceType: "stock_transfer",
      referenceId: id,
      notes: `${fromName} → ${toName}`,
      storageLocationId: t.toStorageLocationId,
      createdBy: receivedBy,
    });
  }
  state.stockTransferItems = state.stockTransferItems.map((i) =>
    i.transferId === id ? { ...i, quantityReceived: receivedMap.get(i.stockItemId) ?? 0 } : i,
  );
  state.stockTransfers = state.stockTransfers.map((x) =>
    x.id === id
      ? { ...x, status: "completed" as StockTransferStatus, completedBy: receivedBy, completedAt: new Date().toISOString() }
      : x,
  );
  logAudit({ module: "inventory", action: "Stock transfer received", entity: id, severity: "info" });
  emit();
  return { ok: true };
}

/* Stock Adjustments / Write-offs */
export function upsertStockAdjustment(input: StockAdjustment) {
  const exists = state.stockAdjustments.some((a) => a.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.stockAdjustments = state.stockAdjustments.map((a) => (a.id === input.id ? { ...a, ...input, updatedAt: now } : a));
  } else {
    state.stockAdjustments = [{ ...input, createdAt: now, updatedAt: now }, ...state.stockAdjustments];
  }
  emit();
}
export function upsertStockAdjustmentItem(input: StockAdjustmentItem) {
  const exists = state.stockAdjustmentItems.some((i) => i.id === input.id);
  if (exists) {
    state.stockAdjustmentItems = state.stockAdjustmentItems.map((i) => (i.id === input.id ? input : i));
  } else {
    state.stockAdjustmentItems = [...state.stockAdjustmentItems, input];
  }
  emit();
}
export function deleteStockAdjustmentItem(id: string) {
  state.stockAdjustmentItems = state.stockAdjustmentItems.filter((i) => i.id !== id);
  emit();
}
export function deleteStockAdjustment(id: string) {
  const a = state.stockAdjustments.find((x) => x.id === id);
  if (!a || a.status !== "pending") return;
  state.stockAdjustments = state.stockAdjustments.filter((x) => x.id !== id);
  state.stockAdjustmentItems = state.stockAdjustmentItems.filter((i) => i.adjustmentId !== id);
  emit();
}
export function stockAdjustmentById(id: string | undefined | null) {
  return id ? state.stockAdjustments.find((a) => a.id === id) : undefined;
}
export function stockAdjustmentItemsByAdjustment(adjustmentId: string) {
  return state.stockAdjustmentItems.filter((i) => i.adjustmentId === adjustmentId);
}
export function approveStockAdjustment(
  id: string,
  approvedBy: string,
  approvedByRole: string,
): { ok: boolean; errors?: string[] } {
  const a = state.stockAdjustments.find((x) => x.id === id);
  if (!a || a.status !== "pending") return { ok: false, errors: ["Adjustment is not pending"] };
  const items = state.stockAdjustmentItems.filter((i) => i.adjustmentId === id);
  if (items.length === 0) return { ok: false, errors: ["Adjustment has no line items"] };
  const errors: string[] = [];
  for (const line of items) {
    if (line.quantity <= 0) continue;
    const item = state.stockItems.find((i) => i.id === line.stockItemId);
    if (!item) continue;
    const available = quantityAtLocation(line.stockItemId, a.storageLocationId);
    if (line.quantity > available) {
      errors.push(`${item.name}: write off ${line.quantity}, only ${available} available at store`);
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  for (const line of items) {
    if (line.quantity <= 0) continue;
    const movementType: StockMovementType = a.type;
    const reason = a.reasonCode ? `${a.reasonCode}${a.notes ? ` — ${a.notes}` : ""}` : a.notes;
    addStockMovement({
      stockItemId: line.stockItemId,
      type: movementType,
      quantity: -line.quantity,
      referenceType: "stock_adjustment",
      referenceId: id,
      notes: `${a.type}${reason ? `: ${reason}` : ""}${a.storageLocationId ? ` @ ${storageLocationById(a.storageLocationId)?.name ?? a.storageLocationId}` : ""}`,
      storageLocationId: a.storageLocationId,
      createdBy: approvedBy,
    });
  }
  state.stockAdjustments = state.stockAdjustments.map((x) =>
    x.id === id
      ? {
          ...x,
          status: "approved" as StockAdjustmentStatus,
          approvedBy,
          approvedByRole,
          approvedAt: new Date().toISOString(),
        }
      : x,
  );
  logAudit({ module: "inventory", action: "Stock adjustment approved", entity: id, severity: "info" });
  pushNotification({
    type: "approval_update",
    title: "Adjustment approved",
    description: `${approvedBy} approved your ${a.type} write-off ${id}`,
    link: "/inventory/adjustments",
    targetRoles: ["Store Keeper", "Inventory Manager"],
  });
  emit();
  return { ok: true };
}
export function rejectStockAdjustment(id: string, approvedBy: string, reason: string) {
  state.stockAdjustments = state.stockAdjustments.map((a) =>
    a.id === id && a.status === "pending"
      ? { ...a, status: "rejected" as StockAdjustmentStatus, approvedBy, rejectionReason: reason, approvedAt: new Date().toISOString() }
      : a,
  );
  logAudit({ module: "inventory", action: "Stock adjustment rejected", entity: id, severity: "info" });
  pushNotification({
    type: "approval_update",
    title: "Adjustment rejected",
    description: `${approvedBy} rejected ${id}: ${reason}`,
    link: "/inventory/adjustments",
    targetRoles: ["Store Keeper", "Inventory Manager"],
  });
  emit();
}

/* Stocktaking */
export function stocktakeById(id: string | undefined | null) {
  return id ? state.stocktakes.find((t) => t.id === id) : undefined;
}

export function stocktakeItemsByStocktake(stocktakeId: string) {
  return state.stocktakeItems.filter((i) => i.stocktakeId === stocktakeId);
}

export function createStocktake(input: {
  name: string;
  storageLocationId: string;
  plannedDate?: string;
  notes?: string;
  createdBy: string;
  createdByRole?: string;
}) {
  const id = nextStocktakeId();
  const now = new Date().toISOString();
  const items: StocktakeItem[] = state.stockItems
    .filter((i) => i.isActive && quantityAtLocation(i.id, input.storageLocationId) > 0)
    .map((i) => ({
      id: nextStocktakeItemId(),
      stocktakeId: id,
      stockItemId: i.id,
      systemQuantity: quantityAtLocation(i.id, input.storageLocationId),
      unitCost: i.unitCost,
    }));
  state.stocktakes = [
    {
      id,
      propertyId: state.tenant.id,
      name: input.name,
      storageLocationId: input.storageLocationId,
      plannedDate: input.plannedDate,
      notes: input.notes,
      status: "draft",
      createdBy: input.createdBy,
      createdByRole: input.createdByRole,
      createdAt: now,
      updatedAt: now,
    },
    ...state.stocktakes,
  ];
  state.stocktakeItems = [...state.stocktakeItems, ...items];
  logAudit({ module: "inventory", action: "Stocktake created", entity: id, severity: "info" });
  emit();
  return id;
}

export function updateStocktakeItem(stocktakeId: string, stockItemId: string, physicalQuantity: number) {
  const qty = Math.max(0, Math.floor(physicalQuantity));
  const line = state.stocktakeItems.find((i) => i.stocktakeId === stocktakeId && i.stockItemId === stockItemId);
  if (!line) return;
  const variance = qty - line.systemQuantity;
  state.stocktakeItems = state.stocktakeItems.map((i) =>
    i.id === line.id ? { ...i, physicalQuantity: qty, variance, valueVariance: variance * (i.unitCost ?? 0) } : i,
  );
  emit();
}

export function finalizeStocktake(id: string, finalizedBy: string) {
  const t = state.stocktakes.find((x) => x.id === id);
  if (!t || t.status !== "draft") return { ok: false, errors: ["Stocktake is not in draft state"] };
  state.stocktakeItems = state.stocktakeItems.map((i) => {
    if (i.stocktakeId !== id) return i;
    const physical = i.physicalQuantity ?? 0;
    const variance = physical - i.systemQuantity;
    return { ...i, physicalQuantity: physical, variance, valueVariance: variance * (i.unitCost ?? 0) };
  });
  state.stocktakes = state.stocktakes.map((x) =>
    x.id === id
      ? { ...x, status: "finalized" as StocktakeStatus, finalizedBy, finalizedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      : x,
  );
  logAudit({ module: "inventory", action: "Stocktake finalized", entity: id, severity: "info" });
  emit();
  return { ok: true };
}

export function reconcileStocktake(id: string, reconciledBy: string) {
  const t = state.stocktakes.find((x) => x.id === id);
  if (!t || t.status !== "finalized") return { ok: false, errors: ["Stocktake must be finalized before reconciling"] };
  const lines = state.stocktakeItems.filter((i) => i.stocktakeId === id);
  if (lines.length === 0) return { ok: false, errors: ["Stocktake has no items to reconcile"] };
  for (const line of lines) {
    const variance = (line.physicalQuantity ?? 0) - line.systemQuantity;
    if (variance === 0) continue;
    addStockMovement({
      stockItemId: line.stockItemId,
      type: "adjustment",
      quantity: variance,
      referenceType: "stocktake",
      referenceId: id,
      notes: `Stocktaking variance: counted ${line.physicalQuantity}, system ${line.systemQuantity} @ ${storageLocationById(t.storageLocationId)?.name ?? t.storageLocationId}`,
      storageLocationId: t.storageLocationId,
      createdBy: reconciledBy,
    });
  }
  state.stocktakes = state.stocktakes.map((x) =>
    x.id === id
      ? { ...x, status: "reconciled" as StocktakeStatus, reconciledBy, reconciledAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      : x,
  );
  logAudit({ module: "inventory", action: "Stocktake reconciled", entity: id, severity: "info" });
  emit();
  return { ok: true };
}

export function cancelStocktake(id: string) {
  const t = state.stocktakes.find((x) => x.id === id);
  if (!t || t.status === "reconciled") return { ok: false, errors: ["Reconciled stocktakes cannot be cancelled"] };
  state.stocktakes = state.stocktakes.map((x) =>
    x.id === id
      ? { ...x, status: "cancelled" as StocktakeStatus, cancelledAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      : x,
  );
  logAudit({ module: "inventory", action: "Stocktake cancelled", entity: id, severity: "info" });
  emit();
  return { ok: true };
}

export function deleteStocktake(id: string) {
  const t = state.stocktakes.find((x) => x.id === id);
  if (!t || t.status !== "draft") return { ok: false, errors: ["Only draft stocktakes can be deleted"] };
  state.stocktakes = state.stocktakes.filter((x) => x.id !== id);
  state.stocktakeItems = state.stocktakeItems.filter((i) => i.stocktakeId !== id);
  logAudit({ module: "inventory", action: "Stocktake deleted", entity: id, severity: "info" });
  emit();
  return { ok: true };
}

export function stocktakeVarianceSummary(id: string) {
  const lines = state.stocktakeItems.filter((i) => i.stocktakeId === id);
  let shortageValue = 0;
  let surplusValue = 0;
  let varianceCount = 0;
  for (const line of lines) {
    const variance = (line.physicalQuantity ?? 0) - line.systemQuantity;
    if (variance === 0) continue;
    varianceCount += 1;
    if (variance < 0) shortageValue += Math.abs(variance) * (line.unitCost ?? 0);
    else surplusValue += variance * (line.unitCost ?? 0);
  }
  return { itemCount: lines.length, varianceCount, shortageValue, surplusValue, netValue: surplusValue - shortageValue };
}

/* Helpers */
export function getLowStockItems(): StockItem[] {
  return state.stockItems.filter((i) => i.isActive && i.currentQuantity <= i.reorderLevel);
}

/* Stock Par Levels / Reorder */
export function parLevelFor(stockItemId: string, locationId: string | undefined | null): { minLevel: number; maxLevel?: number } {
  if (!locationId) return { minLevel: 0 };
  const explicit = state.stockParLevels.find((p) => p.stockItemId === stockItemId && p.storageLocationId === locationId);
  if (explicit) return { minLevel: explicit.minLevel, maxLevel: explicit.maxLevel };
  const item = state.stockItems.find((i) => i.id === stockItemId);
  return { minLevel: item?.reorderLevel ?? 0 };
}

export function parStatusAt(stockItemId: string, locationId: string | undefined | null): "out" | "low" | "ok" | "over" {
  const qty = quantityAtLocation(stockItemId, locationId);
  if (qty <= 0) return "out";
  const par = parLevelFor(stockItemId, locationId);
  if (qty < par.minLevel) return "low";
  if (par.maxLevel !== undefined && qty > par.maxLevel) return "over";
  return "ok";
}

export type StockAlert = {
  stockItemId: string;
  storageLocationId: string;
  current: number;
  minLevel: number;
  maxLevel?: number;
  shortfall: number;
};

function stockAlerts(): StockAlert[] {
  const alerts: StockAlert[] = [];
  const seen = new Set<string>();
  for (const i of state.stockItems) {
    if (!i.isActive) continue;
    for (const loc of Object.keys(i.locationQuantities ?? {})) {
      const qty = quantityAtLocation(i.id, loc);
      if (qty <= 0) continue;
      const par = parLevelFor(i.id, loc);
      if (par.minLevel <= 0 && par.maxLevel === undefined) continue;
      const key = `${i.id}:${loc}`;
      if (seen.has(key)) continue;
      seen.add(key);
      alerts.push({
        stockItemId: i.id,
        storageLocationId: loc,
        current: qty,
        minLevel: par.minLevel,
        maxLevel: par.maxLevel,
        shortfall: Math.max(0, par.minLevel - qty),
      });
    }
  }
  return alerts;
}

export function lowStockAlerts(): StockAlert[] {
  return stockAlerts().filter((a) => a.current < a.minLevel);
}

export function overStockAlerts(): StockAlert[] {
  return stockAlerts().filter((a) => a.maxLevel !== undefined && a.current > a.maxLevel);
}

export function outOfStockAlerts(): StockAlert[] {
  const alerts: StockAlert[] = [];
  for (const i of state.stockItems) {
    if (!i.isActive) continue;
    for (const loc of Object.keys(i.locationQuantities ?? {})) {
      const qty = quantityAtLocation(i.id, loc);
      if (qty > 0) continue;
      const par = parLevelFor(i.id, loc);
      if (par.minLevel <= 0 && par.maxLevel === undefined) continue;
      alerts.push({ stockItemId: i.id, storageLocationId: loc, current: 0, minLevel: par.minLevel, maxLevel: par.maxLevel, shortfall: par.minLevel });
    }
  }
  return alerts;
}

export function upsertStockParLevel(input: StockParLevel) {
  const exists = state.stockParLevels.some((p) => p.id === input.id);
  const now = new Date().toISOString();
  if (exists) {
    state.stockParLevels = state.stockParLevels.map((p) => (p.id === input.id ? { ...p, ...input, updatedAt: now } : p));
  } else {
    state.stockParLevels = [{ ...input, createdAt: now, updatedAt: now }, ...state.stockParLevels];
  }
  logAudit({ module: "inventory", action: "Par level saved", entity: `${input.stockItemId} @ ${input.storageLocationId}`, severity: "info" });
  emit();
}

export function deleteStockParLevel(id: string) {
  const p = state.stockParLevels.find((x) => x.id === id);
  state.stockParLevels = state.stockParLevels.filter((x) => x.id !== id);
  if (p) logAudit({ module: "inventory", action: "Par level deleted", entity: `${p.stockItemId} @ ${p.storageLocationId}`, severity: "info" });
  emit();
}

export function stockParLevelsByItem(stockItemId: string) {
  return state.stockParLevels.filter((p) => p.stockItemId === stockItemId);
}

export function stockTotalValue(): number {
  return state.stockItems.reduce((sum, i) => sum + (i.unitCost ?? 0) * i.currentQuantity, 0);
}
