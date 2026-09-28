import Card from '../common/Card';import{Utensils,Car,ShoppingBag,GraduationCap,ReceiptText,Film,MoreHorizontal}from'lucide-react';import{EmptyArt} from '../illustrations/Illustrations';import formatCurrency from '../../utils/formatCurrency';
const ICONS=[[/^food|drink|meal|grocer|chai|snack/i,<Utensils size={19}/>,'pink'],
 [/^transport|travel|fuel|metro|bus|cab/i,<Car size={19}/>,'blue'],
 [/^shopp/i,<ShoppingBag size={19}/>,'orange'],
 [/^edu|book|tuition|course/i,<GraduationCap size={19}/>,'violet'],
 [/^bill|util|rent|hostel|fee/i,<ReceiptText size={19}/>,'cyan'],
 [/^enter|fun|movie|game/i,<Film size={19}/>,'pink']];
const FALLBACK=[{name:'Food & Drinks'},{name:'Transport'},{name:'Shopping'},{name:'Others'}];
const look=n=>{for(const[re,ic,tone]of ICONS)if(re.test(n||''))return{icon:ic,tone};return{icon:<MoreHorizontal size={19}/>,tone:'gray'}};
export default function TopCategories({data=[],currency,className=''}){
 const items=(data.length?data:FALLBACK).slice(0,5);
 const total=data.length?data.reduce((t,d)=>t+(Number(d.amount)||0),0):0;
 const max=data.length?Math.max(...data.map(d=>d.amount),1):0;
 return <Card className={className}><div className="panel-heading">
  <div><p className="eyebrow">WHERE IT GOES</p><h2>Top categories</h2></div></div>
 {data.length?<div className="cat-list">{items.map((d,i)=>{const{icon,tone}=look(d.name);const pct=total?Math.round(d.amount/total*100):0;
   return <div className="cat-row" key={d.name}>
   <span className={'cat-ic '+tone}>{icon}</span>
   <div className="cat-body"><div className="cat-name"><span>{d.name}</span><span className="cat-pct">{pct}%</span></div>
    <div className="progress" style={{margin:'7px 0 0'}}><i style={{width:Math.max(6,d.amount/max*100)+'%',background:'var(--primary-grad)'}}/></div>
   </div></div>})}</div>
 :<div className="state" style={{minHeight:190}}><div className="cat-chip-row" aria-hidden="true">{items.map((d,i)=>{const{icon,tone}=look(d.name);return <span className={'cat-ic '+tone} key={d.name}>{icon}</span>})}</div><h3>Categories fill in as you spend.</h3><p>Log a few expenses and your most active categories — food, transport, shopping — will rank themselves here.</p></div>}
 </Card>;}
