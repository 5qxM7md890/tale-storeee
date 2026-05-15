'use client';

import {motion} from 'framer-motion';
import clsx from 'clsx';
import * as React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

export function Reveal({children, className, delay = 0, y = 18}: Props) {
  return (
    <motion.div
      className={clsx(className)}
      initial={{opacity: 0, y}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.22}}
      transition={{duration: 0.65, ease: [0.22, 1, 0.36, 1], delay}}
    >
      {children}
    </motion.div>
  );
}

export function RevealStagger({
  children,
  className,
  stagger = 0.10
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={clsx(className)}
      initial="hidden"
      whileInView="show"
      viewport={{once: true, amount: 0.22}}
      variants={{
        hidden: {},
        show: {transition: {staggerChildren: stagger}}
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({children, className, y = 18}: {children: React.ReactNode; className?: string; y?: number}) {
  return (
    <motion.div
      className={clsx(className)}
      variants={{
        hidden: {opacity: 0, y},
        show: {opacity: 1, y: 0, transition: {duration: 0.65, ease: [0.22, 1, 0.36, 1]}}
      }}
    >
      {children}
    </motion.div>
  );
}
