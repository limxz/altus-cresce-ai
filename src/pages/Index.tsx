import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ROICalculator from "@/components/ROICalculator";
import WhatsAppDemo from "@/components/WhatsAppDemo";

import SocialProof from "@/components/SocialProof";
import ResultsNew from "@/components/ResultsNew";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import AltusFAQ from "@/components/AltusFAQ";
import AIDiagnostic from "@/components/AIDiagnostic";
import FinalCTA from "@/components/FinalCTA";
import AltusFooter from "@/components/AltusFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay mesh-gradient-bg">
      <Helmet>
        <title>Altus Media — Agência de Marketing com IA em Portugal</title>
        <meta name="description" content="Mais clientes para o teu negócio com inteligência artificial. Gestão de redes sociais, Meta & Google Ads e automações com IA em Portugal." />
        <link rel="canonical" href="https://altusmedia.pt/" />
        <meta property="og:title" content="Altus Media — Agência de Marketing com IA em Portugal" />
        <meta property="og:description" content="Mais clientes para o teu negócio com inteligência artificial. Gestão de redes sociais, Meta & Google Ads e automações com IA em Portugal." />
        <meta property="og:url" content="https://altusmedia.pt/" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      <Hero />
      <div className="section-glow-purple"><SocialProof /></div>
      <div className="section-glow-blue"><ROICalculator /></div>
      <div className="section-glow-purple"><AIDiagnostic /></div>
      <div className="section-glow-cyan"><WhatsAppDemo /></div>
      <div className="section-glow-right"><Services /></div>
      <div className="section-glow-left"><HowItWorks /></div>
      <div className="section-glow-center"><AltusFAQ /></div>
      <div className="section-glow-purple"><FinalCTA /></div>
      <AltusFooter />
    </div>
  );
};

export default Index;
