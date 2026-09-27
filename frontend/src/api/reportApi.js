import {request,queryString} from './apiClient';
import {filters} from './contract';
export function reportParams(params={}) {
 const f=filters(params);
 if(params.period==='six-month'&&params.to){const end=new Date(params.to+'T00:00:00Z');end.setUTCDate(1);end.setUTCMonth(end.getUTCMonth()-5);f.start_date=end.toISOString().slice(0,10);}
 delete f.period;return f;
}
export const reportApi={list:async(params={},signal)=>{
 const {report:r}=await request('/reports/range'+queryString(reportParams(params)),{signal});
 return {currency:r.currency,summary:{...r.totals,savings:r.totals.income-r.totals.expense},
 incomeExpense:r.monthly,categories:r.categories,daily:r.daily,weekly:r.weekly,exportFormats:['pdf','csv','json']};
}};
export default reportApi;
