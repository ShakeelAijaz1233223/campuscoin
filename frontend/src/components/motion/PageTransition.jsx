import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { pageVariants } from '../../motion/variants';

export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={reduce ? undefined : pageVariants}
        initial={reduce ? false : 'initial'}
        animate="animate"
        exit={reduce ? undefined : 'exit'}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
