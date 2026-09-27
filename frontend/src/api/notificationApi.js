import {request,resourceApi,queryString} from './apiClient';
export const notificationApi={...resourceApi('/notifications'),read:(id)=>request('/notifications/'+encodeURIComponent(id)+'/read',{method:'PATCH'}),readAll:()=>request('/notifications/read-all',{method:'PATCH'}),};
export default notificationApi;
