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

  // Close dropdown on outside click
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
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-primary/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-display text-xl tracking-[0.2em] uppercase text-foreground">
            Altus Media
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}

          {/* Client area dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setClientDropdown(!clientDropdown)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-primary/40 text-secondary hover:border-primary/60 transition-all"
            >
              <UserCircle size={16} />
              Área de Cliente
              <ChevronDown size={14} className={`transition-transform ${clientDropdown ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {clientDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                >
                  <a
                    href="/clientes"
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors"
                    onClick={() => setClientDropdown(false)}
                  >
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Sou Cliente</p>
                      <p className="text-xs text-muted-foreground">Ver o meu portal</p>
                    </div>
                  </a>
                  <a
                    href="/admin"
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors border-t border-border"
                    onClick={() => setClientDropdown(false)}
                  >
                    <span className="text-lg">⚙️</span>
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
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-primary/10 overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-border pt-4 mt-2 space-y-3">
                <a
                  href="/clientes"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  👤 Portal do Cliente
                </a>
                <a
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
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
