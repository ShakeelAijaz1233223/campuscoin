// The UI uses camelCase; the existing REST API and SQL schema use snake_case.
// Keep that boundary explicit, rather than teaching every component both formats.
export const camel = value => Array.isArray(value) ? value.map(camel) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).map(([k,v]) => [k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),camel(v)])) : value;
const snake = key => key.replace(/[A-Z]/g,c=>'_'+c.toLowerCase());
const years = {'1':'freshman','2':'sophomore','3':'junior','4':'senior','5':'other',postgraduate:'graduate'};
export function person(raw={}) {
  const u=camel(raw), p=u.profile||u;
  return {...u,...p,id:u.id,name:[p.firstName,p.lastName].filter(Boolean).join(' ')||u.email||'Student',
    academicYear:Object.keys(years).find(k=>years[k]===p.academicYear)||'1',savingsGoal:p.monthlySavingsGoal};
}
export function payload(path, values={}) {
  const b=Object.fromEntries(Object.entries(values).map(([k,v])=>[snake(k),v]));
  if ('name' in values && (path.startsWith('/auth/')||path==='/profile')) {
    const [first,...last]=values.name.trim().split(/\s+/); b.first_name=first;b.last_name=last.join(' ');delete b.name;
  }
  if('academicYear' in values){if(values.academicYear)b.academic_year=years[values.academicYear]||values.academicYear;else delete b.academic_year;}
  if('savingsGoal' in values){b.monthly_savings_goal=values.savingsGoal;delete b.savings_goal;}
  if('body' in values){b.content=values.body;delete b.body;}
  if('published' in values){b.is_active=values.published;delete b.published;}
  if(path==='/admin/tips'&&'published' in values){b.status=values.published?'active':'inactive';delete b.is_active;}
  if(path==='/accounts'&&'openingBalance' in values){b.balance=values.openingBalance;delete b.opening_balance;}
  if(path==='/goals') {if('savedAmount' in values)b.current_amount=values.savedAmount;if('notes' in values)b.description=values.notes;delete b.saved_amount;delete b.notes;}
  if(path==='/bills'&&['paid','unpaid'].includes(values.status)){b.is_paid=values.status==='paid';delete b.status;}
  if(path==='/recurring-transactions'){if('enabled' in values)b.is_active=values.enabled;delete b.enabled;}
  if(typeof values.month==='string'&&/^\d{4}-\d{2}$/.test(values.month)){[b.year,b.month]=values.month.split('-').map(Number);}
  return b;
}
export function filters(params={}) {
  const aliases={read:'is_read',q:'search',categoryId:'category_id',accountId:'account_id',from:'start_date',to:'end_date',minAmount:'min_amount',maxAmount:'max_amount',incomeSource:'income_category_id'};
  const out=Object.fromEntries(Object.entries(params).map(([k,v])=>[aliases[k]||snake(k),v]));
  if(params.read!==undefined)out.is_read=params.read?1:0;
  if(params.sort){out.sort=params.sort.replace(/^-/,'');out.order=params.sort.startsWith('-')?'DESC':'ASC';}
  if(typeof params.month==='string'&&params.month.includes('-'))[out.year,out.month]=params.month.split('-').map(Number);
  return out;
}
const resources={transactions:['transactions','transaction'],categories:['categories','category'],accounts:['accounts','account'],
 'recurring-transactions':['recurring_transactions','recurring_transaction'],budgets:['budgets','budget'],goals:['goals','goal'],
 bills:['bills','bill'],notes:['notes','note'],notifications:['notifications','notification'],tips:['tips','tip'],insights:['insights','insight'],
 users:['users','user'],'default-categories':['categories','category'],announcements:['announcements','announcement'],'system-tips':['tips','tip']};
export function entity(path,raw) {
  if(!raw)return raw;
  const r=camel(raw),kind=path.split('/').pop();
  if(r.categoryName&&['transactions','recurring-transactions'].includes(kind))r.category={id:r.categoryId,name:r.categoryName};
  if(kind==='users')return {...person(raw),enabled:r.status==='active'};
  if(path==='/categories'&&r.isDefault&&!r.userId)r.readOnly=true;
  if(kind==='accounts')r.openingBalance=r.balance;
  if(kind==='budgets'){r.name=r.categoryName;r.month=`${r.year}-${String(r.month).padStart(2,'0')}`;}
  if(kind==='goals'){r.savedAmount=r.currentAmount;r.notes=r.description;}
  if(kind==='bills')r.status=r.isPaid?'paid':'unpaid';
  if(kind==='recurring-transactions'){r.enabled=!!r.isActive;r.nextDate=r.nextOccurrence;}
  if(kind==='notifications')r.read=!!r.isRead;
  if(r.content!==undefined)r.body=r.content;
  if(['tips','insights'].includes(kind)&&r.isBookmarked)r.bookmarkId=`${kind==='tips'?'tip':'insight'}:${r.id}`;
  if(path==='/admin/tips')r.published=r.status==='active';
  if(r.expiresAt)r.expiresAt=r.expiresAt.slice(0,10);
  if(r.isActive!==undefined)r.published=!!r.isActive;
  if(kind==='insights'){r.title=`Insight · ${r.year}-${String(r.month).padStart(2,'0')}`;r.createdAt=r.generatedAt||r.createdAt;r.body=[r.summary,r.tip].filter(Boolean).join('\n\n');}
  return r;
}
export function collection(path,data,params={}) {
  const key=resources[path.split('/').pop()]?.[0];
  const rows=Array.isArray(data)?data:data?.[key]||data?.items||[];
  let items=rows.map(r=>entity(path,r));

  if(!data?.pagination&&params.limit){const total=items.length;items=items.slice(((params.page||1)-1)*params.limit,(params.page||1)*params.limit);return {...camel(data),items,total};}
  return {...camel(data),items,total:data?.pagination?.totalItems??data?.total??items.length};
}
export function single(path,data){const key=resources[path.split('/').pop()]?.[1];return entity(path,data?.[key]??data);}
