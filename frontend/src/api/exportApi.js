import {request,resourceApi,queryString} from './apiClient';
export const exportApi={...resourceApi('/exports'),download:(params)=>request('/exports'+queryString(params),{blob:true}),share:(body)=>request('/exports/share',{method:'POST',body}),};
export default exportApi;
