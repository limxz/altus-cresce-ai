import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ResultadosReais from "@/components/ResultadosReais";
import SistemaAltus from "@/components/SistemaAltus";
import CaseGracieBarra from "@/components/CaseGracieBarra";
import AgenteIA from "@/components/AgenteIA";
import HowItWorks from "@/components/HowItWorks";
import WhyAltus from "@/components/WhyAltus";
import Tools from "@/components/Tools";
import Testimonials from "@/components/Testimonials";

import AltusFAQ from "@/components/AltusFAQ";
import FinalCTA from "@/components/FinalCTA";
import AltusFooter from "@/components/AltusFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay mesh-gradient-bg">
      <Helmet>
        <title>Altus Media — Geramos clientes para negócios locais em Portugal</title>
        <meta name="description" content="Meta Ads, websites de alta conversão e agentes de IA que respondem, qualificam e agendam clientes automaticamente. Auditoria gratuita." />
        <link rel="canonical" href="https://altusmedia.pt/" />
        <meta property="og:title" content="Altus Media — Geramos clientes para negócios locais" />
        <meta property="og:description" content="Meta Ads, websites de alta conversão e IA que responde aos teus clientes 24/7." />
        <meta property="og:url" content="https://altusmedia.pt/" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      <Hero />
      <div className="section-glow-purple"><ResultadosReais /></div>
      <div className="section-glow-blue"><SistemaAltus /></div>
      <div className="section-glow-purple"><CaseGracieBarra /></div>
      <div className="section-glow-cyan"><AgenteIA /></div>
      <div className="section-glow-left"><HowItWorks /></div>
      <div className="section-glow-right"><WhyAltus /></div>
      <Tools />
      <div className="section-glow-center"><Testimonials /></div>
      
      <div className="section-glow-center"><AltusFAQ /></div>
      <div className="section-glow-purple"><FinalCTA /></div>
      <AltusFooter />
    </div>
  );
};

export default Index;
