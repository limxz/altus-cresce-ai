import { Instagram } from "lucide-react";

const AltusFooter = () => {
  return (
    <footer className="py-16 px-6" style={{ borderTop: "1px solid rgba(42,32,64,0.6)" }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}>
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-display text-base tracking-[0.2em] uppercase text-foreground font-bold">
                Altus Media
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Cresce com Inteligência. Agência de marketing com IA, Portugal.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-mono text-[0.6875rem] tracking-[0.12em] uppercase text-muted-foreground mb-4">
              Links Rápidos
            </h4>
            <div className="flex flex-col gap-2">
              {["Serviços", "Resultados", "Sobre", "Contacto"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-muted-foreground text-sm hover:text-accent transition-colors duration-200"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-mono text-[0.6875rem] tracking-[0.12em] uppercase text-muted-foreground mb-4">
              Redes Sociais
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://www.instagram.com/altusmedia.agency/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors duration-200 text-sm"
              >
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-all duration-200 hover:border-primary/30" style={{ background: "hsl(var(--surface-card))", border: "1px solid hsl(var(--border-subtle))" }}>
                  <Instagram size={18} className="text-primary" />
                </div>
                @altusmedia.agency
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(42,32,64,0.4)" }}>
          <p className="text-muted-foreground text-xs font-mono">
            © 2025 Altus Media · Portugal
          </p>
          <p className="text-muted-foreground text-xs font-mono">
            Feito com IA
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AltusFooter;
