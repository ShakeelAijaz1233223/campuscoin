import useResource from './useResource';import categoryApi from '../api/categoryApi';export default function useCategories(params={}){return useResource(categoryApi,params);}
