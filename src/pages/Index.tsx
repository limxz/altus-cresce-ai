import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ROICalculator from "@/components/ROICalculator";
import WhatsAppDemo from "@/components/WhatsAppDemo";
import UrgencySection from "@/components/UrgencySection";
import AuditWidget from "@/components/AuditWidget";

import SocialProof from "@/components/SocialProof";
import ResultsNew from "@/components/ResultsNew";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import AltusFAQ from "@/components/AltusFAQ";
import FinalCTA from "@/components/FinalCTA";
import AltusFooter from "@/components/AltusFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <Hero />
      <ROICalculator />
      <WhatsAppDemo />
      <UrgencySection />
      <AuditWidget />
      
      <SocialProof />
      <ResultsNew />
      <Services />
      <HowItWorks />
      <AltusFAQ />
      <FinalCTA />
      <AltusFooter />
    </div>
  );
};

export default Index;
