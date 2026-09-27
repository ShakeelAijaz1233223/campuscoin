import useResource from './useResource';import searchApi from '../api/searchApi';export default function useSearch(params={}){return useResource(searchApi,params);}
