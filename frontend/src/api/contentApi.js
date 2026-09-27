import {request} from './apiClient';
import {collection} from './contract';
export const contentApi={
 list:async(_,signal)=>collection('/announcements',await request('/content/announcements',{signal})),
 tips:async()=>collection('/tips',await request('/content/tips'))
};
export default contentApi;
