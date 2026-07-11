import { ReactLenis } from "lenis/react";
import ScrollProgress from "@/components/animations/ScrollProgress";
import Plasma from "@/components/animations/Plasma";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";

import StackingCards from "@/components/home/StackingCards";
import AdvancedStats from "@/components/home/AdvancedStats";
import CTA from "@/components/home/CTA";
import Footer from "@/components/home/Footer";
import HorizontalTextScroll from "@/components/home/HorizontalTextScroll";

export default function HomeClient() {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {/* Changed w-screen to w-full and added overflow-x-clip */}
      <div className="relative w-full min-h-screen overflow-x-clip text-white selection:bg-purple-600 selection:text-white">
        <ScrollProgress />

        {/* Canvas Plasma Overlay */}
        <div className="fixed inset-0 z-0 pointer-events-none">
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

        <div className="relative z-10">
          <Navbar />
          <Hero />
          <HorizontalTextScroll />
          
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
