import{Link}from'react-router-dom';import{Lightbulb,ArrowRight,TrendingUp}from'lucide-react';import Card from '../common/Card';import {EmptyArt} from '../illustrations/Illustrations';
export default function SavingTipsWidget({tips=[]}){
 return <Card className="tips-card"><div className="panel-heading">
  <div className="row"><span className="panel-icon" style={{background:'var(--orange-soft)',color:'var(--orange)',borderColor:'transparent'}}><Lightbulb size={17}/></span><div><p className="eyebrow">SAVING TIPS</p><h2>Small shifts, big wins.</h2></div></div>
  <Link className="text-button" to="/saving-tips">See saving tips <ArrowRight size={14}/></Link></div>
 {tips.length?tips.slice(0,2).map(t=><div className="tip-snippet" key={t.id}><span className="tip-tag">{t.category||'tip'}</span><h3>{t.title}</h3><p>{t.body}</p></div>)
 :<div className="state" style={{minHeight:170}}><EmptyArt kind="doc"/><h3>Personalized tips appear as your spending history grows.</h3></div>}
 <svg className="tips-art" viewBox="0 0 120 96" fill="none" aria-hidden="true">
  <g opacity=".9">{[16,26,36,48,62,78].map((h,i)=><rect key={h} x={8+i*17} y={92-h} width="10" height={h} rx="3.5" fill="var(--accent-soft)" stroke="var(--accent-line)" strokeWidth="1"/>)}</g>
  <path d="M14 66 C40 58 62 40 96 18" stroke="var(--teal)" strokeWidth="3.2" strokeLinecap="round" strokeDasharray="170" className="tips-arrow-line"/>
  <path d="M86 16 l12 1 -4 11" stroke="var(--teal)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
 </svg>
 </Card>;}
