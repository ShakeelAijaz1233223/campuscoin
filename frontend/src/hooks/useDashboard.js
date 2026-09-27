import useResource from './useResource';import dashboardApi from '../api/dashboardApi';export default function useDashboard(params={}){return useResource(dashboardApi,params);}
