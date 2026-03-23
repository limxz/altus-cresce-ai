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
import Dashboard from "./pages/admin/Dashboard";
import LeadsPage from "./pages/admin/Leads";
import Conversations from "./pages/admin/Conversations";
import ClientsManagement from "./pages/admin/ClientsManagement";
import Settings from "./pages/admin/Settings";
import AdminPricing from "./pages/admin/Pricing";
import Presentations from "./pages/admin/Presentations";
import Diagnosticos from "./pages/admin/Diagnosticos";

import ClientLogin from "./pages/clientes/ClientLogin";
import ClientPortal from "./pages/clientes/ClientPortal";

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
              <Route path="/admin/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="conversations" element={<Conversations />} />
                <Route path="clients" element={<ClientsManagement />} />
                <Route path="settings" element={<Settings />} />
                <Route path="pricing" element={<AdminPricing />} />
                <Route path="diagnosticos" element={<Diagnosticos />} />
                <Route path="presentations" element={<Presentations />} />
              </Route>
              <Route path="/clientes" element={<ClientLogin />} />
              <Route
                path="/clientes/dashboard"
                element={
                  <ProtectedClientRoute>
                    <ClientPortal />
                  </ProtectedClientRoute>
                }
              />
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
