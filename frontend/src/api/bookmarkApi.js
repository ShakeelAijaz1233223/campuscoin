import {request,queryString} from './apiClient';
import {entity} from './contract';
const route=type=>type==='insight'?'insights':'tips';
export const bookmarkApi={
 list:async({type='tip',...params}={},signal)=>{const d=await request('/bookmarks/'+route(type)+queryString(params),{signal});return {items:d.bookmarks.map(b=>{
  const itemId=b[type+'_id'];return {id:`${type}:${itemId}`,type,item:entity('/'+route(type),b)};
 }),total:d.pagination?.totalItems??d.bookmarks.length};},
 create:({type,itemId})=>request(`/bookmarks/${route(type)}/${encodeURIComponent(itemId)}`,{method:'POST'}),
 remove:id=>{const [type,itemId]=String(id).split(':');return request(`/bookmarks/${route(type)}/${encodeURIComponent(itemId)}`,{method:'DELETE'});}
};
export default bookmarkApi;
