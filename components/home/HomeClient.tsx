"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import MoltenMetal from "@/components/animations/MoltenMetal";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import HowItWorks from "@/components/home/HowItWorks";
import Stats from "@/components/home/Stats";
import Testimonials from "@/components/home/Testimonials";
import CTA from "@/components/home/CTA";
import Footer from "@/components/home/Footer";

export default function HomeClient() {
  const [isMounted, setIsMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#070514] text-white overflow-x-hidden selection:bg-purple-600 selection:text-white">
      {/* Top Scroll Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Canvas MoltenMetal Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {isMounted && (
          <MoltenMetal
            color1="#1e0a38"
            color2="#6366f1"
            color3="#a855f7"
            colorMode="molten"
            speed={0.35}
            scale={2.8}
            detail={3}
            glow={1.3}
            coreSize={0.15}
            swirl={1.8}
            fold={-0.8}
            blackPoint={0.1}
            brightness={1.1}
            grain
            grainIntensity={0.08}
            mouseInteraction
            mouseStrength={0.4}
            opacity={0.85}
          />
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
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
