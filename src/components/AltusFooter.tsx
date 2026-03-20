import { Instagram } from "lucide-react";

const AltusFooter = () => {
  return (
    <footer className="border-t border-primary/10 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">A</span>
              </div>
              <span className="font-display text-lg tracking-[0.2em] uppercase text-foreground">
                Altus Media
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Cresce com Inteligência. Agência de marketing com IA, Portugal.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-medium text-foreground mb-4 text-sm tracking-widest uppercase">
              Links Rápidos
            </h4>
            <div className="flex flex-col gap-2">
              {["Serviços", "Resultados", "Sobre", "Contacto"].map((link) =>
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-muted-foreground text-sm hover:text-accent transition-colors">
                
                  {link}
                </a>
              )}
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-medium text-foreground mb-4 text-sm tracking-widest uppercase">
              Redes Sociais
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://www.instagram.com/altusmedia.agency/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors text-sm">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 transition-all">
                  <Instagram size={18} />
                </div>
                @altusmedia.agency
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            © 2025 Altus Media · Portugal
          </p>
          <p className="text-muted-foreground text-xs">
            Feito com IA 🤖
          </p>
        </div>
      </div>
    </footer>);

};

export default AltusFooter;