"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { ReactLenis } from "lenis/react";
import Plasma from "@/components/animations/Plasma";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import ScrollTextSection from "@/components/home/ScrollTextSection";
import StackingCards from "@/components/home/StackingCards";
import AdvancedStats from "@/components/home/AdvancedStats"; 
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
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      <div className="relative min-h-screen text-white  selection:bg-purple-600 selection:text-white ">
        {/* Top Scroll Indicator */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 z-50 origin-left"
          style={{ scaleX }}
        />

        {/* Canvas Plasma Overlay */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          {isMounted && (
            <div
              style={{ width: "100%", height: "600px", position: "relative" }}
            >
              <Plasma
                color="#B497CF"
                speed={2.5}
                direction="forward"
                scale={1.4}
                opacity={0.7}
                mouseInteractive
                renderScale={0.55}
                maxDpr={2}
                targetFps={35}
                iterations={65}
              />
            </div>
          )}
        </div>

        <div className="relative z-10">
          <Navbar />
          <Hero />
          <ScrollTextSection />
          <StackingCards />
          <Features />
          <AdvancedStats /> 
          <CTA />
          <Footer />
        </div>
      </div>
    </ReactLenis>
  );
}
