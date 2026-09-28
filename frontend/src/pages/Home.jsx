import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
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
import { useState } from 'react';
import Hologram from '../components/illustrations/Hologram';
import Brand from '../components/layout/Brand';
import Footer from '../components/layout/Footer';
import useAuth from '../hooks/useAuth';
import Reveal from '../components/motion/Reveal';
import AmbientGlow from '../components/background/AmbientGlow';
const features = [
  {
    n: '01',
    icon: Wallet,
    title: 'Every rupee, accounted for.',
    text: 'From your monthly allowance to late-night chai. Keep income, expenses and recurring payments in one beautifully clear place.',
    tag: 'TRANSACTIONS & BUDGETS',
    link: '/transactions',
    className: 'feature-wide'
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
export default function Home() {
  const { user } = useAuth();
  const [open, setOpen] = useState(null);
  return (
    <div className="landing">
      <header className="landing-nav">
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
          <Link
            className="button primary small"
            to={user ? '/dashboard' : '/register'}
          >
            Get started <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main id="main">
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="pill">
              <span className="status-dot" /> A SMARTER START TO STUDENT FINANCE{' '}
              <ArrowUpRight size={13} />
            </div>
            <h1>
              More life.
              <br />
              Less money
              <br />
              <span className="serif-gradient">stress.</span>
            </h1>
            <p>
              Your allowance. Your ambitions. Your next chapter.
              <br className="desktop-only" /> Meet the money workspace built for
              campus life.
            </p>
            <div className="hero-buttons">
              <Link
                to={user ? '/dashboard' : '/register'}
                className="button primary large"
              >
                Find your financial flow <ArrowUpRight size={19} />
              </Link>
              <a href="#features" className="text-button">
                Take a closer look <ArrowRight size={17} />
              </a>
            </div>
            <div className="hero-note">
              <ShieldCheck size={16} />
              <span>Your finances, in your control.</span>
              <i />
              <span>Built for students.</span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Abstract CampusCoin coin surrounded by financial planning tools"
          >
            <Hologram />
            <div className="floating-label label-top">
              <span className="mini-icon">
                <GraduationCap size={19} />
              </span>
              <div>
                Made for your next chapter
                <small>LESS GUESSWORK. MORE POSSIBILITY.</small>
              </div>
              <span className="tiny-dot" />
            </div>
            <div className="floating-label label-bottom">
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
                  <i
                    key={i}
                    style={{ height: h + '%', animationDelay: i * 90 + 'ms' }}
                  />
                ))}
              </div>
              <small>ILLUSTRATIVE · NOT FINANCIAL DATA</small>
            </div>
            <span className="art-coordinate">DESIGNED FOR WHAT’S NEXT ↗</span>
          </div>
        </section>
        <section className="value-strip" aria-label="Core features">
          <span>
            A LITTLE STRUCTURE.
            <br />
            <b>A LOT MORE FREEDOM.</b>
          </span>
          <div>
            <ScanLine size={20} /> Effortless tracking
          </div>
          <div>
            <ChartNoAxesCombined size={21} /> Clarity at a glance
          </div>
          <div>
            <Sparkles size={20} /> Intelligent insights
          </div>
          <div>
            <Target size={20} /> Goals with purpose
          </div>
        </section>
        <Reveal>
          <section id="features" className="landing-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR MONEY, WORKING TOGETHER</p>
                <h2>
                  One space.
                  <br />
                  <span className="muted">A clearer headspace.</span>
                </h2>
              </div>
              <p>
                Less spreadsheet energy. More living.
                <br />
                Everything you need to feel on top of your money.
              </p>
            </div>
            <div className="feature-grid">
              {features.map((f) => (
                <Link
                  to={f.link}
                  key={f.n}
                  className={'feature-card ' + (f.className || '')}
                >
                  <div className="row between">
                    <span className="feature-icon">
                      <f.icon size={22} />
                    </span>
                    <span className="feature-number">{f.n} /</span>
                  </div>
                  <div className="feature-text">
                    <p className="eyebrow">{f.tag}</p>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                  <span className="feature-arrow">
                    <ArrowUpRight size={22} />
                  </span>
                  {f.n === '01' && (
                    <div className="category-orbit" aria-hidden="true">
                      <span>↗ Allowance</span>
                      <span>☕ Food & friends</span>
                      <span>⌂ Campus life</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
        <section className="how-section landing-section" id="how-it-works">
          <div>
            <p className="eyebrow">FROM CHAOS TO CLARITY</p>
            <h2>
              A good habit
              <br />
              starts <span className="serif-gradient">here.</span>
            </h2>
            <Link to="/register" className="button secondary">
              Make your first move <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="steps">
            {[
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
            ].map(([t, d], i) => (
              <div key={t}>
                <span>0{i + 1}</span>
                <section>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </section>
                <ArrowUpRight size={18} />
              </div>
            ))}
          </div>
        </section>
        <section className="faq landing-section">
          <p className="eyebrow">A LITTLE MORE CLARITY</p>
          <h2>Good questions.</h2>
          {[
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
          ].map(([q, a], i) => (
            <div className="faq-item" key={q}>
              <button
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {q}
                {open === i ? <Minus size={18} /> : <Plus size={18} />}
              </button>
              {open === i && <p>{a}</p>}
            </div>
          ))}
        </section>
        <section className="final-cta">
          <AmbientGlow tone="violet" />
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h2>
            Make room for <span className="serif-gradient">more.</span>
          </h2>
          <Link className="button primary large" to="/register">
            Start your CampusCoin journey <ArrowUpRight size={19} />
          </Link>
          <div className="cta-orbit" />
        </section>
      </main>
      <Footer />
    </div>
  );
}
