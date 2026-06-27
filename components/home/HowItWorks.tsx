"use client";

import { motion } from "motion/react";
import { FiMessageSquare, FiLock, FiCheckCircle } from "react-icons/fi";

const steps = [
  { icon: FiMessageSquare, step: "01", title: "Send a Message", desc: "Type your message and hit send. It's encrypted instantly on your device." },
  { icon: FiLock, step: "02", title: "Encrypted in Transit", desc: "Your message travels encrypted. No one can read it — not even us." },
  { icon: FiCheckCircle, step: "03", title: "Decrypted by Recipient", desc: "Only the intended recipient can decrypt and read your message." },
];

export default function HowItWorks() {
  return (
    <section className="relative z-10 px-6 py-24">
      <div className="w-full">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-4 text-center text-3xl font-bold"
        >
          How It Works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-12 text-center text-zinc-400"
        >
          Simple, secure, private
        </motion.p>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <s.icon className="h-7 w-7 text-emerald-400" />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Step {s.step}</p>
              <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
              <p className="text-sm text-zinc-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
