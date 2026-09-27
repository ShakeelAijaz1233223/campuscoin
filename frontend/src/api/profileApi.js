import {request} from './apiClient';
import {person,payload} from './contract';
export const profileApi={
 list:async(_,signal)=>{const d=await request('/profile',{signal});return person({...d.user,profile:d.profile});},
 save:async body=>{const d=await request('/profile',{method:'PATCH',body:payload('/profile',body)});return person(d.profile);}
};
export default profileApi;
