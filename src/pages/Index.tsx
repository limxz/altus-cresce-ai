import Navbar from "@/components/Navbar";
import HeroNew from "@/components/HeroNew";
import ROICalculator from "@/components/ROICalculator";
import WhatsAppDemo from "@/components/WhatsAppDemo";
import DiagnosticoSection from "@/components/DiagnosticoSection";
import SocialProof from "@/components/SocialProof";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import Results from "@/components/Results";
import AltusFAQ from "@/components/AltusFAQ";
import FinalCTA from "@/components/FinalCTA";
import AltusFooter from "@/components/AltusFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <HeroNew />
      <ROICalculator />
      <WhatsAppDemo />
      <DiagnosticoSection />
      <SocialProof />
      <Services />
      <HowItWorks />
      <Results />
      <AltusFAQ />
      <FinalCTA />
      <AltusFooter />
    </div>
  );
};

export default Index;
