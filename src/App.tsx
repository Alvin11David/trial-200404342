import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { RoleProvider } from "@/lib/role";
import { ThemeProvider } from "@/hooks/use-theme";
import { OnlineProvider } from "@/hooks/use-online-status";
import { InstallProvider } from "@/hooks/use-install-prompt";
import LoginPage from "@/auth/Login";
import ReservationsPage from "@/features/reservations/ReservationsList";
import NewReservationPage from "@/features/reservations/NewReservation";
import ReservationDetail from "@/features/reservations/ReservationDetail";
import NotificationsPage from "@/features/notifications/NotificationsPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import EmployeeProfile from "@/features/hr/EmployeeProfile";
import RoomsPage from "@/features/rooms/RoomsPage";
import GuestsPage from "@/features/guests/GuestsPage";
import BillingPage from "@/features/billing/BillingPage";
import MasterBilling from "@/features/billing/MasterBilling";
import InvoicesPage from "@/features/invoices/InvoicesPage";
import CheckInPage from "@/features/frontdesk/CheckInPage";
import CheckInWizard from "@/features/frontdesk/CheckInWizard";
import WalkInCheckIn from "@/features/frontdesk/WalkInCheckIn";

import GroupsPage from "@/features/groups/GroupsPage";
import GroupDetail from "@/features/groups/GroupDetail";
import GuestServicesPage from "@/features/guest-services/GuestServicesPage";
import HousekeepingPage from "@/features/housekeeping/HousekeepingPage";
import IdentityPage from "@/features/admin/IdentityPage";
import RolesPage from "@/features/admin/RolesPage";
import SecuritySettingsPage from "@/features/admin/SecuritySettingsPage";
import PropertiesPage from "@/features/admin/PropertiesPage";
import AuditPage from "@/features/admin/AuditPage";
import SettingsRoomsPage from "@/features/admin/SettingsRoomsPage";
import ReportsPage from "@/features/reports/ReportsPage";
import AccountingPage from "@/features/accounting/AccountingPage";
import POSPage from "@/features/pos/POSPage";
import POSOrdersPage from "@/features/pos/POSOrdersPage";
import POSMenuPage from "@/features/pos/POSMenuPage";
import PosSettingsPage from "@/features/admin/PosSettingsPage";
import SettingsMiscChargesPage from "@/features/admin/SettingsMiscChargesPage";

import InventoryDashboard from "@/features/inventory/InventoryDashboard";
import InventoryList from "@/features/inventory/InventoryList";
import PurchaseOrdersPage from "@/features/inventory/PurchaseOrdersPage";
import SuppliersPage from "@/features/inventory/SuppliersPage";
import TransfersPage from "@/features/inventory/TransfersPage";
import AdjustmentsPage from "@/features/inventory/AdjustmentsPage";
import StocktakePage from "@/features/inventory/StocktakePage";
import ParLevelsPage from "@/features/inventory/ParLevelsPage";
import ReceivingPage from "@/features/inventory/ReceivingPage";
import SupplierInvoicesPage from "@/features/inventory/SupplierInvoicesPage";
import MinibarPage from "@/features/housekeeping/MinibarPage";
import RequisitionsPage from "@/features/inventory/RequisitionsPage";
import DepartmentConsumptionPage from "@/features/inventory/DepartmentConsumptionPage";
import FoodCostPage from "@/features/inventory/FoodCostPage";
import RateCardPage from "@/features/inventory/RateCardPage";

import { AppShell } from "@/components/jambo/AppShell";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <RoleProvider>
          <OnlineProvider>
            <InstallProvider>
            <Toaster richColors position="top-right" />
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/forgot-password" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                }
              />
              <Route
                path="/reservations"
                element={
                  <AppLayout>
                    <ReservationsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/reservations/new"
                element={
                  <AppLayout>
                    <NewReservationPage />
                  </AppLayout>
                }
              />
              <Route
                path="/reservations/:id"
                element={
                  <AppLayout>
                    <ReservationDetail />
                  </AppLayout>
                }
              />
              <Route
                path="/notifications"
                element={
                  <AppLayout>
                    <NotificationsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/check-in"
                element={
                  <AppLayout>
                    <CheckInPage />
                  </AppLayout>
                }
              />
              <Route
                path="/check-in/new"
                element={
                  <AppLayout>
                    <WalkInCheckIn />
                  </AppLayout>
                }
              />
              <Route
                path="/check-in/:id"
                element={
                  <AppLayout>
                    <CheckInWizard />
                  </AppLayout>
                }
              />
              <Route
                path="/rooms"
                element={
                  <AppLayout>
                    <RoomsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/guests"
                element={
                  <AppLayout>
                    <GuestsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/billing"
                element={
                  <AppLayout>
                    <BillingPage />
                  </AppLayout>
                }
              />
              <Route
                path="/invoices"
                element={
                  <AppLayout>
                    <InvoicesPage />
                  </AppLayout>
                }
              />
              <Route
                path="/billing/master"
                element={
                  <AppLayout>
                    <MasterBilling />
                  </AppLayout>
                }
              />
              <Route
                path="/groups"
                element={
                  <AppLayout>
                    <GroupsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/groups/:id"
                element={
                  <AppLayout>
                    <GroupDetail />
                  </AppLayout>
                }
              />
              <Route
                path="/guest-services"
                element={
                  <AppLayout>
                    <GuestServicesPage />
                  </AppLayout>
                }
              />
              <Route
                path="/housekeeping"
                element={
                  <AppLayout>
                    <HousekeepingPage />
                  </AppLayout>
                }
              />
              <Route
                path="/hr/profile"
                element={
                  <AppLayout>
                    <EmployeeProfile />
                  </AppLayout>
                }
              />
              <Route
                path="/identity"
                element={
                  <AppLayout>
                    <IdentityPage />
                  </AppLayout>
                }
              />
              <Route
                path="/identity/roles"
                element={
                  <AppLayout>
                    <RolesPage />
                  </AppLayout>
                }
              />
              <Route
                path="/settings"
                element={
                  <AppLayout>
                    <SecuritySettingsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/settings/rooms"
                element={
                  <AppLayout>
                    <SettingsRoomsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/settings/pos"
                element={
                  <AppLayout>
                    <PosSettingsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/settings/misc-charges"
                element={
                  <AppLayout>
                    <SettingsMiscChargesPage />
                  </AppLayout>
                }
              />
              <Route
                path="/audit"
                element={
                  <AppLayout>
                    <AuditPage />
                  </AppLayout>
                }
              />
              <Route
                path="/reports"
                element={
                  <AppLayout>
                    <ReportsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/pos"
                element={
                  <AppLayout>
                    <POSPage />
                  </AppLayout>
                }
              />
              <Route
                path="/pos/orders"
                element={
                  <AppLayout>
                    <POSOrdersPage />
                  </AppLayout>
                }
              />
              <Route
                path="/pos/menu"
                element={
                  <AppLayout>
                    <POSMenuPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory"
                element={
                  <AppLayout>
                    <InventoryDashboard />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory/list"
                element={
                  <AppLayout>
                    <InventoryList />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory/purchase-orders"
                element={
                  <AppLayout>
                    <PurchaseOrdersPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory/requisitions"
                element={
                  <AppLayout>
                    <RequisitionsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory/consumption"
                element={
                  <AppLayout>
                    <DepartmentConsumptionPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory/food-cost"
                element={
                  <AppLayout>
                    <FoodCostPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory/suppliers"
                element={
                  <AppLayout>
                    <SuppliersPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory/transfers"
                element={
                  <AppLayout>
                    <TransfersPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory/adjustments"
                element={
                  <AppLayout>
                    <AdjustmentsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory/stocktaking"
                element={
                  <AppLayout>
                    <StocktakePage />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory/par-levels"
                element={
                  <AppLayout>
                    <ParLevelsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/housekeeping/minibar"
                element={
                  <AppLayout>
                    <MinibarPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory/receiving"
                element={
                  <AppLayout>
                    <ReceivingPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inventory/supplier-invoices"
                element={
                  <AppLayout>
                    <SupplierInvoicesPage />
                  </AppLayout>
                }
              />
              <Route
                path="/services"
                element={
                  <AppLayout>
                    <RateCardPage />
                  </AppLayout>
                }
              />
              <Route
                path="/accounting"
                element={
                  <AppLayout>
                    <AccountingPage />
                  </AppLayout>
                }
              />
              <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/admin/properties"
                element={
                  <AppLayout>
                    <PropertiesPage />
                  </AppLayout>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </InstallProvider>
          </OnlineProvider>
        </RoleProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
