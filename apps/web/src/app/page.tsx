import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TechStack } from "@/components/landing/tech-stack";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-grid gradient-mesh">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesGrid />
        <HowItWorks />
        <TechStack />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
