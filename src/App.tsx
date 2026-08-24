import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/contexts/AuthContext";
import { AdminDataProvider } from "@/contexts/AdminDataContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { ClientAuthProvider, ProtectedClientRoute } from "@/contexts/ClientAuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";


import Login from "./pages/admin/Login";
import AdminLayout from "./components/admin/AdminLayout";
import Home from "./pages/admin/Home";
import Intelligence from "./pages/admin/Intelligence";
import Websites from "./pages/admin/Websites";
import MetaAds from "./pages/admin/MetaAds";
import Automation from "./pages/admin/Automation";
import Audit from "./pages/admin/Audit";
import LeadsPage from "./pages/admin/Leads";
import Conversations from "./pages/admin/Conversations";
import ClientsManagement from "./pages/admin/ClientsManagement";
import Notes from "./pages/admin/Notes";
import Settings from "./pages/admin/Settings";
import AdminPricing from "./pages/admin/Pricing";
import Presentations from "./pages/admin/Presentations";
import WhatsAppAgents from "./pages/admin/WhatsAppAgents";
import Setup from "./pages/admin/Setup";
import Diagnosticos from "./pages/admin/Diagnosticos";
import Analytics from "./pages/admin/Analytics";
import Pipeline from "./pages/admin/Pipeline";
import TestimonialsAdmin from "./pages/admin/Testimonials";
import ClientDetail from "./pages/admin/ClientDetail";
import Integrations from "./pages/admin/Integrations";
import ClientMemory from "./pages/admin/ClientMemory";

import ClientLogin from "./pages/clientes/ClientLogin";
import ClientPortal from "./pages/clientes/ClientPortal";
import HomeView from "./pages/clientes/views/HomeView";
import AltusOSView from "./pages/clientes/views/AltusOSView";
import ResultsView from "./pages/clientes/views/ResultsView";
import LeadsView from "./pages/clientes/views/LeadsView";
import WebsiteView from "./pages/clientes/views/WebsiteView";
import DocumentsView from "./pages/clientes/views/DocumentsView";
import MeetingsView from "./pages/clientes/views/MeetingsView";
import AlertsView from "./pages/clientes/views/AlertsView";
import ClientSupportTab from "./components/clientes/SupportTab";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <AdminDataProvider>
          <BookingProvider>
          <ClientAuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

              
              <Route path="/admin/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Home />} />
                <Route path="ia" element={<Intelligence />} />
                <Route path="integracoes" element={<Integrations />} />
                <Route path="memoria" element={<ClientMemory />} />
                <Route path="websites" element={<Websites />} />
                <Route path="meta-ads" element={<MetaAds />} />
                <Route path="automacao" element={<Automation />} />
                <Route path="auditoria" element={<Audit />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="conversations" element={<Conversations />} />
                <Route path="clients" element={<ClientsManagement />} />
                <Route path="client/:id" element={<ClientDetail />} />
                <Route path="settings" element={<Settings />} />
                <Route path="pricing" element={<AdminPricing />} />
                <Route path="diagnosticos" element={<Diagnosticos />} />
                <Route path="presentations" element={<Presentations />} />
                <Route path="whatsapp" element={<WhatsAppAgents />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="pipeline" element={<Pipeline />} />
                <Route path="testimonials" element={<TestimonialsAdmin />} />
                <Route path="setup" element={<Setup />} />
              </Route>
              <Route path="/clientes" element={<ClientLogin />} />
              <Route
                path="/clientes/dashboard"
                element={
                  <ProtectedClientRoute>
                    <ClientPortal />
                  </ProtectedClientRoute>
                }
              >
                <Route index element={<HomeView />} />
                <Route path="altusos" element={<AltusOSView />} />
                <Route path="altusos/:conversationId" element={<AltusOSView />} />
                <Route path="resultados" element={<ResultsView />} />
                <Route path="leads" element={<LeadsView />} />
                <Route path="website" element={<WebsiteView />} />
                <Route path="documentos" element={<DocumentsView />} />
                <Route path="reunioes" element={<MeetingsView />} />
                <Route path="alertas" element={<AlertsView />} />
                <Route path="suporte" element={<ClientSupportTab />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </ClientAuthProvider>
          </BookingProvider>
        </AdminDataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
