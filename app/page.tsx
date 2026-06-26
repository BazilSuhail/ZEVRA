"use client";

import MoltenMetal from "@/components/animations/MoltenMetal";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import HowItWorks from "@/components/home/HowItWorks";
import Stats from "@/components/home/Stats";
import Testimonials from "@/components/home/Testimonials";
import CTA from "@/components/home/CTA";
import Footer from "@/components/home/Footer";

export default function HomePage() {
  return (
    <div className="relative min-h-screen text-white">
      {/* MoltenMetal BG - full screen, fixed */}
      <div className="fixed inset-0 z-0">
        <MoltenMetal
          color1="#064e3b"
          color2="#10b981"
          color3="#ffffff"
          speed={0.3}
          scale={3}
          detail={3}
          glow={1.4}
          coreSize={0.12}
          swirl={0.8}
          fold={-0.15}
          blackPoint={0.08}
          brightness={1.2}
          colorMode="molten"
          grain
          grainIntensity={0.04}
          mouseInteraction
          mouseStrength={0.25}
          opacity={1}
        />
      </div>

      {/* All content on top */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <Testimonials />
        <CTA />
        <Footer />
      </div>
    </div>
  );
}
