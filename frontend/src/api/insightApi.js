import {request,resourceApi,queryString} from './apiClient';
export const insightApi={...resourceApi('/insights'),generate:(body)=>request('/insights/generate',{method:'POST',body}),};
export default insightApi;
