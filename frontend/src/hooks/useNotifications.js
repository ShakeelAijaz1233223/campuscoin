import useResource from './useResource';import notificationApi from '../api/notificationApi';export default function useNotifications(params={}){return useResource(notificationApi,params);}
