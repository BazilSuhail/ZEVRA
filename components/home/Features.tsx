"use client";

import { motion } from "motion/react";
import { FiLock, FiShield, FiZap } from "react-icons/fi";

const features = [
  { icon: FiLock, title: "E2E Encrypted", desc: "Only you and your recipient can read messages. End-to-end encryption by default." },
  { icon: FiShield, title: "Zero Knowledge", desc: "We never see your data. Privacy by design, not as an afterthought." },
  { icon: FiZap, title: "Lightning Fast", desc: "Instant message delivery with modern global infrastructure." },
];

export default function Features() {
  return (
    <section className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-4 text-center text-3xl font-bold"
        >
          Why Zevra?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-12 text-center text-zinc-400"
        >
          Built for people who care about their privacy
        </motion.p>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <f.icon className="mb-4 h-8 w-8 text-emerald-400" />
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-zinc-300">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
