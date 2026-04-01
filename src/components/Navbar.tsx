import { useState, useEffect, useRef } from "react";
import { Menu, X, UserCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBooking } from "@/contexts/BookingContext";

const navLinks = [
  { label: "Serviços", href: "#servicos" },
  { label: "Resultados", href: "#resultados" },
  { label: "Plano Grátis", href: "/plano-gratis" },
  { label: "Contacto", href: "#contacto" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clientDropdown, setClientDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openBooking } = useBooking();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setClientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 h-16 ${
        scrolled
          ? "bg-[rgba(9,9,15,0.8)] backdrop-blur-[20px] saturate-150 border-b border-[rgba(139,92,246,0.12)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <span className="font-display text-lg tracking-[0.15em] uppercase text-foreground font-bold">
            Altus
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}

          {/* Client area dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setClientDropdown(!clientDropdown)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-[rgba(139,92,246,0.35)] text-[#A78BFA] hover:border-[rgba(139,92,246,0.6)] hover:bg-[rgba(139,92,246,0.06)] transition-all duration-200"
            >
              <UserCircle size={16} />
              Área de Cliente
              <ChevronDown size={14} className={`transition-transform duration-200 ${clientDropdown ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {clientDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden border border-[#2A2040]"
                  style={{
                    background: "rgba(28,24,41,0.95)",
                    backdropFilter: "blur(24px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  <a
                    href="/clientes"
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-200"
                    onClick={() => setClientDropdown(false)}
                  >
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Sou Cliente</p>
                      <p className="text-xs text-[#6B7280]">Ver o meu portal</p>
                    </div>
                  </a>
                  <a
                    href="/admin"
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-200 border-t border-[rgba(255,255,255,0.04)]"
                    onClick={() => setClientDropdown(false)}
                  >
                    <span className="text-lg">⚙️</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Acesso Admin</p>
                      <p className="text-xs text-[#6B7280]">Painel de controlo</p>
                    </div>
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={openBooking} className="btn-primary !px-6 !py-2.5 !text-sm">
            Fala Connosco
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-foreground"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-b border-[rgba(139,92,246,0.12)]"
            style={{
              background: "rgba(9,9,15,0.95)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-[#9CA3AF] hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-[rgba(255,255,255,0.04)] pt-4 mt-2 space-y-3">
                <a
                  href="/clientes"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-white transition-colors duration-200"
                >
                  👤 Portal do Cliente
                </a>
                <a
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-white transition-colors duration-200"
                >
                  ⚙️ Acesso Admin
                </a>
              </div>
              <button
                onClick={() => { setMobileOpen(false); openBooking(); }}
                className="btn-primary !text-center !text-sm mt-2"
              >
                Fala Connosco
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
