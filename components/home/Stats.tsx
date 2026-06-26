"use client";

import { motion } from "motion/react";
import { FiUsers, FiMessageSquare, FiGlobe } from "react-icons/fi";

const stats = [
  { icon: FiUsers, value: "50K+", label: "Active Users" },
  { icon: FiMessageSquare, value: "10M+", label: "Messages Sent" },
  { icon: FiGlobe, value: "120+", label: "Countries" },
];

export default function Stats() {
  return (
    <section className="relative z-10 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <s.icon className="mx-auto mb-3 h-6 w-6 text-emerald-400" />
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-zinc-400">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
