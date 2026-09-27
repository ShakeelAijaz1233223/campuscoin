import Card from '../common/Card';import Chart from '../charts/IncomeExpenseChart';
export default function MonthlyOverview({data,currency,className='',actions}){return <Card className={className}><div className="panel-heading">
 <div><p className="eyebrow">SIX MONTH VIEW</p><h2>Monthly overview</h2></div>{actions}</div>
 <Chart data={data||[]} currency={currency} height={215}/></Card>;}
