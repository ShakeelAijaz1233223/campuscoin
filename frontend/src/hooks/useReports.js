import useResource from './useResource';import reportApi from '../api/reportApi';export default function useReports(params={}){return useResource(reportApi,params);}
