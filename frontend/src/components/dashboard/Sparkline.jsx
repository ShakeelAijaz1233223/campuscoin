import{useId}from'react';import{ResponsiveContainer,AreaChart,Area}from'recharts';
export default function Sparkline({data=[],color='#12b981',id='spark'}){
 const cid=useId().replaceAll(':','')+id;
 const series=data.map((v,i)=>({i,v}));
 return <div className="sc-spark" aria-hidden="true"><ResponsiveContainer width="100%" height="100%">
  <AreaChart data={series} margin={{top:4,right:0,bottom:0,left:0}}>
   <defs><linearGradient id={cid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".32"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
   <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${cid})`} isAnimationActive={!matchMedia('(prefers-reduced-motion: reduce)').matches} animationDuration={900} dot={false}/>
  </AreaChart>
 </ResponsiveContainer></div>;}
