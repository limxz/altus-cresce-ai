import { useAdminData } from "@/contexts/AdminDataContext";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const { settings, setSettings } = useAdminData();

  const handleSave = () => {
    toast({ title: "Configurações guardadas", description: "As alterações foram aplicadas." });
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Chatbot toggle */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-foreground font-medium text-sm">Chatbot Altus AI</h3>
            <p className="text-muted-foreground text-xs">Ativar ou desativar o chatbot no site.</p>
          </div>
          <button
            onClick={() => setSettings((s) => ({ ...s, chatbotEnabled: !s.chatbotEnabled }))}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.chatbotEnabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-foreground absolute top-0.5 transition-transform ${
                settings.chatbotEnabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* API Key */}
      <div className="glass-card p-6">
        <h3 className="text-foreground font-medium text-sm mb-1">API Key (Anthropic / AI)</h3>
        <p className="text-muted-foreground text-xs mb-3">Cole aqui a chave da API para respostas reais do chatbot.</p>
        <input
          type="password"
          value={settings.apiKey}
          onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
          placeholder="sk-ant-..."
          className="w-full bg-muted border border-primary/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40"
        />
      </div>

      {/* System Prompt */}
      <div className="glass-card p-6">
        <h3 className="text-foreground font-medium text-sm mb-1">System Prompt do Chatbot</h3>
        <p className="text-muted-foreground text-xs mb-3">Edite o comportamento do chatbot.</p>
        <textarea
          value={settings.chatbotPrompt}
          onChange={(e) => setSettings((s) => ({ ...s, chatbotPrompt: e.target.value }))}
          rows={8}
          className="w-full bg-muted border border-primary/10 rounded-lg px-4 py-.5 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none font-mono"
        />
      </div>

      {/* Contact info */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-foreground font-medium text-sm">Informação de Contacto</h3>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Email</label>
          <input
            value={settings.contactEmail}
            onChange={(e) => setSettings((s) => ({ ...s, contactEmail: e.target.value }))}
            className="w-full bg-muted border border-primary/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Telefone</label>
          <input
            value={settings.contactPhone}
            onChange={(e) => setSettings((s) => ({ ...s, contactPhone: e.target.value }))}
            className="w-full bg-muted border border-primary/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40"
          />
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary !text-sm">
        Guardar Configurações
      </button>
    </div>
  );
};

export default Settings;
