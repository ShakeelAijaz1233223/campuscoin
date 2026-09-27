import{Link}from'react-router-dom';import{ArrowRight,ArrowDownLeft,ArrowUpRight,PencilLine}from'lucide-react';import{Card,Button}from '../common/UI';import {EmptyArt} from '../illustrations/Illustrations';import formatCurrency from '../../utils/formatCurrency';import formatDate from '../../utils/formatDate';
export default function RecentTransactions({items=[],currency,onAdd}){
 return <Card className="span-eight"><div className="panel-heading">
  <div><p className="eyebrow">THE DAY TO DAY</p><h2>Recent transactions</h2></div>
  <Link className="text-button" to="/transactions">View all <ArrowRight size={15}/></Link></div>
 {items.length?<div className="recent-list">{items.map(t=><div className="tx-row" key={t.id}>
   <span className={'transaction-icon '+t.type}>{t.type==='income'?<ArrowDownLeft size={16}/>:<ArrowUpRight size={16}/>}</span>
   <div className="tx-body"><div className="tx-desc">{t.description||t.category?.name||'Transaction'}</div>
    <div className="tx-meta"><span>{formatDate(t.date)}</span><span>·</span><span>{t.category?.name||t.categoryName||'Uncategorized'}</span></div></div>
   <span className={'tx-amount '+(t.type==='income'?'income':'')}>{t.type==='income'?'+':'−'}{formatCurrency(t.amount,t.currency||currency)}</span>
  </div>)}</div>
 :<div className="state" style={{minHeight:210}}><EmptyArt kind="doc"/><h3>The picture builds with you.</h3><p>Your recent activity will appear here. Add your first income or expense and it will show up instantly.</p><Button variant="secondary" onClick={onAdd}><PencilLine size={16}/>Add a transaction</Button></div>}
 </Card>;}
