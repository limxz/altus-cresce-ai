import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ClientData {
  id: string;
  business_name: string;
  contact_name: string;
  plan: string;
  status: string;
  logo_url: string | null;
  brand_color: string | null;
  services: any;
  start_date: string | null;
  instagram_baseline: number;
  facebook_baseline: number;
  leads_baseline: number;
  niche: string;
  mrr: number | null;
}

interface ClientAuthContextType {
  client: ClientData | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType | null>(null);

export const useClientAuth = () => {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error("useClientAuth must be used within ClientAuthProvider");
  return ctx;
};

export const ClientAuthProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<ClientData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("altus_client");
    if (stored) {
      try {
        const decoded = JSON.parse(atob(stored));
        // Verificar expiração de sessão (7 dias)
        const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
        if (decoded.loginAt && Date.now() - decoded.loginAt > SESSION_TTL) {
          localStorage.removeItem("altus_client");
          return;
        }
        const { loginAt: _t, ...clientData } = decoded;
        setClient(clientData);
      } catch { localStorage.removeItem("altus_client"); }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("client-login", {
        body: { email, password },
      });

      if (error || !data?.client) return false;
      const d = data.client;
      const clientData: ClientData = {
        id: d.id,
        business_name: d.business_name,
        contact_name: d.contact_name,
        plan: d.plan,
        status: d.status,
        logo_url: d.logo_url,
        brand_color: d.brand_color,
        services: d.services,
        start_date: d.start_date,
        instagram_baseline: d.instagram_baseline || 0,
        facebook_baseline: d.facebook_baseline || 0,
        leads_baseline: d.leads_baseline || 0,
        niche: d.niche,
        mrr: d.mrr || null,
      };
      setClient(clientData);
      // Guardar encriptado com timestamp de login
      const encoded = btoa(JSON.stringify({ ...clientData, loginAt: Date.now() }));
      localStorage.setItem("altus_client", encoded);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setClient(null);
    localStorage.removeItem("altus_client");
  };

  return (
    <ClientAuthContext.Provider value={{ client, isAuthenticated: !!client, login, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
};

export const ProtectedClientRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useClientAuth();
  if (!isAuthenticated) return <Navigate to="/clientes" replace />;
  return <>{children}</>;
};
