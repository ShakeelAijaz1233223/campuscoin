import {request,queryString} from './apiClient';
import {reportParams} from './reportApi';
export const exportApi={download:({format='pdf',...params})=>request('/reports/range/export'+queryString({...reportParams(params),format}),{blob:true})};
export default exportApi;
