import useResource from './useResource';import budgetApi from '../api/budgetApi';export default function useBudgets(params={}){return useResource(budgetApi,params);}
