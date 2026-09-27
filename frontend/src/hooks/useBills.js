import useResource from './useResource';import billApi from '../api/billApi';export default function useBills(params={}){return useResource(billApi,params);}
