import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Notification } from "@/hooks/useAltusData";
import { severityColor } from "./Primitives";

const NotificationCenter = ({ items }: { items: Notification[] }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const urgent = items.filter((i) => i.severity === "critico" || i.severity === "atencao").length;

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
              className="absolute right-0 mt-2 w-[340px] rounded-2xl os-glass z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--os-line)" }}>
                <span className="os-label">Notificações</span>
              </div>
              <div className="max-h-[380px] overflow-y-auto os-scroll">
                {items.length === 0 ? (
                  <p className="px-4 py-6 text-sm os-faint">Tudo em ordem. Nada requer a tua atenção.</p>
                ) : (
                  items.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { setOpen(false); n.href && navigate(n.href); }}
                      className="w-full text-left px-4 py-3 flex gap-3 hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: severityColor(n.severity) }} />
                      <span className="min-w-0">
                        <span className="block text-[13px] text-white truncate">{n.title}</span>
                        <span className="block text-xs os-faint mt-0.5">{n.detail}</span>
                      </span>
                    </button>
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
