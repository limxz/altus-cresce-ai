import { Instagram } from "lucide-react";

const AltusFooter = () => {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.04)] py-16 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span className="font-display text-lg tracking-[0.15em] uppercase text-foreground font-bold">
                Altus Media
              </span>
            </div>
            <p className="text-[#9CA3AF] text-sm leading-relaxed">
              Cresce com Inteligência. Agência de marketing com IA, Portugal.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-mono text-xs text-[#6B7280] tracking-[0.1em] uppercase mb-4">
              Links Rápidos
            </h4>
            <div className="flex flex-col gap-2">
              {["Serviços", "Resultados", "Sobre", "Contacto"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-[#9CA3AF] text-sm hover:text-[#A78BFA] transition-colors duration-200"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-mono text-xs text-[#6B7280] tracking-[0.1em] uppercase mb-4">
              Redes Sociais
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://www.instagram.com/altusmedia.agency/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#A78BFA] transition-colors duration-200 text-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.1)] border border-[#2A2040] flex items-center justify-center hover:bg-[rgba(139,92,246,0.2)] transition-all duration-200">
                  <Instagram size={18} className="text-[#8B5CF6]" />
                </div>
                @altusmedia.agency
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.04)] mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#6B7280] text-xs font-mono">
            © 2025 Altus Media · Portugal
          </p>
          <p className="text-[#6B7280] text-xs font-mono">
            Feito com IA 🤖
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AltusFooter;
