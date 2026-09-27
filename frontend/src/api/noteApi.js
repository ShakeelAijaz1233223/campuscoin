import {request,resourceApi,queryString} from './apiClient';
export const noteApi={...resourceApi('/notes'),};
export default noteApi;
