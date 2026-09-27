import{Link}from'react-router-dom';import{Lightbulb,ArrowRight}from'lucide-react';import Card from '../common/Card';import {EmptyArt} from '../illustrations/Illustrations';
export default function SavingTipsWidget({tips=[]}){
 return <Card><div className="panel-heading">
  <div className="row"><span className="panel-icon" style={{background:'var(--cyan-soft)',color:'var(--cyan)',borderColor:'transparent'}}><Lightbulb size={17}/></span><div><p className="eyebrow">SMALL SHIFTS, BIG WINS</p><h2>Saving tips</h2></div></div>
  <Link className="text-button" to="/saving-tips">All tips <ArrowRight size={14}/></Link></div>
 {tips.length?tips.slice(0,3).map(t=><div className="tip-snippet" key={t.id}><span className="tip-tag">{t.category||'tip'}</span><h3>{t.title}</h3><p>{t.body}</p></div>)
 :<div className="state" style={{minHeight:170}}><EmptyArt kind="doc"/><h3>Tips arrive with experience.</h3><p>As your history grows, CampusCoin suggests small, personal adjustments.</p></div>}
 </Card>;}
