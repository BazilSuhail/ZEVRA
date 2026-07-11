// @ts-nocheck

'use client';

import { motion, useScroll, useTransform, type HTMLMotionProps } from 'motion/react';
import React, { useRef, type JSX } from 'react';

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

type Direction = 'up' | 'down' | 'left' | 'right';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const generateVariants = (direction: Direction): { hidden: any; visible: any } => {
  const isHorizontal = direction === 'left' || direction === 'right';
  const value = direction === 'right' || direction === 'down' ? 100 : -100;

  return {
    hidden: {
      filter: 'blur(10px)',
      opacity: 0,
      x: isHorizontal ? value : 0,
      y: !isHorizontal ? value : 0,
    },
    visible: {
      filter: 'blur(0px)',
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };
};

const defaultViewport = { amount: 0.4, margin: '0px 0px 0px 0px' };

const TextAnimation = ({
  as = 'h2',
  text,
  classname = '',
  viewport = defaultViewport,
  variants,
  direction = 'down',
  letterAnime = false,
  lineAnime = false,
}: {
  text: string;
  classname?: string;
  as?: keyof JSX.IntrinsicElements;
  viewport?: {
    amount?: number;
    margin?: string;
    once?: boolean;
  };
  variants?: {
    hidden?: any;
    visible?: any;
  };
  direction?: Direction;
  letterAnime?: boolean;
  lineAnime?: boolean;
}) => {
  const baseVariants = variants || generateVariants(direction);
  const modifiedVariants = {
    hidden: baseVariants.hidden,
    visible: {
      ...baseVariants.visible,
    },
  };

  const MotionComponent = motion[as as keyof typeof motion] as React.ComponentType<
    HTMLMotionProps<any>
  >;

  return (
    <MotionComponent
      whileInView="visible"
      initial="hidden"
      variants={containerVariants}
      viewport={viewport}
      className={cn(`inline-block text-foreground uppercase`, classname)}
    >
      {lineAnime ? (
        <motion.span className="inline-block" variants={modifiedVariants}>
          {text}
        </motion.span>
      ) : (
        <>
          {text.split(' ').map((word: string, index: number) => (
            <motion.span
              key={`${word}-${index}`}
              className="inline-block"
              variants={letterAnime === false ? modifiedVariants : {}}
            >
              {letterAnime ? (
                <>
                  {word.split('').map((letter: string, letterIndex: number) => (
                    <motion.span
                      key={letterIndex}
                      className="inline-block"
                      variants={modifiedVariants}
                    >
                      {letter}
                    </motion.span>
                  ))}
                  &nbsp;
                </>
              ) : (
                <>{word}&nbsp;</>
              )}
            </motion.span>
          ))}
        </>
      )}
    </MotionComponent>
  );
};

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  direction: Direction;
  letterAnime?: boolean;
  lineAnime?: boolean;
}

const slidesData: SlideData[] = [
  {
    id: 1,
    title: 'PRIVACY IS NOT A FEATURE.',
    subtitle: 'It is a fundamental human right built into the core.',
    direction: 'down',
    lineAnime: true,
  },
  {
    id: 2,
    title: 'SEALED BY MATHEMATICS.',
    subtitle: 'Zero-knowledge proofs protecting every transaction.',
    direction: 'up',
    letterAnime: true,
  },
  {
    id: 3,
    title: 'ZERO LOGS. ZERO ACCESS.',
    subtitle: 'Your data never leaves your device unencrypted.',
    direction: 'right',
    letterAnime: true,
  },
  {
    id: 4,
    title: 'WELCOME TO ZEVRA.',
    subtitle: 'Experience the future of secure communication.',
    direction: 'left',
    lineAnime: true,
  },
];

export default function HorizontalTextScroll() {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  });

  const endPercentage = -((slidesData.length - 1) / slidesData.length) * 100;
  const x = useTransform(scrollYProgress, [0, 1], ['0%', `${endPercentage}%`]);

  return (
    <div className="w-full">
      <section ref={targetRef} className="relative h-[300vh] w-full">
        <div className="sticky top-0 flex h-screen w-full items-center overflow-clip">
          <motion.div style={{ x }} className="flex h-full w-max">
            {slidesData.map((slide, index) => (
              <SlideItem key={slide.id} slide={slide} index={index} />
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function SlideItem({
  slide,
  index,
}: {
  slide: SlideData;
  index: number;
}) {
  return (
    <section className="flex h-screen w-full shrink-0 flex-col items-center justify-center px-6 md:px-16">
      <div className="z-10 flex max-w-5xl flex-col items-center text-center">
        {/* Index Badge */}
        <span className="mb-4 inline-block font-mono text-sm tracking-widest text-purple-400 uppercase">
          [ 0{index + 1} / 0{slidesData.length} ]
        </span>

        {/* Heading using character/line TextAnimation */}
        <TextAnimation
          text={slide.title}
          direction={slide.direction}
          letterAnime={slide.letterAnime}
          lineAnime={slide.lineAnime}
          classname="text-4xl font-extrabold tracking-tight text-purple-50 sm:text-6xl md:text-8xl"
        />

        {/* Subtitle using word-level TextAnimation */}
        <TextAnimation
          as="p"
          text={slide.subtitle}
          direction="up"
          classname="mt-6 max-w-2xl text-lg text-neutral-400 sm:text-xl md:text-2xl normal-case"
        />
      </div>
    </section>
  );
}