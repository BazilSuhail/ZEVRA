import React from 'react';
import { motion, Variants } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';

// Path animation configuration for stroke drawing & infinite floating loop
const pathVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 2.5, ease: "easeInOut" },
      opacity: { duration: 0.5 }
    }
  }
};

const floatVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const Hero: React.FC = () => {
  return (
    <div className="w-full text-white font-sans flex flex-col justify-between p-4 md:p-8">
      {/* Main Grid Content */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto my-auto py-8">

        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 max-w-xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">
              Find The <span className="text-[#ccff00]">Home</span><br />
              Of Your Own<br />
              Choice
            </h1>

            <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-md">
              Dive into a treasure trove of languages from around the globe. Uncover the intricate beauty of languages spoken by millions.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button className="bg-[#ccff00] text-black font-semibold px-6 py-3 rounded-full hover:bg-lime-400 transition-colors">
                Explore Now
              </button>
              <button className="bg-[#ccff00] text-black p-3.5 rounded-full hover:bg-lime-400 transition-colors">
                <FiArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Bottom Left SVG Illustration Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="rounded-3xl border border-white/10 p-6 h-64 md:h-72 w-full max-w-xl relative flex items-center justify-center overflow-hidden"
          >
            <motion.svg
              variants={floatVariants}
              animate="animate"
              viewBox="0 0 500 200"
              className="w-full h-full stroke-[#ccff00] fill-none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Animated Houses Vector */}
              <motion.path
                variants={pathVariants}
                d="M30 140 L70 90 L110 140 Z M50 140 L50 115 L90 115 L90 140"
              />
              <motion.path
                variants={pathVariants}
                d="M130 140 L180 60 L230 140 Z M155 140 L155 95 L205 95 L205 140"
              />
              <motion.path
                variants={pathVariants}
                d="M250 140 L300 75 L350 140 Z M275 140 L275 100 L325 100 L325 140"
              />
              <motion.path
                variants={pathVariants}
                d="M370 140 L410 90 L450 140 Z M390 140 L390 115 L430 115 L430 140"
              />
              <motion.path
                variants={pathVariants}
                d="M10 145 H490"
              />
            </motion.svg>
          </motion.div>
        </div>

        {/* Right Column (Animated Architectural SVG Card) */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="lg:col-span-5 rounded-3xl border border-white/10 relative min-h-[500px] lg:min-h-[650px] flex flex-col justify-between p-8 overflow-hidden"
        >
          {/* Continuous Drawing SVG Background Graphic */}
          <div className="absolute inset-0 p-8 flex items-center justify-center">
            <motion.svg
              variants={pulseVariants}
              animate="animate"
              viewBox="0 0 400 500"
              className="w-full h-full stroke-white/40 fill-none"
              strokeWidth="1.5"
            >
              <motion.path
                variants={pathVariants}
                d="M50 450 V 100 L 200 30 L 350 100 V 450 Z"
              />
              <motion.path
                variants={pathVariants}
                d="M90 450 V 140 H 310 V 450"
              />
              <motion.path
                variants={pathVariants}
                stroke="#ccff00"
                d="M130 200 H 170 V 250 H 130 Z M230 200 H 270 V 250 H 230 Z"
              />
              <motion.path
                variants={pathVariants}
                stroke="#ccff00"
                d="M130 300 H 170 V 350 H 130 Z M230 300 H 270 V 350 H 230 Z"
              />
              <motion.path
                variants={pathVariants}
                d="M170 450 V 390 H 230 V 450"
              />
            </motion.svg>
          </div>

          {/* Overlay Text Content */}
          <div className="relative z-10 space-y-4 mt-auto">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-gray-200 tracking-wide">
              Real Estate
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-white">
              Buying and selling real estate properties.
            </h2>
            <p className="text-gray-300 text-sm max-w-sm">
              We understand that every learner is unique.
            </p>
          </div>
        </motion.div>

      </main>

      {/* Bottom Accent Line */}
      <div className="w-full h-1 bg-[#ccff00] rounded-full mt-4" />
    </div>
  );
};

export default Hero;
