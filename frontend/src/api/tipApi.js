import {request,resourceApi,queryString} from './apiClient';
export const tipApi={...resourceApi('/tips'),dismiss:(id)=>request('/tips/'+encodeURIComponent(id)+'/dismiss',{method:'POST'}),};
export default tipApi;
