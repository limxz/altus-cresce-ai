import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SocialProof from "@/components/SocialProof";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Results from "@/components/Results";
import AltusFAQ from "@/components/AltusFAQ";
import FinalCTA from "@/components/FinalCTA";
import AltusFooter from "@/components/AltusFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background noise-overlay">
      <Navbar />
      <Hero />
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
