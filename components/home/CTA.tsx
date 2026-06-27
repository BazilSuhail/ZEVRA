"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { FiArrowRight } from "react-icons/fi";

export default function CTA() {
  return (
    <section className="relative z-10 px-6 py-24">
      <div className="w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-white/10 bg-white/5 p-12 backdrop-blur-sm"
        >
          <h2 className="mb-4 text-3xl font-bold">Ready to take control of your privacy?</h2>
          <p className="mb-8 text-zinc-300">
            Join thousands of people who communicate securely with Zevra.
          </p>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700 mx-auto"
            >
              Get Started Free
              <FiArrowRight className="h-4 w-4" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
