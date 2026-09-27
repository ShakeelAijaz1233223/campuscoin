import useResource from './useResource';import goalApi from '../api/goalApi';export default function useGoals(params={}){return useResource(goalApi,params);}
