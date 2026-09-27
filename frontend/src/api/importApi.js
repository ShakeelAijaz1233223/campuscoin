import {request,resourceApi,queryString} from './apiClient';
export const importApi={...resourceApi('/imports'),validate:(body)=>request('/imports/validate',{method:'POST',body}),confirm:(body)=>request('/imports/confirm',{method:'POST',body}),status:(id)=>request('/imports/'+encodeURIComponent(id)),};
export default importApi;
