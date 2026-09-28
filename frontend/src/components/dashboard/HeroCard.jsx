import{Link}from'react-router-dom';import{ArrowRight,Wallet,Sparkles,Target}from'lucide-react';import Card from '../common/Card';import formatCurrency from '../../utils/formatCurrency';import {HeroIllustration} from '../illustrations/Illustrations';
export default function HeroCard({name,balance,currency,status,goals=[],monthLabel}){
 const first=name?.split(' ')[0]||'friend';
 const goal=goals[0];
 return <Card className="hero-card">
  <span className="hero-blob a"/><span className="hero-blob b"/>
  <svg className="hero-waves" viewBox="0 0 420 120" fill="none" aria-hidden="true" preserveAspectRatio="none">
    <path d="M0 78 C60 58 110 96 170 82 C230 68 280 100 340 88 C380 80 404 66 420 58" stroke="var(--waves)" strokeWidth="26" strokeLinecap="round"/>
    <path d="M0 104 C70 88 130 116 200 104 C270 92 330 112 420 98" stroke="var(--waves)" strokeWidth="18" strokeLinecap="round" opacity=".7"/>
  </svg>
  <div className="hero-pill"><span className="status-dot"/>A little clarity. A lot of possibility.</div>
  <h1>Your money. <span className="grad-name">{first}</span>.</h1>
  <p className="hero-sub">Let’s make room for what matters.</p>
  <Link to="/transactions" className="button primary hero-cta">Explore more <ArrowRight size={17}/></Link>
  <div className="hero-stats">
   <span className="hero-stat"><Wallet size={15}/><span>Total balance <b>{formatCurrency(balance,currency)}</b></span></span>
   {status&&<span className="hero-stat"><Sparkles size={15}/><span>{status}</span></span>}
   {goal&&<Link to="/goals" className="hero-stat"><Target size={15}/><span>{goal.name} · <b>{goal.percentage}%</b></span><ArrowRight size={13}/></Link>}
  </div>
  <div className="hero-illust"><HeroIllustration/></div>
 </Card>;}
