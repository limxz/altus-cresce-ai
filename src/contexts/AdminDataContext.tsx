import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  business: string;
  date: string;
  status: "novo" | "contactado" | "fechado";
}

export interface ChatConversation {
  id: string;
  visitorName: string;
  messages: { role: "user" | "ai"; content: string; time: string }[];
  date: string;
}

export interface Client {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string;
  package: string;
  startDate: string;
  notes: string;
  status: "ativo" | "inativo";
}

export interface SiteSettings {
  chatbotEnabled: boolean;
  chatbotPrompt: string;
  apiKey: string;
  contactEmail: string;
  contactPhone: string;
}

interface AdminDataContextType {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  conversations: ChatConversation[];
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  settings: SiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

const defaultSettings: SiteSettings = {
  chatbotEnabled: true,
  chatbotPrompt: "És o assistente virtual da Altus Media...",
  apiKey: "",
  contactEmail: "info@altusmedia.pt",
  contactPhone: "+351 912 345 678",
};

const seedLeads: Lead[] = [
  { id: "1", name: "João Silva", email: "joao@email.com", phone: "912345678", business: "Restaurante O Minho", date: "2025-01-15", status: "novo" },
  { id: "2", name: "Ana Costa", email: "ana@email.com", phone: "913456789", business: "Clínica Beleza Pura", date: "2025-01-14", status: "contactado" },
  { id: "3", name: "Pedro Santos", email: "pedro@email.com", phone: "914567890", business: "Ginásio FitBraga", date: "2025-01-12", status: "fechado" },
];

const seedConversations: ChatConversation[] = [
  {
    id: "1",
    visitorName: "João Silva",
    date: "2025-01-15",
    messages: [
      { role: "ai", content: "Olá! 👋 Sou o Altus AI. Que tipo de negócio tens?", time: "14:30" },
      { role: "user", content: "Tenho um restaurante em Braga", time: "14:31" },
      { role: "ai", content: "Excelente! Temos ótimos resultados com restaurantes. Queres saber mais?", time: "14:31" },
    ],
  },
];

const seedClients: Client[] = [
  { id: "1", name: "Maria Fernandes", business: "Imobiliária Braga Norte", email: "maria@email.com", phone: "915678901", package: "Growth", startDate: "2024-11-01", notes: "Cliente desde novembro", status: "ativo" },
];

function useLocalState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

const AdminDataContext = createContext<AdminDataContextType | null>(null);

export const useAdminData = () => {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
};

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const [leads, setLeads] = useLocalState("altus_leads", seedLeads);
  const [conversations, setConversations] = useLocalState("altus_conversations", seedConversations);
  const [clients, setClients] = useLocalState("altus_clients", seedClients);
  const [settings, setSettings] = useLocalState("altus_settings", defaultSettings);

  return (
    <AdminDataContext.Provider value={{ leads, setLeads, conversations, setConversations, clients, setClients, settings, setSettings }}>
      {children}
    </AdminDataContext.Provider>
  );
};
