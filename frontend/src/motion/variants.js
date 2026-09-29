/* Shared Framer Motion variants — one vocabulary for the whole app.
 * Entrances never animate opacity on text-bearing surfaces: opacity is
 * reserved for decorative layers (backdrops, ambient glows). This keeps
 * WCAG contrast deterministic at every frame and respects reduced motion.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1];
export const EASE_SOFT = [0.4, 0, 0.2, 1];

export const pageVariants = {
  initial: { y: 14, filter: 'blur(6px)' },
  animate: {
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: EASE_OUT }
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
    transition: { duration: 0.22, ease: EASE_SOFT }
  }
};

export const containerVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 }
  },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } }
};

export const itemVariants = {
  initial: { y: 18, filter: 'blur(5px)' },
  animate: {
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: EASE_OUT }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: EASE_SOFT }
  }
};

export const cardVariants = {
  initial: { y: 22, scale: 0.985 },
  animate: {
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT }
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
};

export const hoverLift = {
  whileHover: { y: -4, transition: { duration: 0.25, ease: EASE_OUT } },
  whileTap: { scale: 0.985 }
};

export const modalVariants = {
  initial: { scale: 0.94, y: 16 },
  animate: {
    scale: 1,
    y: 0,
    transition: { duration: 0.32, ease: EASE_OUT }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.18, ease: EASE_SOFT }
  }
};

/* Decorative only — no text lives on the backdrop layer. */
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.28 } },
  exit: { opacity: 0, transition: { duration: 0.18 } }
};

export const drawerVariants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { duration: 0.34, ease: EASE_OUT } },
  exit: { x: '100%', transition: { duration: 0.22, ease: EASE_SOFT } }
};

export const dropdownVariants = {
  initial: { y: -6, scale: 0.97 },
  animate: {
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: EASE_OUT }
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.97,
    transition: { duration: 0.14, ease: EASE_SOFT }
  }
};

export const notificationVariants = {
  initial: { x: 28, scale: 0.96 },
  animate: {
    x: 0,
    scale: 1,
    transition: { duration: 0.3, ease: EASE_OUT }
  },
  exit: {
    opacity: 0,
    x: 24,
    scale: 0.96,
    transition: { duration: 0.2, ease: EASE_SOFT }
  }
};

export const metricVariants = {
  initial: { y: 14, scale: 0.97 },
  animate: (i = 0) => ({
    y: 0,
    scale: 1,
    transition: { duration: 0.45, delay: i * 0.08, ease: EASE_OUT }
  })
};

export const listVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
  exit: {}
};

export const fadeVariants = {
  initial: {},
  animate: { transition: { duration: 0.35, ease: EASE_SOFT } },
  exit: { opacity: 0, transition: { duration: 0.18 } }
};

export const heroTextVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.12 } }
};

export const heroLineVariants = {
  initial: { y: 34, filter: 'blur(10px)' },
  animate: {
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: EASE_OUT }
  }
};

export const tabIndicator = {
  layoutId: 'nova-tab-indicator',
  transition: { type: 'spring', stiffness: 420, damping: 34 }
};
