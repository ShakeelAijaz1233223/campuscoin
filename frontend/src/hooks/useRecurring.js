import useResource from './useResource';import recurringApi from '../api/recurringApi';export default function useRecurring(params={}){return useResource(recurringApi,params);}
