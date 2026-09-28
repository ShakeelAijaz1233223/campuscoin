import { Link } from 'react-router-dom';
import { ArrowUpRight, Wallet, ShieldCheck } from 'lucide-react';
import { Card } from '../common/UI';
import AnimatedAmount from '../common/AnimatedAmount';
import Hologram from '../illustrations/Hologram';

export default function HeroCard({ balance, currency }) {
  return (
    <Card className="hero-card balance-card glass-ultra">
      <div className="balance-content">
        <div className="row">
          <span className="balance-icon">
            <Wallet size={18} />
          </span>
          <span className="eyebrow">YOUR TOTAL BALANCE</span>
        </div>
        <strong className="balance-number">
          <AnimatedAmount value={balance} currency={currency} />
        </strong>
        <p className="balance-description">
          Your accounts, in one clear picture.
        </p>
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
