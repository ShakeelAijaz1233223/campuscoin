import { motion, useReducedMotion, useInView, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import clsx from 'clsx';
import {
  pageVariants,
  containerVariants,
  itemVariants,
  cardVariants,
  hoverLift,
  modalVariants,
  backdropVariants,
  metricVariants,
  heroTextVariants,
  heroLineVariants,
  EASE_OUT
} from '../../motion/variants';

/* ---------- motion primitives ---------- */

export function PageEnter({ children, className }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerGroup({ children, className, delay = 0 }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delayChildren: delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...rest }) {
  return (
    <motion.div variants={itemVariants} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

export function FadeIn({ children, className, delay = 0, y = 16 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({ children, className, ...rest }) {
  return (
    <motion.div variants={hoverLift} whileHover="whileHover" whileTap="whileTap" className={className} {...rest}>
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className, delay = 0 }) {
  return (
    <motion.div
      variants={metricVariants}
      custom={delay}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ModalMotion({ children, className }) {
  return (
    <motion.div variants={modalVariants} initial="initial" animate="animate" exit="exit" className={className}>
      {children}
    </motion.div>
  );
}

export function BackdropMotion({ children, className, onClick }) {
  return (
    <motion.div
      variants={backdropVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Aceternity-inspired visuals ---------- */

export function GradientText({ children, className, as: Tag = 'span' }) {
  return <Tag className={clsx('nova-gradient-text', className)}>{children}</Tag>;
}

export function ShimmerText({ children, className, as: Tag = 'span' }) {
  return <Tag className={clsx('nova-shimmer-text', className)}>{children}</Tag>;
}

export function GridPattern({ className, style }) {
  return <div aria-hidden="true" className={clsx('nova-grid', className)} style={style} />;
}

/** Card with cursor-tracking spotlight + optional moving border. */
export function SpotlightCard({ children, className, moving = false, ...rest }) {
  const ref = useRef(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--sx', `${e.clientX - r.left}px`);
        el.style.setProperty('--sy', `${e.clientY - r.top}px`);
      }}
      className={clsx('nova-glass nova-edge nova-spotlight-target', moving && 'nova-moving-border', className)}
      {...rest}
    >
      <div className="nova-spotlight" aria-hidden="true" />
      {children}
    </div>
  );
}

export function BentoCard({ children, className, span = 4, ...rest }) {
  const spans = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12'
  };
  return (
    <motion.div variants={cardVariants} className={clsx(spans[span], className)} {...rest}>
      <SpotlightCard className="h-full">{children}</SpotlightCard>
    </motion.div>
  );
}

export function MovingBorderButton({ children, className, variant = 'primary', ...props }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={clsx('nova-btn', variant === 'primary' ? 'nova-btn-primary' : 'nova-btn-ghost', className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** Metric card with animated count-up feel via stagger + gold money text. */
export function MetricCard({ label, value, caption, icon: Icon, tone = 'aurora', index = 0, action }) {
  const toneMap = {
    aurora: 'text-[var(--accent)]',
    gold: 'text-[var(--gold)]',
    jade: 'text-[var(--success)]',
    ember: 'text-[var(--danger)]',
    violet: 'text-[var(--purple)]'
  };
  return (
    <motion.div custom={index} variants={metricVariants} initial="initial" animate="animate">
      <SpotlightCard className="h-full">
        <div className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
            {Icon && (
              <span className={clsx('rounded-xl border border-[var(--border)] bg-white/[0.03] p-2', toneMap[tone])}>
                <Icon size={16} />
              </span>
            )}
          </div>
          <p className="text-[1.75rem] font-bold leading-none tracking-tight text-[var(--heading)]">{value ?? '—'}</p>
          {caption && <p className="mt-auto text-xs text-[var(--dim)]">{caption}</p>}
          {action}
        </div>
      </SpotlightCard>
    </motion.div>
  );
}

/** Cinematic hero wrapper with parallax aurora + grid + staggered text. */
export function HeroStage({ children, className, compact = false }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.25]);
  return (
    <section ref={ref} className={clsx('relative overflow-hidden', className)}>
      <motion.div style={{ y, opacity }} aria-hidden="true" className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 55% at 80% 20%, rgba(120,90,235,0.22), transparent 65%), radial-gradient(ellipse 55% 50% at 12% 85%, rgba(45,170,220,0.16), transparent 65%)'
          }}
        />
        <GridPattern className="absolute inset-0" />
        <div
          className={clsx('absolute -right-24 top-0 h-72 w-72 rounded-full blur-3xl', compact && 'opacity-70')}
          style={{ background: 'radial-gradient(closest-side, rgba(167,139,250,0.22), transparent)' }}
        />
        <div
          className="absolute -left-20 bottom-0 h-64 w-64 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(103,232,249,0.16), transparent)' }}
        />
      </motion.div>
      <motion.div
        variants={heroTextVariants}
        initial="initial"
        animate="animate"
        className="relative"
      >
        {children}
      </motion.div>
    </section>
  );
}

export function HeroLine({ children, className, as: Tag = 'div' }) {
  return (
    <motion.div variants={heroLineVariants}>
      <Tag className={className}>{children}</Tag>
    </motion.div>
  );
}

/** Section heading: eyebrow + title + description with scroll reveal. */
export function SectionHeading({ eyebrow, title, description, className, align = 'left' }) {
  return (
    <FadeIn className={clsx(align === 'center' && 'text-center', className)}>
      {eyebrow && <p className="nova-eyebrow mb-3">{eyebrow}</p>}
      {title && <h2 className="nova-section-title text-[var(--heading)]">{title}</h2>}
      {description && <p className="mt-3 max-w-2xl text-[var(--muted)]">{description}</p>}
    </FadeIn>
  );
}

/** Empty-state visual with animated orb + message + action. */
export function EmptyVisual({ title, description, action, icon: Icon }) {
  return (
    <motion.div
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="nova-glass-soft mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center"
    >
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-white/[0.04]"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl blur-xl"
          style={{ background: 'radial-gradient(closest-side, var(--accent-glow), transparent)' }}
        />
        {Icon && <Icon size={26} className="text-[var(--accent)]" />}
      </motion.div>
      <div>
        <p className="font-semibold text-[var(--heading)]">{title}</p>
        {description && <p className="mt-1.5 text-sm text-[var(--muted)]">{description}</p>}
      </div>
      {action}
    </motion.div>
  );
}

/** Reveal-on-scroll for dashboards/stat blocks. */
export function ViewportReveal({ children, className, amount = 0.15 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount });
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.55, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Skeleton({ className }) {
  return <div className={clsx('nova-skeleton', className)} aria-hidden="true" />;
}

export { hoverLift, cardVariants, itemVariants, containerVariants, pageVariants, modalVariants, backdropVariants, metricVariants };
