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
        color1="#311075"     // Deep Indigo Purple (original default)
         color2="#6366f1"     // Electric Indigo (original default)
         color3="#a855f7"     // Vivid Purple Glow (original default)
        colorMode="molten"   // Use "frost" for cooler tones or "ember" for warmer
          speed={0.4}
          scale={3}
          detail={3}
          glow={1.4}
          coreSize={0.15}
          swirl={1.8}
          fold={-0.8}
          blackPoint={0.08}
          brightness={1.2}
          grain
          grainIntensity={0.1}
          mouseInteraction
          mouseStrength={0.5}
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
