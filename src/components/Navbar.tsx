import { useState, useEffect, useRef } from "react";
import { Menu, X, UserCircle, ChevronDown, User, Settings } from "lucide-react";
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
      className={`fixed top-0 w-full z-50 transition-all duration-400 h-[72px] ${
        scrolled
          ? "border-b"
          : "bg-transparent border-b border-transparent"
      }`}
      style={scrolled ? {
        background: "rgba(9,9,15,0.8)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderColor: "rgba(123,47,255,0.1)",
      } : undefined}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))", boxShadow: "0 0 20px rgba(123,47,255,0.4)" }}>
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-display text-base tracking-[0.2em] uppercase text-foreground font-bold">
            Altus
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors duration-200 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-accent group-hover:w-full transition-all duration-300" />
            </a>
          ))}

          {/* Client area dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setClientDropdown(!clientDropdown)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                border: "1px solid rgba(123,47,255,0.3)",
                color: "hsl(var(--accent))",
                background: "rgba(123,47,255,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,245,212,0.5)";
                e.currentTarget.style.background = "rgba(123,47,255,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(123,47,255,0.3)";
                e.currentTarget.style.background = "rgba(123,47,255,0.05)";
              }}
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
                  className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(28,24,41,0.95)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(123,47,255,0.15)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(123,47,255,0.05)",
                  }}
                >
                  <a
                    href="/clientes"
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-200"
                    onClick={() => setClientDropdown(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                      <User size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Sou Cliente</p>
                      <p className="text-xs text-muted-foreground">Ver o meu portal</p>
                    </div>
                  </a>
                  <a
                    href="/admin"
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-200"
                    style={{ borderTop: "1px solid rgba(123,47,255,0.1)" }}
                    onClick={() => setClientDropdown(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                      <Settings size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Acesso Admin</p>
                      <p className="text-xs text-muted-foreground">Painel de controlo</p>
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
            className="md:hidden overflow-hidden"
            style={{
              background: "rgba(9,9,15,0.95)",
              backdropFilter: "blur(24px)",
              borderBottom: "1px solid rgba(123,47,255,0.1)",
            }}
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-muted-foreground hover:text-accent transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t pt-4 mt-2 space-y-3" style={{ borderColor: "rgba(123,47,255,0.1)" }}>
                <a
                  href="/clientes"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors duration-200"
                >
                  <User size={14} /> Portal do Cliente
                </a>
                <a
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors duration-200"
                >
                  <Settings size={14} /> Acesso Admin
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
