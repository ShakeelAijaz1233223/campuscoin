import{Link,useNavigate}from'react-router-dom';import{Plus}from'lucide-react';import{Card,Button}from '../common/UI';import{EmptyArt} from '../illustrations/Illustrations';import formatCurrency from '../../utils/formatCurrency';
export default function BudgetCheckIn({summary,budgets=[],currency}){
 const navigate=useNavigate();
 const pct=Math.max(0,Math.min(100,Math.round(summary?.percentage||0)));
 const R=48,C=2*Math.PI*R;
 const tone=pct>=100?'var(--danger)':pct>=80?'var(--warning)':'var(--accent)';
 const stroke=`url(#budgetRingGrad)`;
 return <Card className="span-four"><div className="panel-heading">
  <div><p className="eyebrow">MONTHLY INTENTION</p><h2>Budget check-in</h2></div></div>
 {summary&&summary.total_budget>0?<>
  <div className="budget-ring-wrap">
   <div className="budget-ring"><svg width="118" height="118" viewBox="0 0 118 118" aria-hidden="true">
     <defs><linearGradient id="budgetRingGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#3b7cf6"/><stop offset="55%" stopColor="#22c3dd"/><stop offset="100%" stopColor="#7c5cf6"/></linearGradient></defs>
     <circle className="ring-track" cx="59" cy="59" r={R} fill="none" strokeWidth="11"/>
     <circle className="ring-value" cx="59" cy="59" r={R} fill="none" stroke={stroke} strokeWidth="11" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C-(C*pct/100)}/>
    </svg><div className="ring-label"><b>{pct}%</b><small>used</small></div></div>
   <p className="budget-checkin-copy">You’ve spent <b style={{color:'var(--heading)'}}>{formatCurrency(summary.total_spent,currency)}</b> of your {formatCurrency(summary.total_budget,currency)} budget. {pct>=100?'Time to reset the pace — next month is a fresh page.':pct>=80?'Nearly there. Keep the rest of the month light.':'Nicely paced. Keep it flowing.'}</p>
  </div>
  {budgets.slice(0,3).map(b=><div className="budget-line" key={b.id}>
    <div className="row between"><b>{b.name}</b><small>{Math.round((b.spent||0)/b.amount*100)}%</small></div>
    <div className={'progress '+((b.spent||0)>=b.amount?'danger':(b.spent||0)/b.amount*100>=80?'warning':'')}><i style={{width:Math.min(100,(b.spent||0)/b.amount*100)+'%'}}/></div>
    <small>{formatCurrency(b.spent,currency)} of {formatCurrency(b.amount,currency)}</small></div>)}
  <Link to="/budgets" className="text-button" style={{marginTop:12}}>Refine your budgets →</Link></>
 :<div className="state" style={{minHeight:220}}><EmptyArt kind="ring"/><h3>Give your spending a plan.</h3><p>Create a budget for the categories that matter and this ring becomes your month at a glance.</p><Button variant="secondary" onClick={()=>navigate('/budgets')}><Plus size={16}/>Create a budget</Button></div>}
 </Card>;}
