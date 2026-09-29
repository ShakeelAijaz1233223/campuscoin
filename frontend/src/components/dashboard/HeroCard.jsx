import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Wallet, ShieldCheck } from 'lucide-react';
import { Card } from '../common/UI';
import AnimatedAmount from '../common/AnimatedAmount';
import Hologram from '../illustrations/Hologram';

export default function HeroCard({ balance, currency }) {
  const reduce = useReducedMotion();
  return (
    <Card className="hero-card balance-card glass-ultra nova-edge">
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/visuals/hero-aurora.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.34,
          maskImage: 'radial-gradient(ellipse 85% 120% at 85% 50%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 120% at 85% 50%, black, transparent)'
        }}
      />
      <div className="balance-content">
        <div className="row">
          <span className="balance-icon">
            <Wallet size={18} />
          </span>
          <span className="eyebrow nova-eyebrow">YOUR TOTAL BALANCE</span>
        </div>
        <motion.strong
          className="balance-number"
          initial={reduce ? false : { opacity: 0, y: 18, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatedAmount value={balance} currency={currency} />
        </motion.strong>
        <p className="balance-description">Your accounts, in one clear picture.</p>
        <div className="balance-bottom">
          <span>
            <ShieldCheck size={14} /> Current tracked balance
          </span>
          <Link to="/settings" className="text-button">
            Manage accounts <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
      <Hologram compact />
    </Card>
  );
}
