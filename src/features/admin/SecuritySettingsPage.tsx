import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useStore,
  updateLockoutSettings,
  updatePaymentMethodConfig,
  updateCurrencyConfig,
  updateMealPlanConfig,
  updateIdTypeConfig,
  updateRoomTypeFilterConfig,
  ALL_PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  CURRENCY_OPTIONS,
  MEAL_PLAN_IDS,
  MEAL_PLAN_LABELS,
  MEAL_PLAN_DESCRIPTIONS,
  type LockoutSettings,
  type PaymentMethod,
  type CurrencyConfig,
  type MealPlanConfig,
  type IdTypeConfig,
  type RoomTypeFilterConfig,
} from "@/lib/pms-store";
import { Switch } from "@/components/ui/switch";
import {
  Shield,
  ShieldOff,
  Save,
  Settings,
  CreditCard,
  Wallet,
  Smartphone,
  Building2,
  Home,
  DollarSign,
  Utensils,
  Plus,
  Trash2,
  IdCard,
} from "lucide-react";

const METHOD_ICONS: Record<PaymentMethod, typeof CreditCard> = {
  cash: Wallet,
  card: CreditCard,
  mtn_momo: Smartphone,
  airtel_money: Smartphone,
  bank_transfer: Building2,
  charge_to_room: Home,
};

const METHOD_DESCRIPTIONS: Record<PaymentMethod, string> = {
  cash: "Accept cash payments at the point of sale",
  card: "Accept credit and debit card payments",
  mtn_momo: "Accept MTN Mobile Money payments",
  airtel_money: "Accept Airtel Money payments",
  bank_transfer: "Accept bank transfer payments",
  charge_to_room: "Post payments directly to the guest room folio",
};

export default function SecuritySettingsPage() {
  const lockoutSettings = useStore((s) => s.lockoutSettings);
  const pmConfig = useStore((s) => s.paymentMethodConfig);
  const currencyConfig = useStore((s) => s.currencyConfig);
  const mealPlanConfig = useStore((s) => s.mealPlanConfig);
  const [lockoutForm, setLockoutForm] = useState<LockoutSettings>(lockoutSettings);
  const [enabledMethods, setEnabledMethods] = useState<PaymentMethod[]>(pmConfig.enabledMethods);
  const [currencyForm, setCurrencyForm] = useState<CurrencyConfig>(currencyConfig);
  const [mealPlanForm, setMealPlanForm] = useState<MealPlanConfig>(mealPlanConfig);
  const idTypeConfig = useStore((s) => s.idTypeConfig);
  const [idTypeForm, setIdTypeForm] = useState<IdTypeConfig>(idTypeConfig);
  const roomTypeFilterConfig = useStore((s) => s.roomTypeFilterConfig);
  const [roomTypeFilterForm, setRoomTypeFilterForm] = useState<RoomTypeFilterConfig>(roomTypeFilterConfig);

  useEffect(() => {
    setLockoutForm(lockoutSettings);
  }, [lockoutSettings]);

  useEffect(() => {
    setEnabledMethods(pmConfig.enabledMethods);
  }, [pmConfig.enabledMethods]);

  useEffect(() => {
    setCurrencyForm(currencyConfig);
  }, [currencyConfig]);

  useEffect(() => {
    setMealPlanForm(mealPlanConfig);
  }, [mealPlanConfig]);

  useEffect(() => {
    setIdTypeForm(idTypeConfig);
  }, [idTypeConfig]);

  useEffect(() => {
    setRoomTypeFilterForm(roomTypeFilterConfig);
  }, [roomTypeFilterConfig]);

  const toggleMethod = (method: PaymentMethod) => {
    setEnabledMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  };

  const setMealPrice = (id: string, value: string) => {
    const num = parseInt(value.replace(/,/g, "")) || 0;
    setMealPlanForm((prev) => ({ prices: { ...prev.prices, [id]: num } }));
  };

  const handleSaveSecurity = () => {
    updateLockoutSettings(lockoutForm);
    toast.success("Security settings saved");
  };

  const handleSavePayments = () => {
    updatePaymentMethodConfig({ enabledMethods });
    toast.success("Payment methods updated");
  };

  const handleSaveCurrency = () => {
    updateCurrencyConfig(currencyForm);
    toast.success("Currency preference saved");
  };

  const handleSaveMealPlans = () => {
    updateMealPlanConfig(mealPlanForm);
    toast.success("Meal plan pricing saved");
  };

  const addIdType = () => {
    setIdTypeForm((prev) => ({ types: [...prev.types, ""] }));
  };

  const removeIdType = (index: number) => {
    setIdTypeForm((prev) => ({ types: prev.types.filter((_, i) => i !== index) }));
  };

  const setIdType = (index: number, value: string) => {
    setIdTypeForm((prev) => {
      const types = [...prev.types];
      types[index] = value;
      return { types };
    });
  };

  const handleSaveIdTypes = () => {
    const filtered = idTypeForm.types.map((t) => t.trim()).filter(Boolean);
    if (filtered.length === 0) {
      toast.error("At least one ID type is required");
      return;
    }
    updateIdTypeConfig({ types: filtered });
    toast.success("ID type list updated");
  };

  const addRoomTypeFilter = () => {
    setRoomTypeFilterForm((prev) => ({ types: [...prev.types, ""] }));
  };

  const removeRoomTypeFilter = (index: number) => {
    setRoomTypeFilterForm((prev) => ({ types: prev.types.filter((_, i) => i !== index) }));
  };

  const setRoomTypeFilter = (index: number, value: string) => {
    setRoomTypeFilterForm((prev) => {
      const types = [...prev.types];
      types[index] = value;
      return { types };
    });
  };

  const handleSaveRoomTypeFilters = () => {
    const filtered = roomTypeFilterForm.types.map((t) => t.trim()).filter(Boolean);
    if (filtered.length === 0) {
      toast.error("At least one room type filter is required");
      return;
    }
    updateRoomTypeFilterConfig({ types: filtered });
    toast.success("Room type filters updated");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-24">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure system preferences, payment methods, and security rules
          </p>
        </div>
      </div>

      {/* Currency */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600" />
          <h2 className="font-display text-xl font-semibold tracking-tight">System Preferences</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="divide-y divide-border/40">
            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div className="flex items-start gap-3">
                <DollarSign className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Default Currency</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sets the currency for all financial displays across the system
                  </p>
                </div>
              </div>
              <select
                value={currencyForm.code}
                onChange={(e) => setCurrencyForm({ code: e.target.value })}
                className="w-44 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSaveCurrency}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            Save preferences
          </button>
        </div>
      </div>

      {/* Meal Plan Pricing */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Utensils className="h-5 w-5 text-orange-600" />
          <h2 className="font-display text-xl font-semibold tracking-tight">Meal Plan Pricing</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="divide-y divide-border/40">
            {MEAL_PLAN_IDS.map((id) => (
              <div key={id} className="flex items-center justify-between gap-4 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    {id}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{MEAL_PLAN_LABELS[id]}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{MEAL_PLAN_DESCRIPTIONS[id]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{currencyForm.code}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={mealPlanForm.prices[id]?.toLocaleString() ?? "0"}
                    onChange={(e) => setMealPrice(id, e.target.value)}
                    className="w-28 rounded-xl border border-border bg-background px-3 py-2 text-right text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-xs text-muted-foreground">/night</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSaveMealPlans}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            Save meal plan pricing
          </button>
        </div>
      </div>

      {/* ID Type List */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <IdCard className="h-5 w-5 text-violet-600" />
          <h2 className="font-display text-xl font-semibold tracking-tight">ID Type List</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="divide-y divide-border/40">
            {idTypeForm.types.map((type, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-6 py-4">
                <div className="flex items-center gap-3 flex-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => setIdType(i, e.target.value)}
                    placeholder="Enter ID type name"
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  onClick={() => removeIdType(i)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-border/40 px-6 py-3">
            <button
              onClick={addIdType}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:text-primary/80"
            >
              <Plus className="h-4 w-4" />
              Add ID type
            </button>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSaveIdTypes}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            Save ID types
          </button>
        </div>
      </div>

      {/* Room Type Filter */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">T</span>
          <h2 className="font-display text-xl font-semibold tracking-tight">Room Type Filters</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="divide-y divide-border/40">
            {roomTypeFilterForm.types.map((type, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-6 py-4">
                <div className="flex items-center gap-3 flex-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => setRoomTypeFilter(i, e.target.value)}
                    placeholder="Enter room type name"
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  onClick={() => removeRoomTypeFilter(i)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-border/40 px-6 py-3">
            <button
              onClick={addRoomTypeFilter}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:text-primary/80"
            >
              <Plus className="h-4 w-4" />
              Add room type filter
            </button>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSaveRoomTypeFilters}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            Save room type filters
          </button>
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-emerald-600" />
          <h2 className="font-display text-xl font-semibold tracking-tight">Payment Methods</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="divide-y divide-border/40">
            {ALL_PAYMENT_METHODS.map((method) => {
              const Icon = METHOD_ICONS[method];
              const isChecked = enabledMethods.includes(method);
              return (
                <div
                  key={method}
                  className="flex items-center justify-between gap-4 px-6 py-5"
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className={`mt-0.5 h-5 w-5 ${
                        isChecked ? "text-emerald-600" : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {PAYMENT_METHOD_LABEL[method]}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {METHOD_DESCRIPTIONS[method]}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isChecked}
                    onCheckedChange={() => toggleMethod(method)}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSavePayments}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            Save payment methods
          </button>
        </div>
      </div>

      {/* Security */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-rose-600" />
          <h2 className="font-display text-xl font-semibold tracking-tight">Security</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="divide-y divide-border/40">
            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div className="flex items-start gap-3">
                {lockoutSettings.enabled ? (
                  <Shield className="mt-0.5 h-5 w-5 text-success" />
                ) : (
                  <ShieldOff className="mt-0.5 h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">Enable login lockout</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lock user accounts after a configurable number of failed login attempts
                  </p>
                </div>
              </div>
              <Switch
                checked={lockoutForm.enabled}
                onCheckedChange={(checked) => setLockoutForm((s) => ({ ...s, enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Max failed attempts</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Number of failed attempts before the account is locked
                </p>
              </div>
              <input
                type="number"
                min={1}
                max={20}
                value={lockoutForm.maxAttempts}
                onChange={(e) => setLockoutForm((s) => ({ ...s, maxAttempts: parseInt(e.target.value) || 1 }))}
                className={cn(
                  "w-20 rounded-xl border border-border bg-background px-3 py-2 text-center text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
                  !lockoutForm.enabled && "opacity-50"
                )}
                disabled={!lockoutForm.enabled}
              />
            </div>

            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Lockout duration</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  How long the account remains locked (in minutes)
                </p>
              </div>
              <input
                type="number"
                min={1}
                max={1440}
                value={lockoutForm.lockoutMinutes}
                onChange={(e) => setLockoutForm((s) => ({ ...s, lockoutMinutes: parseInt(e.target.value) || 1 }))}
                className={cn(
                  "w-24 rounded-xl border border-border bg-background px-3 py-2 text-center text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
                  !lockoutForm.enabled && "opacity-50"
                )}
                disabled={!lockoutForm.enabled}
              />
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSaveSecurity}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            Save security settings
          </button>
        </div>
      </div>
    </div>
  );
}
