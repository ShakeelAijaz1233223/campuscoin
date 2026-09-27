import{Plus}from'lucide-react';import{useId}from'react';import{useMemo}from'react';import{ResponsiveContainer,AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip}from'recharts';import Card from '../common/Card';import EmptyState from '../common/EmptyState';import {EmptyArt} from '../illustrations/Illustrations';import formatCurrency from '../../utils/formatCurrency';
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export default function SpendingRhythm({months=[],currency,className='',badge}){
 const data=months;
 const hasData=data.some(d=>d.expense>0||d.income>0);
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const gid=useId().replaceAll(':','')+'rhythm';
 const peak=useMemo(()=>data.reduce((m,d,i)=>d.expense>m.expense?{...d,index:i}:m,{expense:0,index:-1}),[data]);
 return <Card className={className}><div className="panel-heading">
  <div className="row"><span className="panel-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 17 L9 11 L13 14 L21 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 6 h6 v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span><div><p className="eyebrow">THE FULL YEAR</p><h2>Spending rhythm</h2></div></div>
  {badge&&<span className="rhythm-badge">{badge}</span>}</div>
 {!hasData?<EmptyState art={<EmptyArt kind="chart"/>} title="The picture builds with you." description="Your rhythm will appear once your account has activity in this year. Add a transaction and watch the line find its flow."/>:
 <><div className="rhythm-chart-wrap"><ResponsiveContainer width="100%" height={252}>
  <AreaChart data={data} margin={{top:12,right:8,bottom:0,left:-8}}>
   <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#12b981" stopOpacity=".26"/><stop offset="100%" stopColor="#22c3dd" stopOpacity="0"/></linearGradient></defs>
   <CartesianGrid stroke="var(--chart-grid)" vertical={false}/>
   <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill:'var(--dim)',fontSize:11}} tickMargin={10}/>
   <YAxis axisLine={false} tickLine={false} width={62} tick={{fill:'var(--dim)',fontSize:11}} tickFormatter={v=>v>=1000?(v/1000).toFixed(v%1000?1:0)+'k':v}/>
   <Tooltip formatter={(v,k)=>[formatCurrency(v,currency),k==='expense'?'Expenses':'Income']} labelFormatter={l=>l} cursor={{stroke:'var(--border-strong)',strokeDasharray:'4 4'}}/>
   <Area type="monotone" dataKey="expense" name="Expenses" stroke="#12b981" strokeWidth={2.6} fill={`url(#${gid})`} activeDot={{r:5,strokeWidth:2,stroke:'#fff'}} isAnimationActive={!reduced} animationDuration={1100}/>
   <Area type="monotone" dataKey="income" name="Income" stroke="#22c3dd" strokeWidth={2} strokeDasharray="5 4" fill="none" activeDot={{r:4,strokeWidth:2,stroke:'#fff'}} isAnimationActive={!reduced} animationDuration={1300}/>
  </AreaChart></ResponsiveContainer></div>
 <div className="rhythm-legend"><span><i style={{background:'#12b981'}}/>Expenses</span><span><i style={{background:'#22c3dd'}}/>Income</span>{peak.index>-1&&peak.expense>0&&<span className="muted">Peak month · {peak.label} ({formatCurrency(peak.expense,currency)})</span>}</div></>}
 </Card>;}
