import {request,resourceApi} from './apiClient';
export const adminApi={
 users:(params)=>resourceApi('/admin/users').list(params),
 stats:async()=>{const [d,c]=await Promise.all([request('/admin/dashboard'),request('/admin/statistics/categories')]);return {
  totalUsers:d.statistics.total_users,activeUsers:d.statistics.active_users,totalTransactions:d.statistics.total_transactions,
  activePeriod:'Accounts with active access',topCategories:c.categories.map(r=>({name:r.name,count:r.usage_count??r.transaction_count??r.count})),
  activity:d.signups_last_30_days.map(r=>({name:r.date,count:r.count}))};},
 setEnabled:(id,enabled)=>request(`/admin/users/${encodeURIComponent(id)}/status`,{method:'PATCH',body:{status:enabled?'active':'suspended'}}),
 resetAccess:id=>request(`/admin/users/${encodeURIComponent(id)}/reset-access`,{method:'POST'}),
 resource:name=>resourceApi('/admin/'+({categories:'default-categories'}[name]||name))
};
export default adminApi;
