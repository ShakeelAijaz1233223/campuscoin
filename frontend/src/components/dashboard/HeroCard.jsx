import{Link}from'react-router-dom';import{ArrowUpRight,Wallet,Sparkles,Target}from'lucide-react';import Card from '../common/Card';import formatCurrency from '../../utils/formatCurrency';import {HeroIllustration} from '../illustrations/Illustrations';
export default function HeroCard({name,balance,currency,status,goals=[],monthLabel}){
 const first=name?.split(' ')[0]||'friend';
 const goal=goals[0];
 return <Card className="hero-card">
  <span className="hero-blob a"/><span className="hero-blob b"/>
  <div className="hero-pill"><span className="status-dot"/>A little clarity. A lot of possibility.</div>
  <h1>Your money,<br/>your momentum, {first}.</h1>
  <p className="hero-sub">Let’s make room for what matters — here is how {monthLabel} is shaping up so far.</p>
  <div className="hero-stats">
   <span className="hero-stat"><Wallet size={15}/><span>Total balance <b>{formatCurrency(balance,currency)}</b></span></span>
   {status&&<span className="hero-stat"><Sparkles size={15}/><span>{status}</span></span>}
   {goal&&<Link to="/goals" className="hero-stat"><Target size={15}/><span>{goal.name} · <b>{goal.percentage}%</b></span><ArrowUpRight size={13}/></Link>}
  </div>
  <div className="hero-illust"><HeroIllustration/></div>
 </Card>;}
