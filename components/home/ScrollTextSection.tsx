'use client';

import TextAnimation from '@/components/animations/TextAnimation';

const radiatingLines = [
  { x2: 1100, y2: 350 },
  { x2: 1033, y2: 100 },
  { x2: 833, y2: -83 },
  { x2: 600, y2: -150 },
  { x2: 367, y2: -83 },
  { x2: 167, y2: 100 },
  { x2: 100, y2: 350 },
  { x2: 167, y2: 600 },
  { x2: 367, y2: 783 },
  { x2: 600, y2: 850 },
  { x2: 833, y2: 783 },
  { x2: 1033, y2: 600 },
];

const dots = [
  { cx: 80, cy: 60, r: 4 }, { cx: 280, cy: 60, r: 7 }, { cx: 480, cy: 60, r: 10 },
  { cx: 680, cy: 60, r: 4 }, { cx: 880, cy: 60, r: 7 }, { cx: 1080, cy: 60, r: 10 },
  { cx: 80, cy: 190, r: 7 }, { cx: 280, cy: 190, r: 10 }, { cx: 480, cy: 190, r: 4 },
  { cx: 680, cy: 190, r: 7 }, { cx: 880, cy: 190, r: 10 }, { cx: 1080, cy: 190, r: 4 },
  { cx: 80, cy: 320, r: 10 }, { cx: 280, cy: 320, r: 4 }, { cx: 480, cy: 320, r: 7 },
  { cx: 680, cy: 320, r: 10 }, { cx: 880, cy: 320, r: 4 }, { cx: 1080, cy: 320, r: 7 },
  { cx: 80, cy: 450, r: 4 }, { cx: 280, cy: 450, r: 7 }, { cx: 480, cy: 450, r: 10 },
  { cx: 680, cy: 450, r: 4 }, { cx: 880, cy: 450, r: 7 }, { cx: 1080, cy: 450, r: 10 },
  { cx: 80, cy: 580, r: 7 }, { cx: 280, cy: 580, r: 10 }, { cx: 480, cy: 580, r: 4 },
  { cx: 680, cy: 580, r: 7 }, { cx: 880, cy: 580, r: 10 }, { cx: 1080, cy: 580, r: 4 },
];

const dotFills = ['#a855f7', '#818cf8', '#c084fc'];

function ScrollTextSection() {
  return (
    <section className="relative z-10 mt-22 lg:my-45">
      {/* Fixed SVG bg — floating circles */}
      <svg className="fixed inset-0 w-screen h-screen opacity-[0.04] pointer-events-none z-0" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
        <circle cx="200" cy="350" r="180" fill="#a855f7" />
        <circle cx="1000" cy="200" r="120" fill="#818cf8" />
        <circle cx="900" cy="550" r="90" fill="#c084fc" />
        <circle cx="100" cy="100" r="60" fill="#6366f1" />
      </svg>

      {/* Block 1 — centered, blur in */}
      <div className="relative h-[70vh] flex justify-center items-center px-6 sm:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <TextAnimation
            text="Privacy is not a feature."
            classname="text-5xl sm:text-7xl md:text-8xl font-bold text-purple-50 text-center max-w-5xl mx-auto"
            direction="down"
            lineAnime
          />
        </div>
      </div>

      {/* Block 2 — left aligned, letter by letter */}
      <div className="relative h-[70vh] flex items-center px-6 sm:px-8">
        {/* SVG bg — wavy lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
          <path d="M 0 350 Q 300 200 600 350 T 1200 350" fill="none" stroke="#a855f7" strokeWidth="3" />
          <path d="M 0 400 Q 300 250 600 400 T 1200 400" fill="none" stroke="#818cf8" strokeWidth="2" />
          <path d="M 0 450 Q 300 300 600 450 T 1200 450" fill="none" stroke="#c084fc" strokeWidth="2" />
          <circle cx="600" cy="350" r="200" fill="none" stroke="#a855f7" strokeWidth="1" />
          <circle cx="600" cy="350" r="260" fill="none" stroke="#818cf8" strokeWidth="0.5" />
        </svg>
        <div className="max-w-7xl mx-auto w-full">
          <TextAnimation
            as="p"
            letterAnime
            text="It is a right."
            classname="text-5xl sm:text-7xl md:text-8xl font-bold text-purple-50 lowercase max-w-3xl"
          />
        </div>
      </div>

      {/* Block 3 — right aligned, direction right */}
      <div className="relative h-[70vh] flex justify-end items-center px-6 sm:px-8">
        {/* SVG bg — scattered dots */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
          {dots.map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={dotFills[i % 3]} />
          ))}
        </svg>
        <div className="max-w-7xl mx-auto w-full flex justify-end">
          <TextAnimation
            text="Sealed by mathematics."
            direction="right"
            classname="text-5xl sm:text-7xl md:text-8xl font-bold text-purple-50 text-right max-w-3xl capitalize"
          />
        </div>
      </div>

      {/* Block 4 — centered, line animation */}
      <div className="relative h-[70vh] flex justify-center items-center px-6 sm:px-8">
        {/* SVG bg — radiating lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
          {radiatingLines.map((l, i) => (
            <line key={i} x1="600" y1="350" x2={l.x2} y2={l.y2} stroke="#a855f7" strokeWidth="1" />
          ))}
          <circle cx="600" cy="350" r="80" fill="none" stroke="#c084fc" strokeWidth="2" />
          <circle cx="600" cy="350" r="140" fill="none" stroke="#818cf8" strokeWidth="1" />
        </svg>
        <div className="max-w-7xl mx-auto w-full">
          <TextAnimation
            text="Zero logs. Zero compromise. Zero access."
            direction="down"
            lineAnime
            classname="text-4xl sm:text-6xl md:text-7xl font-bold text-purple-50 text-center max-w-5xl mx-auto capitalize"
          />
        </div>
      </div>

      {/* Block 5 — final CTA-style, letter anime */}
      <div className="relative lg:mt-[40vh] h-[60vh] flex justify-center items-center pb-20 px-6 sm:px-8">
        {/* SVG bg — glow orb */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="textGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="600" cy="300" r="250" fill="url(#textGlow)" />
          <circle cx="600" cy="300" r="160" fill="none" stroke="#a855f7" strokeWidth="1" />
        </svg>
        <div className="max-w-7xl mx-auto w-full">
          <TextAnimation
            text="Welcome to Zevra."
            classname="text-5xl sm:text-7xl md:text-9xl font-black text-purple-50 text-center max-w-5xl mx-auto"
            direction="up"
            letterAnime
          />
        </div>
      </div>
    </section>
  );
}

export default ScrollTextSection;
