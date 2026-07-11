"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import Plasma from "@/components/animations/Plasma";
import Navbar from "@/components/layout/Navbar";

export default function NotFound() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-white selection:bg-purple-600 selection:text-white">
      {/* Plasma Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {isMounted && (
          <div className="w-full h-full relative">
            <Plasma
              color="#B497CF"
              speed={2}
              direction="pingpong"
              scale={1.4}
              opacity={0.6}
              mouseInteractive
              renderScale={0.55}
              maxDpr={2}
              targetFps={35}
              iterations={65}
            />
          </div>
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none z-[1]" />

      {/* Navbar */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-20">
        {/* Floating glass shards */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ y: [-10, 10, -10], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[10%] top-[20%] h-24 w-16 rounded-2xl border border-purple-500/10 bg-purple-500/5 backdrop-blur-sm rotate-[-15deg]"
          />
          <motion.div
            animate={{ y: [8, -12, 8], rotate: [0, -8, 4, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute right-[15%] top-[30%] h-20 w-12 rounded-xl border border-indigo-500/10 bg-indigo-500/5 backdrop-blur-sm rotate-[20deg]"
          />
          <motion.div
            animate={{ y: [-6, 14, -6], rotate: [0, 3, -6, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute left-[20%] bottom-[25%] h-16 w-20 rounded-2xl border border-purple-400/10 bg-purple-400/5 backdrop-blur-sm rotate-[10deg]"
          />
          <motion.div
            animate={{ y: [5, -8, 5], x: [-3, 3, -3] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute right-[10%] bottom-[35%] h-14 w-14 rounded-full border border-indigo-400/10 bg-indigo-400/5 backdrop-blur-sm"
          />
        </div>

        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <h1 className="text-[140px] sm:text-[200px] md:text-[260px] font-bold leading-none tracking-tighter text-white/[0.06] select-none">
            404
          </h1>

          {/* Glowing orb behind 404 */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-purple-600/20 blur-[80px]"
          />
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-5 -mt-10"
        >
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-3xl sm:text-4xl font-semibold tracking-tight text-white"
          >
            Page not found
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="max-w-md text-center text-sm sm:text-base text-white/50 leading-relaxed"
          >
            The destination you are trying to reach does not exist, has been moved,
            or is temporarily unavailable.
          </motion.p>

          {/* Separator line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="h-px w-32 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"
          />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-xs text-white/30 tracking-wide"
          >
            ERROR 404 &mdash; ROUTE NOT FOUND
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.95 }}
            className="flex items-center gap-3 mt-2"
          >
            <Link
              href="/"
              className="group relative bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/35 active:scale-95"
            >
              <span className="relative z-10">Back to Home</span>
            </Link>
            <Link
              href="/chat"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/70 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95"
            >
              Open Chat
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
