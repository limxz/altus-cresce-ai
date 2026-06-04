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
      className={`fixed top-0 w-full z-50 transition-colors duration-200 h-[72px] bg-background ${
        scrolled ? "border-b border-foreground" : "border-b border-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
        <a href="#" className="flex items-center">
          <span className="font-display text-base tracking-[0.2em] uppercase text-foreground font-extrabold">
            ALTUS MEDIA
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-semibold text-foreground hover:text-accent transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}

          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setClientDropdown(!clientDropdown)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-2 border-foreground text-foreground bg-background hover:bg-muted transition-colors duration-200"
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
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-background border-2 border-foreground"
                >
                  <a
                    href="/clientes"
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors duration-200"
                    onClick={() => setClientDropdown(false)}
                  >
                    <User size={16} className="text-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-foreground">Sou Cliente</p>
                      <p className="text-xs text-muted-foreground">Ver o meu portal</p>
                    </div>
                  </a>
                  <a
                    href="/admin"
                    className="flex items-start gap-3 px-4 py-3 border-t border-foreground hover:bg-muted transition-colors duration-200"
                    onClick={() => setClientDropdown(false)}
                  >
                    <Settings size={16} className="text-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-foreground">Acesso Admin</p>
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

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-foreground"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-background border-b border-foreground"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-semibold text-foreground hover:text-accent transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-foreground pt-4 mt-2 space-y-3">
                <a
                  href="/clientes"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent transition-colors duration-200"
                >
                  <User size={14} /> Portal do Cliente
                </a>
                <a
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent transition-colors duration-200"
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
