import {request,resourceApi,queryString} from './apiClient';
export const transactionApi={...resourceApi('/transactions'),suggest:(body)=>request('/transactions/suggest-category',{method:'POST',body}),};
export default transactionApi;
