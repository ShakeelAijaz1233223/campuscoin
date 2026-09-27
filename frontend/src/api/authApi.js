import {request} from './apiClient';
export const authApi={me:()=>request('/auth/me'),login:(body)=>request('/auth/login',{method:'POST',body}),register:(body)=>request('/auth/register',{method:'POST',body}),logout:()=>request('/auth/logout',{method:'POST'}),forgot:(body)=>request('/auth/forgot-password',{method:'POST',body}),reset:(token,body)=>request('/auth/reset-password/'+encodeURIComponent(token),{method:'POST',body})};
export default authApi;
