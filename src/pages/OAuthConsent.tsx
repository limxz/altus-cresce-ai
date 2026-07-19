import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AuthClient = {
  name?: string;
  logo_uri?: string;
  client_uri?: string;
};

type AuthorizationDetails = {
  client?: AuthClient;
  scope?: string;
  redirect_uri?: string;
  redirect_url?: string;
  redirect_to?: string;
};

// Beta namespace on @supabase/supabase-js — typed wrapper.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};

const oauthApi = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Pedido de autorização inválido (falta authorization_id).");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/admin/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error: err } = await oauthApi.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) {
        setError(err.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauthApi.approveAuthorization(authorizationId)
      : await oauthApi.denyAuthorization(authorizationId);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor de autorização não devolveu um URL de redirecionamento.");
      return;
    }
    window.location.href = target;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="glass-card p-8 w-full max-w-md text-center">
          <h1 className="font-display text-xl text-foreground mb-2">Não foi possível carregar este pedido</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-muted-foreground text-sm">A carregar…</p>
      </div>
    );
  }

  const clientName = details.client?.name ?? "esta aplicação";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="glass-card p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
          <h1 className="font-display text-xl text-foreground">Ligar {clientName} à Altus Media</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {clientName} vai poder chamar as ferramentas desta app em teu nome enquanto estás autenticado.
          </p>
        </div>

        <div className="text-xs text-muted-foreground/80 bg-muted/40 border border-primary/10 rounded-lg p-3 mb-6">
          Esta autorização não contorna as políticas de acesso da Altus Media — só verás os dados a que já tens acesso.
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => decide(false)}
            disabled={busy}
            className="flex-1 rounded-full border border-primary/20 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => decide(true)}
            disabled={busy}
            className="btn-primary flex-1 !py-2.5 !text-sm disabled:opacity-50"
          >
            {busy ? "A processar…" : "Aprovar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OAuthConsent;
