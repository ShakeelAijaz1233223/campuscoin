import {request,queryString} from './apiClient';
import {entity,filters} from './contract';
export const dashboardApi={list:async(params={},signal)=>{
 const d=await request('/dashboard'+queryString(filters(params)),{signal});
 return {currency:d.balance.currency,balance:d.balance.total,...d.month_summary,
  recentTransactions:d.recent_transactions.map(r=>entity('/transactions',r)),
  budgets:(d.budgets||[]).map(r=>entity('/budgets',r)),
  spendingTrend:d.spending_trend.map(r=>({name:r.date,amount:r.expense})),
  categories:(d.category_spending||[]).map(r=>({name:r.category_name,amount:Number(r.total),color:r.color})),
  monthlyOverview:d.monthly_overview||[],budgetActual:(d.budgets||[]).map(r=>({name:r.category_name,budget:Number(r.amount),actual:Number(r.spent)})),
  insight:entity('/insights',d.current_insight),tips:d.saving_tips.map((t,i)=>({...t,id:i,body:t.content})),
  alerts:d.budget_alerts.map(a=>({id:a.budget_id,type:a.type,severity:a.type==='exceeded'?'error':'warning',message:`${a.category}: ${a.percentage}% of budget used.`}))};
}};
export default dashboardApi;
