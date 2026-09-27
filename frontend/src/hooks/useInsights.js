import useResource from './useResource';import insightApi from '../api/insightApi';export default function useInsights(params={}){return useResource(insightApi,params);}
