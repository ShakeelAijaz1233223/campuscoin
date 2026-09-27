import {request} from './apiClient';
import {person,payload} from './contract';
export const authApi={
 me:async()=>{const d=await request('/auth/me');return {user:person(d.user)};},
 login:async body=>{const d=await request('/auth/login',{method:'POST',body});return {...d,user:person(d.user)};},
 register:body=>request('/auth/register',{method:'POST',body:payload('/auth/register',body)}),
 logout:()=>request('/auth/logout',{method:'POST'}),
 forgot:body=>request('/auth/forgot-password',{method:'POST',body}),
 reset:(token,body)=>request('/auth/reset-password',{method:'POST',body:{...body,token}})
};
export default authApi;
