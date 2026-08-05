import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Notification } from "@/hooks/useAltusData";
import { severityColor } from "./Primitives";

interface DbNotification {
  id: string;
  category: string;
  severity: string;
  title: string;
  detail: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
}

const timeAgo = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

const NotificationCenter = ({ items }: { items: Notification[] }) => {
  const [open, setOpen] = useState(false);
  const [db, setDb] = useState<DbNotification[]>([]);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, category, severity, title, detail, href, read_at, created_at")
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(50);
    setDb((data ?? []) as DbNotification[]);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("os-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const derived = items.filter((i) => !db.some((d) => d.title === i.title));
  const all = [
    ...db.map((d) => ({
      id: d.id,
      title: d.title,
      detail: d.detail ?? "",
      severity: d.severity,
      href: d.href ?? undefined,
      at: d.created_at,
      persisted: true,
    })),
    ...derived.map((i) => ({ ...i, at: null as string | null, persisted: false })),
  ];
  const urgent = all.filter((i) => i.severity === "critico" || i.severity === "atencao").length;

  const markRead = async (id: string) => {
    setDb((prev) => prev.filter((d) => d.id !== id));
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  };

  const markAll = async () => {
    const ids = db.map((d) => d.id);
    setDb([]);
    if (ids.length) await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="os-btn !h-8 !w-8 !p-0 justify-center relative">
        <Bell size={14} />
        {urgent > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-semibold flex items-center justify-center"
            style={{ background: "var(--os-red)", color: "#09090b" }}
          >
            {urgent}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 mt-2 w-[360px] rounded-2xl os-glass z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--os-line)" }}>
                <span className="os-label">Notificações</span>
                {db.length > 0 && (
                  <button onClick={markAll} className="text-[11px] os-faint hover:text-white transition-colors">
                    Marcar tudo como lido
                  </button>
                )}
              </div>
              <div className="max-h-[420px] overflow-y-auto os-scroll">
                {all.length === 0 ? (
                  <p className="px-4 py-6 text-sm os-faint">Tudo em ordem. Nada requer a tua atenção.</p>
                ) : (
                  all.map((n) => (
                    <div key={n.id} className="group flex items-start hover:bg-white/[0.04] transition-colors">
                      <button
                        onClick={() => { setOpen(false); n.href && navigate(n.href); }}
                        className="flex-1 text-left px-4 py-3 flex gap-3 min-w-0"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: severityColor(n.severity) }} />
                        <span className="min-w-0">
                          <span className="block text-[13px] text-white truncate">{n.title}</span>
                          <span className="block text-xs os-faint mt-0.5">{n.detail}</span>
                          {n.at && <span className="block text-[10px] os-faint mt-1">{timeAgo(n.at)}</span>}
                        </span>
                      </button>
                      {n.persisted && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-3 os-faint hover:text-white"
                          aria-label="Marcar como lida"
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
