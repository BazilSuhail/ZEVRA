"use client";

import { motion } from "motion/react";
import { FiStar, FiShield } from "react-icons/fi";

const testimonials = [
  {
    name: "Sarah K.",
    role: "Journalist",
    quote:
      "Zevra is the only encrypted chat app I trust for sensitive source communications. The zero-knowledge architecture gives me absolute peace of mind.",
  },
  {
    name: "Mike R.",
    role: "Senior Security Developer",
    quote:
      "Finally, a chat platform that takes E2EE seriously without sacrificing user experience. The SRP-6a authentication and instant WebSockets are flawless.",
  },
  {
    name: "Elena V.",
    role: "Privacy Activist",
    quote:
      "End-to-end encryption should be mandatory for everyone. Zevra makes it accessible through real cryptographic standards and complete code transparency.",
  },
];

export default function Testimonials() {
  return (
    <section className="relative z-10 px-6 sm:px-8 py-28 sm:py-36 text-purple-50" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto space-y-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center space-y-5 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/60 text-purple-300 text-xs font-semibold uppercase tracking-widest backdrop-blur-md">
            <FiShield className="w-4 h-4 text-purple-400" />
            <span>User Reviews</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Privacy-Conscious
            </span>{" "}
            Users
          </h2>

          <p className="text-purple-200/80 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            See why security researchers, developers, and privacy advocates rely on Zevra Chat every day.
          </p>
        </motion.div>

        <div className="grid gap-10 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.18, ease: "easeOut" }}
              whileHover={{ y: -8 }}
              className="neumorphic-card-dark neumorphic-card-dark-hover rounded-3xl p-8 sm:p-10 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex gap-1.5">
                  {[...Array(5)].map((_, j) => (
                    <FiStar
                      key={j}
                      className="h-4 w-4 fill-purple-400 text-purple-400"
                    />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-purple-200/85 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-purple-500/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-purple-500/30 bg-purple-950/80 text-purple-300 font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-bold text-white text-base">{t.name}</p>
                  <p className="text-xs text-purple-300/70">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
