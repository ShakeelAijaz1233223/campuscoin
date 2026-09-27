import {request,queryString} from './apiClient';
import {filters,camel} from './contract';
const get=(path,params,signal)=>request('/analytics/'+path+queryString(filters(params)),{signal}).then(camel);
export const analyticsApi={
 list:(params,signal)=>get('six-month-overview',params,signal),
 categorySpending:params=>get('category-spending',params),dailySpending:params=>get('daily-spending',params),
 weeklySpending:params=>get('weekly-spending',params),monthlySpending:params=>get('monthly-spending',params),
 trends:()=>get('trends'),budgetConsumption:params=>get('budget-consumption',params),savingsRate:params=>get('savings-rate',params)
};
export default analyticsApi;
