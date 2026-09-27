import Card from '../common/Card';import{EmptyArt} from '../illustrations/Illustrations';import formatCurrency from '../../utils/formatCurrency';
const PALETTE=['#12b981','#22c3dd','#8b72f6','#f2a444','#ef7d9d','#4fb3f6'];
const FALLBACK=[{name:'Food & Drinks'},{name:'Transport'},{name:'Shopping'},{name:'Others'}];
export default function TopCategories({data=[],currency,className=''}){
 const items=(data.length?data:FALLBACK).slice(0,5);
 const max=data.length?Math.max(...data.map(d=>d.amount),1):0;
 return <Card className={className}><div className="panel-heading">
  <div><p className="eyebrow">WHERE IT GOES</p><h2>Top categories</h2></div></div>
 {data.length?<div className="cat-list">{items.map((d,i)=><div className="cat-row" key={d.name}>
   <span className="cat-dot" style={{background:d.color||PALETTE[i%PALETTE.length]}}/>
   <div className="cat-body"><div className="cat-name"><span>{d.name}</span><span>{formatCurrency(d.amount,currency)}</span></div>
    <div className="progress" style={{margin:'7px 0 0'}}><i style={{width:Math.max(6,d.amount/max*100)+'%',background:d.color||PALETTE[i%PALETTE.length]}}/></div>
   </div></div>)}</div>
 :<div className="state" style={{minHeight:190}}><EmptyArt kind="doc"/><h3>Categories fill in as you spend.</h3><p>Log a few expenses and your most active categories — food, transport, shopping — will rank themselves here.</p></div>}
 </Card>;}
