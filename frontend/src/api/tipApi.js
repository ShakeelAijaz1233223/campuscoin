import {request,resourceApi} from './apiClient';
export const tipApi={...resourceApi('/tips'),dismiss:id=>request('/tips/dismiss',{method:'POST',body:{tip_id:id}})};
export default tipApi;
