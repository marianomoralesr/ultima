import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import MainLayout from './components/MainLayout';
import ScrollToTop from './components/ScrollToTop';
import AuthHandler from './components/AuthHandler';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import DashboardLayout from './components/DashboardLayout';
import UserDashboardLayout from './components/UserDashboardLayout';
import AdminRoute from './components/AdminRoute';
import SalesRoute from './components/SalesRoute';
import RedirectManager from './components/RedirectManager';
import LeadSourceHandler from './components/LeadSourceHandler';
import { VehicleProvider } from './context/VehicleContext';
import InventoryLayout from './components/InventoryLayout';
import ResourceHints from './components/ResourceHints';
// VehicleProvider moved to main.tsx to avoid duplication

const HomePage = lazy(() => import('./pages/HomePage'));
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage'));
const VehicleListPage = lazy(() => import('./pages/VehicleListPage'));
const ResponsiveInventoryPage = lazy(() => import('./pages/ResponsiveInventoryPage'));
const ExplorarPage = lazy(() => import('./pages/ExplorarPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
// Removed: DashboardInventoryPage - using VehicleListPage for all inventory views
const Application = lazy(() => import('./pages/Application'));
const EnhancedApplication = lazy(() => import('./components/application/EnhancedApplication'));
const ApplicationConfirmationPage = lazy(() => import('./pages/ApplicationConfirmationPage'));
const UserApplicationsPage = lazy(() => import('./pages/UserApplicationsPage'));
const SeguimientoPage = lazy(() => import('./pages/SeguimientoPage'));
const SeguimientoDetailPage = lazy(() => import('./pages/SeguimientoDetailPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PerfilacionBancariaPage = lazy(() => import('./pages/PerfilacionBancariaPage'));
const BetaPollPage = lazy(() => import('./pages/BetaPollPage'));
const AdminInspectionPage = lazy(() => import('./pages/AdminInspectionPage'));
const FaqPage = lazy(() => import('./pages/faqs'));
const PromotionsPage = lazy(() => import('./pages/PromotionsPage'));
const MarketingCategoryPage = lazy(() => import('./pages/MarketingCategoryPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const AdminInspectionsListPage = lazy(() => import('./pages/AdminInspectionsListPage'));
const VisitasPage = lazy(() => import('./pages/VisitasPage'));
const SurveyPage = lazy(() => import('./pages/SurveyPage'));
const AnonymousSurveyPage = lazy(() => import('./pages/AnonymousSurveyPage'));
const SurveyAnalyticsDashboard = lazy(() => import('./pages/SurveyAnalyticsDashboard'));
const UnifiedTrackingDashboard = lazy(() => import('./pages/UnifiedTrackingDashboard'));
const KitTrefaPage = lazy(() => import('./pages/KitTrefaPage'));
const CarStudioPage = lazy(() => import('./pages/CarStudioPage'));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'));
const IntelPage = lazy(() => import('./pages/IntelPage'));
const AdminLeadsDashboardPage = lazy(() => import('./pages/AdminLeadsDashboardPage'));
const AdminClientProfilePage = lazy(() => import('./pages/AdminClientProfilePage'));
const AdminAirtableConfigPage = lazy(() => import('./pages/AdminAirtableConfigPage'));
const AdminValuationPage = lazy(() => import('./pages/AdminValuationPage'));
const SalesLeadsDashboardPage = lazy(() => import('./pages/SalesLeadsDashboardPage'));
const SalesClientProfilePage = lazy(() => import('./pages/SalesClientProfilePage'));
const SalesPerformanceDashboard = lazy(() => import('./pages/SalesPerformanceDashboard'));
const VacanciesListPage = lazy(() => import('./pages/VacanciesListPage'));
const VacancyDetailPage = lazy(() => import('./pages/VacancyDetailPage'));
const AdminVacanciesPage = lazy(() => import('./pages/AdminVacanciesPage'));
const AdminCandidatesPage = lazy(() => import('./pages/AdminCandidatesPage'));
const GetAQuotePage = lazy(() => import('./pages/GetAQuotePage'));
const SellMyCarPage = lazy(() => import('./pages/SellMyCarPage'));
const AsesorProfilePage = lazy(() => import('./pages/AsesorProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const BrandsPage = lazy(() => import('./pages/BrandsPage'));
const AdminConfigPage = lazy(() => import('./pages/AdminConfigPage'));
const MarketingHubPage = lazy(() => import('./pages/MarketingHubPage'));
const AdminComprasDashboardPage = lazy(() => import('./pages/AdminComprasDashboardPage'));
const AutosConOfertaPage = lazy(() => import('./pages/AutosConOfertaPage'));
const UnifiedCRMPage = lazy(() => import('./pages/UnifiedCRMPage'));
const MarketingAnalyticsDashboardPage = lazy(() => import('./pages/MarketingAnalyticsDashboardPage'));
const CustomerJourneysPage = lazy(() => import('./pages/CustomerJourneysPage'));
const R2ImageManagerPage = lazy(() => import('./pages/R2ImageManagerPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ConstructorPage = lazy(() => import('./pages/ConstructorPage'));
const HomePageEditorPage = lazy(() => import('./pages/HomePageEditorPage'));
const DynamicLandingPage = lazy(() => import('./pages/DynamicLandingPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const FinanciamientosPage = lazy(() => import('./pages/FinanciamientosPage'));
const FinanciamientoLandingPage = lazy(() => import('./pages/FinanciamientoLandingPage'));
const AdminUserManagementPage = lazy(() => import('./pages/AdminUserManagementPage'));
const ApplicationAnalyticsPage = lazy(() => import('./pages/ApplicationAnalyticsPage'));
const DocumentUploadAnalyticsPage = lazy(() => import('./pages/DocumentUploadAnalyticsPage'));
const MarketingConfigPage = lazy(() => import('./pages/MarketingConfigPage'));
const AdminSalesDashboard = lazy(() => import('./pages/AdminSalesDashboard'));
const AdminLogsPage = lazy(() => import('./pages/AdminLogsPage'));
const AdminBusinessAnalyticsDashboard = lazy(() => import('./pages/AdminBusinessAnalyticsDashboard'));
const UnifiedAdminDashboard = lazy(() => import('./pages/UnifiedAdminDashboard'));
const BankLoginPage = lazy(() => import('./pages/BankLoginPage'));
const BankDashboardPage = lazy(() => import('./pages/BankDashboardPage'));
const BankLeadProfilePage = lazy(() => import('./pages/BankLeadProfilePage'));
const AdminBankManagementPage = lazy(() => import('./pages/AdminBankManagementPage'));
const DashboardExample = lazy(() => import('./pages/DashboardExample'));
const PublicDocumentUploadPage = lazy(() => import('./pages/PublicDocumentUploadPage'));
const DashboardSidebarPage = lazy(() => import('./pages/DashboardSidebarPage'));

import ConfigService from './services/ConfigService';
import PageViewTracker from './components/PageViewTracker';
import BankRoute from './components/BankRoute';
import BankDashboardLayout from './components/BankDashboardLayout';

function App(): React.JSX.Element {
  // Disabled: Table setup should be done via migrations, not on page load
  // This was causing timeout errors
  // useEffect(() => {
  //   ConfigService.setupConfigTable();
  // }, []);

  const loadingSpinner = (
    <div className="flex justify-center items-center h-screen w-full bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <ResourceHints />
      <PageViewTracker />
      <LeadSourceHandler />
      <AuthHandler />
      <RedirectManager />
      <ScrollToTop />
      <Suspense fallback={loadingSpinner}>
        <Routes>
          {/* Standalone Explorar page (no layout) */}
          <Route element={<InventoryLayout />}>
            <Route path="explorar" element={<ExplorarPage />} />
          </Route>

          {/* Standalone Financiamientos landing page (no header/footer) */}
          <Route element={<InventoryLayout />}>
            <Route path="financiamientos" element={<FinanciamientosPage />} />
          </Route>

          {/* New Financiamiento Landing Page */}
          <Route path="financiamiento" element={<FinanciamientoLandingPage />} />

          {/* Routes that need vehicle and filter context */}
          <Route element={<InventoryLayout />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="autos" element={<VehicleListPage />} />
              <Route path="autos/:slug" element={<VehicleDetailPage />} />
              <Route path="vender-mi-auto" element={<GetAQuotePage />} />
              <Route path="promociones" element={<PromotionsPage />} />
              <Route path="faq" element={<FaqPage />} />
              <Route path="kit-trefa" element={<KitTrefaPage />} />
              <Route path="politica-de-privacidad" element={<PrivacyPolicyPage />} />
              <Route path="vacantes" element={<VacanciesListPage />} />
              <Route path="vacantes/:id" element={<VacancyDetailPage />} />
              <Route path="asesor/:id" element={<AsesorProfilePage />} />
              <Route path="marcas" element={<BrandsPage />} />
              <Route path="marcas/:marca" element={<MarketingCategoryPage />} />
              <Route path="carroceria/:carroceria" element={<MarketingCategoryPage />} />
              <Route path="changelog" element={<ChangelogPage />} />
              <Route path="intel" element={<IntelPage />} />
              <Route path="conocenos" element={<AboutPage />} />
              <Route path="contacto" element={<ContactPage />} />
              <Route path="encuesta-anonima" element={<AnonymousSurveyPage />} />
              <Route path="landing" element={<LandingPage />} />
              {/* Dynamic landing pages - must be before the * route */}
              <Route path=":slug" element={<DynamicLandingPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route path="/escritorio" element={<ProtectedRoute />}>
              {/* User routes with UserDashboardLayout */}
              <Route element={<UserDashboardLayout />}>
                <Route index element={<DashboardSidebarPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="perfilacion-bancaria" element={<PerfilacionBancariaPage />} />
                {/* Enhanced Application - New Multi-Step Form (now at /aplicacion for GTM/FB tracking) */}
                <Route path="aplicacion" element={<EnhancedApplication />} />
                <Route path="aplicacion/:id" element={<EnhancedApplication />} />
                <Route path="aplicacion/:id/confirmacion" element={<ApplicationConfirmationPage />} />
                {/* Legacy Application Form (moved to /nueva-solicitud) */}
                <Route path="nueva-solicitud" element={<Application />} />
                <Route path="nueva-solicitud/:id" element={<Application />} />
                <Route path="seguimiento" element={<SeguimientoPage />} />
                <Route path="seguimiento/:id" element={<SeguimientoDetailPage />} />
                <Route path="favoritos" element={<FavoritesPage />} />
                <Route path="beta-v.0.1" element={<BetaPollPage />} />
                <Route path="encuesta" element={<SurveyPage />} />
                <Route path="citas" element={<VisitasPage />} />
                <Route path="autos" element={<VehicleListPage />} />
                <Route path="inventario" element={<VehicleListPage />} />
                <Route path="mis-aplicaciones" element={<UserApplicationsPage />} />
                <Route path="solicitudes" element={<UserApplicationsPage />} />
                <Route path="vende-tu-auto" element={<SellMyCarPage />} />
                <Route path="ejemplo" element={<DashboardExample />} />
              </Route>

              {/* Admin/Sales routes WITH DashboardLayout */}
              <Route element={<DashboardLayout />}>

                {/* Admin-only routes nested under protected dashboard */}
                <Route element={<AdminRoute />}>
                  <Route path="admin" element={<AdminSalesDashboard />} />
                  <Route path="admin/dashboard" element={<AdminSalesDashboard />} />
                  <Route path="admin/business-analytics" element={<AdminBusinessAnalyticsDashboard />} />
                  <Route path="dashboard" element={<UnifiedAdminDashboard />} />
                  <Route path="admin/crm" element={<UnifiedCRMPage userRole="admin" />} />
                  <Route path="admin/leads" element={<UnifiedCRMPage userRole="admin" />} />
                  <Route path="admin/client/:id" element={<AdminClientProfilePage />} />
                  <Route path="admin/cliente/:id" element={<AdminClientProfilePage />} />
                  <Route path="admin/compras" element={<AdminComprasDashboardPage />} />
                  <Route path="admin/compras/:listingId" element={<AutosConOfertaPage />} />
                  <Route path="admin/airtable" element={<AdminAirtableConfigPage />} />
                  <Route path="admin/valuation" element={<AdminValuationPage />} />
                  <Route path="admin/inspections" element={<AdminInspectionsListPage />} />
                  <Route path="admin/inspections/:id" element={<AdminInspectionPage />} />
                  <Route path="admin/vacantes" element={<AdminVacanciesPage />} />
                  <Route path="admin/vacantes/:id/candidatos" element={<AdminCandidatesPage />} />
                  <Route path="admin/usuarios" element={<AdminUserManagementPage />} />
                  <Route path="admin/solicitudes" element={<ApplicationAnalyticsPage />} />
                  <Route path="admin/documentos-analytics" element={<DocumentUploadAnalyticsPage />} />
                  <Route path="admin/logs" element={<AdminLogsPage />} />
                  <Route path="admin/config" element={<AdminConfigPage />} />
                  <Route path="admin/marketing" element={<MarketingHubPage />} />
                  <Route path="admin/marketing-config" element={<MarketingConfigPage />} />
                  <Route path="admin/marketing-analytics" element={<MarketingAnalyticsDashboardPage />} />
                  <Route path="admin/customer-journeys" element={<CustomerJourneysPage />} />
                  <Route path="admin/survey-analytics" element={<SurveyAnalyticsDashboard />} />
                  <Route path="admin/tracking-analytics" element={<UnifiedTrackingDashboard />} />
                  <Route path="admin/r2-images" element={<R2ImageManagerPage />} />
                  <Route path="admin/bancos" element={<AdminBankManagementPage />} />
                  <Route path="marketing" element={<MarketingHubPage />} />
                  <Route path="marketing/constructor" element={<ConstructorPage />} />
                  <Route path="marketing/homepage-editor" element={<HomePageEditorPage />} />
                  <Route path="car-studio" element={<CarStudioPage />} />
                </Route>

                {/* Sales routes - accessible by sales and admin roles */}
                <Route element={<SalesRoute />}>
                  <Route path="ventas/dashboard" element={<AdminSalesDashboard />} />
                  <Route path="ventas/performance" element={<SalesPerformanceDashboard />} />
                  <Route path="ventas/crm" element={<UnifiedCRMPage userRole="sales" />} />
                  <Route path="ventas/leads" element={<UnifiedCRMPage userRole="sales" />} />
                  <Route path="ventas/cliente/:id" element={<SalesClientProfilePage />} />
                  <Route path="ventas/clientes/:id" element={<SalesClientProfilePage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Route>

          {/* Public routes that do NOT need vehicle context */}
          <Route element={<PublicRoute />}>
            <Route path="/acceder" element={<AuthPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
          </Route>

          {/* Bank Portal Login (public) */}
          <Route path="/bancos" element={<BankLoginPage />} />

          {/* Public Document Upload Dropzone */}
          <Route path="/documentos/:token" element={<PublicDocumentUploadPage />} />

          {/* Bank Portal Dashboard (protected) - Separate routing for bank representatives */}
          <Route element={<BankRoute />}>
            <Route element={<BankDashboardLayout />}>
              <Route path="/bancos/dashboard" element={<BankDashboardPage />} />
              <Route path="/bancos/inventario" element={<BankDashboardPage />} />
              <Route path="/bancos/pendientes" element={<BankDashboardPage />} />
              <Route path="/bancos/aprobadas" element={<BankDashboardPage />} />
              <Route path="/bancos/activas" element={<BankDashboardPage />} />
              <Route path="/bancos/rechazadas" element={<BankDashboardPage />} />
              <Route path="/bancos/cliente/:id" element={<BankLeadProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;