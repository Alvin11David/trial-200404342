import { Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  BedDouble,
  ScrollText,
  ClipboardList,
  UtensilsCrossed,
  ChevronDown,
  X,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  PieChart,
  Wallet,
  Table2,
  Send,
  ClipboardX,
  Utensils,
  Soup,
  CakeSlice,
  HandCoins,
  LayoutGrid,
  Users,
  Clock,
  Split,
  Merge,
  CalendarClock,
  Check,
  Bike,
  MapPin,
  StickyNote,
  Ticket,
  ShieldAlert,
  Gift,
  BadgePercent,
  CircleDollarSign,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartPie,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getUserRoleNames,
  useStore,
  upsertPosTab,
  holdPosTab,
  resumePosTab,
  upsertPosTabItem,
  posTabItemsByTab,
  openPosTabsByOutlet,
  sendKotForTabItems,
  isMenuItemAvailable,
  menuItemStockStatus,
  openTabForTable,
  posTableStatus,
  setPosTableReservation,
  mergePosTabs,
  splitPosTab,
  splitPosTabEvenly,
  splitPosTabBySeat,
  splitPosTabByAmount,
  kotItemsByKot,
  posTabItemNeedsKot,
  buildKotTicket,
  markKotPrinted,
  setKotItemStatus,
  voidKotItemsForPosTabItem,
  voidKotTicket,
  STATION_LABELS,
  posVoidNeedsApproval,
  POS_VOID_APPROVAL_THRESHOLD,
  setItemComp,
  applyPosDiscount,
  clearPosDiscount,
  openPosServiceShift,
  posServicePeriodMetrics,
  fmtUGX,
  reconcilePosServicePeriod,
  type KotStation,
  type OrderType,
  type PosTab,
  type PosTabItem,
  type MenuModifier,
  type MenuModifierOption,
  type MenuItem as StoreMenuItem,
} from "@/lib/pms-store";
import { printReceipt, type ReceiptData } from "@/lib/print-receipt";
import { printKotTicket, type KotTicketData } from "@/lib/print-kot";
import PosSettleDialog from "./PosSettleDialog";

type PaymentMethod = "Cash" | "Card" | "Room Charge" | "Credit";

const ORDER_TYPE_OPTIONS: { value: OrderType; label: string; icon: typeof UtensilsCrossed }[] = [
  { value: "dine_in", label: "Dine In", icon: UtensilsCrossed },
  { value: "takeaway", label: "Takeaway", icon: ShoppingCart },
  { value: "room_service", label: "Room Service", icon: BedDouble },
  { value: "delivery", label: "Delivery", icon: Bike },
];

const COURSES = [
  { number: 0, label: "All", icon: Utensils },
  { number: 1, label: "Starter", icon: Soup },
  { number: 2, label: "Main", icon: UtensilsCrossed },
  { number: 3, label: "Dessert", icon: CakeSlice },
];

function productImageUrl(name: string): string {
  const seed = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `https://picsum.photos/seed/${seed}/400/300`;
}

function POSPage() {
  /* ── Store reads ──────────────────────────────── */
  const tenant = useStore((s) => s.tenant);
  const cashierName =
    useStore((s) => s.users.find((u) => u.isActive && getUserRoleNames(u.id).includes("POS / Cashier"))?.fullName) ??
    "Cashier";
  const storeOutlets = useStore((s) => s.posOutlets.filter((o) => o.isActive));
  const activeTables = useStore((s) => s.posTables.filter((t) => t.isActive));
  const storeModifiers = useStore((s) => s.menuModifiers);
  const allStoreItems = useStore((s) => s.menuItems.filter((m) => m.isActive));
  const storeCategories = useStore((s) => s.menuCategories.filter((c) => c.isActive));
  const posTabs = useStore((s) => s.posTabs);
  const posTabItems = useStore((s) => s.posTabItems);
  const kotItems = useStore((s) => s.kotItems);

  /* ── Tab management ────────────────────────────── */
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showTabPicker, setShowTabPicker] = useState(false);
  const [showNewTabModal, setShowNewTabModal] = useState(false);
  const [newTabForm, setNewTabForm] = useState({ posOutletId: "", posTableId: "", orderType: "dine_in" as OrderType, coverCount: 1, deliveryName: "", deliveryAddress: "", orderNotes: "" });

  /* Floor plan + split / merge */
  const [viewMode, setViewMode] = useState<"menu" | "floor">("menu");
  const [floorOutletId, setFloorOutletId] = useState("");
  const [reserveFor, setReserveFor] = useState<string | null>(null);
  const [reserveUntil, setReserveUntil] = useState("");
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitMode, setSplitMode] = useState<"items" | "even" | "seat" | "amount">("items");
  const [splitSelected, setSplitSelected] = useState<string[]>([]);
  const [splitDestTable, setSplitDestTable] = useState("");
  const [splitCover, setSplitCover] = useState(1);
  const [splitParts, setSplitParts] = useState(2);
  const [splitAmounts, setSplitAmounts] = useState<number[]>([0, 0]);
  const [showMergeModal, setShowMergeModal] = useState(false);

  /* ── Product filtering ─────────────────────────── */
  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [showOrderTypePicker, setShowOrderTypePicker] = useState(false);
  const [showHeldPicker, setShowHeldPicker] = useState(false);
  const [rightTab, setRightTab] = useState<"order" | "analytics">("order");
  const [cartOpen, setCartOpen] = useState(false);

  const activeTab: PosTab | undefined = activeTabId ? posTabs.find((t) => t.id === activeTabId) : undefined;
  const outlet = activeTab ? storeOutlets.find((o) => o.id === activeTab.posOutletId) : undefined;

  /* Scope products + categories to the active outlet */
  const outletId = activeTab?.posOutletId ?? storeOutlets[0]?.id ?? "";
  const storeMenuItems = useMemo(
    () => allStoreItems.filter((m) => m.posOutletId === outletId),
    [allStoreItems, outletId],
  );
  const activeCategories = useMemo(
    () => storeCategories.filter((c) => c.posOutletId === outletId).sort((a, b) => a.displayOrder - b.displayOrder),
    [storeCategories, outletId],
  );
  const categoryLabels = useMemo(() => activeCategories.map((c) => c.name), [activeCategories]);
  const [category, setCategory] = useState("");
  useEffect(() => {
    if (categoryLabels.length > 0 && category !== "All" && !categoryLabels.includes(category)) {
      setCategory(categoryLabels[0]);
    }
  }, [categoryLabels, category]);

  const tabItems: PosTabItem[] = activeTabId ? posTabItems.filter((i) => i.posTabId === activeTabId) : [];

  const openTabs = activeTab
    ? posTabs.filter((t) => t.posOutletId === activeTab.posOutletId && t.status === "open")
    : [];
  const otherOpenTabs = openTabs.filter((t) => t.id !== activeTabId);
  const outletOpenTabs = useMemo(
    () => posTabs.filter((t) => t.posOutletId === outletId && t.status === "open"),
    [posTabs, outletId],
  );
  const heldTabs = useMemo(
    () => posTabs.filter((t) => t.posOutletId === outletId && t.status === "held"),
    [posTabs, outletId],
  );

  /* Table label + floor plan helpers */
  const tableLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of activeTables) map.set(t.id, t.tableName);
    return (id?: string) => (id ? map.get(id) ?? id : "");
  }, [activeTables]);

  const floorOutletIdResolved = floorOutletId || storeOutlets[0]?.id || "";
  const floorTables = useMemo(
    () => activeTables.filter((t) => t.posOutletId === floorOutletIdResolved),
    [activeTables, floorOutletIdResolved],
  );
  const floorOpenTabs = useMemo(() => openPosTabsByOutlet(floorOutletIdResolved), [floorOutletIdResolved]);

  /* Course filter */
  const [courseFilter, setCourseFilter] = useState(0);
  const [showCoursePicker, setShowCoursePicker] = useState<string | null>(null);

  const filteredCourseItems = useMemo(
    () => (courseFilter === 0 ? tabItems : tabItems.filter((i) => i.courseNumber === courseFilter)),
    [tabItems, courseFilter],
  );

  const unvoidedItems = useMemo(() => tabItems.filter((i) => !i.isVoided), [tabItems]);
  const chargedItems = useMemo(() => unvoidedItems.filter((i) => !i.isComplimentary), [unvoidedItems]);
  const kots = useStore((s) => s.kots);
  const activeKots = useMemo(() => (activeTab ? kots.filter((k) => k.posTabId === activeTab.id) : []), [kots, activeTab]);
  const itemsNeedingKot = useMemo(() => tabItems.filter((i) => posTabItemNeedsKot(i)), [tabItems, kotItems]);

  const subtotal = useMemo(() => chargedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [chargedItems]);
  const discount = Math.max(0, activeTab?.discount ?? 0);
  const billedBase = Math.max(0, subtotal - discount);
  const serviceChargePct = outlet?.serviceChargePct ?? 0;
  const serviceChargeAmount = Math.round(billedBase * (serviceChargePct / 100));
  const taxRate = 0.18;
  const tax = useMemo(() => {
    let totalVat = 0;
    for (const item of chargedItems) {
      const storeItem = allStoreItems.find((m) => m.id === item.menuItemId);
      const vt = storeItem?.vatTreatment ?? "inclusive";
      const itemTotal = item.unitPrice * item.quantity;
      const taxable = vt === "exempt" ? 0 : vt === "inclusive" ? Math.round(itemTotal / (1 + taxRate)) : itemTotal;
      totalVat += vt === "exempt" ? 0 : Math.round(taxable * taxRate);
    }
    return totalVat;
  }, [chargedItems, allStoreItems]);
  const total = billedBase + serviceChargeAmount + tax;

  /* Settle dialog */
  const [showSettle, setShowSettle] = useState(false);

  /* Filtered products for the selected category */
  const filtered = useMemo(() => {
    const catIds = category ? activeCategories.filter((c) => c.name === category).map((c) => c.id) : activeCategories.map((c) => c.id);
    return storeMenuItems.filter(
      (m) => catIds.includes(m.menuCategoryId) && (!search || m.name.toLowerCase().includes(search.toLowerCase())),
    );
  }, [storeMenuItems, activeCategories, category, search]);

  /* Modifier selection */
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [modifierTarget, setModifierTarget] = useState<StoreMenuItem | null>(null);
  const [itemNote, setItemNote] = useState("");
  const [itemCourse, setItemCourse] = useState(0);
  const [modifierSelections, setModifierSelections] = useState<Record<string, string>>({});

  /* Void workflow */
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidTargetId, setVoidTargetId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidApprover, setVoidApprover] = useState("");
  const [showApprovalStep, setShowApprovalStep] = useState(false);
  const voidTargetItem = voidTargetId ? tabItems.find((i) => i.id === voidTargetId) : undefined;
  const approvers = useStore((s) =>
    s.users.filter((u) => u.isActive && getUserRoleNames(u.id).some((r) => r === "Owner / GM")),
  );

  /* KOT/BOT tickets */
  const [kotTrayOpen, setKotTrayOpen] = useState(false);
  const [kotPreviewId, setKotPreviewId] = useState<string | null>(null);

  /* Shift / cashier */
  const posServicePeriods = useStore((s) => s.posServicePeriods);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [shiftOutletId, setShiftOutletId] = useState("");
  const [shiftFloat, setShiftFloat] = useState<number | "">("");
  const [countedCash, setCountedCash] = useState<number | "">("");
  const activeShift = useMemo(() => {
    const id = shiftOutletId || storeOutlets[0]?.id;
    return id ? posServicePeriods.find((p) => p.posOutletId === id && p.status === "open") : undefined;
  }, [posServicePeriods, shiftOutletId, storeOutlets]);
  const shiftMetrics = useMemo(() => (activeShift ? posServicePeriodMetrics(activeShift.id) : undefined), [activeShift]);
  const closedShifts = useMemo(() => posServicePeriods.filter((p) => p.status === "closed").slice(0, 8), [posServicePeriods]);

  function openShift() {
    const id = shiftOutletId || storeOutlets[0]?.id;
    if (!id) {
      toast.error("Select an outlet first");
      return;
    }
    openPosServiceShift(id, { openedBy: cashierName, openingFloat: Number(shiftFloat) || 0 });
    toast.success("Shift opened");
  }

  function closeAndReconcile() {
    if (!activeShift) return;
    const amount = Number(countedCash) || 0;
    if (amount <= 0) {
      toast.error("Enter counted cash");
      return;
    }
    reconcilePosServicePeriod(activeShift.id, { countedCash: amount, closedBy: cashierName });
    setCountedCash("");
    toast.success("Shift closed & reconciled");
  }

  /* Comp & discount */
  const [showCompModal, setShowCompModal] = useState(false);
  const [compItemId, setCompItemId] = useState<string | null>(null);
  const [compReason, setCompReason] = useState("");
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [discountReason, setDiscountReason] = useState("");
  const [approver, setApprover] = useState("");
  const compedCount = chargedItems.length > 0 ? unvoidedItems.length - chargedItems.length : 0;
  const compValue = useMemo(() => unvoidedItems.filter((i) => i.isComplimentary).reduce((s, i) => s + i.unitPrice * i.quantity, 0), [unvoidedItems]);

  function modifiersForMenuItem(item: StoreMenuItem): MenuModifier[] {
    return storeModifiers.filter((m) => m.menuItemId === item.id);
  }

  function handleAddItem(item: StoreMenuItem) {
    if (!isMenuItemAvailable(item) || menuItemStockStatus(item).soldOut) {
      toast.error(`${item.name} is currently unavailable`);
      return;
    }
    setItemNote("");
    setItemCourse(0);
    setModifierTarget(item);
    setModifierSelections({});
    setShowModifierModal(true);
  }

  function addItemToTab(item: StoreMenuItem, selections: Record<string, string>, opts?: { notes?: string; courseNumber?: number }) {
    if (!activeTab) {
      toast.error("Please create or select a tab first");
      return;
    }
    const modifierNames = Object.entries(selections)
      .map(([modId, optName]) => {
        const mod = storeModifiers.find((m) => m.id === modId);
        if (!mod) return "";
        const opt = mod.options.find((o) => o.name === optName);
        return opt ? `${mod.name}: ${optName}${opt.priceDelta ? ` (${opt.priceDelta > 0 ? "+" : ""}${opt.priceDelta})` : ""}` : optName;
      })
      .filter(Boolean)
      .join(", ");
    const specialNotes = [modifierNames ? `Modifiers: ${modifierNames}` : null, opts?.notes?.trim() || null].filter(Boolean).join(" · ");
    upsertPosTabItem({
      id: `PTI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      posTabId: activeTab.id,
      menuItemId: item.id,
      quantity: 1,
      unitPrice: item.unitPrice,
      modifierSelections: selections,
      specialNotes: specialNotes || undefined,
      courseNumber: opts?.courseNumber ?? 0,
      sentToKot: false,
      isComplimentary: false,
      isVoided: false,
      voidAfterAck: false,
      addedBy: cashierName,
      addedAt: new Date().toISOString(),
    });
    toast.success(`${item.name} added`);
  }

  function handleModifierConfirm() {
    if (modifierTarget) {
      addItemToTab(modifierTarget, modifierSelections, { notes: itemNote, courseNumber: itemCourse });
    }
    setShowModifierModal(false);
    setModifierTarget(null);
  }

  function handleQty(itemId: string, delta: number) {
    const item = tabItems.find((i) => i.id === itemId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      handleVoidClick(itemId);
      return;
    }
    upsertPosTabItem({ ...item, quantity: newQty });
  }

  function handleVoidClick(itemId: string) {
    setVoidTargetId(itemId);
    setVoidReason("");
    setVoidApprover("");
    setShowApprovalStep(false);
    setShowVoidModal(true);
  }

  function confirmVoid() {
    if (!voidTargetItem) return;
    const reason = voidReason || "Voided by cashier";
    const needsApproval = posVoidNeedsApproval(voidTargetItem);
    if (!showApprovalStep && needsApproval) {
      setShowApprovalStep(true);
      return;
    }
    if (needsApproval && !voidApprover) {
      toast.error("A manager must approve this void");
      return;
    }
    upsertPosTabItem({
      ...voidTargetItem,
      isVoided: true,
      voidReason: reason,
      voidedBy: cashierName,
      voidApprovedBy: needsApproval ? voidApprover : undefined,
    });
    if (voidTargetItem.sentToKot) voidKotItemsForPosTabItem(voidTargetItem.id, reason);
    setShowVoidModal(false);
    setVoidTargetId(null);
    setShowApprovalStep(false);
    toast.success("Item voided" + (needsApproval ? " · approved by manager" : " · KOT line voided"));
  }

  function setCourse(itemId: string, courseNumber: number) {
    const item = tabItems.find((i) => i.id === itemId);
    if (!item) return;
    upsertPosTabItem({ ...item, courseNumber });
    setShowCoursePicker(null);
  }

  function openCompModal(itemId: string) {
    setCompItemId(itemId);
    setCompReason("");
    setApprover("");
    setShowCompModal(true);
  }

  function confirmComp() {
    if (!compItemId || !activeTab) return;
    if (!approver) {
      toast.error("A manager must approve the comp");
      return;
    }
    setItemComp(activeTab.id, compItemId, { isComp: true, reason: compReason || "Comp by manager", authorisedBy: approver });
    setShowCompModal(false);
    setCompItemId(null);
    setApprover("");
    toast.success("Item comped · approved by manager");
  }

  function openDiscountModal() {
    setDiscountType("amount");
    setDiscountValue("");
    setDiscountReason("");
    setApprover("");
    setShowDiscountModal(true);
  }

  function applyDiscount() {
    if (!activeTab) return;
    const val = Number(discountValue) || 0;
    const amount = discountType === "amount" ? Math.max(0, val) : Math.round(subtotal * val / 100);
    if (amount <= 0) {
      toast.error("Enter a valid discount");
      return;
    }
    if (!approver) {
      toast.error("A manager must approve the discount");
      return;
    }
    applyPosDiscount(activeTab.id, { amount, reason: discountReason || "Manager discount", approvedBy: approver });
    setShowDiscountModal(false);
    toast.success(`Discount UGX ${amount.toLocaleString()} approved by ${approver}`);
  }

  const itemNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const smi of allStoreItems) map[smi.id] = smi.name;
    return map;
  }, [allStoreItems]);

  function buildKotTicketData(kotId: string): KotTicketData | null {
    const ticket = buildKotTicket(kotId);
    if (!ticket) return null;
    const courseLabel = (n: number | undefined) => COURSES.find((c) => c.number === n)?.label ?? undefined;
    return {
      id: ticket.kot.id,
      station: ticket.kot.stationType as KotStation,
      stationLabel: STATION_LABELS[ticket.kot.stationType],
      outletName: ticket.outlet?.name ?? "Restaurant",
      orderType: ORDER_TYPE_OPTIONS.find((o) => o.value === ticket.tab?.orderType)?.label ?? ticket.tab?.orderType ?? "",
      table: ticket.tab?.posTableId ? tableLabel(ticket.tab.posTableId) : "",
      deliveryName: ticket.tab?.deliveryName,
      coverCount: ticket.tab?.coverCount,
      orderItems: ticket.items
        .filter((i) => i.status !== "voided")
        .map((i) => ({
          name: i.name,
          qty: i.quantity,
          modifiers: i.modifiers,
          specialNotes: i.specialNotes,
          status: i.status,
          courseLabel: courseLabel(i.courseNumber),
        })),
      printCount: ticket.kot.printCount ?? 0,
      isReprint: (ticket.kot.printCount ?? 0) > 0,
      voided: ticket.kot.status === "voided",
    };
  }

  function handlePrintKot(kotId: string) {
    const data = buildKotTicketData(kotId);
    if (!data) return;
    markKotPrinted(kotId);
    printKotTicket(data);
  }

  function handleVoidKotTicket(kotId: string) {
    voidKotTicket(kotId, "Ticket voided by cashier");
    toast.success("KOT/BOT ticket voided");
    setKotPreviewId(null);
  }

  function handleSendToKitchen() {
    if (!activeTab) return;
    const unsentIds = itemsNeedingKot.map((i) => i.id);
    if (unsentIds.length === 0) {
      toast.error("No items to send");
      return;
    }
    const kots = sendKotForTabItems(activeTab.id, unsentIds);
    const stations = [...new Set(kots.map((k) => STATION_LABELS[k.stationType]))].join(" & ");
    for (const k of kots) {
      markKotPrinted(k.id);
      const data = buildKotTicketData(k.id);
      if (data) printKotTicket(data);
    }
    setKotTrayOpen(true);
    toast.success(`${kots.length} ticket${kots.length !== 1 ? "s" : ""} routed to ${stations} printer`);
  }

  function handleSettle() {
    if (!activeTab) { toast.error("No active tab"); return; }
    const unsentIds = itemsNeedingKot.map((i) => i.id);
    if (unsentIds.length > 0) sendKotForTabItems(activeTab.id, unsentIds);
    setShowSettle(true);
  }

  function buildReceiptData(payment: PaymentMethod, receiptId: string): ReceiptData {
    return {
      id: receiptId,
      items: unvoidedItems.map((i) => {
        const menuItem = allStoreItems.find((m) => m.id === i.menuItemId);
        return { name: menuItem?.name ?? `Item ${i.menuItemId}`, qty: i.quantity, price: i.unitPrice };
      }),
      subtotal,
      tax,
      taxRate,
      total,
      paymentMethod: payment,
      table: activeTab ? tableLabel(activeTab.posTableId) : "",
      cashier: cashierName,
      businessName: tenant.name,
      businessAddress: tenant.address ?? "",
      businessPhone: tenant.phone ?? "",
      businessEmail: tenant.email ?? "",
      businessTin: tenant.tin ?? "",
    };
  }

  function handlePrintReceipt(payment: PaymentMethod) {
    if (unvoidedItems.length === 0) return;
    const rid = `RCT-${Date.now()}`;
    printReceipt(buildReceiptData(payment, rid));
  }

  function createNewTab() {
    const tabId = `TAB-${Date.now()}`;
    const outlet = storeOutlets.find((o) => o.id === newTabForm.posOutletId);
    upsertPosTab({
      id: tabId,
      posOutletId: newTabForm.posOutletId || (storeOutlets[0]?.id ?? "PO001"),
      posTableId: newTabForm.posTableId || undefined,
      orderType: newTabForm.orderType,
      deliveryName: newTabForm.orderType === "delivery" ? newTabForm.deliveryName || undefined : undefined,
      deliveryAddress: newTabForm.orderType === "delivery" ? newTabForm.deliveryAddress || undefined : undefined,
      orderNotes: newTabForm.orderNotes.trim() || undefined,
      coverCount: newTabForm.coverCount,
      status: "open",
      subtotal: 0,
      vatAmount: 0,
      serviceChargeAmount: 0,
      totalAmount: 0,
      openedAt: new Date().toISOString(),
      openedBy: cashierName,
    });
    setActiveTabId(tabId);
    setShowNewTabModal(false);
    toast.success(`Tab opened at ${outlet?.name ?? "outlet"}`);
  }

  function handleHoldTab() {
    if (!activeTab) return;
    if (holdPosTab(activeTab.id, cashierName)) {
      setActiveTabId(null);
      setCartOpen(false);
      toast.success("Ticket parked — retrieve it from Held tickets");
    }
  }

  function retrieveHeldTab(tabId: string) {
    if (resumePosTab(tabId)) {
      setActiveTabId(tabId);
      setShowHeldPicker(false);
      toast.success("Held ticket resumed");
    }
  }

  function selectTab(tabId: string) {
    setActiveTabId(tabId);
    setShowTabPicker(false);
  }

  function openTabAtTable(tableId: string) {
    const table = activeTables.find((t) => t.id === tableId);
    if (!table) return;
    setNewTabForm({
      posOutletId: table.posOutletId,
      posTableId: table.id,
      orderType: "dine_in",
      coverCount: Math.min(2, table.seatingCapacity),
      deliveryName: "",
      deliveryAddress: "",
      orderNotes: "",
    });
    setShowNewTabModal(true);
  }

  const itemCount = unvoidedItems.reduce((s, i) => s + i.quantity, 0);
  const seatedTables = floorTables.filter((table) => posTableStatus(table.id) === "occupied").length;
  const kitchenQueueCount = kots.filter((kot) => !["completed", "voided", "served"].includes(String(kot.status))).length;
  const todayRevenue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return posTabs
      .filter((tab) => tab.status === "settled" && (tab.settledAt ?? "").slice(0, 10) === today)
      .reduce((sum, tab) => sum + (tab.totalAmount ?? 0), 0);
  }, [posTabs]);

  return (
    <div className="pos-terminal relative -mx-6 -mt-8 flex h-[calc(100vh-4rem)] min-h-[560px] overflow-hidden bg-[#f7f8fb] dark:bg-background">
      {/* Left: Menu Items */}
      <div className="pos-menu-column flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* POS identity strip */}
        <div className="pos-identity-strip flex items-center justify-between border-b border-[#e5e7eb] bg-white px-5 py-3 dark:border-border dark:bg-card/80 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#18245c] text-white shadow-lg shadow-[#18245c]/15">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-[#18245c] dark:text-primary">Jambo POS</p>
                <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 sm:inline-flex dark:bg-emerald-950/30 dark:text-emerald-400">Live</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{outlet?.name ?? storeOutlets[0]?.name ?? "Main outlet"} · {cashierName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Service mode</p>
              <p className="hidden text-xs font-semibold text-foreground sm:block">{ORDER_TYPE_OPTIONS.find((o) => o.value === orderType)?.label}</p>
            </div>
            <div className="hidden h-8 w-px bg-border/70 sm:block" />
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff1f5] text-[#ff477e] dark:bg-rose-950/30 dark:text-rose-300">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <button
              onClick={() => setShowNewTabModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#18245c] px-3 py-2 text-xs font-bold text-white shadow-lg shadow-[#18245c]/20 transition hover:-translate-y-0.5 hover:bg-[#23337b] active:scale-95 sm:px-3.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New ticket</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-b border-[#e5e7eb] bg-[#e5e7eb] dark:border-border dark:bg-border/60 sm:grid-cols-4">
          {[
            {
              label: "Open tickets",
              value: outletOpenTabs.length,
              detail: outletOpenTabs.length === 1 ? "in service" : "in service",
              icon: ClipboardList,
              tone: "text-[#d9265d] bg-[#fff1f5]",
              onClick: () => {
                if (outletOpenTabs[0]) setActiveTabId(outletOpenTabs[0].id);
                else setShowNewTabModal(true);
              },
            },
            {
              label: "Floor",
              value: `${seatedTables}/${floorTables.length}`,
              detail: "tables occupied",
              icon: LayoutGrid,
              tone: "text-amber-700 bg-amber-50",
              onClick: () => setViewMode("floor"),
            },
            {
              label: "Kitchen",
              value: kitchenQueueCount,
              detail: kitchenQueueCount === 1 ? "ticket in queue" : "tickets in queue",
              icon: Send,
              tone: "text-emerald-700 bg-emerald-50",
              onClick: () => setKotTrayOpen(true),
            },
            {
              label: "Today",
              value: `UGX ${todayRevenue.toLocaleString()}`,
              detail: "settled revenue",
              icon: TrendingUp,
              tone: "text-violet-700 bg-violet-50",
              onClick: () => setRightTab("analytics"),
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.label}
                onClick={stat.onClick}
                className="flex min-w-0 items-center gap-2.5 bg-white px-4 py-2.5 text-left transition hover:bg-[#fbfbfd] dark:bg-card/70 dark:hover:bg-card sm:px-5"
              >
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", stat.tone)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/65">{stat.label}</span>
                  <span className="block truncate text-sm font-bold tabular-nums text-foreground">{stat.value}</span>
                  <span className="hidden truncate text-[10px] text-muted-foreground/60 md:block">{stat.detail}</span>
                </span>
              </button>
            );
          })}
        </div>
        {/* Top bar: order type, tab selector, search, sub-nav */}
        <div className="pos-toolbar relative z-30 flex flex-wrap items-center gap-2.5 border-b border-[#e5e7eb] bg-white px-4 py-3 backdrop-blur dark:border-border dark:bg-card/60 sm:gap-3 sm:px-6">
          {/* Order Type Selector */}
          <div className="relative">
            <button
              onClick={() => setShowOrderTypePicker((p) => !p)}
               className="inline-flex items-center gap-2 rounded-xl border border-[#e3e5ea] bg-[#fafbfc] px-3.5 py-2 text-sm font-semibold hover:border-[#ff477e]/60 sm:px-4 dark:border-border dark:bg-card/40"
            >
              {(() => {
                const Icon = ORDER_TYPE_OPTIONS.find((o) => o.value === orderType)?.icon ?? UtensilsCrossed;
                return <Icon className="h-4 w-4 text-muted-foreground" />;
              })()}
              {ORDER_TYPE_OPTIONS.find((o) => o.value === orderType)?.label}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {showOrderTypePicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOrderTypePicker(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-border/60 bg-popover p-1.5 shadow-xl">
                  {ORDER_TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setOrderType(opt.value);
                          setShowOrderTypePicker(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                          opt.value === orderType
                            ? "bg-primary/15 text-primary font-medium"
                            : "text-popover-foreground/80 hover:bg-accent",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Shift / cashier manager */}
          <button
            onClick={() => setShiftOpen(true)}
               className={cn(
               "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold hover:border-[#ff477e]/60 sm:px-4",
               activeShift ? "border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" : "border-[#e3e5ea] bg-[#fafbfc] dark:border-border dark:bg-card/40",
            )}
            title={activeShift ? "Shift open — click to close/reconcile" : "No shift open — click to open"}
          >
            <CircleDollarSign className="h-4 w-4" />
            <span className="hidden md:inline">
              {activeShift ? `Shift: ${fmtUGX(shiftMetrics?.expectedCash ?? 0)}` : "Shift"}
            </span>
          </button>

          {/* Tab Selector */}
          <div className="relative">
            <button
              onClick={() => setShowTabPicker((p) => !p)}
                 className={cn(
                 "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold hover:border-[#ff477e]/60 sm:px-4",
                 activeTab ? "border-[#ff477e]/40 bg-[#fff1f5] text-[#d9265d] dark:bg-primary/10 dark:text-primary" : "border-[#e3e5ea] bg-[#fafbfc] dark:border-border dark:bg-card/40",
              )}
            >
              <Table2 className="h-4 w-4" />
              {activeTab ? `Tab: ${orderType === "takeaway" ? "Takeaway" : tableLabel(activeTab.posTableId) || "No table"}` : "No tab"}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {showTabPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTabPicker(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-xl border border-border/60 bg-popover p-1.5 shadow-xl">
                  <div className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    Open Tabs
                  </div>
                  {openTabs.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground/60">No open tabs</div>
                  )}
                  {openTabs.map((t) => {
                    const tabMenuItems = posTabItemsByTab(t.id);
                    const totalQty = tabMenuItems.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <button
                        key={t.id}
                        onClick={() => selectTab(t.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                          t.id === activeTabId
                            ? "bg-primary/15 text-primary font-medium"
                            : "text-popover-foreground/80 hover:bg-accent",
                        )}
                      >
                        <span>{tableLabel(t.posTableId) || `Tab ${t.id.slice(-4)}`}</span>
                        <span className="text-[10px] text-muted-foreground/60">{totalQty} items</span>
                      </button>
                    );
                  })}
                  <div className="mt-1 border-t border-border/40 pt-1">
                    <button
                      onClick={() => { setShowTabPicker(false); setShowNewTabModal(true); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                      <Plus className="h-3.5 w-3.5" /> New Tab
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Parked / held tickets */}
          <div className="relative">
            <button
              onClick={() => setShowHeldPicker((p) => !p)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition hover:border-[#ff477e]/60 sm:px-4",
                heldTabs.length > 0
                  ? "border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                  : "border-[#e3e5ea] bg-[#fafbfc] dark:border-border dark:bg-card/40",
              )}
              title="Retrieve parked tickets"
            >
              <ClipboardX className="h-4 w-4" />
              <span className="hidden md:inline">Held</span>
              {heldTabs.length > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[10px] text-white">
                  {heldTabs.length}
                </span>
              )}
            </button>
            {showHeldPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowHeldPicker(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-xl border border-border/60 bg-popover p-1.5 shadow-xl">
                  <div className="mb-1 flex items-center justify-between px-2 py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Held tickets</span>
                    <span className="text-[10px] text-muted-foreground/50">{heldTabs.length}</span>
                  </div>
                  {heldTabs.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-muted-foreground/60">No parked tickets</div>
                  ) : (
                    heldTabs.map((t) => {
                      const qty = posTabItemsByTab(t.id).filter((i) => !i.isVoided).reduce((s, i) => s + i.quantity, 0);
                      const label = t.posTableId ? tableLabel(t.posTableId) : t.deliveryName || (t.orderType === "takeaway" ? "Takeaway" : "Quick ticket");
                      return (
                        <button
                          key={t.id}
                          onClick={() => retrieveHeldTab(t.id)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-amber-500/10"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{label}</span>
                            <span className="block text-[10px] text-muted-foreground/60">{qty} items · {fmtUGX(t.totalAmount)}</span>
                          </span>
                          <span className="ml-3 shrink-0 rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">Resume</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

           <div className="pos-search relative order-last w-full sm:order-none sm:min-w-[170px] sm:max-w-md sm:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items…"
               className="w-full rounded-xl border border-[#e3e5ea] bg-[#fafbfc] py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#ff477e]/60 focus:ring-2 focus:ring-[#ff477e]/10 dark:border-border dark:bg-card/40"
            />
          </div>

           <div className="pos-shortcuts flex items-center gap-1">
            <button
              onClick={() => setViewMode((v) => (v === "menu" ? "floor" : "menu"))}
                 className={cn(
                 "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
                 viewMode === "floor" ? "bg-[#fff1f5] text-[#d9265d] dark:bg-primary/15 dark:text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {viewMode === "floor" ? "Menu" : "Floor Plan"}
            </button>
             <Link
              to="/pos/orders"
               className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Orders
            </Link>
             <Link
              to="/pos/menu"
               className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Menu
            </Link>
          </div>
        </div>

        {viewMode === "menu" ? (
          <>
        {/* Category tabs */}
        <div className="pos-category-tabs flex gap-1 overflow-x-auto border-b border-[#e5e7eb] bg-white px-4 py-2 dark:border-border dark:bg-card/20 sm:px-6">
          {(["All", ...categoryLabels]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                category === cat
                  ? "bg-[#18245c] text-white shadow-md shadow-[#18245c]/15 dark:bg-primary/15 dark:text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="pos-products flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((item) => {
              const stock = menuItemStockStatus(item);
              const unavailable = !isMenuItemAvailable(item) || stock.soldOut;
              const reason86 = item.isSoldOut || stock.soldOut;
              return (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  disabled={unavailable}
                  className={cn(
                     "group relative overflow-hidden rounded-2xl border bg-white transition-all dark:bg-card",
                    unavailable
                       ? "cursor-not-allowed border-border/40 opacity-70"
                       : "border-[#e4e6eb] hover:-translate-y-1 hover:border-[#ff477e]/50 hover:shadow-xl hover:shadow-[#ff477e]/10 dark:border-border/60",
                  )}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                      src={productImageUrl(item.name)}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                     <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-[#ff477e] text-white shadow-lg shadow-[#ff477e]/25 transition-all hover:bg-[#e93368] active:scale-90">
                      <Plus className="h-4 w-4" />
                    </span>
                    {unavailable && (
                      <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        {reason86 ? "86" : "OFF"}
                      </span>
                    )}
                    {modifiersForMenuItem(item).length > 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow">
                        MOD
                      </span>
                    )}
                  </div>
                   <div className="p-3 sm:p-3.5">
                    <div className="font-semibold text-sm leading-tight truncate">{item.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        {activeCategories.find((c) => c.id === item.menuCategoryId)?.name ?? ""}
                      </span>
                      <span className="text-xs font-bold tabular-nums">
                        UGX {item.unitPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-white/60 px-6 text-center dark:bg-card/30">
                <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1f5] text-[#d9265d] dark:bg-primary/10 dark:text-primary">
                  <Search className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-foreground">No menu items found</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">Try another search or browse a different category.</p>
                {(search || category !== "All") && (
                  <button
                    onClick={() => { setSearch(""); setCategory("All"); }}
                    className="mt-4 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                Floor Plan
              </h3>
              <span className="text-xs text-muted-foreground">{floorTables.length} tables · {floorOpenTabs.length} open</span>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {(["free", "occupied", "reserved"] as const).map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2.5 py-1 text-[10px] font-medium capitalize">
                      <span className={cn("h-2 w-2 rounded-full", s === "free" ? "bg-emerald-500" : s === "occupied" ? "bg-rose-500" : "bg-amber-500")} />
                      {s}
                    </span>
                  ))}
                </div>
                <select
                  value={floorOutletIdResolved}
                  onChange={(e) => setFloorOutletId(e.target.value)}
                  className="rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary/50"
                >
                  {storeOutlets.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {floorTables.map((table) => {
                const status = posTableStatus(table.id);
                const openTab = status === "occupied" ? openTabForTable(table.id) : undefined;
                const openTabItemCount = openTab ? posTabItemsByTab(openTab.id).filter((i) => !i.isVoided).reduce((s, i) => s + i.quantity, 0) : 0;
                const elapsedMin = openTab ? Math.max(0, Math.floor((Date.now() - new Date(openTab.openedAt).getTime()) / 60000)) : 0;
                const reservedAt = table.reservedUntil ? new Date(table.reservedUntil) : undefined;
                return (
                  <div
                    key={table.id}
                    className={cn(
                      "relative flex flex-col rounded-2xl border-2 p-4 transition",
                      status === "occupied" && "border-rose-500/60 bg-rose-500/10",
                      status === "reserved" && "border-amber-500/60 bg-amber-500/10",
                      status === "free" && "border-emerald-500/40 bg-card",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{table.tableName}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {table.seatingCapacity} seats
                        </div>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                          status === "occupied" && "bg-rose-500/20 text-rose-600",
                          status === "reserved" && "bg-amber-500/20 text-amber-600",
                          status === "free" && "bg-emerald-500/20 text-emerald-600",
                        )}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="mt-3 min-h-[2.5rem] text-xs text-muted-foreground">
                      {status === "occupied" && openTab && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" /> {openTab.coverCount} covers
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ShoppingCart className="h-3.5 w-3.5" /> {openTabItemCount} items
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> {elapsedMin}m
                          </div>
                        </div>
                      )}
                      {status === "reserved" && reservedAt && (
                        <div className="flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5" />
                          Until {reservedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                      {status === "free" && <span className="text-muted-foreground/50">Available</span>}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {status === "occupied" && openTab ? (
                        <button
                          onClick={() => selectTab(openTab.id)}
                          className="flex-1 min-w-0 rounded-xl bg-primary/90 px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary"
                        >
                          Open Tab
                        </button>
                      ) : (
                        <button
                          onClick={() => openTabAtTable(table.id)}
                          className="flex-1 min-w-0 rounded-xl bg-emerald-600/90 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                        >
                          Open Tab
                        </button>
                      )}
                      {status === "free" && (
                        <button
                          onClick={() => {
                            setReserveUntil(new Date(Date.now() + 2 * 3600_000).toISOString().slice(0, 16));
                            setReserveFor(table.id);
                          }}
                          className="rounded-xl border border-amber-500/40 px-3 py-2 text-xs font-medium text-amber-600 transition hover:bg-amber-500/10"
                        >
                          Reserve
                        </button>
                      )}
                      {status === "reserved" && (
                        <button
                          onClick={() => {
                            setPosTableReservation(table.id);
                            toast.success(`${table.tableName} reservation cleared`);
                          }}
                          className="rounded-xl border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted/30"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {floorTables.length === 0 && (
                <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
                  No tables in this outlet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Order / Analytics */}
      <div className={cn(
        "pos-cart-panel flex w-[300px] shrink-0 flex-col border-l border-border/60 bg-white/95 backdrop-blur lg:w-[340px] xl:w-[380px] dark:bg-card/95",
        cartOpen && "is-open",
      )}>
        {/* Tabs */}
        <div className="flex items-stretch border-b border-border/60">
          <button
            onClick={() => setRightTab("order")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition",
              rightTab === "order"
                ? "border-b-2 border-primary text-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/30",
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            Order
          </button>
          <button
            onClick={() => setRightTab("analytics")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition",
              rightTab === "analytics"
                ? "border-b-2 border-primary text-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/30",
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Insights
          </button>
        </div>

        {rightTab === "order" ? (
          <>
            {/* Order Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold">{activeTab ? "Current Tab" : "No Tab Selected"}</h2>
                <p className="text-xs text-muted-foreground">
                  {activeTab ? (
                    <>                  {ORDER_TYPE_OPTIONS.find((o) => o.value === activeTab.orderType)?.label ?? activeTab.orderType}{activeTab.posTableId ? ` · ${tableLabel(activeTab.posTableId)}` : ""}{activeTab.deliveryName ? ` · ${activeTab.deliveryName}` : ""} · {itemCount} item{itemCount !== 1 ? "s" : ""}</>
                  ) : (
                    "Create or select a tab to start"
                  )}
                </p>
                {activeTab?.orderNotes && (
                  <p className="mt-2 flex max-w-[260px] items-start gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                    <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
                    <span className="line-clamp-2">{activeTab.orderNotes}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Course filter chips */}
            {activeTab && tabItems.length > 0 && (
              <div className="flex gap-1 border-b border-border/40 px-5 pb-2">
                {COURSES.map((c) => {
                  const count = c.number === 0 ? tabItems.length : tabItems.filter((i) => i.courseNumber === c.number).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={c.number}
                      onClick={() => setCourseFilter(c.number)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-[10px] font-medium transition",
                        courseFilter === c.number
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/30",
                      )}
                    >
                      {c.label} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab items */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {!activeTab ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No tab selected</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Select a tab or create a new one
                  </p>
                  <button
                    onClick={() => setShowNewTabModal(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> New Tab
                  </button>
                </div>
              ) : filteredCourseItems.filter((i) => !i.isVoided).length === 0 && tabItems.filter((i) => !i.isVoided).length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No items yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Tap items on the left to add to this tab
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filteredCourseItems.filter((i) => !i.isVoided).map((entry) => {
                    const menuItem = allStoreItems.find((m) => m.id === entry.menuItemId);
                    return (
                      <li
                        key={entry.id}
                        className="rounded-xl border border-border/50 bg-card/40 p-3 transition hover:border-primary/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">{menuItem?.name ?? entry.menuItemId}</span>
                              {entry.sentToKot && (
                                <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">KOT</span>
                              )}
                            </div>
                            {entry.specialNotes && (
                              <p className="mt-0.5 text-[10px] text-muted-foreground/60 truncate">{entry.specialNotes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleQty(entry.id, -1)}
                              className="grid h-7 w-7 place-items-center rounded-lg border border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-[20px] text-center text-sm font-semibold tabular-nums">
                              {entry.quantity}
                            </span>
                            <button
                              onClick={() => handleQty(entry.id, 1)}
                              className="grid h-7 w-7 place-items-center rounded-lg border border-border/60 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="min-w-[64px] text-right text-sm font-semibold tabular-nums">
                            UGX {(entry.unitPrice * entry.quantity).toLocaleString()}
                          </div>
                        </div>

                        {/* Course + actions row */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="relative">
                            <button
                              onClick={() => setShowCoursePicker(showCoursePicker === entry.id ? null : entry.id)}
                              className="rounded-md border border-border/40 bg-background/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                            >
                              {COURSES.find((c) => c.number === entry.courseNumber)?.label ?? "Course"} &#9660;
                            </button>
                            {showCoursePicker === entry.id && (
                              <div className="absolute bottom-full left-0 z-30 mb-1 rounded-lg border border-border/50 bg-popover p-1 shadow-lg">
                                {COURSES.filter((c) => c.number !== 0).map((c) => (
                                  <button
                                    key={c.number}
                                    onClick={() => setCourse(entry.id, c.number)}
                                    className={cn(
                                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition",
                                      entry.courseNumber === c.number
                                        ? "bg-primary/15 text-primary font-medium"
                                        : "text-popover-foreground/70 hover:bg-accent",
                                    )}
                                  >
                                    {c.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleVoidClick(entry.id)}
                            className="rounded-md px-2 py-0.5 text-[10px] font-medium text-muted-foreground/50 hover:text-destructive"
                          >
                            Void
                          </button>
                          {entry.isComplimentary ? (
                            <button
                              onClick={() => setItemComp(activeTab!.id, entry.id, { isComp: false })}
                              title="Remove comp"
                              className="rounded-md px-2 py-0.5 text-[10px] font-medium text-primary"
                            >
                              COMP·OK {entry.compAuthorisedBy ? entry.compAuthorisedBy.split(" ")[0] : ""}
                            </button>
                          ) : (
                            <button
                              onClick={() => openCompModal(entry.id)}
                              title="Complimentary"
                              className="rounded-md px-2 py-0.5 text-[10px] font-medium text-muted-foreground/50 hover:text-primary"
                            >
                              Comp
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Voided items */}
              {tabItems.filter((i) => i.isVoided).length > 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-border/30 bg-muted/20 p-3">
                  <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1">Voided</p>
                  {tabItems.filter((i) => i.isVoided).map((v) => {
                    const vm = allStoreItems.find((m) => m.id === v.menuItemId);
                    return (
                      <div key={v.id} className="flex items-center justify-between text-[11px] text-muted-foreground/50">
                        <span className="line-through">{vm?.name ?? v.menuItemId} ×{v.quantity}</span>
                        <span className="italic">{v.voidReason}{v.voidApprovedBy ? ` · OK ${v.voidApprovedBy}` : ""}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Totals + actions */}
            {activeTab && (
              <div className="border-t border-border/60">
                <div className="px-5 py-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">UGX {subtotal.toLocaleString()}</span>
                  </div>
                  {serviceChargeAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Charge ({serviceChargePct}%)</span>
                      <span className="tabular-nums">UGX {serviceChargeAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span className="flex items-center gap-1.5">
                        <BadgePercent className="h-3.5 w-3.5" />
                        Discount{activeTab?.discountPct ? ` (${activeTab.discountPct}%)` : ""}{activeTab?.discountApprovedBy ? ` · OK ${activeTab.discountApprovedBy}` : ""}
                      </span>
                      <span className="tabular-nums">-UGX {discount.toLocaleString()}</span>
                    </div>
                  )}
                  {compedCount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span className="flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5" />Comps ({compedCount})
                      </span>
                      <span className="tabular-nums">-UGX {compValue.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT</span>
                    <span className="tabular-nums">UGX {tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-2">
                    <span className="text-base font-semibold">Total</span>
                    <span className="text-xl font-bold text-gradient-primary tabular-nums">
                      UGX {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Split / Merge */}
                <div className="px-5 pb-2 flex gap-2">
                  <button
                    onClick={handleHoldTab}
                    disabled={unvoidedItems.length === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:text-amber-300"
                    title="Park this ticket and serve another guest"
                  >
                    <ClipboardX className="h-3.5 w-3.5" />
                    Hold
                  </button>
                  <button
                    onClick={() => {
                      setSplitSelected(unvoidedItems.map((i) => i.id));
                      setSplitDestTable("");
                      setSplitCover(1);
                      setSplitMode("items");
                      setSplitParts(2);
                      setSplitAmounts([0, 0]);
                      setShowSplitModal(true);
                    }}
                    disabled={unvoidedItems.length === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Split className="h-3.5 w-3.5" />
                    Split
                  </button>
                  <button
                    onClick={() => setShowMergeModal(true)}
                    disabled={otherOpenTabs.length === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Merge className="h-3.5 w-3.5" />
                    Merge
                  </button>
                </div>

                {/* Send to Kitchen */}
                <div className="px-5 pb-2">
                  <button
                    onClick={handleSendToKitchen}
                    disabled={itemsNeedingKot.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                    Send to Kitchen
                  </button>
                  <button
                    onClick={() => setKotTrayOpen(true)}
                    disabled={activeKots.length === 0}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/40 px-4 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Ticket className="h-4 w-4" />
                    KOT / BOT Tickets ({activeKots.length})
                  </button>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={openDiscountModal}
                      disabled={chargedItems.length === 0}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-40"
                    >
                      <BadgePercent className="h-4 w-4" />
                      {discount > 0 ? `-UGX ${discount.toLocaleString()}` : "Discount"}
                    </button>
                    {discount > 0 && (
                      <button
                        onClick={() => clearPosDiscount(activeTab!.id)}
                        className="rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-destructive"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Settle */}
                <div className="px-5 pb-4 space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={handleSettle}
                      className="flex-1 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.78_0.20_75)] py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <HandCoins className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                      Settle — UGX {total.toLocaleString()}
                    </button>
                    <button
                      onClick={() => handlePrintReceipt("Cash")}
                      disabled={unvoidedItems.length === 0}
                      className="rounded-xl border border-border/60 bg-card/40 p-3 text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Printer className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <POSAnalytics />
        )}
      </div>

      {/* Compact order access on phones — keeps the menu usable without sacrificing the cart. */}
      {cartOpen && (
        <button
          type="button"
          aria-label="Close current order"
          onClick={() => setCartOpen(false)}
          className="pos-cart-backdrop fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px] md:hidden"
        />
      )}
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="pos-mobile-cart fixed bottom-4 left-3 right-3 z-40 flex items-center justify-between rounded-2xl bg-[#18245c] px-4 py-3 text-left text-white shadow-2xl shadow-[#18245c]/30 md:hidden"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/12">
            <ShoppingCart className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-xs font-semibold">{itemCount ? `${itemCount} item${itemCount !== 1 ? "s" : ""} in order` : "Your order is empty"}</span>
            <span className="mt-0.5 block text-[10px] text-white/60">{activeTab ? `${tableLabel(activeTab.posTableId) || "Open tab"}` : "Tap to review order"}</span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold tabular-nums">UGX {total.toLocaleString()}</span>
          <ChevronDown className="h-4 w-4 -rotate-90 text-white/60" />
        </span>
      </button>

      {/* New Tab Modal */}
      {showNewTabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNewTabModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold">New Tab</h3>
              <button onClick={() => setShowNewTabModal(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Outlet</label>
                <select
                  value={newTabForm.posOutletId}
                  onChange={(e) => setNewTabForm({ ...newTabForm, posOutletId: e.target.value })}
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                >
                  <option value="">Select outlet</option>
                  {storeOutlets.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Order Type</label>
                <select
                  value={newTabForm.orderType}
                  onChange={(e) => setNewTabForm({ ...newTabForm, orderType: e.target.value as OrderType })}
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                >
                  {ORDER_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Table</label>
                <select
                  value={newTabForm.posTableId}
                  onChange={(e) => setNewTabForm({ ...newTabForm, posTableId: e.target.value })}
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                >
                  <option value="">No table</option>
                  {activeTables.filter((t) => !newTabForm.posOutletId || t.posOutletId === newTabForm.posOutletId).map((t) => (
                    <option key={t.id} value={t.id}>{t.tableName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Cover Count</label>
                <input
                  type="number"
                  value={newTabForm.coverCount}
                  onChange={(e) => setNewTabForm({ ...newTabForm, coverCount: Math.max(1, Number(e.target.value)) })}
                  min={1}
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <StickyNote className="h-3.5 w-3.5" />
                  Order note <span className="font-normal text-muted-foreground/50">(optional)</span>
                </label>
                <textarea
                  value={newTabForm.orderNotes}
                  onChange={(e) => setNewTabForm({ ...newTabForm, orderNotes: e.target.value })}
                  rows={2}
                  placeholder="Guest preference, allergy, or service note…"
                  className="w-full resize-none rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                />
              </div>
            </div>
            {newTabForm.orderType === "delivery" && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Customer Name</label>
                  <div className="relative">
                    <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                    <input
                      value={newTabForm.deliveryName}
                      onChange={(e) => setNewTabForm({ ...newTabForm, deliveryName: e.target.value })}
                      placeholder="Guest / customer name"
                      className="w-full rounded-xl border border-border/50 bg-background/40 py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Delivery Address</label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <textarea
                      value={newTabForm.deliveryAddress}
                      onChange={(e) => setNewTabForm({ ...newTabForm, deliveryAddress: e.target.value })}
                      rows={2}
                      placeholder="Street, building, room / area notes"
                      className="w-full resize-none rounded-xl border border-border/50 bg-background/40 py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowNewTabModal(false)} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
              <button onClick={createNewTab} disabled={!newTabForm.posOutletId} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                Open Tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift / Cashier modal */}
      {shiftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShiftOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">
                <CircleDollarSign className="mr-1.5 inline h-5 w-5 text-primary" />
                Shift / Cashier Management
              </h3>
              <button onClick={() => setShiftOpen(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Outlet selector */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Outlet</label>
              <select
                value={shiftOutletId || storeOutlets[0]?.id}
                onChange={(e) => { setShiftOutletId(e.target.value); setCountedCash(""); }}
                className="w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              >
                {storeOutlets.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
              {storeOutlets.length === 0 && <p className="mt-1 text-xs text-muted-foreground">No outlets configured.</p>}
            </div>

            {activeShift ? (
              <>
                {/* Open shift live metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-border/50 p-3">
                    <p className="text-[10px] text-muted-foreground">OPENED BY</p>
                    <p className="text-sm font-semibold">{activeShift.openedBy}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 p-3">
                    <p className="text-[10px] text-muted-foreground">FLOAT</p>
                    <p className="text-sm font-semibold">{fmtUGX(activeShift.openingFloat ?? 0)}</p>
                  </div>
                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3">
                    <p className="text-[10px] text-muted-foreground">CASH &amp; CARD</p>
                    <p className="text-sm font-semibold text-amber-300">{fmtUGX(shiftMetrics?.totalDirectPayments ?? 0)}</p>
                  </div>
                </div>
                {shiftMetrics && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border/50">
                    <table className="w-full text-xs">
                      <tbody>
                        {[
                          ["Food sales", fmtUGX(shiftMetrics.totalFoodRevenue)],
                          ["Beverage sales", fmtUGX(shiftMetrics.totalBeverageRevenue)],
                          ["VAT", fmtUGX(shiftMetrics.totalVat)],
                          ["Orders settled", String(shiftMetrics.totalOrders)],
                          ["Covers", String(shiftMetrics.totalCovers)],
                          ["Cash & card (direct)", fmtUGX(shiftMetrics.totalDirectPayments)],
                          ["Room charge posted", fmtUGX(shiftMetrics.totalRoomCharges)],
                          ["Service charge", fmtUGX(shiftMetrics.totalServiceCharge)],
                          ["Comps", fmtUGX(shiftMetrics.totalComps)],
                        ].map(([k, v]) => (
                          <tr key={k} className="border-b border-border/40 last:border-0">
                            <td className="px-3 py-2 text-muted-foreground">{k}</td>
                            <td className="px-3 py-2 text-right font-medium">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Counted Cash in Drawer</label>
                  <input
                    type="number"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 0 for a fully cashless shift"
                    className="w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                  />
                </div>
                <div className="mt-4 rounded-xl border border-border/40 bg-muted/30 p-3 text-xs text-muted-foreground">
                  Expected cash (float + cash sales): <span className="font-semibold text-foreground">{fmtUGX((shiftMetrics?.expectedCash ?? 0))}</span>.
                  Variance is computed automatically on close.
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={() => setShiftOpen(false)} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Close</button>
                  <button
                    onClick={closeAndReconcile}
                    disabled={Number(countedCash) <= 0}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    Close Shift &amp; Reconcile
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Opening a new shift */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Opening Float (cash)</label>
                  <input
                    type="number"
                    value={shiftFloat}
                    onChange={(e) => setShiftFloat(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                  />
                </div>
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Shift history (last {closedShifts.length})</p>
                  {closedShifts.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50">No closed shifts yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {closedShifts.map((p) => {
                        const m = posServicePeriodMetrics(p.id);
                        return (
                          <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-3 py-2 text-xs">
                            <span>Opened {p.openedBy} · {fmtUGX(p.openingFloat ?? 0)} float</span>
                            <span className={cn((m?.cashVariance ?? 0) === 0 ? "text-emerald-400" : "text-amber-400")}>
                              Ø {fmtUGX(m?.cashVariance ?? 0)} variance
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={() => setShiftOpen(false)} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Close</button>
                  <button
                    onClick={openShift}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Open Shift
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* KOT/BOT Ticket Tray */}
      {kotTrayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setKotTrayOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold">KOT / BOT Tickets</h3>
              <button onClick={() => setKotTrayOpen(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {activeKots.length === 0 && <p className="text-sm text-muted-foreground">No tickets for this tab yet.</p>}
              {activeKots.map((kot) => {
                const itemCount = kotItemsByKot(kot.id).length;
                return (
                  <div key={kot.id} className="rounded-xl border border-border/50 bg-background/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", kot.stationType === "bar" ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600")}>
                          {STATION_LABELS[kot.stationType]}
                        </span>
                        <span className="text-sm font-semibold">{kot.id}</span>
                      </div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", kot.status === "voided" ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary")}>
                        {kot.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {itemCount} line{itemCount !== 1 ? "s" : ""} · printed {kot.printCount ?? 0}× ·{" "}
                      {new Date(kot.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {/* Line status updater (kitchen prep / ready) */}
                    <div className="mt-3 space-y-1.5">
                      {kotItemsByKot(kot.id).map((li) => {
                        const menuItem = allStoreItems.find((m) => m.id === li.menuItemId);
                        return (
                          <div key={li.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/20 px-2 py-1">
                            <span className="truncate text-xs">
                              {menuItem?.name ?? li.menuItemId}
                              <span className="text-muted-foreground/60"> ×{li.quantity}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1">
                              {(["pending", "in_preparation", "ready"] as const).map((st) => (
                                <button
                                  key={st}
                                  onClick={() => li.status !== "voided" && setKotItemStatus(li.id, st)}
                                  disabled={li.status === "voided"}
                                  className={cn(
                                    "rounded-md px-1.5 py-0.5 text-[10px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
                                    li.status === st
                                      ? st === "ready"
                                        ? "bg-emerald-500/20 text-emerald-600"
                                        : st === "in_preparation"
                                          ? "bg-amber-500/20 text-amber-600"
                                          : "bg-primary/15 text-primary"
                                      : "text-muted-foreground/70 hover:text-foreground",
                                  )}
                                >
                                  {st === "in_preparation" ? "Prep" : st === "ready" ? "Ready" : "Pending"}
                                </button>
                              ))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setKotPreviewId(kot.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium hover:bg-accent">
                        <Ticket className="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        onClick={() => handlePrintKot(kot.id)}
                        disabled={kot.status === "voided"}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-40"
                      >
                        <Printer className="h-3.5 w-3.5" /> Print / Reprint
                      </button>
                      <button
                        onClick={() => handleVoidKotTicket(kot.id)}
                        disabled={kot.status === "voided"}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Void
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* KOT/BOT Ticket Preview */}
      {kotPreviewId && (() => {
        const ticket = buildKotTicketData(kotPreviewId);
        const kot = activeKots.find((k) => k.id === kotPreviewId);
        if (!ticket || !kot) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setKotPreviewId(null)}>
            <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold">Ticket Preview</h3>
                <button onClick={() => setKotPreviewId(null)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-4">
                <div className="text-center">
                  <span className={cn("inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", kot.stationType === "bar" ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600")}>
                    {ticket.stationLabel} · {ticket.station.toUpperCase()}
                  </span>
                  <p className="mt-2 font-display text-base font-bold">{ticket.outletName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {ticket.orderType}
                    {ticket.table ? ` · Table ${ticket.table}` : ""}
                    {ticket.coverCount ? ` · ${ticket.coverCount} covers` : ""}
                    {ticket.deliveryName ? ` · ${ticket.deliveryName}` : ""}
                  </p>
                </div>
                <div className="mt-3 space-y-2 border-t border-dashed border-border/70 pt-3">
                  {ticket.orderItems.map((line, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">{line.qty} × {line.name}</span>
                        {line.courseLabel && <span className="shrink-0 text-[10px] uppercase text-muted-foreground">{line.courseLabel}</span>}
                      </div>
                      {line.modifiers.length > 0 && <p className="text-[11px] text-muted-foreground">{line.modifiers.map((m) => `· ${m}`).join(" ")}</p>}
                      {line.specialNotes && <p className="text-[11px] italic text-muted-foreground">✎ {line.specialNotes}</p>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => handlePrintKot(kot.id)} className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  <Printer className="mr-1 inline-block h-4 w-4 -mt-0.5" /> {kot.printCount ? "Reprint" : "Print"} ({kot.printCount ?? 0})
                </button>
                <button
                  onClick={() => handleVoidKotTicket(kot.id)}
                  disabled={kot.status === "voided"}
                  className="flex-1 rounded-xl border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-40"
                >
                  <Trash2 className="mr-1 inline-block h-4 w-4 -mt-0.5" /> Void
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reserve Table Modal */}
      {reserveFor && (() => {
        const reservedTable = activeTables.find((t) => t.id === reserveFor);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setReserveFor(null)}>
            <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg font-bold">Reserve {reservedTable?.tableName ?? ""}</h3>
                <button onClick={() => setReserveFor(null)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Reserved until</label>
                <input
                  type="datetime-local"
                  value={reserveUntil}
                  onChange={(e) => setReserveUntil(e.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setReserveFor(null)} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
                <button
                  onClick={() => {
                    if (reserveUntil) {
                      setPosTableReservation(reserveFor, new Date(reserveUntil).toISOString());
                      toast.success(`${reservedTable?.tableName ?? "Table"} reserved`);
                    }
                    setReserveFor(null);
                  }}
                  disabled={!reserveUntil}
                  className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <Check className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                  Save
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Split Tab Modal */}
      {showSplitModal && activeTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSplitModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold">Split Tab</h3>
              <button onClick={() => setShowSplitModal(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Split mode selector */}
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    ["items", "By Item"],
                    ["even", "Evenly"],
                    ["seat", "By Seat"],
                    ["amount", "By Amount"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setSplitMode(mode)}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                      splitMode === mode ? "border-primary/50 bg-primary/15 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {splitMode === "items" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Move items to new tab</label>
                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border/40 p-2">
                    {unvoidedItems.map((i) => {
                      const menuItem = allStoreItems.find((m) => m.id === i.menuItemId);
                      const checked = splitSelected.includes(i.id);
                      return (
                        <label key={i.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/40">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSplitSelected((prev) => (checked ? prev.filter((x) => x !== i.id) : [...prev, i.id]))
                            }
                            className="h-4 w-4 rounded border-border"
                          />
                          <span className="flex-1 truncate">{menuItem?.name ?? i.menuItemId}</span>
                          <span className="text-xs text-muted-foreground">×{i.quantity}</span>
                        </label>
                      );
                    })}
                    {unvoidedItems.length === 0 && <p className="px-2 py-2 text-xs text-muted-foreground">No items to split</p>}
                  </div>
                </div>
              )}

              {splitMode === "even" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Number of parts</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={2}
                      max={10}
                      value={splitParts}
                      onChange={(e) => setSplitParts(Math.max(2, Math.min(10, Number(e.target.value))))}
                      className="w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                    />
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      ~{fmtUGX(Math.round((activeTab?.totalAmount ?? 0) / Math.max(1, splitParts)))} each
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Items are distributed to balance each bill. Each part becomes its own tab, each with its own EFRIS receipt on payment.
                  </p>
                </div>
              )}

              {splitMode === "seat" && (
                <div>
                  <p className="text-sm">One new tab per seat number used on this bill.</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {unvoidedItems.some((i) => i.seatNumber && i.seatNumber > 0)
                      ? `${new Set(unvoidedItems.filter((i) => i.seatNumber && i.seatNumber > 0).map((i) => i.seatNumber)).size} seat(s) will be split out.`
                      : "No items have seat numbers — assign seats from the item row (seat icon) first."}
                  </p>
                </div>
              )}

              {splitMode === "amount" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Split amounts (sum ≤ {fmtUGX(activeTab?.totalAmount ?? 0)})
                  </label>
                  <div className="space-y-2">
                    {splitAmounts.map((amt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 text-xs text-muted-foreground">#{idx + 1}</span>
                        <input
                          type="number"
                          min={0}
                          value={amt}
                          onChange={(e) => {
                            const next = [...splitAmounts];
                            next[idx] = Number(e.target.value);
                            setSplitAmounts(next);
                          }}
                          className="w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/50"
                        />
                        <button
                          onClick={() => setSplitAmounts((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={splitAmounts.length <= 2}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border/40 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Remove"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setSplitAmounts((prev) => [...prev, 0])}
                    className="mt-2 text-xs font-medium text-primary hover:underline"
                  >
                    + Add amount
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Destination table</label>
                  <select
                    value={splitDestTable}
                    onChange={(e) => setSplitDestTable(e.target.value)}
                    className="w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                  >
                    <option value="">Same table</option>
                    {activeTables
                      .filter((t) => t.posOutletId === activeTab.posOutletId && posTableStatus(t.id) === "free" && t.id !== activeTab.posTableId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>{t.tableName}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Covers</label>
                  <input
                    type="number"
                    min={1}
                    value={splitCover}
                    onChange={(e) => setSplitCover(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowSplitModal(false)} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
              <button
                onClick={() => {
                  const opts = {
                    posOutletId: activeTab.posOutletId,
                    posTableId: splitDestTable || undefined,
                    orderType: activeTab.orderType,
                    coverCount: splitCover,
                  };
                  let ok = false;
                  let msg = "";
                  let newId: string | undefined;
                  if (splitMode === "items") {
                    newId = splitPosTab(activeTab.id, splitSelected, opts);
                    ok = !!newId;
                    msg = `Split ${splitSelected.length} item${splitSelected.length !== 1 ? "s" : ""} to a new tab`;
                  } else if (splitMode === "even") {
                    const r = splitPosTabEvenly(activeTab.id, splitParts, opts);
                    ok = r.ok;
                    msg = r.ok ? `Split evenly into ${r.tabIds.length} tab${r.tabIds.length !== 1 ? "s" : ""}` : (r.errors ?? ["Split failed"]).join(" ");
                    newId = r.tabIds[0];
                  } else if (splitMode === "seat") {
                    const r = splitPosTabBySeat(activeTab.id, opts);
                    ok = r.ok;
                    msg = r.ok ? `Split into ${r.tabIds.length} seat tab${r.tabIds.length !== 1 ? "s" : ""}` : (r.errors ?? ["Split failed"]).join(" ");
                    newId = r.tabIds[0];
                  } else {
                    const r = splitPosTabByAmount(activeTab.id, splitAmounts, opts);
                    ok = r.ok;
                    msg = r.ok ? `Split by amount into ${r.tabIds.length} tab${r.tabIds.length !== 1 ? "s" : ""}` : (r.errors ?? ["Split failed"]).join(" ");
                    newId = r.tabIds[0];
                  }
                  if (ok && newId) selectTab(newId);
                  if (ok) toast.success(msg);
                  else toast.error(msg || "Nothing to split");
                  setShowSplitModal(false);
                }}
                disabled={
                  splitMode === "items"
                    ? splitSelected.length === 0
                    : splitMode === "amount"
                      ? splitAmounts.filter((a) => a > 0).length < 2
                      : false
                }
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Split className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                Split Tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Tab Modal */}
      {showMergeModal && activeTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowMergeModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold">Merge into Current Tab</h3>
              <button onClick={() => setShowMergeModal(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Move all items from another open tab into <span className="font-medium text-foreground">{tableLabel(activeTab.posTableId) || "current tab"}</span>.
            </p>
            <div className="mt-4 space-y-2">
              {otherOpenTabs.map((t) => {
                const qty = posTabItemsByTab(t.id).filter((i) => !i.isVoided).reduce((s, i) => s + i.quantity, 0);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      const res = mergePosTabs(activeTab.id, t.id, cashierName);
                      if (res.ok) {
                        toast.success(`Merged ${tableLabel(t.posTableId) || "tab"} into current tab`);
                      } else {
                        toast.error(res.errors?.join(", ") ?? "Merge failed");
                      }
                      setShowMergeModal(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-card/40 px-4 py-3 text-sm transition hover:border-primary/40"
                  >
                    <span>{tableLabel(t.posTableId) || `Tab ${t.id.slice(-4)}`}</span>
                    <span className="text-xs text-muted-foreground">{qty} items</span>
                  </button>
                );
              })}
              {otherOpenTabs.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No other open tabs to merge</p>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowMergeModal(false)} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modifier Selection Modal */}
      {showModifierModal && modifierTarget && (() => {        const mods = modifiersForMenuItem(modifierTarget);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModifierModal(false)}>
            <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg font-bold">{modifierTarget.name}</h3>
                <button onClick={() => setShowModifierModal(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-5">
                {mods.length > 0 && (
                  <div className="space-y-4">
                    {mods.map((mod) => (
                  <div key={mod.id}>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      {mod.name} {mod.isRequired && <span className="text-destructive">*</span>}
                    </label>
                    <div className="space-y-1.5">
                      {mod.options.map((opt) => (
                        <label
                          key={opt.name}
                          className={cn(
                            "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition",
                            modifierSelections[mod.id] === opt.name
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-border/50 bg-background/30 hover:border-primary/30",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={mod.id}
                              checked={modifierSelections[mod.id] === opt.name}
                              onChange={() => setModifierSelections((prev) => ({ ...prev, [mod.id]: opt.name }))}
                              className="h-4 w-4 accent-primary"
                            />
                            <span>{opt.name}</span>
                          </div>
                          {opt.priceDelta !== 0 && (
                            <span className={cn("text-xs tabular-nums", opt.priceDelta > 0 ? "text-amber-600" : "text-emerald-600")}>
                              {opt.priceDelta > 0 ? "+" : ""}{opt.priceDelta.toLocaleString()}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                  </div>
                )}
                {/* Course sequencing */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Course</label>
                  <div className="flex gap-2">
                    {COURSES.filter((c) => c.number !== 0).map((c) => (
                      <button
                        key={c.number}
                        onClick={() => setItemCourse(c.number)}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition",
                          itemCourse === c.number
                            ? "border-primary/50 bg-primary/10 text-primary font-medium"
                            : "border-border/50 bg-background/30 text-muted-foreground hover:border-primary/30",
                        )}
                      >
                        <c.icon className="h-3.5 w-3.5" />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Free-text instructions */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Notes / Instructions</label>
                  <div className="relative">
                    <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <textarea
                      value={itemNote}
                      onChange={(e) => setItemNote(e.target.value)}
                      rows={2}
                      placeholder="e.g. no onions, extra sauce, allergies…"
                      className="w-full resize-none rounded-xl border border-border/50 bg-background/40 py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowModifierModal(false)} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
                <button onClick={handleModifierConfirm} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
                  Add to Tab
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Settle Dialog */}
      {showSettle && activeTab && (
        <PosSettleDialog
          tabId={activeTab.id}
          outletId={activeTab.posOutletId}
          items={tabItems}
          itemNames={itemNames}
          subtotal={subtotal}
          serviceChargeAmount={serviceChargeAmount}
          vatAmount={tax}
          discount={discount}
          total={total}
          cashierName={cashierName}
          onClose={() => setShowSettle(false)}
          onSettled={() => {
            setShowSettle(false);
            setActiveTabId(null);
            toast.success("Tab settled successfully");
          }}
        />
      )}

      {/* Comp Item Modal */}
      {showCompModal && compItemId && activeTab && (() => {
        const compEntry = tabItems.find((i) => i.id === compItemId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCompModal(false)}>
            <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Complimentary Item</h3>
                <button onClick={() => setShowCompModal(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Guest billed zero for <strong>{allStoreItems.find((m) => m.id === compEntry?.menuItemId)?.name ?? "item"}</strong> ×{compEntry?.quantity}
              </p>
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
                <ShieldAlert className="mr-1 inline h-3.5 w-3.5 -mt-0.5" />Manager approval required for complimentary items.
              </div>
              <label className="mt-4 block text-sm font-medium">Reason</label>
              <textarea
                value={compReason}
                onChange={(e) => setCompReason(e.target.value)}
                placeholder="e.g. Repeat guest, service recovery…"
                className="mt-1.5 w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50 min-h-[70px] resize-none"
              />
              <label className="mt-4 block text-sm font-medium">Approving Manager</label>
              <select
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
              >
                <option value="">Select manager…</option>
                {approvers.map((a) => (
                  <option key={a.id} value={a.fullName}>{a.fullName}</option>
                ))}
              </select>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowCompModal(false)} className="flex-1 rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
                <button onClick={confirmComp} disabled={!approver} className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  Approve &amp; Comp
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Discount Modal */}
      {showDiscountModal && activeTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDiscountModal(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Apply Discount</h3>
              <button onClick={() => setShowDiscountModal(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex gap-1.5">
              {(["amount", "percent"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setDiscountType(t); setDiscountValue(""); }}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition",
                    discountType === t ? "border-primary/50 bg-primary/15 text-primary" : "border-border/50 text-muted-foreground",
                  )}
                >
                  {t === "amount" ? "Amount (UGX)" : "Percent (%)"}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm font-medium">{discountType === "amount" ? "Discount amount" : "Discount percent"}</label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
              min={0}
              placeholder={discountType === "amount" ? "UGX" : "% of subtotal"}
              className="mt-1.5 w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
              autoFocus
            />
            {discountType === "percent" && discountValue !== "" && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                = UGX {Math.round(subtotal * (Number(discountValue) || 0) / 100).toLocaleString()}
              </p>
            )}
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
              <ShieldAlert className="mr-1 inline h-3.5 w-3.5 -mt-0.5" />Manager approval required for discounts.
            </div>
            <label className="mt-4 block text-sm font-medium">Reason</label>
            <input
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="e.g. Repeat guest, negotiation…"
              className="mt-1.5 w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
            />
            <label className="mt-4 block text-sm font-medium">Approving Manager</label>
            <select
              value={approver}
              onChange={(e) => setApprover(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
            >
              <option value="">Select manager…</option>
              {approvers.map((a) => (
                <option key={a.id} value={a.fullName}>{a.fullName}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowDiscountModal(false)} className="flex-1 rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
              <button onClick={applyDiscount} disabled={!discountValue || !approver} className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Reason Modal */}
      {showVoidModal && voidTargetItem && (() => {
        const needsApproval = posVoidNeedsApproval(voidTargetItem);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowVoidModal(false)}>
            <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {!showApprovalStep ? (
                <>
                  <h3 className="font-bold text-lg">Void Item</h3>
                  <p className="text-sm text-muted-foreground mt-1">Why is this item being voided?</p>
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-border/40 bg-background/30 px-3 py-2 text-sm">
                    <span>{allStoreItems.find((m) => m.id === voidTargetItem.menuItemId)?.name ?? voidTargetItem.menuItemId} ×{voidTargetItem.quantity}</span>
                    <span className="font-semibold tabular-nums">{(voidTargetItem.unitPrice * voidTargetItem.quantity).toLocaleString()}</span>
                  </div>
                  <textarea
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="e.g. Customer changed mind, wrong item..."
                    className="mt-3 w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50 min-h-[80px] resize-none"
                    autoFocus
                  />
                  {needsApproval && (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
                      <ShieldAlert className="mr-1 inline h-3.5 w-3.5 -mt-0.5" />
                      Manager approval required{voidTargetItem.sentToKot ? " (item already sent to kitchen)" : ` (amount ≥ ${POS_VOID_APPROVAL_THRESHOLD.toLocaleString()})`}
                    </div>
                  )}
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => setShowVoidModal(false)} className="flex-1 rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Cancel</button>
                    <button
                      onClick={confirmVoid}
                      disabled={!voidReason.trim()}
                      className={cn("flex-1 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50", needsApproval && "border border-amber-500/50")}
                    >
                      {needsApproval ? "Continue to Approval" : "Void"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Manager Approval</h3>
                    <button onClick={() => setShowVoidModal(false)} className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground/60 hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 rounded-xl border border-border/40 bg-background/30 p-3 text-sm">
                    <div className="flex justify-between">
                      <span>{allStoreItems.find((m) => m.id === voidTargetItem.menuItemId)?.name ?? voidTargetItem.menuItemId}</span>
                      <span className="font-semibold tabular-nums">{(voidTargetItem.unitPrice * voidTargetItem.quantity).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Reason: {voidReason}</p>
                    {voidTargetItem.sentToKot && <p className="mt-1 text-[11px] text-amber-600">Item already printed to kitchen — void will flag the KOT line.</p>}
                  </div>
                  <label className="mt-4 block text-sm font-medium">Approving Manager</label>
                  <select
                    value={voidApprover}
                    onChange={(e) => setVoidApprover(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/50"
                  >
                    <option value="">Select manager…</option>
                    {approvers.map((a) => (
                      <option key={a.id} value={a.fullName}>{a.fullName}</option>
                    ))}
                  </select>
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => setShowApprovalStep(false)} className="flex-1 rounded-xl border border-border/50 px-4 py-2 text-sm font-medium">Back</button>
                    <button
                      onClick={confirmVoid}
                      disabled={!voidApprover}
                      className="flex-1 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
                    >
                      Approve &amp; Void
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}

/* ============================================================
   POS Analytics — modern visual graphs for the cashier screen
   ============================================================ */

const posHourlyData = [
  { hour: "08", sales: 0 },
  { hour: "09", sales: 45000 },
  { hour: "10", sales: 120000 },
  { hour: "11", sales: 185000 },
  { hour: "12", sales: 320000 },
  { hour: "13", sales: 280000 },
  { hour: "14", sales: 195000 },
  { hour: "15", sales: 160000 },
  { hour: "16", sales: 240000 },
  { hour: "17", sales: 310000 },
  { hour: "18", sales: 420000 },
  { hour: "19", sales: 380000 },
  { hour: "20", sales: 260000 },
  { hour: "21", sales: 140000 },
  { hour: "22", sales: 35000 },
];

const posCategoryData = [
  { name: "Soft Drinks", value: 445000, color: "var(--color-chart-1)" },
  { name: "Spirits", value: 280000, color: "var(--color-chart-2)" },
  { name: "Food", value: 215000, color: "var(--color-chart-3)" },
  { name: "Snacks", value: 125000, color: "var(--color-chart-5)" },
];

const posPaymentData = [
  { name: "Cash", value: 685000, color: "var(--color-success)" },
  { name: "Card", value: 425000, color: "var(--color-primary)" },
  { name: "Mobile", value: 145000, color: "var(--color-info)" },
  { name: "Credit", value: 85000, color: "var(--color-warning)" },
];

const posTopItems = [
  { name: "Coca Cola", qty: 32, revenue: 160000 },
  { name: "Grilled Chicken", qty: 24, revenue: 600000 },
  { name: "French Fries", qty: 20, revenue: 160000 },
  { name: "Johnnie Walker Red", qty: 17, revenue: 595000 },
  { name: "Fanta Orange", qty: 15, revenue: 75000 },
];

const totalSales = posHourlyData.reduce((s, d) => s + d.sales, 0);
const totalOrders = 47;
const totalItems = posTopItems.reduce((s, d) => s + d.qty, 0);

function POSAnalytics() {
  const fmt = (n: number) => "UGX " + n.toLocaleString();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Today's Revenue</p>
              <p className="mt-0.5 font-display text-xl font-bold tracking-tight text-gradient-primary">{fmt(totalSales)}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{totalOrders} orders</span>
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-chart-2" />{totalItems} items</span>
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-chart-3" />+18% vs yesterday</span>
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3.5">
          <div className="mb-2 flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-primary" /><span className="text-xs font-semibold">Hourly Sales</span></div>
          <HourlySalesChart data={posHourlyData} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 bg-card p-3.5">
            <div className="mb-1 flex items-center gap-2"><PieChart className="h-3.5 w-3.5 text-chart-1" /><span className="text-xs font-semibold">Categories</span></div>
            <CategoryPieChart data={posCategoryData} />
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-3.5">
            <div className="mb-1 flex items-center gap-2"><CreditCard className="h-3.5 w-3.5 text-success" /><span className="text-xs font-semibold">Payments</span></div>
            <PaymentPieChart data={posPaymentData} />
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3.5">
          <div className="mb-2 flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5 text-chart-2" /><span className="text-xs font-semibold">Top Items</span></div>
          <TopItemsChart data={posTopItems} />
        </div>
        <div className="pb-2 text-center text-[10px] text-muted-foreground/60">Live data · auto-refreshes every 30s</div>
      </div>
    </div>
  );
}

/* ---------- Charts ---------- */

const hourlyChartConfig = { sales: { label: "Sales", color: "var(--color-primary)" } } satisfies ChartConfig;

function HourlySalesChart({ data }: { data: typeof posHourlyData }) {
  return (
    <ChartContainer config={hourlyChartConfig} className="h-24 w-full [&_.recharts-surface]:!h-full">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: -4 }}>
        <defs><linearGradient id="posSalesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
        <XAxis dataKey="hour" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 9 }} interval={1} />
        <YAxis hide domain={[0, "dataMax + 50000"]} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" className="rounded-lg text-xs" formatter={(v) => "UGX " + (v ?? 0).toLocaleString()} />} />
        <Area type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={2} fill="url(#posSalesFill)" dot={false} activeDot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }} />
      </AreaChart>
    </ChartContainer>
  );
}

function CategoryPieChart({ data }: { data: typeof posCategoryData }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center">
      <ChartContainer config={{ value: { label: "Value" } }} className="h-24 w-24">
        <RechartPie>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={24} outerRadius={38} strokeWidth={0} cornerRadius={3} paddingAngle={2}>
            {data.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent className="rounded-lg text-xs" formatter={(v) => "UGX " + (v ?? 0).toLocaleString()} />} />
        </RechartPie>
      </ChartContainer>
      <div className="mt-1.5 w-full space-y-1">{data.map((d) => (<div key={d.name} className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />{d.name}</span><span className="font-medium tabular-nums">{Math.round((d.value / total) * 100)}%</span></div>))}</div>
    </div>
  );
}

function PaymentPieChart({ data }: { data: typeof posPaymentData }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center">
      <ChartContainer config={{ value: { label: "Value" } }} className="h-24 w-24">
        <RechartPie>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={24} outerRadius={38} strokeWidth={0} cornerRadius={3} paddingAngle={2}>
            {data.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent className="rounded-lg text-xs" formatter={(v) => "UGX " + (v ?? 0).toLocaleString()} />} />
        </RechartPie>
      </ChartContainer>
      <div className="mt-1.5 w-full space-y-1">{data.map((d) => (<div key={d.name} className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />{d.name}</span><span className="font-medium tabular-nums">{Math.round((d.value / total) * 100)}%</span></div>))}</div>
    </div>
  );
}

const topItemsConfig = { qty: { label: "Qty", color: "var(--color-chart-2)" } } satisfies ChartConfig;

function TopItemsChart({ data }: { data: typeof posTopItems }) {
  const maxQty = Math.max(...data.map((d) => d.qty));
  return (
    <ChartContainer config={topItemsConfig} className="h-32 w-full">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barSize={16}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/30" />
        <XAxis type="number" hide domain={[0, maxQty + 8]} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} className="text-muted-foreground" tick={{ fontSize: 10 }} width={90} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent className="rounded-lg text-xs" formatter={(v, name) => name === "qty" ? `${v ?? 0} sold` : "UGX " + (v ?? 0).toLocaleString()} />} />
        <Bar dataKey="qty" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]}>
          <LabelList dataKey="qty" position="right" className="fill-foreground" fontSize={10} fontWeight={600} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export default POSPage;
