import {request,resourceApi,queryString} from './apiClient';
export const profileApi={...resourceApi('/profile'),save:(body)=>request('/profile',{method:'PATCH',body}),};
export default profileApi;
