import {request,resourceApi,queryString} from './apiClient';
export const adminApi={...resourceApi('/admin'),users:(params)=>request('/admin/users'+queryString(params)),stats:()=>request('/admin/statistics'),setEnabled:(id,enabled)=>request('/admin/users/'+encodeURIComponent(id),{method:'PATCH',body:{enabled}}),resetAccess:(id)=>request('/admin/users/'+encodeURIComponent(id)+'/reset-access',{method:'POST'}),resource:(name)=>resourceApi('/admin/'+name),};
export default adminApi;
