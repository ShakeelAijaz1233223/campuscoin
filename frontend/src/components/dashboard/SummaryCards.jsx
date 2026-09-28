import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import Card from '../common/Card';
import Sparkline from './Sparkline';
import AnimatedAmount from '../common/AnimatedAmount';
function cumulative(values) {
  let t = 0;
  return values.map((v) => (t += Number(v) || 0));
}
export function IncomeCard({ value, currency, daily = [] }) {
  return (
    <Card className="summary-card income">
      <div className="sc-top">
        <span className="sc-icon mint">
          <ArrowDownLeft size={19} />
        </span>
        <ArrowUpRight size={17} className="sc-arrow" />
      </div>
      <div className="sc-body">
        <span className="sc-label">Total income</span>
        <strong className="sc-value">
          <AnimatedAmount value={value} currency={currency} />
        </strong>
        <span className="sc-caption">Money coming in this month</span>
      </div>
      <Sparkline
        id="inc"
        color="var(--accent)"
        data={cumulative(daily.map((d) => d.income))}
      />
    </Card>
  );
}
export function ExpenseCard({ value, currency, daily = [] }) {
  return (
    <Card className="summary-card expense">
      <div className="sc-top">
        <span className="sc-icon sky">
          <ArrowUpRight size={19} />
        </span>
        <ArrowDownLeft size={17} className="sc-arrow" />
      </div>
      <div className="sc-body">
        <span className="sc-label">Total expenses</span>
        <strong className="sc-value">
          <AnimatedAmount value={value} currency={currency} />
        </strong>
        <span className="sc-caption">Money going out this month</span>
      </div>
      <Sparkline
        id="exp"
        color="var(--pink)"
        data={cumulative(daily.map((d) => d.expense))}
      />
    </Card>
  );
}
export function SavingsCard({ value, currency, daily = [], rate }) {
  return (
    <Card className="summary-card savings">
      <div className="sc-top">
        <span className="sc-icon violet">
          <TrendingUp size={19} />
        </span>
        <ArrowUpRight size={17} className="sc-arrow" />
      </div>
      <div className="sc-body">
        <span className="sc-label">Net savings</span>
        <strong className="sc-value">
          <AnimatedAmount value={value} currency={currency} />
        </strong>
        <span className="sc-caption">
          {rate !== undefined
            ? `${Math.round(rate)}% savings rate this month`
            : 'A little closer to your next chapter'}
        </span>
      </div>
      <Sparkline
        id="sav"
        color="var(--purple)"
        data={cumulative(daily.map((d) => d.net))}
      />
    </Card>
  );
}
