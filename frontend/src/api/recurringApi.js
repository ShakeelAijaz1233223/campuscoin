import {request,resourceApi,queryString} from './apiClient';
export const recurringApi={...resourceApi('/recurring-transactions'),};
export default recurringApi;
