'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MotionValue = any;

interface RotatingTextProps {
  texts?: string[];
  transition?: MotionValue;
  initial?: MotionValue;
  animate?: MotionValue;
  exit?: MotionValue;
  animatePresenceMode?: 'sync' | 'wait' | 'popLayout';
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center';
  loop?: boolean;
  auto?: boolean;
  splitBy?: 'characters' | 'lines' | string;
  onNext?: ((index: number) => void) | null;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
  className?: string;
}

interface WordObj {
  characters: string[];
  needsSpace: boolean;
}

interface RotatingTextHandle {
  next: () => void;
}

const RotatingText = forwardRef<RotatingTextHandle, RotatingTextProps>(
  (props, ref) => {
    const {
      texts = [],
      transition = { type: 'spring', damping: 25, stiffness: 300 },
      initial = { y: '100%', opacity: 0 },
      animate = { y: 0, opacity: 1 },
      exit = { y: '-120%', opacity: 0 },
      animatePresenceMode = 'popLayout',
      animatePresenceInitial = false,
      rotationInterval = 3600,
      staggerDuration = 0,
      staggerFrom = 'first',
      loop = true,
      auto = true,
      splitBy = 'characters',
      onNext = null,
      mainClassName = '',
      splitLevelClassName = '',
      elementLevelClassName = '',
      className,
      ...rest
    } = props;

    const [currentTextIndex, setCurrentTextIndex] = useState(0);

    const splitIntoCharacters = useCallback((text: string): string[] => {
      if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        const segmenter = new (Intl as unknown as { Segmenter: new (locale: string, options: { granularity: string }) => { segment(text: string): Iterable<{ segment: string }> } }).Segmenter('en', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(text), ({ segment }) => segment);
      }
      return Array.from(text);
    }, []);

    const elements = useMemo((): WordObj[] => {
      const currentText = texts[currentTextIndex] ?? '';

      if (splitBy === 'characters') {
        return currentText.split(' ').map((word, index, array) => ({
          characters: splitIntoCharacters(word),
          needsSpace: index !== array.length - 1
        }));
      }

      return currentText.split(splitBy).map((part, index, array) => ({
        characters: [part],
        needsSpace: index !== array.length - 1
      }));
    }, [texts, currentTextIndex, splitBy, splitIntoCharacters]);

    const getStaggerDelay = useCallback((charIndex: number, totalChars: number): number => {
      if (staggerDuration === 0) return 0;

      switch (staggerFrom) {
        case 'last':
          return (totalChars - 1 - charIndex) * staggerDuration;
        case 'center': {
          const centerIndex = Math.floor(totalChars / 2);
          return Math.abs(centerIndex - charIndex) * staggerDuration;
        }
        case 'first':
        default:
          return charIndex * staggerDuration;
      }
    }, [staggerFrom, staggerDuration]);

    const handleNext = useCallback(() => {
      setCurrentTextIndex((prevIndex) => {
        const nextIndex = prevIndex === texts.length - 1 ? (loop ? 0 : prevIndex) : prevIndex + 1;
        if (onNext && nextIndex !== prevIndex) {
          onNext(nextIndex);
        }
        return nextIndex;
      });
    }, [texts.length, loop, onNext]);

    useEffect(() => {
      if (!auto || texts.length === 0) return;

      const intervalId = setInterval(handleNext, rotationInterval);
      return () => clearInterval(intervalId);
    }, [handleNext, rotationInterval, auto, texts.length]);

    useImperativeHandle(ref, () => ({ next: handleNext }), [handleNext]);

    const currentText = texts[currentTextIndex] ?? '';

    return (
      <motion.span
        transition={transition}
        className={cn(
          'relative inline-flex flex-col items-start justify-center overflow-hidden',
          mainClassName,
          className
        )}
        {...rest}
      >
        <span className="sr-only">{currentText}</span>

        <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
          <motion.span
            key={currentTextIndex}
            initial={initial}
            animate={animate}
            exit={exit}
            transition={transition}
            className={cn(
              'inline-flex flex-wrap whitespace-pre-wrap relative',
              splitBy === 'lines' && 'flex-col w-full'
            )}
          >
            {elements.map((wordObj, wordIndex, array) => {
              const previousCharsCount = array
                .slice(0, wordIndex)
                .reduce((sum, word) => sum + word.characters.length, 0);

              const totalChars = array.reduce((sum, word) => sum + word.characters.length, 0);

              return (
                <span key={wordIndex} className={cn('inline-flex', splitLevelClassName)}>
                  {wordObj.characters.map((char, charIndex) => (
                    <motion.span
                      key={charIndex}
                      initial={initial}
                      animate={animate}
                      exit={exit}
                      transition={{
                        ...transition,
                        delay: getStaggerDelay(previousCharsCount + charIndex, totalChars)
                      }}
                      className={cn('inline-block', elementLevelClassName)}
                    >
                      {char}
                    </motion.span>
                  ))}
                  {wordObj.needsSpace && <span className="whitespace-pre"> </span>}
                </span>
              );
            })}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    );
  }
);

RotatingText.displayName = 'RotatingText';

export default RotatingText;
