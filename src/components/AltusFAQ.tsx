import { FadeIn } from "./FadeIn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Quanto tempo demora a ver resultados?",
    a: "Normalmente, os primeiros resultados aparecem nas primeiras 2 a 4 semanas. Resultados consistentes e significativos surgem após 2 a 3 meses de trabalho contínuo.",
  },
  {
    q: "Preciso de saber de marketing?",
    a: "Não! Nós tratamos de tudo. Só precisamos que nos dês informações básicas sobre o teu negócio e nós cuidamos de toda a estratégia e execução.",
  },
  {
    q: "Qual é o investimento mínimo?",
    a: "Os nossos pacotes começam nos €297/mês. Cada pacote é personalizado às necessidades do teu negócio para garantir o melhor retorno possível.",
  },
  {
    q: "Trabalham com que tipo de negócios?",
    a: "Trabalhamos com qualquer negócio local — restaurantes, clínicas, ginásios, imobiliárias, lojas e muito mais. Se tens clientes, podemos ajudar-te a ter mais.",
  },
  {
    q: "Como é feito o pagamento?",
    a: "O pagamento é mensal, por transferência bancária, MB Way ou Stripe. Sem contratos de fidelização — ficas connosco porque queres, não porque és obrigado.",
  },
];

const AltusFAQ = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <FadeIn className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4" style={{ fontWeight: 800 }}>
            Perguntas <em className="text-gradient not-italic">frequentes</em>
          </h2>
        </FadeIn>

        <FadeIn>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-[20px] px-6 border border-[#2A2040] bg-[#1C1829] data-[state=open]:border-[rgba(139,92,246,0.3)]"
              >
                <AccordionTrigger className="text-foreground text-left font-medium hover:text-[#A78BFA] transition-colors duration-200 py-5 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[#9CA3AF] leading-relaxed pb-5">
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
