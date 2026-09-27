import Card from '../common/Card';import Chart from '../charts/BudgetActualChart';
export default function BudgetVsActual({data,currency,className='',actions}){return <Card className={className}><div className="panel-heading">
 <div><p className="eyebrow">PLAN VS REALITY</p><h2>Budget vs actual</h2></div>{actions}</div>
 <Chart data={data||[]} currency={currency} height={215}/></Card>;}
