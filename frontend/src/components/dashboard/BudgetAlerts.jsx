import{Card,Badge}from '../common/UI';
export default function BudgetAlerts({alerts=[]}){if(!alerts.length)return null;
 return <Card className="alert-list span-two"><div className="panel-heading"><div><p className="eyebrow">GENTLE NUDGES</p><h2>Your attention, please</h2></div></div>
 {alerts.map(a=><p key={a.id}><Badge tone={a.severity==='error'?'danger':'warning'}>{a.type==='exceeded'?'Exceeded':'Near limit'}</Badge>{a.message}</p>)}</Card>;}
