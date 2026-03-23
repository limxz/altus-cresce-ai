import { MessageCircle, Mail, Calendar } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const CONTACTS = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    desc: "Resposta rápida via WhatsApp",
    href: "https://wa.me/351910344077",
    color: "text-green-400",
  },
  {
    icon: Mail,
    label: "Email",
    desc: "suporte@altusmedia.pt",
    href: "mailto:suporte@altusmedia.pt",
    color: "text-accent",
  },
  {
    icon: Calendar,
    label: "Agendar Chamada",
    desc: "Marca uma chamada connosco",
    href: "https://www.cal.eu/altusmedia",
    color: "text-primary",
  },
];

const FAQS = [
  {
    q: "Quando vejo os primeiros resultados?",
    a: "Normalmente entre 2 a 4 semanas após o início da estratégia. Os primeiros sinais são o aumento de engagement e contactos recebidos pelo bot.",
  },
  {
    q: "Como aprovar os posts?",
    a: "Vai ao separador 'Conteúdo', seleciona 'Pendente' e clica em 'Aprovar' ou 'Pedir alteração'. É simples e rápido!",
  },
  {
    q: "O bot está a funcionar?",
    a: "Sim! O teu assistente IA está activo 24/7. Podes verificar no separador 'Leads' todas as conversas que o bot teve.",
  },
  {
    q: "Como interpretar os gráficos?",
    a: "No separador 'Crescimento' vês a evolução dos seguidores e leads ao longo do tempo. As setas verdes indicam crescimento positivo.",
  },
  {
    q: "Como actualizar a minha informação?",
    a: "Contacta-nos por WhatsApp ou email e atualizamos os teus dados em menos de 24 horas.",
  },
];

const SupportTab = () => (
  <div className="space-y-8 max-w-2xl">
    <div>
      <h2 className="font-display text-xl text-foreground">Estamos aqui para ajudar</h2>
      <p className="text-muted-foreground text-sm mt-1">Escolhe a forma de contacto que preferires</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {CONTACTS.map(c => (
        <a
          key={c.label}
          href={c.href}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card p-5 text-center hover:border-primary/30 transition-all group"
        >
          <c.icon size={28} className={`mx-auto mb-3 ${c.color} group-hover:scale-110 transition-transform`} />
          <div className="text-foreground font-medium text-sm">{c.label}</div>
          <div className="text-muted-foreground text-xs mt-1">{c.desc}</div>
        </a>
      ))}
    </div>

    <div className="glass-card p-6">
      <h3 className="text-foreground font-medium text-sm mb-4">Perguntas Frequentes</h3>
      <Accordion type="single" collapsible className="w-full">
        {FAQS.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-border">
            <AccordionTrigger className="text-foreground text-sm hover:text-accent">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </div>
);

export default SupportTab;
