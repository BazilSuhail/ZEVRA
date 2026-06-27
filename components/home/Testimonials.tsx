"use client";

import { motion } from "motion/react";
import { FiStar } from "react-icons/fi";

const testimonials = [
  { name: "Sarah K.", role: "Journalist", quote: "Zevra is the only messaging app I trust for sensitive communications." },
  { name: "Mike R.", role: "Developer", quote: "Finally, a chat app that takes privacy seriously without sacrificing UX." },
  { name: "Elena V.", role: "Activist", quote: "End-to-end encryption should be the default. Zevra makes it happen." },
];

export default function Testimonials() {
  return (
    <section className="relative z-10 px-6 py-24">
      <div className="w-full">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12 text-center text-3xl font-bold"
        >
          Trusted by People Who Care
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <div className="mb-3 flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <FiStar key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-4 text-sm text-zinc-300">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-zinc-500">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
