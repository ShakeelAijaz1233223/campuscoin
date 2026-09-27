import {request,resourceApi,queryString} from './apiClient';
export const settingsApi={...resourceApi('/settings'),save:(body)=>request('/settings',{method:'PATCH',body}),};
export default settingsApi;
