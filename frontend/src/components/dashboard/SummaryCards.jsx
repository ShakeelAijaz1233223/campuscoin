import{ArrowDownLeft,ArrowUpRight,TrendingUp}from'lucide-react';import Card from '../common/Card';import formatCurrency from '../../utils/formatCurrency';import Sparkline from './Sparkline';
function cumulative(values){let t=0;return values.map(v=>(t+=Number(v)||0));}
export function IncomeCard({value,currency,daily=[]}){return <Card className="summary-card">
 <span className="sc-icon mint"><ArrowDownLeft size={19}/></span>
 <div className="sc-body"><span className="sc-label">Total income</span><strong className="sc-value">{formatCurrency(value,currency)}</strong><span className="sc-caption">Money coming in this month</span></div>
 <Sparkline id="inc" color="#12b981" data={cumulative(daily.map(d=>d.income))}/></Card>;}
export function ExpenseCard({value,currency,daily=[]}){return <Card className="summary-card">
 <span className="sc-icon sky"><ArrowUpRight size={19}/></span>
 <div className="sc-body"><span className="sc-label">Total expenses</span><strong className="sc-value">{formatCurrency(value,currency)}</strong><span className="sc-caption">Money going out this month</span></div>
 <Sparkline id="exp" color="#22c3dd" data={cumulative(daily.map(d=>d.expense))}/></Card>;}
export function SavingsCard({value,currency,daily=[]}){const rate=daily.length?null:null;return <Card className="summary-card">
 <span className="sc-icon violet"><TrendingUp size={19}/></span>
 <div className="sc-body"><span className="sc-label">Net savings</span><strong className="sc-value">{formatCurrency(value,currency)}</strong><span className="sc-caption">A little closer to your next chapter</span></div>
 <Sparkline id="sav" color="#8b72f6" data={cumulative(daily.map(d=>d.net))}/></Card>;}
