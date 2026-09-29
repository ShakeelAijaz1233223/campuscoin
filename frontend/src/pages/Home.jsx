import { Link } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  ScanLine,
  ShieldCheck,
  ChartNoAxesCombined,
  Wallet,
  Target,
  GraduationCap,
  Plus,
  Minus
} from 'lucide-react';
import Brand from '../components/layout/Brand';
import Footer from '../components/layout/Footer';
import useAuth from '../hooks/useAuth';
import {
  HeroStage,
  HeroLine,
  GradientText,
  SpotlightCard,
  MovingBorderButton,
  SectionHeading,
  FadeIn
} from '../components/ui/Nova';
import { EASE_OUT } from '../motion/variants';

const features = [
  {
    n: '01',
    icon: Wallet,
    title: 'Every rupee, accounted for.',
    text: 'From your monthly allowance to late-night chai. Keep income, expenses and recurring payments in one beautifully clear place.',
    tag: 'TRANSACTIONS & BUDGETS',
    link: '/transactions',
    wide: true
  },
  {
    n: '02',
    icon: Sparkles,
    title: 'A little more perspective.',
    text: 'Turn your spending history into helpful insights. Understand your habits, not just your balance.',
    tag: 'AI-POWERED INSIGHTS',
    link: '/insights'
  },
  {
    n: '03',
    icon: Target,
    title: 'Small steps. Bigger plans.',
    text: 'Set a goal, build a habit, and make room for the things you really want.',
    tag: 'SAVINGS GOALS',
    link: '/goals'
  }
];

const steps = [
  [
    'Make it yours',
    'Create your student profile, set your allowance baseline, and choose what you’re saving for.'
  ],
  [
    'Bring it all together',
    'Add a transaction or import your CSV. Organize your spending with categories and monthly budgets.'
  ],
  [
    'Find your momentum',
    'Explore reports, get monthly insights, and turn small decisions into progress.'
  ]
];

const faqs = [
  [
    'Is CampusCoin a bank?',
    'No. CampusCoin is a personal finance tracking workspace. It does not hold, transfer, or invest your money.'
  ],
  [
    'Can I bring my existing transactions?',
    'Yes. The transaction importer lets you validate and review a CSV, correct rows, review duplicates, and confirm an import through the connected backend.'
  ],
  [
    'How do AI features work?',
    'The connected backend uses your descriptions and financial history to generate suggestions. You can accept or reject a suggested category, and manual categorization is always available.'
  ]
];

export default function Home() {
  const { user } = useAuth();
  const [open, setOpen] = useState(null);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -60]);

  return (
    <div className="landing">
      <header className="landing-nav" style={{ backdropFilter: 'blur(16px) saturate(150%)' }}>
        <Brand />
        <nav aria-label="Public navigation">
          <a href="#features">The experience</a>
          <a href="#how-it-works">How it works</a>
          <Link to="/help">
            Help center <ArrowUpRight size={12} />
          </Link>
        </nav>
        <div className="row">
          <Link className="login-link" to={user ? '/dashboard' : '/login'}>
            {user ? 'Workspace' : 'Log in'}
          </Link>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link className="button primary small" to={user ? '/dashboard' : '/register'}>
              Get started <ArrowUpRight size={16} />
            </Link>
          </motion.div>
        </div>
      </header>

      <main id="main">
        {/* ================= HERO ================= */}
        <HeroStage className="landing-hero">
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'url(/visuals/hero-aurora.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center right',
              opacity: 0.5,
              maskImage: 'linear-gradient(90deg, transparent 0%, black 45%)',
              WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 45%)'
            }}
          />
          <motion.div style={{ y: heroY }} className="hero-copy">
            <HeroLine>
              <div className="pill nova-holo">
                <span className="status-dot" /> A SMARTER START TO STUDENT FINANCE{' '}
                <ArrowUpRight size={13} />
              </div>
            </HeroLine>
            <HeroLine>
              <h1 className="nova-hero-title">
                More life.
                <br />
                Less money
                <br />
                <GradientText>stress.</GradientText>
              </h1>
            </HeroLine>
            <HeroLine>
              <p>
                Your allowance. Your ambitions. Your next chapter.
                <br className="desktop-only" /> Meet the money workspace built for campus life.
              </p>
            </HeroLine>
            <HeroLine>
              <div className="hero-buttons">
                <MovingBorderButton onClick={() => (window.location.href = user ? '/dashboard' : '/register')}>
                  Find your financial flow <ArrowUpRight size={19} />
                </MovingBorderButton>
                <a href="#features" className="text-button nova-focus">
                  Take a closer look <ArrowRight size={17} />
                </a>
              </div>
            </HeroLine>
            <HeroLine>
              <div className="hero-note">
                <ShieldCheck size={16} />
                <span>Your finances, in your control.</span>
                <i />
                <span>Built for students.</span>
              </div>
            </HeroLine>
          </motion.div>

          <div className="hero-art" aria-label="Abstract CampusCoin visual with financial planning highlights">
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.94, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.15 }}
              className="hero-art-frame nova-glass nova-edge"
              style={{ overflow: 'hidden' }}
            >
              <img
                src="/visuals/hero-aurora.jpg"
                alt="Abstract aurora glass shapes representing clarity and momentum in student finances"
                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: EASE_OUT }}
              className="floating-label label-top nova-glass-soft"
            >
              <span className="mini-icon">
                <GraduationCap size={19} />
              </span>
              <div>
                Made for your next chapter
                <small>LESS GUESSWORK. MORE POSSIBILITY.</small>
              </div>
              <span className="tiny-dot" />
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75, ease: EASE_OUT }}
              className="floating-label label-bottom nova-glass-soft"
            >
              <div className="row">
                <span className="mini-icon purple">
                  <Sparkles size={17} />
                </span>
                <span>A clearer picture.</span>
                <ArrowUpRight size={15} />
              </div>
              <p>
                Little insights.
                <br />
                <strong>Lasting money habits.</strong>
              </p>
              <div className="abstract-bars" aria-hidden="true">
                {[26, 40, 34, 56, 47, 68, 61, 84, 76, 99].map((h, i) => (
                  <i key={i} style={{ height: h + '%', animationDelay: i * 90 + 'ms' }} />
                ))}
              </div>
              <small>ILLUSTRATIVE · NOT FINANCIAL DATA</small>
            </motion.div>
          </div>
        </HeroStage>

        {/* ================= VALUE STRIP ================= */}
        <section className="value-strip" aria-label="Core features">
          <span>
            A LITTLE STRUCTURE.
            <br />
            <b>A LOT MORE FREEDOM.</b>
          </span>
          {[
            [ScanLine, 'Effortless tracking', 20],
            [ChartNoAxesCombined, 'Clarity at a glance', 21],
            [Sparkles, 'Intelligent insights', 20],
            [Target, 'Goals with purpose', 20]
          ].map(([Icon, label, size], i) => (
            <FadeIn key={label} delay={i * 0.06}>
              <div>
                <Icon size={size} /> {label}
              </div>
            </FadeIn>
          ))}
        </section>

        {/* ================= BENTO FEATURES ================= */}
        <section id="features" className="landing-section">
          <SectionHeading
            eyebrow="YOUR MONEY, WORKING TOGETHER"
            title={
              <>
                One space.
                <br />
                <span className="muted">A clearer headspace.</span>
              </>
            }
            description={
              <>
                Less spreadsheet energy. More living.
                <br />
                Everything you need to feel on top of your money.
              </>
            }
          />
          <div className="nova-bento" style={{ marginTop: 36 }}>
            {features.map((f, i) => (
              <motion.div
                key={f.n}
                initial={reduce ? false : { opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: EASE_OUT }}
                style={{ gridColumn: f.wide ? 'span 7' : 'span 5' }}
              >
                <Link to={f.link} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                  <SpotlightCard moving={f.wide} className="h-full">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 28, height: '100%' }}>
                      <div className="row between">
                        <span
                          className="feature-icon"
                          style={{
                            background: 'linear-gradient(135deg, rgba(103,232,249,0.14), rgba(167,139,250,0.14))',
                            border: '1px solid rgba(148,180,255,0.18)'
                          }}
                        >
                          <f.icon size={22} />
                        </span>
                        <span className="feature-number">{f.n} /</span>
                      </div>
                      <div className="feature-text">
                        <p className="eyebrow nova-eyebrow">{f.tag}</p>
                        <h3 style={{ fontSize: '1.45rem', letterSpacing: '-0.02em' }}>{f.title}</h3>
                        <p className="muted">{f.text}</p>
                      </div>
                      <span className="feature-arrow" style={{ marginTop: 'auto' }}>
                        <ArrowUpRight size={22} />
                      </span>
                    </div>
                  </SpotlightCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section className="how-section landing-section" id="how-it-works">
          <div>
            <p className="eyebrow nova-eyebrow">FROM CHAOS TO CLARITY</p>
            <h2 className="nova-section-title">
              A good habit
              <br />
              starts <GradientText>here.</GradientText>
            </h2>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-block' }}>
              <Link to="/register" className="button secondary">
                Make your first move <ArrowUpRight size={17} />
              </Link>
            </motion.div>
          </div>
          <div className="steps">
            {steps.map(([t, d], i) => (
              <FadeIn key={t} delay={i * 0.08}>
                <div className="nova-glass-soft" style={{ padding: '22px 24px' }}>
                  <span
                    className="nova-holo"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 42,
                      height: 42,
                      fontWeight: 800
                    }}
                  >
                    0{i + 1}
                  </span>
                  <section>
                    <h3>{t}</h3>
                    <p className="muted">{d}</p>
                  </section>
                  <ArrowUpRight size={18} />
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ================= FAQ ================= */}
        <section className="faq landing-section">
          <p className="eyebrow nova-eyebrow">A LITTLE MORE CLARITY</p>
          <h2 className="nova-section-title">Good questions.</h2>
          {faqs.map(([q, a], i) => (
            <div className="faq-item nova-glass-soft" key={q} style={{ padding: 0, marginTop: 12, border: '1px solid var(--border)' }}>
              <button
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
                className="nova-focus"
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '20px 22px', background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--heading)', fontSize: '1.02rem', fontWeight: 650, textAlign: 'left' }}
              >
                {q}
                {open === i ? <Minus size={18} /> : <Plus size={18} />}
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p className="muted" style={{ padding: '0 22px 20px' }}>{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </section>

        {/* ================= FINAL CTA ================= */}
        <section className="final-cta">
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'url(/visuals/auth-aurora.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.35,
              maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)'
            }}
          />
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            style={{ position: 'relative', display: 'grid', gap: 18, justifyItems: 'center' }}
          >
            <span className="eyebrow nova-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
            <h2 className="nova-hero-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', textAlign: 'center' }}>
              Make room for <GradientText>more.</GradientText>
            </h2>
            <MovingBorderButton onClick={() => (window.location.href = '/register')}>
              Start your CampusCoin journey <ArrowUpRight size={19} />
            </MovingBorderButton>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
