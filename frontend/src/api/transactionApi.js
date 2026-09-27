import {request,resourceApi,queryString} from './apiClient';
export const transactionApi={...resourceApi('/transactions'),suggest:async(body)=>{const d=await request('/ai/suggest',{method:'POST',body});return {categoryId:d.suggestion.category_id,categoryName:d.suggestion.category_name,confidence:d.suggestion.confidence};},};
export default transactionApi;
