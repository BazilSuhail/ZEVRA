"use client";

import { motion } from "motion/react";
import { FiShield, FiLock, FiGlobe } from "react-icons/fi";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <FiShield className="mx-auto mb-6 h-12 w-12 text-emerald-500" />
          <h1 className="mb-6 text-5xl font-bold">
            About <span className="text-emerald-500">Zevra</span>
          </h1>
          <p className="mb-10 text-lg text-zinc-600 dark:text-zinc-400">
            We believe everyone deserves private, secure communication.
          </p>
        </motion.div>
      </section>

      {/* Mission */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl space-y-12">
          <div className="grid gap-12 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Zevra was created to provide secure, private communication that anyone can use.
                Privacy is a fundamental right, not a luxury.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <h2 className="mb-4 text-2xl font-bold">How It Works</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Every message is encrypted on your device. Only the intended recipient can decrypt it.
                Not us. Not your ISP. No one in between.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: FiLock, title: "Signal Protocol", desc: "Industry-standard encryption for key exchange and messaging." },
              { icon: FiGlobe, title: "Decentralized", desc: "No single point of failure. Your data isn't on one server." },
              { icon: FiShield, title: "Open Source", desc: "Fully auditable code. Trust through transparency." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <f.icon className="mb-4 h-8 w-8 text-emerald-500" />
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
