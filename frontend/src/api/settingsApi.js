import {request} from './apiClient';
import {camel,payload} from './contract';
const normalize=d=>Object.fromEntries(Object.entries(camel(d.settings||d)).map(([k,v])=>[k,v==='true'?true:v==='false'?false:v]));
export const settingsApi={list:async(_,signal)=>normalize(await request('/settings',{signal})),save:async body=>normalize(await request('/settings',{method:'PATCH',body:payload('/settings',body)}))};
export default settingsApi;
