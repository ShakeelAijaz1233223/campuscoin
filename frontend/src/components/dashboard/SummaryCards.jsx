import{ArrowDownLeft,ArrowUpRight,TrendingUp}from'lucide-react';import Card from '../common/Card';import formatCurrency from '../../utils/formatCurrency';import Sparkline from './Sparkline';
function cumulative(values){let t=0;return values.map(v=>(t+=Number(v)||0));}
export function IncomeCard({value,currency,daily=[]}){return <Card className="summary-card income">
 <div className="sc-top"><span className="sc-icon mint"><ArrowDownLeft size={19}/></span><ArrowUpRight size={17} className="sc-arrow"/></div>
 <div className="sc-body"><span className="sc-label">Total income</span><strong className="sc-value">{formatCurrency(value,currency)}</strong><span className="sc-caption">Money coming in this month</span></div>
 <Sparkline id="inc" color="#22c55e" data={cumulative(daily.map(d=>d.income))}/></Card>;}
export function ExpenseCard({value,currency,daily=[]}){return <Card className="summary-card expense">
 <div className="sc-top"><span className="sc-icon sky"><ArrowUpRight size={19}/></span><ArrowDownLeft size={17} className="sc-arrow"/></div>
 <div className="sc-body"><span className="sc-label">Total expenses</span><strong className="sc-value">{formatCurrency(value,currency)}</strong><span className="sc-caption">Money going out this month</span></div>
 <Sparkline id="exp" color="#ec5f9e" data={cumulative(daily.map(d=>d.expense))}/></Card>;}
export function SavingsCard({value,currency,daily=[]}){return <Card className="summary-card savings">
 <div className="sc-top"><span className="sc-icon violet"><TrendingUp size={19}/></span><ArrowUpRight size={17} className="sc-arrow"/></div>
 <div className="sc-body"><span className="sc-label">Net savings</span><strong className="sc-value">{formatCurrency(value,currency)}</strong><span className="sc-caption">A little closer to your next chapter</span></div>
 <Sparkline id="sav" color="#3b7cf6" data={cumulative(daily.map(d=>d.net))}/></Card>;}
