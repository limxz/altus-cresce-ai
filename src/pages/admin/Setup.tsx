import { CheckCircle, Copy } from "lucide-react";
import { useState } from "react";

const Setup = () => {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/whatsapp-multi-agent`;
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stepClass = "glass-card p-6 space-y-3";
  const codeClass = "bg-muted p-3 rounded-lg font-mono text-xs text-accent break-all flex items-start gap-2";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-foreground font-display text-lg">Setup WhatsApp AI</h2>
        <p className="text-muted-foreground text-sm">Guia passo-a-passo para configurar o sistema</p>
      </div>

      {/* Step 1 */}
      <div className={stepClass}>
        <h3 className="text-foreground font-medium flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span> Configurar Twilio</h3>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Cria conta em <a href="https://twilio.com" target="_blank" className="text-accent hover:underline">twilio.com</a></li>
          <li>Vai a <strong>Messaging → Try WhatsApp</strong></li>
          <li>Activa o sandbox</li>
          <li>Em <strong>"When a message comes in"</strong> cola este URL:</li>
        </ol>
        <div className={codeClass}>
          <span className="flex-1">{webhookUrl}</span>
          <button onClick={() => copy(webhookUrl)} className="text-muted-foreground hover:text-foreground shrink-0">
            {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Method: <strong>POST</strong></p>
        <p className="text-xs text-muted-foreground">Para número dedicado: compra um número +351 em Twilio.</p>
      </div>

      {/* Step 2 */}
      <div className={stepClass}>
        <h3 className="text-foreground font-medium flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span> Secrets necessários</h3>
        <p className="text-sm text-muted-foreground">Configura estes secrets no backend:</p>
        <div className="space-y-2">
          {[
            { name: "TWILIO_ACCOUNT_SID", desc: "O Account SID do Twilio (começa com AC...)" },
            { name: "TWILIO_AUTH_TOKEN", desc: "O Auth Token do Twilio" },
            { name: "LOVABLE_API_KEY", desc: "Já configurado automaticamente ✅" },
          ].map((s) => (
            <div key={s.name} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <code className="text-xs text-accent font-mono">{s.name}</code>
              <span className="text-xs text-muted-foreground">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 3 */}
      <div className={stepClass}>
        <h3 className="text-foreground font-medium flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span> Criar agente para cliente</h3>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Vai a <strong>/admin → WhatsApp Agents</strong></li>
          <li>Clica <strong>"Novo Agente"</strong></li>
          <li>Seleciona o cliente e preenche as informações do negócio</li>
          <li>Cola o número Twilio atribuído</li>
          <li>Clica <strong>"Guardar"</strong> e depois <strong>activa</strong> o agente</li>
        </ol>
      </div>

      {/* Step 4 */}
      <div className={stepClass}>
        <h3 className="text-foreground font-medium flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">4</span> Testar</h3>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Envia <code className="text-accent">join [sandbox-keyword]</code> para <strong>+1 415 523 8886</strong> no WhatsApp</li>
          <li>Depois envia qualquer mensagem para testar</li>
          <li>Verifica se a conversa aparece em <strong>/admin → WhatsApp Agents</strong></li>
          <li>E no portal do cliente em <strong>/clientes → Leads</strong></li>
        </ol>
      </div>
    </div>
  );
};

export default Setup;
