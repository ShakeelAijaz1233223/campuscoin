import {request,resourceApi} from './apiClient';
import {payload,single} from './contract';
export const insightApi={...resourceApi('/insights'),generate:async body=>single('/insights',await request('/insights/generate',{method:'POST',body:payload('/insights',body)}))};
export default insightApi;
