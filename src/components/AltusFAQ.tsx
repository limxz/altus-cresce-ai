import { FadeIn } from "./FadeIn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Tenho contrato de fidelização?",
    a: "Não. Trabalhamos mês a mês. Ficas connosco porque estás a ter resultados, não porque assinaste um papel.",
  },
  {
    q: "Quanto tempo demora a ver resultados?",
    a: "Os primeiros leads costumam aparecer nas primeiras 2 a 4 semanas. Resultados consistentes estabilizam entre o 2.º e o 3.º mês.",
  },
  {
    q: "Quanto custa trabalhar com a Altus?",
    a: "Depende dos serviços e do volume de investimento em ads. Numa auditoria gratuita mostramos-te uma proposta transparente adaptada ao teu negócio.",
  },
  {
    q: "Que tipo de negócios aceitam?",
    a: "PME e negócios locais em Portugal — clínicas, ginásios, escolas, imobiliárias, estética, AVAC, restauração, serviços. Se tens clientes, podemos gerar mais.",
  },
  {
    q: "Trabalham em todo o país?",
    a: "Sim. Trabalhamos 100% remoto e servimos negócios em todo o território nacional, do Minho ao Algarve, ilhas incluídas.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Mensalidade fixa por transferência bancária, MB Way ou Stripe. O investimento em anúncios é pago directamente à Meta / Google pela tua conta.",
  },
  {
    q: "Preciso de perceber de marketing?",
    a: "Não. Tratamos de tudo — estratégia, criativos, campanhas, automações e relatórios. Tu só precisas de fechar os clientes que te chegam.",
  },
];

const AltusFAQ = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <FadeIn className="text-center mb-16">
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Perguntas <em className="text-gradient not-italic">frequentes</em>
          </h2>
        </FadeIn>

        <FadeIn>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-[14px] px-6 border overflow-hidden transition-colors duration-200 data-[state=open]:border-primary/30"
                style={{ background: "rgba(28,24,41,0.4)", borderColor: "hsl(var(--border-subtle))" }}
              >
                <AccordionTrigger className="text-foreground text-left font-medium text-[0.9375rem] hover:text-accent transition-colors duration-200 py-5 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
};

export default AltusFAQ;
