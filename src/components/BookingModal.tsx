import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CAL_LINK = "altusmedia";

const BookingModal = ({ isOpen, onClose }: BookingModalProps) => {
  const calInitialized = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    if (!calInitialized.current) {
      (function (C: any, A: string, L: string) {
        let p = function (a: any, ar: any) { a.q.push(ar); };
        let d = C.document;
        C.Cal = C.Cal || function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api = function () { p(api, arguments); };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["-", api]);
            } else {
              p(cal, ar);
            }
            return;
          }
          p(cal, ar);
        };
      })(window, "https://cal.eu/embed/embed.js", "init");

      (window as any).Cal("init", { origin: "https://cal.eu" });
      calInitialized.current = true;
    }

    const timer = setTimeout(() => {
      (window as any).Cal("inline", {
        elementOrSelector: "#cal-booking-inline",
        calLink: CAL_LINK,
        layout: "month_view",
        config: {
          theme: "dark",
        },
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[720px] h-[90vh] md:h-[80vh] rounded-3xl overflow-hidden border border-[rgba(139,92,246,0.2)] bg-background"
            style={{
              boxShadow: "0 0 60px rgba(139,92,246,0.15), 0 25px 50px -12px rgba(0,0,0,0.6)",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[rgba(139,92,246,0.2)] transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #2A2040" }}
            >
              <X size={20} />
            </button>

            {/* Cal.com embed */}
            <div
              id="cal-booking-inline"
              className="w-full h-full overflow-auto"
              data-cal-link={CAL_LINK}
              data-cal-config='{"layout":"month_view","theme":"dark"}'
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
