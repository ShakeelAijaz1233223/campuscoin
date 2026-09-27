import useResource from './useResource';import transactionApi from '../api/transactionApi';export default function useTransactions(params={}){return useResource(transactionApi,params);}
