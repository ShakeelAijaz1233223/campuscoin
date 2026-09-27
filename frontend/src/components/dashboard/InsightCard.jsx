import{useState}from'react';import{Link}from'react-router-dom';import{Sparkles,ArrowUpRight}from'lucide-react';import{Card,Badge,Button}from '../common/UI';import {InsightIllustration,EmptyArt} from '../illustrations/Illustrations';import insightApi from '../../api/insightApi';import{useApp}from '../../context/AppContext';
export default function InsightCard({insight,month,year}){
 const {notify}=useApp();const[busy,setBusy]=useState(false);
 const generate=async()=>{setBusy(true);try{await insightApi.generate({month,year});notify('A fresh insight is ready.');}catch(e){notify(e.message,'error');}finally{setBusy(false);}};
 return <Card className="insight-card">
  <div className="row between"><span className="spark-icon"><Sparkles size={21}/></span><Badge tone="violet">AI Insight</Badge></div>
  <h2>Your spending has a story.</h2>
  {insight?.summary?<p>{insight.summary}{insight.tip?' '+insight.tip:''}</p>
   :<p>No insight for this month yet. Generate one from your saved records — CampusCoin looks at your income, spending and budgets to write a short reflection.</p>}
  <div className="row" style={{marginTop:16,gap:10}}>{insight?.summary?<Link className="text-button" to="/insights">Explore your insights <ArrowUpRight size={15}/></Link>:null}
   <Button variant="secondary" onClick={generate} loading={busy} className="small">{insight?.summary?'Regenerate insight':'Generate this month’s insight'}</Button></div>
  <div className="insight-illust"><InsightIllustration/></div>
 </Card>;}
