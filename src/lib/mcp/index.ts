import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listClientsTool from "./tools/list-clients";
import listLeadsTool from "./tools/list-leads";
import listWhatsappConversationsTool from "./tools/list-whatsapp-conversations";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "altus-media-mcp",
  title: "Altus Media",
  version: "0.1.0",
  instructions:
    "Ferramentas do CRM da Altus Media. Usa `list_clients`, `list_leads` e `list_whatsapp_conversations` para consultar dados. Todas as ferramentas respeitam as políticas de acesso do utilizador autenticado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listClientsTool, listLeadsTool, listWhatsappConversationsTool],
});
