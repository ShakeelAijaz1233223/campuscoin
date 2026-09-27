import useResource from './useResource';import tipApi from '../api/tipApi';export default function useTips(params={}){return useResource(tipApi,params);}
