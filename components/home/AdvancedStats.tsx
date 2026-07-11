"use client";

import React, { useRef } from "react";
import { motion } from "motion/react";
import { TimelineAnimation } from "@/components/animations/TimelineAnimation";
import { FiUsers, FiArrowUp, FiArrowDown } from "react-icons/fi";

const kpis = [
  { label: "Encrypted Messages", value: "10.2M", change: "+18.3%", status: "up" },
  { label: "Active Sessions", value: "52,410", change: "+6.7%", status: "up" },
  { label: "Avg Latency", value: "8ms", change: "-12.4%", status: "down" },
  { label: "Uptime", value: "99.99%", change: "+0.01%", status: "up" },
];

const chartData = [35, 52, 45, 70, 58, 80, 65, 90, 75, 95, 85, 100];

function MiniBarChart() {
  return (
    <div className="flex items-end gap-2 h-48 w-full mt-6">
      {chartData.map((val, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 rounded-t-md origin-bottom"
          style={{
            height: `${val}%`,
            background: `linear-gradient(to top, rgba(99,102,241,0.6), rgba(168,85,247,0.4))`,
          }}
        />
      ))}
    </div>
  );
}

export default function AdvancedStats() {
  const timelineRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={timelineRef}
      className="relative z-10 flex flex-col gap-8 py-20 sm:py-28 px-6 sm:px-8"
      suppressHydrationWarning
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Section */}
          <TimelineAnimation
            animationNum={1}
            timelineRef={timelineRef}
            className="lg:col-span-2 p-8 rounded-3xl bg-[#130e24]/80 backdrop-blur-xl"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mb-1">
                Protocol Metrics
              </p>
              <h4 className="text-2xl font-bold tracking-tight text-white">
                Message Throughput
              </h4>
            </div>
            <MiniBarChart />
            <div className="flex justify-between mt-4 text-xs text-purple-300/60 font-mono">
              <span>Jan</span>
              <span>Mar</span>
              <span>Jun</span>
              <span>Sep</span>
              <span>Dec</span>
            </div>
          </TimelineAnimation>

          {/* Breakdown Section */}
          <div className="flex flex-col gap-6">
            <TimelineAnimation
              animationNum={2}
              timelineRef={timelineRef}
              className="p-6 rounded-3xl h-full bg-gradient-to-br from-[#1a1040] to-[#0d0820] flex flex-col justify-between"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400 mb-2">
                  Primary Goal
                </p>
                <h4 className="text-xl font-bold tracking-tight text-white">
                  Sovereign Encryption
                </h4>
              </div>
              <div className="mt-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-semibold tracking-tighter text-white">
                    96%
                  </span>
                  <span className="text-xs font-medium text-purple-400 mb-1">
                    Target: 100%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-purple-950/60 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "96%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full"
                  />
                </div>
              </div>
            </TimelineAnimation>

            <TimelineAnimation
              animationNum={3}
              timelineRef={timelineRef}
              className="p-6 rounded-3xl h-full bg-[#130e24]/80 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="size-8 rounded-lg bg-purple-950/60 flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-purple-300" />
                </div>
                <h4 className="font-bold text-white">User Growth</h4>
              </div>
              <p className="text-sm text-purple-200/70">
                Organic adoption is up{" "}
                <span className="text-white font-semibold">24%</span>{" "}
                compared to last quarter.
              </p>
            </TimelineAnimation>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          {kpis.map((kpi, index) => (
            <TimelineAnimation
              animationNum={4 + index}
              timelineRef={timelineRef}
              key={kpi.label}
              className="p-6 rounded-2xl bg-[#130e24]/80 backdrop-blur-xl transition-colors hover:bg-[#1a1040]/80"
            >
              <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">
                {kpi.label}
              </p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-white tracking-tighter">
                  {kpi.value}
                </p>
                <span
                  className="flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: kpi.status === "up" ? "#34d399" : "#f87171",
                    background: kpi.status === "up" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                  }}
                >
                  {kpi.status === "up" ? (
                    <FiArrowUp className="w-3 h-3" />
                  ) : (
                    <FiArrowDown className="w-3 h-3" />
                  )}
                  {kpi.change}
                </span>
              </div>
            </TimelineAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
