import { Link } from 'react-router-dom';
import { ArrowUpRight, Target } from 'lucide-react';
import { Card, ProgressBar } from '../common/UI';
import formatCurrency from '../../utils/formatCurrency';

export default function GoalOverview({ items = [], currency }) {
  return (
    <Card className="goal-overview section-gap">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">SMALL STEPS. BIGGER PLANS.</p>
          <h2>Goals in motion</h2>
        </div>
        <Link to="/goals" className="text-button">
          Your savings goals <ArrowUpRight size={15} />
        </Link>
      </div>
      {items.length ? (
        <div className="three-grid">
          {items.slice(0, 3).map((goal) => (
            <Link to="/goals" className="goal-preview" key={goal.id}>
              <div className="row between">
                <span>
                  <Target size={16} /> {goal.name}
                </span>
                <b>{goal.percentage}%</b>
              </div>
              <ProgressBar
                intent="goal"
                label={goal.name}
                value={goal.percentage}
              />
              <small>
                {formatCurrency(goal.current_amount, currency)} of{' '}
                {formatCurrency(goal.target_amount, currency)}
              </small>
            </Link>
          ))}
        </div>
      ) : (
        <div className="row wrap goal-empty">
          <span className="feature-icon">
            <Target size={22} />
          </span>
          <p className="muted">
            Your next adventure starts with a small intention.
          </p>
          <Link to="/goals" className="button secondary">
            Set your first goal <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
    </Card>
  );
}
